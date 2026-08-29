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
  Server, 
  Download, 
  FileCode, 
  Sparkles, 
  Flame, 
  BarChart3, 
  Copy, 
  Check, 
  Filter, 
  ShieldCheck, 
  Table,
  ChevronDown,
  X
} from 'lucide-react';
import { ProjectProfile, WuProfileReport, WuBottleneck } from '../types';
import { WuProfilerEngine } from '../core/profiler/wuProfilerEngine';
import { WuCostBreakdown } from '../components/WuCostBreakdown';
import { WuQueryOptimizerSandbox } from '../components/WuQueryOptimizerSandbox';
import { WuSpikeSimulator } from '../components/WuSpikeSimulator';
import { toast } from '../core/toast/toastManager';

interface WuProfilerViewProps {
  activeProject?: ProjectProfile;
  onLog: (module: 'wu-profiler', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

type WuSubTab = 'overview' | 'bottlenecks' | 'optimizer' | 'simulator' | 'inventory';

export const WuProfilerView: React.FC<WuProfilerViewProps> = ({ activeProject, onLog }) => {
  const [subTab, setSubTab] = useState<WuSubTab>('overview');
  const [report, setReport] = useState<WuProfileReport | null>(null);
  const [isProfiling, setIsProfiling] = useState(false);
  
  // Bottlenecks filter state
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  // Inventory filter state
  const [inventorySearch, setInventorySearch] = useState<string>('');
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState<string>('ALL');

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

  const handleExportMarkdown = () => {
    if (!report) return;
    const md = WuProfilerEngine.generateMarkdownReport(report, activeProject?.name || 'Bubble App');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bubble_wu_optimization_report_${activeProject?.appId || 'app'}_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Executive WU Optimization Report (.md) exported!');
    onLog('wu-profiler', 'Executive WU Optimization Report exported to disk.', 'success');
  };

  const handleExportJson = () => {
    if (!report) return;
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bubble_wu_audit_profile_${activeProject?.appId || 'app'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('WU Audit Profile (.json) exported!');
    onLog('wu-profiler', 'Raw WU Audit profile exported to disk.', 'success');
  };

  const handleCopySnippet = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippetId(id);
    toast.success('Optimized Bubble pattern copied!');
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  // Filtered Bottlenecks
  const filteredBottlenecks = (report?.bottlenecks || []).filter(b => {
    if (severityFilter !== 'ALL' && b.severity !== severityFilter.toLowerCase()) return false;
    if (categoryFilter !== 'ALL' && b.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return b.location.toLowerCase().includes(q) || b.description.toLowerCase().includes(q) || b.suggestedFix.toLowerCase().includes(q);
    }
    return true;
  });

  // Filtered Inventory
  const filteredInventory = (report?.inventoryItems || []).filter(item => {
    if (inventoryTypeFilter !== 'ALL' && item.type !== inventoryTypeFilter) return false;
    if (inventorySearch.trim()) {
      const q = inventorySearch.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.location.toLowerCase().includes(q) || item.recommendation.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="view-container">
      {/* Header Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.12) 0%, rgba(99, 102, 241, 0.1) 100%)', border: '1px solid var(--border-active)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #eab308 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 8px 20px -4px rgba(234, 179, 8, 0.4)',
              flexShrink: 0
            }}>
              <Zap size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Workload Units (WU) & Query Profiler
                </h1>
                <span className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>PRO PERFORMANCE</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                Detect unconstrained searches, N+1 query loops, forecast monthly capacity tiers, and simulate traffic spikes
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={handleExportMarkdown} disabled={!report || isProfiling} className="btn btn-secondary btn-sm" title="Export Executive Markdown Report">
              <Download size={13} />
              <span>Export Report (.md)</span>
            </button>
            <button onClick={handleExportJson} disabled={!report || isProfiling} className="btn btn-secondary btn-sm" title="Export Raw Profile JSON">
              <FileCode size={13} />
              <span>Export JSON</span>
            </button>
            <button onClick={runProfiler} disabled={isProfiling} className="btn btn-primary btn-sm">
              <RefreshCw size={13} className={isProfiling ? 'spin' : ''} />
              <span>{isProfiling ? 'Profiling...' : 'Recalculate WU Profile'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '6px', 
        background: 'var(--bg-input)', 
        padding: '4px', 
        borderRadius: 'var(--radius-md)', 
        border: '1px solid var(--border-subtle)',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        <button onClick={() => setSubTab('overview')} className={`btn btn-sm ${subTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
          <Zap size={13} />
          <span>WU Cost Breakdown & Headroom</span>
        </button>
        <button onClick={() => setSubTab('bottlenecks')} className={`btn btn-sm ${subTab === 'bottlenecks' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
          <AlertTriangle size={13} />
          <span>Query Bottlenecks ({report?.bottlenecks.length || 0})</span>
        </button>
        <button onClick={() => setSubTab('optimizer')} className={`btn btn-sm ${subTab === 'optimizer' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
          <Sparkles size={13} />
          <span>Interactive Query Sandbox</span>
        </button>
        <button onClick={() => setSubTab('simulator')} className={`btn btn-sm ${subTab === 'simulator' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
          <Flame size={13} />
          <span>Burn Rate & Spike Simulator</span>
        </button>
        <button onClick={() => setSubTab('inventory')} className={`btn btn-sm ${subTab === 'inventory' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
          <Table size={13} />
          <span>Architecture Matrix ({report?.inventoryItems.length || 0})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: OVERVIEW & CAPACITY PLANNER */}
      {/* ========================================================================= */}
      {subTab === 'overview' && report && (
        <WuCostBreakdown report={report} />
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: BOTTLENECKS & DIAGNOSTICS MATRIX */}
      {/* ========================================================================= */}
      {subTab === 'bottlenecks' && report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filter Bar */}
          <div className="card" style={{ padding: '12px 16px', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              {/* Premium Searchbar */}
              <div style={{ flex: 1, minWidth: '260px', maxWidth: '380px' }}>
                <div className="search-wrapper-premium">
                  <input
                    type="text"
                    placeholder="Filter by name, location, query pattern..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input-premium"
                  />
                  <Search size={14} className="search-icon-premium" />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="search-clear-btn"
                      title="Clear search"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Premium Dropdowns */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {/* Severity Select */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Severity:</span>
                  <div className="select-wrapper-premium">
                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      className="select-premium"
                    >
                      <option value="ALL">All Severities</option>
                      <option value="CRITICAL">🔴 Critical</option>
                      <option value="HIGH">🟠 High</option>
                      <option value="MEDIUM">🔵 Medium</option>
                    </select>
                    <ChevronDown size={13} className="select-chevron-premium" />
                  </div>
                </div>

                {/* Category Select */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Category:</span>
                  <div className="select-wrapper-premium">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="select-premium"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="Database Queries">Database Queries</option>
                      <option value="Backend Workflows">Backend Workflows</option>
                      <option value="Frontend Rendering">Frontend Rendering</option>
                    </select>
                    <ChevronDown size={13} className="select-chevron-premium" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottlenecks List */}
          {filteredBottlenecks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <CheckCircle2 size={36} color="var(--accent-emerald)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>No Matching Bottlenecks Found</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                All queries matching current filter criteria adhere to Bubble best practices.
              </p>
            </div>
          ) : (
            filteredBottlenecks.map(b => (
              <div 
                key={b.id} 
                className="card" 
                style={{ 
                  borderLeft: `4px solid ${b.severity === 'critical' ? '#f43f5e' : b.severity === 'high' ? '#f59e0b' : '#38bdf8'}`,
                  background: 'var(--bg-card)'
                }}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className={`badge ${b.severity === 'critical' ? 'badge-rose' : b.severity === 'high' ? 'badge-amber' : 'badge-cyan'}`}>
                      {b.severity.toUpperCase()}
                    </span>
                    <span className="badge badge-indigo">{b.category}</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{b.location}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-indigo" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                      ~{b.estimatedMonthlyWu.toLocaleString()} WU / mo
                    </span>
                    <span className="badge badge-cyan" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                      ${b.estimatedCostUsd}/mo
                    </span>
                    <span className="badge badge-emerald" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                      -{b.wuReductionPercent}% WU Saved
                    </span>
                  </div>
                </div>

                {/* Problem Description & Root Cause */}
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: '0 0 6px' }}>
                  {b.description}
                </p>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  <strong>Root Cause:</strong> {b.rootCause}
                </div>

                {/* Side-by-side Inefficient vs Optimized snippet */}
                {(b.beforeCodeSnippet || b.afterCodeSnippet) && (
                  <div className="grid-2 wu-side-by-side" style={{ gap: '12px', marginBottom: '12px' }}>
                    {/* Before */}
                    <div className="code-box-danger">
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>❌ CURRENT BUBBLE AST PATTERN:</span>
                      </div>
                      <pre style={{ margin: 0, fontSize: '0.78rem', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>
                        {b.beforeCodeSnippet}
                      </pre>
                    </div>

                    {/* After */}
                    <div className="code-box-success" style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>✅ OPTIMIZED REMEDIATION:</span>
                        </span>
                        {b.afterCodeSnippet && (
                          <button
                            onClick={() => handleCopySnippet(b.afterCodeSnippet!, b.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '2px 8px', fontSize: '0.68rem', height: '22px' }}
                          >
                            {copiedSnippetId === b.id ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                            <span>{copiedSnippetId === b.id ? 'Copied' : 'Copy'}</span>
                          </button>
                        )}
                      </div>
                      <pre style={{ margin: 0, fontSize: '0.78rem', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>
                        {b.afterCodeSnippet}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Suggested Fix Banner */}
                <div style={{ 
                  padding: '10px 14px', 
                  background: 'var(--bg-input)', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--border-subtle)', 
                  fontSize: '0.8rem', 
                  color: 'var(--accent-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle2 size={16} color="var(--accent-emerald)" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Actionable Recommendation:</strong> {b.suggestedFix}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: INTERACTIVE QUERY OPTIMIZER & AST SANDBOX */}
      {/* ========================================================================= */}
      {subTab === 'optimizer' && (
        <WuQueryOptimizerSandbox />
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: BURN RATE & SPIKE SIMULATOR */}
      {/* ========================================================================= */}
      {subTab === 'simulator' && report && (
        <WuSpikeSimulator report={report} />
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 5: WORKLOAD ARCHITECTURE INVENTORY */}
      {/* ========================================================================= */}
      {subTab === 'inventory' && report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Search & Filter Bar */}
          <div className="card" style={{ padding: '12px 16px', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ flex: 1, minWidth: '260px', maxWidth: '380px' }}>
                <div className="search-wrapper-premium">
                  <input
                    type="text"
                    placeholder="Filter by name, location, frequency..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="search-input-premium"
                  />
                  <Search size={14} className="search-icon-premium" />
                  {inventorySearch && (
                    <button 
                      onClick={() => setInventorySearch('')}
                      className="search-clear-btn"
                      title="Clear search"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Element Type:</span>
                <div className="select-wrapper-premium">
                  <select
                    value={inventoryTypeFilter}
                    onChange={(e) => setInventoryTypeFilter(e.target.value)}
                    className="select-premium"
                  >
                    <option value="ALL">All Types</option>
                    <option value="search">🔍 Database Search</option>
                    <option value="page">📄 Page Load</option>
                    <option value="backend_workflow">⚡ Backend Workflow</option>
                  </select>
                  <ChevronDown size={13} className="select-chevron-premium" />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>ELEMENT NAME</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>TYPE</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>LOCATION</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>FREQUENCY</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>MONTHLY WU</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>SHARE</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
                          {item.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        {item.location}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {item.executionFrequency}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.estimatedMonthlyWu.toLocaleString()} WU
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '40px', height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${item.sharePercent}%`, height: '100%', background: 'var(--accent-cyan)' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.sharePercent}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge ${item.status === 'optimized' ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.72rem' }}>
                          {item.status === 'optimized' ? 'Optimized' : 'Needs Review'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
