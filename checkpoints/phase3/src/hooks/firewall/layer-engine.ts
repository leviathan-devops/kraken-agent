import { FirewallContext, LayerRule, BlockResult } from './types.js';
import { EvidenceGate } from './evidence-gate.js';

function getFieldValue(ctx: FirewallContext, field: string): string {
  switch (field) {
    case 'command':
      return ctx.command || '';
    case 'args.notes': {
      if (typeof ctx.args.notes === 'string') return ctx.args.notes;
      if (typeof ctx.args.message === 'string') return ctx.args.message;
      if (typeof ctx.args.body === 'string') return ctx.args.body;
      if (typeof ctx.args.text === 'string') return ctx.args.text;
      if (typeof ctx.args.description === 'string') return ctx.args.description;
      if (typeof ctx.args.reason === 'string') return ctx.args.reason;
      return '';
    }
    case 'args.path': {
      if (typeof ctx.args.path === 'string') return ctx.args.path;
      if (typeof ctx.args.file_path === 'string') return ctx.args.file_path;
      if (typeof ctx.args.filePath === 'string') return ctx.args.filePath;
      if (typeof ctx.args.file === 'string') return ctx.args.file;
      return '';
    }
    case 'commandTokens[0]':
      return ctx.commandTokens.length > 0 ? ctx.commandTokens[0] : '';
    default:
      return '';
  }
}

export class LayerEngine {
  private evidenceGate: EvidenceGate | null;

  constructor(evidenceGate: EvidenceGate | null = null) {
    this.evidenceGate = evidenceGate;
  }

  /**
   * evaluate runs the layer engine against a FirewallContext.
   * Returns a BlockResult on first match, or null if no layer blocks.
   */
  evaluate(ctx: FirewallContext, layers: LayerRule[]): BlockResult | null {
    for (const layer of layers) {
      if (!layer.enabled) continue;

      if (!layer.applicableTo.includes(ctx.operationType)) continue;

      if (layer.toolGate && layer.toolGate.length > 0) {
        if (!layer.toolGate.includes(ctx.tool)) continue;
      }

      for (const pattern of layer.patterns) {
        const fieldValue = getFieldValue(ctx, pattern.field);

        if (pattern.pattern.test(fieldValue)) {
          if (layer.requireEvidence && this.evidenceGate) {
            if (this.evidenceGate.check(layer.requireEvidence)) {
              return null;
            }
          }

          return {
            blocked: true,
            layer: layer.layer,
            reason: pattern.description,
            detected: fieldValue.length > 200 ? fieldValue.slice(0, 200) + '...' : fieldValue,
            correction: layer.correction,
            evidenceRequired: layer.requireEvidence,
          };
        }
      }
    }

    return null;
  }
}
