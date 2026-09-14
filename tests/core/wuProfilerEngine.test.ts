import { describe, it, expect } from 'vitest';
import { WuProfilerEngine } from '../../src/core/profiler/wuProfilerEngine';

describe('WuProfilerEngine', () => {
  const sampleBlueprint = {
    name: 'E-Commerce Bubble App',
    pages: {
      index: { name: 'index' },
      dashboard: { name: 'dashboard' },
      orders: { name: 'orders' }
    },
    custom_types: {
      user: {
        fields: { email: { type: 'text' } },
        count: 500
      },
      order: {
        fields: { total: { type: 'number' }, status: { type: 'text' } },
        count: 2400
      },
      item: {
        fields: { name: { type: 'text' }, price: { type: 'number' } },
        count: 150
      }
    },
    workflows: {
      wf_sync: {
        name: 'sync_orders_backend',
        event_type: 'backend_api'
      }
    }
  };

  it('profiles application performance and detects high-impact bottlenecks', async () => {
    const report = await WuProfilerEngine.analyzePerformance(sampleBlueprint);

    expect(report).toBeDefined();
    expect(report.totalEstimatedMonthlyWu).toBeGreaterThan(0);
    expect(report.bottlenecks.length).toBeGreaterThan(0);
    expect(report.topConsumingPages.length).toBeGreaterThan(0);
    expect(report.burnRateTimeline.length).toBeGreaterThan(0);
  });

  it('detects unconstrained search bottlenecks on heavy tables', async () => {
    const report = await WuProfilerEngine.analyzePerformance(sampleBlueprint);

    const unconstrained = report.bottlenecks.find(b => b.operationType === 'search_unconstrained');
    expect(unconstrained).toBeDefined();
    expect(['critical', 'high']).toContain(unconstrained?.severity);
    expect(unconstrained?.wuReductionPercent).toBeGreaterThan(70);
  });

  it('detects recursive zero delay and bulk list overuse rules', async () => {
    const report = await WuProfilerEngine.analyzePerformance(sampleBlueprint);

    const zeroDelay = report.bottlenecks.find(b => b.operationType === 'recursive_zero_delay');
    expect(zeroDelay).toBeDefined();
    expect(zeroDelay?.severity).toBe('critical');
    expect(zeroDelay?.estimatedMonthlyWu).toBeGreaterThan(10000);

    const bulkOveruse = report.bottlenecks.find(b => b.operationType === 'bulk_on_list_overuse');
    expect(bulkOveruse).toBeDefined();
    expect(bulkOveruse?.severity).toBe('high');
  });

  it('recommends appropriate Bubble capacity plans based on estimated consumption', async () => {
    const report = await WuProfilerEngine.analyzePerformance(sampleBlueprint);

    expect(report.capacityPlans).toBeDefined();
    expect(report.capacityPlans.length).toBeGreaterThan(0);
    const recommended = report.capacityPlans.find(p => p.isRecommended);
    expect(recommended).toBeDefined();
    expect(recommended?.monthlyWuAllowance).toBeGreaterThan(0);
  });
});
