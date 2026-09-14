import { describe, it, expect } from 'vitest';
import { PerformanceProbe, LatencySample } from '../../src/core/metrics/performanceProbe';

describe('PerformanceProbe', () => {
  it('should compute latency stats correctly', () => {
    const samples: LatencySample[] = [
      { timestamp: 1, latencyMs: 100, statusCode: 200, endpoint: '/api', success: true },
      { timestamp: 2, latencyMs: 200, statusCode: 200, endpoint: '/api', success: true },
      { timestamp: 3, latencyMs: 300, statusCode: 500, endpoint: '/api', success: false },
      { timestamp: 4, latencyMs: 400, statusCode: 200, endpoint: '/api', success: true }
    ];

    const stats = PerformanceProbe.calculateStats(samples);

    expect(stats.samplesCount).toBe(4);
    expect(stats.avgMs).toBe(250);
    expect(stats.minMs).toBe(100);
    expect(stats.maxMs).toBe(400);
    expect(stats.successRate).toBe(75);
  });

  it('should handle empty samples without crashing', () => {
    const stats = PerformanceProbe.calculateStats([]);
    expect(stats.samplesCount).toBe(0);
    expect(stats.avgMs).toBe(0);
    expect(stats.successRate).toBe(100);
  });
});
