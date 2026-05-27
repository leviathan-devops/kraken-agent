/**
 * Identity Loader — Shark v4.9
 *
 * Loads identity files from identity/shark/ directory.
 * Produces sharkIdentityPrompt for system injection.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const IDENTITY_FILES = ['SHARK.md', 'IDENTITY.md', 'EXECUTION.md', 'QUALITY.md', 'TOOLS.md'];

const IDENTITY_SEARCH_PATHS = [
  'identity/shark',
  '../identity/shark',
  '../../identity/shark',
  path.join(process.cwd(), 'identity', 'shark'),
  path.join(process.cwd(), '..', 'identity', 'shark'),
  path.join(process.cwd(), '..', '..', 'identity', 'shark'),
];

export interface SharkIdentity {
  SHARK: string;
  IDENTITY: string;
  EXECUTION: string;
  QUALITY: string;
  TOOLS: string;
}

export interface SharkIdentityPrompt {
  full: string;
  length: number;
  loaded: boolean;
  loadedAt: string;
}

let cachedIdentity: SharkIdentity | null = null;
let cachedPrompt: SharkIdentityPrompt | null = null;

export function loadSharkIdentity(): SharkIdentity | null {
  if (cachedIdentity) {
    return cachedIdentity;
  }

  for (const searchPath of IDENTITY_SEARCH_PATHS) {
    const fullPath = path.resolve(searchPath);
    if (fs.existsSync(fullPath)) {
      const identity: SharkIdentity = {
        SHARK: '',
        IDENTITY: '',
        EXECUTION: '',
        QUALITY: '',
        TOOLS: '',
      };

      let allLoaded = true;
      for (const file of IDENTITY_FILES) {
        const filePath = path.join(fullPath, file);
        if (fs.existsSync(filePath)) {
          try {
            identity[file.replace('.md', '')] = fs.readFileSync(filePath, 'utf-8');
          } catch {
            allLoaded = false;
          }
        } else {
          allLoaded = false;
        }
      }

      if (allLoaded) {
        cachedIdentity = identity;
        return identity;
      }
    }
  }

  return null;
}

export function formatIdentityForSystemPrompt(): SharkIdentityPrompt {
  if (cachedPrompt) {
    return cachedPrompt;
  }

  const identity = loadSharkIdentity();
  if (!identity) {
    return {
      full: '',
      length: 0,
      loaded: false,
      loadedAt: '',
    };
  }

  const sections = [
    '# SHARK IDENTITY — Autonomous Engineering Agent',
    '',
    identity.SHARK,
    '',
    '## Role & Expertise',
    identity.IDENTITY,
    '',
    '## Execution Patterns',
    identity.EXECUTION,
    '',
    '## Quality Standards',
    identity.QUALITY,
    '',
    '## Tool Philosophy',
    identity.TOOLS,
    '',
    '*Shark v4.9 — Plan with Trident. Execute the plan. Never yield.*',
  ];

  const full = sections.join('\n');
  cachedPrompt = {
    full,
    length: full.length,
    loaded: true,
    loadedAt: new Date().toISOString(),
  };

  return cachedPrompt;
}

export function getSharkIdentityPrompt(): string {
  return formatIdentityForSystemPrompt().full;
}

export function isSharkIdentityLoaded(): boolean {
  return formatIdentityForSystemPrompt().loaded;
}

export function resetIdentityCache(): void {
  cachedIdentity = null;
  cachedPrompt = null;
}

export const SHARK_PLUGIN_IDENTITY = {
  sharkAgents: new Set(['shark', 'shark-agent', 'shark_beta', 'shark_gamma']),
  loadIdentity: loadSharkIdentity,
  formatIdentity: formatIdentityForSystemPrompt,
  getPrompt: getSharkIdentityPrompt,
  isLoaded: isSharkIdentityLoaded,
};