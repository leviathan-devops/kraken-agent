/**
 * Kraken v1.3 Firewall — Semantic Anti-Bullshit Engine
 * Used by L8 (Anti-Bullshit).
 *
 * Blame attribution, honesty contradiction detection,
 * and ship claim validation — all structural/mechanical.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { FirewallContext } from './types';

/** Result of blame attribution analysis */
export interface BlameAttributionResult {
  blamingEnvironment: boolean;
  lastOpWasCodeWrite: boolean;
  lastOpFailed: boolean;
  discrepancy: boolean;
  detail: string;
}

/** Result of honesty contradiction check */
export interface HonestyContradictionResult {
  contradiction: boolean;
  honestToken: string | null;
  contradictedClaim: string;
  logEvidence: string;
}

/** Result of ship claim validation */
export interface ShipValidationResult {
  shipClaimed: boolean;
  evidenceExists: boolean;
  passRate: number | null;
  threshold: number;
  valid: boolean;
  detail: string;
}

/** Patterns that indicate environment blaming */
const ENVIRONMENT_BLAME_PATTERNS: RegExp[] = [
  /\b(container|docker|environment|sandbox|runtime|host)\s+(is\s+)?(broken|down|unavailable|not\s+responding)/i,
  /\b(can't\s+(access|reach|connect)\s+(to\s+)?(the\s+)?(container|server|host|service))/i,
  /\b(network|connection|timeout)\s+(error|issue|problem|failure)/i,
  /\b(the\s+tool\s+is\s+broken)/i,
  /\b(system|platform|infrastructure)\s+(is\s+)?(unavailable|down|broken)/i,
];

/** Honesty token patterns */
const HONESTY_TOKEN_PATTERNS: RegExp[] = [
  /\b(let\s+me\s+be\s+honest)\b/i,
  /\b(to\s+be\s+(completely\s+)?honest)\b/i,
  /\b(truth\s+is)\b/i,
  /\b(honestly)\b/i,
  /\b(I'll\s+be\s+(completely\s+)?transparent)\b/i,
];

/** Ship claim patterns */
const SHIP_CLAIM_PATTERNS: RegExp[] = [
  /\b(ship\s+ready)\b/i,
  /\b(ready\s+to\s+ship)\b/i,
  /\b(shippable)\b/i,
  /\b(production\s+ready)\b/i,
  /\b(all\s+tests?\s+pass(ed)?)\b/i,
  /\b(tests?\s+(are\s+)?green)\b/i,
  /\b(100%?\s+pass\s+rate)\b/i,
];

/** Default pass rate threshold for ship validation */
const DEFAULT_PASS_RATE_THRESHOLD = 0.90;

/**
 * Blame Attribution Algorithm:
 * Was the last tool call a code write that failed?
 * Is the agent now blaming the environment/container?
 */
export function analyzeBlameAttribution(context: FirewallContext): BlameAttributionResult {
  const result: BlameAttributionResult = {
    blamingEnvironment: false,
    lastOpWasCodeWrite: false,
    lastOpFailed: false,
    discrepancy: false,
    detail: '',
  };

  // Check recent actions for a failed code write
  const recentActions = context.sessionState.recentActions;
  if (recentActions.length > 0) {
    const lastAction = recentActions[recentActions.length - 1];
    if (lastAction !== undefined) {
      const lastTool = lastAction.tool.toLowerCase();
      result.lastOpWasCodeWrite =
        lastTool.includes('write') ||
        lastTool.includes('edit') ||
        lastTool.includes('create') ||
        lastTool.includes('build') ||
        lastTool.includes('compile');
      result.lastOpFailed = lastAction.blocked;
    }
  }

  // Check current message for environment blaming
  const message = extractMessage(context.args);
  for (const pattern of ENVIRONMENT_BLAME_PATTERNS) {
    const match = message.match(pattern);
    if (match !== null) {
      result.blamingEnvironment = true;
      result.detail = match[0];
      break;
    }
  }

  // Discrepancy: agent wrote code that failed but blames environment
  result.discrepancy = result.lastOpWasCodeWrite && result.blamingEnvironment;

  if (result.discrepancy) {
    result.detail = `Last op was code write (${result.lastOpFailed ? 'failed' : 'succeeded'}), but agent is blaming environment: "${result.detail}"`;
  }

  return result;
}

/**
 * Honesty Contradiction Detection:
 * "Let me be honest" + subsequent claim contradicts session log.
 */
export function detectHonestyContradiction(context: FirewallContext): HonestyContradictionResult {
  const result: HonestyContradictionResult = {
    contradiction: false,
    honestToken: null,
    contradictedClaim: '',
    logEvidence: '',
  };

  const message = extractMessage(context.args);

  // Find honesty token
  for (const pattern of HONESTY_TOKEN_PATTERNS) {
    const match = message.match(pattern);
    if (match !== null) {
      result.honestToken = match[0];
      break;
    }
  }

  if (result.honestToken === null) {
    return result;
  }

  // After honesty token, check if claim contradicts session log
  const tokenIndex = message.toLowerCase().indexOf(result.honestToken.toLowerCase());
  const afterToken = message.slice(tokenIndex + result.honestToken.length);

  // Check completion claims vs session log
  const completionMatch = afterToken.match(/\b(completed|finished|done|all\s+tests?\s+pass)\b/i);
  if (completionMatch !== null && completionMatch[0] !== undefined) {
    result.contradictedClaim = completionMatch[0];

    // Check session log: were there blocked actions?
    const blockedActions = context.sessionState.recentActions.filter((a) => a.blocked);
    if (blockedActions.length > 0) {
      result.contradiction = true;
      const blockedToolNames = blockedActions.map((a) => a.tool).join(', ');
      result.logEvidence = `Session has ${blockedActions.length} blocked actions: ${blockedToolNames}`;
    }

    // Check session log: was a write tool called before claiming file exists?
    const writeActions = context.sessionState.recentActions.filter(
      (a) => a.tool.includes('write') || a.tool.includes('edit') || a.tool.includes('create'),
    );
    if (writeActions.length === 0 && afterToken.match(/\b(file\s+created|written|saved)\b/i) !== null) {
      result.contradiction = true;
      result.logEvidence = 'Agent claims file was created but no write tool was called in session';
    }
  }

  return result;
}

/**
 * Ship Claim Validation:
 * Parse ContainerTestResult.json from disk and verify passRate.
 */
export function validateShipClaim(context: FirewallContext): ShipValidationResult {
  const result: ShipValidationResult = {
    shipClaimed: false,
    evidenceExists: false,
    passRate: null,
    threshold: DEFAULT_PASS_RATE_THRESHOLD,
    valid: false,
    detail: '',
  };

  const message = extractMessage(context.args);

  // Check for ship claim
  for (const pattern of SHIP_CLAIM_PATTERNS) {
    const match = message.match(pattern);
    if (match !== null) {
      result.shipClaimed = true;
      result.detail = match[0];
      break;
    }
  }

  if (!result.shipClaimed) {
    result.valid = true; // No ship claim, nothing to validate
    return result;
  }

  // Try to find ContainerTestResult.json
  const homeDir = os.homedir();
  const searchPaths = [
    path.join(homeDir, '.kraken', 'ContainerTestResult.json'),
    path.join(homeDir, '.kraken', 'evidence', 'ContainerTestResult.json'),
    path.join(process.cwd(), 'ContainerTestResult.json'),
    path.join(process.cwd(), 'evidence', 'ContainerTestResult.json'),
  ];

  // Add evidence path from session state if available
  if (context.sessionState.evidencePath !== null) {
    const evidenceDir = path.dirname(context.sessionState.evidencePath);
    searchPaths.push(path.join(evidenceDir, 'ContainerTestResult.json'));
  }

  let resultPath: string | null = null;
  for (const searchPath of searchPaths) {
    try {
      if (fs.existsSync(searchPath)) {
        resultPath = searchPath;
        break;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[semantic-anti-bullshit] Error checking path ${searchPath}: ${errorMsg}`);
    }
  }

  if (resultPath === null) {
    result.evidenceExists = false;
    result.detail = `Ship claimed ("${result.detail}") but ContainerTestResult.json not found at any expected path`;
    return result;
  }

  // Parse the file
  try {
    const fileContent = fs.readFileSync(resultPath, 'utf-8');
    const raw = JSON.parse(fileContent);

    // Validate parsed result is a non-null object before casting
    if (typeof raw !== 'object' || raw === null) {
      result.valid = false;
      result.detail = `ContainerTestResult.json is not a valid JSON object`;
      return result;
    }

    const parsed = raw as Record<string, unknown>;  // Safe: validated above
    result.evidenceExists = true;

    // Extract passRate
    if (typeof parsed['passRate'] === 'number') {
      result.passRate = parsed['passRate'];
    } else if (typeof parsed['total'] === 'number' && typeof parsed['passed'] === 'number') {
      result.passRate = parsed['total'] > 0 ? parsed['passed'] / parsed['total'] : 0;
    }

    if (result.passRate !== null) {
      result.valid = result.passRate >= result.threshold;
      if (!result.valid) {
        result.detail = `Ship claimed but passRate ${result.passRate.toFixed(2)} < threshold ${result.threshold}`;
      } else {
        result.detail = `Ship claim validated: passRate ${result.passRate.toFixed(2)} >= ${result.threshold}`;
      }
    } else {
      result.valid = false;
      result.detail = `ContainerTestResult.json exists but no passRate field found`;
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[semantic-anti-bullshit] Error parsing ContainerTestResult.json: ${errorMsg}`);
    result.evidenceExists = true;
    result.valid = false;
    result.detail = `ContainerTestResult.json exists but could not be parsed: ${errorMsg}`;
  }

  return result;
}

/**
 * Extract the message content from tool args.
 */
function extractMessage(args: Record<string, unknown>): string {
  const messageKeys = ['message', 'content', 'text', 'prompt', 'input', 'body', 'response'];
  for (const key of messageKeys) {
    const val = args[key];
    if (typeof val === 'string' && val.length > 0) {
      return val;
    }
  }
  return '';
}
