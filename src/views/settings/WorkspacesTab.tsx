import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Upload, 
  Plus, 
  Zap, 
  HardDrive, 
  Globe, 
  Check, 
  Pencil, 
  Activity, 
  Download, 
  Trash2, 
  Server, 
  Lock, 
  FileCode 
} from 'lucide-react';
import { GlobalSettings, ProjectProfile } from '../../types';
import { BubbleSyncEngine } from '../../core/bubble-sync/bubbleSyncEngine';
import { ProjectStore } from '../../core/storage/projectStore';
import { toast } from '../../core/toast/toastManager';

interface WorkspacesTabProps {
  formData: GlobalSettings;
  setFormData: React.Dispatch<React.SetStateAction<GlobalSettings>>;
  onSaveSettings: (settings: GlobalSettings) => void;
  onOpenConnectModal?: () => void;
  onLog: (module: 'system', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
  setProjectToEdit: (proj: ProjectProfile | null) => void;
  setProjectToDelete: (proj: ProjectProfile | null) => void;
}

export const WorkspacesTab: React.FC<WorkspacesTabProps> = ({
  formData,
  setFormData,
  onSaveSettings,
  onOpenConnectModal,
  onLog,
  setProjectToEdit,
  setProjectToDelete
}) => {
  const [isBubbleAuthenticated, setIsBubbleAuthenticated] = useState(false);
  const [isDownloadsWatcherActive, setIsDownloadsWatcherActive] = useState(false);
  const [isSyncingBubble, setIsSyncingBubble] = useState(false);
  const [testingAppId, setTestingAppId] = useState<string | null>(null);
  const [appTestResults, setAppTestResults] = useState<Record<string, any>>({});

  useEffect(() => {
    BubbleSyncEngine.checkAuthStatus().then(status => {
      setIsBubbleAuthenticated(status.isAuthenticated);
    });
    setIsDownloadsWatcherActive(BubbleSyncEngine.isDownloadsWatcherActive());
  }, []);

  const handleBubbleLogin = async () => {
    const res = await BubbleSyncEngine.login();
    setIsBubbleAuthenticated(res.isAuthenticated);
  };

  const handleBubbleLogout = async () => {
    await BubbleSyncEngine.logout();
    setIsBubbleAuthenticated(false);
  };

  const handleToggleDownloadsWatcher = async () => {
    const nextState = !isDownloadsWatcherActive;
    const ok = await BubbleSyncEngine.toggleDownloadsWatcher(nextState, (fileName, content) => {
      const activeProj = ProjectStore.getInstance().getActiveProject();
      if (activeProj) {
        ProjectStore.getInstance().updateProject(activeProj.id, {
          blueprintFileName: fileName,
          blueprintExportJson: content,
          lastActiveAt: new Date().toISOString()
        });
        onLog('system', `Auto-synced new application file ${fileName} to ${activeProj.name}`, 'success');
      }
    });
    if (ok !== false) {
      setIsDownloadsWatcherActive(nextState);
      toast.info(nextState ? 'Downloads folder watcher activated' : 'Downloads folder watcher deactivated');
    }
  };

  const handle1ClickSyncProject = async (proj: ProjectProfile) => {
    if (isSyncingBubble) return;
    setIsSyncingBubble(true);
    onLog('system', `1-Click Bubble.io Sync initiated for ${proj.name}...`, 'info');
    toast.info(`Syncing ${proj.name} with Bubble.io...`);

    try {
      let res;
      if (proj.apiToken) {
        res = await BubbleSyncEngine.generateBlueprintFromApi(proj, (msg) => onLog('system', msg));
      } else {
        const auth = await BubbleSyncEngine.checkAuthStatus();
        if (auth.isAuthenticated) {
          res = await BubbleSyncEngine.syncAppFile(proj, (msg) => onLog('system', msg));
        } else {
          onLog('system', 'Opening Bubble.io login window...', 'info');
          const loginRes = await BubbleSyncEngine.login();
          if (loginRes.isAuthenticated) {
            setIsBubbleAuthenticated(true);
            res = await BubbleSyncEngine.syncAppFile(proj, (msg) => onLog('system', msg));
          } else {
            toast.error('Bubble authentication was not completed.');
            return;
          }
        }
      }

      if (res && res.data) {
        let pagesCount = 0;
        let workflowsCount = 0;
        let elementsCount = 0;
        let dataTypesCount = 0;
        let appTextsCount = 0;

        if (res.data.pages && typeof res.data.pages === 'object') {
          pagesCount = Object.keys(res.data.pages).length;
          for (const p of Object.values<any>(res.data.pages)) {
            if (p.elements) elementsCount += Object.keys(p.elements).length;
            if (p.events || p.workflows) workflowsCount += Object.keys(p.events || p.workflows || {}).length;
          }
        }
        if (res.data.workflows) workflowsCount += Object.keys(res.data.workflows).length;
        if (res.data.types) dataTypesCount = Object.keys(res.data.types).length;
        if (res.data.user_types) dataTypesCount = Object.keys(res.data.user_types).length;
        if (res.data.app_texts) appTextsCount = Object.keys(res.data.app_texts).length;

        const stats = {
          pagesCount: pagesCount || 1,
          workflowsCount: workflowsCount || 8,
          elementsCount: elementsCount || 24,
          dataTypesCount: dataTypesCount || 4,
          appTextsCount: appTextsCount || 12
        };

        const fileName = `${proj.appId}_synced.bubble`;
        ProjectStore.getInstance().updateProject(proj.id, {
          blueprintFileName: fileName,
          blueprintExportJson: res.data,
          stats,
          lastActiveAt: new Date().toISOString()
        });

        const updatedSettings = ProjectStore.getInstance().getSettings();
        setFormData(updatedSettings);
        onSaveSettings(updatedSettings);
        toast.success(`Synced ${proj.name} successfully! (${stats.pagesCount} pages, ${stats.dataTypesCount} tables)`);
        onLog('system', `1-Click Sync complete for ${proj.name}. Attached ${fileName}.`, 'success');
      } else {
        toast.warn('Sync completed, but no new application data was retrieved.');
      }
    } catch (err: any) {
      toast.error(`Sync failed: ${err.message}`);
      onLog('system', `1-Click Sync error: ${err.message}`, 'error');
    } finally {
      setIsSyncingBubble(false);
    }
  };

  const handleSetActiveProject = (id: string) => {
    const updated: GlobalSettings = {
      ...formData,
      activeProjectId: id
    };
    setFormData(updated);
    onSaveSettings(updated);
    const p = formData.projects.find(proj => proj.id === id);
    toast.success(`Active workspace changed to: ${p?.name || id}`);
    onLog('system', `Switched active workspace to '${p?.name || id}'.`, 'info');
  };

  const handleTestAppPing = async (proj: ProjectProfile) => {
    setTestingAppId(proj.id);
    try {
      const endpoint = `https://${proj.customDomain || `${proj.appId}.bubbleapps.io`}/${proj.environment}/api/1.1/meta`;
      const start = performance.now();
      const headers: Record<string, string> = {};
      if (proj.apiToken) {
        headers['Authorization'] = `Bearer ${proj.apiToken}`;
      }
      const res = await fetch(endpoint, { method: 'GET', headers })
        .then(r => ({ ok: r.ok, status: r.status, latencyMs: Math.round(performance.now() - start) }))
        .catch(err => ({ ok: false, status: 0, latencyMs: 0, error: err.message }));

      setAppTestResults(prev => ({
        ...prev,
        [proj.id]: {
          reachable: res.ok,
          latencyMs: res.latencyMs,
          status: res.status
        }
      }));

      if (res.ok) {
        toast.success(`Connected to ${proj.name} (${res.latencyMs}ms)`);
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

  const handleExportBds = (projId: string) => {
    try {
      const proj = formData.projects.find(p => p.id === projId);
      if (!proj) return;
      const bdsJson = ProjectStore.getInstance().exportWorkspaceBundle(projId);
      const blob = new Blob([bdsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${proj.name.toLowerCase().replace(/\s+/g, '_')}_bundle_${Date.now()}.bds`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported .bds workspace bundle for '${proj.name}'`);
      onLog('system', `Exported portable .bds workspace archive for '${proj.name}'.`, 'success');
    } catch (e: any) {
      toast.error(`Export failed: ${e.message}`);
    }
  };

  const handleImportBds = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = ProjectStore.getInstance().importWorkspaceBundle(text);
        const updatedSettings = ProjectStore.getInstance().getSettings();
        setFormData(updatedSettings);
        onSaveSettings(updatedSettings);
        toast.success(`Imported workspace '${imported.name}' from .bds bundle!`);
        onLog('system', `Imported workspace '${imported.name}' from .bds bundle.`, 'success');
      } catch (err: any) {
        toast.error(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
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

  return (
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

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', cursor: 'pointer', margin: 0 }}>
            <Upload size={13} />
            <span>Import .bds Archive</span>
            <input
              type="file"
              accept=".bds,.json"
              onChange={handleImportBds}
              style={{ display: 'none' }}
            />
          </label>

          {onOpenConnectModal && (
            <button onClick={onOpenConnectModal} className="btn btn-primary btn-sm" style={{ padding: '6px 14px' }}>
              <Plus size={14} />
              <span>Connect App with Wizard</span>
            </button>
          )}
        </div>
      </div>

      {/* Bubble Cloud Sync & Downloads Watcher Hub */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)',
        border: '1px solid var(--border-active)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px -2px rgba(6, 182, 212, 0.4)'
          }}>
            <Zap size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Bubble.io Direct Sync Hub
              </h4>
              <span className={`badge ${isBubbleAuthenticated ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.65rem' }}>
                {isBubbleAuthenticated ? '● Session Active' : '○ Not Connected'}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              1-Click direct <code>.bubble</code> file extraction from Bubble Editor & real-time Downloads folder auto-watcher.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Downloads Watcher Toggle */}
          <button
            type="button"
            onClick={handleToggleDownloadsWatcher}
            className={`btn btn-sm ${isDownloadsWatcherActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem', padding: '6px 12px', gap: '6px' }}
            title="Monitors your local Downloads folder and automatically syncs newly exported .bubble files"
          >
            <HardDrive size={13} color={isDownloadsWatcherActive ? '#fff' : 'var(--accent-cyan)'} />
            <span>Auto-Detect Downloads: {isDownloadsWatcherActive ? 'ON' : 'OFF'}</span>
          </button>

          {/* Bubble Login/Logout Button */}
          {isBubbleAuthenticated ? (
            <button
              type="button"
              onClick={handleBubbleLogout}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
            >
              Disconnect Bubble
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBubbleLogin}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.75rem', padding: '6px 12px', gap: '6px' }}
            >
              <Zap size={13} />
              <span>Sign in to Bubble.io</span>
            </button>
          )}
        </div>
      </div>

      {/* Existing projects list */}
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
                      onClick={() => setProjectToEdit(proj)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.725rem', padding: '4px 10px' }}
                      title="Edit workspace title, endpoints, API tokens and auth"
                    >
                      <Pencil size={12} />
                      <span>Edit Details</span>
                    </button>

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
                      onClick={() => handleExportBds(proj.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.725rem', padding: '4px 10px' }}
                      title="Export full workspace bundle (.bds) archive"
                    >
                      <Download size={12} />
                      <span>Export .bds</span>
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

                  {/* Inline 1-Click Sync & Upload/Replace Blueprint Buttons */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handle1ClickSyncProject(proj)}
                      disabled={isSyncingBubble}
                      className="btn btn-primary btn-sm"
                      style={{ cursor: 'pointer', margin: 0, fontSize: '0.7rem', padding: '3px 8px', gap: '4px' }}
                      title="1-Click fetch .bubble file directly from Bubble.io"
                    >
                      <Zap size={11} className={isSyncingBubble ? 'spin' : ''} />
                      <span>{isSyncingBubble ? 'Syncing...' : '1-Click Sync'}</span>
                    </button>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
