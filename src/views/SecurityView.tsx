import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  Layers,
  Search,
  Sliders,
  FileCode,
  Zap
} from 'lucide-react';
import { ProjectProfile, SecurityAuditReport } from '../types';
import { SecurityEngine } from '../core/security/securityEngine';
import { SecurityMatrixGrid } from '../components/SecurityMatrixGrid';

interface SecurityViewProps {
  activeProject?: ProjectProfile;
  onLog: (module: 'security', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

type SecuritySubTab = 'matrix' | 'endpoints' | 'pii' | 'export';

export const SecurityView: React.FC<SecurityViewProps> = ({ activeProject, onLog }) => {
  const [subTab, setSubTab] = useState<SecuritySubTab>('matrix');
  const [report, setReport] = useState<SecurityAuditReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    runSecurityScan();
  }, [activeProject?.id, activeProject?.blueprintFileName, activeProject?.blueprintExportJson]);

  const runSecurityScan = async () => {
    setIsScanning(true);
    onLog('security', 'Initiating Bubble Privacy Rules & Security Vulnerability scan...');
    try {
      const rep = await SecurityEngine.analyzeSecurity(activeProject?.blueprintExportJson);
      setReport(rep);
      onLog('security', `Security audit completed. Score: ${rep.overallScore}/100 (Grade ${rep.securityGrade}) with ${rep.criticalVulnerabilitiesCount} critical vulnerabilities.`, rep.criticalVulnerabilitiesCount > 0 ? 'warn' : 'success');
    } finally {
      setIsScanning(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!report) return;
    const md = SecurityEngine.generateMarkdownReport(report);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bubble_security_audit_${Date.now()}.md`;
    a.click();
    onLog('security', 'Security report exported as Markdown.', 'success');
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, rgba(99, 102, 241, 0.08) 100%)', border: '1px solid var(--border-active)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f43f5e 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 8px 20px -4px rgba(244, 63, 94, 0.4)'
            }}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Security & Privacy Rules Auditor
              </h1>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Role-Based Access Control (RBAC) matrix, "Everyone Else" vulnerability scanner, and API workflow exposure checks
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={runSecurityScan} disabled={isScanning} className="btn btn-secondary btn-sm">
              <RefreshCw size={13} className={isScanning ? 'spin' : ''} />
              <span>{isScanning ? 'Scanning...' : 'Rescan Security'}</span>
            </button>
            <button onClick={handleExportMarkdown} className="btn btn-primary btn-sm">
              <Download size={13} />
              <span>Export Audit Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Score Cards */}
      {report && (
        <div className="grid-4">
          <div className="card" style={{ background: 'var(--bg-card)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>SECURITY SCORE</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: report.overallScore >= 80 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
              {report.overallScore}<span style={{ fontSize: '1rem' }}>/100</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Security Grade: <strong>{report.securityGrade}</strong></div>
          </div>

          <div className="card" style={{ background: report.criticalVulnerabilitiesCount > 0 ? 'rgba(244, 63, 94, 0.1)' : 'var(--bg-card)', border: report.criticalVulnerabilitiesCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f43f5e' }}>CRITICAL VULNERABILITIES</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f43f5e' }}>
              {report.criticalVulnerabilitiesCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Insecure public endpoints</div>
          </div>

          <div className="card" style={{ background: 'var(--bg-card)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>SENSITIVE FIELDS AUDITED</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              {report.exposedSensitiveFields.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PII and financial tokens</div>
          </div>

          <div className="card" style={{ background: 'var(--bg-card)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>RBAC PERMISSIONS RULES</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
              {report.matrix.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Evaluated across all roles</div>
          </div>
        </div>
      )}

      {/* Subtabs Bar */}
      <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <button onClick={() => setSubTab('matrix')} className={`btn btn-sm ${subTab === 'matrix' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
          <Lock size={13} />
          <span>RBAC Matrix Grid</span>
        </button>
        <button onClick={() => setSubTab('endpoints')} className={`btn btn-sm ${subTab === 'endpoints' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
          <ShieldAlert size={13} />
          <span>Insecure API Workflows ({report?.insecureEndpoints.length || 0})</span>
        </button>
        <button onClick={() => setSubTab('pii')} className={`btn btn-sm ${subTab === 'pii' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
          <AlertTriangle size={13} />
          <span>Exposed PII & Sensitive Fields ({report?.exposedSensitiveFields.length || 0})</span>
        </button>
      </div>

      {/* SUBTAB 1: RBAC MATRIX */}
      {subTab === 'matrix' && report && (
        <SecurityMatrixGrid matrix={report.matrix} />
      )}

      {/* SUBTAB 2: INSECURE ENDPOINTS */}
      {subTab === 'endpoints' && report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {report.insecureEndpoints.map(ep => (
            <div key={ep.id} className="card" style={{ borderLeft: `4px solid ${ep.severity === 'critical' ? '#f43f5e' : ep.severity === 'high' ? '#f59e0b' : '#38bdf8'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge ${ep.severity === 'critical' ? 'badge-rose' : ep.severity === 'high' ? 'badge-amber' : 'badge-cyan'}`}>
                    {ep.severity.toUpperCase()}
                  </span>
                  <code style={{ fontWeight: 700, fontSize: '0.85rem' }}>{ep.route}</code>
                </div>
                <span className="badge badge-indigo">Bubble Backend Workflow</span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: '0 0 8px' }}>
                {ep.issue}
              </p>

              <div style={{ padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--accent-emerald)' }}>
                <strong>Recommended Fix:</strong> {ep.recommendation}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 3: EXPOSED PII */}
      {subTab === 'pii' && report && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <AlertTriangle size={18} color="var(--accent-amber)" />
              <span>Exposed Sensitive Fields Scanner</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {report.exposedSensitiveFields.map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <strong>{f.dataType}.{f.field}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.reason}</div>
                </div>
                <span className="badge badge-rose">{f.piiType || 'SENSITIVE DATA'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
