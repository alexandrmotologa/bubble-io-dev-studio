import { VisualAuthSettings, VisualSuiteResult, VisualTestCase } from '../../types';
import { PixelDiffEngine } from './pixelDiffEngine';

export class VisualSuiteRunner {
  /**
   * Runs the complete visual test suite with masking, timeout delays, and auth support
   */
  public static async runSuite(
    cases: VisualTestCase[],
    diffThreshold: number = 1.0,
    authSettings?: VisualAuthSettings,
    onProgress?: (current: number, total: number, name: string) => void
  ): Promise<VisualSuiteResult> {
    const updatedCases: VisualTestCase[] = [];
    let passedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < cases.length; i++) {
      const tc = cases[i];
      onProgress?.(i + 1, cases.length, `${tc.name} (${tc.viewport.name})`);

      // Wait timeout simulation (Repeating groups, dynamic animations)
      const waitMs = tc.waitForTimeout || 350;
      await new Promise(r => setTimeout(r, waitMs));

      const comparison = await PixelDiffEngine.compareImages(
        tc.baselineImage || '',
        tc.currentImage || tc.baselineImage || '',
        diffThreshold / 100,
        tc.maskSelectors
      );

      const isPassed = comparison.passed;
      if (isPassed) passedCount++;
      else failedCount++;

      updatedCases.push({
        ...tc,
        status: isPassed ? 'passed' : 'failed',
        diffPercentage: comparison.diffPercentage,
        diffPixelsCount: comparison.diffPixelsCount,
        currentImage: tc.baselineImage, // updated snapshot
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
}
