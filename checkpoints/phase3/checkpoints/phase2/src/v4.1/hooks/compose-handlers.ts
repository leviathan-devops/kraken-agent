/**
 * src/v4.1/hooks/compose-handlers.ts
 * 
 * Hook composition utilities — chains multiple handlers.
 * Each handler receives ctx for safety context.
 */

import type { HookHandler } from './safe-hook.js';

export function composeHandlers<I = unknown, O = unknown>(
  ...handlers: Array<HookHandler<I, O> | undefined>
): HookHandler<I, O> {
  const validHandlers = handlers.filter((h): h is HookHandler<I, O> => h !== undefined);

  return async (input: I, output: O, ctx: any) => {
    for (const handler of validHandlers) {
      await handler(input, output, ctx);
    }
  };
}

export function composeHandlersSync<I = unknown, O = unknown>(
  ...handlers: Array<((input: I, output: O, ctx: any) => void) | undefined>
): HookHandler<I, O> {
  const validHandlers = handlers.filter((h): h is (input: I, output: O, ctx: any) => void => h !== undefined);

  return async (input: I, output: O, ctx: any) => {
    for (const handler of validHandlers) {
      handler(input, output, ctx);
    }
  };
}
