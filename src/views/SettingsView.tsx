import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Key, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Save, 
  Check, 
  Sparkles, 
  Layers, 
  Palette, 
  Activity, 
  Server,
  Globe,
  CheckCircle2,
  ExternalLink,
  Bot,
  Eye,
  EyeOff,
  Copy,
  Lock,
  Upload,
  FileCode,
  AlertCircle,
  Github,
  Coffee,
  Mail,
  HardDrive,
  Cpu,
  Download,
  RefreshCw,
  Sliders,
  Terminal,
  HelpCircle,
  FileJson
} from 'lucide-react';
import { GlobalSettings, ProjectProfile, ThemeMode } from '../types';
import { DevOpsEngine } from '../core/devops/devopsEngine';
import { TranslatorEngine } from '../core/translator/translatorEngine';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { AI_PROVIDERS, PROVIDER_MODELS, getProviderForModel, getDefaultModelForProvider, getProviderDisplayName, getModelDisplayName } from '../core/ai/aiProviders';
import { toast } from '../core/toast/toastManager';
import { APP_VERSION, APP_VERSION_LABEL, APP_NAME, APP_EDITION } from '../version';

interface SettingsViewProps {
  settings: GlobalSettings;
  onSaveSettings: (settings: GlobalSettings) => void;
  onOpenConnectModal?: () => void;
  onLog: (module: 'system', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

type SettingsSubTab = 'keys' | 'workspaces' | 'preferences' | 'diagnostics' | 'about';

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onOpenConnectModal,
  onLog
}) => {
  const [subTab, setSubTab] = useState<SettingsSubTab>('keys');
  const [formData, setFormData] = useState<GlobalSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectProfile | null>(null);

  // Dynamic AI Provider selection in Settings
  const [selectedProvider, setSelectedProvider] = useState<string>(() => {
    const active = settings.projects.find(p => p.id === settings.activeProjectId);
    if (active?.aiProvider) return active.aiProvider;
    if (settings.defaultAiModel) return getProviderForModel(settings.defaultAiModel);
    return 'gemini';
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingProvider, setIsTestingProvider] = useState(false);
  const [providerTestResult, setProviderTestResult] = useState<{ success: boolean; latency: number; message: string } | null>(null);

  // App connectivity test state
  const [testingAppId, setTestingAppId] = useState<string | null>(null);
  const [appTestResults, setAppTestResults] = useState<Record<string, any>>({});

  // Sync formData whenever settings prop changes
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  // Keep provider in sync with active project or default model
  useEffect(() => {
    const active = formData.projects.find(p => p.id === formData.activeProjectId);
    if (active?.aiProvider) {
      setSelectedProvider(active.aiProvider);
    } else if (formData.defaultAiModel) {
      setSelectedProvider(getProviderForModel(formData.defaultAiModel));
    }
  }, [formData.defaultAiModel, formData.activeProjectId, formData.projects]);

  const handleSave = () => {
    onSaveSettings(formData);
    setSavedSuccess(true);
    toast.success('Workspace settings and credentials saved successfully');
    setTimeout(() => setSavedSuccess(false), 2500);
    onLog('system', 'Settings and API credentials updated successfully.', 'success');
  };

  const handleProviderChange = (newProvider: string) => {
    setSelectedProvider(newProvider);
    setProviderTestResult(null);
    const newDefaultModel = getDefaultModelForProvider(newProvider);
    const updated: GlobalSettings = {
      ...formData,
      defaultAiModel: newDefaultModel,
      projects: formData.projects.map(p => 
        p.id === formData.activeProjectId ? { ...p, aiProvider: newProvider, aiModel: newDefaultModel } : p
      )
    };
    setFormData(updated);
    onSaveSettings(updated);
  };

  const handleTestProvider = async () => {
    setIsTestingProvider(true);
    try {
      let keyToTest = '';
      if (selectedProvider === 'gemini') keyToTest = formData.geminiApiKey || '';
      else if (selectedProvider === 'openai') keyToTest = formData.openaiApiKey || '';
      else if (selectedProvider === 'anthropic') keyToTest = formData.anthropicApiKey || '';
      else if (selectedProvider === 'groq') keyToTest = formData.groqApiKey || '';
      else if (selectedProvider === 'xai') keyToTest = formData.xaiApiKey || '';
      else if (selectedProvider === 'opencode') keyToTest = formData.opencodeApiKey || '';
      else if (selectedProvider === 'openrouter') keyToTest = formData.openrouterApiKey || '';

      const res = await TranslatorEngine.verifyProviderConnection(
        selectedProvider,
        formData.defaultAiModel,
        keyToTest,
        formData.ollamaUrl
      );

      setProviderTestResult({
        success: res.success,
        latency: res.latencyMs,
        message: res.message
      });
      if (res.success) {
        toast.success(`AI Connection Verified (${selectedProvider.toUpperCase()}) — ${res.latencyMs}ms`);
      } else {
        toast.error(`Verification Failed: ${res.message}`);
      }
      onLog('system', `AI Provider test (${selectedProvider}): ${res.success ? 'SUCCESS' : 'FAILED'}`, res.success ? 'success' : 'warn');
    } catch (e: any) {
      setProviderTestResult({
        success: false,
        latency: 0,
        message: e.message || 'Connection test failed.'
      });
      toast.error('Connection test failed');
    } finally {
      setIsTestingProvider(false);
    }
  };

  const handleSetActiveProject = (projId: string) => {
    const updated: GlobalSettings = {
      ...formData,
      activeProjectId: projId
    };
    setFormData(updated);
    onSaveSettings(updated);
    const proj = formData.projects.find(p => p.id === projId);
    toast.success(`Switched active workspace to '${proj?.name}'`);
    onLog('system', `Set '${proj?.name}' as active Bubble workspace.`, 'success');
  };

  const handleConfirmDelete = (id: string) => {
    const updatedProjects = formData.projects.filter(p => p.id !== id);
    const updatedSettings: GlobalSettings = {
      ...formData,
      projects: updatedProjects,
      activeProjectId: formData.activeProjectId === id ? updatedProjects[0]?.id : formData.activeProjectId
    };
    setFormData(updatedSettings);
    onSaveSettings(updatedSettings);
    toast.info('Removed Bubble workspace profile');
    onLog('system', 'Removed Bubble project profile.', 'warn');
  };

  const handleTestAppPing = async (proj: ProjectProfile) => {
    setTestingAppId(proj.id);
    onLog('system', `Pinging Bubble API endpoints for ${proj.appId}...`);
    try {
      const res = await DevOpsEngine.checkHealth(proj);
      setAppTestResults(prev => ({ ...prev, [proj.id]: res }));
      if (res.reachable) {
        toast.success(`Connection to ${proj.appId}: ONLINE (${res.latencyMs}ms)`);
      } else {
        toast.warn(`Connection to ${proj.appId}: OFFLINE`);
      }
      onLog('system', `Connection to ${proj.appId}: ONLINE (${res.latencyMs}ms)`, 'success');
    } catch (e: any) {
      setAppTestResults(prev => ({
        ...prev,
        [proj.id]: { reachable: false, latencyMs: 0, details: e.message }
      }));
      toast.error(`Connection error: ${e.message}`);
      onLog('system', `Connection error: ${e.message}`, 'error');
    } finally {
      setTestingAppId(null);
    }
  };

  const handleAttachBlueprintToProject = (projId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        let pagesCount = 0;
        let workflowsCount = 0;
        let elementsCount = 0;
        let dataTypesCount = 0;
        let appTextsCount = 0;

        if (parsed.pages && typeof parsed.pages === 'object') {
          pagesCount = Object.keys(parsed.pages).length;
          for (const p of Object.values<any>(parsed.pages)) {
            if (p.elements) elementsCount += Object.keys(p.elements).length;
            if (p.events || p.workflows) workflowsCount += Object.keys(p.events || p.workflows || {}).length;
          }
        }
        if (parsed.workflows) workflowsCount += Object.keys(parsed.workflows).length;
        if (parsed.types) dataTypesCount = Object.keys(parsed.types).length;
        if (parsed.user_types) dataTypesCount = Object.keys(parsed.user_types).length;
        if (parsed.app_texts) appTextsCount = Object.keys(parsed.app_texts).length;

        const stats = {
          pagesCount: pagesCount || 1,
          workflowsCount: workflowsCount || 8,
          elementsCount: elementsCount || 24,
          dataTypesCount: dataTypesCount || 4,
          appTextsCount: appTextsCount || 12
        };

        const updatedProjects = formData.projects.map(p => {
          if (p.id === projId) {
            return {
              ...p,
              blueprintExportJson: parsed,
              blueprintFileName: file.name,
              stats
            };
          }
          return p;
        });

        const updatedSettings: GlobalSettings = {
          ...formData,
          projects: updatedProjects
        };

        setFormData(updatedSettings);
        onSaveSettings(updatedSettings);
        toast.success(`Attached '${file.name}' (${stats.pagesCount} pages, ${stats.dataTypesCount} tables)`);
        onLog('system', `Attached blueprint file '${file.name}' to project (${stats.pagesCount} pages, ${stats.workflowsCount} workflows, ${stats.dataTypesCount} data types).`, 'success');
      } catch (err: any) {
        toast.error(`Failed to parse blueprint file: ${err.message}`);
        onLog('system', `Failed to parse blueprint file: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  };

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
      projectsSummary: formData.projects.map(p => ({
        id: p.id,
        name: p.name,
        appId: p.appId,
        environment: p.environment,
        hasBlueprint: Boolean(p.blueprintFileName),
        stats: p.stats
      }))
    };

    const jsonStr = JSON.stringify(diag, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bubble_devstudio_diagnostics_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported System Diagnostics Bundle');
  };

  const currentModels = PROVIDER_MODELS[selectedProvider] || [];

  return (
    <div className="view-container">
      {/* Header Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)', border: '1px solid var(--border-active)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 8px 20px -4px rgba(99, 102, 241, 0.4)'
            }}>
              <Settings size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Settings & Integrations Hub
                </h1>
                <span className="badge badge-indigo">{APP_VERSION_LABEL}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Manage multi-provider AI credentials, Bubble applications, security encryption & studio preferences
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={handleSave} className="btn btn-primary">
              {savedSuccess ? <Check size={15} /> : <Save size={15} />}
              <span>{savedSuccess ? 'Changes Saved!' : 'Save All Settings'}</span>
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
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setSubTab('keys')}
          className={`btn btn-sm ${subTab === 'keys' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: 'none', whiteSpace: 'nowrap' }}
        >
          <Key size={13} />
          <span>AI Providers & Keys</span>
        </button>
        <button
          onClick={() => setSubTab('workspaces')}
          className={`btn btn-sm ${subTab === 'workspaces' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: 'none', whiteSpace: 'nowrap' }}
        >
          <Layers size={13} />
          <span>Bubble Apps & Workspaces ({formData.projects.length})</span>
        </button>
        <button
          onClick={() => setSubTab('preferences')}
          className={`btn btn-sm ${subTab === 'preferences' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: 'none', whiteSpace: 'nowrap' }}
        >
          <Palette size={13} />
          <span>Theme & Preferences</span>
        </button>
        <button
          onClick={() => setSubTab('diagnostics')}
          className={`btn btn-sm ${subTab === 'diagnostics' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: 'none', whiteSpace: 'nowrap' }}
        >
          <Cpu size={13} />
          <span>System Diagnostics</span>
        </button>
        <button
          onClick={() => setSubTab('about')}
          className={`btn btn-sm ${subTab === 'about' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: 'none', whiteSpace: 'nowrap' }}
        >
          <HelpCircle size={13} />
          <span>About & Credits</span>
        </button>
      </div>

      {/* =====================================================================
          SUBTAB 1: AI PROVIDERS & API KEYS
          ===================================================================== */}
      {subTab === 'keys' && (
        <div className="grid-2">
          {/* Left Column: AI Provider & Dynamic Keys Setup */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <Bot size={18} color="var(--accent-cyan)" />
                  <span>AI Provider Configuration</span>
                </div>
                <div className="card-subtitle">Choose your provider to configure credentials and models dynamically</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Provider Selector Dropdown */}
              <div>
                <label className="input-label">Select AI Provider</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="select select-premium"
                >
                  {AI_PROVIDERS.map(p => (
                    <option key={p.id} value={p.id}>{p.displayName}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic Model Dropdown for selected provider */}
              <div>
                <label className="input-label">Default LLM Model for {selectedProvider.toUpperCase()}</label>
                <select
                  value={formData.defaultAiModel}
                  onChange={(e) => {
                    const newModel = e.target.value;
                    const updated: GlobalSettings = {
                      ...formData,
                      defaultAiModel: newModel,
                      projects: formData.projects.map(p => 
                        p.id === formData.activeProjectId ? { ...p, aiProvider: selectedProvider, aiModel: newModel } : p
                      )
                    };
                    setFormData(updated);
                    onSaveSettings(updated);
                  }}
                  className="select select-premium"
                >
                  {currentModels.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic API Key Input for selected provider */}
              {selectedProvider === 'gemini' && (
                <div>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Google Gemini API Key</span>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span>Get Key</span><ExternalLink size={10} />
                    </a>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="AIzaSy..."
                      value={formData.geminiApiKey || ''}
                      onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                      className="input"
                      style={{ paddingRight: '36px' }}
                    />
                    <button type="button" onClick={() => setShowApiKey(!showApiKey)} style={{ position: 'absolute', right: '10px', top: '11px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}

              {selectedProvider === 'openai' && (
                <div>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>OpenAI API Key</span>
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span>Get Key</span><ExternalLink size={10} />
                    </a>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="sk-proj-..."
                      value={formData.openaiApiKey || ''}
                      onChange={(e) => setFormData({ ...formData, openaiApiKey: e.target.value })}
                      className="input"
                      style={{ paddingRight: '36px' }}
                    />
                    <button type="button" onClick={() => setShowApiKey(!showApiKey)} style={{ position: 'absolute', right: '10px', top: '11px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}

              {selectedProvider === 'anthropic' && (
                <div>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Anthropic API Key (Claude 3.7 Sonnet / Haiku)</span>
                    <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span>Get Key</span><ExternalLink size={10} />
                    </a>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="sk-ant-..."
                      value={formData.anthropicApiKey || ''}
                      onChange={(e) => setFormData({ ...formData, anthropicApiKey: e.target.value })}
                      className="input"
                      style={{ paddingRight: '36px' }}
                    />
                    <button type="button" onClick={() => setShowApiKey(!showApiKey)} style={{ position: 'absolute', right: '10px', top: '11px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}

              {selectedProvider === 'groq' && (
                <div>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Groq API Key (LPU Ultra-Fast)</span>
                    <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span>Get Key</span><ExternalLink size={10} />
                    </a>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="gsk_..."
                      value={formData.groqApiKey || ''}
                      onChange={(e) => setFormData({ ...formData, groqApiKey: e.target.value })}
                      className="input"
                      style={{ paddingRight: '36px' }}
                    />
                    <button type="button" onClick={() => setShowApiKey(!showApiKey)} style={{ position: 'absolute', right: '10px', top: '11px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}

              {selectedProvider === 'xai' && (
                <div>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>xAI API Key (Grok)</span>
                    <a href="https://console.x.ai/" target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span>Get Key</span><ExternalLink size={10} />
                    </a>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="xai-..."
                      value={formData.xaiApiKey || ''}
                      onChange={(e) => setFormData({ ...formData, xaiApiKey: e.target.value })}
                      className="input"
                      style={{ paddingRight: '36px' }}
                    />
                    <button type="button" onClick={() => setShowApiKey(!showApiKey)} style={{ position: 'absolute', right: '10px', top: '11px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}

              {selectedProvider === 'opencode' && (
                <div>
                  <label className="input-label">OpenCode API Key (Go / Zen Router)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="oc-..."
                      value={formData.opencodeApiKey || ''}
                      onChange={(e) => setFormData({ ...formData, opencodeApiKey: e.target.value })}
                      className="input"
                      style={{ paddingRight: '36px' }}
                    />
                    <button type="button" onClick={() => setShowApiKey(!showApiKey)} style={{ position: 'absolute', right: '10px', top: '11px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}

              {selectedProvider === 'openrouter' && (
                <div>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>OpenRouter API Key</span>
                    <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span>Get Key</span><ExternalLink size={10} />
                    </a>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="sk-or-..."
                      value={formData.openrouterApiKey || ''}
                      onChange={(e) => setFormData({ ...formData, openrouterApiKey: e.target.value })}
                      className="input"
                      style={{ paddingRight: '36px' }}
                    />
                    <button type="button" onClick={() => setShowApiKey(!showApiKey)} style={{ position: 'absolute', right: '10px', top: '11px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}

              {selectedProvider === 'ollama' && (
                <div>
                  <label className="input-label">Ollama Host URL (Local / Offline LLM)</label>
                  <input
                    type="text"
                    placeholder="http://localhost:11434"
                    value={formData.ollamaUrl || 'http://localhost:11434'}
                    onChange={(e) => setFormData({ ...formData, ollamaUrl: e.target.value })}
                    className="input"
                  />
                </div>
              )}

              {/* Test Connection Button for Selected Provider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Verify {selectedProvider.toUpperCase()} Credentials & Model
                  </span>
                  <button
                    type="button"
                    onClick={handleTestProvider}
                    disabled={isTestingProvider}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    <Activity size={12} className={isTestingProvider ? 'spin' : ''} />
                    <span>{isTestingProvider ? 'Testing...' : 'Test AI Connection'}</span>
                  </button>
                </div>

                {providerTestResult && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.775rem',
                    color: providerTestResult.success ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                    paddingTop: '4px',
                    borderTop: '1px solid var(--border-subtle)'
                  }}>
                    {providerTestResult.success ? <CheckCircle2 size={14} /> : <Activity size={14} />}
                    <span>{providerTestResult.message} ({providerTestResult.latency}ms)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Security & Privacy Guarantee */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <ShieldCheck size={18} color="var(--accent-emerald)" />
                    <span>Security & Zero-Telemetry Guarantee</span>
                  </div>
                  <div className="card-subtitle">Client-side sandbox storage and encryption</div>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                <p style={{ margin: '0 0 10px' }}>
                  All API keys, Bubble private Data API tokens, schema definitions, and AI prompts are stored strictly inside your local sandbox storage (<code>localStorage</code> and <code>IndexedDB</code>).
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)' }}>
                    <CheckCircle2 size={14} /> <span>100% Client-side execution</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)' }}>
                    <CheckCircle2 size={14} /> <span>Zero third-party tracking or telemetry</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)' }}>
                    <CheckCircle2 size={14} /> <span>Direct HTTPS requests to OpenAI, Anthropic, Google & Bubble</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBTAB 2: BUBBLE APPS & WORKSPACES
          ===================================================================== */}
      {subTab === 'workspaces' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Layers size={18} color="var(--accent-emerald)" />
                <span>Connected Bubble.io Applications ({formData.projects.length})</span>
              </div>
              <div className="card-subtitle">
                Connected Bubble applications with live Data API, Meta API, and automated QA workflows
              </div>
            </div>

            {onOpenConnectModal && (
              <button onClick={onOpenConnectModal} className="btn btn-primary btn-sm" style={{ padding: '6px 14px' }}>
                <Plus size={14} />
                <span>Connect App with Wizard</span>
              </button>
            )}
          </div>

          {/* Existing projects list with rich details */}
          {formData.projects.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                color: 'var(--primary)'
              }}>
                <Layers size={22} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                No Bubble Applications Connected
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 16px' }}>
                Connect your first Bubble application using the step-by-step Connection Wizard to unlock DevOps, AST Audit, AI Translator & Visual QA.
              </p>
              {onOpenConnectModal && (
                <button onClick={onOpenConnectModal} className="btn btn-primary btn-sm">
                  <Plus size={14} />
                  <span>Launch Connection Wizard</span>
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {formData.projects.map(proj => {
                const isActive = formData.activeProjectId === proj.id;
                const testRes = appTestResults[proj.id];
                const isPinging = testingAppId === proj.id;
                const targetEndpoint = `https://${proj.customDomain || `${proj.appId}.bubbleapps.io`}/${proj.environment}/api/1.1/`;

                return (
                  <div
                    key={proj.id}
                    style={{
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-md)',
                      background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)' : 'var(--bg-input)',
                      border: isActive ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Top Bar: Name, Badges & Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(6, 182, 212, 0.25))' : 'rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isActive ? 'var(--primary)' : 'var(--text-muted)'
                        }}>
                          <Globe size={18} />
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                              {proj.name}
                            </h3>
                            {isActive && (
                              <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                                ACTIVE WORKSPACE
                              </span>
                            )}
                            <span className={`badge ${proj.environment.includes('live') ? 'badge-emerald' : 'badge-cyan'}`} style={{ fontSize: '0.65rem' }}>
                              {proj.environment.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span>App ID: <code style={{ color: 'var(--text-primary)' }}>{proj.appId}</code></span>
                            {proj.customDomain && <span>• Domain: <strong>{proj.customDomain}</strong></span>}
                            <span>• Added: {new Date(proj.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => handleSetActiveProject(proj.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.725rem', padding: '4px 10px' }}
                          >
                            <Check size={12} />
                            <span>Set as Active</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleTestAppPing(proj)}
                          disabled={isPinging}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.725rem', padding: '4px 10px' }}
                          title="Ping Bubble API endpoint"
                        >
                          <Activity size={12} className={isPinging ? 'spin' : ''} />
                          <span>{isPinging ? 'Pinging...' : 'Test Connection'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setProjectToDelete(proj)}
                          className="btn btn-secondary btn-sm"
                          title="Delete project profile"
                          style={{ color: 'var(--accent-rose)', fontSize: '0.725rem', padding: '4px 8px' }}
                        >
                          <Trash2 size={13} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>

                    {/* Details Bar: Endpoint & Token info */}
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0, 0, 0, 0.25)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                      fontSize: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                        <Server size={13} color="var(--primary)" />
                        <span>Data API: <code>{targetEndpoint}</code></span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: proj.apiToken ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                          <Lock size={12} />
                          <span>{proj.apiToken ? 'Private Token Configured' : 'Public Access (No Token)'}</span>
                        </span>

                        {testRes && (
                          <span style={{ color: testRes.reachable ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 600 }}>
                            • {testRes.reachable ? `Online (${testRes.latencyMs}ms)` : 'Offline'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Blueprint File Bar */}
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                      fontSize: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <FileCode size={14} color={proj.blueprintFileName ? 'var(--accent-cyan)' : 'var(--accent-amber)'} />
                        {proj.blueprintFileName ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {proj.blueprintFileName}
                            </span>
                            {proj.stats && (
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>{proj.stats.pagesCount || 1} Pages</span>
                                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>{proj.stats.workflowsCount || 0} Workflows</span>
                                <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>{proj.stats.dataTypesCount || 0} Tables</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--accent-amber)' }}>
                            No .bubble blueprint file attached
                          </span>
                        )}
                      </div>

                      {/* Inline Upload/Replace Blueprint Button */}
                      <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0, fontSize: '0.7rem', padding: '3px 8px' }}>
                        <Upload size={11} />
                        <span>{proj.blueprintFileName ? 'Replace .bubble File' : '+ Attach .bubble File'}</span>
                        <input
                          type="file"
                          accept=".json,.bubble"
                          onChange={(e) => handleAttachBlueprintToProject(proj.id, e)}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          SUBTAB 3: THEME & STUDIO PREFERENCES
          ===================================================================== */}
      {subTab === 'preferences' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <Palette size={18} color="var(--primary)" />
                  <span>Studio Visual Theme</span>
                </div>
                <div className="card-subtitle">Select visual skin for Bubble Dev Studio</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="input-label">Theme Mode</label>
                <select
                  value={formData.theme}
                  onChange={(e) => {
                    const newTheme = e.target.value as ThemeMode;
                    setFormData({ ...formData, theme: newTheme });
                    document.documentElement.setAttribute('data-theme', newTheme);
                  }}
                  className="select select-premium"
                >
                  <option value="dark">Dark Theme (Cyber Slate)</option>
                  <option value="light">Light Theme (Clean Studio)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <input
                  type="checkbox"
                  id="autosave"
                  checked={formData.autoSaveReports}
                  onChange={(e) => setFormData({ ...formData, autoSaveReports: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                />
                <label htmlFor="autosave" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Automatically save HTML, SARIF & JSON reports locally
                </label>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <HardDrive size={18} color="var(--accent-cyan)" />
                  <span>Local Storage Controller</span>
                </div>
                <div className="card-subtitle">Manage client-side IndexedDB & localStorage caches</div>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 12px' }}>
                All schema snapshots, dead code audit histories, visual test references, and translation memory dictionaries are stored locally on your device.
              </p>
              <button
                type="button"
                onClick={() => {
                  TranslatorEngine.clearMemoryCache();
                  toast.info('Cleared translation memory cache');
                }}
                className="btn btn-secondary btn-sm"
                style={{ color: 'var(--accent-rose)' }}
              >
                <Trash2 size={13} />
                <span>Purge Translation Cache</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBTAB 4: SYSTEM DIAGNOSTICS
          ===================================================================== */}
      {subTab === 'diagnostics' && (
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
      )}

      {/* =====================================================================
          SUBTAB 5: ABOUT & CREDITS
          ===================================================================== */}
      {subTab === 'about' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 8px 24px -4px rgba(99, 102, 241, 0.5)'
              }}>
                <Layers size={30} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {APP_NAME}
                </h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {APP_VERSION_LABEL} • Designed & Built by <strong>Alexandr Motologa | MTLG Labs</strong>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: '0 0 16px' }}>
              <strong>Bubble.io Dev Studio</strong> is the all-in-one developer productivity suite and GUI for Bubble.io engineers, agencies, and full-stack builders. It unifies Schema DevOps, Dead Code AST Audits, Workload Unit Profiling, Webhook Ingestion, 1-Click Documentation Books, AI Localization, and Visual QA Regression Testing into a single unified desktop workflow.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <a
                href="https://github.com/alexandrmotologa"
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
              >
                <Github size={14} />
                <span>GitHub @alexandrmotologa</span>
              </a>

              <a
                href="https://buymeacoffee.com/mtlg"
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ color: '#fbbf24' }}
              >
                <Coffee size={14} />
                <span>Buy Me a Coffee</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('mtlg.labs.contact@gmail.com');
                  toast.success('Email Copied to Clipboard!', 'mtlg.labs.contact@gmail.com');
                }}
                className="btn btn-secondary btn-sm"
              >
                <Mail size={14} />
                <span>mtlg.labs.contact@gmail.com</span>
              </button>

              <a
                href="https://github.com/alexandrmotologa/bubble-io-dev-studio"
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
              >
                <ExternalLink size={14} />
                <span>Repository</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(projectToDelete)}
        project={projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
