/**
 * src/shared/t2-loader.ts
 *
 * T2→T1 CONTEXT PYRAMID ENGINE
 *
 * Architecture:
 *   T2 (Cold Storage) → synthesis → T1 (Warm Injectables) → system.transform → T0 (Hot Runtime)
 *
 * T2: Full bible files on disk at context/t2/. Loaded at init, session-cached for reference.
 *     NEVER injected into system prompt directly (would burn 10K+ tokens per message).
 *     Accessible on-demand via read_kraken_context tool.
 *
 * T1: Precision context warheads synthesized from T2. <5K chars total.
 *     Injected on EVERY system prompt via system.transform.
 *     Contains ONLY runtime-behavior-enforcing content.
 *
 * T0: Model's active behavior in conversation. Shaped by T1 injectables.
 *
 * CORRECTIONS APPLIED:
 * - 10 core files only (not 14 — 4 on-demand only)
 * - Per-file cap: 5,000 chars (T2), 500 chars (T1 per injectable)
 * - Total cap: 50,000 chars (T2), 5,000 chars (T1)
 * - Cache TTL: Infinity (session-duration), invalidated only on compaction
 * - T1 synthesized from T2, not raw T2 injected
 * - No hardcoded /home/leviathan paths
 */

import * as fs from 'fs';
import * as path from 'path';

/** Session-duration cache — never expires, only invalidated on compaction */
const CACHE_TTL_MS = Infinity;

/** T2: Per-file character limit (cold storage) */
const T2_MAX_FILE_CHARS = 5000;

/** T2: Total combined character limit */
const T2_MAX_TOTAL_CHARS = 50000;

/** T1: Per-injectable character limit (warm context) */
const T1_MAX_PER_INJECTABLE = 500;

/** T1: Total combined character limit */
const T1_MAX_TOTAL_CHARS = 5000;

/** The 10 core T2 files for operational alignment */
const CORE_T2_FILES: string[] = [
  'T2_ALIGNMENT_BIBLE.md',
  'T2_ARCHITECTURE.md',
  'T2_BUILD_CHAIN.md',
  'T2_COMPACTION_SURVIVAL.md',
  'T2_CRASH_RECOVERY.md',
  'T2_FAILURE_MODES.md',
  'T2_KRAKEN_LIGHTNING_MODE.md',
  'T2_KRAKEN_RULES.md',
  'T2_PATTERNS.md',
  'T2_PLUGIN_ENGINEERING.md',
];

/** T1 synthesis priority (HIGH → injected first, LOW → may be dropped if over budget) */
type T1Priority = 'HIGH' | 'MEDIUM' | 'LOW';

const T1_PRIORITY_MAP: Record<string, T1Priority> = {
  'T2_ALIGNMENT_BIBLE.md': 'HIGH',
  'T2_ARCHITECTURE.md': 'HIGH',
  'T2_BUILD_CHAIN.md': 'MEDIUM',
  'T2_COMPACTION_SURVIVAL.md': 'HIGH',
  'T2_CRASH_RECOVERY.md': 'LOW',
  'T2_FAILURE_MODES.md': 'MEDIUM',
  'T2_KRAKEN_LIGHTNING_MODE.md': 'HIGH',
  'T2_KRAKEN_RULES.md': 'HIGH',
  'T2_PATTERNS.md': 'MEDIUM',
  'T2_PLUGIN_ENGINEERING.md': 'LOW',
};

interface T2Cache {
  content: string;
  loadedAt: number;
  fileCount: number;
}

interface T1Cache {
  content: string;
  injectableCount: number;
  totalChars: number;
}

let t2Cache: T2Cache | null = null;
let t1Cache: T1Cache | null = null;

// ============================================================
// PATH RESOLUTION (P7 compliant — no hardcoded /home/leviathan)
// ============================================================

/**
 * Find the T2 directory using env var, then known container paths, then cwd-relative.
 */
