/**
 * src/identity/injector.ts
 * 
 * Identity injection into agent context
 */

import type { Session } from '@opencode-ai/plugin';
import type { IdentityBundle } from './types.js';

export interface IdentityInjector {
  inject(session: Session, bundle: IdentityBundle): Promise<void>;
  formatForSystemPrompt(bundle: IdentityBundle): string;
}

export function formatIdentityForSystemPrompt(bundle: IdentityBundle): string {
  let prompt = `
## IDENTITY

${bundle.soul.raw}

---

## ROLE

${bundle.identity.raw}

`;

  if (bundle.execution) {
    prompt += `
---

## EXECUTION PATTERNS

${bundle.execution.raw}

`;
  }

  prompt += `
---

## QUALITY & VERIFICATION

${bundle.quality.raw}
`;

  if (bundle.tools) {
    prompt += `

---

## AVAILABLE TOOLS

${bundle.tools.raw}
`;
  }

  prompt += `

---

## The Mantra

${bundle.soul.mantra}
`;

  return prompt;
}

export async function injectIdentity(
  session: Session,
  bundle: IdentityBundle
): Promise<void> {
  const formatted = formatIdentityForSystemPrompt(bundle);
  
  if (!session.context) {
    session.context = {};
  }
  
  if (!session.context.system) {
    session.context.system = [];
  }
  
  session.context.system.push({
    role: 'system',
    content: formatted,
  });
}