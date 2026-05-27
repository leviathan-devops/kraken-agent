#!/usr/bin/env python3
"""
container_pool.py v1.1 — Manage a pool of persistent OpenCode containers
with mechanical cleanup and plugin mounting.

Changes from v1.0:
- Fixed plugin mounting: skills/, .shark, .manta, .Spider, spider-agent, swarm-agent
- Added OpenCodeSession lifecycle tracking with guaranteed cleanup
- Pool-level __del__ and atexit handler
- Orphan container cleanup at startup
- cleanup_session() called before every container kill
"""

import argparse
import json
import subprocess
import time
import os
import sys
import tempfile
import shutil
import threading
import atexit
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from datetime import datetime
from contextlib import contextmanager

# ── Constants ─────────────────────────────────────────────────────────────────

IMAGE = "ghcr.io/anomalyco/opencode"
POOL_PREFIX = "hermes-oc-pool-"
CONFIG_PATH = Path.home() / ".config/opencode"
OPENCODE_WORKSPACE = Path.home() / "OPENCODE_WORKSPACE"
PORTS = list(range(18081, 18095))
WORKSPACE_BASE = Path(tempfile.mkdtemp(prefix="hermes-pool-ws-"))

# Plugin directories to mount
PLUGIN_MOUNTS = [
    ("skills", CONFIG_PATH / "skills", "/root/.config/opencode/skills"),
    (".shark", OPENCODE_WORKSPACE / ".shark", "/home/leviathan/OPENCODE_WORKSPACE/.shark"),
    (".manta", OPENCODE_WORKSPACE / ".manta", "/home/leviathan/OPENCODE_WORKSPACE/.manta"),
    (".Spider", OPENCODE_WORKSPACE / ".Spider", "/home/leviathan/OPENCODE_WORKSPACE/.Spider"),
    ("spider-agent", OPENCODE_WORKSPACE / "plugins" / "spider-agent",
     "/home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent"),
    ("swarm-agent", CONFIG_PATH / "plugins" / "swarm-agent",
     "/root/.config/opencode/plugins/swarm-agent"),
]

# ── Global Pool Registry ──────────────────────────────────────────────────────

_ACTIVE_POOLS: list["ContainerPool"] = []
_POOLS_LOCK = threading.Lock()

def _get_pools_lock():
    return _POOLS_LOCK

def _cleanup_all_pools() -> None:
    """Emergency cleanup of all active pools. Called at process exit."""
    with _get_pools_lock():
        pools = list(_ACTIVE_POOLS)
    for pool in pools:
        try:
            pool.cleanup()
        except Exception:
            pass

atexit.register(_cleanup_all_pools)

# ── Container Lifecycle ───────────────────────────────────────────────────────

def get_api_key(name: str) -> str | None:
    return os.environ.get(name)

def port_available(port: int) -> bool:
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.bind(('127.0.0.1', port))
        sock.close()
        return True
    except OSError:
        return False

def find_free_ports(n: int) -> list[int]:
    """Find n available ports."""
    free = []
    for port in PORTS:
        if port_available(port):
            free.append(port)
            if len(free) == n:
                break
    if len(free) < n:
        raise RuntimeError(f"Only {len(free)} free ports available, need {n}")
    return free

def cleanup_session(container_name: str, port: int = 0) -> None:
    """
    Terminate any active OpenCode session inside the container BEFORE killing.
    Prevents orphaned session state.
    """
    try:
        subprocess.run(
            ["docker", "exec", container_name,
             "opencode", "session", "terminate", "--all"],
            capture_output=True, text=True, timeout=5
        )
    except (subprocess.TimeoutExpired, Exception):
        pass

    try:
        subprocess.run(
            ["docker", "exec", container_name, "pkill", "-f", "opencode"],
            capture_output=True, text=True, timeout=5
        )
    except (subprocess.TimeoutExpired, Exception):
        pass

