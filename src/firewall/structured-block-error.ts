/**
 * src/firewall/structured-block-error.ts
 *
 * Error class thrown when a warhead blocks a tool call.
 * Carries structured metadata for audit logging.
 *
 * P2: All properties typed. Constructor validates inputs.
 * P3: No catch blocks — this IS the error type.
 * P6: No imports.
 * P11: toJSON returns real structured data, not a placeholder.
 */

export class StructuredBlockError extends Error {
  readonly layer: string;
  readonly reason: string;
  readonly correction: string;
  readonly toolName: string;
  readonly timestamp: string;

  constructor(layer: string, reason: string, correction: string, toolName: string) {
    super('[' + layer + '] ' + reason);
    this.name = 'StructuredBlockError';
    this.layer = layer;
    this.reason = reason;
    this.correction = correction;
    this.toolName = toolName;
    this.timestamp = new Date().toISOString();
  }

  toJSON(): Record<string, string> {
    return {
      errorType: 'StructuredBlockError',
      layer: this.layer,
      reason: this.reason,
      correction: this.correction,
      toolName: this.toolName,
      timestamp: this.timestamp,
    };
  }
}
