/**
 * src/clusters/sandbox.ts
 *
 * Tentacle Sandboxing — resource isolation for tentacles.
 *
 * Each tentacle can have a sandbox that defines:
 *   - allowedPaths: which filesystem paths the tentacle can read/write
 *   - allowedTools: which tools the tentacle can use
 *   - environmentVars: isolated environment variables
 *   - maxConcurrentAgents: concurrency cap
 *
 * The SandboxManager creates, retrieves, validates, and removes sandboxes.
 * validateAccess uses path normalization to prevent directory traversal.
 */

import * as path from 'path';
import { TENTACLE_CAPS } from './cluster-types.js';
import type { TentacleSandbox } from './cluster-types.js';

export class SandboxManager {
  /** Map of tentacleId -> TentacleSandbox */
  private sandboxes: Map<string, TentacleSandbox> = new Map();

  /**
   * Create a new sandbox for a tentacle.
   * If allowedPaths is not provided, the sandbox starts with no path restrictions
   * (empty array = unrestricted, must be explicitly restricted).
   *
   * @param tentacleId - Unique tentacle identifier
   * @param allowedPaths - Optional list of allowed filesystem paths
   * @returns The newly created TentacleSandbox
   * @throws Error if tentacleId is empty
   */
  createSandbox(tentacleId: string, allowedPaths?: string[], maxConcurrentAgents?: number): TentacleSandbox {
    if (!tentacleId) {
      throw new Error('[SandboxManager] tentacleId is required');
    }

    // Normalize all allowed paths
    const normalizedPaths = allowedPaths
      ? allowedPaths.map(p => path.resolve(p))
      : [];

    // Validate and clamp maxConcurrentAgents (P6: bounds check)
    let concurrent = typeof maxConcurrentAgents === 'number' ? maxConcurrentAgents : 4;
    if (concurrent < 1) {
      concurrent = 1;
    } else if (concurrent > TENTACLE_CAPS.maxAgents) {
      concurrent = TENTACLE_CAPS.maxAgents;
    }

    const sandbox: TentacleSandbox = {
      tentacleId,
      allowedPaths: normalizedPaths,
      allowedTools: [],
      environmentVars: {},
      maxConcurrentAgents: concurrent,
    };

    this.sandboxes.set(tentacleId, sandbox);
    return sandbox;
  }

  /**
   * Retrieve an existing sandbox by tentacle ID.
   * Returns undefined if no sandbox exists for the given tentacle.
   */
  getSandbox(tentacleId: string): TentacleSandbox | undefined {
    return this.sandboxes.get(tentacleId);
  }

  /**
   * Validate whether a tentacle has access to a given filesystem path.
   *
   * NOTE: This is infrastructure for v1.5+ — currently NOT wired into the
   * tentacle lifecycle (disperseTentacle, tightenTentacle). It is fully
   * implemented and tested but the tentacle lifecycle does not currently
   * invoke sandbox validation. This is a deliberate architectural choice:
   * sandboxing was built as foundation before the lifecycle wiring was ready.
   *
   * To wire: call sandboxManager.validateAccess(tentacleId, targetPath) in
   * disperseTentacle() before allowing file operations.
   *
   * Rules:
   *   - If the tentacle has no sandbox, access is DENIED (fail closed)
   *   - If allowedPaths is empty (no restrictions), all paths are ALLOWED
   *   - Otherwise, the target path must exist within one of the allowed paths
   *   - Paths are resolved to absolute before comparison to prevent traversal
   *
   * @param tentacleId - Tentacle requesting access
   * @param targetPath - The filesystem path to validate
   * @returns true if access is allowed, false otherwise
   */
  validateAccess(tentacleId: string, targetPath: string): boolean {
    if (!tentacleId || !targetPath) {
      return false;
    }

    const sandbox = this.sandboxes.get(tentacleId);
    if (!sandbox) {
      return false; // No sandbox = no access (fail closed)
    }

    // Empty allowedPaths means unrestricted
    if (sandbox.allowedPaths.length === 0) {
      return true;
    }

    const resolvedTarget = path.resolve(targetPath);

    return sandbox.allowedPaths.some(allowed => {
      const resolvedAllowed = path.resolve(allowed);
      // Exact match OR the target is within the allowed directory
      return (
        resolvedTarget === resolvedAllowed ||
        resolvedTarget.startsWith(resolvedAllowed + path.sep)
      );
    });
  }

  /**
   * Remove a sandbox, typically when a tentacle is dissolved.
   * Silently no-ops if no sandbox exists for the given tentacle.
   */
  removeSandbox(tentacleId: string): void {
    this.sandboxes.delete(tentacleId);
  }
}
