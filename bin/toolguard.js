#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { lintTools } from '../src/scanner.js';
import { formatTerminal } from '../src/formatters/stylish.js';

const args = process.argv.slice(2);

function showHelp() {
  console.log(`
ToolGuard - Static analysis linter for AI Function Calling & MCP Schemas

Usage:
  npx toolguard <schema-file.json> [options]

Options:
  --json          Output results as JSON
  --quiet         Only report errors, suppress warnings
  -h, --help      Display usage instructions

Examples:
  npx toolguard tools.json
  npx toolguard ./mcp_server.json --json
`);
}

if (args.includes('-h') || args.includes('--help') || args.length === 0) {
  showHelp();
  process.exit(args.length === 0 ? 1 : 0);
}

const isJson = args.includes('--json');
const isQuiet = args.includes('--quiet');
const targetFile = args.find(a => !a.startsWith('-'));

if (!targetFile || !fs.existsSync(targetFile)) {
  console.error(`Error: File not found: ${targetFile}`);
  process.exit(1);
}

let parsed;
try {
  const content = fs.readFileSync(path.resolve(targetFile), 'utf-8');
  parsed = JSON.parse(content);
} catch (err) {
  console.error(`Error: Failed to parse JSON in ${targetFile}: ${err.message}`);
  process.exit(1);
}

const report = lintTools(parsed);

if (isQuiet) {
  report.issues = report.issues.filter(i => i.severity === 'error');
  report.warningCount = 0;
}

if (isJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(formatTerminal(report, targetFile));
}

process.exit(report.isValid ? 0 : 1);
