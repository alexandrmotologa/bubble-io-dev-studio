import React from 'react';
import { Sparkles, RefreshCw, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

interface UpdatePromptModalProps {
  version: string;
  releaseNotes?: string;
  onRestartNow: () => void;
  onRestartLater: () => void;
}

export const UpdatePromptModal: React.FC<UpdatePromptModalProps> = ({
  version,
  releaseNotes,
  onRestartNow,
  onRestartLater,
}) => {
  return (
    <aside
      aria-label="Application Update Ready"
      role="alertdialog"
      aria-modal="false"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '430px',
        maxWidth: 'calc(100vw - 48px)',
        zIndex: 99999,
        backgroundColor: 'var(--bg-surface-elevated, #1a1d26)',
        border: '1px solid rgba(99, 102, 241, 0.5)',
        borderRadius: 'var(--radius-lg, 16px)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.25)',
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
        animation: 'modalSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top glowing accent gradient */}
      <div
        style={{
          height: '3px',
          background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)',
          width: '100%',
        }}
      />

      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Header with Glowing Icon & Version Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary, #6366f1)',
                flexShrink: 0,
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h4
                style={{
                  margin: 0,
                  fontSize: '0.925rem',
                  fontWeight: 700,
                  color: 'var(--text-primary, #ffffff)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                Update Ready to Install
              </h4>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary, #94a3b8)' }}>
                New release downloaded in background
              </span>
            </div>
          </div>

          <span
            style={{
              fontSize: '0.725rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--accent-emerald, #10b981)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              whiteSpace: 'nowrap',
            }}
          >
            v{version}
          </span>
        </div>

        {/* Informative Body Text */}
        <p
          style={{
            margin: 0,
            fontSize: '0.8rem',
            lineHeight: 1.5,
            color: 'var(--text-secondary, #cbd5e1)',
          }}
        >
          A new version of <strong>Bubble.io Dev Studio</strong> (<code>v{version}</code>) is ready. You can restart now to apply it immediately, or choose <strong>Restart Later</strong> to continue working without interruptions.
        </p>

        {/* Security & Data Safety Guarantee */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 10px',
            borderRadius: 'var(--radius-sm, 8px)',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
            fontSize: '0.725rem',
            color: 'var(--text-muted, #94a3b8)',
          }}
        >
          <ShieldCheck size={14} color="var(--accent-emerald, #10b981)" style={{ flexShrink: 0 }} />
          <span>
            Zero Data Loss: Your workspaces, databases, and keys remain 100% intact.
          </span>
        </div>

        {/* Choice Action Buttons: Restart Later vs Restart Now */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
          <button
            type="button"
            onClick={onRestartLater}
            className="btn btn-secondary"
            style={{
              flex: 1,
              justifyContent: 'center',
              padding: '8px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              gap: '6px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <Clock size={14} />
            <span>Restart Later</span>
          </button>

          <button
            type="button"
            onClick={onRestartNow}
            className="btn btn-primary"
            style={{
              flex: 1,
              justifyContent: 'center',
              padding: '8px 14px',
              fontSize: '0.8rem',
              fontWeight: 700,
              gap: '6px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} />
            <span>Restart Now</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
