import React, { useState } from 'react';
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
  Zap,
  Server,
  FlaskConical,
  Compass
} from 'lucide-react';
import { GlobalSettings, ProjectProfile, ThemeMode } from '../types';

interface SettingsViewProps {
  settings: GlobalSettings;
  onSaveSettings: (settings: GlobalSettings) => void;
  onLoadDemoProject?: () => void;
  onLog: (module: 'system', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onLoadDemoProject,
  onLog
}) => {
  const [formData, setFormData] = useState<GlobalSettings>(settings);
  const [newProjName, setNewProjName] = useState('');
  const [newProjAppId, setNewProjAppId] = useState('');
  const [newProjEnv, setNewProjEnv] = useState<'development' | 'staging' | 'live'>('development');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
    onLog('system', 'Settings, OpenCode, Groq & Local Llama credentials updated successfully.', 'success');
  };

  const handleAddProject = () => {
    if (!newProjName.trim() || !newProjAppId.trim()) return;
    const newProj: ProjectProfile = {
      id: `proj_${Date.now()}`,
      name: newProjName.trim(),
      appId: newProjAppId.trim().toLowerCase().replace(/\s+/g, '-'),
      environment: newProjEnv,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };
    const updated = {
      ...formData,
      projects: [...formData.projects, newProj],
      activeProjectId: newProj.id
    };
    setFormData(updated);
    onSaveSettings(updated);
    setNewProjName('');
    setNewProjAppId('');
    onLog('system', `Added new Bubble project profile: '${newProj.name}'`, 'info');
  };

  const handleDeleteProject = (id: string) => {
    const updatedProjects = formData.projects.filter(p => p.id !== id);
    const updated = {
      ...formData,
      projects: updatedProjects,
      activeProjectId: formData.activeProjectId === id ? updatedProjects[0]?.id : formData.activeProjectId
    };
    setFormData(updated);
    onSaveSettings(updated);
    onLog('system', 'Project profile removed.', 'info');
  };

  return (
    <div className="view-container">
      {/* Save bar */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Workspace Settings & AI API Keys</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Configure your OpenCode Zen/Go, Groq, Local Llama (Ollama), OpenAI, and Bubble tokens
          </p>
        </div>

        <button onClick={handleSave} className="btn btn-primary">
          {savedSuccess ? <Check size={16} /> : <Save size={16} />}
          <span>{savedSuccess ? 'Changes Saved!' : 'Save All Settings'}</span>
        </button>
      </div>

      <div className="grid-2">
        {/* Left Column: AI Provider Credentials */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Key size={18} color="var(--accent-cyan)" />
                <span>AI Providers (Cloud, OpenCode & Local)</span>
              </div>
              <div className="card-subtitle">Stored securely and locally on your machine</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* OpenCode Zen / Go API Key */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Compass size={14} color="var(--primary)" />
                <label className="input-label" style={{ marginBottom: 0 }}>OpenCode Zen / Go API Key (DeepSeek / Qwen)</label>
              </div>
              <input
                type="password"
                placeholder="opencode-..."
                value={formData.opencodeApiKey || ''}
                onChange={(e) => setFormData({ ...formData, opencodeApiKey: e.target.value })}
                className="input"
              />
            </div>

            {/* Groq Console Key */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Zap size={14} color="var(--accent-amber)" />
                <label className="input-label" style={{ marginBottom: 0 }}>Groq API Key (Llama 3.3 70B - Ultra Fast)</label>
              </div>
              <input
                type="password"
                placeholder="gsk_..."
                value={formData.groqApiKey || ''}
                onChange={(e) => setFormData({ ...formData, groqApiKey: e.target.value })}
                className="input"
              />
            </div>

            {/* Local Llama / Ollama Endpoint */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Server size={14} color="var(--accent-cyan)" />
                <label className="input-label" style={{ marginBottom: 0 }}>Local Llama / Ollama Endpoint (Offline & Free)</label>
              </div>
              <input
                type="text"
                placeholder="http://localhost:11434/v1"
                value={formData.ollamaEndpoint || ''}
                onChange={(e) => setFormData({ ...formData, ollamaEndpoint: e.target.value })}
                className="input"
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Works with Ollama, LM Studio, LocalAI or llama.cpp OpenAI-compatible servers.
              </span>
            </div>

            {/* OpenAI Key */}
            <div>
              <label className="input-label">OpenAI API Key (GPT-4o)</label>
              <input
                type="password"
                placeholder="sk-proj-..."
                value={formData.openaiApiKey || ''}
                onChange={(e) => setFormData({ ...formData, openaiApiKey: e.target.value })}
                className="input"
              />
            </div>

            {/* Anthropic Key */}
            <div>
              <label className="input-label">Anthropic API Key (Claude 3.5 Sonnet)</label>
              <input
                type="password"
                placeholder="sk-ant-..."
                value={formData.anthropicApiKey || ''}
                onChange={(e) => setFormData({ ...formData, anthropicApiKey: e.target.value })}
                className="input"
              />
            </div>

            {/* Gemini Key */}
            <div>
              <label className="input-label">Google Gemini API Key</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={formData.geminiApiKey || ''}
                onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Studio Preferences */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Palette size={18} color="var(--primary)" />
                <span>Studio Preferences</span>
              </div>
              <div className="card-subtitle">Visual themes and automation behaviors</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

            <div>
              <label className="input-label">Default AI Translation Model</label>
              <select
                value={formData.defaultAiModel}
                onChange={(e) => setFormData({ ...formData, defaultAiModel: e.target.value })}
                className="select"
              >
                <option value="deepseek-v3">OpenCode: DeepSeek V3</option>
                <option value="llama-3.3-70b-versatile">Groq: Llama 3.3 70B</option>
                <option value="llama3.2">Local: Llama 3.2 (Ollama)</option>
                <option value="gpt-4o">OpenAI: GPT-4o</option>
                <option value="claude-3-5-sonnet">Anthropic: Claude 3.5</option>
                <option value="gemini-1.5-pro">Google: Gemini 1.5 Pro</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <input
                type="checkbox"
                id="autosave"
                checked={formData.autoSaveReports}
                onChange={(e) => setFormData({ ...formData, autoSaveReports: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
              />
              <label htmlFor="autosave" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                Automatically save HTML & JSON audit/test reports locally
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Bubble App Profiles Section */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Layers size={18} color="var(--accent-emerald)" />
              <span>Bubble.io Application Profiles</span>
            </div>
            <div className="card-subtitle">
              Manage multiple Bubble apps, live/staging domains, and Data API tokens
            </div>
          </div>

          {onLoadDemoProject && (
            <button onClick={onLoadDemoProject} className="btn btn-secondary btn-sm">
              <FlaskConical size={14} />
              <span>Load Sandbox Demo App</span>
            </button>
          )}
        </div>

        {/* Add new project row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 180px 140px',
          gap: '12px',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-input)',
          border: '1px dashed var(--border-active)',
          marginBottom: '16px',
          alignItems: 'flex-end'
        }}>
          <div>
            <label className="input-label">Project Name</label>
            <input
              type="text"
              placeholder="e.g. My SaaS Platform"
              value={newProjName}
              onChange={(e) => setNewProjName(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="input-label">Bubble App ID</label>
            <input
              type="text"
              placeholder="e.g. my-app-prod"
              value={newProjAppId}
              onChange={(e) => setNewProjAppId(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="input-label">Environment</label>
            <select
              value={newProjEnv}
              onChange={(e) => setNewProjEnv(e.target.value as any)}
              className="select"
            >
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="live">Live (Production)</option>
            </select>
          </div>
          <button onClick={handleAddProject} className="btn btn-primary btn-sm" style={{ height: '38px' }}>
            <Plus size={15} />
            <span>Add App</span>
          </button>
        </div>

        {/* Existing projects list */}
        {formData.projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            No Bubble applications configured yet. Use the form above to add your first application.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {formData.projects.map(proj => (
              <div
                key={proj.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)'
                  }}>
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {proj.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      App ID: <code>{proj.appId}</code> • Env: <strong style={{ color: 'var(--accent-emerald)' }}>{proj.environment.toUpperCase()}</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => handleDeleteProject(proj.id)}
                    className="btn btn-secondary btn-sm"
                    title="Delete project profile"
                  >
                    <Trash2 size={13} color="var(--accent-rose)" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
