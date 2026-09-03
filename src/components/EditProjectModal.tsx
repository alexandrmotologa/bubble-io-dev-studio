import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Globe, 
  Key, 
  Server, 
  Lock, 
  Eye, 
  EyeOff, 
  Activity, 
  Upload, 
  FileCode, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Zap,
  RefreshCw
} from 'lucide-react';
import { ProjectProfile } from '../types';
import { DevOpsEngine } from '../core/devops/devopsEngine';
import { toast } from '../core/toast/toastManager';
import { BubbleSyncEngine } from '../core/bubble-sync/bubbleSyncEngine';
import { WorkflowGraphEngine } from '../core/workflows/workflowGraphEngine';

interface EditProjectModalProps {
  isOpen: boolean;
  project: ProjectProfile | null;
  onClose: () => void;
  onSave: (updatedProject: ProjectProfile) => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  project,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [appId, setAppId] = useState('');
  const [environment, setEnvironment] = useState('version-test');
  const [customDomain, setCustomDomain] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [httpBasicUser, setHttpBasicUser] = useState('');
  const [httpBasicPassword, setHttpBasicPassword] = useState('');
  const [aiProvider, setAiProvider] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [aiApiKey, setAiApiKey] = useState('');

  // Blueprint file state
  const [blueprintFileName, setBlueprintFileName] = useState<string | undefined>(undefined);
  const [blueprintExportJson, setBlueprintExportJson] = useState<any>(undefined);
  const [stats, setStats] = useState<any>(undefined);

