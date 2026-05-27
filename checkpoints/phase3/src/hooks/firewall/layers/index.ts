import type { LayerRule } from '../types.js';
import { L0_IDENTITY } from './l0-identity.js';
import { L1_THEATRICAL } from './l1-theatrical.js';
import { L2_TEST_BYPASS } from './l2-test-bypass.js';
import { L3_INSPECTION } from './l3-inspection.js';
import { L4_CONTAINER } from './l4-container.js';
import { L5_1_HOST_FALLBACK } from './l5.1-host-fallback.js';
import { L5_2_SUCCESS_CLAIM } from './l5.2-success-claim.js';
import { L5_3_MODEL_RESTRICTION } from './l5.3-model-restriction.js';
import { L5_4_MOCK_STUB } from './l5.4-mock-stub.js';
import { L5_5_SIMPLIFICATION } from './l5.5-simplification.js';
import { L5_6_CONFUSION } from './l5.6-confusion.js';
import { L5_7_SCOPE_CREEP } from './l5.7-scope-creep.js';
import { L5_8_UNDERMINING } from './l5.8-undermining.js';
import { L5_9_IMPATIENCE } from './l5.9-impatience.js';
import { L5_10_SELF_REFERENCE } from './l5.10-self-reference.js';
import { L5_11_OPENCODE_RUN_BAN } from './l5.11-opencode-run-ban.js';

export const DEFAULT_LAYERS: LayerRule[] = [
  L0_IDENTITY,
  L1_THEATRICAL,
  L2_TEST_BYPASS,
  L3_INSPECTION,
  L4_CONTAINER,
  L5_1_HOST_FALLBACK,
  L5_2_SUCCESS_CLAIM,
  L5_3_MODEL_RESTRICTION,
  L5_4_MOCK_STUB,
  L5_5_SIMPLIFICATION,
  L5_6_CONFUSION,
  L5_7_SCOPE_CREEP,
  L5_8_UNDERMINING,
  L5_9_IMPATIENCE,
  L5_10_SELF_REFERENCE,
  L5_11_OPENCODE_RUN_BAN,
];

export {
  L0_IDENTITY,
  L1_THEATRICAL,
  L2_TEST_BYPASS,
  L3_INSPECTION,
  L4_CONTAINER,
  L5_1_HOST_FALLBACK,
  L5_2_SUCCESS_CLAIM,
  L5_3_MODEL_RESTRICTION,
  L5_4_MOCK_STUB,
  L5_5_SIMPLIFICATION,
  L5_6_CONFUSION,
  L5_7_SCOPE_CREEP,
  L5_8_UNDERMINING,
  L5_9_IMPATIENCE,
  L5_10_SELF_REFERENCE,
  L5_11_OPENCODE_RUN_BAN,
};
