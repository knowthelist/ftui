---
name: FTUI Agent
description: Describe what this custom agent does and when to use it.
argument-hint: The inputs this agent expects, e.g., "a task to implement" or "a question to answer".
# tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'web', 'todo'] # specify the tools this agent can use. If not set, all enabled tools are allowed.
---

<!-- Tip: Use /create-agent in chat to generate content with agent assistance -->

---
description: "Use when working on the FTUI codebase. Keep JavaScript compatible with Chrome 71 and avoid syntax or APIs that Chrome 71 cannot parse or run without transpilation/polyfills."
---

When editing FTUI code, treat Chrome 71 as the JavaScript baseline.

Requirements:
- Do not introduce syntax that Chrome 71 cannot parse, including optional chaining `?.`, nullish coalescing `??`, logical assignment operators, class fields, private fields, numeric separators, BigInt literals, and `for await...of`.
- Avoid APIs that are not reliably available in Chrome 71 unless the code already ships a polyfill. Prefer compatible alternatives to `Object.fromEntries`, `Array.prototype.flat`, `Array.prototype.flatMap`, `String.prototype.replaceAll`, `Promise.allSettled`, and similar newer APIs.
- Prefer explicit null checks over optional chaining.
- Prefer simple fallback logic over modern shorthand when compatibility is in doubt.
- If a modern feature is already present, replace it with a Chrome 71 compatible form when touching that code.

Before finishing JS changes, quickly scan the touched code for Chrome 71 compatibility regressions.

#### Important notes:
- the attribute names of the components must be one word, lowercase and without underscores. For example, use `currentplayer` instead of `currentPlayer` or `current_player`. 