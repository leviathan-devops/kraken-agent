/**
 * L6: Anti-Retard Protection Layer — MILITARY GRADE
 *
 * OCTOPUS INTELLIGENCE ARCHITECTURE:
 * Each pattern category is an autonomous ARM with local intelligence.
 * Arms fire independently and instantaneously — no central bottleneck.
 * Multi-signal fusion compounds weak signals into decisive blocks.
 * Consequence escalation: warning → block → cooldown → lockdown.
 *
 * Re-exports from system-brain/firewall/l6-anti-retard.ts (SINGLE SOURCE OF TRUTH)
 */

import type { LayerRule } from '../../../system-brain/firewall/types.js';
import { KrakenOperationType } from '../../../system-brain/firewall/types.js';
import {
  checkAntiRetardPattern as _check,
  recordActionResult as _record,
  clearHistory as _clear,
  multiSignalFusion,
  getStrikes,
  L6_ANTI_RETARD as _L6,
  EXCUSE_PATTERNS,
  DENIAL_PATTERNS,
  PROCEDURE_VIOLATION_PATTERNS,
  LAZY_PATTERNS,
  ENVIRONMENT_BLAME_PATTERNS,
  HONESTY_DODGE_PATTERNS,
  BUCK_PASSING_PATTERNS,
  IMPOSSIBILITY_PATTERNS,
  THEATRICAL_DELETION_PATTERNS,
  RATIONALIZATION_PATTERNS,
  AVOIDANCE_PATTERNS,
  FAKE_VERIFICATION_PATTERNS,
  GIVE_UP_PATTERNS,
  PREMATURE_DONE_PATTERNS,
} from '../../../system-brain/firewall/l6-anti-retard.js';

export const L6_ANTI_RETARD = _L6;
export const checkAntiRetardPattern = _check;
export const recordActionResult = _record;
export const clearHistory = _clear;

export {
  multiSignalFusion,
  getStrikes,
  EXCUSE_PATTERNS,
  DENIAL_PATTERNS,
  PROCEDURE_VIOLATION_PATTERNS,
  LAZY_PATTERNS,
  ENVIRONMENT_BLAME_PATTERNS,
  HONESTY_DODGE_PATTERNS,
  BUCK_PASSING_PATTERNS,
  IMPOSSIBILITY_PATTERNS,
  THEATRICAL_DELETION_PATTERNS,
  RATIONALIZATION_PATTERNS,
};
