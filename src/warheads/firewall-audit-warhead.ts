/**
 * src/warheads/firewall-audit-warhead.ts — W11: JSONL Audit Trail
 *
 * Writes block events to .kraken/firewall-audit.jsonl for post-hoc analysis.
 *
 * P2: No casts needed.
 * P3: catch has console.error with file context.
 * P4: JSONL append — no unbounded writes (one line per block).
 * P6: Verified imports (fs, path).
 * P7: Path relative to cwd, not hardcoded.
 * P9: Sync appendFileSync — acceptable for audit logging.
 * P11: Real state.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type {
  Warhead, EnforcementHook, HookResult, HookContext,
  EngineState, WarheadDiagnosis, BlockEvent, KnowledgePath,
} from '../engine/types.js';
import type { KnowledgeBase } from '../knowledge/knowledge-base.js';

export class FirewallAuditWarhead implements Warhead {
  readonly name = 'firewallAuditWarhead';
  readonly priority = 'HIGH' as const;
  readonly knowledgeDependencies: KnowledgePath[] = [];

  private readonly logPath = '.kraken/firewall-audit.jsonl';
  private entries = 0;

  loadKnowledge(_base: KnowledgeBase): void {}

  getHooks(): EnforcementHook[] {
    // Passive — called by WarheadEngine when blocks occur
    return [];
  }

  recordBlock(event: BlockEvent): void {
    this.entries++;
    try {
      const dir = path.dirname(this.logPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const entry = JSON.stringify({
        layer: event.layer,
        reason: event.reason,
        toolName: event.toolName,
        agentName: event.agentName,
        timestamp: new Date().toISOString(),
      });
      fs.appendFileSync(this.logPath, entry + '\n', 'utf-8');
    } catch (e) {
      console.error('[FirewallAuditWarhead] Write failed: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  synthesize(_state: EngineState): string {
    return '[KRAKEN T1] AUDIT: ' + this.entries + ' entries at ' + this.logPath;
  }

  diagnose(): WarheadDiagnosis {
    return { name: this.name, healthy: true, hooksRegistered: 0, blocksIssued: this.entries, knowledgeLoaded: true, lastSynthesized: Date.now(), errors: [] };
  }

  getState(): Record<string, unknown> {
    return { entries: this.entries, path: this.logPath };
  }
}
