import { AppDiffResult, AuditHealthReport, DeadItem } from '../../types';

export class AppDiffEngine {
  /**
   * Compares two audit reports (e.g. before vs after cleanup or v1 vs v2 .bubble export)
   */
  public static compare(beforeReport: AuditHealthReport, afterReport: AuditHealthReport): AppDiffResult {
    const beforeMap = new Map(beforeReport.deadItems.map(i => [i.name, i]));
    const afterMap = new Map(afterReport.deadItems.map(i => [i.name, i]));

    const fixedIssues: DeadItem[] = [];
    const newIssues: DeadItem[] = [];
    let unchangedCount = 0;

    for (const [name, item] of beforeMap.entries()) {
      if (!afterMap.has(name)) {
        fixedIssues.push(item);
      } else {
        unchangedCount++;
      }
    }

    for (const [name, item] of afterMap.entries()) {
      if (!beforeMap.has(name)) {
        newIssues.push(item);
      }
    }

    const scoreDelta = afterReport.score - beforeReport.score;

    return {
      beforeScore: beforeReport.score,
      afterScore: afterReport.score,
      scoreDelta,
      fixedIssues,
      newIssues,
      unchangedCount
    };
  }

  /**
   * Sample comparative before/after audit for quick GUI demonstration
   */
  public static getSampleDiff(): AppDiffResult {
    const fixedIssues: DeadItem[] = [
      {
        id: 'fix_1',
        name: 'Group - Old Banner (Legacy V1)',
        type: 'element',
        pageName: 'index',
        reason: 'Purged from DOM structure',
        severity: 'medium',
        confidence: 'HIGH',
        canAutoClean: true
      },
      {
        id: 'fix_2',
        name: 'Plugin: Legacy Flash Charts V2',
        type: 'plugin',
        reason: 'Uninstalled from Bubble app plugins',
        severity: 'high',
        confidence: 'HIGH',
        canAutoClean: true
      }
    ];

    const newIssues: DeadItem[] = [
      {
        id: 'new_1',
        name: 'Button - Temporary Test Checkout',
        type: 'element',
        pageName: 'checkout',
        reason: 'Added as test element, remains hidden without workflow',
        severity: 'low',
        confidence: 'HIGH',
        canAutoClean: true
      }
    ];

    return {
      beforeScore: 78,
      afterScore: 92,
      scoreDelta: 14,
      fixedIssues,
      newIssues,
      unchangedCount: 4
    };
  }
}
