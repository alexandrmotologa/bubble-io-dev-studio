import React from 'react';
import { LatencySample, LatencyStats } from '../core/metrics/performanceProbe';

interface PerformanceSparklineProps {
  samples: LatencySample[];
  stats: LatencyStats;
  width?: number;
  height?: number;
}

export const PerformanceSparkline: React.FC<PerformanceSparklineProps> = ({
  samples,
  stats,
  height = 40
}) => {
  if (samples.length < 2) {
    return (
      <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
        Need at least 2 pings to draw trendline
      </div>
    );
  }

  const values = samples.map(s => s.latencyMs);
  const min = Math.min(...values);
  const max = Math.max(...values, min + 10);
  const range = max - min || 1;

  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1)) * 100;
    const y = 100 - ((val - min) / range) * 85 - 5; // keep within 5% - 90%
    return `${x},${y}`;
  }).join(' ');

  const strokeColor = stats.avgMs < 300 ? 'var(--accent-emerald, #10b981)' : stats.avgMs < 700 ? 'var(--accent-amber, #f59e0b)' : '#ef4444';
  const fillGradientId = `sparkline_grad_${Math.random().toString(36).substring(2, 7)}`;

  // Area under curve points
  const firstX = 0;
  const lastX = 100;
  const areaPoints = `${firstX},100 ${points} ${lastX},100`;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ width: '100%', height: `${height}px`, overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <polygon points={areaPoints} fill={`url(#${fillGradientId})`} />
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  );
};
