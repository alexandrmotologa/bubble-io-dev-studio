import React from 'react';
import { 
  Terminal, 
  Moon, 
  Sun, 
  Globe, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';
import { NavigationTab, ProjectProfile, ThemeMode } from '../types';

interface HeaderProps {
  currentTab: NavigationTab;
  activeProject?: ProjectProfile;
  theme: ThemeMode;
  onToggleTheme: () => void;
  isTerminalOpen: boolean;
  onToggleTerminal: () => void;
  logCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  activeProject,
  theme,
  onToggleTheme,
  isTerminalOpen,
  onToggleTerminal,
  logCount
}) => {
  const getTabDetails = (tab: NavigationTab) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Workspace Overview', desc: 'Unified monitoring, health score, and quick actions' };
      case 'devops':
        return { title: 'DevOps & Database Schema', desc: 'Automated backups, ERD visualizer, schema diffs & TypeScript generator' };
      case 'audit':
        return { title: 'Dead Code & Health Scorer', desc: 'AST dependency graph, orphaned workflows & performance recommendations' };
      case 'translator':
        return { title: 'AI Localization Studio', desc: 'Translate Bubble apps with OpenAI, Anthropic, Gemini & glossaries' };
      case 'visual-tester':
        return { title: 'Visual QA & Regression Suite', desc: 'Multi-viewport pixel diff testing, baseline comparisons & automated reports' };
      case 'settings':
        return { title: 'Settings & Credentials', desc: 'Manage Bubble app credentials, AI provider keys, and studio preferences' };
    }
  };

  const details = getTabDetails(currentTab);

  return (
    <header style={{
      height: 'var(--header-height)',
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      flexShrink: 0,
      backdropFilter: 'blur(12px)'
    }}>
      {/* Title & Context */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {details.title}
          </h2>
          {activeProject && (
            <span className={`badge ${activeProject.environment === 'live' ? 'badge-emerald' : 'badge-amber'}`}>
              <ShieldCheck size={12} />
              {activeProject.environment.toUpperCase()}
            </span>
          )}
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {details.desc}
        </p>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {activeProject?.customDomain && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Globe size={14} />
            <span>{activeProject.customDomain}</span>
          </div>
        )}

        {/* Theme Toggle */}
        <button 
          onClick={onToggleTheme}
          className="btn btn-secondary btn-sm"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Terminal / Logs Toggle */}
        <button 
          onClick={onToggleTerminal}
          className={`btn btn-sm ${isTerminalOpen ? 'btn-primary' : 'btn-secondary'}`}
          title="Toggle Studio Logs Console"
        >
          <Terminal size={15} />
          <span>Console</span>
          {logCount > 0 && (
            <span style={{
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '99px',
              padding: '1px 6px',
              fontSize: '0.7rem'
            }}>
              {logCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
