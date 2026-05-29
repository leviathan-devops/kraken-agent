/**
 * src/system-brain/firewall/l6-kraken-protection.ts
 *
 * L6: Kraken Zone Protection — includes ARCHITECTURE PRESERVATION
 * SYSTEM zone: read-only, never modified
 * STATE zone: managed by Hive only
 * COMPACTION zone: auto-managed, never manual
 * ARCHITECTURE zone: source tree integrity — NEVER delete Kraken source
 *
 * The ARCHITECTURE zone was added after the catastrophic v11 ship disaster
 * where the entire orchestration source tree (brains, clusters, factory,
 * shared, tools, hooks, kraken-hive, v4.1, identity) was silently stripped
 * from the ship package during a build. This mechanical firewall blocks
 * ANY operation that would destroy Kraken source architecture.
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
  ARCHITECTURE: {
    paths: [
      'src/brains/',
      'src/clusters/',
      'src/factory/',
      'src/shared/',
      'src/tools/',
      'src/hooks/',
      'src/kraken-hive/',
      'src/v4.1/',
      'src/identity/',
      'src/system-brain/firewall/',
      'src/brains/system/firewall/',
      'dist/kraken-firewall.js',
      'dist/index.js',
    ],
    access: 'architecture-preserved' as const,
    description: 'Kraken source architecture — NEVER delete, NEVER strip from bundle',
  },
};

const PROTECTION_PATTERNS = [
  { pattern: /rm\s+-rf.*(?:kraken|opencode)/i, reason: 'attempted-kraken-or-opencode-deletion' },
  { pattern: /delete.*(?:kraken|opencode).*(?:config|state|hive)/i, reason: 'config-deletion-attempt' },
  { pattern: /overwrite.*(?:kraken|opencode).*(?:config|state|hive)/i, reason: 'state-overwrite-attempt' },
  { pattern: /(?:rm|remove|delete).*\/(?:root\/\.config\/opencode|home\/.*\.config\/opencode)/i, reason: 'opencode-config-deletion' },
  // Architecture preservation patterns — catches ALL variants of source tree destruction
  { pattern: /rm\s+-rf.*src\/(?:brains|clusters|factory|shared|tools|hooks|kraken-hive|v4\.1|identity|system-brain)/i, reason: 'kraken-architecture-deletion' },
  { pattern: /(?:mv|rename).*src\/(?:brains|clusters|factory|shared|tools).*\/tmp/i, reason: 'kraken-source-relocation' },
  { pattern: /find\s+.*src\/?\s+-delete/i, reason: 'kraken-source-find-delete' },
  { pattern: /find\s+.*src\/?\s+-exec\s+rm/i, reason: 'kraken-source-find-exec-rm' },
  { pattern: /rsync\s+.*--delete.*src\//i, reason: 'kraken-source-rsync-delete' },
  { pattern: />\s*\/dev\/null.*src\//i, reason: 'kraken-source-null-redirect' },
  { pattern: /truncate\s+.*src\//i, reason: 'kraken-source-truncation' },
  { pattern: /git\s+rm\s+-r.*src\/(?:brains|clusters|factory|shared|tools)/i, reason: 'kraken-source-git-remove' },
  { pattern: /cp\s+\/dev\/null\s+.*src\/(?:index|brains|clusters)\.(?:ts|js)/i, reason: 'kraken-source-devnull-overwrite' },
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
        if (zone.access === 'architecture-preserved' && (operation === 'delete' || operation === 'write')) {
          return {
            allowed: false,
            layer: 'L6',
            reason: `[L6_KRAKEN_PROTECTION] ${zoneName} zone is architecture-protected — cannot ${operation}: ${filePath}. Kraken source architecture MUST be preserved. Deleting source directories causes catastrophic loss of orchestration capabilities.`,
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
  description: 'Kraken Zone Protection — blocks writes/deletes to SYSTEM, STATE, COMPACTION, and ARCHITECTURE zones',
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
    {
      intent: KrakenOperationType.EXECUTE,
      pattern: /rm\s+-rf.*src\/(?:brains|clusters|factory|shared|tools|hooks|kraken-hive|v4\.1|identity|system-brain)/i,
      field: 'command',
      description: 'DELETING KRAKEN SOURCE ARCHITECTURE — BLOCKED by L6 ARCHITECTURE zone',
    },
    {
      intent: KrakenOperationType.WRITE,
      pattern: /src\/(?:brains|clusters|factory|shared|tools|kraken-hive|v4\.1|identity|system-brain)\//i,
      field: 'filePath',
      description: 'Writing/deleting files in Kraken ARCHITECTURE zone — blocked unless explicit migration',
    },
  ],
  correction: 'Kraken SYSTEM zone is read-only. STATE zone is Hive-managed. ARCHITECTURE zone is integrity-protected — NEVER delete Kraken source directories. Use Hive tools to modify state.',
  enabled: true,
};