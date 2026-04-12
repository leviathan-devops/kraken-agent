/**
 * Mode Coordinator - Routes between modes and validates transitions
 */

import type { TridentBrainState } from '../index.js';

export type ModeType = 'planning' | 'problem-solving' | 'context-synthesis';

export interface LayerRequirement {
  name: string;
  description: string;
  validate: (artifacts: Map<string, string>) => ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  missing?: string[];
  reason?: string;
}

export interface ModeDefinition {
  name: string;
  maxLayer: number;
  layerNames: string[];
  requirements: Map<number, LayerRequirement[]>;
  allowedTools: string[];
  blockedTools: string[];
}

export class ModeCoordinator {
  private modes: Map<ModeType, ModeDefinition>;

  constructor() {
    this.modes = this.initializeModes();
  }

  private initializeModes(): Map<ModeType, ModeDefinition> {
    const modes = new Map<ModeType, ModeDefinition>();

    // Deep Planning Mode (3 layers)
    modes.set('planning', {
      name: 'Deep Planning Mode',
      maxLayer: 3,
      layerNames: ['Initial Plan', 'Detailed Workflow', 'Context Library'],
      requirements: new Map([
        [1, [
          { name: 'surfaceUnderstanding', description: 'Surface understanding documented', validate: (a) => this.checkArtifact(a, 'surfaceUnderstanding') },
          { name: 'firstPrinciples', description: '3+ first principles stated', validate: (a) => this.checkPrincipleCount(a, 'firstPrinciples', 3) },
          { name: 'constraints', description: '3+ constraints identified', validate: (a) => this.checkPrincipleCount(a, 'constraints', 3) },
          { name: 'successCriteria', description: 'Success criteria defined', validate: (a) => this.checkArtifact(a, 'successCriteria') },
          { name: 'openQuestions', description: '2+ open questions identified', validate: (a) => this.checkPrincipleCount(a, 'openQuestions', 2) }
        ]],
        [2, [
          { name: 'components', description: '5+ components identified', validate: (a) => this.checkPrincipleCount(a, 'components', 5) },
          { name: 'dependencies', description: '3+ dependencies mapped', validate: (a) => this.checkPrincipleCount(a, 'dependencies', 3) },
          { name: 'failureModes', description: '3+ failure modes identified', validate: (a) => this.checkPrincipleCount(a, 'failureModes', 3) }
        ]],
        [3, [
          { name: 'contextLibrary', description: 'Context library generated', validate: (a) => this.checkArtifact(a, 'contextLibrary') },
          { name: 'injectableOutput', description: 'Output is injectable format', validate: (a) => this.checkArtifact(a, 'injectableOutput') }
        ]]
      ]),
      allowedTools: ['read', 'grep', 'glob', 'ls', 'extract_code_blocks', 'symbols', 'imports', 'write', 'write_file'],
      blockedTools: ['bash', 'shell', 'npm', 'pip', 'curl', 'docker', 'terminal']
    });

    // Problem Solving Mode (6 layers)
    modes.set('problem-solving', {
      name: 'Problem Solving Mode',
      maxLayer: 6,
      layerNames: ['Assumption', 'Action', 'Observation', 'Gap Analysis', 'Meta-Reflection', 'Verification'],
      requirements: new Map([
        [1, [
          { name: 'explicitAssumption', description: 'Explicit assumption stated', validate: (a) => this.checkArtifact(a, 'assumption') },
          { name: 'reasoningChain', description: 'Reasoning chain documented', validate: (a) => this.checkArtifact(a, 'reasoningChain') },
          { name: 'successCriteria', description: 'Success criteria defined', validate: (a) => this.checkArtifact(a, 'successCriteria') },
          { name: 'confirmationCriteria', description: 'Confirmation/disproof criteria defined', validate: (a) => this.checkArtifact(a, 'confirmationCriteria') }
        ]],
        [2, [
          { name: 'exactCommand', description: 'Exact command specified', validate: (a) => this.checkArtifact(a, 'exactCommand') },
          { name: 'expectedOutput', description: 'Expected output documented', validate: (a) => this.checkArtifact(a, 'expectedOutput') },
          { name: 'environmentState', description: 'Environment state captured', validate: (a) => this.checkArtifact(a, 'environmentState') }
        ]],
        [3, [
          { name: 'rawEvidence', description: 'Raw evidence captured (not paraphrased)', validate: (a) => this.checkArtifact(a, 'rawEvidence') },
          { name: 'logsChecked', description: 'Logs checked', validate: (a) => this.checkArtifact(a, 'logsChecked') },
          { name: 'expectedVsActual', description: 'Expected vs actual comparison table', validate: (a) => this.checkArtifact(a, 'expectedVsActual') }
        ]],
        [4, [
          { name: 'gapAnalysis', description: 'Gap analysis documented', validate: (a) => this.checkArtifact(a, 'gapAnalysis') },
          { name: 'updatedHypothesis', description: 'Updated hypothesis stated', validate: (a) => this.checkArtifact(a, 'updatedHypothesis') },
          { name: 'nextAction', description: 'Next action tied to insight', validate: (a) => this.checkArtifact(a, 'nextAction') }
        ]],
        [5, [
          { name: 'whatIShouldHaveDone', description: '"What I Should Have Done" documented', validate: (a) => this.checkArtifact(a, 'whatIShouldHaveDone') },
          { name: 'patternExtracted', description: 'Pattern extracted', validate: (a) => this.checkArtifact(a, 'patternExtracted') },
          { name: 'systemicIssue', description: 'Systemic issue identified', validate: (a) => this.checkArtifact(a, 'systemicIssue') }
        ]],
        [6, [
          { name: 'targetEnvironmentExecution', description: 'Target environment execution verified', validate: (a) => this.checkArtifact(a, 'targetEnvironment') },
          { name: 'behaviorMatches', description: 'Behavior matches requirement', validate: (a) => this.checkArtifact(a, 'behaviorMatches') },
          { name: 'noRegressions', description: 'Regression check performed', validate: (a) => this.checkArtifact(a, 'regressionCheck') }
        ]]
      ]),
      allowedTools: ['read', 'grep', 'glob', 'ls', 'extract_code_blocks', 'symbols', 'imports', 'write', 'write_file'],
      blockedTools: ['bash', 'shell', 'npm', 'pip', 'curl', 'docker', 'terminal']
    });

    // Context Synthesis Mode (4 layers)
    modes.set('context-synthesis', {
      name: 'Context Synthesis Mode',
      maxLayer: 4,
      layerNames: ['Collection', 'Scoring', 'Compression', 'Injection'],
      requirements: new Map([
        [1, [
          { name: 't1SessionContext', description: 'T1 session context checked', validate: (a) => this.checkArtifact(a, 't1Session') },
          { name: 't2KnowledgeContext', description: 'T2 knowledge context checked', validate: (a) => this.checkArtifact(a, 't2Knowledge') },
          { name: 't3FileContext', description: 'T3 file context checked', validate: (a) => this.checkArtifact(a, 't3Files') },
          { name: 't4ToolContext', description: 'T4 tool context checked', validate: (a) => this.checkArtifact(a, 't4Tools') }
        ]],
        [2, [
          { name: 'allContextScored', description: 'All context items scored', validate: (a) => this.checkArtifact(a, 'allScored') },
          { name: 'rankedByScore', description: 'Context ranked by final score', validate: (a) => this.checkArtifact(a, 'ranked') },
          { name: 'topPriorities', description: 'Top priorities identified', validate: (a) => this.checkArtifact(a, 'priorities') }
        ]],
        [3, [
          { name: 'underTokenLimit', description: 'Under 2k token limit', validate: (a) => this.checkArtifact(a, 'underLimit') },
          { name: 'decisionsPreserved', description: 'Decision points preserved', validate: (a) => this.checkArtifact(a, 'decisionsPreserved') },
          { name: 'keyInsights', description: 'Key insights intact', validate: (a) => this.checkArtifact(a, 'insightsPreserved') }
        ]],
        [4, [
          { name: 'currentPosition', description: 'Current position documented', validate: (a) => this.checkArtifact(a, 'currentPosition') },
          { name: 'priorities', description: 'Priorities documented', validate: (a) => this.checkArtifact(a, 'injectionPriorities') },
          { name: 'synthesizedInsight', description: 'Synthesized insight included', validate: (a) => this.checkArtifact(a, 'synthesizedInsight') }
        ]]
      ]),
      allowedTools: ['read', 'grep', 'glob', 'ls', 'hermes_remember', 'hive_context', 'memread_session', 'kraken_hive_search', 'write', 'write_file'],
      blockedTools: ['bash', 'shell', 'npm', 'pip', 'curl', 'docker', 'terminal']
    });

    return modes;
  }

