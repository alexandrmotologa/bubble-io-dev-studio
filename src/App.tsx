import React, { useState, useEffect } from 'react';
import { GlobalSettings, LogEntry, NavigationTab, ProjectProfile, ThemeMode } from './types';
import { ProjectStore } from './core/storage/projectStore';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TerminalDrawer } from './components/TerminalDrawer';
import { ConnectAppModal } from './components/ConnectAppModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { CommandPalette } from './components/CommandPalette';
import { StatusBar } from './components/StatusBar';
import { DashboardView } from './views/DashboardView';
import { DevOpsView } from './views/DevOpsView';
import { SecurityView } from './views/SecurityView';
import { WuProfilerView } from './views/WuProfilerView';
import { AuditView } from './views/AuditView';
import { ApiStudioView } from './views/ApiStudioView';
import { TranslatorView } from './views/TranslatorView';
import { VisualTesterView } from './views/VisualTesterView';
import { SettingsView } from './views/SettingsView';
import { DocGenView } from './views/DocGenView';
import { AiCopilotModal } from './components/AiCopilotModal';
import { ToastContainer } from './components/ToastContainer';
import { UpdatePromptModal } from './components/UpdatePromptModal';
import { toast } from './core/toast/toastManager';
import { DevOpsEngine } from './core/devops/devopsEngine';
import { AuditEngine } from './core/audit/auditEngine';
import { getProviderDisplayName, getModelDisplayName, getProviderForModel, getDefaultModelForProvider } from './core/ai/aiProviders';
import { DevOpsSubTab } from './views/DevOpsView';
import { APP_VERSION } from './version';

