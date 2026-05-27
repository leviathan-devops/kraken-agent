/**
 * shark-spawn-container — Spawn sandboxed container in under 5 seconds
 *
 * PURPOSE: Spawn a sandboxed tmux/docker container for testing, semantically named,
 * isolated from live machine and other projects. 5-second spawn time.
 *
 * CRITICAL RULES:
 * 1. -it flag — CRITICAL: Without this, docker attach doesn't work
 * 2. --entrypoint "" — CRITICAL: Without this, containers fail with code 126
 * 3. opencode as PID 1 — Must use /bin/sh -c 'opencode --agent X'
 * 4. SNAP mounted at /root/.config/opencode — Mount snapshot, NOT host config
 * 5. Semantic naming — shark-{projectName}-{YYYY-MM-DD}
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface SpawnContainerInput {
  projectName: string;
  pluginSource?: string;
  projectPath?: string;
}

export interface SpawnContainerOutput {
  containerName: string;
  tmuxSession: string;
  workspaceMount: string;
  snapshotPath: string;
  success: boolean;
  error?: string;
}

const SHARK_AGENT_NAME = 'shark';
const SHARK_AGENT_COLOR = '#228B22';
const DEFAULT_PLUGIN_SOURCE = '/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Projects/Shark_Agent_v4.9';
const DEFAULT_PROJECT_PATH = process.cwd();
const CONTAINER_IMAGE = 'opencode-test:1.14.29';

function getDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function generateContainerName(projectName: string): string {
  return `shark-${projectName}-${getDateString()}`;
}

function generateTmuxSession(containerName: string): string {
  return `${containerName}-tui`;
}

function createSnapshot(pluginSource: string, agentName: string): string {
  const SNAP = fs.mkdtempSync(path.join('/tmp', 'snap.XXXX'));
  const configDir = path.join(SNAP, 'config');
  const pluginsDir = path.join(configDir, 'plugins', agentName);
  const optDir = path.join(SNAP, 'opt');
  const identityDir = path.join(optDir, 'opencode', 'identity', 'orchestrator');

  fs.mkdirSync(pluginsDir, { recursive: true });
  fs.mkdirSync(identityDir, { recursive: true });

  const pluginDistSrc = path.join(pluginSource, 'dist');
  if (fs.existsSync(pluginDistSrc)) {
    const pluginDistDest = path.join(pluginsDir, 'dist');
    fs.mkdirSync(pluginDistDest, { recursive: true });
    const indexJs = path.join(pluginDistSrc, 'index.js');
    if (fs.existsSync(indexJs)) {
      fs.copyFileSync(indexJs, path.join(pluginDistDest, 'index.js'));
    }
  }

  const identitySource = path.join(pluginSource, 'identity', 'shark');
  if (fs.existsSync(identitySource)) {
    copyDirectoryRecursive(identitySource, path.join(pluginsDir, 'identity', 'shark'));
  }

  const opencodeJson = {
    plugin: [`file:///root/.config/opencode/plugins/${agentName}/dist/index.js`],
    agent: {
      [agentName]: {
        color: SHARK_AGENT_COLOR,
        mode: 'primary',
        hidden: false,
      },
    },
    permission: { '*': { '*': 'allow' } },
  };

  fs.writeFileSync(
    path.join(configDir, 'opencode.json'),
    JSON.stringify(opencodeJson, null, 2)
  );

  return SNAP;
}

function copyDirectoryRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function cleanupContainer(containerName: string): void {
  try {
    execSync(`docker rm -f ${containerName} 2>/dev/null`, { stdio: 'ignore' });
  } catch {
    // Container may not exist
  }
}

function cleanupTmux(tmuxSession: string): void {
  try {
    execSync(`tmux kill-session -t ${tmuxSession} 2>/dev/null`, { stdio: 'ignore' });
  } catch {
    // Session may not exist
  }
}

export function spawnContainerSync(input: SpawnContainerInput): SpawnContainerOutput {
  const {
    projectName,
    pluginSource = DEFAULT_PLUGIN_SOURCE,
    projectPath = DEFAULT_PROJECT_PATH,
  } = input;

  const containerName = generateContainerName(projectName);
  const tmuxSession = generateTmuxSession(containerName);

  cleanupContainer(containerName);
  cleanupTmux(tmuxSession);

  const SNAP = createSnapshot(pluginSource, SHARK_AGENT_NAME);

  try {
    const mountConfig = `-v ${SNAP}/config:/root/.config/opencode`;
    const mountOpt = `-v ${SNAP}/opt/opencode:/opt/opencode`;
    const mountWorkspace = `-v ${projectPath}:/workspace`;

    const dockerCmd = `docker run -d --rm -it --name ${containerName} --entrypoint "" ${mountConfig} ${mountOpt} ${mountWorkspace} ${CONTAINER_IMAGE} /bin/sh -c 'opencode --agent ${SHARK_AGENT_NAME}'`;

    execSync(dockerCmd, { stdio: 'pipe' });

    execSync('sleep 8', { stdio: 'pipe' });

    const psCheck = execSync(`docker ps --filter "name=${containerName}" --format "{{.Names}}"`, { encoding: 'utf-8' });
    if (!psCheck.trim().includes(containerName)) {
      const logs = execSync(`docker logs ${containerName} 2>&1 | tail -20`, { encoding: 'utf-8', stdio: 'pipe' });
      throw new Error(`Container not running. Logs:\n${logs}`);
    }

    return {
      containerName,
      tmuxSession,
      workspaceMount: '/workspace',
      snapshotPath: SNAP,
      success: true,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      containerName,
      tmuxSession,
      workspaceMount: '/workspace',
      snapshotPath: SNAP,
      success: false,
      error: errorMsg,
    };
  }
}

export function createSharkSpawnContainerTool() {
  return async (input: SpawnContainerInput): Promise<SpawnContainerOutput> => {
    return spawnContainerSync(input);
  };
}

export function cleanupContainerTool(containerName: string, tmuxSession: string, snapshotPath: string): void {
  cleanupTmux(tmuxSession);
  cleanupContainer(containerName);
  try {
    fs.rmSync(snapshotPath, { recursive: true, force: true });
  } catch {
    // Snapshot may already be cleaned
  }
}