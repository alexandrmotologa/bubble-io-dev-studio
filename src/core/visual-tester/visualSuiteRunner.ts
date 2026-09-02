import { VisualAuthSettings, VisualSuiteResult, VisualTestCase } from '../../types';
import { PixelDiffEngine } from './pixelDiffEngine';

export class VisualSuiteRunner {
  /**
   * Runs the complete visual test suite with live page captures, pixelmatch diffing, and auth support (Issue #3)
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

      let capturedImage: string | undefined = tc.currentImage;

      // 1. Attempt live Electron Headless Page Capture if available and valid URL (Issue #3)
      if (typeof window !== 'undefined' && window.electronAPI?.capturePage && tc.pageUrl && tc.pageUrl.startsWith('http')) {
        try {
          const headers: Record<string, string> = {};
          if (authSettings?.httpBasicUser && authSettings?.httpBasicPassword) {
            headers['Authorization'] = `Basic ${btoa(`${authSettings.httpBasicUser}:${authSettings.httpBasicPassword}`)}`;
          }

          const captureResult = await window.electronAPI.capturePage(
            tc.pageUrl,
            tc.viewport.width,
            tc.viewport.height,
            headers
          );

          if (captureResult?.success && captureResult.dataUrl) {
            capturedImage = captureResult.dataUrl;
          }
        } catch (err) {
          console.warn(`[VisualSuiteRunner] Live capture failed for ${tc.pageUrl}:`, err);
        }
      }

      // If no baseline was set yet, treat the first capture as the baseline snapshot
      const baseline = tc.baselineImage || capturedImage || '';
      const current = capturedImage || baseline;

      // 2. Real Pixelmatch comparison
      const comparison = await PixelDiffEngine.compareImages(
        baseline,
        current,
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
        baselineImage: baseline,
        currentImage: current,
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
