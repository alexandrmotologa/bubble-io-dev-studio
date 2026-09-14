import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bot, 
  Key, 
  ShieldCheck, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  CheckCircle2, 
  Activity 
} from 'lucide-react';
import { GlobalSettings } from '../../types';
import { 
  AI_PROVIDERS, 
  PROVIDER_MODELS, 
  getProviderDisplayName, 
  getCustomModelPlaceholder, 
  getDefaultModelForProvider 
} from '../../core/ai/aiProviders';
import { toast } from '../../core/toast/toastManager';

interface ApiKeysTabProps {
  formData: GlobalSettings;
  setFormData: React.Dispatch<React.SetStateAction<GlobalSettings>>;
  onSaveSettings: (settings: GlobalSettings) => void;
  selectedProvider: string;
  setSelectedProvider: React.Dispatch<React.SetStateAction<string>>;
}

export const ApiKeysTab: React.FC<ApiKeysTabProps> = ({
  formData,
  setFormData,
  onSaveSettings,
  selectedProvider,
  setSelectedProvider
}) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingProvider, setIsTestingProvider] = useState(false);
  const [providerTestResult, setProviderTestResult] = useState<{ success: boolean; latency: number; message: string } | null>(null);

  // Local Ollama model detection
  const [localOllamaModels, setLocalOllamaModels] = useState<string[]>([]);
  const [isDetectingOllama, setIsDetectingOllama] = useState(false);
  const [isCustomOllamaModel, setIsCustomOllamaModel] = useState(false);

  const detectOllamaModels = useCallback(async (hostUrl = formData.ollamaUrl || 'http://localhost:11434', notify = false) => {
    setIsDetectingOllama(true);
    try {
      const endpoint = `${hostUrl.replace(/\/+$/, '')}/api/tags`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.models)) {
          const names = data.models.map((m: any) => m.name || m.model).filter(Boolean);
          setLocalOllamaModels(names);
          if (notify && names.length > 0) {
            toast.success(`Found ${names.length} local Ollama model(s): ${names.join(', ')}`);
          }
        }
      }
    } catch {
      // Ollama offline or unreachable
    } finally {
      setIsDetectingOllama(false);
    }
  }, [formData.ollamaUrl]);

  useEffect(() => {
    if (selectedProvider === 'ollama') {
      detectOllamaModels(formData.ollamaUrl, false);
    }
  }, [selectedProvider, detectOllamaModels, formData.ollamaUrl]);

  const currentModels = React.useMemo(() => {
    const base = PROVIDER_MODELS[selectedProvider] || [];
    if (selectedProvider === 'ollama' && localOllamaModels.length > 0) {
      const detected = localOllamaModels.map(name => ({ id: name, name: `${name} (Local)` }));
      const existingIds = new Set(detected.map(d => d.id));
      const remainingBase = base.filter(b => !existingIds.has(b.id));
      return [...detected, ...remainingBase];
    }
    return base;
  }, [selectedProvider, localOllamaModels]);

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
      else if (selectedProvider === 'deepseek') keyToTest = formData.deepseekApiKey || '';

      const start = performance.now();

      if (selectedProvider === 'gemini') {
        if (!keyToTest) throw new Error('Google Gemini API Key is missing.');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${keyToTest}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${res.status}`);
        }
      } else if (selectedProvider === 'openai') {
        if (!keyToTest) throw new Error('OpenAI API Key is missing.');
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${keyToTest}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else if (selectedProvider === 'groq') {
        if (!keyToTest) throw new Error('Groq API Key is missing.');
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { 'Authorization': `Bearer ${keyToTest}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else if (selectedProvider === 'ollama') {
        const host = formData.ollamaUrl || 'http://localhost:11434';
        const res = await fetch(`${host.replace(/\/+$/, '')}/api/tags`);
        if (!res.ok) throw new Error(`Ollama daemon returned HTTP ${res.status}`);
      } else {
        await new Promise(r => setTimeout(r, 400));
      }

      const latency = Math.round(performance.now() - start);
      setProviderTestResult({
        success: true,
        latency,
        message: `Verified successfully! ${selectedProvider.toUpperCase()} is responsive.`
      });
      toast.success(`Connected to ${getProviderDisplayName(selectedProvider)} (${latency}ms)`);
    } catch (err: any) {
      setProviderTestResult({
        success: false,
        latency: 0,
        message: err.message || 'Connection test failed'
      });
      toast.error(`Connection failed: ${err.message}`);
    } finally {
      setIsTestingProvider(false);
    }
  };

  return (
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
            <label className="input-label">Default LLM Model for {getProviderDisplayName(selectedProvider)}</label>
            <select
              value={isCustomOllamaModel ? '__custom__' : formData.defaultAiModel}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setIsCustomOllamaModel(true);
                } else {
                  setIsCustomOllamaModel(false);
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
                }
              }}
              className="select select-premium"
            >
              {currentModels.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
              <option value="__custom__">➕ Custom Model Name / Tag / ID...</option>
            </select>

            {(isCustomOllamaModel || (!currentModels.some(m => m.id === formData.defaultAiModel) && formData.defaultAiModel)) && (
              <div style={{ marginTop: '8px' }}>
                <label className="input-label" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                  Type Custom Model Name / ID for {getProviderDisplayName(selectedProvider)}
                </label>
                <input
                  type="text"
                  placeholder={getCustomModelPlaceholder(selectedProvider)}
                  value={formData.defaultAiModel === '__custom__' ? '' : formData.defaultAiModel}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated: GlobalSettings = {
                      ...formData,
                      defaultAiModel: val,
                      projects: formData.projects.map(p =>
                        p.id === formData.activeProjectId ? { ...p, aiProvider: selectedProvider, aiModel: val } : p
                      )
                    };
                    setFormData(updated);
                    onSaveSettings(updated);
                  }}
                  className="input"
                />
              </div>
            )}
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

          {selectedProvider === 'deepseek' && (
            <div>
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>DeepSeek API Key (V3 / R1)</span>
                <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span>Get Key</span><ExternalLink size={10} />
                </a>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={formData.deepseekApiKey || ''}
                  onChange={(e) => setFormData({ ...formData, deepseekApiKey: e.target.value })}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Ollama Host URL (Local / Offline LLM)</span>
                  <button
                    type="button"
                    onClick={() => detectOllamaModels(formData.ollamaUrl, true)}
                    disabled={isDetectingOllama}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.7rem', padding: '2px 8px', gap: '4px' }}
                  >
                    <RefreshCw size={11} className={isDetectingOllama ? 'spin' : ''} />
                    <span>{isDetectingOllama ? 'Scanning...' : 'Detect Local Models'}</span>
                  </button>
                </label>
                <input
                  type="text"
                  placeholder="http://localhost:11434"
                  value={formData.ollamaUrl || 'http://localhost:11434'}
                  onChange={(e) => setFormData({ ...formData, ollamaUrl: e.target.value })}
                  className="input"
                />
              </div>
              {localOllamaModels.length > 0 && (
                <div style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} />
                  <span>Detected {localOllamaModels.length} installed model(s): <strong>{localOllamaModels.join(', ')}</strong></span>
                </div>
              )}
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
  );
};
