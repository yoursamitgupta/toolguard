/**
 * Formats lint reports into clean, developer-friendly terminal output.
 */

export function formatTerminal(report, filePath = '') {
  const lines = [];

  if (filePath) {
    lines.push(`\n📄 Schema: ${filePath}`);
  }

  if (report.issues.length === 0) {
    lines.push(`\n✨ Perfect! All ${report.toolCount} tool schemas passed ToolGuard checks.`);
    return lines.join('\n');
  }

  lines.push(`Scanned ${report.toolCount} tools. Found ${report.errorCount} error(s), ${report.warningCount} warning(s):\n`);

  for (const issue of report.issues) {
    const badge = issue.severity === 'error' ? '❌ ERROR' : '⚠️  WARN ';
    const location = issue.param ? `${issue.tool} -> ${issue.param}` : issue.tool;
    
    lines.push(`  ${badge} [${issue.rule}] on '${location}':`);
    lines.push(`     ${issue.message}`);
    if (issue.suggestion) {
      lines.push(`     💡 Fix: ${issue.suggestion}`);
    }
    lines.push('');
  }

  const summary = report.isValid
    ? `⚠️  Passed with ${report.warningCount} warning(s).`
    : `❌ Failed: ${report.errorCount} error(s) must be resolved before deployment.`;

  lines.push(summary);
  return lines.join('\n');
}
