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
  // Mode switch: Simulated Projection vs Baseline App Code
  const [advisorMode, setAdvisorMode] = useState<'simulated' | 'baseline'>('simulated');

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

  // Active workload depending on mode
  const activeWu = advisorMode === 'simulated' ? dynamicTotalWu : report.totalEstimatedMonthlyWu;

  // Preset helper
  const applyPreset = (presetMau: number, presetViews: number, presetEvents: number) => {
    setMau(presetMau);
    setPageviewsPerUser(presetViews);
    setBackendEventsPerDay(presetEvents);
    setAdvisorMode('simulated');
  };

  // Dynamically evaluated Capacity Tiers for the active workload
  const dynamicCapacityPlans = [
    {
      id: 'starter',
      name: 'Starter Plan',
      monthlyWuAllowance: 175000,
      basePriceUsd: 29,
      additionalCostPer100kWu: 30
    },
    {
      id: 'growth',
      name: 'Growth Plan',
      monthlyWuAllowance: 250000,
      basePriceUsd: 119,
      additionalCostPer100kWu: 25
    },
    {
      id: 'team',
      name: 'Team Plan',
      monthlyWuAllowance: 500000,
      basePriceUsd: 349,
      additionalCostPer100kWu: 20
    },
    {
      id: 'enterprise',
      name: 'Enterprise / Custom Pack',
      monthlyWuAllowance: 2000000,
      basePriceUsd: 999,
      additionalCostPer100kWu: 15
    }
  ].map(plan => {
    const rawUtil = (activeWu / plan.monthlyWuAllowance) * 100;
    const utilizationPercent = Math.round(rawUtil);
    const isExceeded = activeWu > plan.monthlyWuAllowance;
    const overageWu = Math.max(0, activeWu - plan.monthlyWuAllowance);
    const overageCostUsd = Math.round((overageWu / 100000) * plan.additionalCostPer100kWu);
    const totalEstMonthlyBill = plan.basePriceUsd + overageCostUsd;

    // Intelligent recommendation logic based on workload threshold and cost-effectiveness
    let isRecommended = false;
    if (activeWu <= 175000 && plan.id === 'starter') isRecommended = true;
    else if (activeWu > 175000 && activeWu <= 350000 && plan.id === 'growth') isRecommended = true;
    else if (activeWu > 350000 && activeWu <= 1000000 && plan.id === 'team') isRecommended = true;
    else if (activeWu > 1000000 && plan.id === 'enterprise') isRecommended = true;

    return {
      ...plan,
      utilizationPercent,
      isExceeded,
      overageWu,
      overageCostUsd,
      totalEstMonthlyBill,
      isRecommended,
      status: utilizationPercent > 100 ? 'exceeded' : utilizationPercent > 80 ? 'tight' : utilizationPercent < 30 ? 'underutilized' : 'optimal'
    };
  });

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

      {/* Interactive Traffic & Load Forecast Sliders */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(234, 179, 8, 0.05) 100%)', border: '1px solid var(--border-active)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div className="card-title" style={{ margin: 0 }}>
            <Sliders size={16} color="var(--primary)" />
            <span>Interactive Traffic & User Growth Calculator</span>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Presets:</span>
            <button 
              type="button"
              onClick={() => applyPreset(2500, 20, 850)} 
              className="btn btn-xs btn-secondary"
              style={{ fontSize: '0.68rem', padding: '2px 8px' }}
            >
              MVP (2.5k MAU)
            </button>
            <button 
              type="button"
              onClick={() => applyPreset(15000, 45, 3000)} 
              className="btn btn-xs btn-secondary"
              style={{ fontSize: '0.68rem', padding: '2px 8px' }}
            >
              Growth (15k MAU)
            </button>
            <button 
              type="button"
              onClick={() => applyPreset(50000, 150, 10000)} 
              className="btn btn-xs btn-secondary"
              style={{ fontSize: '0.68rem', padding: '2px 8px' }}
            >
              Scale-Up (50k MAU)
            </button>
            <button 
              type="button"
              onClick={() => setAdvisorMode('baseline')} 
              className="btn btn-xs btn-secondary"
              style={{ fontSize: '0.68rem', padding: '2px 8px', color: 'var(--accent-amber)' }}
            >
              Reset to Baseline
            </button>
          </div>
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
              onChange={(e) => {
                setMau(Number(e.target.value));
                setAdvisorMode('simulated');
              }}
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
              onChange={(e) => {
                setPageviewsPerUser(Number(e.target.value));
                setAdvisorMode('simulated');
              }}
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
              onChange={(e) => {
                setBackendEventsPerDay(Number(e.target.value));
                setAdvisorMode('simulated');
              }}
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

      {/* Bubble Capacity Plan Headroom Advisor (Reactive to Sliders) */}
      <div className="card" style={{ border: '1px solid var(--border-active)' }}>
        <div className="card-title" style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} color="var(--accent-amber)" />
            <span>Bubble Capacity & Tier Headroom Advisor</span>
            <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
              Live Evaluation
            </span>
          </div>

          {/* Mode Switch: Simulated Traffic vs Baseline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-input)', padding: '3px 4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <button 
              type="button"
              onClick={() => setAdvisorMode('simulated')}
              className={`btn btn-xs ${advisorMode === 'simulated' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.72rem', padding: '3px 10px', border: 'none' }}
              title="Calculate headroom based on the interactive sliders above"
            >
              <Sliders size={12} />
              Simulated Traffic ({dynamicTotalWu.toLocaleString()} WU)
            </button>
            <button 
              type="button"
              onClick={() => setAdvisorMode('baseline')}
              className={`btn btn-xs ${advisorMode === 'baseline' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.72rem', padding: '3px 10px', border: 'none' }}
              title="Calculate headroom based strictly on current app blueprint analysis"
            >
              <Cpu size={12} />
              Current Baseline ({report.totalEstimatedMonthlyWu.toLocaleString()} WU)
            </button>
          </div>
        </div>

        <div className="grid-4" style={{ gap: '12px' }}>
          {dynamicCapacityPlans.map(plan => {
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
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
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
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
                    letterSpacing: '0.5px'
                  }}>
                    RECOMMENDED
                  </div>
                )}

                <div>
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
                      <span style={{ 
                        fontWeight: 700, 
                        color: plan.isExceeded ? 'var(--accent-rose)' : plan.utilizationPercent > 80 ? 'var(--accent-amber)' : 'var(--accent-emerald)' 
                      }}>
                        {plan.utilizationPercent}% {plan.isExceeded ? '(Exceeded)' : ''}
                      </span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(125, 125, 125, 0.15)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${Math.min(100, plan.utilizationPercent)}%`, 
                          height: '100%', 
                          background: plan.isExceeded ? 'var(--accent-rose)' : plan.utilizationPercent > 80 ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                          transition: 'width 0.3s ease, background-color 0.3s ease'
                        }} 
                      />
                    </div>
                  </div>

                  {/* Headroom / Overage Details */}
                  {plan.isExceeded ? (
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-rose)', fontWeight: 600, marginBottom: '6px' }}>
                      Over by +{plan.overageWu.toLocaleString()} WU (+${plan.overageCostUsd}/mo)
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', fontWeight: 600, marginBottom: '6px' }}>
                      +{(plan.monthlyWuAllowance - activeWu).toLocaleString()} WU headroom free
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginTop: '8px', 
                    paddingTop: '8px', 
                    borderTop: '1px dashed var(--border-subtle)',
                    fontSize: '0.75rem' 
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>Est. Total Bill:</span>
                    <strong style={{ color: isRec ? 'var(--primary)' : 'var(--text-primary)' }}>
                      ~${plan.totalEstMonthlyBill}/mo
                    </strong>
                  </div>

                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Extra WU: +${plan.additionalCostPer100kWu} / 100k WU
                  </div>
                </div>
              </div>
            );
          })}
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
