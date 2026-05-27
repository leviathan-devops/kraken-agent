/**
 * Firewall Patterns — v4.8.4 Contextual Intelligence
 * 
 * SINGLE SOURCE OF TRUTH. All hooks import from here.
 * This version implements Contextual Precision to avoid false positives.
 */

export type Gate = 'plan' | 'build' | 'test' | 'verify' | 'audit' | 'delivery';

export interface ContextualPattern {
  label: string;
  pattern: RegExp;
  forbiddenIn: Gate[];
  allowedIn: Gate[];
  description: string;
}

export const CONTEXTUAL_FIREWALL_RULES: ContextualPattern[] = [
  {
    label: 'Theatrical Counting',
    pattern: /\|.*wc\s+-l/i,
    forbiddenIn: ['test', 'verify', 'audit', 'delivery'],
    allowedIn: ['plan', 'build'],
    description: 'Counting lines is theatrical during verification but legitimate during planning.'
  },
  {
    label: 'Fake Test Runner',
    pattern: /npm\s+(run\s+)?test|jest|vitest|mocha|jasmine/i,
    forbiddenIn: ['test', 'verify', 'audit', 'delivery'],
    allowedIn: ['plan', 'build'],
    description: 'Standard test runners are blocked during verification to force the use of the authenticated shark-test-runner.'
  },
  {
    label: 'Source Inspection',
    pattern: /test\s+-[fed]\s+.*|ls\s+-l.*(dist|src|build)\//i,
    forbiddenIn: ['verify', 'audit', 'delivery'],
    allowedIn: ['plan', 'build', 'test'],
    description: 'Checking for file existence is a proxy for success and is banned in the final gates.'
  },
  {
    label: 'Wrong Container',
    pattern: /opencode\s+container\s+(run|start|exec)/i,
    forbiddenIn: ['plan', 'build', 'test', 'verify', 'audit', 'delivery'],
    allowedIn: [],
    description: 'Direct container manipulation is always forbidden.'
  },
];

