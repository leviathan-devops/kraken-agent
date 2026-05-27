/**
 * src/system-brain/firewall/l6-kraken-protection.ts
 *
 * L6: Kraken Zone Protection
 * SYSTEM zone: read-only, never modified
 * STATE zone: managed by Hive only
 * COMPACTION zone: auto-managed, never manual
 */

import type { LayerRule } from './types.js';
import { KrakenOperationType } from './types.js';

export const KRAKEN_ZONES = {
  SYSTEM: {
    paths: [
      '/root/.config/opencode/',
      '.config/opencode/',
    ],
    access: 'read-only' as const,
    description: 'Kraken configuration zone',
  },
  STATE: {
    paths: [
      '/root/.local/share/opencode/kraken-hive/',
      '.local/share/opencode/kraken-hive/',
    ],
    access: 'hive-only' as const,
    description: 'Kraken state managed by Hive',
  },
  COMPACTION: {
    paths: [
      '/tmp/kraken-compaction/',
    ],
    access: 'auto-managed' as const,
    description: 'Compaction survival data',
  },
};

const PROTECTION_PATTERNS = [
  { pattern: /rm\s+-rf.*(?:kraken|opencode)/i, reason: 'attempted-kraken-or-opencode-deletion' },
  { pattern: /delete.*(?:kraken|opencode).*(?:config|state|hive)/i, reason: 'config-deletion-attempt' },
  { pattern: /overwrite.*(?:kraken|opencode).*(?:config|state|hive)/i, reason: 'state-overwrite-attempt' },
  { pattern: /(?:rm|remove|delete).*\/(?:root\/\.config\/opencode|home\/.*\.config\/opencode)/i, reason: 'opencode-config-deletion' },
];

export interface L6CheckResult {
  allowed: boolean;
  reason?: string;
  layer: 'L6';
  zone?: string;
}

export function checkKrakenProtection(
  filePath: string,
  operation: 'read' | 'write' | 'delete'
): L6CheckResult {
  for (const [zoneName, zone] of Object.entries(KRAKEN_ZONES)) {
    for (const zonePath of zone.paths) {
      if (filePath.includes(zonePath)) {
        if (zone.access === 'read-only' && operation !== 'read') {
          return {
            allowed: false,
            layer: 'L6',
            reason: `[L6_KRAKEN_PROTECTION] ${zoneName} zone is read-only — cannot ${operation}: ${filePath}`,
            zone: zoneName,
          };
        }
        if (zone.access === 'hive-only' && operation !== 'read') {
          return {
            allowed: false,
            layer: 'L6',
            reason: `[L6_KRAKEN_PROTECTION] ${zoneName} zone is Hive-managed — cannot ${operation}: ${filePath}`,
            zone: zoneName,
          };
        }
      }
    }
  }

  return { allowed: true, layer: 'L6' };
}

export function checkProtectionPatterns(command: string): L6CheckResult {
  for (const { pattern, reason } of PROTECTION_PATTERNS) {
    if (pattern.test(command)) {
      return {
        allowed: false,
        layer: 'L6',
        reason: `[L6_KRAKEN_PROTECTION] ${reason}`,
      };
    }
  }

  return { allowed: true, layer: 'L6' };
}

export const L6_KRAKEN_PROTECTION: LayerRule = {
  layer: 'L6',
  description: 'Kraken Zone Protection — blocks writes/deletes to SYSTEM, STATE, COMPACTION zones',
  applicableTo: [
    KrakenOperationType.READ,
    KrakenOperationType.WRITE,
    KrakenOperationType.EXECUTE,
  ],
  patterns: [
    {
      intent: KrakenOperationType.WRITE,
      pattern: /\/root\/\.config\/opencode\/|\/root\/\.local\/share\/opencode\/kraken-hive\//i,
      field: 'filePath',
      description: 'Writing to Kraken SYSTEM or STATE zones',
    },
    {
      intent: KrakenOperationType.EXECUTE,
      pattern: /rm\s+-rf.*(?:kraken|opencode)|rm\s+-rf.*\/root\/\.config\/opencode/i,
      field: 'command',
      description: 'Deleting Kraken or opencode config files',
    },
  ],
  correction: 'Kraken SYSTEM zone is read-only. STATE zone is Hive-managed. Use Hive tools to modify state.',
  enabled: true,
};