  // UI state
  const [showToken, setShowToken] = useState(false);
  const [showBasicPass, setShowBasicPass] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncingBubble, setIsSyncingBubble] = useState(false);
  const [testResult, setTestResult] = useState<{ reachable: boolean; latencyMs?: number; message?: string } | null>(null);

  const handleGenerateFromApi = async () => {
    if (!appId) {
      toast.error('Please enter an Application ID first');
      return;
    }
    setIsSyncingBubble(true);
    try {
      const targetProj = { ...project, appId, apiToken, customDomain, environment } as ProjectProfile;
      const res = await BubbleSyncEngine.generateBlueprintFromApi(targetProj);
      if (res.success && res.data) {
        setBlueprintFileName(res.fileName);
        setBlueprintExportJson(res.data);
        const parsedSchema = DevOpsEngine.parseBubbleSchemaJson(res.data, targetProj);
        const workflows = WorkflowGraphEngine.extractAllWorkflows(res.data);
        setStats({
          pagesCount: Object.keys(res.data.pages || {}).length || 1,
          workflowsCount: workflows.length,
          dataTypesCount: parsedSchema.dataTypes.length
        });
      }
    } finally {
      setIsSyncingBubble(false);
    }
  };

  const handleOpenBrowserExport = async () => {
    if (!appId) {
      toast.error('Please enter an Application ID first');
      return;
    }
    await BubbleSyncEngine.openBubbleExportInBrowser(appId, (fileName, content) => {
      setBlueprintFileName(fileName);
      setBlueprintExportJson(content);
      const targetProj = { ...project, appId } as ProjectProfile;
      const parsedSchema = DevOpsEngine.parseBubbleSchemaJson(content, targetProj);
      const workflows = WorkflowGraphEngine.extractAllWorkflows(content);
      setStats({
        pagesCount: Object.keys(content.pages || {}).length || 1,
        workflowsCount: workflows.length,
        dataTypesCount: parsedSchema.dataTypes.length
      });
    });
  };

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setAppId(project.appId || '');
      setEnvironment(project.environment || 'version-test');
      setCustomDomain(project.customDomain || '');
      setApiToken(project.apiToken || '');
      setHttpBasicUser(project.httpBasicUser || '');
      setHttpBasicPassword(project.httpBasicPassword || (project as any).httpBasicPass || '');
      setAiProvider(project.aiProvider || '');
      setAiModel(project.aiModel || '');
      setAiApiKey(project.aiApiKey || '');
      setBlueprintFileName(project.blueprintFileName);
      setBlueprintExportJson(project.blueprintExportJson);
      setStats(project.stats);
      setTestResult(null);
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const targetHost = customDomain.trim() ? customDomain.trim() : `${appId.trim()}.bubbleapps.io`;
  const computedDataApiUrl = `https://${targetHost}/${environment}/api/1.1/obj`;
  const computedMetaApiUrl = `https://${targetHost}/${environment}/api/1.1/meta`;

  const handleTestConnection = async () => {
    if (!appId.trim()) {
      toast.error('Please provide a valid Bubble App ID');
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const mockProject: ProjectProfile = {
        ...project,
        name,
        appId: appId.trim(),
        environment,
        customDomain: customDomain.trim(),
        apiToken: apiToken.trim(),
        httpBasicUser: httpBasicUser.trim(),
        httpBasicPassword: httpBasicPassword.trim()
      };
      const res = await DevOpsEngine.checkHealth(mockProject);
      setTestResult({
        reachable: res.reachable,
        latencyMs: res.latencyMs,
        message: res.details
      });
      if (res.reachable) {
        toast.success(`Connection successful (${res.latencyMs}ms)!`);
      } else {
        toast.error(`Connection failed: ${res.details || 'Endpoint unreachable'}`);
      }
    } catch (e: any) {
      setTestResult({ reachable: false, message: e.message });
      toast.error(`Error: ${e.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleBlueprintUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);
        const pagesCount = json.pages ? Object.keys(json.pages).length : 1;
        const workflowsCount = json.workflows ? Object.keys(json.workflows).length : 0;
        const elementsCount = json.elements ? Object.keys(json.elements).length : 0;
        const dataTypesCount = json.data_types ? Object.keys(json.data_types).length : 0;

        setBlueprintFileName(file.name);
        setBlueprintExportJson(json);
        setStats({
          pagesCount,
          workflowsCount,
          elementsCount,
          dataTypesCount,
          appTextsCount: json.app_texts ? Object.keys(json.app_texts).length : 0
        });

        toast.success(`Attached '${file.name}' (${pagesCount} pages, ${workflowsCount} workflows)`);
      } catch (err: any) {
        toast.error(`Failed to parse .bubble JSON: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !appId.trim()) {
      toast.error('Application Title and App ID are required.');
      return;
    }

    const updated: ProjectProfile = {
      ...project,
      name: name.trim(),
      appId: appId.trim(),
      environment: environment.trim(),
      customDomain: customDomain.trim() || undefined,
      apiToken: apiToken.trim() || undefined,
      httpBasicUser: httpBasicUser.trim() || undefined,
      httpBasicPassword: httpBasicPassword.trim() || undefined,
      aiProvider: aiProvider.trim() || undefined,
      aiModel: aiModel.trim() || undefined,
      aiApiKey: aiApiKey.trim() || undefined,
      blueprintFileName,
      blueprintExportJson,
      stats,
      lastActiveAt: new Date().toISOString()
    };

    onSave(updated);
    toast.success(`Workspace '${updated.name}' updated successfully!`);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(99, 102, 241, 0.2)',
          border: '1px solid var(--border-active)',
          overflow: 'hidden',
          padding: 0
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Globe size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                Edit Bubble Workspace Settings
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Update application title, API endpoints, tokens & authentication
              </div>
            </div>
          </div>

          <button onClick={onClose} className="btn-icon" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            
            {/* Row 1: App Title & Environment */}
            <div className="grid-2" style={{ gap: '12px' }}>
              <div>
                <label className="input-label">Workspace / Application Title *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. My Bubble SaaS App"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="input-label">Target Environment / Branch *</label>
                <select
                  value={environment}
                  onChange={e => setEnvironment(e.target.value)}
                  className="select select-premium"
                >
                  <option value="version-test">version-test (Development)</option>
                  <option value="live">live (Production)</option>
                  <option value="version-staging">version-staging (Custom Branch)</option>
                  <option value="version-qa">version-qa (Custom Branch)</option>
                </select>
              </div>
            </div>

            {/* Row 2: Bubble App ID & Custom Domain */}
            <div className="grid-2" style={{ gap: '12px' }}>
              <div>
                <label className="input-label">Bubble App ID / Subdomain *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={appId}
                    onChange={e => setAppId(e.target.value)}
                    placeholder="e.g. my-bubble-app"
                    className="input"
                    required
                  />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Found in your URL: <code>bubble.io/page?id=<strong>my-bubble-app</strong></code>
                </div>
              </div>

              <div>
                <label className="input-label">Custom Domain (Optional)</label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={e => setCustomDomain(e.target.value)}
                  placeholder="e.g. app.mycompany.com"
                  className="input"
                />
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Leave blank to use <code>{appId ? `${appId}.bubbleapps.io` : 'your-app.bubbleapps.io'}</code>
                </div>
              </div>
            </div>

            {/* Row 3: Private API Token */}
            <div>
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Private Data API Token (Bearer Auth)</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Bubble Settings &gt; API &gt; API Tokens</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showToken ? 'text' : 'password'}
                  value={apiToken}
                  onChange={e => setApiToken(e.target.value)}
                  placeholder="Paste your 32-character API Token..."
                  className="input"
                  style={{ paddingRight: '36px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  style={{ position: 'absolute', right: '10px', top: '11px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Row 4: Agency Plan HTTP Basic Auth */}
            <div style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} color="var(--accent-amber)" />
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  Agency Plan HTTP Basic Auth (Username & Password Protection)
                </strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                If your Bubble development version is protected with password protection in Bubble Settings &gt; General &gt; Limit access to this application, enter the credentials below.
              </div>

              <div className="grid-2" style={{ gap: '10px' }}>
                <div>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>HTTP Basic Username</label>
                  <input
                    type="text"
                    value={httpBasicUser}
                    onChange={e => setHttpBasicUser(e.target.value)}
                    placeholder="e.g. admin or client_user"
                    className="input"
                    style={{ fontSize: '0.8rem', padding: '8px 12px' }}
                  />
                </div>
                <div>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>HTTP Basic Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showBasicPass ? 'text' : 'password'}
                      value={httpBasicPassword}
                      onChange={e => setHttpBasicPassword(e.target.value)}
                      placeholder="Password..."
                      className="input"
                      style={{ fontSize: '0.8rem', padding: '8px 36px 8px 12px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowBasicPass(!showBasicPass)}
                      style={{ position: 'absolute', right: '10px', top: '9px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      {showBasicPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 5: Attached .bubble Blueprint AST File */}
            <div style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileCode size={16} color="var(--accent-cyan)" />
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    Exported .bubble Blueprint JSON
                  </strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {blueprintFileName ? (
                    <span>Attached: <strong>{blueprintFileName}</strong> ({stats?.pagesCount || 1} Pages, {stats?.workflowsCount || 0} Workflows)</span>
                  ) : (
                    <span>No .bubble export attached yet. Used for AST Dead Code & Logic Flowcharts.</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleGenerateFromApi}
                  disabled={isSyncingBubble}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '6px 12px', gap: '5px' }}
                  title="Generate .bubble file directly from Bubble Data API schema"
                >
                  <Zap size={13} className={isSyncingBubble ? 'spin' : ''} />
                  <span>{isSyncingBubble ? 'Generating...' : '⚡ Generate from API'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenBrowserExport}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '6px 12px', gap: '5px' }}
                  title="Open Bubble Settings in your default browser and auto-detect export"
                >
                  <ExternalLink size={13} color="var(--accent-cyan)" />
                  <span>Browser Export</span>
                </button>

                <label className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', cursor: 'pointer', margin: 0 }}>
                  <Upload size={13} />
                  <span>{blueprintFileName ? 'Replace File' : 'Attach File'}</span>
                  <input
                    type="file"
                    accept=".json,.bubble"
                    onChange={handleBlueprintUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            {/* Computed Endpoints Preview & Test Connection */}
            <div style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                COMPUTED DATA API ENDPOINT:
              </div>
              <code style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>
                {computedDataApiUrl}
              </code>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <div style={{ fontSize: '0.75rem' }}>
                  {testResult && (
                    <span style={{ color: testResult.reachable ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 600 }}>
                      {testResult.reachable ? `✓ Online (${testResult.latencyMs}ms)` : `✗ Offline: ${testResult.message}`}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  <Activity size={12} className={isTesting ? 'spin' : ''} />
                  <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div style={{
            padding: '14px 22px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            background: 'var(--bg-card)'
          }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={14} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
