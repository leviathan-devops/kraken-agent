/**
 * Brain Messenger — Priority Cross-Brain Signals
 *
 * Provides async priority-based messaging between brains.
 * Priority: critical > high > normal > low
 */

export type BrainName = 'shark-execution' | 'shark-reasoning' | 'shark-system';
export type MessagePriority = 'critical' | 'high' | 'normal' | 'low';
export type MessageType = 'gate-failure' | 'context-inject' | 'checkpoint' | 'derailment' | 'phase-transition' | 'evidence-ready';

export interface BrainMessage {
  from: BrainName;
  to: BrainName;
  type: MessageType;
  priority: MessagePriority;
  payload: Record<string, unknown>;
  requiresAck: boolean;
  timestamp: string;
}

export interface BrainMessenger {
  send(msg: Omit<BrainMessage, 'timestamp'>): void;
  receive(to: BrainName): BrainMessage[];
  peek(to: BrainName): BrainMessage | null;
  ack(msgId: string): void;
  clear(to: BrainName): void;
}

const PRIORITY_ORDER: Record<MessagePriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

let messageIdCounter = 0;
const messageStore = new Map<string, BrainMessage[]>();

function getMessageQueue(brain: BrainName): BrainMessage[] {
  if (!messageStore.has(brain)) {
    messageStore.set(brain, []);
  }
  return messageStore.get(brain)!;
}

function sortByPriority(messages: BrainMessage[]): BrainMessage[] {
  return [...messages].sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
}

export function createBrainMessenger(): BrainMessenger {
  return {
    send(msg: Omit<BrainMessage, 'timestamp'>): void {
      const queue = getMessageQueue(msg.to);
      const message: BrainMessage = {
        ...msg,
        timestamp: new Date().toISOString(),
      };
      queue.push(message);
    },

    receive(to: BrainName): BrainMessage[] {
      const queue = getMessageQueue(to);
      const sorted = sortByPriority(queue);
      queue.length = 0;
      return sorted;
    },

    peek(to: BrainName): BrainMessage | null {
      const queue = getMessageQueue(to);
      if (queue.length === 0) return null;
      return sortByPriority(queue)[0];
    },

    ack(_msgId: string): void {
      // Acknowledgment tracking if needed
    },

    clear(to: BrainName): void {
      messageStore.set(to, []);
    },
  };
}

export function createGateFailureMessage(
  to: BrainName,
  gateId: string,
  failure: string
): Omit<BrainMessage, 'timestamp'> {
  return {
    from: 'shark-system',
    to,
    type: 'gate-failure',
    priority: 'critical',
    payload: { gateId, failure },
    requiresAck: true,
  };
}

export function createContextInjectMessage(
  to: BrainName,
  thinkingState: Record<string, unknown>
): Omit<BrainMessage, 'timestamp'> {
  return {
    from: 'shark-reasoning',
    to,
    type: 'context-inject',
    priority: 'high',
    payload: { thinkingState },
    requiresAck: false,
  };
}

export function createCheckpointMessage(
  to: BrainName,
  phase: string,
  completedFiles: number
): Omit<BrainMessage, 'timestamp'> {
  return {
    from: 'shark-execution',
    to: 'shark-system',
    type: 'checkpoint',
    priority: 'normal',
    payload: { phase, completedFiles },
    requiresAck: false,
  };
}

export function createDerailmentMessage(
  to: BrainName,
  detection: string,
  severity: 'critical' | 'high' | 'medium' | 'low'
): Omit<BrainMessage, 'timestamp'> {
  return {
    from: 'shark-system',
    to,
    type: 'derailment',
    priority: severity === 'critical' ? 'critical' : 'high',
    payload: { detection, severity },
    requiresAck: true,
  };
}