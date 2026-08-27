import { VisualSuiteResult } from '../../types';

export class VisualReporter {
  /**
   * Generates a standalone interactive HTML Visual Regression report
   */
  public static generateHtmlReport(result: VisualSuiteResult): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Bubble.io Visual Regression QA Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #080b11; color: #f8fafc; margin: 0; padding: 40px; }
    .header { border-bottom: 1px solid #1e293b; padding-bottom: 24px; margin-bottom: 30px; }
    .stats { display: flex; gap: 20px; margin-bottom: 30px; }
    .stat-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 18px 24px; min-width: 140px; }
    .stat-val { font-size: 28px; font-weight: 800; margin-top: 4px; }
    .case-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 24px; margin-bottom: 20px; }
    .status-passed { color: #10b981; }
    .status-failed { color: #f43f5e; }
    .slider-box { position: relative; width: 100%; max-width: 800px; height: 450px; overflow: hidden; border-radius: 8px; border: 1px solid #334155; margin-top: 14px; }
    .slider-img { width: 100%; height: 100%; object-fit: cover; }
    .badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .badge-passed { background: rgba(16, 185, 129, 0.2); color: #10b981; }
    .badge-failed { background: rgba(244, 63, 94, 0.2); color: #f43f5e; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🫧 Bubble.io Visual Regression QA Report</h1>
    <p>Executed at: <strong>${new Date(result.executedAt).toLocaleString()}</strong></p>
  </div>

  <div class="stats">
    <div class="stat-card"><div>Total Tests</div><div class="stat-val">${result.totalTests}</div></div>
    <div class="stat-card"><div>Passed</div><div class="stat-val status-passed">${result.passed}</div></div>
    <div class="stat-card"><div>Failed</div><div class="stat-val status-failed">${result.failed}</div></div>
  </div>

  <h2>Test Targets & Visual Diffs</h2>
  <div>
    ${result.cases.map(c => `
      <div class="case-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="margin: 0 0 4px 0;">${c.name}</h3>
            <span style="color: #94a3b8; font-size: 14px;">Viewport: <strong>${c.viewport.name} (${c.viewport.width}x${c.viewport.height})</strong> | Route: <code>${c.pageUrl}</code></span>
          </div>
          <span class="badge badge-${c.status}">${c.status.toUpperCase()} (Diff: ${c.diffPercentage ?? 0}%)</span>
        </div>

        ${c.baselineImage ? `
          <div class="slider-box">
            <img class="slider-img" src="${c.baselineImage}" alt="Baseline Preview" />
          </div>
        ` : ''}
      </div>
    `).join('')}
  </div>
</body>
</html>`;
  }
}
