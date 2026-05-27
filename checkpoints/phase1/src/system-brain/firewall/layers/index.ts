/**
 * src/system-brain/firewall/layers/index.ts
 *
 * DEFAULT_LAYERS — the complete ordered list of layer rules.
 * Evaluated in order — first match wins.
 *
 * Order matters:
 * 1. L0 (special case — identity wall)
 * 2. L1 (theatrical — pipe counting)
 * 3. L2 (hive poison — corruption)
 * 4. L3 (delegation abuse — unauthorized spawning)
 * 5. L4 (context theft — stealing context)
 * 6. L5-N (behavioral — assumptions, skip verification, etc.)
 * 7. L6 (kraken protection)
 * 8. L7 (coordination gates)
 */

import type { LayerRule } from '../types.js';
import { L0_IDENTITY } from './l0-identity.js';
import { L1_THEATRICAL } from './l1-theatrical.js';
import { L2_HIVE_POISON } from './l2-hive-poison.js';
import { L3_DELEGATION_ABUSE } from './l3-delegation-abuse.js';
import { L4_CONTEXT_THEFT } from './l4-context-theft.js';
import { L5_1_ASSUMPTIONS } from './l5-1-assumptions.js';
import { L5_2_SKIP_VERIFICATION } from './l5-2-skip-verification.js';
import { L5_3_OUTPUT_FABRICATION } from './l5-3-output-fabrication.js';
import { L5_4_RETARD_LOGIC } from './l5-4-retard-logic.js';
import { L5_5_SCOPE_CREEP } from './l5-5-scope-creep.js';
import { L6_ANTI_RETARD } from '../l6-anti-retard.js';
import { L6_KRAKEN_PROTECTION } from '../l6-kraken-protection.js';
import { L7_COORDINATION_GATES } from '../l7-coordination-gates.js';

export const DEFAULT_LAYERS: LayerRule[] = [
  L0_IDENTITY,          // Identity wall (special case)
  L1_THEATRICAL,        // Pipe-to-wc theatrical detection
  L2_HIVE_POISON,       // Hive memory corruption
  L3_DELEGATION_ABUSE,  // Unauthorized spawning
  L4_CONTEXT_THEFT,     // Context stealing
  L5_1_ASSUMPTIONS,     // "Probably works" claims
  L5_2_SKIP_VERIFICATION, // Skip verification claims
  L5_3_OUTPUT_FABRICATION, // Fabricated output claims
  L5_4_RETARD_LOGIC,    // Basic logic failures
  L5_5_SCOPE_CREEP,    // Scope expansion
  L6_ANTI_RETARD,      // Anti-retard (excuses, denial, loops, theatrical deletion)
  L6_KRAKEN_PROTECTION, // Kraken zone protection
  L7_COORDINATION_GATES, // Coordination gates
];

// Re-export all layers for external access
export {
  L0_IDENTITY,
  L1_THEATRICAL,
  L2_HIVE_POISON,
  L3_DELEGATION_ABUSE,
  L4_CONTEXT_THEFT,
  L5_1_ASSUMPTIONS,
  L5_2_SKIP_VERIFICATION,
  L5_3_OUTPUT_FABRICATION,
  L5_4_RETARD_LOGIC,
  L5_5_SCOPE_CREEP,
  L6_ANTI_RETARD,
  L6_KRAKEN_PROTECTION,
  L7_COORDINATION_GATES,
};