function getT2Dir(): string {
  const candidates: string[] = [];

  // 1. Environment variable (highest priority)
  if (process.env.KRAKEN_T2_DIR) {
    candidates.push(process.env.KRAKEN_T2_DIR);
  }

  // 2. Container mount paths
  candidates.push('/workspace/kraken/context/t2');

  // 3. CWD-relative (dev mode)
  candidates.push(path.join(process.cwd(), 'context', 't2'));

  // 4. Plugin root-relative (installed plugin)
  candidates.push(path.join(__dirname, '..', '..', 'context', 't2'));

  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }

  // Fallback: create directory at first candidate
  const fallback = candidates[0] || '/workspace/kraken/context/t2';
  try {
    fs.mkdirSync(fallback, { recursive: true });
    console.error(`[T2Loader] Created T2 directory at ${fallback}`);
  } catch (mkdirErr) {
    console.error(`[T2Loader] Failed to create T2 directory at ${fallback}: ${mkdirErr instanceof Error ? mkdirErr.message : String(mkdirErr)}`);
  }
  return fallback;
}

// ============================================================
// T2 EXTRACTION — Full content summarizer (for reference/deep-dive)
// ============================================================

/**
 * Extract headings and key content from a T2 file.
 * Capped at T2_MAX_FILE_CHARS to prevent token overflow.
 * Used for: T2 cold storage reference, read_kraken_context tool.
 * NOT used for T1 synthesis (T1 has its own extraction).
 */
function extractT2Content(filePath: string, maxChars: number): { content: string; truncated: boolean } {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const lines = raw.split('\n');

    const relevantLines: string[] = [];
    let inCodeBlock = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Track code blocks for important examples
      if (trimmed.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        relevantLines.push(line);
        continue;
      }
      if (inCodeBlock) {
        relevantLines.push(line);
        continue;
      }

      // Headings
      if (trimmed.startsWith('##') || trimmed.startsWith('#')) {
        relevantLines.push(line);
        continue;
      }

      // Bold patterns (key terms)
      if (trimmed.includes('**') || trimmed.includes('__')) {
        relevantLines.push(line);
        continue;
      }

      // Numbered lists and bullet points
      if (/^\s*[\-\*]\s/.test(trimmed) || /^\s*\d+[\.\)]\s/.test(trimmed)) {
        relevantLines.push(line);
        continue;
      }

      // Table rows
      if (trimmed.startsWith('|')) {
        relevantLines.push(line);
        continue;
      }

      // Lines shorter than 80 chars (likely metadata or short directives)
      if (trimmed.length > 0 && trimmed.length < 80 && !trimmed.startsWith('//') && !trimmed.startsWith('<!--')) {
        relevantLines.push(line);
      }
    }

    let content = relevantLines.join('\n');
    const truncated = content.length > maxChars;
    if (truncated) {
      content = content.slice(0, maxChars) + '\n... [TRUNCATED at character limit]';
    }

    return { content, truncated };
  } catch {
    return { content: '', truncated: false };
  }
}

// ============================================================
// T1 SYNTHESIS — Precision context warheads (for system prompt injection)
// ============================================================

/**
 * Synthesize a T1 injectable from a T2 file.
 *
 * T1 injectables are <500 chars each and contain ONLY runtime-behavior-enforcing content:
 * - Imperatives (rules that MUST be followed)
 * - Prohibitions (things that MUST NOT be done)
 * - Decision trees (IF/THEN patterns)
 * - Priorities (what to do first)
 * - Anti-patterns (what to avoid)
 *
 * NO prose, NO examples, NO background, NO code blocks >10 lines.
 */
