import React, { useState } from 'react';
import { 
  Zap, 
  DollarSign, 
  TrendingDown, 
  AlertTriangle, 
  Server, 
  Monitor, 
  ArrowRight,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Cpu,
  BarChart2
} from 'lucide-react';
import { WuProfileReport } from '../types';

interface WuCostBreakdownProps {
  report: WuProfileReport;
}

export const WuCostBreakdown: React.FC<WuCostBreakdownProps> = ({ report }) => {
  // Interactive Traffic Simulation Sliders
  const [mau, setMau] = useState<number>(2500);
  const [pageviewsPerUser, setPageviewsPerUser] = useState<number>(20);
  const [backendEventsPerDay, setBackendEventsPerDay] = useState<number>(850);

  // Dynamic projection based on sliders
  const dynamicPageviewWu = Math.round(mau * pageviewsPerUser * 0.45);
  const dynamicBackendWu = Math.round(backendEventsPerDay * 30 * 1.8);
  const dynamicBaselineWu = 5000;
  const dynamicTotalWu = dynamicPageviewWu + dynamicBackendWu + dynamicBaselineWu;
  const dynamicMonthlyCostUsd = Number(((dynamicTotalWu / 1000) * 0.35).toFixed(2));
  const dynamicSavingsWu = Math.round(dynamicTotalWu * (report.potentialSavingsMonthlyWu / Math.max(1, report.totalEstimatedMonthlyWu)));
  const dynamicSavingsCostUsd = Number(((dynamicSavingsWu / 1000) * 0.35).toFixed(2));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 5 KPI Metric Cards */}
      <div className="grid-4">
        {/* Metric 1: Monthly WU */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)', border: '1px solid var(--border-active)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>ESTIMATED MONTHLY WU</span>
            <Zap size={16} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {report.totalEstimatedMonthlyWu.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>WU</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '4px', fontWeight: 600 }}>
            ~${report.estimatedMonthlyCostUsd} USD / mo at standard tier
          </div>
        </div>

        {/* Metric 2: Efficiency Score */}
        <div className="card" style={{ background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>EFFICIENCY SCORE</span>
            <span className={`badge ${report.efficiencyScore >= 80 ? 'badge-emerald' : report.efficiencyScore >= 60 ? 'badge-amber' : 'badge-rose'}`}>
              {report.efficiencyScore >= 80 ? 'Optimized' : report.efficiencyScore >= 60 ? 'Tuning Needed' : 'Critical'}
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: report.efficiencyScore >= 80 ? 'var(--accent-emerald)' : report.efficiencyScore >= 60 ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>
            {report.efficiencyScore}<span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/100</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {report.bottlenecks.length} optimization points detected
          </div>
        </div>

        {/* Metric 3: Optimization Potential */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.06) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>POTENTIAL SAVINGS</span>
            <Sparkles size={16} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
            -{report.potentialSavingsMonthlyWu.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>WU</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '4px', fontWeight: 600 }}>
            Save ~${report.potentialSavingsCostUsd} USD/mo after fixes
          </div>
        </div>

        {/* Metric 4: Client vs Server */}
        <div className="card" style={{ background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>EXECUTION BALANCE</span>
            <Server size={16} color="var(--primary)" />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                <span>Client: <strong>{report.clientVsServerRatio.clientPercentage}%</strong></span>
                <span>Server: <strong>{report.clientVsServerRatio.serverPercentage}%</strong></span>
              </div>
              <div style={{ height: '8px', background: 'rgba(125, 125, 125, 0.15)', borderRadius: '99px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${report.clientVsServerRatio.clientPercentage}%`, background: 'var(--accent-cyan)' }} />
                <div style={{ width: `${report.clientVsServerRatio.serverPercentage}%`, background: 'var(--primary)' }} />
              </div>
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            {report.clientVsServerRatio.clientPercentage > 40 ? 'High client-side JS filtering overhead' : 'Balanced database query offloading'}
          </div>
        </div>
      </div>

      {/* Bubble Capacity Plan Headroom Advisor */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} color="var(--accent-amber)" />
            <span>Bubble Capacity & Tier Headroom Advisor</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Official Bubble.io Capacity Tiers</span>
        </div>

        <div className="grid-4" style={{ gap: '12px' }}>
          {report.capacityPlans.map(plan => {
            const isRec = plan.isRecommended;
            return (
              <div 
                key={plan.id}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  background: isRec ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-input)',
                  border: isRec ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                {isRec && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '12px',
                    background: 'var(--primary)',
                    color: '#fff',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '99px',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)'
                  }}>
                    RECOMMENDED
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{plan.name}</strong>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>${plan.basePriceUsd}/mo</span>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Allowance: <strong style={{ color: 'var(--text-primary)' }}>{plan.monthlyWuAllowance.toLocaleString()} WU</strong>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '4px', color: 'var(--text-muted)' }}>
                    <span>Utilization</span>
                    <span style={{ fontWeight: 700, color: plan.utilizationPercent > 90 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                      {plan.utilizationPercent}%
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(125, 125, 125, 0.15)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${Math.min(100, plan.utilizationPercent)}%`, 
                        height: '100%', 
                        background: plan.utilizationPercent > 90 ? 'var(--accent-rose)' : plan.utilizationPercent > 70 ? 'var(--accent-amber)' : 'var(--accent-emerald)' 
                      }} 
                    />
                  </div>
                </div>

                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Extra WU: +${plan.additionalCostPer100kWu} / 100k WU
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Traffic & Load Forecast Sliders */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(234, 179, 8, 0.05) 100%)', border: '1px solid var(--border-active)' }}>
        <div className="card-title" style={{ marginBottom: '12px' }}>
          <Sliders size={16} color="var(--primary)" />
          <span>Interactive Traffic & User Growth Calculator</span>
        </div>

        <div className="grid-3" style={{ gap: '16px', marginBottom: '16px' }}>
          {/* Slider 1: MAU */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
              <span>Monthly Active Users (MAU):</span>
              <strong style={{ color: 'var(--primary)' }}>{mau.toLocaleString()}</strong>
            </div>
            <input 
              type="range" 
              min="500" 
              max="50000" 
              step="500"
              value={mau}
              onChange={(e) => setMau(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
          </div>

          {/* Slider 2: Pageviews / User */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
              <span>Pageviews / User / Month:</span>
              <strong style={{ color: 'var(--accent-cyan)' }}>{pageviewsPerUser} views</strong>
            </div>
            <input 
              type="range" 
              min="5" 
              max="150" 
              step="5"
              value={pageviewsPerUser}
              onChange={(e) => setPageviewsPerUser(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
            />
          </div>

          {/* Slider 3: Backend Workflows / Day */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
              <span>Backend Events / Day:</span>
              <strong style={{ color: 'var(--accent-amber)' }}>{backendEventsPerDay.toLocaleString()}</strong>
            </div>
            <input 
              type="range" 
              min="100" 
              max="10000" 
              step="100"
              value={backendEventsPerDay}
              onChange={(e) => setBackendEventsPerDay(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-amber)' }}
            />
          </div>
        </div>

        {/* Dynamic Simulation Result Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PROJECTED MONTHLY WU CONSUMPTION:</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {dynamicTotalWu.toLocaleString()} WU <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>(~${dynamicMonthlyCostUsd}/mo)</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PROJECTED SAVINGS AFTER ARCHITECTURE FIXES:</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
              -${dynamicSavingsCostUsd} USD / month <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>(-{dynamicSavingsWu.toLocaleString()} WU)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown: Top Consuming Pages & Top Workflows */}
      <div className="grid-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: '14px' }}>
            <Layers size={16} color="var(--accent-cyan)" />
            <span>Top Consuming Pages by Workload Units</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {report.topConsumingPages.map((p, i) => (
              <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.825rem', color: 'var(--text-primary)' }}>
                  <strong>{p.pageName}</strong>
                  <span>{p.estimatedWu.toLocaleString()} WU ({p.wuPercent}%)</span>
                </div>
                <div style={{ height: '5px', background: 'rgba(125, 125, 125, 0.15)', borderRadius: '99px', overflow: 'hidden' }}>
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
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.825rem', color: 'var(--text-primary)' }}>
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
