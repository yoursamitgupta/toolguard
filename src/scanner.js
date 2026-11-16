import { rules } from './rules/index.js';

export function normalizeTools(rawInput) {
  if (!rawInput) return [];

  // If MCP tools array or object with tools array
  if (Array.isArray(rawInput.tools)) {
    return rawInput.tools;
  }

  // If top-level array
  if (Array.isArray(rawInput)) {
    return rawInput.map(item => {
      // OpenAI function calling format
      if (item.type === 'function' && item.function) {
        return {
          name: item.function.name,
          description: item.function.description,
          inputSchema: item.function.parameters
        };
      }
      return item;
    });
  }

  // If object where keys are tool names
  if (typeof rawInput === 'object') {
    return Object.entries(rawInput).map(([name, schema]) => ({
      name,
      ...schema
    }));
  }

  return [];
}

export function lintTools(rawTools, config = {}) {
  const tools = normalizeTools(rawTools);
  const issues = [];

  function report(issue) {
    issues.push(issue);
  }

  // Check for duplicate tool names
  const seenNames = new Map();
  for (const tool of tools) {
    const name = tool.name || 'unnamed_tool';
    if (seenNames.has(name)) {
      report({
        rule: 'no-duplicate-tools',
        tool: name,
        message: `Duplicate tool name detected: '${name}'. AI models will fail to route to the correct tool.`,
        severity: 'error',
        suggestion: 'Ensure every tool has a globally unique identifier.'
      });
    } else {
      seenNames.set(name, true);
    }
  }

  // Run all modular rules
  for (const tool of tools) {
    for (const rule of Object.values(rules)) {
      rule.check(tool, report);
    }
  }

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warn');

  return {
    toolCount: tools.length,
    issues,
    errorCount: errors.length,
    warningCount: warnings.length,
    isValid: errors.length === 0
  };
}