def docker_kill(name: str) -> None:
    """Kill container with session cleanup first."""
    cleanup_session(name, 0)
    subprocess.run(["docker", "kill", name], capture_output=True)
    time.sleep(0.5)

def docker_rm(name: str) -> None:
    subprocess.run(["docker", "rm", "-f", name], capture_output=True)

def container_health(port: int, timeout: int = 15) -> bool:
    import urllib.request
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(f"http://localhost:{port}/global/health", timeout=2) as r:
                if b"healthy" in r.read():
                    return True
        except:
            pass
        time.sleep(1)
    return False

def cleanup_orphan_containers() -> int:
    """Clean up orphaned hermes-oc-* containers from previous runs."""
    killed = 0
    result = subprocess.run(
        ["docker", "ps", "-a", "--format", "{{.Names}}"],
        capture_output=True, text=True
    )
    for name in result.stdout.strip().split("\n"):
        if name.startswith("hermes-oc-"):
            print(f"Cleaning up orphan: {name}", file=sys.stderr)
            docker_kill(name)
            killed += 1
    return killed

def _build_docker_cmd(name: str, port: int, workspace: Path) -> list:
    """Build docker run command with plugin mounts."""
    cmd = [
        "docker", "run", "-d", "--rm",
        "--name", name,
        "-p", f"{port}:8080",
        "-v", f"{CONFIG_PATH}:/root/.config/opencode:ro",
        "-v", f"{OPENCODE_WORKSPACE}:/home/leviathan/OPENCODE_WORKSPACE:ro",
    ]

    for src_name, src_path, dst_path in PLUGIN_MOUNTS:
        if src_path.exists():
            cmd += ["-v", f"{src_path}:{dst_path}:ro"]

    cmd += ["-v", f"{workspace}:/workspace:rw"]

    for key in ["MINIMAX_API_KEY", "DEEPSEEK_API_KEY", "GOOGLE_API_KEY",
                "OPENAI_API_KEY", "GLM_API_KEY", "ZHIPU_API_KEY",
                "SHARK_GEMINI_PROXY", "OPENCODE_API_KEY"]:
        val = get_api_key(key)
        if val:
            cmd += ["-e", f"{key}={val}"]

    cmd += [IMAGE, "serve", "--port", "8080", "--hostname", "0.0.0.0"]
    return cmd

def start_container(name: str, port: int, workspace: Path) -> bool:
    """Start an opencode container. Returns True if healthy."""
    # Kill any existing container with this name first
    docker_kill(name)
    time.sleep(0.5)

    cmd = _build_docker_cmd(name, port, workspace)
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"ERROR starting {name}: {r.stderr[:200]}", file=sys.stderr)
        return False

    return container_health(port)

def list_pool_containers() -> list[dict]:
    """List all hermes-oc-pool-* containers."""
    r = subprocess.run(
        ["docker", "ps", "-a", "--format", "{{.Names}}|{{.Ports}}|{{.Status}}"],
        capture_output=True, text=True
    )
    containers = []
    for line in r.stdout.strip().split("\n"):
        if not line:
            continue
        parts = line.split("|")
        name = parts[0]
        if name.startswith(POOL_PREFIX):
            port_str = parts[1] if len(parts) > 1 else ""
            port = int(port_str.split("->")[0].split(":")[-1]) if "->" in port_str else 0
            status = parts[2] if len(parts) > 2 else ""
            containers.append({"name": name, "port": port, "status": status})
    return containers

def kill_all_pool_containers() -> int:
    """Kill all pool containers with session cleanup."""
    killed = 0
    for c in list_pool_containers():
        docker_kill(c["name"])
        killed += 1
    return killed

# ── JSON Parser ────────────────────────────────────────────────────────────────

