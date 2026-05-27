/**
 * src/factory/BrainMessenger.ts
 *
 * V4 Brain Messenger
 *
 * Direct brain-to-brain messaging for urgent handoffs.
 * Priority ordering: critical > high > normal > low
 * At-least-once delivery with ack support.
 */

import type { BrainMessenger, BrainMessage } from './types.js';

const PRIORITY_ORDER: Record<BrainMessage['priority'], number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function createBrainMessenger(): BrainMessenger {
  // Queue per brain: brainId → messages[]
  const queues = new Map<string, BrainMessage[]>();
  // Pending acks: messageId → { resolved, resolve, reject, timer }
  const pendingAcks = new Map<
    string,
    {
      resolved: boolean;
      resolve: (value: boolean) => void;
      reject: (reason: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  // Pre-received acks: messageId → true (for acks that arrive before waitForAck)
  const receivedAcks = new Set<string>();

  function getQueue(brainId: string): BrainMessage[] {
    if (!queues.has(brainId)) {
      queues.set(brainId, []);
    }
    return queues.get(brainId)!;
  }

  function sortQueue(queue: BrainMessage[]): void {
    queue.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  }

  return {
    send(message: BrainMessage): void {
      const msg: BrainMessage = {
        id: message.id || generateId(),
        from: message.from,
        to: message.to,
        type: message.type,
        priority: message.priority,
        payload: message.payload,
        timestamp: message.timestamp || Date.now(),
        requiresAck: message.requiresAck ?? false,
      };

      const queue = getQueue(msg.to);
      queue.push(msg);
      sortQueue(queue);

      // If it's an ack message, resolve the pending ack (or mark as received)
      if (msg.type === 'ack') {
        if (pendingAcks.has(msg.id)) {
          const pending = pendingAcks.get(msg.id)!;
          if (!pending.resolved) {
            pending.resolved = true;
            clearTimeout(pending.timer);
            pending.resolve(true);
          }
        } else {
          // Ack arrived before waitForAck — mark it
          receivedAcks.add(msg.id);
        }
      }
    },

    receive(brainId: string): BrainMessage[] {
      const queue = getQueue(brainId);
      const messages = [...queue];
      queue.length = 0; // Drain the queue
      return messages;
    },

    waitForAck(messageId: string, timeoutMs: number): Promise<boolean> {
      // If ack was already received, resolve immediately
      if (receivedAcks.has(messageId)) {
        receivedAcks.delete(messageId);
        return Promise.resolve(true);
      }

      return new Promise((resolve, _reject) => {
        const timer = setTimeout(() => {
          if (!pendingAcks.has(messageId) || !pendingAcks.get(messageId)!.resolved) {
            resolve(false); // Timeout = not acked
          }
        }, timeoutMs);

        pendingAcks.set(messageId, { resolved: false, resolve, reject: () => {}, timer });
      });
    },
  };
}
