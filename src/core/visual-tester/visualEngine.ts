import { VisualAuthSettings, VisualSuiteResult, VisualTestCase } from '../../types';
import { VisualSuiteRunner } from './visualSuiteRunner';
import { VisualReporter } from './visualReporter';

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
        lastRun: new Date(Date.now() - 3600000).toISOString(),
        maskSelectors: ['.timestamp', '.avatar-live']
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
        lastRun: new Date(Date.now() - 1800000).toISOString(),
        waitForTimeout: 500
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
        lastRun: new Date(Date.now() - 7200000).toISOString(),
        waitForSelector: '.stripe-element-loaded'
      },
      {
        id: 'tc_4',
        name: 'User Dashboard & Sidebar Navigation',
        pageUrl: '/dashboard',
        viewport: { name: 'Desktop (1920x1080)', width: 1920, height: 1080 },
        status: 'untested',
        baselineImage: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80',
        currentImage: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80'
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
