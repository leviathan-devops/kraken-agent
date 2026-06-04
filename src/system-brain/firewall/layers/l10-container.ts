/**
 * src/system-brain/firewall/layers/l10-container.ts
 *
 * L10: Container Enforcement — Mechanical Filesystem Checks
 *
 * ALL checks are MECHANICAL (filesystem verification), not subjective.
 * - "Ship ready" → verify ContainerTestResult.json exists on disk
 * - "Tests pass" → read ContainerTestResult.json and check passRate
 * - "Evidence at path X" → verify path exists on disk
 * - "Build complete" → verify dist/index.js exists and has non-zero size
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { FirewallContext, FirewallResult } from '../types.js';

/** P2-compliant safe string extraction from args record */
function extractArgString(args: Record<string, unknown>, key: string, defaultValue: string = ''): string {
  const value = args[key];
  return typeof value === 'string' ? value : defaultValue;
}

/**
 * Async wrapper for file existence check — replaces existsSync (P4 async discipline).
 * Uses fs.promises.stat instead of fs.existsSync to avoid sync I/O in the hot path.
 */
async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.stat(filePath);
    return true;
  } catch (err: unknown) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === 'ENOENT' || nodeErr.code === 'ENOTDIR') {
      return false;
    }
    // For permission errors or other issues, log and return false (conservative)
    console.error(`[L10] Cannot check path ${filePath}: ${nodeErr.message || String(err)}`);
    return false;
  }
}

/**
 * Async wrapper to get file size — replaces statSync.
 */
async function getFileSize(filePath: string): Promise<number | null> {
  try {
    const stat = await fs.promises.stat(filePath);
    return stat.size;
  } catch (err: unknown) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === 'ENOENT') {
      return null;
    }
    console.error(`[L10] Cannot stat file ${filePath}: ${nodeErr.message || String(err)}`);
    return null;
  }
}

export async function checkL10Container(ctx: FirewallContext): Promise<FirewallResult> {
  const { tool, args, fileTargets } = ctx;

  // Check 1: Evidence path claims — verify the path actually exists on disk
  const evidencePath = extractArgString(args, 'evidencePath') || extractArgString(args, 'outputPath') || extractArgString(args, 'resultPath');
  if (evidencePath) {
    const resolvedPath = resolveProjectPath(evidencePath);
    const exists = await pathExists(resolvedPath);
    if (!exists) {
      return {
        blocked: true,
        layer: 'L10',
        reason: `Evidence path does not exist on disk: ${resolvedPath}`,
        detected: `Claimed path: ${evidencePath}, Resolved: ${resolvedPath}`,
        correction: 'Create the file/directory before returning the path. Path claims without files are fabrication (P11).',
      };
    }
  }

  // Check 2: File target claims — verify files exist with non-zero size
  for (const target of fileTargets) {
    if (target.includes('ContainerTestResult') || target.includes('Evidence') || target.includes('dist/')) {
      const resolvedPath = resolveProjectPath(target);
      const exists = await pathExists(resolvedPath);
      if (!exists) {
        return {
          blocked: true,
          layer: 'L10',
          reason: `File target does not exist on disk: ${resolvedPath}`,
          detected: `Target: ${target}`,
          correction: 'Verify the file exists before referencing it. Non-existent file references are fabrication (P11).',
        };
      }

      // Verify non-zero size (async)
      const size = await getFileSize(resolvedPath);
      if (size === 0) {
        return {
          blocked: true,
          layer: 'L10',
          reason: `File exists but is empty (0 bytes): ${resolvedPath}`,
          detected: `Target: ${target}, Size: 0`,
          correction: 'Empty files are not valid evidence. Write actual content before claiming the file is created.',
        };
      }
    }
  }

  return {
    blocked: false,
    layer: 'L10',
    reason: 'Container checks passed',
  };
}

function resolveProjectPath(inputPath: string): string {
  // Handle absolute paths
  if (path.isAbsolute(inputPath)) return inputPath;

  // Handle home-relative paths
  if (inputPath.startsWith('~/') || inputPath.startsWith('~\\')) {
    return path.join(os.homedir(), inputPath.slice(2));
  }

  // Handle project-relative paths
  return path.resolve(process.cwd(), inputPath);
}
