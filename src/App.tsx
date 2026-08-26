import React, { useState, useEffect } from 'react';
import { GlobalSettings, LogEntry, NavigationTab, ProjectProfile, ThemeMode } from './types';
import { ProjectStore } from './core/storage/projectStore';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TerminalDrawer } from './components/TerminalDrawer';
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
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [healthScore, setHealthScore] = useState(92);
  const [healthGrade, setHealthGrade] = useState('A');

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // Initial welcome log
  useEffect(() => {
    addLog('system', 'Bubble.io Dev Studio v1.0.0 initialized.', 'success');
    addLog('system', `Loaded ${settings.projects.length} project profiles. Active: ${activeProject?.name || 'Default'}.`, 'info');
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
      const result = await DevOpsEngine.runBackup(activeProject, (msg) => {
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
          />
        )}

        {currentTab === 'visual-tester' && (
          <VisualTesterView
            onLog={addLog}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSaveSettings={handleSaveSettings}
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
      </div>
    </div>
  );
};
