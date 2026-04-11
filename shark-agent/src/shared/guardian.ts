/**
 * Guardian — Scope Containment + System Brain Guardian V4.7
 * 
 * Zone-based path classification and access control.
 * V4.7: Source file edit protection with mechanical enforcement.
 * Default: SANDBOX mode (everything allowed, but dangerous paths still blocked).
 */

import * as fs from 'fs';
import * as path from 'path';

export type GuardianLevel = 'SANDBOX' | 'PERMISSIVE' | 'BALANCED' | 'STRICT';

export type Zone = 'SANDBOX' | 'WORKSPACE' | 'DEVELOPMENT' | 'PERSONAL' | 'CONFIG' | 'SYSTEM';

export interface GuardianConfig {
  level: GuardianLevel;
  workspacePath?: string;
  sandboxPath?: string;
}

const DANGEROUS_PATTERNS = [
  /^rm\s+-rf\s+\//,
  /^rm\s+-rf\s+\/bin/,
  /^rm\s+-rf\s+\/usr/,
  /^rm\s+-rf\s+\/sys/,
  /^rm\s+-rf\s+\/proc/,
  /^dd\s+if=/,
  /^mkfs/,
  /^:(){ :|:& };:/,
];

const PERSONAL_PATHS = [
  /\.ssh\//,
  /\.aws\//,
  /\/Documents\//,
  /\/Desktop\//,
  /\.config\/credentials/,
];

const SYSTEM_PATHS = [
  /^\/bin\//,
  /^\/usr\//,
  /^\/sbin\//,
  /^\/etc\//,
  /^\/System\//,
];

const SOURCE_FILE_EXCLUSIONS = [
  'package.json', 'tsconfig.json', 'jsconfig.json',
  'Cargo.toml', 'go.mod', 'go.sum', 'build.gradle', 'pom.xml',
  'build.sbt', 'Gemfile', 'Pipfile', 'requirements.txt',
  'Makefile', 'Dockerfile', '.dockerignore', '.gitignore',
  'vite.config.ts', 'webpack.config.js', 'rollup.config.js',
  'next.config.js', 'nuxt.config.ts', 'svelte.config.js',
  /\.test\.ts$/, /\.spec\.ts$/, /_test\.py$/, /_spec\.py$/,
  /\/tests\//, /\/test\//,
  /\/dist\//, /\/build\//, /\/out\//,
  /\/node_modules\//,
];

const SOURCE_EXTENSIONS = new Set([
  '.ts', '.js', '.tsx', '.jsx', '.py', '.rs', '.go', '.java', '.c', '.cpp',
  '.h', '.hpp', '.cs', '.rb', '.php', '.swift', '.kt', '.scala', '.sh',
  '.bash', '.zsh', '.yaml', '.yml', '.json', '.toml', '.xml', '.md', '.txt',
  '.env', '.config',
]);

export interface EditHistoryState {
  editedFiles: Set<string>;
  createdFiles: Map<string, number>; // path -> creation timestamp
  sessionStartTime: number;
}

export interface CanEditResult {
  allowed: boolean;
  reason?: string;
  suggestion?: string;
}

export class Guardian {
  private level: GuardianLevel;
  private workspacePath: string;
  private sandboxPath: string;
  private editHistory: EditHistoryState;

  constructor(config: GuardianConfig = { level: 'SANDBOX' }) {
    this.level = config.level;
    this.workspacePath = config.workspacePath || './';
    this.sandboxPath = config.sandboxPath || './';
    this.editHistory = {
      editedFiles: new Set(),
      createdFiles: new Map(),
      sessionStartTime: Date.now(),
    };
  }

  setLevel(level: GuardianLevel): void {
    this.level = level;
  }

  canRead(path: string): boolean {
    if (this.level === 'SANDBOX') return true;
    return this.checkPath(path, 'read');
  }

  canWrite(path: string): boolean {
    if (this.level === 'SANDBOX') {
      return !this.isDangerousCommand(path);
    }
    return this.checkPath(path, 'write');
  }

