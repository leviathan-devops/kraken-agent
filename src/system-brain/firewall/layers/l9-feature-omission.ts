/**
 * src/system-brain/firewall/layers/l9-feature-omission.ts
 *
 * L9: Feature Omission Detection
 * Checks for missing features by comparing implementation against spec.
 */

import type { FirewallContext, FirewallResult } from '../types.js';

/** P2-compliant safe string extraction from args record */
function extractArgString(args: Record<string, unknown>, key: string, defaultValue: string = ''): string {
  const value = args[key];
  return typeof value === 'string' ? value : defaultValue;
}

export function checkL9FeatureOmission(ctx: FirewallContext): FirewallResult {
  // L9 is primarily a post-build analysis layer, not a runtime hook check.
  // In the tool.execute.before hook context, we check for attempts to
  // claim "feature complete" without evidence.

  const { tool, args, command } = ctx;
  const checkText = [
    command || '',
    extractArgString(args, 'task'),
    extractArgString(args, 'message'),
  ].join(' ');

  // Pattern: Agent claims all features implemented
  // P2: Handles plurals (features, requirements, endpoints, functions) and optional adverbs (fully, completely)
  if (/\b(all|every|complete|full)\s+(features?|requirements?|endpoints?|functions?)\s+(is|are)?\s*(fully|completely)?\s*(implemented|done|complete|built|finished)\b/i.test(checkText)) {
    return {
      blocked: true,
      layer: 'L9',
      reason: 'Feature completeness claim without spec comparison evidence',
      detected: checkText.slice(0, 200),
      correction: 'List each feature from the spec with evidence of implementation. Do not claim blanket completion.',
      evidenceRequired: 'Feature checklist comparison',
    };
  }

  return {
    blocked: false,
    layer: 'L9',
    reason: 'No feature omission patterns detected',
  };
}
