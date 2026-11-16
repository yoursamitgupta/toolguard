# ToolGuard 🛡️

> **Zero-dependency static analysis linter for AI Function Calling, MCP (Model Context Protocol), and LLM Tool Schemas.**  
> Catches vague descriptions, missing types, unbound arrays, prompt injection risks, and tool overlap before deployment.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-brightgreen.svg)](#)
[![Node.js CI](https://img.shields.io/badge/Node.js-18%2B-green.svg)](#)

---

## 💥 The Problem

AI models (GPT-4o, Claude 3.5, Gemini 2.0) rely entirely on tool definitions to understand **when** to call a function and **what parameters** to pass.

In production, agents frequently hallucinate arguments or pick the wrong tool because of:
1. **Vague parameter descriptions:** `"data": "input"` or `"id": "the id"`.
2. **Missing type constraints:** Parameters without explicit JSON schema types.
3. **Unbounded arrays:** Array inputs missing `items` schemas, producing malformed nested calls.
4. **Prompt injection vulnerabilities:** Embedded instructions like `"ignore previous instructions"` hidden inside descriptions.

## 🛡️ The Solution

**ToolGuard** inspects your MCP server tools or OpenAI/Anthropic schemas before you ship:

```bash
npx toolguard ./tools.json
```

Output:
```text
📄 Schema: tools.json
Scanned 4 tools. Found 2 error(s), 1 warning(s):

  ❌ ERROR [require-parameter-type] on 'lookup_user -> uid':
     Parameter 'uid' in tool 'lookup_user' is missing a 'type' definition.
     💡 Fix: Add 'type': 'string' | 'number' | 'boolean' | 'array' | 'object'.

  ❌ ERROR [prompt-injection-risk] on 'admin_action':
     Tool contains high-risk instruction override phrase: "ignore previous instructions".
     💡 Fix: Remove prompt override instructions to avoid jailbreaks.

❌ Failed: 2 error(s) must be resolved before deployment.
```

---

## 🚀 Quick Start

Run directly with `npx` (zero install needed):

```bash
# Lint an MCP server or OpenAI function schema file
npx toolguard ./mcp_tools.json

# Output as structured JSON for CI/CD pipelines
npx toolguard ./mcp_tools.json --json

# Suppress warnings and only fail on critical errors
npx toolguard ./mcp_tools.json --quiet
```

---

## 📏 Built-In Rules

| Rule | Severity | Description |
| :--- | :--- | :--- |
| `require-tool-description` | `ERROR` | Ensures tools describe their purpose (minimum 15 characters). |
| `no-vague-parameter-description` | `WARN` | Flags generic words like `"data"`, `"param"`, `"input"`. |
| `require-parameter-type` | `ERROR` | Guarantees every parameter explicitly defines a JSON type. |
| `require-array-items` | `ERROR` | Catches array parameters without `items` element types. |
| `prompt-injection-risk` | `ERROR` | Scans for instruction overrides and jailbreak directives. |
| `no-duplicate-tools` | `ERROR` | Prevents naming collisions across the toolset. |

---

## 💻 Programmatic Usage

Integrate ToolGuard directly into your TypeScript or JavaScript MCP server:

```javascript
import { lintTools } from 'toolguard';

const report = lintTools(myMcpServerTools);

if (!report.isValid) {
  console.error(`Tool schema has ${report.errorCount} critical issues!`);
}
```

---

## 🛡️ License

MIT © [Amit Gupta](https://github.com/yoursamitgupta)
