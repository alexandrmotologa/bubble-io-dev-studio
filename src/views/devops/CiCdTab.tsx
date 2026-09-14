import React, { useState, useEffect } from 'react';
import { Sparkles, FileCode, Download, Copy, Code } from 'lucide-react';
import { BubbleSchema, ProjectProfile } from '../../types';
import { CiGeneratorsEngine, CiPipelinePreset } from '../../core/devops/ciGenerators';
import { TemplateScaffolderEngine } from '../../core/devops/templateScaffolder';
import { toast } from '../../core/toast/toastManager';

interface CiCdTabProps {
  schema: BubbleSchema | null;
  activeProject?: ProjectProfile;
  onLog?: (module: 'devops', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const CiCdTab: React.FC<CiCdTabProps> = ({
  schema,
  activeProject,
  onLog
}) => {
  const [ciPreset, setCiPreset] = useState<CiPipelinePreset>('backup');
  const [ciProvider, setCiProvider] = useState<'github' | 'gitlab'>('github');
  const [ciCron, setCiCron] = useState('0 2 * * *');
  const [ciTypes, setCiTypes] = useState(
    schema?.dataTypes && schema.dataTypes.length > 0
      ? schema.dataTypes.map(t => t.name).join(', ')
      : 'User, Product, Order'
  );
  const [generatedCiYaml, setGeneratedCiYaml] = useState('');

  const [scaffoldType, setScaffoldType] = useState<'plugin-action' | 'api-connector' | 'webhook' | 'sdk-quickstart'>('plugin-action');
  const [scaffoldName, setScaffoldName] = useState('ProcessStripePayment');
  const [generatedScaffoldCode, setGeneratedScaffoldCode] = useState('');

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
    onLog?.('devops', `Copied ${label} to clipboard.`, 'info');
  };

  const handleDownloadCode = (code: string, defaultFilename: string) => {
    const blob = new Blob([code], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${defaultFilename}!`);
    onLog?.('devops', `Downloaded ${defaultFilename} to disk.`, 'success');
  };

  const updateCiWorkflow = () => {
    const typesArr = ciTypes.split(',').map(s => s.trim()).filter(Boolean);
    const options = {
      provider: ciProvider,
      preset: ciPreset,
      dataTypes: typesArr,
      environment: (activeProject?.environment as any) || 'version-test',
      cronSchedule: ciCron,
      retentionDays: 30,
      format: 'json' as const,
      cliVersion: 'latest'
    };

    if (ciProvider === 'github') {
      setGeneratedCiYaml(CiGeneratorsEngine.generateGitHubActionsWorkflow(options));
    } else {
      setGeneratedCiYaml(CiGeneratorsEngine.generateGitLabCiPipeline(options));
    }
  };

  const handleDownloadCiYaml = () => {
    const filename = ciProvider === 'github' ? 'bubble_ci_workflow.yml' : '.gitlab-ci.yml';
    const blob = new Blob([generatedCiYaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
    onLog?.('devops', `Downloaded CI/CD workflow configuration: ${filename}`, 'success');
  };

  const updateScaffoldCode = () => {
    if (scaffoldType === 'plugin-action') {
      setGeneratedScaffoldCode(TemplateScaffolderEngine.scaffoldPluginAction(scaffoldName));
    } else if (scaffoldType === 'api-connector') {
      setGeneratedScaffoldCode(TemplateScaffolderEngine.scaffoldApiConnector(scaffoldName));
    } else if (scaffoldType === 'webhook') {
      setGeneratedScaffoldCode(TemplateScaffolderEngine.scaffoldWebhookReceiver(scaffoldName));
    } else {
      setGeneratedScaffoldCode(TemplateScaffolderEngine.scaffoldSdkQuickstart(activeProject?.appId || 'bubble-app'));
    }
  };

  const handleDownloadScaffoldCode = () => {
    const filename = `${scaffoldName.toLowerCase()}_${scaffoldType.replace('-', '_')}.ts`;
    handleDownloadCode(generatedScaffoldCode, filename);
  };

  useEffect(() => {
    updateCiWorkflow();
  }, [ciProvider, ciPreset, ciCron, ciTypes, activeProject?.environment]);

  useEffect(() => {
    updateScaffoldCode();
  }, [scaffoldType, scaffoldName, activeProject?.appId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Architecture & Concept Guide Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <Sparkles size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                CI/CD Pipelines & DevOps for Bubble.io
              </h3>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                Standardize automated backup jobs, Pull Request schema gates, and SDK scaffolding
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.725rem' }}>
            <span className="badge badge-indigo">Zero-Config Automation</span>
            <span className="badge badge-emerald">GitHub Actions & GitLab CI</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
          <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ color: 'var(--accent-cyan)', display: 'block', marginBottom: '3px' }}>1. Set Secrets in Repository</strong>
            Add <code>BUBBLE_APP_NAME</code> and <code>BUBBLE_API_KEY</code> into GitHub <em>Settings &gt; Secrets and variables &gt; Actions</em>.
          </div>
          <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ color: 'var(--accent-emerald)', display: 'block', marginBottom: '3px' }}>2. Pick Pipeline Preset</strong>
            Choose between automated nightly backups, PR schema drift verification, or continuous Supabase replication.
          </div>
          <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '3px' }}>3. Commit & Run in Cloud</strong>
            Download the <code>.yml</code> file and commit into <code>.github/workflows/</code> to run on GitHub's global cloud runners.
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid-2">
        {/* Left: CI/CD Workflow Generator */}
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div className="card-title">
                <FileCode size={18} color="var(--primary)" />
                <span>CI/CD Pipeline Generator</span>
              </div>
              <div className="card-subtitle">Generate YAML workflows for GitHub Actions and GitLab CI</div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={handleDownloadCiYaml}
                className="btn btn-secondary btn-sm"
                title="Download Workflow File"
              >
                <Download size={12} color="var(--accent-emerald)" />
                <span>Download YAML</span>
              </button>
              <button onClick={() => handleCopy(generatedCiYaml, 'CI YAML')} className="btn btn-secondary btn-sm">
                <Copy size={12} />
                <span>Copy</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label className="input-label">Pipeline Preset & Goal</label>
              <select
                value={ciPreset}
                onChange={e => setCiPreset(e.target.value as any)}
                className="select"
              >
                <option value="backup">📦 Scheduled Nightly Automated Database Backup</option>
                <option value="schema_drift">🛡️ PR Schema Drift & Lockfile Verification Gate</option>
                <option value="security_gate">🔐 PII Privacy Rules & Security Vulnerability Gate</option>
                <option value="supabase_sync">⚡ Continuous Data Sync to Supabase / PostgreSQL</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label className="input-label">CI Provider</label>
                <select
                  value={ciProvider}
                  onChange={e => setCiProvider(e.target.value as any)}
                  className="select"
                >
                  <option value="github">GitHub Actions (.github/workflows)</option>
                  <option value="gitlab">GitLab CI (.gitlab-ci.yml)</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="input-label">Cron Schedule (UTC)</label>
                <input
                  type="text"
                  value={ciCron}
                  onChange={e => setCiCron(e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </div>

          <pre style={{
            background: 'var(--bg-input)',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: '#c4b5fd',
            overflowX: 'auto',
            maxHeight: '380px'
          }}>
            {generatedCiYaml}
          </pre>
        </div>

        {/* Right: Integration Template Scaffolder */}
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div className="card-title">
                <Code size={18} color="var(--accent-cyan)" />
                <span>Integration Template Scaffolding</span>
              </div>
              <div className="card-subtitle">Generate production-ready boilerplate for plugins, APIs, and SDKs</div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={handleDownloadScaffoldCode}
                className="btn btn-secondary btn-sm"
                title="Download Boilerplate Script"
              >
                <Download size={12} color="var(--accent-cyan)" />
                <span>Download Code</span>
              </button>
              <button onClick={() => handleCopy(generatedScaffoldCode, 'Scaffold Code')} className="btn btn-secondary btn-sm">
                <Copy size={12} />
                <span>Copy</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <div style={{ flex: 1 }}>
              <label className="input-label">Template Pattern</label>
              <select
                value={scaffoldType}
                onChange={e => setScaffoldType(e.target.value as any)}
                className="select"
              >
                <option value="plugin-action">Plugin Server-Side Action (Node.js)</option>
                <option value="api-connector">CRUD API Connector (TypeScript)</option>
                <option value="webhook">Data Change Webhook Receiver (Express)</option>
                <option value="sdk-quickstart">Type-Safe SDK Client Quickstart</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="input-label">Component / Type Name</label>
              <input
                type="text"
                value={scaffoldName}
                onChange={e => setScaffoldName(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <pre style={{
            background: 'var(--bg-input)',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: '#7dd3fc',
            overflowX: 'auto',
            maxHeight: '380px'
          }}>
            {generatedScaffoldCode}
          </pre>
        </div>
      </div>
    </div>
  );
};