function synthesizeT1Injectable(fileName: string, filePath: string, maxChars: number): string {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const lines = raw.split('\n');
    const injectableLines: string[] = [];
    const priority = T1_PRIORITY_MAP[fileName] || 'MEDIUM';

    // Header
    injectableLines.push(`[T1:${priority}] ${fileName.replace('.md', '').replace('T2_', 'T2:')}`);

    let inCodeBlock = false;
    let codeBlockLines = 0;

    for (const line of lines) {
      const trimmed = line.trim();

      // Track code blocks but limit to 10 lines
      if (trimmed.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        codeBlockLines = 0;
        if (inCodeBlock) injectableLines.push(line);
        else injectableLines.push(line);
        continue;
      }
      if (inCodeBlock) {
        codeBlockLines++;
        if (codeBlockLines <= 10) injectableLines.push(line);
        continue;
      }

      // Extract imperatives: numbered rules, bold imperatives, MUST/SHOULD statements
      if (/^\s*\d+[\.\)]\s/.test(trimmed) && (
        trimmed.includes('MUST') || trimmed.includes('NEVER') ||
        trimmed.includes('ALWAYS') || trimmed.includes('ONLY') ||
        trimmed.includes('DELEGATE') || trimmed.includes('VERIFY')
      )) {
        injectableLines.push(trimmed);
        continue;
      }

      // Extract prohibitions: lines with NEVER, DO NOT, AVOID, NO
      if (trimmed.includes('NEVER') || trimmed.includes('DO NOT') ||
          trimmed.includes('AVOID') || trimmed.startsWith('- NEVER') ||
          trimmed.startsWith('- DO NOT')) {
        injectableLines.push(trimmed);
        continue;
      }

      // Extract headings that are behavioral rules
      if ((trimmed.startsWith('##') || trimmed.startsWith('#')) &&
          (trimmed.includes('Rule') || trimmed.includes('Principle') ||
           trimmed.includes('Protocol') || trimmed.includes('Requirement') ||
           trimmed.includes('Standard') || trimmed.includes('Mandate'))) {
        injectableLines.push(trimmed);
        continue;
      }

      // Extract decision patterns: IF/THEN, when → use
      if (trimmed.startsWith('- **') && trimmed.includes('**') &&
          !trimmed.includes('Example') && !trimmed.includes('Note')) {
        injectableLines.push(trimmed);
        continue;
      }

      // Extract numbered lists that are behavioral (short lines with action verbs)
      if (/^\s*\d+[\.\)]\s/.test(trimmed) && trimmed.length < 120) {
        // Skip if it's explanatory (contains "for example", "note that", etc.)
        if (!/for example|note that|such as|e\.g\.|i\.e\./i.test(trimmed)) {
          injectableLines.push(trimmed);
        }
        continue;
      }

      // Extract bullet points that contain behavioral content
      if (trimmed.startsWith('- ') && trimmed.length < 120) {
        if (/use |call |run |check |verify |ensure |validate |confirm |apply /i.test(trimmed)) {
          injectableLines.push(trimmed);
        }
        continue;
      }
    }

    let content = injectableLines.join('\n');
    const truncated = content.length > maxChars;
    if (truncated) {
      content = content.slice(0, maxChars);
    }

    return content;
  } catch {
    return `[T1:${T1_PRIORITY_MAP[fileName] || 'MEDIUM'}] ${fileName}: CONTENT UNAVAILABLE`;
  }
}

/**
 * Priority comparison for sorting T1 injectables.
 * HIGH comes first, then MEDIUM, then LOW.
 */
