import { ProjectProfile, VisualAuthSettings, VisualSuiteResult, VisualTestCase } from '../../types';
import { VisualSuiteRunner } from './visualSuiteRunner';
import { VisualReporter } from './visualReporter';

export class VisualEngine {
  /**
   * Generates dynamic visual test cases for the active Bubble project's real pages
   */
  public static getTestCasesForProject(project?: ProjectProfile | null): VisualTestCase[] {
    if (!project) {
      return this.getDefaultTestCases();
    }

    const baseUrl = `https://${project.customDomain || `${project.appId}.bubbleapps.io`}/${project.environment || 'version-test'}`;
    const cases: VisualTestCase[] = [];

    // Extract pages from blueprint if present
    const pageNames: string[] = [];
    if (project.blueprintExportJson?.pages && typeof project.blueprintExportJson.pages === 'object') {
      pageNames.push(...Object.keys(project.blueprintExportJson.pages));
    }

    if (pageNames.length === 0) {
      pageNames.push('index');
    }

    const viewports = [
      { name: 'Desktop (1920x1080)', width: 1920, height: 1080 },
      { name: 'Tablet (768x1024)', width: 768, height: 1024 },
      { name: 'Mobile (375x812)', width: 375, height: 812 }
    ];

    let counter = 1;
    for (const page of pageNames.slice(0, 8)) {
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
    return [
      {
        id: 'tc_1',
        name: 'Landing Page Hero & CTA',
        pageUrl: '/index',
        viewport: { name: 'Desktop (1920x1080)', width: 1920, height: 1080 },
        status: 'untested',
        diffPercentage: 0,
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
