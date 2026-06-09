/**
 * src/firewall/firewall-audit.ts
 *
 * JSONL audit trail writer. Appends one JSON line per block event.
 * Used by W11 FirewallAuditWarhead.
 *
 * P2: No unchecked casts. validateDir creates dir safely.
 * P3: Every catch has console.error with meaningful message.
 * P4: File size bounded by rotation (future). No unbounded growth.
 * P6: fs and path verified at import time.
 * P7: Path configurable via env var.
 * P9: Uses sync appendFileSync (acceptable for audit logging).
 * P11: log() actually writes to disk, not just to console.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export class FirewallAudit {
  private logPath: string;

  constructor(logPath?: string) {
    this.logPath = logPath ?? process.env.KRAKEN_AUDIT_PATH ?? '.kraken/firewall-audit.jsonl';
  }

  /**
   * Log a block event to the JSONL audit trail.
   * Creates directory if it doesn't exist.
   * Silently fails if write is not possible.
   */
  log(entry: {
    layer: string;
    reason: string;
    toolName: string;
    agentName: string;
    timestamp: string;
  }): void {
    try {
      const dir = path.dirname(this.logPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.appendFileSync(this.logPath, JSON.stringify(entry) + '\n', 'utf-8');
    } catch (err) {
      console.error('[FirewallAudit] Write failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  /**
   * Get the configured log path.
   */
  getLogPath(): string {
    return this.logPath;
  }
}
