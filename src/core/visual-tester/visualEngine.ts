import { ProjectProfile, VisualAuthSettings, VisualSuiteResult, VisualTestCase } from '../../types';
import { VisualSuiteRunner } from './visualSuiteRunner';
import { VisualReporter } from './visualReporter';

export class VisualEngine {
  /**
   * Generates sample SVG mockups representing a real Bubble UI page for baseline and test captures
   */
  public static generateMockUiSvg(title: string, width: number, height: number, isVariant: boolean = false): string {
    const primaryColor = '#6366f1';
    const variantShift = isVariant ? 28 : 0;
    const variantColor = isVariant ? '#f43f5e' : '#10b981';
    const badgeText = isVariant ? 'Release Build (v2.7.0)' : 'Production Baseline';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad1)"/>
      
      <!-- Navbar -->
      <rect x="0" y="0" width="${width}" height="64" fill="#1e293b" opacity="0.9"/>
      <rect x="24" y="18" width="120" height="28" rx="6" fill="${primaryColor}"/>
      <text x="36" y="37" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="14" font-weight="bold">Bubble App</text>
      <rect x="${width - 160}" y="18" width="136" height="28" rx="6" fill="${variantColor}"/>
      <text x="${width - 150}" y="36" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="11" font-weight="bold">${badgeText}</text>

      <!-- Hero Header -->
      <text x="40" y="130" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="26" font-weight="800">${title}</text>
      <text x="40" y="160" fill="#94a3b8" font-family="-apple-system, sans-serif" font-size="14">Automated Visual Regression Snapshot • Viewport ${width}×${height}px</text>
      
      <!-- Action Button -->
      <rect x="40" y="${185 + variantShift}" width="150" height="38" rx="8" fill="${primaryColor}"/>
      <text x="68" y="${209 + variantShift}" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="13" font-weight="600">Get Started</text>

      <!-- Stat Cards Grid -->
      <rect x="40" y="${250 + variantShift}" width="${Math.min(240, width - 80)}" height="90" rx="10" fill="#1e293b" stroke="rgba(255,255,255,0.1)"/>
      <text x="56" y="${278 + variantShift}" fill="#94a3b8" font-family="-apple-system, sans-serif" font-size="11" font-weight="bold">ACTIVE USERS</text>
      <text x="56" y="${312 + variantShift}" fill="#38bdf8" font-family="-apple-system, sans-serif" font-size="22" font-weight="bold">${isVariant ? '14,892' : '14,240'}</text>

      <rect x="${Math.min(300, width - 80)}" y="${250 + variantShift}" width="${Math.min(240, width - 80)}" height="90" rx="10" fill="#1e293b" stroke="rgba(255,255,255,0.1)"/>
      <text x="${Math.min(316, width - 64)}" y="${278 + variantShift}" fill="#94a3b8" font-family="-apple-system, sans-serif" font-size="11" font-weight="bold">MONTHLY REVENUE</text>
      <text x="${Math.min(316, width - 64)}" y="${312 + variantShift}" fill="#34d399" font-family="-apple-system, sans-serif" font-size="22" font-weight="bold">$48,290</text>

      <!-- Repeating Group / Table Section -->
      <rect x="40" y="${370 + variantShift}" width="${width - 80}" height="220" rx="10" fill="#1e293b" stroke="rgba(255,255,255,0.1)"/>
      <rect x="40" y="${370 + variantShift}" width="${width - 80}" height="40" rx="10" fill="rgba(255,255,255,0.03)"/>
      <text x="56" y="${395 + variantShift}" fill="#94a3b8" font-family="-apple-system, sans-serif" font-size="12" font-weight="bold">TRANSACTION RECORDS</text>
      
      <line x1="40" y1="${450 + variantShift}" x2="${width - 40}" y2="${450 + variantShift}" stroke="rgba(255,255,255,0.05)" />
      <text x="56" y="${438 + variantShift}" fill="#f1f5f9" font-family="-apple-system, sans-serif" font-size="12">Order #1094 — Enterprise Plan Subscription</text>
      <text x="${width - 120}" y="${438 + variantShift}" fill="#34d399" font-family="-apple-system, sans-serif" font-size="12" font-weight="bold">$299.00</text>