function priorityOrder(p: T1Priority): number {
  switch (p) {
    case 'HIGH': return 0;
    case 'MEDIUM': return 1;
    case 'LOW': return 2;
  }
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Load and cache all T2 context files.
 * Returns full T2 content for reference/deep-dive use.
 * This is NOT injected into system prompt — use synthesizeT1Injectables() for that.
 *
 * Session-duration cache — only invalidated on compaction.
 */
export function loadT2Context(): string {
  if (t2Cache && (Date.now() - t2Cache.loadedAt < CACHE_TTL_MS)) {
    return t2Cache.content;
  }

  const t2Dir = getT2Dir();
  const perFileMax = Math.floor(T2_MAX_TOTAL_CHARS / CORE_T2_FILES.length);

  let result = '\n---\n[T2 CONTEXT LIBRARY START]\n';
  let loadedCount = 0;
  let runningTotal = 0;
  const errors: string[] = [];

  for (const file of CORE_T2_FILES) {
    const filePath = path.join(t2Dir, file);
    const remaining = T2_MAX_TOTAL_CHARS - runningTotal;
    const budget = Math.min(perFileMax, T2_MAX_FILE_CHARS, remaining);

    if (budget <= 0) {
      errors.push(`${file}: SKIPPED (total budget exhausted)`);
      continue;
    }

    const { content, truncated } = extractT2Content(filePath, budget);
    if (content.length === 0) {
      errors.push(`${file}: EMPTY or not found`);
      continue;
    }

    runningTotal += content.length;
    loadedCount++;
    result += `\n### Source: ${file}`;
    if (truncated) result += ` (truncated)`;
    result += `\n${content}\n`;
  }

  result += `\n[T2 CONTEXT LIBRARY END — ${loadedCount}/${CORE_T2_FILES.length} files loaded]`;
  if (errors.length > 0) {
    result += `\n[T2 WARNINGS: ${errors.join('; ')}]`;
  }
  result += '\n---\n';

  t2Cache = { content: result, loadedAt: Date.now(), fileCount: loadedCount };
  console.error(`[T2Loader] T2 cache loaded: ${loadedCount}/${CORE_T2_FILES.length} files, ${result.length} chars`);
  return result;
}

/**
 * Synthesize T1 injectables from cached T2 files.
 * Returns COMPACT precision context warheads (<5K chars total).
 * This IS what gets injected into system prompt on every message.
 *
 * T1 is synthesized once at init and cached statically (never changes).
 * After compaction, T2 is re-loaded and T1 is re-synthesized.
 */
export function synthesizeT1Injectables(): string {
  // T1 cache is separate from T2 cache — static after synthesis
  if (t1Cache) {
    return t1Cache.content;
  }

  // Ensure T2 is loaded first
  loadT2Context();

  const t2Dir = getT2Dir();
  const injectables: Array<{ content: string; priority: T1Priority; name: string }> = [];

  for (const file of CORE_T2_FILES) {
    const filePath = path.join(t2Dir, file);
    const priority = T1_PRIORITY_MAP[file] || 'MEDIUM';
    const content = synthesizeT1Injectable(file, filePath, T1_MAX_PER_INJECTABLE);

    if (content && content.length > 10) {
      injectables.push({ content, priority, name: file });
    }
  }

  // Sort by priority: HIGH first, then MEDIUM, then LOW
  injectables.sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority));

  // Build T1 payload, respecting total budget
  let result = '\n---\n[T1 CONTEXT INJECTABLES — RUNTIME BEHAVIOR ENFORCEMENT]\n';
  let runningTotal = 0;
  let count = 0;

  for (const inj of injectables) {
    const remaining = T1_MAX_TOTAL_CHARS - runningTotal;
    if (remaining <= 0) break;

    const content = inj.content.length <= remaining ? inj.content : inj.content.slice(0, remaining);
    runningTotal += content.length;
    count++;
    result += `\n${content}\n`;
  }

  result += `\n[T1 INJECTABLES END — ${count}/${injectables.length} active injectables, ${result.length} chars]\n---\n`;

  t1Cache = { content: result, injectableCount: count, totalChars: result.length };
  console.error(`[T2Loader] T1 injectables synthesized: ${count}/${injectables.length} active, ${result.length} chars`);
  return result;
}

/**
 * Force reload on next call. Used after compaction.
 * Invalidates BOTH T2 and T1 caches.
 */
export function invalidateT2Cache(): void {
  t2Cache = null;
  t1Cache = null;
  console.error('[T2Loader] T2+T1 caches invalidated — will re-synthesize on next load');
}

/**
 * Get T2+T1 load status (for diagnostics)
 */
export function getT2LoadStatus(): { 
  t2Loaded: boolean; 
  t1Loaded: boolean;
  t2FileCount: number; 
  t1InjectableCount: number;
  t2TotalChars: number;
  t1TotalChars: number;
} {
  return {
    t2Loaded: t2Cache !== null,
    t1Loaded: t1Cache !== null,
    t2FileCount: t2Cache?.fileCount ?? 0,
    t1InjectableCount: t1Cache?.injectableCount ?? 0,
    t2TotalChars: t2Cache?.content.length ?? 0,
    t1TotalChars: t1Cache?.totalChars ?? 0,
  };
}

/**
 * Check if T1 injectables are available (for system.transform guard)
 */
export function isT1Ready(): boolean {
  return t1Cache !== null;
}
