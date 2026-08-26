import { VisualSuiteResult, VisualTestCase } from '../../types';

export class VisualEngine {
  /**
   * Sample default visual test cases for Bubble app pages
   */
  public static getDefaultTestCases(): VisualTestCase[] {
    return [
      {
        id: 'tc_1',
        name: 'Landing Page Hero & CTA',
        pageUrl: '/index',
        viewport: { name: 'Desktop (1920x1080)', width: 1920, height: 1080 },
        status: 'passed',
        diffPercentage: 0.02,
        baselineImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
        currentImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
        lastRun: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'tc_2',
        name: 'Pricing Tier Table - Tablet',
        pageUrl: '/pricing',
        viewport: { name: 'Tablet (768x1024)', width: 768, height: 1024 },
        status: 'failed',
        diffPercentage: 4.85,
        baselineImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
        currentImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
        lastRun: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 'tc_3',
        name: 'Checkout Modal & Payment Form',
        pageUrl: '/checkout',
        viewport: { name: 'Mobile (375x812)', width: 375, height: 812 },
        status: 'passed',
        diffPercentage: 0.15,
        baselineImage: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&auto=format&fit=crop&q=80',
        currentImage: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&auto=format&fit=crop&q=80',
        lastRun: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 'tc_4',
        name: 'User Dashboard & Sidebar Navigation',
        pageUrl: '/dashboard',
        viewport: { name: 'Desktop (1920x1080)', width: 1920, height: 1080 },
        status: 'untested',
        baselineImage: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80'
      }
    ];
  }

  /**
   * Runs the full visual regression suite with live progress
   */
  public static async runSuite(
    cases: VisualTestCase[],
    diffThreshold: number = 1.0,
    onProgress?: (current: number, total: number, tcName: string) => void
  ): Promise<VisualSuiteResult> {
    const updatedCases: VisualTestCase[] = [];
    let passedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < cases.length; i++) {
      const tc = cases[i];
      onProgress?.(i + 1, cases.length, tc.name);
      await new Promise(r => setTimeout(r, 600));

      // Simulate diff calculation
      const diffPct = Math.round((Math.random() * 3.5) * 100) / 100;
      const isPassed = diffPct <= diffThreshold;

      if (isPassed) passedCount++;
      else failedCount++;

      updatedCases.push({
        ...tc,
        status: isPassed ? 'passed' : 'failed',
        diffPercentage: diffPct,
        currentImage: tc.baselineImage,
        lastRun: new Date().toISOString()
      });
    }

    return {
      suiteId: `suite_${Date.now()}`,
      totalTests: cases.length,
      passed: passedCount,
      failed: failedCount,
      executedAt: new Date().toISOString(),
      cases: updatedCases
    };
  }

  /**
   * Generates a standalone HTML report
   */
  public static generateHtmlReport(result: VisualSuiteResult): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Bubble.io Dev Studio - Visual QA Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f17; color: #f8fafc; padding: 32px; }
    .header { border-bottom: 1px solid #1f2937; padding-bottom: 20px; margin-bottom: 24px; }
    .stats { display: flex; gap: 20px; margin-bottom: 30px; }
    .stat-card { background: #111827; border: 1px solid #1f2937; border-radius: 8px; padding: 16px 24px; }
    .stat-val { font-size: 24px; font-weight: 700; }
    .case-card { background: #111827; border: 1px solid #1f2937; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
    .status-passed { color: #10b981; }
    .status-failed { color: #f43f5e; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Visual Regression Test Report</h1>
    <p>Executed at: ${new Date(result.executedAt).toLocaleString()}</p>
  </div>
  <div class="stats">
    <div class="stat-card"><div>Total Tests</div><div class="stat-val">${result.totalTests}</div></div>
    <div class="stat-card"><div>Passed</div><div class="stat-val status-passed">${result.passed}</div></div>
    <div class="stat-card"><div>Failed</div><div class="stat-val status-failed">${result.failed}</div></div>
  </div>
  <div>
    ${result.cases
      .map(
        c => `
      <div class="case-card">
        <h3>${c.name} (${c.viewport.name})</h3>
        <p>URL: <code>${c.pageUrl}</code> | Status: <strong class="status-${c.status}">${c.status.toUpperCase()}</strong> | Diff: ${c.diffPercentage ?? 0}%</p>
      </div>`
      )
      .join('')}
  </div>
</body>
</html>`;
  }
}
