import React from 'react';
import { Cpu, Download } from 'lucide-react';
import { GlobalSettings } from '../../types';
import { APP_VERSION, APP_EDITION } from '../../version';
import { toast } from '../../core/toast/toastManager';

interface DiagnosticsTabProps {
  formData: GlobalSettings;
  selectedProvider: string;
}

export const DiagnosticsTab: React.FC<DiagnosticsTabProps> = ({
  formData,
  selectedProvider
}) => {
  const handleExportSystemDiagnostics = () => {
    const diag = {
      appVersion: APP_VERSION,
      edition: APP_EDITION,
      timestamp: new Date().toISOString(),
      platform: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
      activeProjectId: formData.activeProjectId,
      projectsCount: formData.projects.length,
      theme: formData.theme,
      aiProvider: selectedProvider,
      defaultAiModel: formData.defaultAiModel,
      hasGeminiKey: Boolean(formData.geminiApiKey),
      hasOpenaiKey: Boolean(formData.openaiApiKey),
      hasAnthropicKey: Boolean(formData.anthropicApiKey),
      hasGroqKey: Boolean(formData.groqApiKey),
      hasXaiKey: Boolean(formData.xaiApiKey),
      hasOpenrouterKey: Boolean(formData.openrouterApiKey),
      hasDeepseekKey: Boolean(formData.deepseekApiKey),
      autoBackupInterval: formData.autoBackupInterval,
      autoBackupRetention: formData.autoBackupRetention,
      autoBackupBeforeSync: formData.autoBackupBeforeSync
    };

    const blob = new Blob([JSON.stringify(diag, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bds_diagnostics_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported system diagnostics report');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="grid-3" style={{ gap: '14px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>STUDIO VERSION</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{APP_VERSION}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{APP_EDITION}</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CONNECTED WORKSPACES</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{formData.projects.length} Apps</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Active: {formData.projects.find(p => p.id === formData.activeProjectId)?.name || 'None'}</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACTIVE AI PROVIDER</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{selectedProvider.toUpperCase()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Model: {formData.defaultAiModel}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Cpu size={18} color="var(--primary)" />
              <span>Environment Diagnostic Summary</span>
            </div>
            <div className="card-subtitle">Export diagnostic metadata for bug reports and troubleshooting</div>
          </div>

          <button onClick={handleExportSystemDiagnostics} className="btn btn-primary btn-sm">
            <Download size={13} />
            <span>Export Diagnostics JSON</span>
          </button>
        </div>

        <div style={{
          background: 'var(--bg-input)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          color: 'var(--text-primary)',
          lineHeight: 1.6
        }}>
          <div>• Studio Version: <strong>{APP_VERSION}</strong> ({APP_EDITION})</div>
          <div>• Active Workspace ID: <strong>{formData.activeProjectId || 'None'}</strong></div>
          <div>• Connected Projects: <strong>{formData.projects.length}</strong></div>
          <div>• AI Provider: <strong>{selectedProvider}</strong> (Model: {formData.defaultAiModel})</div>
          <div>• Storage Engine: <strong>IndexedDB (v1) + LocalStorage</strong></div>
          <div>• System Ready: <strong>True</strong></div>
        </div>
      </div>
    </div>
  );
};
