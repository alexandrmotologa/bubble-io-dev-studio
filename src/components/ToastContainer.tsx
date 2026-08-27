import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Sparkles, 
  Loader2, 
  X, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { toast, ToastItem } from '../core/toast/toastManager';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe((updatedToasts) => {
      setToasts(updatedToasts);
    });
    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '36px',
        right: '18px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '10px',
        maxWidth: '420px',
        width: 'calc(100% - 36px)',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';
        const isWarn = t.type === 'warn';
        const isLoading = t.type === 'loading';
        const isInfo = t.type === 'info';

        let borderColor = 'rgba(99, 102, 241, 0.3)';
        let glowColor = 'rgba(99, 102, 241, 0.15)';
        let iconColor = 'var(--primary)';
        let IconComponent = Sparkles;

        if (isSuccess) {
          borderColor = 'rgba(16, 185, 129, 0.4)';
          glowColor = 'rgba(16, 185, 129, 0.15)';
          iconColor = 'var(--accent-emerald)';
          IconComponent = CheckCircle2;
        } else if (isError) {
          borderColor = 'rgba(244, 63, 94, 0.4)';
          glowColor = 'rgba(244, 63, 94, 0.15)';
          iconColor = 'var(--accent-rose)';
          IconComponent = AlertCircle;
        } else if (isWarn) {
          borderColor = 'rgba(245, 158, 11, 0.4)';
          glowColor = 'rgba(245, 158, 11, 0.15)';
          iconColor = 'var(--accent-amber)';
          IconComponent = AlertTriangle;
        } else if (isLoading) {
          borderColor = 'rgba(99, 102, 241, 0.5)';
          glowColor = 'rgba(99, 102, 241, 0.2)';
          iconColor = 'var(--primary)';
          IconComponent = Loader2;
        }

        return (
          <div
            key={t.id}
            style={{
              pointerEvents: 'auto',
              background: 'var(--bg-surface-elevated)',
              border: `1px solid ${borderColor}`,
              boxShadow: `0 8px 24px rgba(0, 0, 0, 0.4), 0 0 16px ${glowColor}`,
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              animation: 'fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative',
              overflow: 'hidden',
              backdropFilter: 'blur(12px)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{
                  marginTop: '1px',
                  color: iconColor,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IconComponent size={18} className={isLoading ? 'spin' : ''} />
                </div>

                <div>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3
                  }}>
                    {t.title}
                  </div>
                  {t.message && (
                    <div style={{
                      fontSize: '0.775rem',
                      color: 'var(--text-secondary)',
                      marginTop: '3px',
                      lineHeight: 1.4
                    }}>
                      {t.message}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => toast.dismiss(t.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>

            {/* Action button if present */}
            {t.action && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => {
                    t.action?.onClick();
                    toast.dismiss(t.id);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span>{t.action.label}</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
