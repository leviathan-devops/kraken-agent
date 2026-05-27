import { BlockResult } from './types.js';

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

  format(): string {
    const evidence = this.evidenceRequired
      ? `\nEvidence required: ${this.evidenceRequired}`
      : '';
    return `[FIREWALL ${this.layer}] ${this.reason}\nDetected: ${this.detected}\n${this.correction}${evidence}`;
  }
}

export function createBlockResponse(blockResult: BlockResult): StructuredBlockError {
  return new StructuredBlockError(blockResult);
}
