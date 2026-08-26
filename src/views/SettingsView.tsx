import React, { useState } from 'react';
import { 
  Settings, 
  Key, 
  Save, 
  Check, 
  Moon, 
  Sun, 
  Layers, 
  Plus, 
  Trash2, 
  Sparkles,
  ShieldCheck,
  FlaskConical,
  ExternalLink,
  Edit2,
  Lock,
  Globe
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
  const [newProjApiToken, setNewProjApiToken] = useState('');
  const [newProjEnv, setNewProjEnv] = useState<'development' | 'staging' | 'live'>('development');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [editingTokenId, setEditingTokenId] = useState<string | null>(null);

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
    const cleanAppId = newProjAppId.trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\.bubbleapps\.io.*$/, '')
      .replace(/[\/\s]+/g, '-');

    if (!newProjName.trim() || !cleanAppId) return;
    const newProj: ProjectProfile = {
      id: `proj_${Date.now()}`,
      name: newProjName.trim(),
      appId: cleanAppId,
      environment: newProjEnv,
      apiToken: newProjApiToken.trim() || undefined,
      isDemo: false,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };

    const updatedProjects = [...formData.projects, newProj];
    const updated = { ...formData, projects: updatedProjects, activeProjectId: newProj.id };
    setFormData(updated);
    onSaveSettings(updated);
    setNewProjName('');
    setNewProjAppId('');
    setNewProjApiToken('');
    onLog('system', `Connected new Bubble workspace: '${newProj.name}' (${newProj.appId})`, 'success');
  };

  const handleUpdateProjectToken = (id: string, token: string) => {
    const updatedProjects = formData.projects.map(p => {
      if (p.id === id) {
        return { ...p, apiToken: token.trim() || undefined };
      }
      return p;
    });
    const updated = { ...formData, projects: updatedProjects };
    setFormData(updated);
    onSaveSettings(updated);
    onLog('system', `Updated Bubble Data API Token for workspace.`, 'info');
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
    onLog('system', 'Removed Bubble workspace profile.', 'info');
  };

  return (
    <div className="view-container">
      {/* Studio Preferences & Global Configuration */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Settings size={20} color="var(--primary)" />
              <span>Studio Preferences & Global Configuration</span>
            </div>
            <div className="card-subtitle">Manage AI engine providers, theme preferences, and connected Bubble workspaces</div>
          </div>
          <button onClick={handleSave} className="btn btn-primary">
            {savedSuccess ? <Check size={16} color="var(--accent-emerald)" /> : <Save size={16} />}
            <span>{savedSuccess ? 'Saved!' : 'Save Changes'}</span>
          </button>
        </div>

        {/* Master-Detail AI Model Catalog Configurator */}
        <AiProvidersConfigurator
          settings={formData}
          onChange={handleAiConfigChange}
        />
      </div>

      <div className="grid-2">
        {/* App Theme and Local Persistence */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Sparkles size={18} color="var(--accent-amber)" />
              <span>General Settings</span>
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="input-label">Theme Mode</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['dark', 'light'] as ThemeMode[]).map(theme => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => setFormData({ ...formData, theme })}
                    className={`btn ${formData.theme === theme ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, textTransform: 'capitalize' }}
                  >
                    {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                    <span>{theme} Mode</span>
                  </button>
                ))}
              </div>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {formData.projects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No applications connected. Use the form below to add your first app.
              </div>
            ) : (
              formData.projects.map(proj => {
                const isEditingThis = editingTokenId === proj.id;

                return (
                  <div
                    key={proj.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {/* Left: Avatar + App Identity */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)',
                          border: '1px solid rgba(99, 102, 241, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary)',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          flexShrink: 0
                        }}>
                          {proj.name.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{proj.name}</strong>
                            <span 
                              className={`badge ${proj.environment === 'live' ? 'badge-emerald' : proj.environment === 'staging' ? 'badge-amber' : 'badge-cyan'}`} 
                              style={{ fontSize: '0.625rem', padding: '1px 6px' }}
                            >
                              {proj.environment.toUpperCase()}
                            </span>
                            {proj.apiToken ? (
                              <span className="badge badge-emerald" style={{ fontSize: '0.625rem', padding: '1px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <ShieldCheck size={11} /> API Token Set
                              </span>
                            ) : (
                              <span className="badge badge-amber" style={{ fontSize: '0.625rem', padding: '1px 6px' }}>
                                No API Token
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span>App ID: <code style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{proj.appId}</code></span>
                            <span>•</span>
                            <span>URL: <code style={{ color: 'var(--accent-cyan)' }}>{proj.customDomain || `${proj.appId}.bubbleapps.io`}</code></span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => setEditingTokenId(isEditingThis ? null : proj.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.725rem', padding: '4px 10px' }}
                          title="Configure Bubble Data API Token"
                        >
                          <Key size={12} color="var(--primary)" />
                          <span>{isEditingThis ? 'Close' : proj.apiToken ? 'Edit Token' : 'Add Token'}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteProject(proj.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          title="Remove project profile"
                        >
                          <Trash2 size={13} color="var(--accent-rose)" />
                        </button>
                      </div>
                    </div>

                    {/* Smooth Token Editor Expander */}
                    {isEditingThis && (
                      <div style={{
                        padding: '10px 12px',
                        background: 'var(--bg-surface-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-active)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '2px'
                      }}>
                        <Key size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                        <input
                          type="password"
                          placeholder="Paste Bubble Data API Token (from Bubble Settings > API)..."
                          defaultValue={proj.apiToken || ''}
                          onBlur={(e) => handleUpdateProjectToken(proj.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateProjectToken(proj.id, (e.target as HTMLInputElement).value);
                              setEditingTokenId(null);
                            }
                          }}
                          className="input"
                          style={{ height: '32px', fontSize: '0.8rem', flex: 1 }}
                          autoFocus
                        />
                        <button
                          onClick={(e) => {
                            const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                            if (input) handleUpdateProjectToken(proj.id, input.value);
                            setEditingTokenId(null);
                          }}
                          className="btn btn-primary btn-sm"
                          style={{ height: '32px', fontSize: '0.75rem', padding: '0 12px' }}
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
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
          gridTemplateColumns: '1.2fr 1.2fr 1.2fr 180px auto',
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
            <label className="input-label">Bubble App ID / Subdomain</label>
            <input
              type="text"
              placeholder="e.g. quiz2coin-search-test"
              value={newProjAppId}
              onChange={(e) => setNewProjAppId(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="input-label">Bubble API Token (Optional)</label>
            <input
              type="password"
              placeholder="e.g. 7f8a9b..."
              value={newProjApiToken}
              onChange={(e) => setNewProjApiToken(e.target.value)}
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
          <button onClick={handleAddProject} className="btn btn-primary btn-sm" style={{ height: '38px', padding: '0 16px' }}>
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
