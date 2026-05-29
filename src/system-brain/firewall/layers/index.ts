/**
 * src/system-brain/firewall/layers/index.ts
 *
 * DEFAULT_LAYERS — MILITARY GRADE ordered list of all layer rules.
 * Evaluated in order — first match wins.
 *
 * OCTOPUS ARCHITECTURE:
 * Each layer is an autonomous ARM. Order matters because
 * some arms (L0 identity) must fire before others (L10 container).
 *
 * Layer order (16 layers):
 * 1. L0 — Identity wall (special case)
 * 2. L1 — Theatrical detection (pipe counting)
 * 3. L2 — Hive poison (corruption)
 * 4. L3 — Delegation abuse (unauthorized spawning)
 * 5. L4 — Context theft (stealing context)
 * 6. L5-1 — Assumptions ("probably works")
 * 7. L5-2 — Skip verification
 * 8. L5-3 — Output fabrication
 * 9. L5-4 — Retard logic (self-contradiction)
 * 10. L5-5 — Scope creep
 * 11. L6-AR — Anti-Retard (multi-signal fusion, 150+ patterns)
 * 12. L6-KP — Kraken protection (system file zones)
 * 13. L7 — Coordination gates (real validation)
 * 14. L8 — Anti-Bullshit (environment-blaming, honesty-dodges)
 * 15. L9 — Feature Omission (blueprint skipping, "nice to have")
 * 16. L10 — Container Enforcement (no ship without container test)
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
import { L8_ANTI_BULLSHIT } from './l8-anti-bullshit.js';
import { L9_FEATURE_OMISSION } from './l9-feature-omission.js';
import { L10_CONTAINER_ENFORCEMENT } from './l10-container-enforcement.js';

export const DEFAULT_LAYERS: LayerRule[] = [
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
  L8_ANTI_BULLSHIT,
  L9_FEATURE_OMISSION,
  L10_CONTAINER_ENFORCEMENT,
];

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
  L8_ANTI_BULLSHIT,
  L9_FEATURE_OMISSION,
  L10_CONTAINER_ENFORCEMENT,
};
