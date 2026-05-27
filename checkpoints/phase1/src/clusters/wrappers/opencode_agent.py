#!/usr/bin/env python3
"""
opencode_agent.py v1.1 — Spawn OpenCode containers as sub-agents
with mechanical cleanup and plugin mounting.

Changes from v1.0:
- Fixed plugin mounting: skills/, .shark, .manta, .Spider, spider-agent, swarm-agent
- Added OpenCodeSession class with context manager and __del__ safety net
- Added cleanup_session() to terminate OpenCode sessions before container destroy
- Guaranteed cleanup via atexit handler
- Per-container PID tracking for orphan detection
"""

import argparse
import json
import subprocess
import time
import os
import sys
import re
import tempfile
import atexit
import signal
import weakref
from pathlib import Path
from datetime import datetime
from contextlib import contextmanager

# ── Constants ─────────────────────────────────────────────────────────────────

CONTAINER_NAME_PREFIX = "hermes-oc-agent-"
IMAGE = "ghcr.io/anomalyco/opencode"
DEFAULT_PORT = 18081
CONFIG_PATH = Path.home() / ".config/opencode"
OPENCODE_WORKSPACE = Path.home() / "OPENCODE_WORKSPACE"
PORTS = list(range(18081, 18095))  # Port pool

# Plugin directories to mount (relative to OPENCODE_WORKSPACE and CONFIG_PATH)
PLUGIN_MOUNTS = [
    # Skills (shark-agent etc.)
    ("skills", CONFIG_PATH / "skills", "/root/.config/opencode/skills"),
    # Shark agent state
    (".shark", OPENCODE_WORKSPACE / ".shark", "/home/leviathan/OPENCODE_WORKSPACE/.shark"),
    # Manta agent state
    (".manta", OPENCODE_WORKSPACE / ".manta", "/home/leviathan/OPENCODE_WORKSPACE/.manta"),
    # Spider agent state
    (".Spider", OPENCODE_WORKSPACE / ".Spider", "/home/leviathan/OPENCODE_WORKSPACE/.Spider"),
    # Spider agent plugin source
    ("spider-agent", OPENCODE_WORKSPACE / "plugins" / "spider-agent",
     "/home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent"),
    # Swarm agent plugin
    ("swarm-agent", CONFIG_PATH / "plugins" / "swarm-agent",
     "/root/.config/opencode/plugins/swarm-agent"),
    # Hive mind plugin
    ("hive-mind-plugin", CONFIG_PATH / "plugins", "/root/.config/opencode/plugins"),
]

# ── Registry for Cleanup ────────────────────────────────────────────────────────

# Global registry of active sessions for atexit safety
_ACTIVE_SESSIONS: dict[str, "OpenCodeSession"] = {}
_SESSION_LOCK = None  # Lazily initialized

def _get_session_lock():
    global _SESSION_LOCK
    if _SESSION_LOCK is None:
        import threading
        _SESSION_LOCK = threading.Lock()
    return _SESSION_LOCK

# ── Container Management ───────────────────────────────────────────────────────

def get_api_key(name: str) -> str | None:
    """Get API key from environment variable."""
    return os.environ.get(name)

def find_free_port() -> int:
    """Find an available port from the pool."""
    import socket
    for port in PORTS:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            sock.bind(('127.0.0.1', port))
            sock.close()
            return port
        except OSError:
            continue
    raise RuntimeError(f"No free ports in {PORTS}")

def container_exists(name: str) -> bool:
    result = subprocess.run(
        ["docker", "ps", "-a", "-q", "-f", f"name={name}"],
        capture_output=True, text=True
    )
    return bool(result.stdout.strip())

def docker_kill(name: str) -> None:
    """Kill container, ignore errors if already gone."""
    subprocess.run(["docker", "kill", name], capture_output=True)
    time.sleep(0.5)

def cleanup_session(container_name: str, port: int) -> None:
    """
    Terminate any active OpenCode session inside the container BEFORE killing.
    This prevents orphaned session state and ensures clean container shutdown.
    """
    try:
        # Try graceful session termination via opencode cli
        subprocess.run(
            ["docker", "exec", container_name,
             "opencode", "session", "terminate", "--all"],
            capture_output=True, text=True, timeout=5
        )
    except (subprocess.TimeoutExpired, Exception):
        pass

    try:
        # Also kill any lingering processes inside the container
        subprocess.run(
            ["docker", "exec", container_name, "pkill", "-f", "opencode"],
            capture_output=True, text=True, timeout=5
        )
    except (subprocess.TimeoutExpired, Exception):
        pass

