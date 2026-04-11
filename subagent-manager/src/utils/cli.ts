import { spawn } from 'child_process';
import { logger } from './logger.js';

export async function executePythonWrapper(scriptPath: string, args: string[]): Promise<{ stdout: string, stderr: string, exitCode: number }> {
  return new Promise((resolve) => {
    const proc = spawn('python3', [scriptPath, ...args]);
    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => stdout += data.toString());
    proc.stderr?.on('data', (data) => stderr += data.toString());

    proc.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 0 });
    });
  });
}

export const loggerObj = {
  info: (msg: string, meta?: any) => console.log(`[SubAgentManager][INFO] ${msg}`, meta || ''),
  error: (msg: string, meta?: any) => console.error(`[SubAgentManager][ERROR] ${msg}`, meta || ''),
  debug: (msg: string, meta?: any) => console.log(`[SubAgentManager][DEBUG] ${msg}`, meta || ''),
};