export const BEHAVIORAL_PATTERNS: Array<{ label: string; pattern: RegExp; requireEvidence?: boolean }> = [
  { label: 'Confused avoidance', pattern: /i('?m| am) confused about (the )?(goal|task|purpose|direction)/i },
  { label: 'Already works claim', pattern: /(host|local).*(already|proves).*(works|correct)/i },
  { label: 'Simplify excuse', pattern: /(maybe|perhaps).*simplif/i },
  { label: 'Goal reset', pattern: /what was the (user.?s |original )?goal/i },
  { label: 'Basic solution shortcut', pattern: /(just|simply) use .*(instead|rather)/i },
  { label: 'Self-assessment claim', pattern: /in my (assessment|experience|analysis)/i, requireEvidence: true },
  { label: 'Scope expansion', pattern: /(while|whilst).*(at it|we.?re at it|also)|should also (fix|add|do)/i },
  { label: 'False fix claim', pattern: /(should be |is )?fixed now|should (be |)working now/i },
  { label: 'Superficial check', pattern: /let me (just )?(check|verify|confirm) (real )?quick/i },
  { label: 'Trust me deflection', pattern: /trust me|i promise|believe me|it.?ll be fine/i, requireEvidence: true },
  { label: 'Task avoidance', pattern: /(maybe|perhaps|let.?s).*(come back|revisit|later|another time)/i },
  { label: 'Overthinking stall', pattern: / (hmm|um|uh).*(thinking|wonder|ponder)/i },
  { label: 'Derail: reading sensitive', pattern: /read(ing)? .*(ssh|key|credential|secret|token|passwd|shadow|\.env|auth)/i },
  { label: 'Derail: exploring system', pattern: /let me (explore|check|look at|see).*(system|root|other|different|whole)/i },
  { label: 'Derail: data exfil', pattern: /(dump|print|output|show) (full|entire|all|complete).*(key|secret|credential|config)/i },
];

export const HOST_FALLBACK_PATTERNS = [
  /host.*testing.*already.*works/i, /fall.*back.*to.*host/i,
  /host.*already.*proves/i, /local.*works.*container.*not.*needed/i,
  /since.*host.*works/i, /skip.*container.*test/i,
  /container.*not.*necessary/i, /container.*not.*needed/i,
  /not.*need.*container/i, /skip.*container/i,
  /use.*host.*instead/i, /host.*prove.*it.*works/i,
  /already.*proven.*to.*work/i, /already.*verified.*on.*host/i,
  /already.*tested.*on.*local/i,
];

export const SUCCESS_CLAIM_PATTERNS = [
  /it.*works.*trust.*me/i, /trust.*me.*it.*works/i, /believe.*me.*it.*works/i,
  /already.*verified.*by.*myself/i, /already.*tested.*and.*works/i, /already.*proven.*to.*work/i,
  /obviously.*correct/i, /clearly.*works/i, /self.*evidently.*correct/i,
  /in.*my.*assessment.*it.*works/i, /in.*my.*experience.*it.*works/i, /based.*on.*my.*analysis.*works/i,
  /no.*need.*for.*test/i, /no.*need.*for.*verification/i, /no.*further.*test.*needed/i,
];

export const LAUNDERING_PATTERNS = [
  /summary of results/i, /pass rate/i, /completed \d+ tests/i, /total tests: \d+/i,
  /raw logs are omitted/i, /results summarized below/i, /summarizing the results/i,
  /here is the summary/i, /here'?s? a summary/i, /updated the todo list/i,
  /here is the results/i, /tests.*passed.*\d+\/\d+/i, /summary:.*\d+.*passed/i,
  /keep the chat clean/i, /chat clean/i,
];

export const MODEL_RESTRICTION_PATTERNS = [
  /only.*gpt/i, /only.*claude/i, /only.*gemini/i, /only.*llama/i,
  /must.*use.*gpt/i, /must.*use.*claude/i, /restricted.*to.*model/i,
  /model.*quota/i, /model.*limit/i, /rate.*limit.*excuse/i,
  /api.*key.*issue/i, /can't.*afford.*model/i,
  /too.*expensive.*model/i, /model.*cost.*too.*high/i, /switch.*model.*理由/i,
];

export const MOCK_STUB_PATTERNS = [
  /mock.*data/i, /stub.*data/i, /fake.*data/i, /dummy.*data/i,
  /sample.*data/i, /test.*data.*only/i, /mocked.*response/i,
  /stubbed.*response/i, /fake.*api/i, /hardcoded.*response/i,
  /static.*json.*instead/i, /no.*real.*api/i,
];

export const SIMPLIFICATION_PATTERNS = [
  /over.*simplif/i, /overly.*simplif/i, /too.*simpl/i, /oversimplif/i,
  /hand.*wave/i, /handwave/i, /gloss.*over/i, /glossed.*over/i,
  /skip.*detail/i, /skip.*nuance/i,
];

export const CONFUSION_PRETENSE_PATTERNS = [
  /it.*somewhat.*works/i, /sorta.*works/i, /kinda.*works/i,
  /more.*or.*less/i, /mostly.*works/i, /approximately.*correct/i,
  /basically.*correct/i, /essentially.*works/i, /nominally.*functional/i,
  /partially.*implemented/i, /partially.*working/i, /somewhat.*correct/i,
];

export const SCOPE_CREEP_PATTERNS = [
  /while.*at.*it/i, /while.*we.*re.*at.*it/i, /at.*the.*same.*time/i,
  /also.*need.*to/i, /might.*as.*well/i, /顺便/i, /顺便说一下/i,
  /just.*to.*be.*thorough/i, /for.*completeness/i, /one.*more.*thing/i,
  /oh.*and.*also/i, /on.*the.*side/i,
];

export const CROSS_AGENT_TOOLS = new Set([
  'hermes_remember', 'hermes_recall', 'hermes_context',
  'hive_remember', 'hive_context', 'hive_status',
  'memremember', 'memsearch', 'memread', 'membrowse', 'memcommit',
  'knowledge_remember', 'knowledge_recall', 'knowledge_query',
]);

export const CROSS_AGENT_PATTERNS = [
  /hermes_remember/i, /hermes_recall/i, /hermes_context/i,
  /hive_remember/i, /hive_context/i, /hive_status/i, /hive_mind/i,
  /memremember/i, /memsearch/i, /memread/i, /membrowse/i,
  /knowledge_remember/i, /knowledge_recall/i, /knowledge_query/i,
];

export const UNDERMINING_PATTERNS = [
  /not.*worth.*the.*effort/i, /too.*much.*work/i, /not.*worth.*it/i,
  /diminishing.*returns/i, /marginal.*benefit/i, /minimal.*gain/i,
  /savvy.*engineer.*would/i, /experienced.*developer.*would/i,
  /realistic.*timeline/i, /realistically/i,
  /practically.*impossible/i, /realistically.*impractical/i,
];

export const IMPATIENCE_PATTERNS = [
  /let's.*just.*move.*on/i, /let's.*skip.*to.*the.*end/i,
  /good.*enough/i, /close.*enough/i,
  /ship.*it/i, /just.*deploy/i, /ship\s+(it|now)\b/i,
  /deploy\s+now/i, /let's.*hurry/i,
];

export const SELF_REFERENCE_PATTERNS = [
  /i.*have.*verified.*that/i, /i.*verified.*it.*works/i,
  /my.*verification.*shows/i, /i.*tested.*it.*works/i,
  /i.*ran.*it.*and.*works/i, /my.*testing.*confirms/i,
  /i.*know.*it.*works/i, /i.*am.*certain.*it.*works/i,
  /my.*assessment.*is/i, /in.*my.*assessment/i, /my.*analysis.*shows/i,
];

export const DANGEROUS_TOOLS = new Set([
  'terminal', 'mcp_terminal', 'bash', 'mcp_bash',
  'write_file', 'mcp_write_file',
  'patch', 'mcp_patch',
  'edit', 'mcp_edit',
  'delete_file', 'mcp_delete_file'
]);

export const CONTAINER_TEST_RESULT_FILE = 'ContainerTestResult.json';

export const VERIFICATION_PATTERNS = [
  /verified( by|\.| and|$)/i,
  /confirmed working/i,
  /tested (and|&) (works|passes|verified)/i,
  /all tests pass(ed|ing)?/i,
  /ready to ship/i,
  /proven (to work|working|correct)/i,
];
