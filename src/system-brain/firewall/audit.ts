/**
 * src/system-brain/firewall/audit.ts
 *
 * JSONL Audit Logger — Every firewall decision (block or allow) is logged.
 * Mechanical evidence trail for the VERIFY and AUDIT gates.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { AuditEntry } from './types.js';

/** Runtime check: does the value look like an AuditEntry? */
function isObjectWithKeys(obj: unknown, keys: string[]): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null && keys.every((k) => k in obj);
}

export class FirewallAudit {
  private logPath: string;

  constructor(logPath?: string) {
    this.logPath = logPath ?? path.join(os.homedir(), '.kraken', 'firewall-audit.jsonl');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    try {
      const dir = path.dirname(this.logPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[FirewallAudit] Cannot create log directory: ${errMsg}`);
    }
  }

  log(entry: AuditEntry): void {
    try {
      const line = JSON.stringify(entry) + '\n';
      fs.promises.appendFile(this.logPath, line, 'utf-8').catch((err: unknown) => {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[FirewallAudit] Failed to write audit entry: ${errMsg}`);
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[FirewallAudit] Failed to serialize audit entry: ${errMsg}`);
    }
  }

  query(filter: Partial<AuditEntry>): AuditEntry[] {
    try {
      if (!fs.existsSync(this.logPath)) {
        return [];
      }

      const content = fs.readFileSync(this.logPath, 'utf-8');
      const lines = content.trim().split('\n').filter((l) => l.length > 0);

      const entries: AuditEntry[] = [];
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (isObjectWithKeys(parsed, ['timestamp', 'agent', 'tool', 'layer', 'blocked', 'reason'])) {
            const entry = parsed as AuditEntry;
            if (this.matchesFilter(entry, filter)) {
              entries.push(entry);
            }
          } else {
            console.error(`[FirewallAudit] Malformed audit line: missing required fields`);
          }
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error(`[FirewallAudit] Malformed audit line: ${errMsg}`);
        }
      }

      return entries;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[FirewallAudit] Cannot read audit log: ${errMsg}`);
      return [];
    }
  }

  private matchesFilter(entry: AuditEntry, filter: Partial<AuditEntry>): boolean {
    for (const key of Object.keys(filter) as (keyof AuditEntry)[]) {
      const filterValue = filter[key];
      if (filterValue !== undefined && entry[key] !== filterValue) {
        return false;
      }
    }
    return true;
  }

  getLogPath(): string {
    return this.logPath;
  }

  /** Get recent blocked entries */
  getRecentBlocks(count: number = 10): AuditEntry[] {
    return this.query({ blocked: true }).slice(-count);
  }

  /** Get entries matching an optional filter (alias for query) */
  getEntries(filter?: Partial<AuditEntry>): AuditEntry[] {
    return this.query(filter ?? {});
  }
}
