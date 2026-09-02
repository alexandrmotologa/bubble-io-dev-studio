import { AuditHealthReport } from '../../types';
import { BubbleParser } from './bubbleParser';
import { DagAnalyzer } from './dagAnalyzer';
import { RuleEngine } from './ruleEngine';
import { HealthScorer } from './healthScorer';
import { AuditReportersEngine } from './auditReporters';

export class AuditEngine {
  /**
   * Analyzes raw Bubble App export JSON or runs deep AST inspection
   */
  public static async analyzeApp(rawJson?: any): Promise<AuditHealthReport> {
    // 1. Parse AST
    const parsedApp = BubbleParser.parse(rawJson);

    // 2. Build DAG
    const graph = DagAnalyzer.buildGraph(parsedApp);

    // 3. Evaluate 7 rules
    const deadItems = RuleEngine.evaluateAll(parsedApp);

    // 4. Calculate health score and recommendations
    const report = HealthScorer.calculate(parsedApp, deadItems);
    report.graph = graph;

    return report;
  }

  /**
   * Generates a clean JSON report or cleanup manifest
   */
  public static generateCleanupManifest(report: AuditHealthReport): string {
    return JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        appName: report.appName || 'Bubble App',
        healthScore: report.score,
        grade: report.grade,
        cleanableItems: report.deadItems.filter(i => i.canAutoClean),
        manualReviewItems: report.deadItems.filter(i => !i.canAutoClean),
        actions: [
          'Backup Bubble application before deleting items',
          'Review database fields manually in Bubble Data tab',
          'Safely delete orphaned UI elements and dead workflows'
        ]
      },
      null,
      2
    );
  }

  public static generateSarif(report: AuditHealthReport): string {
    return AuditReportersEngine.generateSarif(report);
  }

  public static generateMarkdown(report: AuditHealthReport): string {
    return AuditReportersEngine.generateMarkdown(report);
  }

  public static generateCsv(report: AuditHealthReport): string {
    return AuditReportersEngine.generateCsv(report);
  }

  public static generateHtmlReport(report: AuditHealthReport): string {
    return AuditReportersEngine.generateHtmlReport(report);
  }
}