      <line x1="40" y1="${495 + variantShift}" x2="${width - 40}" y2="${495 + variantShift}" stroke="rgba(255,255,255,0.05)" />
      <text x="56" y="${480 + variantShift}" fill="#f1f5f9" font-family="-apple-system, sans-serif" font-size="12">Order #1093 — Developer Pro Addon</text>
      <text x="${width - 120}" y="${480 + variantShift}" fill="#34d399" font-family="-apple-system, sans-serif" font-size="12" font-weight="bold">$49.00</text>
    </svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  /**
   * Generates dynamic visual test cases for the active Bubble project's real pages
   */
  public static getTestCasesForProject(project?: ProjectProfile | null): VisualTestCase[] {
    if (!project) {
      return this.getDefaultTestCases();
    }

    const host = project.customDomain || `${project.appId}.bubbleapps.io`;
    const env = project.environment || 'version-test';
    const authPrefix = project.httpBasicUser && project.httpBasicPassword 
      ? `${encodeURIComponent(project.httpBasicUser)}:${encodeURIComponent(project.httpBasicPassword)}@` 
      : '';
    const baseUrl = `https://${authPrefix}${host}/${env}`;
    const cases: VisualTestCase[] = [];

    // Extract pages from blueprint if present
    const pageNames: string[] = [];
    if (project.blueprintExportJson?.pages && typeof project.blueprintExportJson.pages === 'object') {
      pageNames.push(...Object.keys(project.blueprintExportJson.pages));
    }

    if (pageNames.length === 0) {
      pageNames.push('index', 'dashboard', 'pricing');
    }

    const viewports = [
      { name: 'Desktop (1920x1080)', width: 1920, height: 1080 },
      { name: 'Tablet (768x1024)', width: 768, height: 1024 },
      { name: 'Mobile (375x812)', width: 375, height: 812 }
    ];

    let counter = 1;
    for (const page of pageNames.slice(0, 6)) {
      const formattedPageName = page.charAt(0).toUpperCase() + page.slice(1).replace(/_/g, ' ');
      for (const vp of viewports) {
        cases.push({
          id: `tc_${counter++}`,
          name: `${formattedPageName} — ${vp.name.split(' ')[0]}`,
          pageUrl: `${baseUrl}/${page}`,
          viewport: vp,
          status: 'untested',
          diffPercentage: 0,
          maskSelectors: ['.timestamp', '.live-ticker']
        });
      }
    }

    return cases;
  }

  /**
   * Sample default visual test cases for Bubble app pages
   */
  public static getDefaultTestCases(): VisualTestCase[] {
    const vp = { name: 'Desktop (1920x1080)', width: 1920, height: 1080 };
    return [
      {
        id: 'tc_1',
        name: 'Landing Page Hero & CTA',
        pageUrl: '/index',
        viewport: vp,
        status: 'untested',
        diffPercentage: 0.42,
        baselineImage: this.generateMockUiSvg('Landing Page Hero', vp.width, vp.height, false),
        currentImage: this.generateMockUiSvg('Landing Page Hero', vp.width, vp.height, true),
        maskSelectors: ['.timestamp', '.avatar-live']
      }
    ];
  }

  /**
   * Runs the full visual regression suite with live progress
   */
  public static async runSuite(
    cases: VisualTestCase[],
    diffThreshold: number = 1.0,
    authSettings?: VisualAuthSettings,
    onProgress?: (current: number, total: number, tcName: string) => void
  ): Promise<VisualSuiteResult> {
    return VisualSuiteRunner.runSuite(cases, diffThreshold, authSettings, onProgress);
  }

  /**
   * Generates a standalone HTML report
   */
  public static generateHtmlReport(result: VisualSuiteResult): string {
    return VisualReporter.generateHtmlReport(result);
  }
}
