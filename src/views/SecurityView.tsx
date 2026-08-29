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
  Zap,
  Sparkles,
  Users,
  Copy,
  CheckCheck,
  Scale,
  Code,
  Shield,
  FileText
} from 'lucide-react';
import { ProjectProfile, SecurityAuditReport } from '../types';
import { SecurityEngine } from '../core/security/securityEngine';
import { DevOpsEngine } from '../core/devops/devopsEngine';
import { SecurityMatrixGrid } from '../components/SecurityMatrixGrid';
import { RoleSimulatorSandbox } from '../components/RoleSimulatorSandbox';
import { toast } from '../core/toast/toastManager';

interface SecurityViewProps {
  activeProject?: ProjectProfile;
  onLog: (module: 'security', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

type SecuritySubTab = 'matrix' | 'simulator' | 'everyone_else' | 'remediations' | 'compliance' | 'endpoints' | 'pii';

export const SecurityView: React.FC<SecurityViewProps> = ({ activeProject, onLog }) => {
  const [subTab, setSubTab] = useState<SecuritySubTab>('matrix');
  const [report, setReport] = useState<SecurityAuditReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [remediationSearch, setRemediationSearch] = useState('');
  const [selectedComplianceFramework, setSelectedComplianceFramework] = useState<string>('ALL');

  useEffect(() => {
    runSecurityScan();
  }, [activeProject?.id, activeProject?.blueprintFileName, activeProject?.blueprintExportJson]);

  const runSecurityScan = async () => {
    if (!activeProject) return;
    setIsScanning(true);
    onLog('security', 'Initiating Bubble Privacy Rules & Security Vulnerability scan...');
    try {
      let schemaToUse = null;
      if (activeProject.blueprintExportJson) {
        schemaToUse = DevOpsEngine.parseBubbleSchemaJson(activeProject.blueprintExportJson, activeProject);
      } else {
        schemaToUse = await DevOpsEngine.fetchSchema(activeProject);
      }
      const rep = await SecurityEngine.analyzeSecurity(activeProject.blueprintExportJson, schemaToUse);
      setReport(rep);
      onLog('security', `Security audit completed. Score: ${rep.overallScore}/100 (Grade ${rep.securityGrade}) with ${rep.criticalVulnerabilitiesCount} critical vulnerabilities.`, rep.criticalVulnerabilitiesCount > 0 ? 'warn' : 'success');
    } catch (err: any) {
      onLog('security', `Security scan notice: ${err.message}`, 'warn');
    } finally {
      setIsScanning(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!report) return;
    const md = SecurityEngine.generateMarkdownReport(report);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bubble_security_audit_${activeProject?.appId || 'app'}_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Executive Security Report (.md) exported!');
    onLog('security', 'Executive Security Report exported to disk.', 'success');
  };

  const handleExportSarif = () => {
    if (!report) return;
    const sarif = SecurityEngine.generateSarifReport(report);
    const blob = new Blob([sarif], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bubble_security_scan_${activeProject?.appId || 'app'}.sarif.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('SARIF 2.1.0 Security Report exported!');
    onLog('security', 'SARIF 2.1.0 Security Report exported to disk.', 'success');
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
    onLog('security', `Copied ${label} to clipboard.`, 'info');
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
                Role-Based Access Control (RBAC) matrix, "Everyone Else" vulnerability scanner, compliance posture, and API security gates
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={runSecurityScan} disabled={isScanning} className="btn btn-secondary btn-sm">
              <RefreshCw size={13} className={isScanning ? 'spin' : ''} />
              <span>{isScanning ? 'Scanning...' : 'Rescan Security'}</span>
            </button>
            <button onClick={handleExportSarif} className="btn btn-secondary btn-sm" title="Export SARIF 2.1.0 JSON for GitHub CodeQL / CI">
              <FileCode size={13} color="var(--accent-cyan)" />
              <span>Export SARIF</span>
            </button>
            <button onClick={handleExportMarkdown} className="btn btn-primary btn-sm" title="Export Executive Audit Markdown">
              <Download size={13} />
              <span>Export Executive (.md)</span>
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
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f43f5e' }}>CRITICAL RISKS</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f43f5e' }}>
              {report.criticalVulnerabilitiesCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Exposed PII & Insecure Endpoints</div>
          </div>

          <div className="card" style={{ background: 'var(--bg-card)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>SENSITIVE FIELDS DETECTED</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              {report.exposedSensitiveFields.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PII, tokens, & financial keys</div>
          </div>

          <div className="card" style={{ background: 'var(--bg-card)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>RBAC PERMISSIONS RULES</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
              {report.matrix.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Evaluated across all table roles</div>
          </div>
        </div>
      )}

      {/* Subtabs Bar */}
      <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
        <button onClick={() => setSubTab('matrix')} className={`btn btn-sm ${subTab === 'matrix' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
          <Lock size={13} />
          <span>RBAC Matrix Grid</span>
        </button>
        <button onClick={() => setSubTab('simulator')} className={`btn btn-sm ${subTab === 'simulator' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
          <Sparkles size={13} />
          <span>Role Access Simulator</span>
        </button>
        <button onClick={() => setSubTab('everyone_else')} className={`btn btn-sm ${subTab === 'everyone_else' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
          <ShieldAlert size={13} />
          <span>"Everyone Else" Public Risk ({report?.openTypesCount || 0})</span>
        </button>
        <button onClick={() => setSubTab('remediations')} className={`btn btn-sm ${subTab === 'remediations' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
          <Code size={13} />
          <span>Privacy Rules Generator ({report?.remediations?.length || 0})</span>
        </button>
        <button onClick={() => setSubTab('compliance')} className={`btn btn-sm ${subTab === 'compliance' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
          <Scale size={13} />
          <span>Compliance Posture (GDPR / SOC2)</span>
        </button>
        <button onClick={() => setSubTab('endpoints')} className={`btn btn-sm ${subTab === 'endpoints' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
          <ShieldCheck size={13} />
          <span>Insecure API Workflows ({report?.insecureEndpoints.length || 0})</span>
        </button>
        <button onClick={() => setSubTab('pii')} className={`btn btn-sm ${subTab === 'pii' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
          <AlertTriangle size={13} />
          <span>Exposed PII Fields ({report?.exposedSensitiveFields.length || 0})</span>
        </button>
      </div>

      {/* SUBTAB 1: RBAC MATRIX */}
      {subTab === 'matrix' && report && (
        <SecurityMatrixGrid matrix={report.matrix} />
      )}

      {/* SUBTAB 2: ROLE SIMULATOR SANDBOX */}
      {subTab === 'simulator' && report && (
        <RoleSimulatorSandbox matrix={report.matrix} report={report} />
      )}

      {/* SUBTAB 3: EVERYONE ELSE PUBLIC RISK SCANNER */}
      {subTab === 'everyone_else' && report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(18, 24, 38, 0.9) 100%)', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <ShieldAlert size={20} color="#f43f5e" />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                "Everyone Else" Public Scraping Vulnerability Scanner
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              In Bubble.io, tables with no Privacy Rules inherit default public access for <strong>"Everyone Else"</strong>. If a table contains confidential credentials, emails, or tokens, malicious bots can scrape the entire database table via <code>/api/1.1/obj/TableName</code> without logging in.
            </p>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Table Name</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Public Risk Level</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Sensitive Fields</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Recommended Bubble Expression</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(report.everyoneElseRisks || []).map((item, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.dataType}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge ${item.riskLevel === 'CRITICAL' ? 'badge-rose' : item.riskLevel === 'WARNING' ? 'badge-amber' : 'badge-emerald'}`}>
                          {item.riskLevel === 'CRITICAL' ? '🔴 CRITICAL RISK' : item.riskLevel === 'WARNING' ? '🟡 UNPROTECTED' : '🟢 HARDENED'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {item.sensitiveFieldsCount > 0 ? (
                          <span style={{ color: '#f43f5e', fontWeight: 700 }}>{item.sensitiveFieldsCount} confidential field(s)</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>0 confidential fields</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                        {item.bubbleExpression}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.bubbleExpression, 'Bubble Rule Expression')}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                        >
                          <Copy size={11} />
                          <span>Copy Expression</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: PRIVACY RULES CODE GENERATOR & REMEDIATIONS */}
      {subTab === 'remediations' && report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div className="card-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div className="card-title">
                  <Code size={18} color="var(--primary)" />
                  <span>Bubble Privacy Rule Generator & Scaffolder</span>
                </div>
                <div className="card-subtitle">
                  Declarative step-by-step remediation recipes ready to copy directly into Bubble Editor &gt; Data &gt; Privacy
                </div>
              </div>

              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter remediations..."
                  value={remediationSearch}
                  onChange={e => setRemediationSearch(e.target.value)}
                  className="input"
                  style={{ paddingLeft: '30px', height: '34px', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
              {(report.remediations || [])
                .filter(r => !remediationSearch || r.dataType.toLowerCase().includes(remediationSearch.toLowerCase()) || r.ruleName.toLowerCase().includes(remediationSearch.toLowerCase()))
                .map(rem => (
                  <div
                    key={rem.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="badge badge-indigo">{rem.dataType}</span>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{rem.ruleName}</strong>
                        <span className="badge badge-cyan">{rem.roleTarget}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(rem.bubbleExpression, 'Bubble Expression')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.725rem', padding: '4px 10px' }}
                      >
                        <Copy size={12} />
                        <span>Copy Expression</span>
                      </button>
                    </div>

                    <div style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid var(--border-subtle)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.775rem',
                      color: 'var(--accent-cyan)'
                    }}>
                      When: {rem.bubbleExpression}
                    </div>

                    <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                      {rem.rationale}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      <span>Protected Fields:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {rem.blockedFields.map(f => (
                          <span key={f} className="badge badge-rose" style={{ fontSize: '0.65rem' }}>{f}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: COMPLIANCE POSTURE */}
      {subTab === 'compliance' && report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="grid-4">
            {(report.complianceScores || []).map(comp => (
              <div key={comp.framework} className="card" style={{ background: 'var(--bg-card)', borderTop: `4px solid ${comp.status === 'COMPLIANT' ? '#10b981' : '#f59e0b'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{comp.framework}</strong>
                  <span className={`badge ${comp.status === 'COMPLIANT' ? 'badge-emerald' : 'badge-amber'}`}>
                    {comp.status}
                  </span>
                </div>

                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: comp.score >= 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)', marginBottom: '6px' }}>
                  {comp.score}<span style={{ fontSize: '1rem' }}>/100</span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {comp.description}
                </div>
              </div>
            ))}
          </div>

          {/* Compliance Checklist Summary Card */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '12px' }}>
              <Scale size={18} color="var(--primary)" />
              <span>International Regulatory Compliance Guidelines for Bubble</span>
            </div>

            <div className="grid-2">
              <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', fontSize: '0.775rem' }}>
                <strong style={{ color: 'var(--accent-cyan)', display: 'block', marginBottom: '4px' }}>🇪🇺 GDPR (General Data Protection Regulation)</strong>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                  Requires explicit privacy rules preventing unauthorized exposure of names, emails, phone numbers, and IP addresses in search results.
                </p>
              </div>

              <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', fontSize: '0.775rem' }}>
                <strong style={{ color: 'var(--accent-indigo)', display: 'block', marginBottom: '4px' }}>🛡️ SOC 2 (Security & Confidentiality)</strong>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                  Enforces strict Role-Based Access Control (RBAC) separation between administrators and standard application users with authentication verification.
                </p>
              </div>

              <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', fontSize: '0.775rem' }}>
                <strong style={{ color: 'var(--accent-amber)', display: 'block', marginBottom: '4px' }}>💳 PCI-DSS (Payment Card Security)</strong>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                  Prohibits saving raw card numbers in Bubble tables. Payment tokens and Stripe Customer IDs must have restricted view permissions.
                </p>
              </div>

              <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', fontSize: '0.775rem' }}>
                <strong style={{ color: 'var(--accent-emerald)', display: 'block', marginBottom: '4px' }}>🏥 HIPAA (Health Insurance Portability)</strong>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                  Requires Bubble Dedicated enterprise instances and signed Business Associate Agreements (BAA) for protected health information.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 6: INSECURE ENDPOINTS */}
      {subTab === 'endpoints' && report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {report.insecureEndpoints.length === 0 ? (
            <div className="card" style={{ padding: '36px', textAlign: 'center' }}>
              <CheckCircle2 size={36} color="var(--accent-emerald)" style={{ margin: '0 auto 10px' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                All Backend API Workflows are Secured
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                No backend workflows found with "Run without authentication" or "Ignore privacy rules".
              </p>
            </div>
          ) : (
            report.insecureEndpoints.map(ep => (
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
            ))
          )}
        </div>
      )}

      {/* SUBTAB 7: EXPOSED PII */}
      {subTab === 'pii' && report && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <AlertTriangle size={18} color="var(--accent-amber)" />
                <span>Exposed Sensitive Fields Scanner</span>
              </div>
              <div className="card-subtitle">
                Identifies real schema fields containing personal contact info, tokens, or payment data
              </div>
            </div>
            <span className="badge badge-rose">{report.exposedSensitiveFields.length} Fields Identified</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
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
