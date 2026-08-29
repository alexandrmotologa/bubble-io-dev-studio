import React, { useState } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  Zap, 
  Clock, 
  BarChart3, 
  Sliders, 
  CheckCircle2,
  Flame,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { WuProfileReport, WuSpikeScenario } from '../types';

interface WuSpikeSimulatorProps {
  report: WuProfileReport;
}

export const WuSpikeSimulator: React.FC<WuSpikeSimulatorProps> = ({ report }) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('baseline');
  const [customMultiplier, setCustomMultiplier] = useState<number>(1.0);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  const selectedScenario = report.spikeScenarios.find(s => s.id === selectedScenarioId) || report.spikeScenarios[0];

  const currentMultiplier = isCustomMode ? customMultiplier : selectedScenario.trafficMultiplier;
  const simulatedTotalWu = Math.round(report.totalEstimatedMonthlyWu * currentMultiplier);
  const baselineAllowance = 175000; // Starter tier reference
  const simulatedOverageWu = Math.max(0, simulatedTotalWu - baselineAllowance);
  const simulatedOverageCostUsd = Number(((simulatedOverageWu / 1000) * 0.35).toFixed(2));
  const isThrottled = simulatedTotalWu > 350000;

  // Max value for chart scaling
  const maxBurnWu = Math.max(...report.burnRateTimeline.map(p => p.wuConsumed * currentMultiplier), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.12) 0%, rgba(244, 63, 94, 0.1) 100%)', border: '1px solid var(--border-active)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Flame size={20} color="var(--accent-amber)" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Workload Burn Rate & Concurrency Spike Simulator
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Simulate traffic surges, viral launches, and scheduled nightly crons to predict WU consumption and prevent billing surprises.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => { setIsCustomMode(false); setSelectedScenarioId('promo_spike'); }}
              className={`btn btn-sm ${!isCustomMode && selectedScenarioId === 'promo_spike' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <span>Promo Spike (2.5x)</span>
            </button>
            <button 
              onClick={() => { setIsCustomMode(false); setSelectedScenarioId('viral_surge'); }}
              className={`btn btn-sm ${!isCustomMode && selectedScenarioId === 'viral_surge' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <span>Viral Surge (5x)</span>
            </button>
            <button 
              onClick={() => setIsCustomMode(true)}
              className={`btn btn-sm ${isCustomMode ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Sliders size={13} />
              <span>Custom Multiplier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scenario Selector & KPI Projection Cards */}
      <div className="grid-3">
        {/* Card 1: Projected WU */}
        <div className="card" style={{ background: 'var(--bg-card)', borderLeft: `4px solid ${isThrottled ? 'var(--accent-rose)' : simulatedOverageWu > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>PROJECTED MONTHLY WU</span>
            <Zap size={16} color={isThrottled ? 'var(--accent-rose)' : 'var(--primary)'} />
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {simulatedTotalWu.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>WU</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: isThrottled ? 'var(--accent-rose)' : 'var(--accent-cyan)', marginTop: '4px', fontWeight: 600 }}>
            {currentMultiplier}x baseline traffic load
          </div>
        </div>

        {/* Card 2: Estimated Overage Cost */}
        <div className="card" style={{ background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>ESTIMATED OVERAGE / TIER COST</span>
            <TrendingUp size={16} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: simulatedOverageCostUsd > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
            ${simulatedOverageCostUsd > 0 ? `+${simulatedOverageCostUsd.toLocaleString()}` : '0.00'} <span style={{ fontSize: '0.85rem' }}>USD</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {simulatedOverageWu > 0 ? `Exceeds Starter tier by ${simulatedOverageWu.toLocaleString()} WU` : 'Within standard monthly capacity'}
          </div>
        </div>

        {/* Card 3: Throttling & Capacity Risk */}
        <div className="card" style={{ background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>CAPACITY STATUS</span>
            {isThrottled ? <ShieldAlert size={16} color="var(--accent-rose)" /> : <CheckCircle2 size={16} color="var(--accent-emerald)" />}
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: isThrottled ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
            {isThrottled ? 'Throttling Risk' : simulatedOverageWu > 0 ? 'Tier Upgrade Recommended' : 'Optimal Capacity'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {isThrottled ? 'Concurrent worker queue saturation likely' : 'No backend queue bottlenecks projected'}
          </div>
        </div>
      </div>

      {/* Interactive Custom Multiplier Slider */}
      {isCustomMode && (
        <div className="card" style={{ background: 'var(--bg-input)', border: '1px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={16} color="var(--primary)" />
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Custom Traffic Surge Multiplier:</strong>
              <span className="badge badge-indigo" style={{ fontSize: '0.85rem' }}>{customMultiplier.toFixed(1)}x Traffic</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
              ~{simulatedTotalWu.toLocaleString()} Estimated WU
            </div>
          </div>
          <input 
            type="range"
            min="0.5"
            max="15.0"
            step="0.5"
            value={customMultiplier}
            onChange={(e) => setCustomMultiplier(Number(e.target.value))}
            style={{ width: '100%', marginTop: '10px', accentColor: 'var(--primary)' }}
          />
        </div>
      )}

      {/* 24-Hour Peak Burn Rate Visual Timeline */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="var(--accent-cyan)" />
            <span>24-Hour Daily Workload Burn Rate Distribution</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scaled for {currentMultiplier}x traffic</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {report.burnRateTimeline.map((item, idx) => {
            const currentWu = Math.round(item.wuConsumed * currentMultiplier);
            const percent = Math.min(100, Math.round((currentWu / maxBurnWu) * 100));
            const isPeak = percent > 65;

            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem' }}>
                <div style={{ width: '110px', color: 'var(--text-secondary)', flexShrink: 0, fontSize: '0.78rem' }}>
                  {item.timeLabel}
                </div>

                <div style={{ flex: 1, position: 'relative', height: '24px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  <div 
                    style={{ 
                      width: `${percent}%`, 
                      height: '100%', 
                      background: isPeak 
                        ? 'linear-gradient(90deg, #f59e0b, #f43f5e)' 
                        : 'linear-gradient(90deg, #6366f1, #06b6d4)',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} 
                  />
                  <div style={{ 
                    position: 'absolute', 
                    top: 0, 
                    bottom: 0, 
                    left: '10px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    fontSize: '0.72rem', 
                    color: '#ffffff', 
                    fontWeight: 700,
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)'
                  }}>
                    {currentWu.toLocaleString()} WU
                  </div>
                </div>

                <div style={{ width: '180px', textAlign: 'right', flexShrink: 0 }}>
                  <span className={`badge ${
                    item.primaryDriver === 'Scheduled Backend Cron' ? 'badge-amber' :
                    item.primaryDriver === 'API Webhooks' ? 'badge-rose' :
                    item.primaryDriver === 'Database Mutations' ? 'badge-indigo' : 'badge-cyan'
                  }`} style={{ fontSize: '0.7rem' }}>
                    {item.primaryDriver}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#06b6d4' }} />
            <span>Standard User Traffic (Searches / Page Views)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#f59e0b' }} />
            <span>Heavy Scheduled Backend Crons (Nightly Jobs)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#f43f5e' }} />
            <span>Peak Hourly Load (Risk of Throttling)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
