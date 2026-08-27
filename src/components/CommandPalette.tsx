import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Layers,
  ShieldAlert,
  Languages,
  Eye,
  Settings,
  Database,
  Terminal,
  Play,
  RotateCw,
  Download,
  Plus,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Zap,
  Globe,
  X
} from 'lucide-react';
import { ProjectProfile, NavigationTab } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  activeProject: ProjectProfile | null;
  projects: ProjectProfile[];
  onSelectProject: (id: string) => void;
  onOpenConnectModal: () => void;
  onTriggerBackup: () => void;
  onTriggerAudit: () => void;
  onToggleTerminal: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Navigation' | 'Actions' | 'Projects' | 'Tools';
  icon: React.ReactNode;
  action: () => void;
  badge?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  currentTab,
  onTabChange,
  activeProject,
  projects,
  onSelectProject,
  onOpenConnectModal,
  onTriggerBackup,
  onTriggerAudit,
  onToggleTerminal
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global keydown listeners for Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // Controlled by parent or toggle
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      subtitle: 'Overview, health score, quick actions',
      category: 'Navigation',
      icon: <Layers size={16} color="var(--primary)" />,
      action: () => { onTabChange('dashboard'); onClose(); },
      badge: currentTab === 'dashboard' ? 'Active' : undefined
    },
    {
      id: 'nav-devops',
      title: 'Go to DevOps & CLI Engine',
      subtitle: 'Schema, ERD, REPL, migrations, backups & generators',
      category: 'Navigation',
      icon: <Database size={16} color="var(--accent-cyan)" />,
      action: () => { onTabChange('devops'); onClose(); },
      badge: currentTab === 'devops' ? 'Active' : undefined
    },
    {
      id: 'nav-audit',
      title: 'Go to AST Dead Code Detector',
      subtitle: 'Dependency DAG, orphan elements, security rules',
      category: 'Navigation',
      icon: <ShieldAlert size={16} color="var(--accent-rose)" />,
      action: () => { onTabChange('audit'); onClose(); },
      badge: currentTab === 'audit' ? 'Active' : undefined
    },
    {
      id: 'nav-translator',
      title: 'Go to AI Localization Studio',
      subtitle: '77+ languages, multi-batch translation, matrix view',
      category: 'Navigation',
      icon: <Languages size={16} color="var(--accent-emerald)" />,
      action: () => { onTabChange('translator'); onClose(); },
      badge: currentTab === 'translator' ? 'Active' : undefined
    },
    {
      id: 'nav-visual-qa',
      title: 'Go to Visual QA & Regression Tester',
      subtitle: 'Multi-viewport captures, pixel diff, test suites',
      category: 'Navigation',
      icon: <Eye size={16} color="var(--accent-amber)" />,
      action: () => { onTabChange('visual-tester'); onClose(); },
      badge: currentTab === 'visual-tester' ? 'Active' : undefined
    },
    {
      id: 'nav-settings',
      title: 'Go to Settings & AI Providers',
      subtitle: 'Configure LLM keys, application profiles & preferences',
      category: 'Navigation',
      icon: <Settings size={16} color="var(--text-secondary)" />,
      action: () => { onTabChange('settings'); onClose(); },
      badge: currentTab === 'settings' ? 'Active' : undefined
    },

    // Quick Actions
    {
      id: 'act-connect-wizard',
      title: 'Connect Bubble Application (Wizard)',
      subtitle: 'Launch 5-step connection wizard with blueprint upload',
      category: 'Actions',
      icon: <Plus size={16} color="var(--accent-cyan)" />,
      action: () => { onOpenConnectModal(); onClose(); }
    },
    {
      id: 'act-run-backup',
      title: 'Run Quick Database Backup',
      subtitle: `Export relational data from ${activeProject?.name || 'active app'}`,
      category: 'Actions',
      icon: <Download size={16} color="var(--accent-emerald)" />,
      action: () => { onTriggerBackup(); onClose(); }
    },
    {
      id: 'act-run-audit',
      title: 'Run AST Health & Dead Code Audit',
      subtitle: 'Inspect application elements and calculate health grade',
      category: 'Actions',
      icon: <Zap size={16} color="var(--accent-amber)" />,
      action: () => { onTriggerAudit(); onClose(); }
    },
    {
      id: 'act-toggle-terminal',
      title: 'Toggle Developer Terminal Drawer',
      subtitle: 'View live logs, CLI outputs, and execution errors',
      category: 'Tools',
      icon: <Terminal size={16} color="var(--text-secondary)" />,
      action: () => { onToggleTerminal(); onClose(); }
    },

    // Switch Projects
    ...projects.map(proj => ({
      id: `proj-${proj.id}`,
      title: `Switch Workspace: ${proj.name}`,
      subtitle: `App ID: ${proj.appId} • ${proj.environment}`,
      category: 'Projects' as const,
      icon: <Globe size={16} color={proj.id === activeProject?.id ? 'var(--accent-emerald)' : 'var(--text-muted)'} />,
      action: () => { onSelectProject(proj.id); onClose(); },
      badge: proj.id === activeProject?.id ? 'Current' : undefined
    }))
  ];

  const filtered = commands.filter(c => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
      c.category.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-active)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(99, 102, 241, 0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'modalSlideIn 0.18s ease-out'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <Search size={18} color="var(--primary)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, tool, or search workspace..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              fontWeight: 500,
              outline: 'none'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.65rem', background: 'var(--bg-input)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              ESC to close
            </span>
          </div>
        </div>

        {/* Command List */}
        <div style={{
          maxHeight: '380px',
          overflowY: 'auto',
          padding: '8px'
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No commands found matching "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    border: isSelected ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'var(--bg-input)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease'
                    }}>
                      {item.icon}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: isSelected ? '#ffffff' : 'var(--text-primary)' }}>
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div style={{ fontSize: '0.725rem', color: isSelected ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.badge && (
                      <span style={{
                        fontSize: '0.675rem',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: 600,
                        background: item.badge === 'Current' || item.badge === 'Active' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-input)',
                        color: item.badge === 'Current' || item.badge === 'Active' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        {item.badge}
                      </span>
                    )}
                    <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {item.category}
                    </span>
                    <ChevronRight size={14} color={isSelected ? 'var(--primary)' : 'transparent'} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(0, 0, 0, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.7rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span><kbd style={{ background: 'var(--bg-input)', padding: '2px 4px', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>↑↓</kbd> Navigate</span>
            <span><kbd style={{ background: 'var(--bg-input)', padding: '2px 4px', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>Enter</kbd> Select</span>
            <span><kbd style={{ background: 'var(--bg-input)', padding: '2px 4px', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>Esc</kbd> Dismiss</span>
          </div>
          <div>
            <span>Bubble.io Dev Studio</span>
          </div>
        </div>
      </div>
    </div>
  );
};