  private checkArtifact(artifacts: Map<string, string>, key: string): ValidationResult {
    if (artifacts.has(key)) {
      return { valid: true };
    }
    return { valid: false, missing: [key], reason: `Missing artifact: ${key}` };
  }

  private checkPrincipleCount(artifacts: Map<string, string>, key: string, minCount: number): ValidationResult {
    const value = artifacts.get(key);
    if (!value) {
      return { valid: false, missing: [key], reason: `Missing: ${key}` };
    }
    
    // Count items (newline-separated)
    const items = value.split('\n').filter(l => l.trim().length > 0);
    if (items.length >= minCount) {
      return { valid: true };
    }
    return { valid: false, reason: `Expected ${minCount}+ items, found ${items.length}` };
  }

  getMaxLayer(mode: ModeType): number {
    return this.modes.get(mode)?.maxLayer || 0;
  }

  getModeDefinition(mode: ModeType): ModeDefinition | undefined {
    return this.modes.get(mode);
  }

  validateTool(tool: string, mode: ModeType): ValidationResult {
    const modeDef = this.modes.get(mode);
    if (!modeDef) {
      return { valid: true }; // Unknown mode, allow
    }

    if (modeDef.blockedTools.includes(tool)) {
      return { valid: false, reason: `${tool} is blocked in ${modeDef.name}` };
    }

    return { valid: true };
  }

  canAdvance(mode: ModeType, currentLayer: number, artifacts: Map<string, string>): boolean {
    const modeDef = this.modes.get(mode);
    if (!modeDef) return false;

    const requirements = modeDef.requirements.get(currentLayer);
    if (!requirements) return false;

    const results = requirements.map(req => req.validate(artifacts));
    const allValid = results.every(r => r.valid);

    return allValid;
  }

  getRequirements(mode: ModeType, layer: number): LayerRequirement[] {
    const modeDef = this.modes.get(mode);
    if (!modeDef) return [];
    return modeDef.requirements.get(layer) || [];
  }
}