/**
 * Core linting rules for AI function calling and MCP tool schemas.
 */

const VAGUE_WORDS = new Set([
  'data', 'input', 'param', 'params', 'value', 'val', 'arg', 'args',
  'item', 'the data', 'the input', 'the value', 'query', 'string', 'number'
]);

export const rules = {
  'require-tool-description': {
    severity: 'error',
    description: 'Every tool must have a descriptive purpose statement (minimum 15 characters).',
    check(tool, report) {
      if (!tool.description || typeof tool.description !== 'string') {
        report({
          rule: 'require-tool-description',
          tool: tool.name,
          message: `Tool '${tool.name}' is missing a 'description'. LLMs will fail to infer when to invoke this tool.`,
          severity: 'error',
          suggestion: 'Add a clear description explaining what this tool does, when to use it, and what it returns.'
        });
      } else if (tool.description.trim().length < 15) {
        report({
          rule: 'require-tool-description',
          tool: tool.name,
          message: `Tool '${tool.name}' description is too short (${tool.description.length} chars).`,
          severity: 'warn',
          suggestion: 'Provide at least 15 characters explaining the purpose and return structure.'
        });
      }
    }
  },

  'no-vague-parameter-description': {
    severity: 'warn',
    description: 'Parameter descriptions must provide semantic guidance rather than generic filler words.',
    check(tool, report) {
      const properties = tool.inputSchema?.properties || tool.parameters?.properties || {};
      for (const [paramName, schema] of Object.entries(properties)) {
        const desc = (schema.description || '').trim().toLowerCase();
        if (!desc) {
          report({
            rule: 'no-vague-parameter-description',
            tool: tool.name,
            param: paramName,
            message: `Parameter '${paramName}' in tool '${tool.name}' has no description.`,
            severity: 'warn',
            suggestion: `Add a description explaining format, constraints, and valid examples for '${paramName}'.`
          });
        } else if (VAGUE_WORDS.has(desc) || desc === paramName.toLowerCase()) {
          report({
            rule: 'no-vague-parameter-description',
            tool: tool.name,
            param: paramName,
            message: `Parameter '${paramName}' description "${schema.description}" is too vague.`,
            severity: 'warn',
            suggestion: `Specify what '${paramName}' represents, format constraints, or valid example values.`
          });
        }
      }
    }
  },

  'require-parameter-type': {
    severity: 'error',
    description: 'Every parameter in properties must declare a schema type.',
    check(tool, report) {
      const properties = tool.inputSchema?.properties || tool.parameters?.properties || {};
      for (const [paramName, schema] of Object.entries(properties)) {
        if (!schema.type && !schema.$ref && !schema.anyOf && !schema.oneOf) {
          report({
            rule: 'require-parameter-type',
            tool: tool.name,
            param: paramName,
            message: `Parameter '${paramName}' in tool '${tool.name}' is missing a 'type' definition.`,
            severity: 'error',
            suggestion: "Add 'type': 'string' | 'number' | 'boolean' | 'array' | 'object'."
          });
        }
      }
    }
  },

  'require-array-items': {
    severity: 'error',
    description: 'Array parameters must declare an items schema to prevent malformed nested inputs.',
    check(tool, report) {
      const properties = tool.inputSchema?.properties || tool.parameters?.properties || {};
      for (const [paramName, schema] of Object.entries(properties)) {
        if (schema.type === 'array' && !schema.items) {
          report({
            rule: 'require-array-items',
            tool: tool.name,
            param: paramName,
            message: `Array parameter '${paramName}' in '${tool.name}' does not specify an 'items' schema.`,
            severity: 'error',
            suggestion: "Specify 'items': { 'type': '<elementType>' } to constrain array contents."
          });
        }
      }
    }
  },

  'prompt-injection-risk': {
    severity: 'error',
    description: 'Detects unsafe prompt override directives inside tool descriptions.',
    check(tool, report) {
      const textToScan = `${tool.name} ${tool.description || ''}`.toLowerCase();
      const riskyPhrases = [
        'ignore previous instructions',
        'ignore all previous',
        'bypass verification',
        'override system prompt',
        'do not ask for confirmation'
      ];

      for (const phrase of riskyPhrases) {
        if (textToScan.includes(phrase)) {
          report({
            rule: 'prompt-injection-risk',
            tool: tool.name,
            message: `Tool '${tool.name}' contains high-risk instruction override phrase: "${phrase}".`,
            severity: 'error',
            suggestion: 'Remove prompt override instructions to avoid jailbreaks and tool misuse.'
          });
        }
      }
    }
  }
};
