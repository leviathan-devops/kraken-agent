/**
 * src/clusters/acp.ts
 *
 * ACP — Agent Coordination Protocol.
 *
 * Enables inter-agent coordination within a tentacle:
 *   - Agents can send/receive CoordinationMessages
 *   - Agents can declare dependencies on other agents
 *   - awaitDependency blocks until all dependencies complete
 *   - Thread-safe via Map-based storage
 *
 * Architecture:
 *   - Each CoordinationMessage is stored in the recipient's inbox
 *   - A full message log is maintained for auditing
 *   - Dependency completion is tracked via 'result' type messages
 *   - Timeout safety prevents indefinite blocking
 */

import type { CoordinationMessage } from './cluster-types.js';

export class AgentCoordinator {
  /** Per-slot message inboxes (toSlot -> messages) */
  private inboxes: Map<string, CoordinationMessage[]> = new Map();

  /** Full chronological message log */
  private messageLog: CoordinationMessage[] = [];

  /** Set of slot IDs that have completed (sent 'result') */
  private completedSlots: Set<string> = new Set();

  /** Dependency tracking: awaitingSlot -> its dependency slot IDs */
  private depWaitMap: Map<string, string[]> = new Map();

  /** Resolvers keyed by awaiting slot ID */
  private depResolvers: Map<string, Array<() => void>> = new Map();

  /** Timeout handles for cleanup on dependency wait */
  private depTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();

  /**
   * Send a CoordinationMessage to a slot (or broadcast).
   * If type is 'result', the sender is marked completed,
   * and any awaitDependency promises waiting on this slot resolve.
   */
  sendMessage(msg: CoordinationMessage): void {
    this.validateMessage(msg);

    // Store in recipient's inbox
    const targetSlot = msg.toSlot;
    const inbox = this.inboxes.get(targetSlot) ?? [];
    inbox.push(msg);
    this.inboxes.set(targetSlot, inbox);

    // Append to full audit log
    this.messageLog.push(msg);

    // If this is a completion signal, resolve dependencies
    if (msg.type === 'result') {
      this.completedSlots.add(msg.fromSlot);
      this.resolveDependenciesFor(msg.fromSlot);
    }
  }

  /**
   * Retrieve all pending messages for a given slot.
   * Does NOT clear the inbox — messages persist until consumed externally.
   */
  getMessagesForSlot(slotId: string): CoordinationMessage[] {
    return this.inboxes.get(slotId) ?? [];
  }

  /**
   * Return the full message log (chronological).
   * Returns a shallow copy to prevent external mutation.
   */
  getMessageLog(): CoordinationMessage[] {
    return [...this.messageLog];
  }

  /**
   * Clear messages from a specific slot's inbox, or ALL state if no slot specified.
   *
   * Call during dissolveTentacle to free accumulated message memory:
   *   t.coordinator?.clearInbox();
   *
   * When slotId is provided: only that slot's inbox is cleared (targeted cleanup).
   * When slotId is omitted: ALL inboxes, completion tracking, and dependency
   * waits are cleared. The message log is preserved for post-dissolve audit.
   *
   * @param slotId - Optional. Specific slot inbox to clear. Omit for full reset.
   *
   * P4: Resource lifecycle — messages consume memory. Long-running tentacles
   *     with frequent coordination messages accumulate unbounded inboxes
   *     without this cleanup call.
   */
  clearInbox(slotId?: string): void {
    if (slotId) {
      this.inboxes.delete(slotId);
    } else {
      this.inboxes.clear();
      this.completedSlots.clear();
      this.depWaitMap.clear();
      this.depResolvers.clear();
      for (const timeout of this.depTimeouts.values()) {
        clearTimeout(timeout);
      }
      this.depTimeouts.clear();
    }
  }

  /**
   * Block until all specified dependency slots have completed.
   * A slot is considered completed when it sends a 'result'-type message.
   *
   * @param slotId - The awaiting slot's ID
   * @param dependsOn - Array of slot IDs this slot depends on
   * @returns Promise that resolves when all dependencies are met
   * @throws Error if timeout (30s) is exceeded
   */
  async awaitDependency(slotId: string, dependsOn: string[]): Promise<void> {
    if (!slotId) {
      throw new Error('[AgentCoordinator] slotId is required for awaitDependency');
    }
    if (!dependsOn || dependsOn.length === 0) {
      return; // Nothing to wait for
    }

    // Filter out already-completed slots
    const pending = dependsOn.filter(d => !this.completedSlots.has(d));
    if (pending.length === 0) {
      return; // All dependencies already satisfied
    }

    return new Promise<void>((resolve, reject) => {
      // Register the dependency wait
      this.depWaitMap.set(slotId, dependsOn);

      const existingResolvers = this.depResolvers.get(slotId);
      if (existingResolvers) {
        existingResolvers.push(resolve);
      } else {
        this.depResolvers.set(slotId, [resolve]);
      }

      // Safety timeout: reject if dependencies don't complete in 30s
      const timeout = setTimeout(() => {
        if (this.depWaitMap.has(slotId)) {
          this.depWaitMap.delete(slotId);
          this.depResolvers.delete(slotId);
          this.depTimeouts.delete(slotId);
          reject(
            new Error(
              `[AgentCoordinator] awaitDependency timed out for slot '${slotId}' ` +
              `waiting on: ${pending.join(', ')}`
            )
          );
        }
      }, 30_000);
      this.depTimeouts.set(slotId, timeout);
    });
  }

  /**
   * Validate that a CoordinationMessage has all required fields.
   * Throws on invalid input with descriptive message.
   */
  private validateMessage(msg: CoordinationMessage): void {
    if (!msg.msgId) throw new Error('[AgentCoordinator] msgId is required');
    if (!msg.fromSlot) throw new Error('[AgentCoordinator] fromSlot is required');
    if (!msg.toSlot) throw new Error('[AgentCoordinator] toSlot is required');
    if (!msg.type) throw new Error('[AgentCoordinator] type is required');
    if (!msg.payload) throw new Error('[AgentCoordinator] payload is required');

    const validTypes = ['dependency', 'handoff', 'sync', 'result'] as const;
    if (!validTypes.includes(msg.type as typeof validTypes[number])) {
      throw new Error(
        `[AgentCoordinator] invalid message type '${msg.type}'. ` +
        `Valid types: ${validTypes.join(', ')}`
      );
    }
  }

  /**
   * After a slot completes, check all registered dependency waits.
   * If any awaiting slot has all its dependencies satisfied, resolve it.
   */
  private resolveDependenciesFor(completedSlotId: string): void {
    for (const [awaitingSlot, deps] of this.depWaitMap.entries()) {
      const allDone = deps.every(d => this.completedSlots.has(d));
      if (allDone) {
        // Resolve all registered callbacks for this slot
        const resolvers = this.depResolvers.get(awaitingSlot);
        if (resolvers) {
          for (const resolve of resolvers) {
            resolve();
          }
        }

        // Cleanup tracking state
        this.depResolvers.delete(awaitingSlot);
        this.depWaitMap.delete(awaitingSlot);

        const timeout = this.depTimeouts.get(awaitingSlot);
        if (timeout) clearTimeout(timeout);
        this.depTimeouts.delete(awaitingSlot);
      }
    }
  }
}
