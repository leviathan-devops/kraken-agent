/**
 * src/system-brain/firewall/block-response.ts
 *
 * StructuredBlockError — the error thrown when a layer blocks.
 *
 * Contains:
 * - layer: Which layer blocked (e.g., 'L1', 'L5-2')
 * - reason: Why it was blocked
 * - detected: What was detected (truncated)
 * - correction: How to fix it
 * - evidenceRequired: Which evidence file is needed (if any)
 */

import { BlockResult } from './types.ts';

export class StructuredBlockError extends Error {
  readonly layer: string;
  readonly reason: string;
  readonly detected: string;
  readonly correction: string;
  readonly evidenceRequired: string | undefined;

  constructor(result: BlockResult) {
    super(`[FIREWALL ${result.layer}] ${result.reason}`);
    this.name = 'StructuredBlockError';
    this.layer = result.layer;
    this.reason = result.reason;
    this.detected = result.detected;
    this.correction = result.correction;
    this.evidenceRequired = result.evidenceRequired;
    Object.setPrototypeOf(this, StructuredBlockError.prototype);
  }

  /**
   * format — returns a human-readable block message.
   */
  format(): string {
    const evidence = this.evidenceRequired
      ? `\nEvidence required: ${this.evidenceRequired}`
      : '';
    return `[FIREWALL ${this.layer}] ${this.reason}\nDetected: ${this.detected}\n${this.correction}${evidence}`;
  }

  /**
   * formatBrief — returns a one-line summary.
   */
  formatBrief(): string {
    return `[FIREWALL ${this.layer}] ${this.reason} — ${this.correction}`;
  }
}

/**
 * createBlockResponse — factory function for StructuredBlockError.
 */
export function createBlockResponse(blockResult: BlockResult): StructuredBlockError {
  return new StructuredBlockError(blockResult);
}
