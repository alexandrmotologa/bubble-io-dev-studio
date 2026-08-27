import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  RefreshCw, 
  TrendingDown, 
  AlertTriangle, 
  Layers, 
  Search, 
  DollarSign, 
  Sliders, 
  ExternalLink,
  CheckCircle2,
  Server
} from 'lucide-react';
import { ProjectProfile, WuProfileReport } from '../types';
import { WuProfilerEngine } from '../core/profiler/wuProfilerEngine';
import { WuCostBreakdown } from '../components/WuCostBreakdown';

interface WuProfilerViewProps {
  activeProject?: ProjectProfile;
  onLog: (module: 'wu-profiler', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

type WuSubTab = 'overview' | 'bottlenecks' | 'advisor';

export const WuProfilerView: React.FC<WuProfilerViewProps> = ({ activeProject, onLog }) => {
  const [subTab, setSubTab] = useState<WuSubTab>('overview');
  const [report, setReport] = useState<WuProfileReport | null>(null);
  const [isProfiling, setIsProfiling] = useState(false);

  useEffect(() => {
    runProfiler();
  }, [activeProject?.id, activeProject?.blueprintFileName, activeProject?.blueprintExportJson]);

  const runProfiler = async () => {
    setIsProfiling(true);
    onLog('wu-profiler', 'Profiling Bubble AST for Workload Units (WU) and query complexity...');
    try {
      const rep = await WuProfilerEngine.analyzePerformance(activeProject?.blueprintExportJson);
      setReport(rep);
      onLog('wu-profiler', `WU profiling complete. Estimated monthly WU: ${rep.totalEstimatedMonthlyWu.toLocaleString()} with ${rep.bottlenecks.length} optimization points.`, 'success');
    } finally {
      setIsProfiling(false);
    }
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(99, 102, 241, 0.08) 100%)', border: '1px solid var(--border-active)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #eab308 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 8px 20px -4px rgba(234, 179, 8, 0.4)'
            }}>
              <Zap size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Workload Units (WU) & Query Profiler
              </h1>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Detect unindexed "Do a search for" queries, nested N+1 loops, and estimate monthly Bubble hosting costs
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={runProfiler} disabled={isProfiling} className="btn btn-primary btn-sm">
              <RefreshCw size={13} className={isProfiling ? 'spin' : ''} />
              <span>{isProfiling ? 'Profiling...' : 'Recalculate WU Profile'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subtab navigation */}
      <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <button onClick={() => setSubTab('overview')} className={`btn btn-sm ${subTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
          <Zap size={13} />
          <span>WU Cost Breakdown</span>
        </button>
        <button onClick={() => setSubTab('bottlenecks')} className={`btn btn-sm ${subTab === 'bottlenecks' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
          <AlertTriangle size={13} />
          <span>Query Bottlenecks ({report?.bottlenecks.length || 0})</span>
        </button>
      </div>

      {/* SUBTAB 1: OVERVIEW */}
      {subTab === 'overview' && report && (
        <WuCostBreakdown report={report} />
      )}

      {/* SUBTAB 2: BOTTLENECKS & ADVISOR */}
      {subTab === 'bottlenecks' && report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {report.bottlenecks.map(b => (
            <div key={b.id} className="card" style={{ borderLeft: `4px solid ${b.severity === 'critical' ? '#f43f5e' : b.severity === 'high' ? '#f59e0b' : '#38bdf8'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge ${b.severity === 'critical' ? 'badge-rose' : b.severity === 'high' ? 'badge-amber' : 'badge-cyan'}`}>
                    {b.severity.toUpperCase()}
                  </span>
                  <strong style={{ fontSize: '0.85rem' }}>{b.location}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="badge badge-indigo">
                    ~{b.estimatedMonthlyWu.toLocaleString()} WU / mo
                  </span>
                  <span className="badge badge-cyan">
                    ${b.estimatedCostUsd}/mo
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: '0 0 10px' }}>
                {b.description}
              </p>

              <div style={{ padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--accent-emerald)' }}>
                <strong>Optimization Recommendation:</strong> {b.suggestedFix}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