  isDangerousCommand(command: string): boolean {
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(command.trim())) {
        return true;
      }
    }
    return false;
  }

  private readonly SOURCE_FILE_MODIFY_PATTERNS = [
    /sed\s+-i/,
    /echo\s+[^>]*\s+>/,
    /printf\s+[^>]*\s+>/,
    /cat\s+[^>]*\s+>/,
    /\^Ccat\s+>/,
    /tee\s+/,
    /dd\s+.*\s+of=/,
    />\s*"?[\w\/.~-]+"?$/m,
    /python3?\s+-c\s+/,
    /node\s+-e\s+/,
    /perl\s+-e\s+/,
    /ruby\s+-e\s+/,
    /php\s+-r\s+/,
    /awk\s+'/,
  ];

  private extractFilePathsFromCommand(command: string): string[] {
    const paths: string[] = [];
    
    const allPathMatches = command.matchAll(/(?:^|\s)([\/~]?[\w\/\.-]+\.ts)(?:\s|$|[&|;])/g);
    for (const match of allPathMatches) {
      paths.push(match[1]);
    }
    
    const quotedPathMatches = command.matchAll(/[\/"']([\/~]?[\w\/\.-]+\.ts)[\/"']/g);
    for (const match of quotedPathMatches) {
      paths.push(match[1]);
    }
    
    const teeMatch = command.match(/tee\s+([^\s|]+)/);
    if (teeMatch && teeMatch[1]) {
      paths.push(teeMatch[1]);
    }
    
    const catRedirectMatch = command.match(/cat\s+(?:<<\w+\s+)?>\s*([^\s>]+)/);
    if (catRedirectMatch && catRedirectMatch[1]) {
      paths.push(catRedirectMatch[1]);
    }
    
    const ddOfMatch = command.match(/dd\s+.*\s+of=([^\s]+)/);
    if (ddOfMatch && ddOfMatch[1]) {
      paths.push(ddOfMatch[1]);
    }
    
    const redirectPathMatch = command.match(/>\s*([^\s]+(?:\.ts))[^\s]*$/m);
    if (redirectPathMatch && redirectPathMatch[1]) {
      paths.push(redirectPathMatch[1]);
    }
    
    return [...new Set(paths)];
  }

  canModifyFile(command: string): { allowed: boolean; reason?: string; filePath?: string } {
    for (const pattern of this.SOURCE_FILE_MODIFY_PATTERNS) {
      if (pattern.test(command)) {
        const filePaths = this.extractFilePathsFromCommand(command);
        for (const filePath of filePaths) {
          if (this.isSourceFile(filePath)) {
            if (this.editHistory.editedFiles.has(filePath)) {
              return { allowed: true };
            }
            if (this.isFileWithinGracePeriod(filePath)) {
              return { allowed: true, reason: 'FILESYSTEM_GRACE_PERIOD' };
            }
            return { 
              allowed: false, 
              reason: 'GUARDIAN_BLOCK_SOURCE_MODIFY',
              filePath 
            };
          }
        }
      }
    }
    return { allowed: true };
  }

  classifyZone(path: string): Zone {
    const expandedPath = path.replace(/^~/, process.env.HOME || '/home/user');

    for (const pattern of PERSONAL_PATHS) {
      if (pattern.test(expandedPath)) {
        return 'PERSONAL';
      }
    }

    for (const pattern of SYSTEM_PATHS) {
      if (pattern.test(expandedPath)) {
        return 'SYSTEM';
      }
    }

    if (expandedPath.startsWith(this.workspacePath)) {
      return 'WORKSPACE';
    }

    if (expandedPath.startsWith(this.sandboxPath)) {
      return 'SANDBOX';
    }

    return 'SANDBOX';
  }

  private checkPath(path: string, operation: 'read' | 'write'): boolean {
    const zone = this.classifyZone(path);

    switch (this.level) {
      case 'SANDBOX':
        return zone !== 'PERSONAL' && zone !== 'SYSTEM';
      case 'PERMISSIVE':
        return zone !== 'PERSONAL' && zone !== 'SYSTEM';
      case 'BALANCED':
        if (zone === 'PERSONAL' || zone === 'SYSTEM') return false;
        return true;
      case 'STRICT':
        if (zone !== 'WORKSPACE' && zone !== 'SANDBOX') return false;
        return true;
      default:
        return true;
    }
  }

  getLevel(): GuardianLevel {
    return this.level;
  }

  getZoneInfo(path: string): { zone: Zone; allowed: boolean } {
    const zone = this.classifyZone(path);
    return {
      zone,
      allowed: this.checkPath(path, 'write'),
    };
  }

  isSourceFile(path: string): boolean {
    const ext = this.getExtension(path);
    if (!ext || !SOURCE_EXTENSIONS.has(ext)) {
      return false;
    }
    if (this.isExcluded(path)) {
      return false;
    }
    return true;
  }

  private getExtension(path: string): string | null {
    const lastDot = path.lastIndexOf('.');
    const lastSlash = path.lastIndexOf('/');
    if (lastDot > lastSlash && lastDot < path.length - 1) {
      return path.slice(lastDot);
    }
    return null;
  }

  private isExcluded(path: string): boolean {
    const basename = path.split('/').pop() || '';
    for (const exclusion of SOURCE_FILE_EXCLUSIONS) {
      if (typeof exclusion === 'string') {
        if (basename === exclusion) return true;
      } else if (exclusion instanceof RegExp) {
        if (exclusion.test(path)) return true;
      }
    }
    return false;
  }

  canEdit(filePath: string): CanEditResult {
    if (this.editHistory.editedFiles.has(filePath)) {
      return { allowed: true };
    }

    const createdTime = this.editHistory.createdFiles.get(filePath);
    if (createdTime !== undefined) {
      if (this.isWithinGracePeriod(createdTime)) {
        return { allowed: true, reason: 'GRACE_PERIOD_ACTIVE' };
      }
    }

    if (this.isFileWithinGracePeriod(filePath)) {
      return { allowed: true, reason: 'FILESYSTEM_GRACE_PERIOD' };
    }

    if (!this.isSourceFile(filePath)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'SOURCE_FILE_NO_EDIT_HISTORY',
      suggestion: `Duplicate the file first:
  1. cp ${filePath} ${filePath}.v1.0.0
  2. Then edit ${filePath}.v1.0.0`,
    };
  }

  registerEdit(filePath: string): void {
    this.editHistory.editedFiles.add(filePath);

    const originalPath = this.getOriginalFromCopy(filePath);
    if (originalPath) {
      this.editHistory.editedFiles.add(originalPath);
    }
  }

  registerCreate(filePath: string): void {
    this.editHistory.createdFiles.set(filePath, Date.now());
  }

  private readonly GRACE_PERIOD_MS = 60 * 60 * 1000; // 60 minutes

  private isWithinGracePeriod(timestamp: number): boolean {
    return Date.now() - timestamp < this.GRACE_PERIOD_MS;
  }

  private isFileWithinGracePeriod(filePath: string): boolean {
    try {
      const stats = fs.statSync(filePath);
      const mtime = stats.mtimeMs;
      return this.isWithinGracePeriod(mtime);
    } catch {
      return false;
    }
  }

  getOriginalFromCopy(path: string): string | null {
    const versionSuffix = /\.v\d+\.\d+\.\d+$/;
    if (!versionSuffix.test(path)) {
      return null;
    }
    const originalPath = path.replace(versionSuffix, '');
    return originalPath;
  }

  getEditHistory(): EditHistoryState {
    return {
      editedFiles: new Set(this.editHistory.editedFiles),
      createdFiles: new Map(this.editHistory.createdFiles),
      sessionStartTime: this.editHistory.sessionStartTime,
    };
  }

  resetEditHistory(): void {
    this.editHistory = {
      editedFiles: new Set(),
      createdFiles: new Map(),
      sessionStartTime: Date.now(),
    };
  }
}

let globalGuardian: Guardian | null = null;

export function getGuardian(): Guardian {
  if (!globalGuardian) {
    globalGuardian = new Guardian({ level: 'SANDBOX' });
  }
  return globalGuardian;
}

export function createGuardian(config?: GuardianConfig): Guardian {
  return new Guardian(config || { level: 'SANDBOX' });
}

export function setGuardianLevel(level: GuardianLevel): void {
  getGuardian().setLevel(level);
}
