/**
 * L3: Output Inspection
 * Verifies outputs exist on HOST filesystem, not just container.
 * "File exists" in container ≠ retrieved on host.
 */

import fs from 'node:fs';

const INSPECTION_PATTERNS = [
  { pattern: /file.*exists.*container/i, reason: 'container-fs-not-host' },
  { pattern: /output.*in.*container/i, reason: 'output-still-in-container' },
  { pattern: /retrieved.*from.*container/i, reason: 'container-retrieval-not-host' },
  { pattern: /cp.*container.*host/i, reason: 'unverified-copy-claim' },
  { pattern: /docker.*cp/i, reason: 'docker-cp-not-automated' },
];

export interface L3CheckResult {
  passed: boolean;
  reason?: string;
  layer: 'L3';
  verifiedFiles: string[];
  missingFiles: string[];
}

export function checkOutputInspection(
  hostPaths: string[],
  message?: string
): L3CheckResult {
  const verifiedFiles: string[] = [];
  const missingFiles: string[] = [];

  // Mechanically verify each expected file exists on host
  for (const hostPath of hostPaths) {
    if (fs.existsSync(hostPath)) {
      verifiedFiles.push(hostPath);
    } else {
      missingFiles.push(hostPath);
    }
  }

  if (missingFiles.length > 0) {
    return {
      passed: false,
      layer: 'L3',
      reason: `[L3_OUTPUT_INSPECTION] ${missingFiles.length}/${hostPaths.length} files not found on host: ${missingFiles.join(', ')}`,
      verifiedFiles,
      missingFiles,
    };
  }

  // Check message for inspection-avoidance patterns
  if (message) {
    for (const { pattern, reason } of INSPECTION_PATTERNS) {
      if (pattern.test(message)) {
        return {
          passed: false,
          layer: 'L3',
          reason: `[L3_OUTPUT_INSPECTION] ${reason}`,
          verifiedFiles,
          missingFiles,
        };
      }
    }
  }

  return { passed: true, layer: 'L3', verifiedFiles, missingFiles };
}