def _build_docker_cmd(name: str, port: int, workspace: str | None) -> list:
    """Build the docker run command with all mounts."""
    cmd = [
        "docker", "run", "-d", "--rm",
        "--name", name,
        "-p", f"{port}:8080",
        # Config (opencode.json, skills, plugins)
        "-v", f"{CONFIG_PATH}:/root/.config/opencode:ro",
        # OpenCode workspace (plugins, agent state)
        "-v", f"{OPENCODE_WORKSPACE}:/home/leviathan/OPENCODE_WORKSPACE:ro",
    ]

    # Explicit plugin mounts
    for src_name, src_path, dst_path in PLUGIN_MOUNTS:
        if src_path.exists():
            cmd += ["-v", f"{src_path}:{dst_path}:ro"]

    # Workspace directory
    if workspace:
        cmd += ["-v", f"{os.path.abspath(workspace)}:/workspace:rw"]
    else:
        tmp_dir = tempfile.mkdtemp(prefix="hermes-oc-")
        cmd += ["-v", f"{tmp_dir}:/workspace:rw"]

    # API keys
    for key in ["MINIMAX_API_KEY", "DEEPSEEK_API_KEY", "GOOGLE_API_KEY",
                "OPENAI_API_KEY", "GLM_API_KEY", "ZHIPU_API_KEY",
                "SHARK_GEMINI_PROXY", "OPENCODE_API_KEY"]:
        val = get_api_key(key)
        if val:
            cmd += ["-e", f"{key}={val}"]

    cmd += [IMAGE, "serve", "--port", "8080", "--hostname", "0.0.0.0"]
    return cmd

def ensure_container(name: str, port: int, workspace: str | None = None) -> str:
    """Start an opencode container if it doesn't exist. Returns container name."""
    if container_exists(name):
        return name

    cmd = _build_docker_cmd(name, port, workspace)
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"Failed to start container: {result.stderr}")

    # Wait for health
    for _ in range(15):
        time.sleep(1)
        try:
            import urllib.request
            with urllib.request.urlopen(f"http://localhost:{port}/global/health", timeout=2) as r:
                if b"healthy" in r.read():
                    return name
        except:
            continue

    # Health check failed — kill container and raise
    docker_kill(name)
    raise RuntimeError(f"Container {name} failed to become healthy")

def wait_healthy(port: int, timeout: int = 15) -> bool:
    """Wait for container health check."""
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
    """
    Scan for and clean up any orphaned hermes-oc-* containers from previous runs.
    Call this at startup to ensure a clean slate.
    Returns count of orphaned containers killed.
    """
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

# ── JSON Stream Parser ─────────────────────────────────────────────────────────

def parse_run_output(stdout: str) -> dict:
    """Parse opencode run --format json output into structured result."""
    text_parts = []
    tokens = 0
    cost = 0.0
    reason = ""
    session_id = ""
    error = None

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
        "error": error
    }

# ── OpenCodeSession — Context Manager with Guaranteed Cleanup ──────────────────

class OpenCodeSession:
    """
    Managed OpenCode container session with guaranteed cleanup.

    Usage:
        with OpenCodeSession(workspace="/path/to/project") as session:
            result = session.run_task("Fix the bug")
            print(result["text"])

    Or without context manager:
        session = OpenCodeSession()
        session.start()
        # ... use session ...
        session.stop()  # explicit stop required

    Cleanup is guaranteed via:
    1. Context manager __exit__ → stop()
    2. __del__ fallback → stop() even on exceptions
    3. atexit handler → insurance against crashes
    """

    def __init__(
        self,
        workspace: str | None = None,
        model: str = "minimax/MiniMax-M2.7",
        container_name: str | None = None,
        auto_cleanup: bool = True,  # If True, destroy container after stop()
    ):
        self.workspace = workspace
        self.model = model
        self.auto_cleanup = auto_cleanup
        self.container_name = container_name or f"{CONTAINER_NAME_PREFIX}{os.getpid()}_{id(self)}"
        self.port = None
        self._started = False
        self._closed = False
        self._pid = os.getpid()

        # Register with atexit handler
        self._register()

    def _register(self) -> None:
        """Register this session for atexit cleanup."""
        lock = _get_session_lock()
        with lock:
            _ACTIVE_SESSIONS[self.container_name] = self

    def start(self) -> "OpenCodeSession":
        """Start the container. Returns self for chaining."""
        if self._started:
            return self

        # Clean up any orphan with same name first
        cleanup_orphan_containers()

        self.port = find_free_port()
        ensure_container(self.container_name, self.port, workspace=self.workspace)
        wait_healthy(self.port)
        self._started = True
        return self

    def run_task(self, task: str, timeout: int = 60) -> dict:
        """Run a task in the container. Auto-starts if not started."""
        if not self._started:
            self.start()

        cmd = [
            "docker", "exec", self.container_name,
            "opencode", "run", "--format", "json",
            task,
            "--model", self.model,
        ]

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
            )

            stdout = result.stdout
            stderr = result.stderr

            if result.returncode != 0 and not stdout:
                return {
                    "success": False,
                    "text": "",
                    "error": f"Exit {result.returncode}: {stderr[:500]}",
                    "tokens": 0,
                    "cost": 0.0,
                    "container": self.container_name,
                    "port": self.port,
                }

            parsed = parse_run_output(stdout)
            parsed["container"] = self.container_name
            parsed["port"] = self.port
            return parsed

        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "text": "",
                "error": f"Timeout after {timeout}s",
                "tokens": 0,
                "cost": 0.0,
                "container": self.container_name,
                "port": self.port,
            }
        except Exception as e:
            return {
                "success": False,
                "text": "",
                "error": str(e),
                "tokens": 0,
                "cost": 0.0,
                "container": self.container_name,
                "port": self.port,
            }

    def stop(self) -> None:
        """
        Stop the container with guaranteed session cleanup.
        Safe to call multiple times.
        """
        if self._closed:
            return

        self._closed = True

        try:
            # Terminate OpenCode session first
            cleanup_session(self.container_name, self.port or 0)
        except Exception:
            pass

        try:
            # Kill container
            docker_kill(self.container_name)
        except Exception:
            pass

        # Unregister from atexit
        lock = _get_session_lock()
        with lock:
            _ACTIVE_SESSIONS.pop(self.container_name, None)

    def __enter__(self) -> "OpenCodeSession":
        return self.start()

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        if self.auto_cleanup:
            self.stop()

    def __del__(self) -> None:
        """Safety net: ensure cleanup even if __exit__ never called."""
        try:
            self.stop()
        except Exception:
            pass

    def __repr__(self) -> str:
        status = "running" if self._started and not self._closed else "stopped"
        return f"OpenCodeSession(name={self.container_name}, port={self.port}, status={status})"


