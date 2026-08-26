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
  Upload,
  HelpCircle,
  FileCode,
  AlertCircle
} from 'lucide-react';
import { AuditHealthReport, DeadItem, ProjectProfile } from '../types';
import { AuditEngine } from '../core/audit/auditEngine';
import { GuideBanner } from '../components/GuideBanner';
import { FixGuideModal } from '../components/FixGuideModal';

interface AuditViewProps {
  activeProject?: ProjectProfile;
  currentReport?: AuditHealthReport | null;
  onReportUpdate?: (report: AuditHealthReport) => void;
  onLog: (module: 'audit', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const AuditView: React.FC<AuditViewProps> = ({ activeProject, currentReport, onReportUpdate, onLog }) => {
  const [report, setReport] = useState<AuditHealthReport | null>(currentReport || null);
  const [filterType, setFilterType] = useState<string>('all');
  const [isScanning, setIsScanning] = useState(false);
  const [cleanedIds, setCleanedIds] = useState<Set<string>>(new Set());
  const [selectedItemForFix, setSelectedItemForFix] = useState<DeadItem | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDemo = Boolean(activeProject?.isDemo || activeProject?.appId === 'demo-sandbox' || activeProject?.appId === 'marketplace-prod');

  useEffect(() => {
    if (currentReport) {
      setReport(currentReport);
    } else if (isDemo) {
      // Only auto-run for the sandbox demo app
      runAudit();
    } else {
      setReport(null);
    }
  }, [activeProject?.id, currentReport]);

  const runAudit = async (customJson?: any, fileName?: string) => {
    setIsScanning(true);
    onLog('audit', customJson ? `Parsing uploaded Bubble file: ${fileName}...` : `Initiating deep AST scan for ${activeProject?.name || 'Bubble app'}...`);
    try {
      const rep = await AuditEngine.analyzeApp(customJson);
      setReport(rep);
      onReportUpdate?.(rep);
      if (fileName) setUploadedFileName(fileName);
      onLog('audit', `Audit completed. Health Score: ${rep.score}% (Grade ${rep.grade}) with ${rep.deadItems.length} dead items detected.`, 'success');
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

  const handleExportManifest = () => {
    if (!report) return;
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bubble_dead_code_manifest_${activeProject?.appId || 'app'}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onLog('audit', 'Exported Dead Code Clean-up Manifest (JSON).', 'success');
  };

  const filteredItems = report?.deadItems.filter(item => {
    if (cleanedIds.has(item.id)) return false;
    if (filterType === 'all') return true;
    return item.type === filterType;
  }) || [];

  const guideSteps = [
    {
      title: 'Export Bubble Application JSON',
      desc: 'In your Bubble.io editor, go to Settings > General > Export Application and download the raw app structure JSON.',
      bubbleLocation: 'Bubble Editor > Settings > General'
    },
    {
      title: 'Upload for Deep AST Parsing',
      desc: 'Click "Upload Bubble JSON" in this studio to scan through pages, groups, workflows, and styles.',
      bubbleLocation: 'Studio > Dead Code & Health > Upload Bubble JSON'
    },
    {
      title: 'Inspect & Follow Fix Guide',
      desc: 'Click "How to Fix" on any detected dead element to view exact step-by-step removal instructions in Bubble.',
      bubbleLocation: 'Studio > Action Items > How to Fix'
    }
  ];

  return (
    <div className="view-container">
      {/* Interactive Guide Banner */}
      <GuideBanner
        moduleName="Dead Code Detector & Health Engine"
        summary="Scan your Bubble.io application tree to identify orphaned UI elements, unused custom events, dead database fields, and unreferenced styles."
        steps={guideSteps}
        bubbleDocUrl="https://manual.bubble.io/help-guides/optimizing-an-application"
      />

      {/* Hidden File Input for uploading custom Bubble export */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* When no audit has been run for a real app */}
      {!report && !isScanning && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            marginBottom: '16px'
          }}>
            <Stethoscope size={28} />
          </div>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Audit Performed Yet for "{activeProject?.name}"
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '520px', margin: '0 auto 20px', lineHeight: 1.6 }}>
            Run a full AST dead code inspection or upload your Bubble export JSON to detect orphaned elements, unused workflows, and unreferenced styles.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => runAudit()} className="btn btn-primary">
              <RefreshCw size={16} />
              <span>Run Deep AST Audit</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary">
              <Upload size={16} />
              <span>Upload Bubble JSON Export</span>
            </button>
          </div>
        </div>
      )}

      {/* Health Score Overview Card */}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                    Bubble App Health & Optimization Score
                  </h2>
                  {uploadedFileName && (
                    <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                      <FileCode size={11} /> {uploadedFileName}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {report.deadItems.length} issues detected across pages, workflows, database, and styles for {activeProject?.name}.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary btn-sm"
                title="Upload your own Bubble application export JSON"
              >
                <Upload size={14} />
                <span>Upload Bubble JSON</span>
              </button>
              <button onClick={handleExportManifest} disabled={!report} className="btn btn-secondary btn-sm">
                <Download size={14} />
                <span>Export Manifest</span>
              </button>
              <button onClick={() => runAudit()} disabled={isScanning} className="btn btn-primary btn-sm">
                <RefreshCw size={14} className={isScanning ? 'spin' : ''} />
                <span>{isScanning ? 'Scanning AST...' : 'Re-run Audit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dead Code Breakdown Metrics */}
      {report && (
        <div className="metrics-grid">
          <div className="card metric-card">
            <div className="metric-header">
              <span className="metric-title">Dead UI Elements</span>
              <Layers size={18} color="var(--accent-rose)" />
            </div>
            <div className="metric-value">{report.deadElementsCount}</div>
            <div className="metric-subtitle">Invisible 0x0 or unreachable</div>
          </div>

          <div className="card metric-card">
            <div className="metric-header">
              <span className="metric-title">Orphaned Workflows</span>
              <Sparkles size={18} color="var(--accent-amber)" />
            </div>
            <div className="metric-value">{report.deadWorkflowsCount}</div>
            <div className="metric-subtitle">0 triggers or empty actions</div>
          </div>

          <div className="card metric-card">
            <div className="metric-header">
              <span className="metric-title">Unused DB Fields</span>
              <CheckCircle2 size={18} color="var(--accent-cyan)" />
            </div>
            <div className="metric-value">{report.deadFieldsCount}</div>
            <div className="metric-subtitle">Never queried in UI/APIs</div>
          </div>

          <div className="card metric-card">
            <div className="metric-header">
              <span className="metric-title">Unreferenced Styles</span>
              <AlertOctagon size={18} color="var(--accent-indigo)" />
            </div>
            <div className="metric-value">{report.deadStylesCount}</div>
            <div className="metric-subtitle">Unused CSS & Color tokens</div>
          </div>
        </div>
      )}

      {/* Actionable Dead Items Table */}
      {report && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Filter size={18} color="var(--primary)" />
                <span>Actionable Dead Items ({filteredItems.length})</span>
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

          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={36} color="var(--accent-emerald)" style={{ marginBottom: '8px' }} />
              <div>All clean! No dead code items matching the selected filter.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span 
                      className={`badge ${
                        item.severity === 'high' ? 'badge-rose' : 
                        item.severity === 'medium' ? 'badge-amber' : 
                        'badge-cyan'
                      }`}
                      style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}
                    >
                      {item.severity}
                    </span>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {item.name}
                        </span>
                        <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                          {item.type}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        📍 {item.pageName || 'Global'} • <span style={{ color: 'var(--accent-rose)' }}>{item.reason}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setSelectedItemForFix(item)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      <HelpCircle size={13} color="var(--primary)" />
                      <span>How to Fix</span>
                    </button>

                    <button
                      onClick={() => handleCleanItem(item)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      title="Mark as reviewed / resolved in Bubble"
                    >
                      <CheckCircle2 size={13} color="var(--accent-emerald)" />
                      <span>Cleaned</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step-by-Step Fix Guide Modal */}
      <FixGuideModal
        item={selectedItemForFix}
        onClose={() => setSelectedItemForFix(null)}
        onMarkCleaned={handleCleanItem}
      />
    </div>
  );
};
