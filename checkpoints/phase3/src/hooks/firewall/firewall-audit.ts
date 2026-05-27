import fs from 'node:fs';
import path from 'node:path';
import { AuditEntry } from './types.js';

export class FirewallAudit {
  private auditPath: string;

  constructor(workspacePath: string) {
    this.auditPath = path.join(workspacePath, '.shark', 'firewall-audit.jsonl');
  }

  /**
   * log appends an audit entry as a JSON line to the audit file.
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
      // audit logging is best-effort; never throw from audit
    }
  }

  /**
   * getEntries reads all audit entries from the log file.
   * Returns an empty array if the file does not exist or cannot be parsed.
   */
  getEntries(): AuditEntry[] {
    try {
      if (!fs.existsSync(this.auditPath)) {
        return [];
      }
      const raw = fs.readFileSync(this.auditPath, 'utf-8');
      const lines = raw.split('\n').filter((line) => line.trim().length > 0);
      return lines
        .map((line) => {
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
}
