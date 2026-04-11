import type { Hooks } from '@opencode-ai/plugin';
import { createSubagentTools } from './tools/index.js';
import { loggerObj } from './utils/cli.js';

const PLUGIN_NAME = 'OpenCodeSubagentManager';
const PLUGIN_VERSION = '1.0.0';

export default async function OpenCodeSubagentManager(): Promise<Hooks> {
  loggerObj.info(`${PLUGIN_NAME} v${PLUGIN_VERSION} initializing`);

  const tools = createSubagentTools();

  loggerObj.info(`${PLUGIN_NAME} initialized`, {
    toolCount: Object.keys(tools).length,
    tools: Object.keys(tools),
  });

  return {
    tool: tools,
  };
}