def parse_run_json(stdout: str) -> dict:
    """Parse opencode run --format json output."""
    text_parts = []
    tokens = 0
    cost = 0.0
    reason = ""
    session_id = ""

    for line in stdout.strip().split("\n"):
        line = line.strip()
        if not line:
            continue
        try:
            d = json.loads(line)
        except json.JSONDecodeError:
            continue

        t = d.get("type", "")

        if t == "session":
            session_id = d.get("sessionID", "")

        elif t == "text":
            txt = d.get("part", {}).get("text", "")
            if txt.strip():
                text_parts.append(txt.strip())

        elif t == "step_finish":
            p = d.get("part", {})
            reason = p.get("reason", reason)
            tk = p.get("tokens", {})
            if isinstance(tk, dict):
                tokens = tk.get("total", tokens)
                cost = tk.get("cost", cost)

    return {
        "success": reason == "stop" or bool(text_parts),
        "text": "\n".join(text_parts),
        "session_id": session_id,
        "tokens": tokens,
        "cost": cost,
        "reason": reason,
    }

def run_single_task(
    container_name: str,
    port: int,
    task: str,
    model: str,
    timeout: int,
) -> dict:
    """Run a task in an existing container. Returns result dict."""
    cmd = [
        "docker", "exec", container_name,
        "opencode", "run", "--format", "json",
        task,
        "--model", model,
    ]

    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        if r.returncode != 0 and not r.stdout:
            return {
                "success": False,
                "text": "",
                "error": f"Exit {r.returncode}: {r.stderr[:300]}",
                "tokens": 0,
                "cost": 0.0,
            }
        result = parse_run_json(r.stdout)
        result["container"] = container_name
        result["port"] = port
        return result
    except subprocess.TimeoutExpired:
        # Clean up orphaned session on timeout
        cleanup_session(container_name, port)
        return {
            "success": False,
            "text": "",
            "error": f"Timeout after {timeout}s",
            "tokens": 0,
            "cost": 0.0,
        }

# ── ContainerPool ──────────────────────────────────────────────────────────────

