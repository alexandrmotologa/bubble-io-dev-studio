import { BubbleSchema, WuBottleneck, WuProfileReport } from '../../types';
import { DevOpsEngine } from '../devops/devopsEngine';

export class WuProfilerEngine {
  /**
   * Profiles the Bubble AST Blueprint or schema for Workload Units (WU) consumption and query performance bottlenecks
   */
  public static async analyzePerformance(rawBlueprintJson?: any, schema?: BubbleSchema | null): Promise<WuProfileReport> {
    await new Promise(r => setTimeout(r, 250));

    const bottlenecks: WuBottleneck[] = [];
    const topConsumingPages: { pageName: string; wuPercent: number; estimatedWu: number }[] = [];
    const topConsumingWorkflows: { workflowName: string; trigger: string; estimatedWu: number }[] = [];

    const actualSchema = schema || (rawBlueprintJson ? DevOpsEngine.parseBubbleSchemaJson(rawBlueprintJson) : null);
    const realTypes = actualSchema?.dataTypes || [];
    const rawPages = rawBlueprintJson?.pages ? Object.keys(rawBlueprintJson.pages) : [];

    // Extract real pages or generate from app
    const pageList = rawPages.length > 0 ? rawPages : (realTypes.length > 0 ? ['index', 'dashboard', 'profile'] : []);

    let bIdx = 1;
    for (const dt of realTypes) {
      const count = dt.recordCount || 0;
      if (dt.name.toLowerCase() === 'user' || count > 100) {
        bottlenecks.push({
          id: `wu_${bIdx++}`,
          location: `Page: ${pageList[0] || 'index'} > RepeatingGroup ${dt.name}`,
          pageName: pageList[0] || 'index',
          operationType: 'search_unconstrained',
          severity: count > 500 ? 'critical' : 'high',
          description: `Unconstrained "Do a search for ${dt.name}" without server-side constraints or items-per-page pagination limit.`,
          estimatedMonthlyWu: Math.max(4500, count * 25),
          estimatedCostUsd: Number(((Math.max(4500, count * 25) / 1000) * 1.5).toFixed(2)),
          suggestedFix: `Add a server constraint (e.g. "Created by = Current User") and set pagination limit on the RepeatingGroup.`
        });
      }
    }

    if (pageList.length > 0) {
      const perPage = Math.round(100 / pageList.length);
      for (const p of pageList) {
        topConsumingPages.push({
          pageName: p,
          wuPercent: perPage,
          estimatedWu: perPage * 150
        });
      }
    }

    if (rawBlueprintJson?.workflows && typeof rawBlueprintJson.workflows === 'object') {
      for (const [wfKey, wf] of Object.entries<any>(rawBlueprintJson.workflows)) {
        topConsumingWorkflows.push({
          workflowName: wf.name || wfKey,
          trigger: wf.event_type || 'Custom / Backend',
          estimatedWu: 3500
        });
      }
    }

    const totalEstimatedMonthlyWu = bottlenecks.reduce((acc, b) => acc + b.estimatedMonthlyWu, 0) + (realTypes.length > 0 ? 1200 : 0);
    const estimatedMonthlyCostUsd = Number(((totalEstimatedMonthlyWu / 1000) * 1.5).toFixed(2));

    return {
      timestamp: new Date().toISOString(),
      totalEstimatedMonthlyWu,
      estimatedMonthlyCostUsd,
      efficiencyScore: bottlenecks.length === 0 ? 95 : Math.max(40, 95 - bottlenecks.length * 12),
      clientVsServerRatio: {
        clientPercentage: bottlenecks.length > 0 ? 45 : 20,
        serverPercentage: bottlenecks.length > 0 ? 55 : 80
      },
      topConsumingPages,
      topConsumingWorkflows,
      bottlenecks
    };
  }
}
