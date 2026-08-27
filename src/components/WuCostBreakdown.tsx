import React from 'react';
import { 
  Zap, 
  DollarSign, 
  TrendingDown, 
  AlertTriangle, 
  Server, 
  Monitor, 
  ArrowRight,
  Layers
} from 'lucide-react';
import { WuProfileReport } from '../types';

interface WuCostBreakdownProps {
  report: WuProfileReport;
}

export const WuCostBreakdown: React.FC<WuCostBreakdownProps> = ({ report }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Metrics Cards */}
      <div className="grid-3">
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)', border: '1px solid var(--border-active)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>ESTIMATED MONTHLY WU</span>
            <Zap size={16} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {report.totalEstimatedMonthlyWu.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>WU</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '4px' }}>
            ~{report.estimatedMonthlyCostUsd} USD / month at standard tier
          </div>
        </div>

        <div className="card" style={{ background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>QUERY EFFICIENCY SCORE</span>
            <span className={`badge ${report.efficiencyScore >= 80 ? 'badge-emerald' : 'badge-amber'}`}>
              {report.efficiencyScore >= 80 ? 'Optimized' : 'Needs Tuning'}
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: report.efficiencyScore >= 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
            {report.efficiencyScore}<span style={{ fontSize: '1rem' }}>/100</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {report.bottlenecks.length} critical query bottlenecks identified
          </div>
        </div>

        <div className="card" style={{ background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>EXECUTION BALANCE</span>
            <Server size={16} color="var(--accent-indigo)" />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span>Browser: {report.clientVsServerRatio.clientPercentage}%</span>
                <span>Server: {report.clientVsServerRatio.serverPercentage}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${report.clientVsServerRatio.clientPercentage}%`, background: 'var(--accent-cyan)' }} />
                <div style={{ width: `${report.clientVsServerRatio.serverPercentage}%`, background: 'var(--primary)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown: Pages & Workflows */}
      <div className="grid-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: '14px' }}>
            <Layers size={16} color="var(--accent-cyan)" />
            <span>Top Consuming Pages by Workload Units</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {report.topConsumingPages.map((p, i) => (
              <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.825rem' }}>
                  <strong>{p.pageName}</strong>
                  <span>{p.estimatedWu.toLocaleString()} WU ({p.wuPercent}%)</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ width: `${p.wuPercent}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #06b6d4)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: '14px' }}>
            <Zap size={16} color="var(--primary)" />
            <span>Top Consuming Backend Workflows</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {report.topConsumingWorkflows.map((wf, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.825rem' }}>
                <div>
                  <strong>{wf.workflowName}</strong>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{wf.trigger}</div>
                </div>
                <span className="badge badge-indigo">
                  {wf.estimatedWu.toLocaleString()} WU
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
