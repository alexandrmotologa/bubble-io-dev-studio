import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  RefreshCw, 
  FileText, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Key, 
  Copy, 
  Table, 
  X 
} from 'lucide-react';
import { BubbleSchema, EnvDiffReport, ProjectProfile, ReleaseChecklistTask } from '../../types';
import { EnvSyncEngine } from '../../core/env-sync/envSyncEngine';
import { toast } from '../../core/toast/toastManager';

interface EnvSyncTabProps {
  schema: BubbleSchema | null;
  activeProject?: ProjectProfile;
  onLog: (module: 'devops', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
  onNavigateToSchema?: () => void;
}

export const EnvSyncTab: React.FC<EnvSyncTabProps> = ({
  schema,
  activeProject,
  onLog,
  onNavigateToSchema
}) => {
  const [envDiff, setEnvDiff] = useState<EnvDiffReport | null>(null);
  const [releaseTasks, setReleaseTasks] = useState<ReleaseChecklistTask[]>([]);
  const [isSyncingEnv, setIsSyncingEnv] = useState(false);

  // Inspector modal states
  const [selectedEnvField, setSelectedEnvField] = useState<{ dataType: string; fieldName: string; fieldType: string } | null>(null);
  const [selectedSecretKey, setSelectedSecretKey] = useState<{ keyName: string; inSource: boolean; inTarget: boolean } | null>(null);
  const [selectedNewTable, setSelectedNewTable] = useState<string | null>(null);

  const loadEnvSync = async () => {
    setIsSyncingEnv(true);
    try {
      const diff = await EnvSyncEngine.compareEnvironments('version-test', 'live', schema, activeProject);
      setEnvDiff(diff);
      setReleaseTasks(EnvSyncEngine.getReleaseChecklist(diff));
      onLog('devops', 'Completed Cross-Environment Diff (Development vs Live).', 'info');
    } finally {
      setIsSyncingEnv(false);
    }
  };

  useEffect(() => {
    loadEnvSync();
  }, [activeProject?.id, schema]);

  const handleExportEnvSignoffMarkdown = () => {
    if (!envDiff) return;
    const completedTasks = releaseTasks.filter(t => t.completed);
    const readyPct = Math.round((completedTasks.length / (releaseTasks.length || 1)) * 100);

    let md = `# 🚀 Bubble.io Production Release Sign-off & Audit Report\n\n`;
    md += `- **Application:** ${activeProject?.name || activeProject?.appId || 'Bubble App'}\n`;
    md += `- **Generated:** ${new Date().toISOString()}\n`;
    md += `- **Release Readiness:** ${readyPct}% (${completedTasks.length} / ${releaseTasks.length} Checks Passed)\n`;
    md += `- **Target Environment:** \`${envDiff.targetEnv}\` (Production)\n\n`;

    md += `## 📊 Environment Diff Summary\n\n`;
    md += `| Category | Status |\n| :--- | :--- |\n`;
    md += `| 🗃️ New Tables Pending Deploy | ${envDiff.missingDataTypesInTarget.length} (${envDiff.missingDataTypesInTarget.join(', ') || 'None - All Synced'}) |\n`;
    md += `| 📝 New Fields Pending Deploy | ${envDiff.missingFieldsInTarget.length} fields |\n`;
    md += `| 🔑 Secret Keys & API Status | ${envDiff.secretKeyMismatches.filter(k => k.inTarget).length} / ${envDiff.secretKeyMismatches.length} Verified in Live |\n\n`;

    if (envDiff.missingFieldsInTarget.length > 0) {
      md += `### 📝 Pending Fields List\n\n`;
      for (const f of envDiff.missingFieldsInTarget) {
        md += `- \`${f.dataType}.${f.fieldName}\` (Type: \`${f.fieldType}\`)\n`;
      }
      md += `\n`;
    }

    md += `## ✅ Pre-Release Checklist Sign-off\n\n`;
    for (const t of releaseTasks) {
      md += `- [${t.completed ? 'x' : ' '}] **[${t.category.toUpperCase()}]** ${t.title}\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `release-signoff-${activeProject?.appId || 'bubble'}-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded Pre-Release Sign-off report!');
    onLog('devops', 'Exported Pre-Release Sign-off report (.md).', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="card">
        <div className="card-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div className="card-title" style={{ margin: 0 }}>
                <Layers size={18} color="var(--accent-cyan)" />
                <span>Cross-Environment Diff & Pre-Release Checklist</span>
              </div>
              {envDiff && (
                <span
                  className={`badge ${
                    envDiff.secretKeyMismatches.some(k => k.inSource && !k.inTarget)
                      ? 'badge-rose'
                      : envDiff.missingDataTypesInTarget.length > 0
                      ? 'badge-amber'
                      : 'badge-emerald'
                  }`}
                  style={{ fontSize: '0.675rem', fontWeight: 700 }}
                >
                  {envDiff.secretKeyMismatches.some(k => k.inSource && !k.inTarget)
                    ? '🔴 HIGH DRIFT RISK (Missing Keys)'
                    : envDiff.missingDataTypesInTarget.length > 0
                    ? '🟡 MEDIUM DRIFT RISK (New Tables)'
                    : '🟢 LOW DRIFT RISK (Additive Fields Only)'}
                </span>
              )}
            </div>
            <div className="card-subtitle" style={{ marginTop: '4px' }}>
              Comparing <code>version-test</code> (Development) ➔ <code>live</code> (Production)
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {envDiff && (
              <button
                type="button"
                onClick={handleExportEnvSignoffMarkdown}
                className="btn btn-secondary btn-sm"
                title="Export Pre-Release Sign-off Markdown Report"
              >
                <FileText size={13} color="var(--accent-cyan)" />
                <span>Export Sign-off (.md)</span>
              </button>
            )}
            <button onClick={loadEnvSync} disabled={isSyncingEnv} className="btn btn-primary btn-sm">
              <RefreshCw size={13} className={isSyncingEnv ? 'spin' : ''} />
              <span>{isSyncingEnv ? 'Analyzing Diff...' : 'Run Env Diff'}</span>
            </button>
          </div>
        </div>

        {envDiff && (
          <>
            <div className="grid-3" style={{ marginTop: '14px' }}>
              <div
                className="card"
                style={{ background: 'var(--bg-input)', cursor: envDiff.missingDataTypesInTarget.length > 0 ? 'pointer' : 'default', transition: 'all 0.15s ease' }}
                onClick={() => envDiff.missingDataTypesInTarget.length > 0 && setSelectedNewTable(envDiff.missingDataTypesInTarget[0])}
                title={envDiff.missingDataTypesInTarget.length > 0 ? 'Click to inspect pending new table' : undefined}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NEW TABLES PENDING DEPLOY</div>
                  {envDiff.missingDataTypesInTarget.length > 0 && <Info size={13} color="var(--accent-amber)" />}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: envDiff.missingDataTypesInTarget.length > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                  {envDiff.missingDataTypesInTarget.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', wordBreak: 'break-word', lineHeight: 1.3 }}>
                  {envDiff.missingDataTypesInTarget.join(', ') || 'All tables synced in Live'}
                </div>
              </div>

              <div className="card" style={{ background: 'var(--bg-input)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NEW FIELDS PENDING DEPLOY</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: envDiff.missingFieldsInTarget.length > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                  {envDiff.missingFieldsInTarget.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', wordBreak: 'break-word', lineHeight: 1.3 }}>
                  Across {Array.from(new Set(envDiff.missingFieldsInTarget.map(f => f.dataType))).join(', ') || 'all models'}
                </div>
              </div>

              <div className="card" style={{ background: 'var(--bg-input)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SECRET KEYS & API STATUS</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: envDiff.secretKeyMismatches.some(k => k.inSource && !k.inTarget) ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                  {envDiff.secretKeyMismatches.filter(k => k.inSource && k.inTarget).length} / {envDiff.secretKeyMismatches.length} Verified
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>In Live environment settings</div>
              </div>
            </div>

            {/* Pending Fields Table */}
            {envDiff.missingFieldsInTarget.length > 0 && (
              <div style={{ marginTop: '14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={15} color="var(--accent-amber)" />
                    <span>Pending Fields in Development (Click to inspect field definition)</span>
                  </div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{envDiff.missingFieldsInTarget.length} fields</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '12px' }}>
                  {envDiff.missingFieldsInTarget.map((f, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedEnvField(f)}
                      style={{
                        padding: '12px 14px',
                        background: 'rgba(245, 158, 11, 0.07)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title="Click to view full field details and deployment safety info"
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: '0.825rem', color: 'var(--text-primary)', wordBreak: 'break-word', lineHeight: 1.3, display: 'block' }}>
                          {f.dataType}.{f.fieldName}
                        </strong>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>Type: <code style={{ color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>{f.fieldType}</code></span>
                          <span style={{ color: 'var(--text-muted)' }}>• Click for details</span>
                        </div>
                      </div>
                      <span className="badge badge-amber" style={{ fontSize: '0.65rem', flexShrink: 0, marginTop: '2px' }}>PENDING</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Secret Keys Checklist Grid */}
            <div style={{ marginTop: '14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={15} color="var(--accent-emerald)" />
                  <span>Live Environment Configuration & Permissions (Click to view guide)</span>
                </div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>4 Security Checks</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                {envDiff.secretKeyMismatches.map((k, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedSecretKey(k)}
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="Click to view security and setup documentation"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Key size={14} color="var(--primary)" />
                      </div>
                      <span style={{ fontSize: '0.775rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', wordBreak: 'break-all', fontWeight: 600 }}>
                        {k.keyName}
                      </span>
                    </div>
                    <span className={`badge ${k.inTarget ? 'badge-emerald' : 'badge-rose'}`} style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                      {k.inTarget ? 'LIVE SYNCED' : 'MISSING IN LIVE'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Release Tasks Checklist */}
      {releaseTasks.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <div className="card-title" style={{ margin: 0 }}>
              <CheckCircle2 size={16} color="var(--accent-emerald)" />
              <span>Pre-Release Checklist ({releaseTasks.filter(t => t.completed).length} / {releaseTasks.length} Ready)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '120px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(releaseTasks.filter(t => t.completed).length / releaseTasks.length) * 100}%`,
                    height: '100%',
                    background: releaseTasks.filter(t => t.completed).length === releaseTasks.length ? 'var(--accent-emerald)' : 'var(--primary)',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              <span className={`badge ${releaseTasks.filter(t => t.completed).length === releaseTasks.length ? 'badge-emerald' : 'badge-amber'}`}>
                {releaseTasks.filter(t => t.completed).length === releaseTasks.length ? 'READY TO DEPLOY' : 'IN PROGRESS'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {releaseTasks.map(task => (
              <div
                key={task.id}
                onClick={() => setReleaseTasks(releaseTasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  border: task.completed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => {}}
                  style={{ cursor: 'pointer' }}
                />
                <div style={{ flex: 1, fontSize: '0.85rem', color: task.completed ? 'var(--accent-emerald)' : 'var(--text-primary)', textDecoration: task.completed ? 'line-through' : 'none' }}>
                  {task.title}
                </div>
                <span className={`badge ${task.category === 'database' ? 'badge-indigo' : task.category === 'security' ? 'badge-rose' : 'badge-cyan'}`} style={{ textTransform: 'capitalize' }}>
                  {task.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal 1: Pending Field Detailed Inspector */}
      {selectedEnvField && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: 'var(--bg-surface-elevated, #121826)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 'var(--radius-lg, 12px)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.15)',
            overflow: 'hidden',
            animation: 'modalSlideIn 0.2s ease-out'
          }}>
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(18, 24, 38, 0.9) 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-amber)'
                }}>
                  <Info size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Field Deployment Inspector
                  </h2>
                  <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                    Pending field in Development (version-test)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEnvField(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.8rem'
              }}>
                <div>• <strong>Data Model (Table):</strong> <span style={{ color: 'var(--accent-cyan)' }}>{selectedEnvField.dataType}</span></div>
                <div>• <strong>Field Name:</strong> <code style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{selectedEnvField.fieldName}</code></div>
                <div>• <strong>Bubble Field Type:</strong> <span className="badge badge-indigo">{selectedEnvField.fieldType}</span></div>
                <div>• <strong>Status:</strong> <span className="badge badge-amber">PENDING LIVE DEPLOY</span></div>
              </div>

              <div style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: '0.75rem',
                color: 'var(--accent-emerald)',
                lineHeight: 1.4
              }}>
                🛡️ <strong>Safety Analysis:</strong> Adding this field will not cause data loss in Live. Existing records in production will simply hold a <code>null</code> value for this field until written.
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginBottom: '4px' }}>TypeScript Interface Representation:</div>
                <code style={{ fontSize: '0.775rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {selectedEnvField.fieldName}?: {selectedEnvField.fieldType === 'number' ? 'number' : selectedEnvField.fieldType === 'boolean' ? 'boolean' : selectedEnvField.fieldType === 'date' ? 'string' : 'string'};
                </code>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedEnvField(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${selectedEnvField.dataType}.${selectedEnvField.fieldName} (${selectedEnvField.fieldType})`);
                    toast.success('Field reference copied!');
                  }}
                  className="btn btn-primary btn-sm"
                >
                  <Copy size={13} />
                  <span>Copy Field Reference</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Secret Key & Configuration Guide Modal */}
      {selectedSecretKey && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: 'var(--bg-surface-elevated, #121826)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            borderRadius: 'var(--radius-lg, 12px)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.2)',
            overflow: 'hidden',
            animation: 'modalSlideIn 0.2s ease-out'
          }}>
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(18, 24, 38, 0.9) 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.25)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)'
                }}>
                  <Key size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Security Key Configuration
                  </h2>
                  <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                    Environment credentials & endpoint verification
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSecretKey(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.8rem'
              }}>
                <div>• <strong>Configuration Key:</strong> <code style={{ color: 'var(--accent-cyan)' }}>{selectedSecretKey.keyName}</code></div>
                <div>• <strong>Development Status:</strong> <span className="badge badge-emerald">CONFIGURED & ACTIVE</span></div>
                <div>• <strong>Live Production Status:</strong> <span className={`badge ${selectedSecretKey.inTarget ? 'badge-emerald' : 'badge-rose'}`}>{selectedSecretKey.inTarget ? 'LIVE SYNCED' : 'ACTION REQUIRED'}</span></div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {selectedSecretKey.keyName === 'BUBBLE_API_TOKEN' && 'This bearer token authenticates API calls made to your Live Bubble Data and Workflow endpoints.'}
                {selectedSecretKey.keyName === 'DATA_API_ACCESS' && 'Ensures the Bubble Data API is enabled for client reading/writing across active models in Live.'}
                {selectedSecretKey.keyName === 'META_API_ACCESS' && 'Allows introspection of Swagger/OpenAPI schema endpoints for automated documentation generation.'}
                {selectedSecretKey.keyName === 'WEBHOOK_SIGNING_SECRET' && 'Cryptographically validates incoming HTTP webhook payloads to prevent unauthorized request forgery.'}
              </div>

              <div style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                fontSize: '0.75rem',
                color: 'var(--text-primary)',
                lineHeight: 1.4
              }}>
                📍 <strong>Bubble Settings Location:</strong> In your Bubble Editor, navigate to <strong>Settings ➔ API</strong> to verify token permissions and privacy rule defaults.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedSecretKey(null)}
                  className="btn btn-primary btn-sm"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: New Table Detailed Inspector */}
      {selectedNewTable && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '500px',
            backgroundColor: 'var(--bg-surface-elevated, #121826)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 'var(--radius-lg, 12px)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.15)',
            overflow: 'hidden',
            animation: 'modalSlideIn 0.2s ease-out'
          }}>
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(18, 24, 38, 0.9) 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-amber)'
                }}>
                  <Table size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    New Table Pending Deploy
                  </h2>
                  <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                    Data type created in Development
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNewTable(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.8rem'
              }}>
                <div>• <strong>Table Name:</strong> <code style={{ color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>{selectedNewTable}</code></div>
                <div>• <strong>Environment Status:</strong> <span className="badge badge-amber">EXISTS IN DEV ONLY</span></div>
                <div>• <strong>Deployment Action:</strong> Will be created in Live upon publishing.</div>
              </div>

              <div style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                fontSize: '0.75rem',
                color: 'var(--accent-rose)',
                lineHeight: 1.4
              }}>
                ⚠️ <strong>Privacy Rules Check:</strong> Ensure you define Privacy Rules for <code>{selectedNewTable}</code> before publishing to Live to avoid unintended public Data API exposure.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedNewTable(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNewTable(null);
                    onNavigateToSchema?.();
                  }}
                  className="btn btn-primary btn-sm"
                >
                  <span>View in Schema Explorer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
