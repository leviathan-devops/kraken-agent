/**
 * Command Execute Hook — opencode run enforcement
 * 
 * This hook fires for `opencode run "message"` commands.
 * It checks the command/message for anti-derailment patterns
 * BEFORE the command is processed.
 * 
 * This closes the architecture gap where opencode run bypasses
 * chat.message and tool.execute.before hooks.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { setCurrentAgent } from './agent-state.js';
import { isSharkAgent } from '../../shared/agent-identity.js';
import * as path from 'node:path';
import * as fs from 'node:fs';

const CONTAINER_TEST_RESULT_FILE = 'ContainerTestResult.json';

function hasContainerTestEvidence(): boolean {
  const evidencePath = path.join(
    process.cwd(),
    '.shark',
    'evidence',
    'delivery',
    CONTAINER_TEST_RESULT_FILE
  );
  
  if (!fs.existsSync(evidencePath)) {
    return false;
  }
  
  try {
    const result = JSON.parse(fs.readFileSync(evidencePath, 'utf-8'));
    return result.overallPassed === true && result.passRate >= 0.96;
  } catch {
    return false;
  }
}

const THEATRICAL_PATTERNS = [
  /\|.*wc\s+-l/i,                    // ANY pipe to wc -l (counting)
  /wc\s+-l.*\|/i,                   // wc -l | (counting output)
  /cat\s+.*\|.*wc/i,                // cat ... | wc (counting cat output)
  /grep\s+.*\|.*wc/i,               // grep ... | wc (counting grep output)
  /echo\s+.*\|.*wc/i,               // echo ... | wc (counting echo)
  /ls\s+.*\|.*wc/i,                  // ls | wc (counting ls)
  /wc\s+-l.*dist\//i,               // wc -l dist/ (build verification)
  /wc\s+-l.*src\//i,                // wc -l src/ (source verification)
  /wc\s+-l.*build\//i,              // wc -l build/ (build verification)
  /\|.*tee/i,                       // pipe to tee (theater)
  /\|.*>.*\./i,                      // pipe to file (saving verification)
  /grep.*setCurrentAgent.*src/i,    // searching for brain patterns
  /grep.*isSharkAgent.*src/i,      // searching for agent patterns
  /grep.*guardian.*src/i,           // searching for guardian patterns
];

const FAKE_TEST_PATTERNS = [
  /node\s+run-tests?\.js/i,
  /node\s+verify.*\.mjs/i,
  /npm\s+(run\s+)?test/i,
  /yarn\s+(run\s+)?test/i,
  /jest/i,
  /vitest/i,
  /mocha/i,
  /jasmine/i,
  /bun\s+test/i,
  /pytest/i,
  /python.*-m.*pytest/i,
  /go\s+test/i,
  /cargo\s+test/i,
  /ruby\s+-Itest/i,
  /rspec/i,
];

const LEGITIMATE_PATTERNS = [
  /mkdir\s+-p/i,                    // Creating directories
  /cp\s+-r/i,                       // Copying directories
  /mv\s+/i,                         // Moving files
  /cat\s+[^\|]+$/i,                 // cat file.js (no pipe = read)
  /cat\s+[^\|]+\s*\|?\s*grep/i,    // cat file | grep pattern (legitimate search)
  /head\s+-[0-9]+\s+/i,            // head -20 file (read)
  /tail\s+-[0-9]+\s+/i,            // tail -20 file (read)
  /grep\s+-[rEn]+.*[^\|]$/i,       // grep -r pattern dir (search without counting)
  /grep\s+[^\|]+$/i,               // grep pattern file (search without counting)
  /find\s+.*-name/i,                // find files
  /test\s+-d/i,                     // test directory
  /test\s+-x/i,                     // test executable
  /ls\s+-[la]/i,                    // ls -la (legitimate list)
];

const WRONG_CONTAINER_PATTERNS = [
  /opencode\s+container\s+run/i,
  /opencode\s+container\s+start/i,
  /opencode\s+container\s+exec/i,
  /opencode\s+run\s+/i,
];

const SOURCE_INSPECTION_PATTERNS = [
  /^\s*(echo|cat|printf).*>.*src\//i,
  /^\s*sed\s+-i.*src\//i,
  /^\s*tee\s+.*src\//i,
  />\s*.*src\//i,
  /&\s*>>\s*.*src\//i,
];

const HOST_FALLBACK_PATTERNS = [
  /host.*testing.*already.*works/i,
  /fall.*back.*to.*host/i,
  /host.*already.*proves/i,
  /local.*works.*container.*not.*needed/i,
  /since.*host.*works/i,
  /skip.*container.*test/i,
  /container.*not.*necessary/i,
  /container.*not.*needed/i,
  /not.*need.*container/i,
  /skip.*container/i,
  /use.*host.*instead/i,
  /host.*prove.*it.*works/i,
  /already.*proven.*to.*work/i,
  /already.*verified.*on.*host/i,
  /already.*tested.*on.*local/i,
];

const SUCCESS_CLAIM_PATTERNS = [
  /it.*works.*trust.*me/i,
  /trust.*me.*it.*works/i,
  /believe.*me.*it.*works/i,
  /already.*verified.*by.*myself/i,
  /already.*tested.*and.*works/i,
  /already.*proven.*to.*work/i,
  /obviously.*correct/i,
  /clearly.*works/i,
  /self.*evidently.*correct/i,
  /in.*my.*assessment.*it.*works/i,
  /in.*my.*experience.*it.*works/i,
  /based.*on.*my.*analysis.*works/i,
  /no.*need.*for.*test/i,
  /no.*need.*for.*verification/i,
  /no.*further.*test.*needed/i,
];

const MODEL_RESTRICTION_PATTERNS = [
  /only.*gpt/i,
  /only.*claude/i,
  /only.*gemini/i,
  /only.*llama/i,
  /must.*use.*gpt/i,
  /must.*use.*claude/i,
  /restricted.*to.*model/i,
  /model.*quota/i,
  /model.*limit/i,
  /rate.*limit.*excuse/i,
  /api.*key.*issue/i,
  /can't.*afford.*model/i,
  /too.*expensive.*model/i,
  /model.*cost.*too.*high/i,
  /switch.*model.*理由/i,
];

const MOCK_STUB_PATTERNS = [
  /mock.*data/i,
  /stub.*data/i,
  /fake.*data/i,
  /dummy.*data/i,
  /sample.*data/i,
  /test.*data.*only/i,
  /mocked.*response/i,
  /stubbed.*response/i,
  /fake.*api/i,
  /hardcoded.*response/i,
  /static.*json.*instead/i,
  /no.*real.*api/i,
];

const SIMPLIFICATION_PATTERNS = [
  /over.*simplif/i,
  /overly.*simplif/i,
  /too.*simpl/i,
  /oversimplif/i,
  /hand.*wave/i,
  /handwave/i,
  / gloss.*over /i,
  /glossed.*over/i,
  /skip.*detail/i,
  /skip.*nuance/i,
  /oversimplif/i,
];

const CONFUSION_PRETENSE_PATTERNS = [
  /it.*somewhat.*works/i,
  /sorta.*works/i,
  /kinda.*works/i,
  /more.*or.*less/i,
  / mostly .*works/i,
  /approximately.*correct/i,
  / basically .*correct/i,
  / essentially .*works/i,
  / nominally .*functional/i,
  / partially .*implemented/i,
  / partially .*working/i,
  /somewhat.*correct/i,
];

const SCOPE_CREEP_PATTERNS = [
  /while.*at.*it/i,
  /while.*we.*re.*at.*it/i,
  /at.*the.*same.*time/i,
  /also.*need.*to/i,
  /might.*as.*well/i,
  /顺便/i,
  /顺便说一下/i,
  /just.*to.*be.*thorough/i,
  /for.*completeness/i,
  /one.*more.*thing/i,
  /oh.*and.*also/i,
  /on.*the.*side/i,
];

const UNDERMINING_PATTERNS = [
  /not.*worth.*the.*effort/i,
  /too.*much.*work/i,
  /not.*worth.*it/i,
  /diminishing.*returns/i,
  / marginal .*benefit/i,
  / minimal .*gain/i,
  /savvy.*engineer.*would/i,
  /experienced.*developer.*would/i,
  /realistic.*timeline/i,
  /realistically/i,
  / practically .*impossible/i,
  / realistically .*impractical/i,
];

const IMPATIENCE_PATTERNS = [
  /let's.*just.*move.*on/i,
  /let's.*skip.*to.*the.*end/i,
  /just.*ship.*it/i,
  /good.*enough/i,
  /close.*enough/i,
  /ship.*it/i,
  /just.*deploy/i,
  /fuck.*it/i,
  / ship .*now/i,
  / deploy .*now/i,
  /let's.*hurry/i,
];

const SELF_REFERENCE_PATTERNS = [
  /i.*have.*verified.*that/i,
  /i.*verified.*it.*works/i,
  /my.*verification.*shows/i,
  /i.*tested.*it.*works/i,
  /i.*ran.*it.*and.*works/i,
  /my.*testing.*confirms/i,
  /i.*know.*it.*works/i,
  /i.*am.*certain.*it.*works/i,
  /my.*assessment.*is/i,
  /in.*my.*assessment/i,
  /my.*analysis.*shows/i,
];

function checkHostFallback(text: string): void {
  for (const pattern of HOST_FALLBACK_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-DERAILMENT L5.1] Host fallback detected. ` +
        `Host testing ≠ container testing. Container isolation is REQUIRED for ship gate.`
      );
    }
  }
}

function checkSuccessClaim(text: string): void {
  for (const pattern of SUCCESS_CLAIM_PATTERNS) {
    if (pattern.test(text)) {
      if (!hasContainerTestEvidence()) {
        throw new Error(
          `[ANTI-DERAILMENT L5.2] Success claim without proof. ` +
          `MECHANICAL PROOF REQUIRED: Container test evidence (passRate >= 0.96). ` +
          `Run: opencode run "shark-test-runner" --agent shark`
        );
      }
    }
  }
}

function checkImpatience(text: string): void {
  for (const pattern of IMPATIENCE_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-DERAILMENT L5.9] Impatience detected. ` +
        `Proper verification takes time. Do not skip required steps.`
      );
    }
  }
}

function checkFakeTestRunner(text: string): void {
  for (const pattern of FAKE_TEST_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-SLOP L2] Fake test runner detected: "${text}". ` +
        `Tests must run via OpenCode hooks. Use: opencode run "shark-test-runner"`
      );
    }
  }
}

function checkSourceInspection(text: string): void {
  for (const pattern of SOURCE_INSPECTION_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-SLOP L3] Source inspection detected: "${text}". ` +
        `File existence ≠ runtime verification. Use actual execution.`
      );
    }
  }
}

function checkWrongContainer(text: string): void {
  for (const pattern of WRONG_CONTAINER_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-SLOP L4] Wrong container command detected: "${text}". ` +
        `Use: opencode run "command" (not opencode container run)`
      );
    }
  }
}

function checkSelfReference(text: string): void {
  for (const pattern of SELF_REFERENCE_PATTERNS) {
    if (pattern.test(text)) {
      if (!hasContainerTestEvidence()) {
        throw new Error(
          `[ANTI-DERAILMENT L5.10] Self-reference claim without proof. ` +
          `Self-verification ≠ mechanical proof. ` +
          `MECHANICAL PROOF REQUIRED: Container test evidence.`
        );
      }
    }
  }
}

function checkModelRestriction(text: string): void {
  for (const pattern of MODEL_RESTRICTION_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-DERAILMENT L5.3] Model restriction excuse detected. ` +
        `Quality gates apply regardless of model choice.`
      );
    }
  }
}

function checkMockStub(text: string): void {
  for (const pattern of MOCK_STUB_PATTERNS) {
    if (pattern.test(text)) {
      if (!hasContainerTestEvidence()) {
        throw new Error(
          `[ANTI-DERAILMENT L5.4] Mock/stub data detected. ` +
          `MECHANICAL PROOF REQUIRED: Container test evidence. ` +
          `Real data + real execution required for ship gate.`
        );
      }
    }
  }
}

function checkSimplification(text: string): void {
  for (const pattern of SIMPLIFICATION_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-DERAILMENT L5.5] Oversimplification detected. ` +
        `Nuance matters. Do not hand-wave complex aspects.`
      );
    }
  }
}

function checkConfusionPretense(text: string): void {
  for (const pattern of CONFUSION_PRETENSE_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-DERAILMENT L5.6] Confusion pretense detected. ` +
        `If uncertain, admit it. "Somewhat works" is not an acceptable status.`
      );
    }
  }
}

function checkTheatricalVerificationCmd(text: string): void {
  for (const pattern of LEGITIMATE_PATTERNS) {
    if (pattern.test(text)) {
      return;
    }
  }
  
  for (const pattern of THEATRICAL_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-SLOP L1] Counting theater detected: "${text}". ` +
        `Verification requires running, not counting.`
      );
    }
  }
}

function checkScopeCreep(text: string): void {
  for (const pattern of SCOPE_CREEP_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-DERAILMENT L5.7] Scope creep detected. ` +
        `Stay on task. Use separate task for new items.`
      );
    }
  }
}

function checkUndermining(text: string): void {
  for (const pattern of UNDERMINING_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[ANTI-DERAILMENT L5.8] Undermining detected. ` +
        `Quality gates exist for reason. Do not use "not worth it" excuses.`
      );
    }
  }
}

function checkMessageEnforcement(text: string): void {
  checkTheatricalVerificationCmd(text);
  checkFakeTestRunner(text);
  checkSourceInspection(text);
  checkWrongContainer(text);
  checkHostFallback(text);
  checkSuccessClaim(text);
  checkModelRestriction(text);
  checkMockStub(text);
  checkSimplification(text);
  checkConfusionPretense(text);
  checkScopeCreep(text);
  checkUndermining(text);
  checkImpatience(text);
  checkSelfReference(text);
}

export function createCommandExecuteHook(): Hooks['command.execute.before'] {
  return async (input, output) => {
    const { command, arguments: args } = input;

    if (!command) {
      return;
    }

    if (command === 'run' && args) {
      const agentMatch = args.match(/--agent\s+(\S+)/);
      const agentName = agentMatch ? agentMatch[1] : null;

      // NOT A SHARK AGENT — Shark firewall does not apply
      if (!agentName || !isSharkAgent(agentName)) {
        return;
      }

      setCurrentAgent(agentName);

      const agentIndex = args.indexOf('--agent');
      const message = agentIndex > 0 ? args.substring(0, agentIndex).trim() : args;

      if (message && message.length > 0) {
        checkMessageEnforcement(message);
      }
    }
  };
}
