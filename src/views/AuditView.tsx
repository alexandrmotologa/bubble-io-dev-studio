import React, { useState, useEffect } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { AuditHealthReport, DeadItem } from '../types';
import { AuditEngine } from '../core/audit/auditEngine';

interface AuditViewProps {
  onLog: (module: 'audit', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const AuditView: React.FC<AuditViewProps> = ({ onLog }) => {
  const [report, setReport] = useState<AuditHealthReport | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [isScanning, setIsScanning] = useState(false);
  const [cleanedIds, setCleanedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    runAudit();
  }, []);

  const runAudit = async () => {
    setIsScanning(true);
    onLog('audit', 'Initiating deep AST scan for Bubble app structure...');
    try {
      const rep = await AuditEngine.analyzeApp();
      setReport(rep);
      onLog('audit', `Audit completed. Health Score: ${rep.score}% (Grade ${rep.grade}) with ${rep.deadItems.length} dead items detected.`, 'success');
    } finally {
      setIsScanning(false);
    }
  };

  const handleCleanItem = (item: DeadItem) => {
    setCleanedIds(prev => new Set(prev).add(item.id));
    onLog('audit', `Marked '${item.name}' for purge / clean-up.`, 'success');
  };

  const handleExportManifest = () => {
    if (!report) return;
    const json = AuditEngine.generateCleanupManifest(report);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bubble_cleanup_manifest_${Date.now()}.json`;
    a.click();
    onLog('audit', 'Exported cleanup manifest JSON.', 'success');
  };

  const filteredItems = (report?.deadItems || []).filter(item => {
    if (cleanedIds.has(item.id)) return false;
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  return (
    <div className="view-container">
      {/* Top Header Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div className="health-score-container">
            <div 
              className="gauge-circle" 
              style={{ '--score-pct': report?.score || 85 } as React.CSSProperties}
            >
              <div className="gauge-inner">
                <span className="gauge-number">{report?.score || '--'}%</span>
                <span className="gauge-grade">Grade {report?.grade || '--'}</span>
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '4px' }}>
                Bubble App Health & Optimization Score
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {report?.deadItems.length || 0} issues detected across pages, workflows, database, and styles.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleExportManifest} disabled={!report} className="btn btn-secondary btn-sm">
              <Download size={14} />
              <span>Export Manifest</span>
            </button>
            <button onClick={runAudit} disabled={isScanning} className="btn btn-primary btn-sm">
              <RefreshCw size={14} className={isScanning ? 'spin' : ''} />
              <span>{isScanning ? 'Scanning AST...' : 'Re-run Audit'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      {report && (
        <div className="grid-4">
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ORPHANED UI ELEMENTS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '4px' }}>
              {report.deadElementsCount} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {report.totalElements}</span>
            </div>
          </div>
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>DEAD WORKFLOWS & EVENTS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-rose)', marginTop: '4px' }}>
              {report.deadWorkflowsCount} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {report.totalWorkflows}</span>
            </div>
          </div>
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>UNUSED DB FIELDS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
              {report.deadFieldsCount} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {report.totalFields}</span>
            </div>
          </div>
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>UNREFERENCED STYLES</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
              {report.deadStylesCount} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {report.totalStyles}</span>
            </div>
          </div>
        </div>
      )}

      {/* Dead Code Item Table & Filter */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Trash2 size={18} color="var(--accent-rose)" />
              <span>Dead Code & Orphaned Artifacts Explorer</span>
            </div>
            <div className="card-subtitle">Select items to purge or review in your Bubble.io editor</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="select"
              style={{ width: '180px', padding: '6px 10px', fontSize: '0.8rem' }}
            >
              <option value="all">All Types</option>
              <option value="element">UI Elements</option>
              <option value="workflow">Workflows</option>
              <option value="custom_event">Custom Events</option>
              <option value="db_field">DB Fields</option>
              <option value="style">Styles</option>
            </select>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--accent-emerald)' }}>
            <CheckCircle2 size={32} style={{ margin: '0 auto 10px' }} />
            <div style={{ fontWeight: 700 }}>No dead code found in this category!</div>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                      {item.severity.toUpperCase()} PRIORITY
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
                    <span>Purge Item</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
