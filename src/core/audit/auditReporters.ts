import { AuditHealthReport } from '../../types';

export class AuditReportersEngine {
  /**
   * Generates a SARIF (Static Analysis Results Interchange Format) JSON string for CI/CD
   */
  public static generateSarif(report: AuditHealthReport): string {
    const sarif = {
      $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'bubble-io-dead-code-detector',
              version: '1.0.0',
              informationUri: 'https://github.com/alexandrmotologa/bubble-io-dead-code-detector',
              rules: [
                { id: 'dead-workflow', shortDescription: { text: 'Workflow never triggered by any UI element' } },
                { id: 'dead-field', shortDescription: { text: 'Database field with no references' } },
                { id: 'dead-plugin', shortDescription: { text: 'Installed plugin with zero usage' } },
                { id: 'dead-style', shortDescription: { text: 'Defined style not applied to elements' } },
                { id: 'security-rule', shortDescription: { text: 'Missing Bubble database privacy rules' } }
              ]
            }
          },
          results: report.deadItems.map(item => ({
            ruleId: item.type === 'custom_event' ? 'dead-workflow' : item.type === 'db_field' ? 'dead-field' : item.type,
            level: item.severity === 'high' ? 'error' : item.severity === 'medium' ? 'warning' : 'note',
            message: {
              text: `[${item.name}] ${item.reason}`
            },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: {
                    uri: item.pageName ? `pages/${item.pageName}.bubble` : 'app.bubble'
                  }
                }
              }
            ]
          }))
        }
      ]
    };

    return JSON.stringify(sarif, null, 2);
  }

  /**
   * Generates Markdown report for Notion / GitHub README / Confluence
   */
  public static generateMarkdown(report: AuditHealthReport): string {
    let md = `# 🫧 Bubble.io Dead Code & App Health Audit Report\n\n`;
    md += `**Application:** \`${report.appName || 'Bubble App'}\`  \n`;
    md += `**Analyzed At:** ${new Date(report.analyzedAt).toLocaleString()}  \n`;
    md += `**Health Score:** **${report.score}/100** (Grade **${report.grade}**)  \n\n`;

    md += `## 📊 Executive Summary\n\n`;
    md += `| Category | Detected Issues | Total In App |\n`;
    md += `|---|---|---|\n`;
    md += `| **Orphaned UI Elements** | ${report.deadElementsCount} | ${report.totalElements} |\n`;
    md += `| **Dead Workflows & Events** | ${report.deadWorkflowsCount} | ${report.totalWorkflows} |\n`;
    md += `| **Unused DB Fields** | ${report.deadFieldsCount} | ${report.totalFields} |\n`;
    md += `| **Unused Styles** | ${report.deadStylesCount} | ${report.totalStyles} |\n`;
    md += `| **Inactive Plugins** | ${report.deadPluginsCount || 0} | ${report.totalPlugins || 0} |\n\n`;

    md += `## 💡 Key Recommendations\n\n`;
    report.recommendations.forEach((rec, idx) => {
      md += `${idx + 1}. ${rec}\n`;
    });

    md += `\n## 🔍 Detected Dead Code Findings (${report.deadItems.length})\n\n`;
    md += `| Name | Type | Page | Severity | Reason |\n`;
    md += `|---|---|---|---|---|\n`;
    for (const item of report.deadItems) {
      md += `| \`${item.name}\` | \`${item.type}\` | ${item.pageName || 'Global'} | **${item.severity.toUpperCase()}** | ${item.reason} |\n`;
    }

    return md;
  }

  /**
   * Generates CSV string for Excel / Google Sheets
   */
  public static generateCsv(report: AuditHealthReport): string {
    const headers = ['ID', 'Name', 'Type', 'Page', 'Severity', 'AutoCleanable', 'Reason'];
    const rows = report.deadItems.map(i => [
      i.id,
      `"${i.name.replace(/"/g, '""')}"`,
      i.type,
      i.pageName || 'Global',
      i.severity,
      i.canAutoClean ? 'Yes' : 'No',
      `"${i.reason.replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /**
   * Generates standalone interactive HTML visual report
   */
  public static generateHtmlReport(report: AuditHealthReport): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Bubble.io Dead Code & Architecture Audit</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #080b11; color: #f8fafc; margin: 0; padding: 40px; }
    .header { border-bottom: 1px solid #1e293b; padding-bottom: 24px; margin-bottom: 30px; }
    .score-badge { display: inline-flex; align-items: center; gap: 12px; background: #1e1b4b; border: 1px solid #6366f1; padding: 10px 20px; border-radius: 12px; }
    .score-val { font-size: 32px; font-weight: 800; color: #818cf8; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 30px; }
    .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 20px; }
    .item-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .badge { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-high { background: rgba(244, 63, 94, 0.2); color: #f43f5e; }
    .badge-medium { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
    .badge-low { background: rgba(16, 185, 129, 0.2); color: #10b981; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🫧 Bubble.io App Health & Dead Code Audit</h1>
    <p>Application: <strong>${report.appName || 'Bubble App'}</strong> | Analyzed: ${new Date(report.analyzedAt).toLocaleString()}</p>
    <div class="score-badge">
      <div class="score-val">${report.score}%</div>
      <div><strong>Health Grade ${report.grade}</strong><br><small>${report.deadItems.length} issues detected</small></div>
    </div>
  </div>

  <div class="grid">
    <div class="card"><div>Orphaned UI Elements</div><h2>${report.deadElementsCount}</h2></div>
    <div class="card"><div>Dead Workflows & Events</div><h2>${report.deadWorkflowsCount}</h2></div>
    <div class="card"><div>Unused DB Fields</div><h2>${report.deadFieldsCount}</h2></div>
    <div class="card"><div>Unused Styles</div><h2>${report.deadStylesCount}</h2></div>
  </div>

  <h2>Findings (${report.deadItems.length})</h2>
  <div>
    ${report.deadItems.map(item => `
      <div class="item-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
          <strong>${item.name}</strong>
          <span class="badge badge-${item.severity}">${item.severity}</span>
        </div>
        <div style="color:#94a3b8; font-size:14px;">${item.reason}</div>
      </div>
    `).join('')}
  </div>
</body>
</html>`;
  }
}
