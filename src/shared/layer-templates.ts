/**
 * Layer Templates - Markdown templates for each layer of each mode
 */

import { PlanningMode } from '../modes/planning/index.js';
import { ProblemSolvingMode } from '../modes/problem-solving/index.js';
import { ContextSynthesisMode } from '../modes/context-synthesis/index.js';

export interface LayerTemplate {
  mode: string;
  layer: number;
  name: string;
  content: string;
  antiDerailmentCheck: string[];
  structuralRequirements: Array<{ field: string; requirement: string; enforces: string }>;
}

export class LayerTemplateGenerator {
  private planningMode = PlanningMode;
  private problemSolvingMode = ProblemSolvingMode;
  private contextSynthesisMode = ContextSynthesisMode;

  getPlanningLayer1(): LayerTemplate {
    return {
      mode: 'planning',
      layer: 1,
      name: 'Initial Plan',
      content: `# LAYER 1: INITIAL PLAN

## Surface Understanding
[Explain what is being asked in YOUR OWN WORDS - not the user's words, your interpretation.
What is the CORE problem being solved? What does success look like?]

---

## First Principles
[3+ fundamental truths that govern this domain. These are non-negotiable.
When you can't decide, these principles should guide you.]

1. [Principle 1]
2. [Principle 2]
3. [Principle 3]

---

## Constraints
[3+ limits that must be respected. These bound the solution space.]

- [Constraint 1]
- [Constraint 2]
- [Constraint 3]

---

## Success Criteria
[How do we know we've succeeded? Be specific and measurable.]

1. [Criteria 1]
2. [Criteria 2]

---

## Open Questions
[2+ things we don't yet know that need investigation. Acknowledge uncertainty.]

- [Question 1]
- [Question 2]

---

## Direction
[Initial approach, technology choices, key decisions already made.
What path are we heading down and why?]`,
      antiDerailmentCheck: [
        'Surface understanding is NOT just restating what user said',
        'First principles are FUNDAMENTAL truths, not implementation details',
        'Constraints are REAL limits, not "we should do good testing"',
        'Success criteria are MEASURABLE',
        'Open questions identify ACTUAL gaps in understanding'
      ],
      structuralRequirements: [
        { field: 'Surface Understanding', requirement: 'Must explain in YOUR words, not parrot user', enforces: 'True comprehension' },
        { field: 'First Principles', requirement: '3+ non-negotiable truths', enforces: 'First principles thinking' },
        { field: 'Constraints', requirement: '3+ limits that bound the problem', enforces: 'Problem scoping' },
        { field: 'Success Criteria', requirement: 'Specific and measurable', enforces: 'Clear definition of done' },
        { field: 'Open Questions', requirement: '2+ acknowledged unknowns', enforces: 'Intellectual honesty' }
      ]
    };
  }

  getProblemSolvingLayer1(): LayerTemplate {
    return {
      mode: 'problem-solving',
      layer: 1,
      name: 'Assumption Statement',
      content: `# LAYER 1: ASSUMPTION STATEMENT

## Problem Being Solved
[Brief statement of the problem]

---

## 1.1 Explicit Assumption
[State your assumption in ONE clear sentence. What do you believe will happen?]

**Assumption:** [Your explicit assumption]

---

## 1.2 Reasoning Chain
[Why do you believe this assumption is true? Document your reasoning chain.]

1. [Reason 1]
2. [Reason 2]
3. [Reason 3]

---

## 1.3 Success Criteria
[What does success look like? How will you know if this assumption is correct?]

1. [Criteria 1 - specific, observable]
2. [Criteria 2 - specific, observable]

---

## 1.4 Confirmation / Disproof Criteria
[What would prove this assumption right OR wrong? What evidence would confirm or deny?]

**Would confirm:** [What evidence would prove this true]
**Would disprove:** [What evidence would prove this false]`,
      antiDerailmentCheck: [
        'Assumption is EXPLICIT, not vague',
        'Reasoning chain shows WHY you believe it',
        'Success criteria are OBSERVABLE, not subjective',
        'You acknowledge what would disprove your assumption'
      ],
      structuralRequirements: [
        { field: 'Explicit Assumption', requirement: 'One clear sentence stating what you believe', enforces: 'Prevents vague "I\'ll try X"' },
        { field: 'Reasoning Chain', requirement: '3+ reasons why you believe this', enforces: 'Prevents unexamined assumptions' },
        { field: 'Success Criteria', requirement: 'Specific, observable outcomes', enforces: 'Prevents "I think it worked"' },
        { field: 'Confirmation/Disproof', requirement: 'What would prove right/wrong', enforces: 'Prevents confirmation bias' }
      ]
    };
  }

