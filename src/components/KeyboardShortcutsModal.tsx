import React, { useEffect } from 'react';
import { X, Command, Keyboard, ArrowRight } from 'lucide-react';
import { NavigationTab } from '../types';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: NavigationTab) => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  tab?: NavigationTab;
}

interface ShortcutGroup {
  title: string;
  items: ShortcutItem[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Workspace Navigation',
    items: [
      { keys: ['Ctrl', '1'], description: 'Dashboard & Workspace Overview', tab: 'dashboard' },
      { keys: ['Ctrl', '2'], description: 'DevOps & Database Studio', tab: 'devops' },
      { keys: ['Ctrl', '3'], description: 'Dead Code & AST Health Scorer', tab: 'audit' },
      { keys: ['Ctrl', '4'], description: 'AI Localization Studio', tab: 'translator' },
      { keys: ['Ctrl', '5'], description: 'Visual QA & Pixel Regression', tab: 'visual-tester' },
      { keys: ['Ctrl', '6'], description: 'Security & Privacy Rules', tab: 'security' },
      { keys: ['Ctrl', '7'], description: 'Workload Units (WU) Profiler', tab: 'wu-profiler' },
      { keys: ['Ctrl', '8'], description: 'Webhooks & API Studio', tab: 'api-studio' },
      { keys: ['Ctrl', '9'], description: 'DocGen & Architecture Book', tab: 'doc-gen' }
    ]
  },
  {
    title: 'Studio Tools & Panels',
    items: [
      { keys: ['Ctrl', 'I'], description: 'Open AI Copilot & Query Assistant' },
      { keys: ['Ctrl', '`'], description: 'Toggle Studio Console Logs' },
      { keys: ['Ctrl', '/'], description: 'Show / Hide Keyboard Shortcuts' },
      { keys: ['Esc'], description: 'Close current modal or overlay' }
    ]
  }
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-active)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <Keyboard size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Keyboard Shortcuts
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Accelerate your developer workflow with instant studio hotkeys
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px', color: 'var(--text-muted)' }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3
                style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  marginBottom: '10px'
                }}
              >
                {group.title}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {group.items.map((item, idx) => {
                  const isClickable = Boolean(item.tab && onNavigate);
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (isClickable && item.tab && onNavigate) {
                          onNavigate(item.tab);
                          onClose();
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.825rem',
                        cursor: isClickable ? 'pointer' : 'default',
                        transition: 'border-color 0.15s ease, background 0.15s ease'
                      }}
                      className={isClickable ? 'hover-border' : ''}
                    >
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {item.description}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {item.keys.map((k, kIdx) => (
                          <React.Fragment key={kIdx}>
                            <kbd
                              style={{
                                padding: '3px 7px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-active)',
                                borderRadius: '4px',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                                fontFamily: 'monospace'
                              }}
                            >
                              {k}
                            </kbd>
                            {kIdx < item.keys.length - 1 && (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)'
          }}
        >
          <span>Press <kbd style={{ padding: '1px 5px', borderRadius: '3px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>Ctrl</kbd> + <kbd style={{ padding: '1px 5px', borderRadius: '3px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>/</kbd> anywhere to open this dialog</span>
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
