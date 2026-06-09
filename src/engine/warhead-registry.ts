/**
 * src/engine/warhead-registry.ts
 *
 * Warhead registry — stores and iterates warheads in priority order.
 * CRITICAL -> HIGH -> MEDIUM -> LOW.
 *
 * P2: All inputs validated. No unchecked casts.
 * P3: diagnoseAll() wraps each diagnosis in try/catch.
 * P4: Map bounded by warhead count (max ~25).
 * P6: Only imports from ./types.js.
 * P11: count() returns actual count, not a placeholder.
 */

import type { Warhead, WarheadPriority, WarheadDiagnosis } from './types.js';

const PRIORITY_ORDER: Record<WarheadPriority, number> = {
  'CRITICAL': 0,
  'HIGH': 1,
  'MEDIUM': 2,
  'LOW': 3,
};

export class WarheadRegistry {
  private warheads = new Map<string, Warhead>();

  /**
   * Register a warhead. Logs error if duplicate name.
   */
  register(warhead: Warhead): void {
    if (this.warheads.has(warhead.name)) {
      console.error('[WarheadRegistry] Duplicate warhead: ' + warhead.name);
      return;
    }
    this.warheads.set(warhead.name, warhead);
  }

  /**
   * Get all warheads, sorted by priority (CRITICAL first).
   */
  getByPriority(): Warhead[] {
    return Array.from(this.warheads.values()).sort((a, b) => {
      return (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99);
    });
  }

  /**
   * Get all warheads in registration order.
   */
  getAll(): Warhead[] {
    return Array.from(this.warheads.values());
  }

  /**
   * Get a specific warhead by name.
   */
  get(name: string): Warhead | undefined {
    return this.warheads.get(name);
  }

  /**
   * Count registered warheads.
   */
  count(): number {
    return this.warheads.size;
  }

  /**
   * Diagnose all warheads. Returns WarheadDiagnosis for each.
   * One broken warhead cannot kill the entire diagnosis.
   */
  diagnoseAll(): WarheadDiagnosis[] {
    return this.getAll().map(w => {
      try {
        return w.diagnose();
      } catch (err) {
        return {
          name: w.name,
          healthy: false,
          hooksRegistered: 0,
          blocksIssued: 0,
          knowledgeLoaded: false,
          lastSynthesized: 0,
          errors: ['diagnose() threw: ' + (err instanceof Error ? err.message : String(err))],
        };
      }
    });
  }
}
