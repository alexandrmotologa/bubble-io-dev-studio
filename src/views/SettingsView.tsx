import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Key, 
  Layers, 
  Palette, 
  Cpu, 
  Save, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { GlobalSettings, ProjectProfile, UpdaterStatusData } from '../types';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { EditProjectModal } from '../components/EditProjectModal';
import { toast } from '../core/toast/toastManager';
import { ProjectStore } from '../core/storage/projectStore';
import { APP_VERSION, APP_VERSION_LABEL } from '../version';
import { getProviderForModel } from '../core/ai/aiProviders';

import { ApiKeysTab } from './settings/ApiKeysTab';
import { WorkspacesTab } from './settings/WorkspacesTab';
import { PreferencesTab } from './settings/PreferencesTab';
import { DiagnosticsTab } from './settings/DiagnosticsTab';
import { AboutTab } from './settings/AboutTab';

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
  const [projectToEdit, setProjectToEdit] = useState<ProjectProfile | null>(null);

  // Dynamic AI Provider selection in Settings
  const [selectedProvider, setSelectedProvider] = useState<string>(() => {
    const active = settings.projects.find(p => p.id === settings.activeProjectId);
    if (active?.aiProvider) return active.aiProvider;
    if (settings.defaultAiModel) return getProviderForModel(settings.defaultAiModel);
    return 'ollama';
  });

  // Native In-App Auto-Updater state
  const [updaterStatus, setUpdaterStatus] = useState<UpdaterStatusData>({
    status: 'idle',
    currentVersion: APP_VERSION
  });
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);
  const [appRuntimeInfo, setAppRuntimeInfo] = useState<{ isPackaged: boolean; platform: string }>({
    isPackaged: false,
    platform: 'unknown'
  });

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

  // Listen to autoUpdater events from Electron
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI?.receiveFromMain) {
      const unsub = window.electronAPI.receiveFromMain('updater:status', (data: UpdaterStatusData) => {
        setUpdaterStatus(prev => ({ ...prev, ...data }));
        if (data.status !== 'checking') {
          setIsCheckingUpdate(false);
        }
      });

      if (window.electronAPI.getAppInfo) {
        window.electronAPI.getAppInfo().then(info => {
          if (info) {
            setAppRuntimeInfo({ isPackaged: info.isPackaged, platform: info.platform });
            if (info.currentVersion) {
              setUpdaterStatus(prev => ({ ...prev, currentVersion: info.currentVersion }));
            }
          }
        }).catch(() => {});
      }

      return () => {
        unsub && unsub();
      };
    }
  }, []);

  const handleSave = () => {
    onSaveSettings(formData);
    setSavedSuccess(true);
    toast.success('Workspace settings and credentials saved successfully');
    setTimeout(() => setSavedSuccess(false), 2500);
    onLog('system', 'Settings and API credentials updated successfully.', 'success');
  };

  const handleCheckForUpdates = async () => {
    if (!window.electronAPI?.checkForUpdates) {
      toast.info('In-app auto-update is active in the desktop Electron build.');
      return;
    }
    setIsCheckingUpdate(true);
    setLastCheckTime(new Date().toLocaleTimeString());
    setUpdaterStatus(prev => ({ ...prev, status: 'checking', error: undefined }));
    toast.info('Checking for updates on GitHub Releases...');
    try {
      const res = await window.electronAPI.checkForUpdates();
      if (res?.status === 'dev-mode') {
        setUpdaterStatus(prev => ({
          ...prev,
          status: 'dev-mode',
          message: 'Running in development mode. Updates check GitHub releases when running the packaged build.'
        }));
        setIsCheckingUpdate(false);
        toast.info('Development Mode: Auto-updates query GitHub releases in the packaged/installed desktop build.');
      }
    } catch (e: any) {
      setUpdaterStatus(prev => ({ ...prev, status: 'error', error: e.message || 'Update check failed' }));
      setIsCheckingUpdate(false);
      toast.error('Update check failed: ' + (e.message || 'Network error'));
    }
  };

  const handleDownloadUpdate = async () => {
    if (!window.electronAPI?.downloadUpdate) return;
    setUpdaterStatus(prev => ({ ...prev, status: 'downloading', percent: 0 }));
    try {
      await window.electronAPI.downloadUpdate();
    } catch (e: any) {
      toast.error('Download Failed', e.message);
    }
  };

  const handleInstallUpdate = async () => {
    if (!window.electronAPI?.installUpdate) return;
    await window.electronAPI.installUpdate();
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

  const handleSaveEditedProject = (updatedProject: ProjectProfile) => {
    ProjectStore.getInstance().updateProject(updatedProject.id, updatedProject);
    const updatedSettings = ProjectStore.getInstance().getSettings();
    setFormData(updatedSettings);
    onSaveSettings(updatedSettings);
    onLog('system', `Updated configuration for workspace '${updatedProject.name}'.`, 'success');
    setProjectToEdit(null);
  };

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
          <Sparkles size={13} />
          <span>About & Updates</span>
        </button>
      </div>

      {/* Active Subtab Content */}
      {subTab === 'keys' && (
        <ApiKeysTab
          formData={formData}
          setFormData={setFormData}
          onSaveSettings={onSaveSettings}
          selectedProvider={selectedProvider}
          setSelectedProvider={setSelectedProvider}
        />
      )}

      {subTab === 'workspaces' && (
        <WorkspacesTab
          formData={formData}
          setFormData={setFormData}
          onSaveSettings={onSaveSettings}
          onOpenConnectModal={onOpenConnectModal}
          onLog={onLog}
          setProjectToEdit={setProjectToEdit}
          setProjectToDelete={setProjectToDelete}
        />
      )}

      {subTab === 'preferences' && (
        <PreferencesTab
          formData={formData}
          setFormData={setFormData}
          onSaveSettings={onSaveSettings}
        />
      )}

      {subTab === 'diagnostics' && (
        <DiagnosticsTab
          formData={formData}
          selectedProvider={selectedProvider}
        />
      )}

      {subTab === 'about' && (
        <AboutTab
          updaterStatus={updaterStatus}
          isCheckingUpdate={isCheckingUpdate}
          lastCheckTime={lastCheckTime}
          appRuntimeInfo={appRuntimeInfo}
          handleCheckForUpdates={handleCheckForUpdates}
          handleDownloadUpdate={handleDownloadUpdate}
          handleInstallUpdate={handleInstallUpdate}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(projectToDelete)}
        project={projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Manual Workspace Edit Modal */}
      <EditProjectModal
        isOpen={Boolean(projectToEdit)}
        project={projectToEdit}
        onClose={() => setProjectToEdit(null)}
        onSave={handleSaveEditedProject}
      />
    </div>
  );
};