  getProblemSolvingLayer3(): LayerTemplate {
    return {
      mode: 'problem-solving',
      layer: 3,
      name: 'Observation & Evidence',
      content: `# LAYER 3: OBSERVATION & EVIDENCE

## Problem Being Solved
[Brief statement of the problem]

---

## 3.1 Raw Evidence
[Copy ACTUAL output here. Don't describe - show. Raw, unedited output.]

**Actual output:**
\`\`\`
[PASTE ACTUAL OUTPUT HERE - exactly what happened]
\`\`\`

---

## 3.2 Logs Checked
[Did you check logs? What did they show?]

| Log Source | What Checked | Result |
|------------|--------------|--------|
| [Log 1] | [What looked for] | [What found] |

---

## 3.3 Expected vs Actual Comparison
[Compare what you expected vs what actually happened]

| Aspect | Expected | Actual | Difference |
|--------|----------|--------|------------|
| [Aspect 1] | [What you expected] | [What happened] | [Gap] |

---

## 3.4 Evidence Source Validation
[Is this evidence valid? Evidence from external system (logs, API) is valid. Evidence created by agent (JSON you wrote) is NOT valid.]

| Evidence | Source | Valid? |
|----------|--------|--------|
| [Evidence 1] | [External/Agent-created] | Yes/No |

**Rule:** Evidence created by agent = invalid. Only external system logs/API responses count.`,
      antiDerailmentCheck: [
        'Raw output is COPY-PASTED, not described',
        'Logs were CHECKED (not just API responses)',
        'Expected vs Actual is in TABLE format',
        'No self-referencing proofs (agent-created files don\'t count)'
      ],
      structuralRequirements: [
        { field: 'Raw Evidence', requirement: 'Copy-paste actual output, don\'t describe', enforces: 'Prevents "it worked" without proof' },
        { field: 'Logs Checked', requirement: 'Explicit log checks documented', enforces: 'Prevents assuming from API only' },
        { field: 'Expected vs Actual', requirement: 'Side-by-side comparison table', enforces: 'Clear gap identification' },
        { field: 'Evidence Validation', requirement: 'External vs agent-created distinguished', enforces: 'Prevents self-referencing proofs' }
      ]
    };
  }

  getContextSynthesisLayer1(): LayerTemplate {
    return {
      mode: 'context-synthesis',
      layer: 1,
      name: 'Context Collection',
      content: `# LAYER 1: CONTEXT COLLECTION

## Session Info
- **Session ID:** [Session ID]
- **Current Gate:** [PLAN/BUILD/TEST/VERIFY/AUDIT/DELIVERY]
- **Active Task:** [What agent is working on]

---

## T1: Session Context
**Method:** Kraken brain state API
**Status:** [Available/Unavailable]

| State | Value |
|-------|-------|
| Current Gate | [Gate] |
| Active Task | [Task] |
| Blockers | [List] |

---

## T2: Knowledge Context
**Method:** hermes_remember, hive_context, kraken_hive_search
**Status:** [Available/Unavailable]

### From hermes_remember
[Recent remembered items]

### From hive_context
[Relevant past sessions]

### From kraken_hive
[Patterns, decisions]

---

## T3: File Context
**Method:** Read active files
**Status:** [Available/Unavailable]

| File | Relevance |
|------|-----------|
| [File 1] | [High/Med/Low] |

---

## T4: Tool Context
**Method:** Recent commands
**Status:** [Available/Unavailable]

| Recent Tool | Count |
|------------|-------|
| [Tool 1] | [N] |

---

## Collection Summary

| Source | Status | Content Size |
|--------|--------|--------------|
| T1: Session | [✅/❌] | [Tokens] |
| T2: Knowledge | [✅/❌] | [Tokens] |
| T3: Files | [✅/❌] | [Tokens] |
| T4: Tools | [✅/❌] | [Tokens] |`,
      antiDerailmentCheck: [
        'All 4 source types checked',
        'Available sources identified',
        'Unavailable sources noted',
        'Collection is COMPLETE'
      ],
      structuralRequirements: [
        { field: 'Session State', requirement: 'Gate, task, blockers', enforces: 'Current position known' },
        { field: 'T2 Knowledge', requirement: 'hermes/hive/kraken', enforces: 'Past patterns captured' },
        { field: 'Active Files', requirement: 'Files + relevance', enforces: 'Working context known' },
        { field: 'Tool History', requirement: 'Recent commands', enforces: 'Execution pattern known' }
      ]
    };
  }

  getContextSynthesisLayer4(): LayerTemplate {
    return {
      mode: 'context-synthesis',
      layer: 4,
      name: 'Injection Format',
      content: `# CONTEXT INJECTION — [SESSION_ID] — [TIMESTAMP]

---

## 📍 CURRENT POSITION
**Gate:** [PLAN/BUILD/TEST/VERIFY/AUDIT/DELIVERY]
**Task:** [Active task]
**Blockers:** [Current blockers - if any]

---

## 🎯 IMMEDIATE PRIORITIES (Ranked)
1. **[Highest Score]** - [Context]
2. **[Second]** - [Context]
3. **[Third]** - [Context]

---

## 🧠 INJECTED KNOWLEDGE
[Synthesized from T2 - decisions, patterns, constraints]

---

## 📁 ACTIVE FILES
- [File 1]: [Brief summary]
- [File 2]: [Brief summary]

---

## 🔧 RECENT EXECUTION
- Recent errors to avoid: [List]
- Tool patterns: [Pattern]

---

## 💡 SYNTHESIZED INSIGHT
[Cross-cutting analysis from all sources]

---

---
**Token Count:** [X] | **Sources:** [N]`,
      antiDerailmentCheck: [
        'Under 2k tokens total',
        'All sections populated',
        'Ready for T0 injection',
        'No placeholder text'
      ],
      structuralRequirements: [
        { field: 'Current Position', requirement: 'Gate + task + blockers', enforces: 'Context known' },
        { field: 'Priorities', requirement: 'Top 3 ranked', enforces: 'Clear focus' },
        { field: 'Injected Knowledge', requirement: 'From T2', enforces: 'Past patterns' },
        { field: 'Active Files', requirement: 'Relevant files', enforces: 'Working context' },
        { field: 'Synthesized Insight', requirement: 'Cross-cutting', enforces: 'Deep analysis' }
      ]
    };
  }
}

export default new LayerTemplateGenerator();