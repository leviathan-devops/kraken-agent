/**
 * V4 Brain Messenger — Copied from Agent Factory Edition
 *
 * Direct brain-to-brain messaging for urgent handoffs.
 * Priority ordering: critical > high > normal > low
 * At-least-once delivery with ack support.
 */

export interface BrainMessage {
  id: string;
  from: string;
  to: string;
  type: 'handoff' | 'alert' | 'request' | 'ack' | 'context-inject';
  priority: 'low' | 'normal' | 'high' | 'critical';
  payload: unknown;
  timestamp: number;
  requiresAck: boolean;
}

export interface MantaMessenger {
  send(message: Omit<BrainMessage, 'id' | 'timestamp'>): void;
  receive(brainId: string): BrainMessage[];
  waitForAck(messageId: string, timeoutMs: number): Promise<boolean>;
  getQueueDepth(brainId: string): number;
  cleanup(): void;
}

const PRIORITY_ORDER: Record<BrainMessage['priority'], number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function createMantaMessenger(): MantaMessenger {
  const queues = new Map<string, BrainMessage[]>();
  const pendingAcks = new Map<
    string,
    {
      resolved: boolean;
      resolve: (value: boolean) => void;
      reject: (reason: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
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
    send(message: Omit<BrainMessage, 'id' | 'timestamp'>): void {
      const msg: BrainMessage = {
        id: generateId(),
        from: message.from,
        to: message.to,
        type: message.type,
        priority: message.priority,
        payload: message.payload,
        timestamp: Date.now(),
        requiresAck: message.requiresAck ?? false,
      };

      const queue = getQueue(msg.to);
      queue.push(msg);
      sortQueue(queue);

      if (msg.type === 'ack') {
        if (pendingAcks.has(msg.id)) {
          const pending = pendingAcks.get(msg.id)!;
          if (!pending.resolved) {
            pending.resolved = true;
            clearTimeout(pending.timer);
            pending.resolve(true);
          }
        } else {
          receivedAcks.add(msg.id);
        }
      }
    },

    receive(brainId: string): BrainMessage[] {
      const queue = getQueue(brainId);
      const messages = [...queue];
      queue.length = 0;
      return messages;
    },

    waitForAck(messageId: string, timeoutMs: number): Promise<boolean> {
      if (receivedAcks.has(messageId)) {
        receivedAcks.delete(messageId);
        return Promise.resolve(true);
      }

      return new Promise((resolve, _reject) => {
        const timer = setTimeout(() => {
          if (!pendingAcks.has(messageId)) return;
          const pending = pendingAcks.get(messageId)!;
          if (!pending.resolved) {
            pending.resolved = true;
            resolve(false);
          }
        }, timeoutMs);

        pendingAcks.set(messageId, { resolved: false, resolve, reject: () => {}, timer });
      });
    },

    getQueueDepth(brainId: string): number {
      return getQueue(brainId).length;
    },

    cleanup(): void {
      for (const [id, pending] of pendingAcks) {
        clearTimeout(pending.timer);
        pendingAcks.delete(id);
      }
      queues.clear();
      receivedAcks.clear();
    },
  };
}
