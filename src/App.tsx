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
import { DevOpsEngine } from './core/devops/devopsEngine';
import { AuditEngine } from './core/audit/auditEngine';
import { getProviderDisplayName, getModelDisplayName, getProviderForModel } from './core/ai/aiProviders';

export const App: React.FC = () => {
  const store = ProjectStore.getInstance();
  const [settings, setSettings] = useState<GlobalSettings>(store.getSettings());
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
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

  // Initial welcome log & check if first run onboarding is needed
  useEffect(() => {
    addLog('system', 'Bubble.io Dev Studio v1.0.0 initialized.', 'success');
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

    try {
      const result = await DevOpsEngine.runBackup(activeProject, undefined, (msg: string) => {
        addLog('devops', msg);
      });
      addLog('devops', `[Quick Backup] Backup completed successfully (${result.recordCount} records).`, 'success');
    } catch (e: any) {
      addLog('devops', `[Quick Backup] Error: ${e.message}`, 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleQuickAudit = async () => {
    if (isAuditing) return;
    setIsAuditing(true);
    setIsTerminalOpen(true);
    addLog('audit', `[Quick Audit] Running full AST dead code inspection for ${activeProject?.name || 'Bubble app'}...`);

    try {
      const report = await AuditEngine.analyzeApp(activeProject?.blueprintExportJson);
      if (activeProject?.name) {
        report.appName = activeProject.name;
      }
      setHealthScore(report.score);
      setHealthGrade(report.grade);
      addLog('audit', `[Quick Audit] Completed: Health Score ${report.score}% (Grade ${report.grade}).`, 'success');
    } catch (e: any) {
      addLog('audit', `[Quick Audit] Error: ${e.message}`, 'error');
    } finally {
      setIsAuditing(false);
    }
  };

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
          />

          {/* View Switcher */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
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
              />
            )}

            {currentTab === 'devops' && (
              <DevOpsView
                activeProject={activeProject}
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
        const activeAiProviderId = activeProject?.aiProvider || (settings.defaultAiModel ? getProviderForModel(settings.defaultAiModel) : 'gemini');
        const activeAiModelId = activeProject?.aiModel || settings.defaultAiModel || 'gemini-2.0-flash';
        const activeAiProviderName = getProviderDisplayName(activeAiProviderId);
        const activeAiModelName = getModelDisplayName(activeAiModelId);

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
    </div>
  );
};
