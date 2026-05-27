/**
 * src/identity/types.ts
 * 
 * Identity type definitions for Kraken Agent
 */

export interface SoulContent {
  raw: string;
  directives: string[];
  philosophy: string;
  mantra: string;
}

export interface IdentityContent {
  raw: string;
  title: string;
  role: string;
  expertise: string[];
  workingStyle: string[];
  trackRecord: string[];
}

export interface ExecutionTrigger {
  condition: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ExecutionContent {
  raw: string;
  delegationPhilosophy: string;
  parallelPatterns: string[];
  delegationTriggers: ExecutionTrigger[];
  escalationPath: string;
  neverDoDirectly: string[];
}

export interface StagnationRule {
  threshold: number;
  action: string;
  description: string;
}

export interface GuardianZone {
  path: string;
  classification: 'WORKSPACE' | 'SANDBOX' | 'SYSTEM' | 'PERSONAL';
  allowed: boolean;
}

export interface EvidenceRule {
  level: 'STRONG' | 'WEAK' | 'UNACCEPTABLE';
  description: string;
}

export interface QualityContent {
  raw: string;
  qualityGates: string[];
  antiHallucinationValidators: string[];
  debugProtocol: string[];
  stagnationDetection: StagnationRule[];
  guardianZones: GuardianZone[];
  evidenceHierarchy: EvidenceRule[];
}

export interface ToolsContent {
  raw: string;
  openCode: string[];
  swarm: string[];
  cluster: string[];
}

export type IdentityFileType = 
  | 'KRAKEN.md' 
  | 'IDENTITY.md' 
  | 'EXECUTION.md' 
  | 'QUALITY.md'
  | 'TOOLS.md';

export interface IdentityBundle {
  role: string;
  soul: SoulContent;
  identity: IdentityContent;
  execution?: ExecutionContent;
  quality: QualityContent;
  tools?: ToolsContent;
  metadata: {
    loadedAt: string;
    version: string;
    sourceDir: string;
  };
}