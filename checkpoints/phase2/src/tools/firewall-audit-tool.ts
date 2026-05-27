import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';
import { FirewallAudit } from '../hooks/firewall/firewall-audit.js';
import { AuditEntry } from '../hooks/firewall/types.js';

export function createFirewallAuditTool() {
  return tool({
    description: 'View the last N firewall audit log entries',
    args: {
      limit: z.number().int().min(1).max(100).default(20).describe('Number of entries to return'),
    },
    async execute(args: { limit: number }): Promise<string> {
      const auditLogger = new FirewallAudit(process.cwd());
      const all: AuditEntry[] = auditLogger.getEntries();
      const limit = Math.max(1, args.limit ?? 20);
      const recent = all.slice(-limit).reverse();

      if (recent.length === 0) {
        return 'No firewall audit entries recorded.';
      }

      const lines = [
        `FIREWALL AUDIT LOG (last ${recent.length} of ${all.length} entries)`,
        '═'.repeat(80),
      ];

      for (const entry of recent) {
        lines.push(
          `[${entry.timestamp}] ${entry.layer} | ${entry.reason} | agent=${entry.agent} tool=${entry.tool}`,
        );
        if (entry.command) {
          lines.push(`  command: ${entry.command}`);
        }
        lines.push(`  correction: ${entry.correction}`);
        lines.push('─'.repeat(80));
      }

      return lines.join('\n');
    },
  });
}
