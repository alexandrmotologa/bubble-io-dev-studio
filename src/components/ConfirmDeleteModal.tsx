import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { ProjectProfile } from '../types';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  project: ProjectProfile | null;
  onClose: () => void;
  onConfirm: (projectId: string) => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  project,
  onClose,
  onConfirm
}) => {
  if (!isOpen || !project) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: 'var(--bg-surface-elevated)',
        border: '1px solid rgba(244, 63, 94, 0.3)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(244, 63, 94, 0.15)',
        overflow: 'hidden',
        animation: 'modalSlideIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(18, 24, 38, 0.9) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(244, 63, 94, 0.2)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-rose)'
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Remove Bubble Application
              </h2>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                Confirm workspace removal
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
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Are you sure you want to remove <strong>{project.name}</strong> (<code>{project.appId}</code>) from your Bubble Studio workspace?
          </p>

          <div style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}>
            ℹ️ This removes the local credentials and profile. You can reconnect it anytime using the Connection Wizard.
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm(project.id);
                onClose();
              }}
              className="btn btn-primary btn-sm"
              style={{
                backgroundColor: 'var(--accent-rose)',
                borderColor: 'rgba(244, 63, 94, 0.4)'
              }}
            >
              <Trash2 size={14} />
              <span>Yes, Remove Application</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
