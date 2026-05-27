/**
 * src/system-brain/firewall/layer-engine.ts
 *
 * Pattern evaluation engine with evidence gating.
 *
 * IMPORTANT: This is NOT just a simple regex matcher.
 * It implements the CRITICAL evidence-gate pattern:
 *
 *   Patterns matched FIRST → evidence check ONLY if required → block or allow
 *
 * The evidence gate is NOT a general pre-check. It ONLY applies when
 * theatrical patterns are detected.
 *
 * L0 Identity Wall is a SPECIAL CASE handled separately.
 */

import {
  FirewallContext,
  LayerRule,
  BlockResult,
  KrakenOperationType,
} from './types.ts';
import { EvidenceGate } from './evidence-gate.ts';

// ============================================================
// FIELD VALUE EXTRACTION
// ============================================================

/**
 * getFieldValue — extracts a field value from FirewallContext.
 * Used by pattern matching to get the string to test.
 */
function getFieldValue(ctx: FirewallContext, field: string): string {
  switch (field) {
    case 'command':
      return ctx.command || '';

    case 'args.description':
      return typeof ctx.args.description === 'string' ? ctx.args.description : '';

    case 'args.notes':
      return typeof ctx.args.notes === 'string' ? ctx.args.notes : '';

    case 'args.path': {
      if (typeof ctx.args.path === 'string') return ctx.args.path;
      if (typeof ctx.args.file_path === 'string') return ctx.args.file_path;
      if (typeof ctx.args.filePath === 'string') return ctx.args.filePath;
      if (typeof ctx.args.file === 'string') return ctx.args.file;
      return '';
    }

    case 'args.content':
      return typeof ctx.args.content === 'string' ? ctx.args.content : '';

    case 'args.task':
      return typeof ctx.args.task === 'string' ? ctx.args.task : '';

    case 'tool':
      return ctx.tool;

    case 'commandTokens[0]':
      return ctx.commandTokens.length > 0 ? ctx.commandTokens[0] : '';

    default:
      return '';
  }
}

// ============================================================
// LAYER ENGINE
// ============================================================

export class LayerEngine {
  private evidenceGate: EvidenceGate | null;

  constructor(evidenceGate: EvidenceGate | null = null) {
    this.evidenceGate = evidenceGate;
  }

  /**
   * evaluate — main entry point for layer evaluation.
   *
   * Flow:
   * 1. L0 Identity Wall (special case, no patterns)
   * 2. Normal layer pattern matching (skip L0)
   * 3. For each matching pattern: evidence gate check if required
   * 4. Return BlockResult on first block, null if allowed
   */
  evaluate(
    ctx: FirewallContext,
    layers: LayerRule[],
    authorizedAgents: Set<string> = new Set()
  ): BlockResult | null {

    // ============================================================
    // SPECIAL CASE: L0 Identity Wall
    // ============================================================
    // L0 is NOT pattern-based. It checks agent identity.
    // This MUST happen BEFORE pattern matching.
    //
    // Block if:
    // - Operation is HIVE_READ or HIVE_WRITE
    // - AND agent is NOT in authorizedAgents set
    // ============================================================

    if (
      (ctx.operationType === KrakenOperationType.HIVE_READ ||
       ctx.operationType === KrakenOperationType.HIVE_WRITE) &&
      ctx.agent &&
      authorizedAgents.size > 0 &&
      !authorizedAgents.has(ctx.agent)
    ) {
      return {
        blocked: true,
        layer: 'L0',
        reason: 'Non-Kraken agent attempted Hive access',
        detected: ctx.agent,
        correction: 'Hive access restricted to Kraken orchestrator.',
      };
    }

    // ============================================================
    // NORMAL PATTERN MATCHING
    // ============================================================
    // Skip L0 — it's already handled above.
    // For all other layers, evaluate patterns.
    // ============================================================

    for (const layer of layers) {
      // Skip disabled layers
      if (!layer.enabled) continue;

      // Skip L0 — already handled
      if (layer.layer === 'L0') continue;

      // Check applicableTo — does this layer apply to this operation type?
      if (!layer.applicableTo.includes(ctx.operationType)) continue;

      // Check toolGate — does this layer restrict to specific tools?
      if (layer.toolGate && layer.toolGate.length > 0) {
        if (!layer.toolGate.includes(ctx.tool)) continue;
      }

      // Evaluate patterns
      for (const pattern of layer.patterns) {
        const fieldValue = getFieldValue(ctx, pattern.field);

        if (pattern.pattern.test(fieldValue)) {
          // ============================================================
          // PATTERN MATCHED
          // ============================================================
          // Now check if this layer requires evidence.
          // IMPORTANT: Evidence check ONLY happens if pattern matched.
          // This is the CRITICAL fix — evidence gate is NOT a pre-check.
          // ============================================================

          if (layer.requireEvidence && this.evidenceGate) {
            // Evidence required — check if satisfied
            if (this.evidenceGate.check(layer.requireEvidence)) {
              // Evidence satisfied — ALLOW this operation
              return null;
            }
            // Evidence NOT satisfied — BLOCK
          }

          // No evidence required, OR evidence not satisfied — BLOCK
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

    // No layers blocked — ALLOW
    return null;
  }
}
