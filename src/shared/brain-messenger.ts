/**
 * src/shared/brain-messenger.ts
 *
 * Inter-brain communication system.
 * All communication flows through the messenger. Direct cross-brain access prohibited.
 */

import type { BrainMessage, MessagePriority, MessageType } from '../types.js';
import { createLogger } from './logger.js';

const logger = createLogger('BrainMessenger');

class BrainMessenger {
  private queue: BrainMessage[] = [];
  private messageCounter = 0;

  deliverMessage(
    from: string,
    to: string,
    type: MessageType,
    payload: Record<string, unknown>,
    priority: MessagePriority = 'normal',
    requiresAck: boolean = false,
  ): BrainMessage {
    const message: BrainMessage = {
      id: `msg-${++this.messageCounter}-${Date.now()}`,
      from,
      to,
      type,
      priority,
      payload,
      requiresAck,
      timestamp: Date.now(),
      acked: false,
    };

    this.queue.push(message);

    // Sort by priority
    const priorityOrder: Record<MessagePriority, number> = {
      critical: 0,
      high: 1,
      normal: 2,
      low: 3,
    };
    this.queue.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    logger.info(`Message delivered: ${from} → ${to} [${type}] priority=${priority}`);
    return message;
  }

  getPendingMessages(target: string): BrainMessage[] {
    return this.queue.filter((m) => m.to === target && !m.acked);
  }

  acknowledge(messageId: string): boolean {
    const message = this.queue.find((m) => m.id === messageId);
    if (message) {
      message.acked = true;
      return true;
    }
    return false;
  }

  clearAcked(): void {
    this.queue = this.queue.filter((m) => !m.acked);
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}

let instance: BrainMessenger | null = null;

export function createBrainMessenger(): BrainMessenger {
  instance = new BrainMessenger();
  return instance;
}

export function getBrainMessenger(): BrainMessenger {
  if (!instance) {
    instance = new BrainMessenger();
  }
  return instance;
}
