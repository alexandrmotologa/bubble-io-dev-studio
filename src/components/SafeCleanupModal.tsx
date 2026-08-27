import React, { useState } from 'react';
import {
  ShieldAlert,
  Trash2,
  Download,
  X,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

interface SafeCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmClean: (options: { backupFirst: boolean; cleanPages: boolean; cleanEvents: boolean; cleanStyles: boolean }) => void;
  deadPagesCount?: number;
  deadEventsCount?: number;
  deadStylesCount?: number;
}

export const SafeCleanupModal: React.FC<SafeCleanupModalProps> = ({
  isOpen,
  onClose,
  onConfirmClean,
  deadPagesCount = 2,
  deadEventsCount = 3,
  deadStylesCount = 8
}) => {
  const [backupFirst, setBackupFirst] = useState(true);
  const [cleanPages, setCleanPages] = useState(true);
  const [cleanEvents, setCleanEvents] = useState(true);
  const [cleanStyles, setCleanStyles] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const totalItems = (cleanPages ? deadPagesCount : 0) + (cleanEvents ? deadEventsCount : 0) + (cleanStyles ? deadStylesCount : 0);

  const handleExecute = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onConfirmClean({ backupFirst, cleanPages, cleanEvents, cleanStyles });
      setIsProcessing(false);
      onClose();
    }, 600);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '560px',
        backgroundColor: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-active)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.75), 0 0 30px rgba(244, 63, 94, 0.15)',
        overflow: 'hidden',
        animation: 'modalSlideIn 0.2s ease-out',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(244, 63, 94, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(244, 63, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-rose)'
            }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Safe AST Dead Code Cleanup
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                Simulate and prune confirmed orphaned components
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Summary Alert */}
          <div style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            fontSize: '0.775rem',
            color: 'var(--accent-rose)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              <strong>{totalItems} dead items selected for cleanup.</strong>
              <div>These elements have zero inbound triggers, navigation links, or style references.</div>
            </div>
          </div>

          {/* Granular Selection Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Select Components to Prune:
            </span>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={cleanPages}
                  onChange={e => setCleanPages(e.target.checked)}
                />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Orphaned Pages ({deadPagesCount} pages)
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>e.g. checkout_old_backup</span>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={cleanEvents}
                  onChange={e => setCleanEvents(e.target.checked)}
                />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Unused Custom Events & Backend Workflows ({deadEventsCount} items)
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>e.g. send_test_email_v1</span>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={cleanStyles}
                  onChange={e => setCleanStyles(e.target.checked)}
                />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Unreferenced Style Rules ({deadStylesCount} styles)
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>e.g. Button_Style_v1_legacy</span>
            </label>
          </div>

          {/* Backup Checkbox Guard */}
          <div style={{
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <input
              type="checkbox"
              id="backupFirst"
              checked={backupFirst}
              onChange={e => setBackupFirst(e.target.checked)}
            />
            <label htmlFor="backupFirst" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <strong>Download Safety Backup (.bubble JSON)</strong> automatically before modifying the blueprint.
            </label>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
          >
            <span>Cancel</span>
          </button>

          <button
            onClick={handleExecute}
            disabled={totalItems === 0 || isProcessing}
            className="btn btn-sm"
            style={{
              backgroundColor: 'var(--accent-rose)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Trash2 size={14} />
            <span>{isProcessing ? 'Pruning AST...' : `Execute Safe Cleanup (${totalItems} items)`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
