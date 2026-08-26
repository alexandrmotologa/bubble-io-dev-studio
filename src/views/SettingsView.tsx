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
  FlaskConical,
  Bot
} from 'lucide-react';
import { GlobalSettings, ProjectProfile, ThemeMode } from '../types';
import { AiProvidersConfigurator } from '../components/AiProvidersConfigurator';

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
    onLog('system', 'Settings & AI model configurations saved successfully.', 'success');
  };

  const handleAiConfigChange = (updates: Partial<GlobalSettings>) => {
    setFormData(prev => {
      const updated = { ...prev, ...updates };
      onSaveSettings(updated);
      return updated;
    });
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
      {/* Save Header Bar */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Workspace Settings & AI Engines</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Configure your AI translation providers, select specific LLMs, and manage Bubble app profiles
          </p>
        </div>

        <button onClick={handleSave} className="btn btn-primary">
          {savedSuccess ? <Check size={16} /> : <Save size={16} />}
          <span>{savedSuccess ? 'Changes Saved!' : 'Save All Settings'}</span>
        </button>
      </div>

      {/* AI Provider & Extensive Model Configurator Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Bot size={20} color="var(--primary)" />
              <span>AI Provider & LLM Model Selector</span>
            </div>
            <div className="card-subtitle">
              Select an AI provider on the left, and choose from their full catalog of available LLMs on the right
            </div>
          </div>
        </div>

        <AiProvidersConfigurator
          settings={formData}
          onChange={handleAiConfigChange}
        />
      </div>

      {/* General Studio Preferences & Bubble App Profiles */}
      <div className="grid-2">
        {/* Studio Preferences */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Palette size={18} color="var(--accent-cyan)" />
                <span>Studio Preferences</span>
              </div>
              <div className="card-subtitle">Visual theme and automated reports</div>
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

        {/* Bubble Profiles Summary */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Layers size={18} color="var(--accent-emerald)" />
                <span>Active Bubble Workspaces</span>
              </div>
              <div className="card-subtitle">{formData.projects.length} application profiles configured</div>
            </div>

            {onLoadDemoProject && (
              <button onClick={onLoadDemoProject} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                <FlaskConical size={13} />
                <span>Load Sandbox App</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {formData.projects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No applications connected. Use the form below to add your first app.
              </div>
            ) : (
              formData.projects.map(proj => (
                <div
                  key={proj.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.825rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      flexShrink: 0
                    }}>
                      {proj.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{proj.name}</strong>
                        <span 
                          className={`badge ${proj.environment === 'live' ? 'badge-emerald' : proj.environment === 'staging' ? 'badge-amber' : 'badge-cyan'}`} 
                          style={{ fontSize: '0.625rem', padding: '1px 6px' }}
                        >
                          {proj.environment.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span>App ID: <code style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{proj.appId}</code></span>
                        <span>•</span>
                        <span>URL: <code style={{ color: 'var(--accent-cyan)' }}>{proj.customDomain || `${proj.appId}.bubbleapps.io`}</code></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteProject(proj.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    title="Remove project profile"
                  >
                    <Trash2 size={13} color="var(--accent-rose)" />
                    <span>Delete</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add New Bubble App Section */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Plus size={18} color="var(--primary)" />
              <span>Connect New Bubble.io Application</span>
            </div>
            <div className="card-subtitle">Add another development, staging, or live Bubble workspace</div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 180px 140px',
          gap: '12px',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-input)',
          border: '1px dashed var(--border-active)',
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
              <option value="development">Development (version-test)</option>
              <option value="staging">Staging (Custom Branch / Pre-Live)</option>
              <option value="live">Live (Production Domain)</option>
            </select>
          </div>
          <button onClick={handleAddProject} className="btn btn-primary btn-sm" style={{ height: '38px' }}>
            <Plus size={15} />
            <span>Add App</span>
          </button>
        </div>
        <div style={{ marginTop: '10px', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
          💡 <strong>Environment Guide:</strong> <code>Development</code> connects to Bubble <code>/version-test</code>; <code>Staging</code> is used for custom branches (e.g. <code>/version-staging</code>) or separate QA clone apps; <code>Live</code> connects to your production app.
        </div>
      </div>
    </div>
  );
};
