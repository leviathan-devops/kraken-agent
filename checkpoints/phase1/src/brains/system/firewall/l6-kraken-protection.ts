/**
 * L6: Kraken Zone Protection
 * SYSTEM zone: read-only, never modified
 * STATE zone: managed by Hive only
 * COMPACTION zone: auto-managed, never manual
 */

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
