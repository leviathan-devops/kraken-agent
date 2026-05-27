/**
 * src/system-brain/firewall/firewall-audit.ts
 *
 * Append-only JSONL audit logging.
 *
 * Format: One JSON object per line (JSONL)
 * Location: .kraken/firewall-audit.jsonl
 *
 * NEVER throw from audit logging — it's best-effort.
 */

import fs from 'node:fs';
import path from 'node:path';
import { AuditEntry } from './types.ts';

export class FirewallAudit {
  private auditPath: string;

  constructor(workspacePath: string) {
    this.auditPath = path.join(workspacePath, '.kraken', 'firewall-audit.jsonl');
  }

  /**
   * log — appends an audit entry to the log file.
   * Creates directories and file if they don't exist.
   */
  log(entry: AuditEntry): void {
    try {
      const dir = path.dirname(this.auditPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const line = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.auditPath, line, 'utf-8');
    } catch {
      // Audit logging is best-effort — never throw
    }
  }

  /**
   * getEntries — reads all audit entries from the log.
   * Returns empty array if file doesn't exist or can't be parsed.
   */
  getEntries(): AuditEntry[] {
    try {
      if (!fs.existsSync(this.auditPath)) {
        return [];
      }

      const raw = fs.readFileSync(this.auditPath, 'utf-8');
      const lines = raw.split('\n').filter(line => line.trim().length > 0);

      return lines
        .map(line => {
          try {
            return JSON.parse(line) as AuditEntry;
          } catch {
            return null;
          }
        })
        .filter((entry): entry is AuditEntry => entry !== null);
    } catch {
      return [];
    }
  }

  /**
   * getEntriesByLayer — get all entries for a specific layer.
   */
  getEntriesByLayer(layer: string): AuditEntry[] {
    return this.getEntries().filter(entry => entry.layer === layer);
  }

  /**
   * getEntriesByAgent — get all entries for a specific agent.
   */
  getEntriesByAgent(agent: string): AuditEntry[] {
    return this.getEntries().filter(entry => entry.agent === agent);
  }

  /**
   * clear — clears the audit log (for testing).
   */
  clear(): void {
    try {
      if (fs.existsSync(this.auditPath)) {
        fs.unlinkSync(this.auditPath);
      }
    } catch {
      // Best-effort
    }
  }
}
