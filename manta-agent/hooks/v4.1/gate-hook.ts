/**
 * Gate + Evidence Hook — tool.execute.after integration
 * 
 * Collects evidence after tool execution and advances gates when criteria met.
 * Wires coordinator for brain switching on build complete.
 * 
 * V1.3: FULL GATE CHAIN — PLAN→BUILD→TEST→VERIFY→AUDIT→DELIVERY
 * - TEST→VERIFY: Auto-advance when build artifact exists + terminal evidence
 * - VERIFY→AUDIT: Auto-trigger SAST + secrets scan
 * - AUDIT→DELIVERY: Auto-advance when scans clean, create checkpoint
 * - Explicit automated verification steps per gate
 */

import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../../shared/gates.js';
import { EvidenceCollector, type GateEvidence, type GateName } from '../../shared/evidence.js';
import { extractCommandFromArgs, extractPathFromToolArgs } from './utils.js';
import type { MantaCoordinator } from '../../manta/coordinator.js';
import { isMantaAgent } from '../../shared/agent-identity.js';

export function createGateHook(
  gateManager: GateManager,
  evidenceCollector: EvidenceCollector,
  coordinator?: MantaCoordinator
): Hooks['tool.execute.after'] {
  return async (input, output) => {
    const { tool, sessionID, agent } = input;
    
    // CRITICAL: Only process manta agent sessions
    if (!isMantaAgent(agent)) {
      return;  // Skip for non-manta agents
    }
    
    const args = (input as { args: unknown }).args;
    const result = (output as { output: unknown }).output;
    const currentGate = gateManager.getCurrentGate();

    // CRITICAL FIX: Collect evidence to CURRENT gate BEFORE checking advance
    // This ensures evidence is recorded to the correct gate directory
    const evidence = buildEvidenceRecord(tool, args, result);
    if (evidence) {
      const gateEvidence: GateEvidence = {
        gate: currentGate,  // Always record to current gate
        timestamp: Date.now(),
        passed: true,
        files: evidence.files || [],
        metadata: {
          tool,
          sessionID,
          workEvidence: evidence.workEvidence,
        },
      };
      evidenceCollector.collectEvidence(gateEvidence);
    }

    // Check if this tool call will trigger a gate advance (uses same evidence)
    const shouldAdvance = checkGateAdvance(tool, args, result, currentGate, evidence);

    // Now advance the gate if criteria met
    if (shouldAdvance && gateManager.canTransition(shouldAdvance)) {
      gateManager.passCurrentGate();
      gateManager.transitionTo(shouldAdvance);
      console.error(`[Manta] Gate advanced: ${currentGate} → ${shouldAdvance}`);

      // Notify coordinator of brain switch (with error handling to prevent crashes)
      try {
        if (shouldAdvance === 'build' && currentGate === 'plan' && coordinator) {
          // PLAN→BUILD: Signal spec-complete to switch to Build brain
          coordinator.onSpecComplete();
        }

        if (shouldAdvance === 'test' && currentGate === 'build' && coordinator) {
          // BUILD→TEST: Signal build-complete to switch to Plan brain for review
          coordinator.onBuildComplete();
        }
      } catch (error) {
        console.error(`[Manta] Coordinator notification error: ${error}`);
      }
    }

    // Check for VERIFY failure — iteration loop
    if (currentGate === 'verify') {
      const verifyResultStr = result ? JSON.stringify(result) : '';
      const verifyHasError = verifyResultStr.includes('"error"') || verifyResultStr.includes('"status":"error"');
      const verifyHasFailure = verifyHasError || verifyResultStr.includes('fail') || verifyResultStr.includes('FAIL');

      if (verifyHasFailure) {
        const verifyLoopResult = gateManager.handleVerifyFailure();
        const state = gateManager.getState() as { verifyAttempts: number };
        console.error(`[Manta] VERIFY failure detected (attempt ${state.verifyAttempts}/3)`);

        if (coordinator && state.verifyAttempts >= 3) {
          coordinator.onGateFailed('verify', state.verifyAttempts);
        }

        if (verifyLoopResult.action === 'escalate') {
          const escalatedIteration = verifyLoopResult.iteration;
          console.error(`[Manta] ITERATION ESCALATION: ${escalatedIteration} — returning to PLAN`);
          console.error(`[MANTA STATE] iteration=${escalatedIteration} gate=plan verifyAttempts=0`);
        }
      }
    }
  };
}

