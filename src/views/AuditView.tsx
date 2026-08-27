import React, { useState, useEffect, useRef } from 'react';
import { 
  Stethoscope, 
  Trash2, 
  Filter, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  AlertOctagon, 
  Layers,
  ArrowUpRight,
  RefreshCw,
  Search,
  Upload,
  GitCompare,
  FileCode,
  ShieldAlert,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { AppDiffResult, AuditHealthReport, DeadItem } from '../types';
import { AuditEngine } from '../core/audit/auditEngine';
import { AppDiffEngine } from '../core/audit/appDiffEngine';
import { SafeCleanerEngine } from '../core/audit/safeCleaner';

interface AuditViewProps {
  activeProject?: ProjectProfile;
  currentReport?: AuditHealthReport | null;
  onReportUpdate?: (report: AuditHealthReport) => void;
  onLog: (module: 'audit', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

type AuditSubTab = 'overview' | 'explorer' | 'graph' | 'diff' | 'cleaner' | 'export';

export const AuditView: React.FC<AuditViewProps> = ({ onLog }) => {
  const [subTab, setSubTab] = useState<AuditSubTab>('overview');
  const [report, setReport] = useState<AuditHealthReport | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cleanedIds, setCleanedIds] = useState<Set<string>>(new Set());
  const [diffResult, setDiffResult] = useState<AppDiffResult | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanProgress, setCleanProgress] = useState(0);

  // Do not auto-run sample audit on mount to avoid hardcoded mock data
  useEffect(() => {
    // Ready for user action
  }, []);

  const runAudit = async (rawJson?: any) => {
    setIsScanning(true);
    onLog('audit', 'Initiating deep AST scan for Bubble app structure & dependencies...');
    try {
      const rep = await AuditEngine.analyzeApp(rawJson);
      setReport(rep);
      setDiffResult(AppDiffEngine.getSampleDiff());
      onLog('audit', `Audit completed. Health Score: ${rep.score}% (Grade ${rep.grade}) with ${rep.deadItems.length} issues detected across 7 rules.`, 'success');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        runAudit(json, file.name);
      } catch (err: any) {
        onLog('audit', `Failed to parse JSON file: ${err.message}`, 'error');
        alert('Invalid JSON file format. Please upload a valid Bubble application export.');
      }
    };
    reader.readAsText(file);
  };

  const handleCleanItem = (item: DeadItem) => {
    setCleanedIds(prev => new Set(prev).add(item.id));
    onLog('audit', `Marked '${item.name}' (${item.type}) as reviewed/cleaned in Bubble editor.`, 'info');
  };

  const handleBatchClean = async () => {
    if (!report || isCleaning) return;
    setIsCleaning(true);
    const cleanable = report.deadItems.filter(i => i.canAutoClean && !cleanedIds.has(i.id));
    onLog('audit', `Starting batch cleanup of ${cleanable.length} auto-cleanable items...`);

    try {
      const res = await SafeCleanerEngine.executeCleanup(report, cleanable, (msg, pct) => {
        setCleanProgress(pct);
        onLog('audit', msg);
      });
      setReport(res.updatedReport);
      setCleanedIds(new Set());
      onLog('audit', `Safe cleanup complete! Backup saved to ${res.rollbackPath}. Health Score improved to ${res.updatedReport.score}%.`, 'success');
    } catch (e: any) {
      onLog('audit', `Cleanup failed: ${e.message}`, 'error');
    } finally {
      setIsCleaning(false);
    }
  };

  const handleExport = (format: 'sarif' | 'html' | 'markdown' | 'csv' | 'json') => {
    if (!report) return;
    let content = '';
    let mime = 'text/plain';
    let filename = `bubble_audit_${format}_${Date.now()}`;

    if (format === 'sarif') {
      content = AuditEngine.generateSarif(report);
      mime = 'application/json';
      filename += '.sarif';
    } else if (format === 'html') {
      content = AuditEngine.generateHtmlReport(report);
      mime = 'text/html';
      filename += '.html';
    } else if (format === 'markdown') {
      content = AuditEngine.generateMarkdown(report);
      mime = 'text/markdown';
      filename += '.md';
    } else if (format === 'csv') {
      content = AuditEngine.generateCsv(report);
      mime = 'text/csv';
      filename += '.csv';
    } else {
      content = AuditEngine.generateCleanupManifest(report);
      mime = 'application/json';
      filename += '.json';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    onLog('audit', `Exported audit report as ${format.toUpperCase()}.`, 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        runAudit(json);
        onLog('audit', `Uploaded and scanned .bubble export file: ${file.name}`, 'success');
      } catch {
        onLog('audit', `Failed to parse .bubble JSON file: ${file.name}`, 'error');
      }
    };
    reader.readAsText(file);
  };

  const filteredItems = report?.deadItems.filter(item => {
    if (cleanedIds.has(item.id)) return false;
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterSeverity !== 'all' && item.severity !== filterSeverity) return false;
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase()) && !item.reason.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="view-container">
      {/* Sub Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
          <button onClick={() => setSubTab('overview')} className={`btn btn-sm ${subTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
            <Stethoscope size={13} />
            <span>Scorecard</span>
          </button>
          <button onClick={() => setSubTab('explorer')} className={`btn btn-sm ${subTab === 'explorer' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
            <Trash2 size={13} />
            <span>Dead Code Explorer ({filteredItems.length})</span>
          </button>
          <button onClick={() => setSubTab('graph')} className={`btn btn-sm ${subTab === 'graph' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
            <Layers size={13} />
            <span>DAG Dependency Graph</span>
          </button>
          <button onClick={() => setSubTab('diff')} className={`btn btn-sm ${subTab === 'diff' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
            <GitCompare size={13} />
            <span>Version Diff (v1 vs v2)</span>
          </button>
          <button onClick={() => setSubTab('cleaner')} className={`btn btn-sm ${subTab === 'cleaner' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
            <Sparkles size={13} />
            <span>Safe Cleaner</span>
          </button>
          <button onClick={() => setSubTab('export')} className={`btn btn-sm ${subTab === 'export' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
            <Download size={13} />
            <span>Export (SARIF / HTML)</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
            <Upload size={13} />
            <span>Import .bubble File</span>
            <input type="file" accept=".json,.bubble" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
          <button onClick={() => runAudit()} disabled={isScanning} className="btn btn-primary btn-sm">
            <RefreshCw size={13} className={isScanning ? 'spin' : ''} />
            <span>{isScanning ? 'Scanning AST...' : 'Re-run Scan'}</span>
          </button>
        </div>
      )}

      {/* EMPTY STATE: No scan run yet */}
      {!report && !isScanning && (
        <div className="card" style={{
          textAlign: 'center',
          padding: '60px 24px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
          border: '1px solid var(--border-active)'
        }}>
          <Stethoscope size={48} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Ready for Deep AST Code Inspection
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '540px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Upload your Bubble.io application JSON export to build a full dependency DAG graph and detect dead code across 7 static analysis rules (Orphaned Elements, Dead Workflows, Custom Events, Unused DB Fields, Redundant Styles, Inactive Plugins, and Privacy Vulnerabilities).
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <label className="btn btn-primary" style={{ cursor: 'pointer', padding: '10px 20px' }}>
              <Upload size={16} />
              <span>Upload .bubble Export JSON</span>
              <input type="file" accept=".json,.bubble" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
            <button onClick={() => runAudit()} className="btn btn-secondary" style={{ padding: '10px 20px' }}>
              <Sparkles size={16} />
              <span>Run Automated AST Scan</span>
            </button>
          </div>
        </div>
      )}

      {/* TOP METRICS / SCORE BANNER */}
      {report && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div className="health-score-container">
              <div 
                className="gauge-circle" 
                style={{ '--score-pct': report.score } as React.CSSProperties}
              >
                <div className="gauge-inner">
                  <span className="gauge-number">{report.score}%</span>
                  <span className="gauge-grade">Grade {report.grade}</span>
                </div>
              </div>

              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '4px' }}>
                  Bubble App Health & Optimization Architecture
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {report.deadItems.length} issues detected across 7 static analysis rules (Workflows, Elements, DB Fields, Styles, Plugins, Option Sets, Privacy Rules).
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleBatchClean} disabled={isCleaning} className="btn btn-primary btn-sm">
                <Sparkles size={14} />
                <span>{isCleaning ? `Purging (${cleanProgress}%)...` : 'Auto-Purge Safe Items'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 1: OVERVIEW & SCORECARD */}
      {subTab === 'overview' && report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="grid-4">
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ORPHANED ELEMENTS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '4px' }}>
                {report.deadElementsCount} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {report.totalElements}</span>
              </div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>DEAD WORKFLOWS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-rose)', marginTop: '4px' }}>
                {report.deadWorkflowsCount} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {report.totalWorkflows}</span>
              </div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>UNUSED DB FIELDS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
                {report.deadFieldsCount} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {report.totalFields}</span>
              </div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>UNUSED STYLES & PLUGINS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                {(report.deadStylesCount + (report.deadPluginsCount || 0))} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {(report.totalStyles + (report.totalPlugins || 0))}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: '14px' }}>
              <span>🚀 Performance & Optimization Recommendations</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {report.recommendations.map((rec, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>#{i + 1}</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: DEAD CODE EXPLORER */}
      {subTab === 'explorer' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Trash2 size={18} color="var(--accent-rose)" />
                <span>Dead Code & Artifacts Explorer</span>
              </div>
              <div className="card-subtitle">Filter findings by category, severity level, or text query</div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '200px' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search findings..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="input"
                  style={{ paddingLeft: '30px', fontSize: '0.8rem' }}
                />
              </div>

              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="select" style={{ width: '150px', fontSize: '0.8rem' }}>
                <option value="all">All Rules</option>
                <option value="element">UI Elements</option>
                <option value="workflow">Workflows</option>
                <option value="custom_event">Custom Events</option>
                <option value="db_field">DB Fields</option>
                <option value="style">Styles</option>
                <option value="plugin">Plugins</option>
                <option value="option_set">Option Sets</option>
                <option value="security_rule">Privacy Rules</option>
              </select>

              <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="select" style={{ width: '130px', fontSize: '0.8rem' }}>
                <option value="all">All Severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--accent-emerald)' }}>
              <CheckCircle2 size={32} style={{ margin: '0 auto 10px' }} />
              <div style={{ fontWeight: 700 }}>No dead code found in this filter selection!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {item.name}
                      </span>
                      <span className="badge badge-indigo" style={{ textTransform: 'capitalize', fontSize: '0.7rem' }}>
                        {item.type.replace('_', ' ')}
                      </span>
                      {item.pageName && (
                        <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                          Page: {item.pageName}
                        </span>
                      )}
                      <span className={`badge ${item.severity === 'high' ? 'badge-rose' : item.severity === 'medium' ? 'badge-amber' : 'badge-emerald'}`} style={{ fontSize: '0.7rem' }}>
                        {item.severity.toUpperCase()}
                      </span>
                      <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
                        {item.confidence} CONFIDENCE
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {item.reason}
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => handleCleanItem(item)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem' }}
                    >
                      <Trash2 size={13} color="var(--accent-rose)" />
                      <span>Purge</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: DAG GRAPH */}
      {subTab === 'graph' && report?.graph && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Layers size={18} color="var(--accent-cyan)" />
                <span>Application DAG Dependency Graph ({report.graph.nodes.length} Nodes • {report.graph.edges.length} Edges)</span>
              </div>
              <div className="card-subtitle">Visual mapping of references between Pages, Elements, Workflows, DB Fields, and Plugins</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {report.graph.nodes.map(n => (
              <div
                key={n.id}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: n.isDead ? 'rgba(244, 63, 94, 0.1)' : 'var(--bg-input)',
                  border: n.isDead ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>{n.category}</span>
                  {n.isDead && <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>DEAD ARTIFACT</span>}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: n.isDead ? '#f43f5e' : '#fff' }}>{n.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Incoming refs: <strong>{n.incomingEdges}</strong> • Outgoing: <strong>{n.outgoingEdges}</strong>
                </div>
              </div>
              <div className="card-subtitle">
                Review and clean orphaned items in your Bubble.io application
              </div>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['all', 'element', 'workflow', 'field', 'style'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`btn btn-sm ${filterType === type ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ textTransform: 'capitalize', fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: VERSION DIFF */}
      {subTab === 'diff' && diffResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <GitCompare size={18} color="var(--primary)" />
                  <span>Version Comparative Audit (Before vs After)</span>
                </div>
                <div className="card-subtitle">Tracks technical debt delta and resolved issues between two .bubble export snapshots</div>
              </div>
            </div>

            <div className="grid-3">
              <div className="card" style={{ padding: '14px', background: 'var(--bg-input)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PREVIOUS HEALTH SCORE</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{diffResult.beforeScore}%</div>
              </div>
              <div className="card" style={{ padding: '14px', background: 'var(--bg-input)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CURRENT HEALTH SCORE</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{diffResult.afterScore}%</div>
              </div>
              <div className="card" style={{ padding: '14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>HEALTH SCORE DELTA</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>+{diffResult.scoreDelta}% Improved</div>
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-title" style={{ marginBottom: '10px', color: 'var(--accent-emerald)' }}>
                <span>✅ Fixed & Resolved Issues ({diffResult.fixedIssues.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {diffResult.fixedIssues.map(i => (
                  <div key={i.id} style={{ padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
                    <strong>{i.name}</strong> ({i.type})
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-title" style={{ marginBottom: '10px', color: 'var(--accent-amber)' }}>
                <span>⚠️ Newly Introduced Dead Artifacts ({diffResult.newIssues.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {diffResult.newIssues.map(i => (
                  <div key={i.id} style={{ padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
                    <strong>{i.name}</strong>: {i.reason}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: SAFE CLEANER */}
      {subTab === 'cleaner' && report && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Sparkles size={18} color="var(--primary)" />
                <span>Safe Dead Code Cleaner & Rollback Manifest</span>
              </div>
              <div className="card-subtitle">Automates creation of pre-cleanup backup snapshots and selectively removes orphaned DOM and workflow nodes</div>
            </div>
            <button onClick={handleBatchClean} disabled={isCleaning} className="btn btn-primary btn-sm">
              <Sparkles size={14} />
              <span>{isCleaning ? 'Cleaning...' : 'Execute Safe Cleanup'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
            {report.deadItems.filter(i => i.canAutoClean).map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <strong>{item.name}</strong> • <span className="badge badge-indigo">{item.type}</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.reason}</div>
                </div>
                <span className="badge badge-emerald">SAFE TO PURGE</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 6: MULTI-FORMAT EXPORT */}
      {subTab === 'export' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title" style={{ marginBottom: '10px' }}>
              <Download size={18} color="var(--accent-cyan)" />
              <span>Developer & CI/CD Export Formats</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Download machine-readable static analysis reports for GitHub Code Scanning, GitLab SAST, or spreadsheet auditing.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => handleExport('sarif')} className="btn btn-secondary" style={{ justifyContent: 'space-between' }}>
                <span>🛡️ SARIF 2.1.0 (GitHub / GitLab SAST)</span>
                <Download size={14} />
              </button>
              <button onClick={() => handleExport('html')} className="btn btn-secondary" style={{ justifyContent: 'space-between' }}>
                <span>📊 Standalone HTML Visual Graph Report</span>
                <Download size={14} />
              </button>
              <button onClick={() => handleExport('markdown')} className="btn btn-secondary" style={{ justifyContent: 'space-between' }}>
                <span>📝 Markdown Report (Notion / GitHub)</span>
                <Download size={14} />
              </button>
              <button onClick={() => handleExport('csv')} className="btn btn-secondary" style={{ justifyContent: 'space-between' }}>
                <span>📈 CSV Spreadsheet (Excel / Google Sheets)</span>
                <Download size={14} />
              </button>
              <button onClick={() => handleExport('json')} className="btn btn-secondary" style={{ justifyContent: 'space-between' }}>
                <span>⚙️ Cleanup Manifest JSON</span>
                <Download size={14} />
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: '10px' }}>
              <span>Live SARIF CI/CD Preview</span>
            </div>
            <pre style={{
              background: 'var(--bg-input)',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: '#86efac',
              maxHeight: '320px',
              overflowY: 'auto'
            }}>
              {report ? AuditEngine.generateSarif(report) : ''}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
