/**
 * Tool Summarizer Hook — reduce tool output bloat
 * 
 * Summarizes large tool outputs to reduce token consumption:
 * - grep → "Found X matches in Y files"
 * - ls → "X entries (showing first 20)"
 * - read → First 100 lines + [truncated]
 */
import type { Hooks } from '@opencode-ai/plugin';

const MAX_OUTPUT_LINES = 100;
const MAX_LS_ENTRIES = 20;

export function createToolSummarizerHook(): Hooks['tool.execute.after'] {
  return async (input, output) => {
    const tool = input.tool;
    let outputStr = output.output || '';

    if (tool === 'Bash' || tool === 'bash') {
      if (outputStr.includes('grep') || outputStr.includes('rg ')) {
        output.output = summarizeGrep(outputStr);
      } else if (outputStr.includes('ls ') || outputStr.includes('ls\n')) {
        output.output = summarizeLs(outputStr);
      }
    }

    if (tool === 'Read' || tool === 'read') {
      output.output = summarizeRead(outputStr);
    }
  };
}

function summarizeGrep(output: string): string {
  const lines = output.split('\n').filter(l => l.trim());
  const matchCount = lines.length;
  const fileSet = new Set<string>();
  
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      fileSet.add(line.substring(0, colonIdx));
    }
  }
  
  return `grep found ${matchCount} matches across ${fileSet.size} files. Showing first 20:\n${lines.slice(0, 20).join('\n')}`;
}

function summarizeLs(output: string): string {
  const lines = output.split('\n').filter(l => l.trim());
  const total = lines.length;
  
  if (total <= MAX_LS_ENTRIES) {
    return output;
  }
  
  return `ls: ${total} entries. Showing first ${MAX_LS_ENTRIES}:\n${lines.slice(0, MAX_LS_ENTRIES).join('\n')}`;
}

function summarizeRead(output: string): string {
  const lines = output.split('\n');
  
  if (lines.length <= MAX_OUTPUT_LINES) {
    return output;
  }
  
  return `${lines.slice(0, MAX_OUTPUT_LINES).join('\n')}\n[... ${lines.length - MAX_OUTPUT_LINES} more lines truncated ...]`;
}