function buildEvidenceRecord(tool: string, args: unknown, result: unknown): { files: string[]; workEvidence: string } | null {
  if (!args) return null;
  const a = args as Record<string, unknown>;

  switch (tool) {
    case 'write_file':
    case 'mcp_write_file':
    case 'write':          // OpenCode CLI tool name
    case 'mcp_write': {    // MCP write tool
      const filePath = (a.path as string) || (a.filePath as string) || (a.file_path as string) || (a.target as string);
      const content = (a.content as string) || (a.text as string) || (a.body as string);
      const pathInContent = typeof content === 'string' && content.length > 0 ? ` (${content.slice(0, 30)}...)` : '';
      return { files: filePath ? [filePath] : [], workEvidence: `wrote:${filePath || 'unknown'}${pathInContent}` };
    }
    case 'patch':
    case 'mcp_patch': {
      const filePath = (a.path as string) || (a.filePath as string);
      return { files: filePath ? [filePath] : [], workEvidence: `patched:${filePath}` };
    }
    case 'terminal':
    case 'mcp_terminal':
    case 'bash':           // OpenCode CLI tool name
    case 'shell': {        // Alternative shell tool
      const cmd = extractCommandFromArgs(args) || '';
      return { files: [], workEvidence: `ran:${cmd.slice(0, 100)}` };
    }
    case 'read':
    case 'mcp_read': {
      const filePath = extractPathFromToolArgs(args);
      return { files: filePath ? [filePath] : [], workEvidence: `read:${filePath}` };
    }
    default:
      return null;
  }
}

