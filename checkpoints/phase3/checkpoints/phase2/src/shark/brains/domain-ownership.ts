/**
 * Domain Ownership — Authoritative State Domain Mapping
 *
 * Defines which brains can write to which state domains.
 * Key invariant: A brain can only write to domains it owns.
 * All brains can read all domains (read-only observation).
 */

export type DomainName =
  | 'execution-state'
  | 'thinking-state'
  | 'context-bridge'
  | 'workflow-state'
  | 'quality-state'
  | 'security-state'
  | 'plan-state';

export type BrainName = 'shark-execution' | 'shark-reasoning' | 'shark-system';

export const DOMAIN_OWNERSHIP: Record<DomainName, BrainName[]> = {
  'execution-state': ['shark-execution', 'shark-system'],
  'thinking-state': ['shark-reasoning', 'shark-system'],
  'context-bridge': ['shark-reasoning'],
  'workflow-state': ['shark-system', 'shark-reasoning'],
  'quality-state': ['shark-execution', 'shark-system'],
  'security-state': ['shark-system'],
  'plan-state': ['shark-execution', 'shark-reasoning', 'shark-system'],
};

export function canWrite(domain: DomainName, brain: BrainName): boolean {
  return DOMAIN_OWNERSHIP[domain].includes(brain);
}

export function canRead(_domain: DomainName, _brain: BrainName): boolean {
  return true; // All brains can read all domains
}

export function getOwnedDomains(brain: BrainName): DomainName[] {
  return Object.entries(DOMAIN_OWNERSHIP)
    .filter(([, owners]) => owners.includes(brain))
    .map(([domain]) => domain as DomainName);
}

export function getWriters(domain: DomainName): BrainName[] {
  return DOMAIN_OWNERSHIP[domain];
}