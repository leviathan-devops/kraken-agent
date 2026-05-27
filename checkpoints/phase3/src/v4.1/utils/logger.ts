/**
 * src/v4.1/utils/logger.ts
 * 
 * Simple logger for v4.1 hooks.
 * Logs to console with plugin prefix.
 */

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

const LOG_PREFIX = '[v4.1]';

export function createLogger(pluginName: string): Logger {
  const prefix = `${LOG_PREFIX}[${pluginName}]`;
  
  return {
    debug(message: string, meta?: Record<string, unknown>) {
      console.debug(`${prefix} ${message}`, meta ?? {});
    },
    
    info(message: string, meta?: Record<string, unknown>) {
      console.info(`${prefix} ${message}`, meta ?? {});
    },
    
    warn(message: string, meta?: Record<string, unknown>) {
      console.warn(`${prefix} ${message}`, meta ?? {});
    },
    
    error(message: string, meta?: Record<string, unknown>) {
      console.error(`${prefix} ${message}`, meta ?? {});
    },
  };
}
