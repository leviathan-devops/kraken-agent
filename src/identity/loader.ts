/**
 * src/identity/loader.ts
 *
 * Identity file loader for Kraken Agent
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { IdentityBundle, IdentityFileType } from './types.js';

// Environment variable for override
const IDENTITY_DIR = process.env.KRAKEN_IDENTITY_DIR || 'identity';

// Dynamic plugin name detection
const KRAKEN_PLUGIN_NAME = process.env.KRAKEN_PLUGIN_NAME || 'kraken-agent';

// Known locations to search for identity (relative to common plugin locations)
const KNOWN_LOCATIONS = [
  // Relative to cwd (opencode workspace)
  'identity',
  // Relative to home directory
  '../identity',
  // Plugin identity directory (deploy.sh target)
  '../../.config/opencode/plugins/kraken-firewall/identity',
  // Legacy plugin name
  `../../.config/opencode/plugins/${KRAKEN_PLUGIN_NAME}/dist/../identity`,
  // From OPENCODE_WORKSPACE to kraken identity
  `../.config/opencode/plugins/${KRAKEN_PLUGIN_NAME}/identity`,
  // /opt fallback
  '/opt/opencode/identity',
];

async function findIdentityDir(): Promise<string> {
  // If absolute path given, use it directly
  if (path.isAbsolute(IDENTITY_DIR)) {
    try {
      await fs.access(IDENTITY_DIR);
      const orchestratorPath = path.join(IDENTITY_DIR, 'orchestrator');
      await fs.access(orchestratorPath);
      return IDENTITY_DIR;
    } catch {
      // Continue searching
    }
  }

  // Check known locations relative to cwd AND HOME
  const HOME = process.env.HOME || process.env.USERPROFILE || '/root';
  const searchDirs = [process.cwd(), HOME];
  
  for (const baseDir of searchDirs) {
    for (const loc of KNOWN_LOCATIONS) {
      const tryPath = path.resolve(baseDir, loc);
      try {
        await fs.access(tryPath);
        const orchestratorPath = path.join(tryPath, 'orchestrator');
        await fs.access(orchestratorPath);
        return tryPath;
      } catch {
        // Continue
      }
    }
  }

  // Try direct resolve of IDENTITY_DIR
  const directPath = path.resolve(process.cwd(), IDENTITY_DIR);
  try {
    await fs.access(directPath);
    const orchestratorPath = path.join(directPath, 'orchestrator');
    await fs.access(orchestratorPath);
    return directPath;
  } catch {
    // Last resort: return cwd/identity (might not have orchestrator, but loadForRole will error)
    return path.join(process.cwd(), 'identity');
  }
}

let cachedIdentityPath: string | null = null;

async function resolveIdentityPath(): Promise<string> {
  if (cachedIdentityPath) {
    return cachedIdentityPath;
  }

  const found = await findIdentityDir();
  cachedIdentityPath = found;
  return cachedIdentityPath;
}

export class IdentityLoader {
  private cache: Map<string, IdentityBundle> = new Map();

  async loadForRole(role: string): Promise<IdentityBundle> {
    const cached = this.cache.get(role);
    if (cached) {
      return cached;
    }

    const resolvedPath = await resolveIdentityPath();
    const roleDir = path.join(resolvedPath, role);
    
    try {
      await fs.access(roleDir);
    } catch {
      throw new Error(`Identity directory not found: ${roleDir}`);
    }

    const [kraken, identity, execution, quality, tools] = await Promise.all([
      this.loadFileSafe(roleDir, 'KRAKEN.md'),
      this.loadFileSafe(roleDir, 'IDENTITY.md'),
      this.loadFileSafe(roleDir, 'EXECUTION.md'),
      this.loadFileSafe(roleDir, 'QUALITY.md'),
      this.loadFileSafe(roleDir, 'TOOLS.md'),
    ]);

    const bundle: IdentityBundle = {
      role,
      soul: this.parseSoul(kraken || this.createMinimalSoul(role)),
      identity: this.parseIdentity(identity || this.createMinimalIdentity(role)),
      quality: this.parseQuality(quality || ''),
      metadata: {
        loadedAt: new Date().toISOString(),
        version: '1.0.0',
        sourceDir: roleDir,
      },
    };

    if (execution) {
      bundle.execution = this.parseExecution(execution);
    }

    if (tools) {
      bundle.tools = this.parseTools(tools);
    }

    this.cache.set(role, bundle);

    return bundle;
  }

  async loadFile(role: string, file: IdentityFileType): Promise<string> {
    const resolvedPath = await resolveIdentityPath();
    const roleDir = path.join(resolvedPath, role);
    const result = await this.loadFileSafe(roleDir, file);
    if (result === null) {
      throw new Error(`Identity file not found: ${roleDir}/${file}`);
    }
    return result;
  }

  async listRoles(): Promise<string[]> {
    try {
      const resolvedPath = await resolveIdentityPath();
      const entries = await fs.readdir(resolvedPath);
      const roles: string[] = [];

      for (const entry of entries) {
        const entryPath = path.join(resolvedPath, entry);
        const stat = await fs.stat(entryPath);
        if (stat.isDirectory()) {
          roles.push(entry);
        }
      }
      
      return roles.sort();
    } catch {
      return [];
    }
  }

  async roleExists(role: string): Promise<boolean> {
    try {
      const resolvedPath = await resolveIdentityPath();
      const roleDir = path.join(resolvedPath, role);
      const stat = await fs.stat(roleDir);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  private async loadFileSafe(dir: string, file: string): Promise<string | null> {
    try {
      const filePath = path.join(dir, file);
      return await fs.readFile(filePath, 'utf-8');
    } catch {
      return null;
    }
  }

  private parseSoul(content: string): IdentityBundle['soul'] {
    const directives: string[] = [];
    const directiveMatch = content.match(/^\d+\.\s+(.+)$/gm);
    if (directiveMatch) {
      directives.push(...directiveMatch.map(d => d.replace(/^\d+\.\s+/, '')));
    }

    const mantraMatch = content.match(/## The Mantra\n([^\n]+)/);
    const philosophyMatch = content.match(/## Orchestrator Identity\n([\s\S]+?)(?=##|## The)/);

    return {
      raw: content,
      directives,
      philosophy: philosophyMatch ? philosophyMatch[1].trim() : '',
      mantra: mantraMatch ? mantraMatch[1].trim() : 'Execute, don\'t simulate.',
    };
  }

  private parseIdentity(content: string): IdentityBundle['identity'] {
    const titleMatch = content.match(/^# IDENTITY\.md — (.+)$/m);
    const roleMatch = content.match(/## Role\n([\s\S]+?)(?=##)/);
    const expertiseMatch = content.match(/## Expertise\n([\s\S]+?)(?=##)/);
    const workingStyleMatch = content.match(/## Working Style\n([\s\S]+?)(?=##)/);
    const trackRecordMatch = content.match(/## Track Record\n([\s\S]+?)(?=##)/);

    const extractItems = (text: string | undefined): string[] => {
      if (!text) return [];
      return text.split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s+/, '').trim());
    };

    return {
      raw: content,
      title: titleMatch ? titleMatch[1] : 'Unknown',
      role: roleMatch ? roleMatch[1].trim() : '',
      expertise: extractItems(expertiseMatch?.[1]),
      workingStyle: extractItems(workingStyleMatch?.[1]),
      trackRecord: extractItems(trackRecordMatch?.[1]),
    };
  }

  private parseExecution(content: string): IdentityBundle['execution'] {
    const philosophyMatch = content.match(/## Delegation Philosophy\n([\s\S]+?)(?=##)/);
    const neverDoMatch = content.match(/## Never Do Directly\n([\s\S]+?)(?=##)/);

    const triggers: {condition: string; action: string; priority: 'high' | 'medium' | 'low'}[] = [];
    
    const triggerMatch = content.match(/### High Priority[\s\S]+?(?=###|$)/g);
    if (triggerMatch) {
      for (const trigger of triggerMatch) {
        const lines = trigger.split('\n').filter(l => l.includes('→'));
        for (const line of lines) {
          const [condition, action] = line.split('→').map(s => s.trim());
          if (condition && action) {
            triggers.push({
              condition,
              action,
              priority: 'high',
            });
          }
        }
      }
    }

    return {
      raw: content,
      delegationPhilosophy: philosophyMatch ? philosophyMatch[1].trim() : '',
      parallelPatterns: [],
      delegationTriggers: triggers,
      escalationPath: '',
      neverDoDirectly: neverDoMatch 
        ? neverDoMatch[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s+/, ''))
        : [],
    };
  }

  private parseQuality(content: string): IdentityBundle['quality'] {
    const gatesMatch = content.match(/## Quality Gates\n([\s\S]+?)(?=##)/);
    const validatorsMatch = content.match(/## Anti-Hallucination Validators\n([\s\S]+?)(?=##)/);

    return {
      raw: content,
      qualityGates: gatesMatch 
        ? gatesMatch[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s+/, ''))
        : [],
      antiHallucinationValidators: validatorsMatch
        ? validatorsMatch[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s+/, ''))
        : [],
      debugProtocol: [],
      stagnationDetection: [],
      guardianZones: [],
      evidenceHierarchy: [],
    };
  }

  private parseTools(content: string): IdentityBundle['tools'] {
    return {
      raw: content,
      openCode: [],
      swarm: [],
      cluster: [],
    };
  }

  private createMinimalSoul(role: string): string {
    return `# KRAKEN.md — ${role} Agent

You are a ${role} agent. You are not a chatbot. You are an execution engine.

## Core Directives
1. EXECUTE, don't simulate.
2. VERIFY everything.
3. DELEGATE when possible.

## The Mantra
Execute, don't simulate. Verify, don't assume.
`;
  }

  private createMinimalIdentity(role: string): string {
    return `# IDENTITY.md — ${role}

## Role
You are a ${role} agent.

## Expertise
- Execution
- Verification
- Delegation

## Working Style
- Execute tasks efficiently
- Verify all outputs
`;
  }
}

export const identityLoader = new IdentityLoader();