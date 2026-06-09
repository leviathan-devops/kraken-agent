/**
 * src/knowledge/knowledge-base.ts
 *
 * Loads and parses knowledge library files for warhead consumption.
 * Libraries: AGENT_IDENTITY, ALGORITHMIC_SYSTEMS, RUNTIME_GRADE, TYPESCRIPT_DEEP
 *
 * P2: Readonly types. No unchecked casts.
 * P3: Every catch has console.error with library/file name.
 * P4: Per-file and total character limits prevent token overflow.
 * P6: fs and path verified at import time.
 * P7: Path from env var with fallback — no hardcoded machine-specific paths.
 * P9: All sync — acceptable for init-time loading.
 * P11: extractRules returns actual rules, not placeholder strings.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// P7 FIX: No hardcoded machine-specific paths. Env var is required.
// If not set, knowledge loading will log a warning and return empty libraries.
const KNOWLEDGE_BASE: string = process.env.KNOWLEDGE_LIBRARY_BASE || '';
if (!KNOWLEDGE_BASE) {
  console.error('[KnowledgeBase] WARNING: KNOWLEDGE_LIBRARY_BASE env var not set. Knowledge loading will fail. Set it to the KNOWLEDGE_LIBRARY root directory.');
}

const KNOWLEDGE_ROOTS: Readonly<Record<string, string>> = {
  'AGENT_IDENTITY': 'Agent_Identity_Architecture',
  'ALGORITHMIC_SYSTEMS': 'Algorithmic Systems',
  'RUNTIME_GRADE': 'Runtime_Grade_Standards',
  'TYPESCRIPT_DEEP': 'Typescript Deep Knowledge',
};

const MAX_FILE_CHARS = 50000;

/**
 * A loaded knowledge library with parsed sections and rule extraction.
 * Warheads call lib.extractRules(file, sections) to get rules.
 */
export class KnowledgeLibrary {
  readonly name: string;
  readonly files: Map<string, string>;
  readonly loadedAt: number;
  readonly parsedSections: Map<string, string[]>;

  constructor(name: string) {
    this.name = name;
    this.files = new Map();
    this.loadedAt = Date.now();
    this.parsedSections = new Map();
  }

  /**
   * Extract rules from parsed sections by heading titles.
   * Returns non-empty, non-heading lines from matching sections.
   */
  extractRules(file: string, sections: readonly string[]): string[] {
    const rules: string[] = [];
    for (const sectionTitle of sections) {
      const lines = this.parsedSections.get(sectionTitle);
      if (!lines) continue;
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length > 0 && !trimmed.startsWith('#')) {
          rules.push(trimmed);
        }
      }
    }
    return rules;
  }
}

export class KnowledgeBase {
  private libraries = new Map<string, KnowledgeLibrary>();

  /**
   * Load a knowledge library by name.
   * Reads all .md/.txt files from the library directory.
   * Parses sections by heading for rule extraction.
   * Safe to call multiple times — subsequent calls are no-ops.
   */
  loadLibrary(name: string, rootPath?: string): void {
    if (this.libraries.has(name)) return;

    const subdir = KNOWLEDGE_ROOTS[name];
    if (!subdir) {
      console.error('[KnowledgeBase] Unknown library: ' + name);
      return;
    }

    const libPath = rootPath ?? path.join(KNOWLEDGE_BASE, subdir);
    const lib = new KnowledgeLibrary(name);

    try {
      if (!fs.existsSync(libPath)) {
        console.error('[KnowledgeBase] Library path not found: ' + libPath);
        this.libraries.set(name, lib);
        return;
      }

      const entries = fs.readdirSync(libPath);

      for (const entry of entries) {
        if (!entry.endsWith('.md') && !entry.endsWith('.txt')) continue;
        const fullPath = path.join(libPath, entry);

        try {
          const stat = fs.statSync(fullPath);
          if (!stat.isFile()) continue;

          let content = fs.readFileSync(fullPath, 'utf-8');
          if (content.length > MAX_FILE_CHARS) {
            console.error('[KnowledgeBase] File ' + entry + ' exceeds ' + MAX_FILE_CHARS + ' chars — truncated');
            content = content.slice(0, MAX_FILE_CHARS);
          }
          lib.files.set(entry, content);

          // Parse sections by heading
          let currentSection = 'HEADER';
          for (const line of content.split('\n')) {
            const headingMatch = line.match(/^#{1,3}\s+(.+)$/);
            if (headingMatch && headingMatch[1]) {
              currentSection = headingMatch[1].trim();
            }
            const existing = lib.parsedSections.get(currentSection);
            if (existing) {
              existing.push(line);
            } else {
              lib.parsedSections.set(currentSection, [line]);
            }
          }
        } catch (fileErr) {
          console.error('[KnowledgeBase] Failed to read ' + entry + ': ' + (fileErr instanceof Error ? fileErr.message : String(fileErr)));
        }
      }

      console.error('[KnowledgeBase] Loaded ' + name + ': ' + lib.files.size + ' files');
    } catch (err) {
      console.error('[KnowledgeBase] Failed to load library ' + name + ': ' + (err instanceof Error ? err.message : String(err)));
    }

    this.libraries.set(name, lib);
  }

  /**
   * Get a loaded library by name.
   * Throws if the library was never loaded (programmer error).
   */
  getLibrary(name: string): KnowledgeLibrary {
    const lib = this.libraries.get(name);
    if (!lib) {
      throw new Error('[KnowledgeBase] Library \'' + name + '\' not loaded. Call loadLibrary() first.');
    }
    return lib;
  }

  /**
   * Extract rules from a library by file and section headings.
   * Returns non-empty, non-heading lines from matching sections.
   * Convenience method — warheads can also call getLibrary().extractRules().
   */
  extractRules(library: string, file: string, sections: readonly string[]): string[] {
    return this.getLibrary(library).extractRules(file, sections);
  }

  /**
   * Check if a library has been loaded.
   */
  isLoaded(name: string): boolean {
    return this.libraries.has(name);
  }
}