export const App: React.FC = () => {
  const store = ProjectStore.getInstance();
  const [settings, setSettings] = useState<GlobalSettings>(store.getSettings());
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [devOpsSubTab, setDevOpsSubTab] = useState<DevOpsSubTab | undefined>(undefined);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectProfile | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [healthGrade, setHealthGrade] = useState<string | null>(null);
  const [hasUpdateAvailable, setHasUpdateAvailable] = useState(false);

  // Persistent Update Prompt State
  const [pendingUpdate, setPendingUpdate] = useState<{
    version: string;
    releaseNotes?: string;
  } | null>(null);
  const [isUpdateDismissed, setIsUpdateDismissed] = useState(false);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // Global Keyboard Shortcuts (Ctrl+K, Ctrl+I, Ctrl+B, Ctrl+`)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K / Cmd+K -> Toggle Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      // Ctrl+I / Cmd+I -> Toggle AI Copilot
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setIsCopilotOpen(prev => !prev);
      }
      // Ctrl+B -> Run Backup
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b' && !e.shiftKey) {
        e.preventDefault();
        handleQuickBackup();
      }
      // Ctrl+` or Ctrl+J -> Toggle Terminal
      else if ((e.ctrlKey || e.metaKey) && (e.key === '`' || e.key.toLowerCase() === 'j')) {
        e.preventDefault();
        setIsTerminalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings, isBackingUp]);

  // Subscribe to store updates and hydrate blueprints from IndexedDB
  useEffect(() => {
    const unsubscribe = store.subscribe((updated) => {
      setSettings({ ...updated });
    });

    store.hydrateAsync().then((hydrated) => {
      setSettings({ ...hydrated });
      if (hydrated.projects.length > 0) {
        const active = hydrated.projects.find(p => p.id === hydrated.activeProjectId) || hydrated.projects[0];
        addLog('system', `Loaded ${hydrated.projects.length} workspace(s) from persistent storage. Active: ${active?.name || 'None'}.`, 'success');
      }
    });

    return unsubscribe;
  }, []);

  // Listen to Electron native menu IPC events (New Project, Toast notifications, Updater)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      const unsubNew = (window as any).electronAPI.receiveFromMain('menu:new-project', () => {
        setIsConnectModalOpen(true);
      });
      const unsubToast = (window as any).electronAPI.receiveFromMain('toast:show', (payload: any) => {
        if (payload?.type === 'success') {
          toast.success(payload.title, payload.message);
        } else if (payload?.type === 'warn') {
          toast.warn(payload.title, payload.message);
        } else if (payload?.type === 'error') {
          toast.error(payload.title, payload.message);
        } else {
          toast.info(payload?.title || 'Notice', payload?.message || '');
        }
      });
      const unsubUpdater = (window as any).electronAPI.receiveFromMain('updater:status', (payload: any) => {
        if (payload?.status === 'available' || payload?.status === 'downloaded') {
          setHasUpdateAvailable(true);
        }
        if (payload?.status === 'downloaded') {
          setPendingUpdate({
            version: payload.version || '',
            releaseNotes: payload.releaseNotes || ''
          });
          setIsUpdateDismissed(false);
        }
      });
      return () => {
        unsubNew && unsubNew();
        unsubToast && unsubToast();
        unsubUpdater && unsubUpdater();
      };
    }
  }, []);

  // Automatically check for updates on startup
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.checkForUpdates) {
      (window as any).electronAPI.checkForUpdates().catch((err: any) => {
        console.log('[App] Startup auto-check for updates completed:', err?.message || err);
      });
    }
  }, []);

  const handleRestartNow = () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.installUpdate) {
      (window as any).electronAPI.installUpdate();
    } else if (typeof window !== 'undefined' && (window as any).electronAPI?.sendToMain) {
      (window as any).electronAPI.sendToMain('updater:install');
    }
  };

  const handleRestartLater = () => {
    setIsUpdateDismissed(true);
    toast.info(
      'Update Deferred',
      'The update is ready and will install automatically when you close the application.'
    );
  };

  // Initial welcome log & check if first run onboarding is needed
  useEffect(() => {
    addLog('system', `Bubble.io Dev Studio v${APP_VERSION} initialized.`, 'success');
    if (settings.projects.length === 0) {
      addLog('system', 'No Bubble application connected yet. Opening connection setup...', 'warn');
      setIsConnectModalOpen(true);
    }
  }, []);

  const addLog = (
    module: LogEntry['module'],
    message: string,
    level: 'info' | 'success' | 'warn' | 'error' = 'info'
  ) => {
    const newEntry: LogEntry = {
      id: `log_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
      level,
      module,
      message
    };
    setLogs(prev => [newEntry, ...prev.slice(0, 199)]);
  };

  const activeProject = settings.projects.find(p => p.id === settings.activeProjectId) || settings.projects[0];

  const errorCount = logs.filter(l => l.level === 'error').length;
  const warnCount = logs.filter(l => l.level === 'warn').length;

  const handleToggleTheme = () => {
    const nextTheme: ThemeMode = settings.theme === 'dark' ? 'light' : 'dark';
    const updated = { ...settings, theme: nextTheme };
    setSettings(updated);
    store.save(updated);
    addLog('system', `Switched theme to ${nextTheme.toUpperCase()} mode.`);
  };

  const handleSelectProject = (id: string) => {
    store.setActiveProject(id);
    const updated = store.getSettings();
    setSettings(updated);
    const proj = updated.projects.find(p => p.id === id);
    addLog('system', `Switched active Bubble workspace to: ${proj?.name}`);
  };

  const handleConnectProject = (
    projectData: Omit<ProjectProfile, 'id' | 'createdAt'>,
    aiConfig?: {
      provider: string;
      model: string;
      apiKey?: string;
      ollamaUrl?: string;
    }
  ) => {
    const newProject = store.addProject(projectData);
    let updated = store.getSettings();

    if (aiConfig) {
      if (aiConfig.model) {
        updated.defaultAiModel = aiConfig.model;
      }
      if (aiConfig.apiKey) {
        if (aiConfig.provider === 'gemini') updated.geminiApiKey = aiConfig.apiKey;
        else if (aiConfig.provider === 'openai') updated.openaiApiKey = aiConfig.apiKey;
        else if (aiConfig.provider === 'anthropic') updated.anthropicApiKey = aiConfig.apiKey;
        else if (aiConfig.provider === 'groq') updated.groqApiKey = aiConfig.apiKey;
        else if (aiConfig.provider === 'xai') updated.xaiApiKey = aiConfig.apiKey;
        else if (aiConfig.provider === 'opencode') updated.opencodeApiKey = aiConfig.apiKey;
        else if (aiConfig.provider === 'openrouter') updated.openrouterApiKey = aiConfig.apiKey;
      }
      if (aiConfig.ollamaUrl && aiConfig.provider === 'ollama') {
        updated.ollamaUrl = aiConfig.ollamaUrl;
      }
      store.save(updated);
    }

    setSettings(updated);
    addLog('system', `Successfully connected Bubble application: ${newProject.name} (${newProject.appId})`, 'success');
  };

  const handleConfirmDeleteProject = (id: string) => {
    const proj = settings.projects.find(p => p.id === id);
    store.deleteProject(id);
    const updated = store.getSettings();
    setSettings(updated);
    addLog('system', `Removed Bubble application profile: ${proj?.name || id}`, 'warn');
  };

  const handleSaveSettings = (newSettings: GlobalSettings) => {
    store.save(newSettings);
    setSettings(newSettings);
  };

  const handleQuickBackup = async () => {
    if (!activeProject || isBackingUp) return;
    setIsBackingUp(true);
    setIsTerminalOpen(true);
    addLog('devops', `[Quick Backup] Triggering backup for ${activeProject.appId}...`);

    const toastId = toast.loading('Exporting Database Backup...', `Connecting to ${activeProject.appId} (${activeProject.environment})...`);

    try {
      const result = await DevOpsEngine.runBackup(activeProject, undefined, (msg: string) => {
        addLog('devops', msg);
        toast.update(toastId, { message: msg });
      });
      addLog('devops', `[Quick Backup] Backup completed successfully (${result.backupId} • ${result.recordCount.toLocaleString()} records). View and manage in DevOps > Backup & Restore.`, 'success');
      toast.update(toastId, {
        type: 'success',
        title: 'Quick Backup Completed!',
        message: `${result.backupId} • ${result.recordCount.toLocaleString()} records exported (${result.fileSizeKb} KB)`,
        action: {
          label: 'View Backups in DevOps',
          onClick: () => {
            setCurrentTab('devops');
            setDevOpsSubTab('backups');
          }
        },
        duration: 8000
      });
    } catch (e: any) {
      addLog('devops', `[Quick Backup] Error: ${e.message}`, 'error');
      toast.update(toastId, {
        type: 'error',
        title: 'Quick Backup Failed',
        message: e.message
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleQuickAudit = async () => {
    if (isAuditing) return;
    setIsAuditing(true);
    setIsTerminalOpen(true);
    addLog('audit', `[Quick Audit] Running full AST dead code inspection for ${activeProject?.name || 'Bubble app'}...`);

    const toastId = toast.loading('Running AST Dead Code Audit...', `Inspecting workflows, elements & rules for ${activeProject?.name || 'Bubble app'}...`);

    try {
      const report = await AuditEngine.analyzeApp(activeProject?.blueprintExportJson);
      if (activeProject?.name) {
        report.appName = activeProject.name;
      }
      setHealthScore(report.score);
      setHealthGrade(report.grade);
      addLog('audit', `[Quick Audit] Completed: Health Score ${report.score}% (Grade ${report.grade}).`, 'success');
      toast.update(toastId, {
        type: 'success',
        title: `AST Audit Complete (Score ${report.score}% • Grade ${report.grade})`,
        message: `Found ${report.deadElementsCount} dead elements, ${report.deadWorkflowsCount} dead workflows.`,
        action: {
          label: 'Open Full Health Audit',
          onClick: () => {
            setCurrentTab('audit');
          }
        },
        duration: 8000
      });
    } catch (e: any) {
      addLog('audit', `[Quick Audit] Error: ${e.message}`, 'error');
      toast.update(toastId, {
        type: 'error',
        title: 'AST Audit Failed',
        message: e.message
      });
    } finally {
      setIsAuditing(false);
    }
  };

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar Navigation */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          activeProject={activeProject}
          projects={settings.projects}
          onSelectProject={handleSelectProject}
          onOpenConnectModal={() => setIsConnectModalOpen(true)}
          onDeleteProject={(proj) => setProjectToDelete(proj)}
          isOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          hasUpdate={hasUpdateAvailable}
        />

        {/* Main Content Area */}
        <div className="main-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <Header
            currentTab={currentTab}
            activeProject={activeProject}
            theme={settings.theme}
            onToggleTheme={handleToggleTheme}
            isTerminalOpen={isTerminalOpen}
            onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
            logCount={logs.length}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
            onOpenCopilot={() => setIsCopilotOpen(true)}
          />

          {/* View Switcher */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minWidth: 0, width: '100%', maxWidth: '100%' }}>
            {currentTab === 'dashboard' && (
              <DashboardView
                activeProject={activeProject}
                onNavigate={setCurrentTab}
                onOpenConnectModal={() => setIsConnectModalOpen(true)}
                onRunQuickBackup={handleQuickBackup}
                onRunQuickAudit={handleQuickAudit}
                isBackingUp={isBackingUp}
                isAuditing={isAuditing}
                healthScore={healthScore}
                healthGrade={healthGrade}
                onOpenCopilot={() => setIsCopilotOpen(true)}
              />
            )}

            {currentTab === 'devops' && (
              <DevOpsView
                activeProject={activeProject}
                initialSubTab={devOpsSubTab}
                onLog={addLog}
                onOpenConnectModal={() => setIsConnectModalOpen(true)}
              />
            )}

            {currentTab === 'security' && (
              <SecurityView
                activeProject={activeProject}
                onLog={addLog}
              />
            )}

            {currentTab === 'wu-profiler' && (
              <WuProfilerView
                activeProject={activeProject}
                onLog={addLog}
              />
            )}

            {currentTab === 'audit' && (
              <AuditView
                activeProject={activeProject}
                onLog={addLog}
              />
            )}

            {currentTab === 'api-studio' && (
              <ApiStudioView
                activeProject={activeProject}
                onLog={addLog}
              />
            )}

            {currentTab === 'translator' && (
              <TranslatorView
                activeProject={activeProject}
                defaultAiModel={settings.defaultAiModel}
                onLog={addLog}
                geminiApiKey={settings.geminiApiKey}
                openaiApiKey={settings.openaiApiKey}
                anthropicApiKey={settings.anthropicApiKey}
                openrouterApiKey={settings.openrouterApiKey}
                groqApiKey={settings.groqApiKey}
                deepseekApiKey={settings.deepseekApiKey}
                xaiApiKey={settings.xaiApiKey}
                opencodeApiKey={settings.opencodeApiKey}
                ollamaUrl={settings.ollamaUrl}
              />
            )}

            {currentTab === 'visual-tester' && (
              <VisualTesterView
                onLog={addLog}
                activeProject={activeProject}
              />
            )}

            {currentTab === 'doc-gen' && (
              <DocGenView
                activeProject={activeProject}
                settings={settings}
                onLog={addLog}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                settings={settings}
                onSaveSettings={handleSaveSettings}
                onOpenConnectModal={() => setIsConnectModalOpen(true)}
                onLog={addLog}
              />
            )}
          </div>

          {/* Real-time Log Console Drawer */}
          <TerminalDrawer
            isOpen={isTerminalOpen}
            onClose={() => setIsTerminalOpen(false)}
            logs={logs}
            onClearLogs={() => setLogs([])}
          />

          {/* Connect Bubble App Wizard Modal */}
          <ConnectAppModal
            isOpen={isConnectModalOpen}
            onClose={() => setIsConnectModalOpen(false)}
            onConnect={handleConnectProject}
            onLog={addLog}
          />

          {/* Global Confirm Delete Modal */}
          <ConfirmDeleteModal
            isOpen={Boolean(projectToDelete)}
            project={projectToDelete}
            onClose={() => setProjectToDelete(null)}
            onConfirm={handleConfirmDeleteProject}
          />

          {/* Global Command Palette (Ctrl+K) */}
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            activeProject={activeProject}
            projects={settings.projects}
            onSelectProject={handleSelectProject}
            onOpenConnectModal={() => setIsConnectModalOpen(true)}
            onTriggerBackup={handleQuickBackup}
            onTriggerAudit={handleQuickAudit}
            onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
            onOpenCopilot={() => setIsCopilotOpen(true)}
          />

          {/* Bubble AI Copilot Modal (Ctrl+I) */}
          <AiCopilotModal
            isOpen={isCopilotOpen}
            onClose={() => setIsCopilotOpen(false)}
            geminiApiKey={settings.geminiApiKey}
            openaiApiKey={settings.openaiApiKey}
            groqApiKey={settings.groqApiKey}
            xaiApiKey={settings.xaiApiKey}
            onApplyQueryToRepl={(dataType, constraints) => {
              setCurrentTab('devops');
              addLog('copilot', `Applied AI synthesized query filter for '${dataType}'`, 'success');
            }}
          />
        </div>
      </div>

      {/* Bottom IDE Status Bar */}
      {(() => {
        const hasKey = (providerId: string) => {
          if (activeProject?.aiProvider === providerId && activeProject?.aiApiKey && activeProject.aiApiKey.trim().length > 0) return true;
          switch (providerId) {
            case 'gemini': return Boolean(settings.geminiApiKey && settings.geminiApiKey.trim().length > 0);
            case 'openai': return Boolean(settings.openaiApiKey && settings.openaiApiKey.trim().length > 0);
            case 'anthropic': return Boolean(settings.anthropicApiKey && settings.anthropicApiKey.trim().length > 0);
            case 'groq': return Boolean(settings.groqApiKey && settings.groqApiKey.trim().length > 0);
            case 'deepseek': return Boolean(settings.deepseekApiKey && settings.deepseekApiKey.trim().length > 0);
            case 'openrouter': return Boolean(settings.openrouterApiKey && settings.openrouterApiKey.trim().length > 0);
            case 'xai': return Boolean(settings.xaiApiKey && settings.xaiApiKey.trim().length > 0);
            case 'opencode': return Boolean(settings.opencodeApiKey && settings.opencodeApiKey.trim().length > 0);
            case 'ollama': return Boolean(settings.ollamaUrl && settings.ollamaUrl.trim().length > 0);
            default: return false;
          }
        };

        let activeAiProviderName: string | undefined = undefined;
        let activeAiModelName: string | undefined = undefined;

        const effectiveProvider = activeProject?.aiProvider;
        const effectiveModel = activeProject?.aiModel;

        if (effectiveProvider && hasKey(effectiveProvider)) {
          activeAiProviderName = getProviderDisplayName(effectiveProvider);
          activeAiModelName = getModelDisplayName(effectiveModel || getDefaultModelForProvider(effectiveProvider));
        } else if (!effectiveProvider && settings.defaultAiModel) {
          const defaultProv = getProviderForModel(settings.defaultAiModel);
          if (hasKey(defaultProv)) {
            activeAiProviderName = getProviderDisplayName(defaultProv);
            activeAiModelName = getModelDisplayName(settings.defaultAiModel);
          }
        }

        return (
          <StatusBar
            activeProject={activeProject}
            currentTab={currentTab}
            isTerminalOpen={isTerminalOpen}
            onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenCopilot={() => setIsCopilotOpen(true)}
            healthScore={healthScore ?? undefined}
            healthGrade={healthGrade ?? undefined}
            aiProvider={activeAiProviderName}
            aiModel={activeAiModelName}
            errorCount={errorCount}
            warnCount={warnCount}
          />
        );
      })()}

      {/* Global Interactive Toast Notification Container */}
      <ToastContainer />

      {/* Persistent In-App Update Prompt Modal */}
      {pendingUpdate && !isUpdateDismissed && (
        <UpdatePromptModal
          version={pendingUpdate.version}
          releaseNotes={pendingUpdate.releaseNotes}
          onRestartNow={handleRestartNow}
          onRestartLater={handleRestartLater}
        />
      )}
    </div>
  );
};
