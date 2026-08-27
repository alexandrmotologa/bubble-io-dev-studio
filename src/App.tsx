import React, { useState, useEffect } from 'react';
import { GlobalSettings, LogEntry, NavigationTab, ProjectProfile, ThemeMode } from './types';
import { ProjectStore } from './core/storage/projectStore';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TerminalDrawer } from './components/TerminalDrawer';
import { ConnectAppModal } from './components/ConnectAppModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { DashboardView } from './views/DashboardView';
import { DevOpsView } from './views/DevOpsView';
import { AuditView } from './views/AuditView';
import { TranslatorView } from './views/TranslatorView';
import { VisualTesterView } from './views/VisualTesterView';
import { SettingsView } from './views/SettingsView';
import { DevOpsEngine } from './core/devops/devopsEngine';
import { AuditEngine } from './core/audit/auditEngine';

export const App: React.FC = () => {
  const store = ProjectStore.getInstance();
  const [settings, setSettings] = useState<GlobalSettings>(store.getSettings());
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
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

  // Initial welcome log & check if first run onboarding is needed
  useEffect(() => {
    addLog('system', 'Bubble.io Dev Studio v1.0.0 initialized.', 'success');
    if (settings.projects.length === 0) {
      addLog('system', 'No Bubble application connected yet. Opening connection setup...', 'warn');
      setIsConnectModalOpen(true);
    } else {
      const active = settings.projects.find(p => p.id === settings.activeProjectId) || settings.projects[0];
      addLog('system', `Loaded ${settings.projects.length} project profiles. Active: ${active?.name || 'None'}.`, 'info');
    }
  }, []);

  const addLog = (
    module: 'system' | 'devops' | 'audit' | 'translator' | 'visual-tester',
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
    addLog('audit', `[Quick Audit] Running full AST dead code inspection...`);

    try {
      const report = await AuditEngine.analyzeApp();
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
    <div className="app-container">
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
      <div className="main-content">
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

        {currentTab === 'audit' && (
          <AuditView
            onLog={addLog}
          />
        )}

        {currentTab === 'translator' && (
          <TranslatorView
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

        {currentTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onOpenConnectModal={() => setIsConnectModalOpen(true)}
            onLog={addLog}
          />
        )}

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
      </div>
    </div>
  );
};
