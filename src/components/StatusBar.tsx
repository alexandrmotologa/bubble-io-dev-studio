import React from 'react';
import {
  Globe,
  Lock,
  Unlock,
  Terminal,
  Activity,
  Bot,
  ShieldCheck,
  Search,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { ProjectProfile } from '../types';

interface StatusBarProps {
  activeProject: ProjectProfile | null;
  currentTab: string;
  isTerminalOpen: boolean;
  onToggleTerminal: () => void;
  onOpenCommandPalette: () => void;
  onOpenCopilot?: () => void;
  healthScore?: number;
  healthGrade?: string;
  aiProvider?: string;
  aiModel?: string;
  errorCount?: number;
  warnCount?: number;
  latencyMs?: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  activeProject,
  currentTab,
  isTerminalOpen,
  onToggleTerminal,
  onOpenCommandPalette,
  onOpenCopilot,
  healthScore,
  healthGrade,
  aiProvider,
  aiModel,
  errorCount = 0,
  warnCount = 0,
  latencyMs
}) => {
  return (
    <footer style={{
      height: '28px',
      backgroundColor: 'var(--bg-surface)',
      borderTop: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 12px',
      fontSize: '0.725rem',
      color: 'var(--text-secondary)',
      userSelect: 'none',
      zIndex: 100
    }}>
      {/* Left Section: Active Project & Data API State */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {activeProject ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-emerald)',
              boxShadow: '0 0 6px var(--accent-emerald)'
            }} />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {activeProject.name}
            </span>
            <span style={{
              fontSize: '0.65rem',
              padding: '1px 6px',
              borderRadius: '3px',
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--primary)',
              fontWeight: 600
            }}>
              {activeProject.environment}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-muted)' }} />
            <span>No Workspace Active</span>
          </div>
        )}

        <div style={{ width: '1px', height: '12px', backgroundColor: 'var(--border-subtle)' }} />

        {/* Latency & Ping */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
          <Activity size={12} color={activeProject ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
          <span>{latencyMs !== undefined ? `${latencyMs}ms` : activeProject ? 'Connected' : 'Offline'}</span>
        </div>

        <div style={{ width: '1px', height: '12px', backgroundColor: 'var(--border-subtle)' }} />

        {/* Token Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {activeProject?.apiToken ? (
            <span style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Lock size={11} />
              <span>Private Token</span>
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Unlock size={11} />
              <span>Public Access</span>
            </span>
          )}
        </div>
      </div>

      {/* Center Section: Health Score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {healthScore !== undefined && healthScore !== null ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '1px 8px',
            borderRadius: '10px',
            background: healthScore >= 80 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            border: healthScore >= 80 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)',
            fontSize: '0.675rem',
            color: healthScore >= 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)',
            fontWeight: 600
          }}>
            <ShieldCheck size={12} />
            <span>Health {healthScore}% {healthGrade ? `(Grade ${healthGrade})` : ''}</span>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '1px 8px',
            borderRadius: '10px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.675rem',
            color: 'var(--text-muted)',
            fontWeight: 500
          }}>
            <ShieldCheck size={12} />
            <span>Audit Ready</span>
          </div>
        )}
      </div>

      {/* Right Section: AI Model, Command Palette, Terminal Drawer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Active AI Provider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
          <Bot size={12} color="var(--primary)" />
          <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{aiProvider || 'AI Ready'}</span>
          {aiModel && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.675rem' }}>({aiModel})</span>
          )}
        </div>

        {/* AI Copilot Button */}
        {onOpenCopilot && (
          <button
            onClick={onOpenCopilot}
            title="Open Bubble AI Copilot & Expression Studio (Ctrl+I)"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-cyan)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '0.7rem'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Sparkles size={11} />
            <kbd style={{ fontSize: '0.65rem', background: 'var(--bg-input)', padding: '1px 4px', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>
              Ctrl+I
            </kbd>
          </button>
        )}

        <div style={{ width: '1px', height: '12px', backgroundColor: 'var(--border-subtle)' }} />

        {/* Command Palette Button */}
        <button
          onClick={onOpenCommandPalette}
          title="Open Command Palette (Ctrl+K)"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.7rem'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Search size={11} />
          <kbd style={{ fontSize: '0.65rem', background: 'var(--bg-input)', padding: '1px 4px', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>
            Ctrl+K
          </kbd>
        </button>

        <div style={{ width: '1px', height: '12px', backgroundColor: 'var(--border-subtle)' }} />

        {/* Terminal Drawer Toggle Button with Error/Warning Badges */}
        <button
          onClick={onToggleTerminal}
          style={{
            background: isTerminalOpen ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            border: isTerminalOpen ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
            color: isTerminalOpen ? 'var(--primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 500
          }}
        >
          <Terminal size={12} />
          <span>Terminal</span>

          {errorCount > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--accent-rose)', fontSize: '0.675rem' }}>
              <XCircle size={10} />
              <span>{errorCount}</span>
            </span>
          )}

          {warnCount > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--accent-amber)', fontSize: '0.675rem' }}>
              <AlertTriangle size={10} />
              <span>{warnCount}</span>
            </span>
          )}
        </button>
      </div>
    </footer>
  );
};
