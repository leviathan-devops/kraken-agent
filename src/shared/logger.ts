/**
 * src/shared/logger.ts
 *
 * Structured logger for Kraken v1.4
 * Uses console.error (stderr) to avoid interfering with plugin output.
 *
 * P6 FIX: process.env.KRAKEN_DEBUG accessed with null-safe fallback
 */

import type { Logger } from '../types.js';

export function createLogger(component: string): Logger {
  const prefix = `[Kraken:${component}]`;

  // P6: Check process.env existence and provide fallback
  const isDebugEnabled = (): boolean => {
    const debugVal = process.env.KRAKEN_DEBUG;
    return debugVal === '1' || debugVal === 'true';
  };

  return {
    info(message: string, data?: Record<string, unknown>) {
      console.error(`${prefix} INFO ${message}`, data ? JSON.stringify(data) : '');
    },

    warn(message: string, data?: Record<string, unknown>) {
      console.error(`${prefix} WARN ${message}`, data ? JSON.stringify(data) : '');
    },

    error(message: string, data?: Record<string, unknown>) {
      console.error(`${prefix} ERROR ${message}`, data ? JSON.stringify(data) : '');
    },

    debug(message: string, data?: Record<string, unknown>) {
      if (isDebugEnabled()) {
        console.error(`${prefix} DEBUG ${message}`, data ? JSON.stringify(data) : '');
      }
    },
  };
}
