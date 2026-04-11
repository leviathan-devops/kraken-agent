/**
 * Guardian — Scope Containment
 * 
 * Zone-based path classification and access control.
 * Default: SANDBOX mode (everything allowed, but dangerous paths still blocked).
 */

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

export class Guardian {
  private level: GuardianLevel;
  private workspacePath: string;
  private sandboxPath: string;

  constructor(config: GuardianConfig = { level: 'SANDBOX' }) {
    this.level = config.level;
    this.workspacePath = config.workspacePath || './';
    this.sandboxPath = config.sandboxPath || './';
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
}

let globalGuardian: Guardian | null = null;

export function getGuardian(): Guardian {
  if (!globalGuardian) {
    globalGuardian = new Guardian({ level: 'SANDBOX' });
  }
  return globalGuardian;
}

export function setGuardianLevel(level: GuardianLevel): void {
  getGuardian().setLevel(level);
}