# ── Module-Level AtExit Handler ───────────────────────────────────────────────

def _cleanup_all_sessions() -> None:
    """Emergency cleanup of all active sessions. Called at process exit."""
    lock = _get_session_lock()
    with lock:
        sessions = list(_ACTIVE_SESSIONS.values())

    for session in sessions:
        try:
            session.stop()
        except Exception:
            pass

    # Also clean up any orphan containers
    try:
        cleanup_orphan_containers()
    except Exception:
        pass

atexit.register(_cleanup_all_sessions)


# ── Legacy API (backwards compatible) ─────────────────────────────────────────

def run_task(
    task: str,
    model: str = "minimax/MiniMax-M2.7",
    timeout: int = 60,
    container_name: str | None = None,
    port: int | None = None,
    workspace: str | None = None,
) -> dict:
    """
    Spawn an opencode container and run a task.
    Returns structured result dict.

    NOTE: For new code, prefer OpenCodeSession context manager.
    This function is kept for backwards compatibility.
    """
    if container_name is None:
        container_name = f"{CONTAINER_NAME_PREFIX}{os.getpid()}"

    tmp = None
    try:
        if port is None:
            port = find_free_port()

        ensure_container(container_name, port, workspace=workspace)
        wait_healthy(port)

        cmd = [
            "docker", "exec", container_name,
            "opencode", "run", "--format", "json",
            task,
            "--model", model,
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
        )

        stdout = result.stdout
        stderr = result.stderr

        if result.returncode != 0 and not stdout:
            return {
                "success": False,
                "text": "",
                "error": f"Exit {result.returncode}: {stderr[:500]}",
                "tokens": 0,
                "cost": 0.0,
            }

        parsed = parse_run_output(stdout)
        parsed["container"] = container_name
        parsed["port"] = port
        return parsed

    except subprocess.TimeoutExpired:
        # Try to cleanup session on timeout
        try:
            cleanup_session(container_name, port or 0)
        except Exception:
            pass
        return {
            "success": False,
            "text": "",
            "error": f"Timeout after {timeout}s",
            "tokens": 0,
            "cost": 0.0,
        }
    except Exception as e:
        return {
            "success": False,
            "text": "",
            "error": str(e),
            "tokens": 0,
            "cost": 0.0,
        }

def cleanup_container(container_name: str) -> None:
    """Kill a container by name."""
    cleanup_session(container_name, 0)
    docker_kill(container_name)


# ── CLI Entry Point ────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="OpenCode container sub-agent")
    parser.add_argument("--task", "-t", required=True, help="Task prompt")
    parser.add_argument("--model", "-m", default="minimax/MiniMax-M2.7",
                        help="Model (provider/name), default: minimax/MiniMax-M2.7")
    parser.add_argument("--timeout", type=int, default=60,
                        help="Timeout in seconds, default: 60")
    parser.add_argument("--container", help="Reuse existing container name")
    parser.add_argument("--port", type=int, help="Port for existing container")
    parser.add_argument("--cleanup", action="store_true",
                        help="Kill container after task")
    parser.add_argument("--json-only", action="store_true",
                        help="Only output the text response, as raw text")
    parser.add_argument("--workspace", "-w",
                        help="Workspace directory to mount at /workspace in container")
    args = parser.parse_args()

    result = run_task(
        task=args.task,
        model=args.model,
        timeout=args.timeout,
        container_name=args.container,
        port=args.port,
        workspace=args.workspace,
    )

    if args.cleanup and args.container:
        cleanup_container(args.container)

    if args.json_only:
        print(result["text"])
    else:
        print(json.dumps(result, indent=2))

    sys.exit(0 if result["success"] else 1)

if __name__ == "__main__":
    main()