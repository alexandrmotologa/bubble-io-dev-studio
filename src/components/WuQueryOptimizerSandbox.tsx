import React, { useState } from 'react';
import { 
  Zap, 
  Sparkles, 
  ArrowRight, 
  Copy, 
  Check, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Sliders,
  Database,
  Cpu,
  Globe,
  Flame,
  ChevronDown
} from 'lucide-react';
import { WuSandboxPreset, WuExecutionStep } from '../types';
import { WuProfilerEngine } from '../core/profiler/wuProfilerEngine';
import { toast } from '../core/toast/toastManager';

export const WuQueryOptimizerSandbox: React.FC = () => {
  const presets = WuProfilerEngine.getSandboxPresets();
  const [selectedPreset, setSelectedPreset] = useState<WuSandboxPreset>(presets[0]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customMultiplier, setCustomMultiplier] = useState<number>(1000);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Optimized Bubble pattern copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const dynamicBeforeCost = Math.round(selectedPreset.beforeCostWu * (customMultiplier / 1000));
  const dynamicAfterCost = Math.round(selectedPreset.afterCostWu * (customMultiplier / 1000));
  const dynamicSavingsWu = dynamicBeforeCost - dynamicAfterCost;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Top Banner / Preset Selector */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(234, 179, 8, 0.1) 100%)', border: '1px solid var(--border-active)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Sparkles size={18} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Interactive Bubble AST Query Optimizer Sandbox
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Test common Bubble query patterns and witness step-by-step AST execution and WU savings.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Query Preset:</span>
            <div className="select-wrapper-premium">
              <select 
                value={selectedPreset.id}
                onChange={(e) => {
                  const found = presets.find(p => p.id === e.target.value);
                  if (found) setSelectedPreset(found);
                }}
                className="select-premium"
                style={{ minWidth: '260px' }}
              >
                {presets.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
              <ChevronDown size={13} className="select-chevron-premium" />
            </div>
          </div>
        </div>
      </div>

      {/* Preset Quick Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
        {presets.map(p => {
          const isSelected = p.id === selectedPreset.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPreset(p)}
              className="card"
              style={{
                padding: '10px 14px',
                textAlign: 'left',
                cursor: 'pointer',
                border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span className="badge badge-indigo" style={{ fontSize: '0.68rem' }}>{p.category}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>-{p.wuReductionPercent}% WU</span>
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {p.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* Side-by-Side Inefficient vs Optimized Pattern */}
      <div className="grid-2 wu-side-by-side" style={{ gap: '16px' }}>
        {/* Bad Pattern */}
        <div className="card" style={{ borderLeft: '4px solid #f43f5e', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-rose">❌ INEFFICIENT PATTERN</span>
            </div>
            <span className="badge badge-rose" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
              ~{dynamicBeforeCost.toLocaleString()} WU / 1k runs
            </span>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            {selectedPreset.description}
          </p>

          <div className="code-box-danger" style={{ minHeight: '80px' }}>
            {selectedPreset.badExpression}
          </div>
        </div>

        {/* Good Pattern */}
        <div className="card" style={{ borderLeft: '4px solid var(--accent-emerald)', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-emerald">✅ OPTIMIZED BUBBLE PATTERN</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-emerald" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                ~{dynamicAfterCost.toLocaleString()} WU / 1k runs
              </span>
              <button
                onClick={() => handleCopy(selectedPreset.goodExpression, 'good_expr')}
                className="btn btn-secondary btn-sm"
                title="Copy optimized pattern"
                style={{ padding: '4px 8px' }}
              >
                {copiedKey === 'good_expr' ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                <span style={{ fontSize: '0.72rem' }}>{copiedKey === 'good_expr' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Applies native database constraints and indexed attributes directly at engine level.
          </p>

          <div className="code-box-success" style={{ minHeight: '80px' }}>
            {selectedPreset.goodExpression}
          </div>
        </div>
      </div>

      {/* Interactive Execution Scale Slider */}
      <div className="card" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={16} color="var(--primary)" />
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Simulate Execution Volume:</strong>
              <span className="badge badge-cyan" style={{ fontSize: '0.82rem' }}>{customMultiplier.toLocaleString()} monthly operations</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Adjust slider to test how WU cost scales with traffic.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>NET MONTHLY SAVINGS:</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                +{dynamicSavingsWu.toLocaleString()} WU <span style={{ fontSize: '0.8rem' }}>(~${((dynamicSavingsWu / 1000) * 0.35).toFixed(2)} USD)</span>
              </div>
            </div>
          </div>
        </div>

        <input 
          type="range" 
          min="100" 
          max="50000" 
          step="100"
          value={customMultiplier} 
          onChange={(e) => setCustomMultiplier(Number(e.target.value))}
          style={{ width: '100%', marginTop: '12px', accentColor: 'var(--primary)' }}
        />
      </div>

      {/* Step-by-Step AST Execution Breakdown */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: '12px' }}>
          <Layers size={16} color="var(--accent-cyan)" />
          <span>Bubble Engine Execution Steps & Resource Bottlenecks</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {selectedPreset.steps.map(step => (
            <div 
              key={step.stepNumber}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: step.isBottleneck ? 'rgba(244, 63, 94, 0.08)' : 'var(--bg-input)',
                border: step.isBottleneck ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-subtle)',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: step.isBottleneck ? '#f43f5e' : 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {step.stepNumber}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{step.name}</strong>
                    <span className="badge badge-indigo" style={{ fontSize: '0.68rem' }}>
                      {step.component === 'Database Engine' && <Database size={11} style={{ marginRight: '4px' }} />}
                      {step.component === 'Browser Runtime' && <Globe size={11} style={{ marginRight: '4px' }} />}
                      {step.component === 'Workflow Engine' && <Cpu size={11} style={{ marginRight: '4px' }} />}
                      {step.component}
                    </span>
                    {step.isBottleneck && (
                      <span className="badge badge-rose" style={{ fontSize: '0.68rem' }}>
                        <Flame size={11} style={{ marginRight: '3px' }} />
                        BOTTLENECK
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {step.details}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className={`badge ${step.isBottleneck ? 'badge-rose' : 'badge-cyan'}`} style={{ fontWeight: 700 }}>
                  ~{Math.round(step.costWu * (customMultiplier / 1000)).toLocaleString()} WU
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Educational Note */}
        <div style={{ marginTop: '14px', padding: '12px 14px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.25)', fontSize: '0.8rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <Info size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>Architecture Deep Dive:</strong> {selectedPreset.explanation}
          </div>
        </div>
      </div>
    </div>
  );
};
