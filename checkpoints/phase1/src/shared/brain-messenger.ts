/**
 * src/shared/brain-messenger.ts
 * 
 * V1.2 Brain Messenger - Priority signaling between brains
 * 
 * Structured message schema - no natural language overrides.
 */

export type MessageType = 'context-inject' | 'gate-failure' | 'checkpoint' | 'override' | 'sync';
export type MessagePriority = 'critical' | 'high' | 'normal' | 'low';

export interface BrainMessage {
  from: string;
  to: string;
  type: MessageType;
  priority: MessagePriority;
  payload: Record<string, unknown>;
  requiresAck: boolean;
  timestamp: number;
}

export interface OverrideCommand {
  id: string;
  from: string;
  to: string;
  action: 'ABORT' | 'CLAIM_COMPLETE' | 'REASSIGN' | 'RETRIEVE_OUTPUTS' | 'RETRY' | 'SUSPEND' | 'RESUME';
  target: { taskId?: string; brainId?: string; clusterId?: string };
  payload: Record<string, unknown>;
  priority: MessagePriority;
  requiresAck: boolean;
  createdAt: number;
}

export type OverrideStatus = 'pending' | 'acknowledged' | 'executing' | 'completed' | 'rejected' | 'failed';

export interface OverrideResult {
  commandId: string;
  status: OverrideStatus;
  result?: {
    success: boolean;
    outputs?: string[];
    error?: string;
  };
  respondedAt: number;
}

type MessageHandler = (message: BrainMessage) => void | Promise<void>;

export class BrainMessenger {
  private messageQueue: BrainMessage[] = [];
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private pendingCommands: Map<string, OverrideCommand> = new Map();
  private commandResults: Map<string, OverrideResult> = new Map();
  private messageId = 0;
  private subscribedBrains: Set<string> = new Set();

  send(message: Omit<BrainMessage, 'timestamp'> & { timestamp?: number }): void {
    const msg: BrainMessage = {
      ...message,
      timestamp: message.timestamp ?? Date.now(),
    };
    
    this.messageQueue.push(msg);
    
    // Deliver to specific brain or broadcast
    if (message.to === '*') {
      this.broadcast(msg);
    } else {
      this.deliverToBrain(message.to, msg);
    }
  }

  sendOverride(command: OverrideCommand): OverrideResult {
    this.pendingCommands.set(command.id, command);
    
    // Create matching result
    const result: OverrideResult = {
      commandId: command.id,
      status: 'pending',
      respondedAt: Date.now(),
    };
    this.commandResults.set(command.id, result);
    
    // Send the override message
    this.send({
      from: command.from,
      to: command.to,
      type: 'override',
      priority: command.priority,
      payload: {
        commandId: command.id,
        action: command.action,
        target: command.target,
        ...command.payload,
      },
      requiresAck: command.requiresAck,
    });
    
    return result;
  }

  subscribe(brainId: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(brainId)) {
      this.handlers.set(brainId, new Set());
    }
    this.handlers.get(brainId)!.add(handler);
    this.subscribedBrains.add(brainId);
    
    // Return unsubscribe function
    return () => {
      const brainHandlers = this.handlers.get(brainId);
      if (brainHandlers) {
        brainHandlers.delete(handler);
      }
    };
  }

  acknowledgeCommand(commandId: string, status: OverrideStatus): void {
    const result = this.commandResults.get(commandId);
    if (result) {
      result.status = status;
      result.respondedAt = Date.now();
    }
  }

  completeCommand(commandId: string, result: OverrideResult['result']): void {
    const cmdResult = this.commandResults.get(commandId);
    if (cmdResult) {
      cmdResult.status = 'completed';
      cmdResult.result = result;
      cmdResult.respondedAt = Date.now();
    }
  }

  getCommandStatus(commandId: string): OverrideResult | undefined {
    return this.commandResults.get(commandId);
  }

  deliverMessage(from: string, to: string, type: MessageType, payload: Record<string, unknown>, priority: MessagePriority = 'normal'): void {
    this.send({
      from,
      to,
      type,
      priority,
      payload,
      requiresAck: false,
    });
  }

  private deliverToBrain(brainId: string, message: BrainMessage): void {
    const handlers = this.handlers.get(brainId);
    if (handlers) {
      for (const handler of handlers) {
        try {
          const result = handler(message);
          if (result instanceof Promise) {
            result.catch(err => console.error(`[BrainMessenger] Handler error for ${brainId}:`, err));
          }
        } catch (err) {
          console.error(`[BrainMessenger] Handler error for ${brainId}:`, err);
        }
      }
    }
  }

  private broadcast(message: BrainMessage): void {
    for (const brainId of this.subscribedBrains) {
      if (brainId !== message.from) {
        this.deliverToBrain(brainId, message);
      }
    }
  }

  getQueuedMessages(brainId?: string): BrainMessage[] {
    if (brainId) {
      return this.messageQueue.filter(m => m.to === brainId || m.to === '*');
    }
    return [...this.messageQueue];
  }

  /**
   * Drain (return AND remove) messages for a brain.
   * BrainConcurrencyManager uses this in polling loops to consume messages.
   * Without draining, the same message is re-processed every poll cycle.
   */
  drainMessages(brainId: string): BrainMessage[] {
    const drained: BrainMessage[] = [];
    this.messageQueue = this.messageQueue.filter(m => {
      if (m.to === brainId || m.to === '*') {
        drained.push(m);
        return false; // remove from queue
      }
      return true; // keep
    });
    return drained;
  }

  clearQueue(): void {
    this.messageQueue = [];
  }

  generateMessageId(): string {
    return `msg-${++this.messageId}`;
  }
}

// Singleton instance for global brain communication
let globalMessenger: BrainMessenger | null = null;

export function createBrainMessenger(): BrainMessenger {
  if (!globalMessenger) {
    globalMessenger = new BrainMessenger();
  }
  return globalMessenger;
}

export function getBrainMessenger(): BrainMessenger {
  if (!globalMessenger) {
    globalMessenger = new BrainMessenger();
  }
  return globalMessenger;
}