class ContainerPool:
    """
    A pool of persistent OpenCode containers for parallel task execution.

    Usage:
        with ContainerPool(size=4) as pool:
            results = pool.run_all([...])
        # Containers automatically cleaned up

    Or without context manager:
        pool = ContainerPool(size=4)
        pool.start()
        # ... use pool ...
        pool.cleanup()
    """

    def __init__(self, size: int = 2, workspace_base: Path | None = None):
        self.size = size
        self.workspace_base = workspace_base or WORKSPACE_BASE
        self.containers: list[dict] = []
        self._started = False
        self._closed = False
        self._locks: list[threading.Lock] = []

        # Register for atexit cleanup
        self._register()

    def _register(self) -> None:
        with _get_pools_lock():
            _ACTIVE_POOLS.append(self)

    def start(self) -> "ContainerPool":
        """Start all containers in the pool. Only healthy containers are added."""
        if self._started:
            return self

        # Clean up orphans first
        cleanup_orphan_containers()

        ports = find_free_ports(self.size)
        started = 0

        for i in range(self.size):
            name = f"{POOL_PREFIX}{i}"
            ws = self.workspace_base / f"ws_{i}"
            ws.mkdir(parents=True, exist_ok=True)
            port = ports[i]
            healthy = start_container(name, port, ws)
            if healthy:
                self.containers.append({
                    "name": name,
                    "port": port,
                    "workspace": ws,
                    "healthy": True,
                    "busy": False,
                })
                self._locks.append(threading.Lock())
                started += 1
                print(f"Started {name} on port {port} (healthy)", file=sys.stderr)
            else:
                print(f"WARNING: {name} failed health check, skipping", file=sys.stderr)

        if not self.containers:
            raise RuntimeError("No containers started healthy")

        self._started = True
        print(f"Pool: {started}/{self.size} containers healthy", file=sys.stderr)
        return self

    def run_all(self, tasks: list[dict], timeout: int = 180) -> list[dict]:
        """
        Run multiple tasks in parallel across the pool.
        Each task dict: {"task": str, "model": str, "timeout": int}
        Returns list of result dicts in same order as tasks.

        Tasks are processed in waves — one task per container per wave —
        to avoid docker exec contention inside containers.

        Default timeout is 180s (3 min) since concurrent API calls may
        take longer under load.
        """
        if not self._started:
            self.start()

        healthy = [c for c in self.containers if c["healthy"]]
        if not healthy:
            raise RuntimeError("No healthy containers in pool")

        pool_size = len(healthy)
        results = [None] * len(tasks)

        # Process in waves: wave 0 gets tasks 0..pool_size-1, etc.
        for wave_idx in range(0, len(tasks), pool_size):
            wave_tasks = tasks[wave_idx:wave_idx + pool_size]
            if not wave_tasks:
                break

            def run_single(j, t):
                container = healthy[j % pool_size]
                task_timeout = t.get("timeout", timeout)
                try:
                    result = run_single_task(
                        container_name=container["name"],
                        port=container["port"],
                        task=t["task"],
                        model=t.get("model", "minimax/MiniMax-M2.7"),
                        timeout=task_timeout,
                    )
                except Exception as e:
                    result = {
                        "success": False,
                        "text": "",
                        "error": str(e),
                        "tokens": 0,
                        "cost": 0.0,
                    }
                result["container"] = container["name"]
                result["port"] = container["port"]
                return wave_idx + j, result

            with ThreadPoolExecutor(max_workers=len(wave_tasks)) as ex:
                futures = {ex.submit(run_single, j, t): (wave_idx + j)
                           for j, t in enumerate(wave_tasks)}
                for future in as_completed(futures):
                    idx, result = future.result()
                    results[idx] = result

        return results

    def list(self) -> list[dict]:
        return list(self.containers)

    def kill_all(self) -> None:
        """Kill all containers with session cleanup first."""
        for c in self.containers:
            cleanup_session(c["name"], c["port"])
            docker_kill(c["name"])
        self.containers.clear()
        self._started = False

    def cleanup(self) -> None:
        """Kill all containers and remove workspaces."""
        if self._closed:
            return
        self._closed = True

        self.kill_all()

        try:
            shutil.rmtree(self.workspace_base, ignore_errors=True)
        except Exception:
            pass

        # Unregister from atexit
        with _get_pools_lock():
            if self in _ACTIVE_POOLS:
                _ACTIVE_POOLS.remove(self)

    def __enter__(self) -> "ContainerPool":
        return self.start()

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.cleanup()

    def __del__(self) -> None:
        """Safety net: ensure cleanup even if context manager not used."""
        try:
            self.cleanup()
        except Exception:
            pass

    def __repr__(self) -> str:
        n = len(self.containers)
        return f"ContainerPool(size={self.size}, active={n}, closed={self._closed})"


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="OpenCode Container Pool Manager")
    parser.add_argument("--create", "-c", type=int, metavar="N",
                        help="Start N containers in the pool")
    parser.add_argument("--list", "-l", action="store_true",
                        help="List running pool containers")
    parser.add_argument("--kill-all", action="store_true",
                        help="Kill all pool containers")
    parser.add_argument("--pool-size", type=int, default=3,
                        help="Pool size for --create (default: 3)")
    args = parser.parse_args()

    if args.kill_all:
        n = kill_all_pool_containers()
        print(f"Killed {n} container(s)")
        return

    if args.list:
        for c in list_pool_containers():
            print(f"{c['name']} | port={c['port']} | {c['status']}")
        return

    if args.create:
        with ContainerPool(size=args.create) as pool:
            print(f"Pool of {args.create} containers started")
            for c in pool.containers:
                print(f"  {c['name']} on port {c['port']} (healthy={c['healthy']})")
            # Keep alive for inspection
            input("Press Enter to kill pool...")
        return

    parser.print_help()


if __name__ == "__main__":
    main()