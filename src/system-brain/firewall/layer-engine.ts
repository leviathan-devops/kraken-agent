/**
 * src/system-brain/firewall/layer-engine.ts — MILITARY GRADE
 *
 * Pattern evaluation engine with:
 * - Evidence gating
 * - CONSEQUENCE ESCALATION (strike system)
 * - Behavioral tracking
 * - Adaptive thresholds
 *
 * OCTOPUS METAPHOR: This is the central nervous system that coordinates
 * all autonomous arm responses. When an arm fires, the CNS tracks it,
 * escalates consequences, and ensures the response is proportional.
 */

import {
  FirewallContext,
  LayerRule,
  BlockResult,
  KrakenOperationType,
} from './types.ts';
import { EvidenceGate } from './evidence-gate.ts';

// ============================================================
// STRIKE SYSTEM — Consequence Escalation
// ============================================================

interface StrikeRecord {
  agentId: string;
  count: number;
  firstStrike: number;
  lastStrike: number;
  blockedLayers: Set<string>;
  warningCount: number;
  blockCount: number;
  cooldownCount: number;
  lockdownCount: number;
  cooldownUntil: number;
}

const strikeTracker = new Map<string, StrikeRecord>();
const STRIKE_COOLDOWN_MS = 30 * 1000;
const LOCKDOWN_MS = 120 * 1000;
const WARNING_THRESHOLD = 2;
const BLOCK_THRESHOLD = 4;
const COOLDOWN_THRESHOLD = 6;
const LOCKDOWN_THRESHOLD = 8;

function getOrCreateStrikes(agentId: string): StrikeRecord {
  let s = strikeTracker.get(agentId);
  if (!s) {
    s = {
      agentId,
      count: 0,
      firstStrike: Date.now(),
      lastStrike: 0,
      blockedLayers: new Set(),
      warningCount: 0,
      blockCount: 0,
      cooldownCount: 0,
      lockdownCount: 0,
      cooldownUntil: 0,
    };
    strikeTracker.set(agentId, s);
  }
  return s;
}

function recordStrike(agentId: string, layer: string): void {
  const s = getOrCreateStrikes(agentId);
  const now = Date.now();

  // If in cooldown/lockdown, check if it's expired
  if (s.cooldownUntil > 0 && now > s.cooldownUntil) {
    s.cooldownUntil = 0;
    s.count = 0; // Reset after cooldown expires
  }

  s.count++;
  s.lastStrike = now;
  s.blockedLayers.add(layer);

  if (s.count <= WARNING_THRESHOLD) {
    s.warningCount++;
  } else if (s.count <= BLOCK_THRESHOLD) {
    s.blockCount++;
  } else if (s.count <= COOLDOWN_THRESHOLD) {
    s.cooldownCount++;
    s.cooldownUntil = now + STRIKE_COOLDOWN_MS;
  } else {
    s.lockdownCount++;
    s.cooldownUntil = now + LOCKDOWN_MS;
  }
}

function isInCooldown(agentId: string): boolean {
  const s = strikeTracker.get(agentId);
  if (!s || s.cooldownUntil === 0) return false;
  return Date.now() < s.cooldownUntil;
}

function getStrikeLevel(agentId: string): string {
  const s = strikeTracker.get(agentId);
  if (!s) return 'NONE';
  if (s.count <= WARNING_THRESHOLD) return `WARNING (${s.count}/${WARNING_THRESHOLD})`;
  if (s.count <= BLOCK_THRESHOLD) return `BLOCK (${s.count}/${BLOCK_THRESHOLD})`;
  if (s.count <= COOLDOWN_THRESHOLD) {
    const remaining = Math.ceil((s.cooldownUntil - Date.now()) / 1000);
    return `COOLDOWN (${remaining}s remaining)`;
  }
  const remaining = Math.ceil((s.cooldownUntil - Date.now()) / 1000);
  return `LOCKDOWN (${remaining}s remaining)`;
}

// ============================================================
// FIELD VALUE EXTRACTION
// ============================================================

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
// LAYER ENGINE — with consequence escalation
// ============================================================

export class LayerEngine {
  private evidenceGate: EvidenceGate | null;

  constructor(evidenceGate: EvidenceGate | null = null) {
    this.evidenceGate = evidenceGate;
  }

  evaluate(
    ctx: FirewallContext,
    layers: LayerRule[],
    authorizedAgents: Set<string> = new Set()
  ): BlockResult | null {

    // ============================================================
    // PRECHECK: Cooldown/Lockdown
    // ============================================================
    if (isInCooldown(ctx.agent)) {
      const level = getStrikeLevel(ctx.agent);
      return {
        blocked: true,
        layer: 'STRIKE',
        reason: `Agent in ${level} — all operations blocked`,
        detected: ctx.agent,
        correction: 'You are in cooldown/lockdown due to repeated firewall violations. Wait for cooldown to expire. Read the Hive. Re-evaluate your approach.',
      };
    }

    // ============================================================
    // SPECIAL CASE: L0 Identity Wall
    // ============================================================

    if (
      (ctx.operationType === KrakenOperationType.HIVE_READ ||
       ctx.operationType === KrakenOperationType.HIVE_WRITE) &&
      ctx.agent &&
      authorizedAgents.size > 0 &&
      !authorizedAgents.has(ctx.agent)
    ) {
      recordStrike(ctx.agent, 'L0');
      const level = getStrikeLevel(ctx.agent);
      return {
        blocked: true,
        layer: 'L0',
        reason: `[${level}] Non-Kraken agent attempted Hive access`,
        detected: ctx.agent,
        correction: 'Hive access restricted to Kraken orchestrator.',
      };
    }

    // ============================================================
    // NORMAL PATTERN MATCHING
    // ============================================================

    for (const layer of layers) {
      if (!layer.enabled) continue;
      if (layer.layer === 'L0') continue;

      if (!layer.applicableTo.includes(ctx.operationType)) continue;

      if (layer.toolGate && layer.toolGate.length > 0) {
        if (!layer.toolGate.includes(ctx.tool)) continue;
      }

      for (const pattern of layer.patterns) {
        const fieldValue = getFieldValue(ctx, pattern.field);

        if (pattern.pattern.test(fieldValue)) {
          // ============================================================
          // PATTERN MATCHED
          // ============================================================

          if (layer.requireEvidence && this.evidenceGate) {
            if (this.evidenceGate.check(layer.requireEvidence)) {
              return null;
            }
          }

          // Record strike
          recordStrike(ctx.agent, layer.layer);

          const strikeLevel = getStrikeLevel(ctx.agent);
          const enhancedReason = `[${strikeLevel}] ${pattern.description}`;
          const enhancedCorrection = layer.correction +
            `\nStrike level: ${strikeLevel}. Fix the root cause to reset strikes.`;

          return {
            blocked: true,
            layer: layer.layer,
            reason: enhancedReason,
            detected: fieldValue.length > 200 ? fieldValue.slice(0, 200) + '...' : fieldValue,
            correction: enhancedCorrection,
            evidenceRequired: layer.requireEvidence,
          };
        }
      }
    }

    return null;
  }

  getStrikeStatus(agentId: string): StrikeRecord | null {
    return strikeTracker.get(agentId) || null;
  }

  resetStrikes(agentId: string): void {
    strikeTracker.delete(agentId);
  }
}

export { getStrikeLevel, isInCooldown, recordStrike };
