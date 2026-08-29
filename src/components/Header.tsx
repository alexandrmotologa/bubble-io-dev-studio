import React from 'react';
import { 
  Terminal, 
  Moon, 
  Sun, 
  Globe, 
  ShieldCheck, 
  Sparkles,
  Menu,
  BookOpen
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
  onToggleMobileSidebar?: () => void;
  onOpenCopilot?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  activeProject,
  theme,
  onToggleTheme,
  isTerminalOpen,
  onToggleTerminal,
  logCount,
  onToggleMobileSidebar,
  onOpenCopilot
}) => {
  const getTabDetails = (tab: NavigationTab) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Workspace Overview', desc: 'Unified monitoring, health score, and quick actions' };
      case 'devops':
        return { title: 'DevOps & Database Studio', desc: 'Interactive Data Studio (CRUD), schema migrations, ERD & snapshots' };
      case 'security':
        return { title: 'Security & Privacy Rules Auditor', desc: 'RBAC permissions matrix, vulnerable public endpoints & exposed sensitive fields' };
      case 'wu-profiler':
        return { title: 'Workload Units (WU) & Query Profiler', desc: 'Detect unindexed searches, nested N+1 loops & estimate monthly costs' };
      case 'audit':
        return { title: 'Dead Code & Health Scorer', desc: 'AST dependency graph, orphaned workflows & performance recommendations' };
      case 'api-studio':
        return { title: 'Live Webhook & API Connector Studio', desc: 'Inspect live incoming webhooks, test payload contracts & convert cURL / Plugin SDK' };
      case 'doc-gen':
        return { title: '1-Click Developer Documentation Book', desc: 'Auto-generated Data Dictionary, ERD, Security Matrix & API reference' };
      case 'translator':
        return { title: 'AI Localization Studio', desc: 'Translate Bubble apps with OpenAI, Anthropic, Gemini, Groq & glossaries' };
      case 'visual-tester':
        return { title: 'Visual QA & Regression Suite', desc: 'Multi-viewport pixel diff testing, baseline comparisons & automated reports' };
      case 'settings':
        return { title: 'Settings & Credentials', desc: 'Manage Bubble app credentials, AI provider keys, and studio preferences' };
      default:
        return { title: 'Bubble Studio', desc: 'Professional developer and DevOps environment' };
    }
  };

  const details = getTabDetails(currentTab);

  return (
    <header className="header-container" style={{
      height: 'var(--header-height)',
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      flexShrink: 0,
      backdropFilter: 'blur(12px)',
      gap: '12px'
    }}>
      {/* Mobile Toggle & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px 8px' }}
            title="Toggle Navigation Menu"
          >
            <Menu size={16} />
          </button>
        )}

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {details.title}
            </h2>
            {activeProject && (
              <span className={`badge ${activeProject.environment === 'live' ? 'badge-emerald' : 'badge-amber'}`}>
                <ShieldCheck size={12} />
                {activeProject.environment.toUpperCase()}
              </span>
            )}
          </div>
          <p className="mobile-hide" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {details.desc}
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {activeProject?.customDomain && (
          <div className="mobile-hide" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Globe size={14} />
            <span>{activeProject.customDomain}</span>
          </div>
        )}

        {/* AI Copilot Button */}
        {onOpenCopilot && (
          <button
            onClick={onOpenCopilot}
            className="btn btn-secondary btn-sm"
            title="Open Bubble AI Copilot & Query Assistant (Ctrl + I)"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={14} color="var(--accent-cyan)" />
            <span className="mobile-hide">AI Copilot</span>
            <span style={{ fontSize: '0.65rem', background: 'rgba(255, 255, 255, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>Ctrl+I</span>
          </button>
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