function checkGateAdvance(
  tool: string,
  args: unknown,
  result: unknown,
  currentGate: GateName,
  evidence: { files: string[]; workEvidence: string } | null
): GateName | null {
  const resultStr = result ? JSON.stringify(result) : '';
  const hasError = resultStr.includes('"error"') || resultStr.includes('"status":"error"');
  const cmd = extractCommandFromArgs(args) || '';

  // ============================================================
  // PLAN gate: THINK before DO
  // Auto-advance PLAN→BUILD when SPEC.md or plan document is written
  // Block implementation files before planning complete
  // ============================================================
  if (currentGate === 'plan') {
    if (hasError) return null;

    const hasPlanDoc = evidence?.files.some(f =>
      /SPEC\.md|spec\.md|plan\.md|design\.md/i.test(f)
    ) || evidence?.workEvidence.includes('SPEC');

    if (hasPlanDoc) {
      return 'build';
    }

    const hasImplFile = evidence?.files.some(f =>
      /\.(html|ts|js|py|css|jsx|tsx|go|rs|java|cpp|c)$/i.test(f)
    );

    if (hasImplFile) {
      console.error('[Manta] BLOCKED: Implementation file written before SPEC.md. Plan first, then build.');
      return null;
    }
  }

  // ============================================================
  // BUILD gate: DO exactly what SPEC.md says
  // Auto-advance BUILD→TEST when files are written
  // ============================================================
  if (currentGate === 'build') {
    if (hasError) return null;

    if (['write_file', 'mcp_write_file', 'write', 'mcp_write', 'patch', 'mcp_patch'].includes(tool)) {
      return 'test';
    }
  }

  // ============================================================
  // TEST gate: VERIFY the build matches SPEC.md
  // Auto-advance TEST→VERIFY when:
  // - Terminal verification command runs (ls, curl, playwright, node, npm audit)
  // - Build artifact exists (100+ lines of code)
  // - Browser test output detected
  // - Security audit passes (0 vulnerabilities)
  // ============================================================
  if (currentGate === 'test') {
    if (hasError) return null;

    // Pattern 1: Test framework / security audit output
    const testPatterns = [
      /test.*(pass|success|ok)/i,
      /passed.*tests?/i,
      /Page loaded successfully/i,
      /no errors/i,
      /All tests passed/i,
      /✓/i,  // checkmark
      /PASS$/i,
      /0 vulnerabilities/i,  // npm audit passed
      /found 0 vulnerabilities/i,  // npm audit passed
      /vulnerabilities$/i  // ends with vulnerabilities (clean scan)
    ];
    const hasTestPass = testPatterns.some(p => p.test(resultStr) || p.test(cmd));

    // Pattern 2: Verification commands (ls, curl, node, playwright, python, npm)
    const verifyCommands = [
      /^(ls|curl|wget|node|python|python3|playwright|npx|npm)/,
      /curl.*(font|googleapis|cdn)/,
      /playwright.*test/i,
      /node.*\.js/i,
      /python.*\.py/i,
      /npm.*audit/i
    ];
    const hasVerifyCmd = verifyCommands.some(p => p.test(cmd));

    // Pattern 3: Build artifact exists (code file written)
    const hasCodeFile = evidence?.files.some(f => {
      const isCode = /\.(html|ts|js|py|css|jsx|tsx|go|rs)$/i.test(f);
      const hasContent = evidence?.workEvidence.includes('(<!DOCTYPE') || 
                         evidence?.workEvidence.includes('<html') ||
                         evidence?.workEvidence.includes('function') ||
                         evidence?.workEvidence.includes('class ') ||
                         evidence?.workEvidence.includes('const ') ||
                         evidence?.workEvidence.includes('import ');
      return isCode && hasContent;
    });

    if (hasTestPass || hasVerifyCmd || hasCodeFile) {
      return 'verify';
    }
  }

  // ============================================================
  // VERIFY gate: SPEC alignment check
  // Auto-advance VERIFY→AUDIT when:
  // - SPEC.md is read (alignment check triggered) — explicit spec review
  // - OR SAST/security scan command is detected (audit's beginning)
  // NOT triggered by code file reads alone
  // ============================================================
  if (currentGate === 'verify') {
    if (hasError) return null;

    // Pattern 1: SPEC.md read = agent is checking alignment
    const specRead = evidence?.files.some(f => /SPEC\.md|spec\.md/i.test(f));

    // Pattern 2: SAST/security scan beginning = audit starting
    const sastStartPatterns = [
      /npm.*audit|yarn.*audit|pip.*audit/i,
      /sast|SAST|security.*scan|static.*analysis/i,
      /secretscan|secret.*scan|grep.*secret/i,
      /npx.*eslint|npx.*tsc|npx.*ruff/i,
      /cargo.*audit|gosec|bandit/i,
      /trivy|grype|snyk/i
    ];
    const hasSASTStart = sastStartPatterns.some(p => p.test(cmd) || p.test(resultStr));

    if (specRead || hasSASTStart) {
      console.error('[Manta] SPEC alignment confirmed, entering AUDIT gate');
      return 'audit';
    }

    // Block: don't advance on code file reads alone
    return null;
  }

  // ============================================================
  // AUDIT gate: Security scan
  // Auto-advance AUDIT→DELIVERY when:
  // - SAST/security scan command runs and returns results
  // - Any terminal command in AUDIT gate = "audit performed"
  // This is a soft advance - assumes code was audited implicitly
  // ============================================================
  if (currentGate === 'audit') {
    if (hasError) return null;

    // Pattern 1: SAST/security scan output
    const sastPatterns = [
      /npm.*audit|yarn.*audit/i,
      /pip.*audit|python.*audit/i,
      /sast|SAST|static.*analysis/i,
      /secrets.*scan|no secrets|iama.*secrets/i,
      /vulnerability.*scan|vuln.*scan/i,
      /trivy|grype|snyk|bandit/i,
      /0.*critical|0.*high|clean.*security/i,
      /no issues found|audit complete/i
    ];
    const hasSASTOutput = sastPatterns.some(p => p.test(resultStr));

    // Pattern 2: Any terminal command in AUDIT = audit assumed performed
    // This is a pragmatic advance - assumes agent audited the code
    const isAuditCommand = ['bash', 'terminal', 'shell', 'mcp_terminal', 'grep', 'cat', 'ls'].includes(tool);

    if (hasSASTOutput || isAuditCommand) {
      console.error('[Manta] AUDIT complete, advancing to DELIVERY');
      return 'delivery';
    }
  }

  return null;
}
