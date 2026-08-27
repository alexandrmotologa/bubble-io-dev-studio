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
  AlertCircle
} from 'lucide-react';
import { GlobalSettings, ProjectProfile, ThemeMode } from '../types';
import { DevOpsEngine } from '../core/devops/devopsEngine';
import { TranslatorEngine } from '../core/translator/translatorEngine';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

interface SettingsViewProps {
  settings: GlobalSettings;
  onSaveSettings: (settings: GlobalSettings) => void;
  onOpenConnectModal?: () => void;
  onLog: (module: 'system', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

const PROVIDER_MODELS: Record<string, Array<{ id: string; name: string }>> = {
  gemini: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Recommended & Ultra-Fast)' },
    { id: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro Experimental' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o (Omni Flagship)' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Cost-Efficient)' },
    { id: 'o3-mini', name: 'o3-mini (High-Reasoning)' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' }
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (State-of-the-Art)' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Ultra Fast)' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' }
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Groq LPU)' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Sub-Second)' },
    { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32k Context)' },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT' }
  ],
  xai: [
    { id: 'grok-2-latest', name: 'Grok 2 (xAI State-of-the-Art)' },
    { id: 'grok-2-vision-1212', name: 'Grok 2 Vision' },
    { id: 'grok-beta', name: 'Grok Beta' }
  ],
  opencode: [
    { id: 'opencode-go-pro', name: 'OpenCode Go Pro (Fast Routing)' },
    { id: 'opencode-zen-deepseek-r1', name: 'OpenCode Zen (DeepSeek R1)' },
    { id: 'opencode-zen-claude-3-5', name: 'OpenCode Zen (Claude 3.5 Sonnet)' },
    { id: 'opencode-zen-gpt-4o', name: 'OpenCode Zen (GPT-4o)' }
  ],
  openrouter: [
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (OpenRouter)' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (OpenRouter)' },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Meta Llama 3.3 70B' },
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash (OpenRouter)' }
  ],
  ollama: [
    { id: 'llama3', name: 'Llama 3 (Local Offline)' },
    { id: 'mistral', name: 'Mistral 7B (Local Offline)' },
    { id: 'qwen2.5', name: 'Qwen 2.5 (Local Offline)' },
    { id: 'phi3', name: 'Phi-3 Mini (Local Offline)' }
  ]
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onOpenConnectModal,
  onLog
}) => {
  const [formData, setFormData] = useState<GlobalSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectProfile | null>(null);

  // Dynamic AI Provider selection in Settings
  const [selectedProvider, setSelectedProvider] = useState<string>('gemini');
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

  // Set default provider based on saved default model if available
  useEffect(() => {
    if (formData.defaultAiModel) {
      for (const [prov, models] of Object.entries(PROVIDER_MODELS)) {
        if (models.some(m => m.id === formData.defaultAiModel)) {
          setSelectedProvider(prov);
          break;
        }
      }
    }
  }, []);

  const handleSave = () => {
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
    onLog('system', 'Settings and API credentials updated successfully.', 'success');
  };

  const handleProviderChange = (newProvider: string) => {
    setSelectedProvider(newProvider);
    setProviderTestResult(null);
    const models = PROVIDER_MODELS[newProvider];
    if (models && models.length > 0) {
      setFormData(prev => ({ ...prev, defaultAiModel: models[0].id }));
    }
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
      onLog('system', `AI Provider test (${selectedProvider}): ${res.success ? 'SUCCESS' : 'FAILED'}`, res.success ? 'success' : 'warn');
    } catch (e: any) {
      setProviderTestResult({
        success: false,
        latency: 0,
        message: e.message || 'Connection test failed.'
      });
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
    onLog('system', 'Removed Bubble project profile.', 'warn');
  };

  const handleTestAppPing = async (proj: ProjectProfile) => {
    setTestingAppId(proj.id);
    onLog('system', `Pinging Bubble API endpoints for ${proj.appId}...`);
    try {
      const res = await DevOpsEngine.checkHealth(proj);
      setAppTestResults(prev => ({ ...prev, [proj.id]: res }));
      onLog('system', `Connection to ${proj.appId}: ONLINE (${res.latencyMs}ms)`, 'success');
    } catch (e: any) {
      setAppTestResults(prev => ({
        ...prev,
        [proj.id]: { reachable: false, latencyMs: 0, details: e.message }
      }));
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
        onLog('system', `Attached blueprint file '${file.name}' to project (${stats.pagesCount} pages, ${stats.workflowsCount} workflows, ${stats.dataTypesCount} data types).`, 'success');
      } catch (err: any) {
        onLog('system', `Failed to parse blueprint file: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  };

  const currentModels = PROVIDER_MODELS[selectedProvider] || [];

  return (
    <div className="view-container">
      {/* Top Header & Save bar */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Workspace Settings & Integrations</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
            Configure multi-provider AI credentials, Bubble applications, and studio preferences
          </p>
        </div>

        <button onClick={handleSave} className="btn btn-primary">
          {savedSuccess ? <Check size={16} /> : <Save size={16} />}
          <span>{savedSuccess ? 'Changes Saved!' : 'Save All Settings'}</span>
        </button>
      </div>

      <div className="grid-2">
        {/* Left Column: AI Provider & Dynamic Keys Setup */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Bot size={18} color="var(--accent-cyan)" />
                <span>AI Localization Provider & Model</span>
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
                className="select"
              >
                <option value="gemini">Google Gemini (Gemini 2.0 Flash / Pro)</option>
                <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                <option value="anthropic">Anthropic (Claude 3.5 Sonnet / Haiku)</option>
                <option value="groq">Groq (LPU Ultra-Fast Inference)</option>
                <option value="xai">xAI (Grok 2 / Grok Beta)</option>
                <option value="opencode">OpenCode (Go / Zen Router)</option>
                <option value="openrouter">OpenRouter (Global Multi-LLM)</option>
                <option value="ollama">Ollama (Local / Free Offline)</option>
              </select>
            </div>

            {/* Dynamic Model Dropdown for selected provider */}
            <div>
              <label className="input-label">Default LLM Model for {selectedProvider.toUpperCase()}</label>
              <select
                value={formData.defaultAiModel}
                onChange={(e) => setFormData({ ...formData, defaultAiModel: e.target.value })}
                className="select"
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
                  <span>Anthropic API Key</span>
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
                  <span>xAI API Key (Grok 2)</span>
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
                <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>OpenCode API Key (Go / Zen Router)</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Multi-model routing</span>
                </label>
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

        {/* Right Column: Studio Preferences */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <Palette size={18} color="var(--primary)" />
                  <span>Studio Preferences</span>
                </div>
                <div className="card-subtitle">Visual theme and automation behaviors</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="input-label">Theme Mode</label>
                <select
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value as ThemeMode })}
                  className="select"
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
                  <ShieldCheck size={18} color="var(--accent-emerald)" />
                  <span>Security & Local Storage</span>
                </div>
                <div className="card-subtitle">Client-side encryption and credentials safety</div>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              All Bubble private tokens, database schema locks, translation memory, and AI API keys are persisted strictly in your browser's local sandbox storage (<code>localStorage</code>). No tokens or data are ever transmitted to third-party telemetry servers.
            </div>
          </div>
        </div>
      </div>

      {/* Bubble Application Profiles Section - CLEAN WIZARD ONLY */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Layers size={18} color="var(--accent-emerald)" />
              <span>Bubble.io Application Profiles ({formData.projects.length})</span>
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
                          {isActive ? (
                            <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                              ACTIVE WORKSPACE
                            </span>
                          ) : null}
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

                  {/* Blueprint & AI Integration Status Bar */}
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
                    {/* Blueprint File Info */}
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

                  {/* Wizard 5-Step Verification Pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '4px' }}>
                    <span className="badge badge-emerald" style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={10} /> Step 1: App Reachable
                    </span>
                    <span className={`badge ${proj.apiToken ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={10} /> Step 2: {proj.apiToken ? 'Private Token' : 'Public Mode'}
                    </span>
                    <span className="badge badge-emerald" style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={10} /> Step 3: AI Configured ({formData.defaultAiModel})
                    </span>
                    <span className={`badge ${proj.blueprintFileName ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {proj.blueprintFileName ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                      Step 4: {proj.blueprintFileName ? 'Blueprint Synced' : 'Blueprint Pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
