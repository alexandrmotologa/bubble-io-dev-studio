import React, { useState, useEffect } from 'react';
import { Layers, Plus, FlaskConical, ArrowRight, X } from 'lucide-react';
import { ProjectProfile } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onAddProject: (project: Omit<ProjectProfile, 'id' | 'createdAt'>) => void;
  onLoadDemoProject: () => void;
  hasExistingProjects?: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onAddProject,
  onLoadDemoProject,
  hasExistingProjects = false
}) => {
  const [name, setName] = useState('');
  const [appId, setAppId] = useState('');
  const [environment, setEnvironment] = useState<'development' | 'staging' | 'live'>('development');
  const [customDomain, setCustomDomain] = useState('');

  // Reset form fields every time the modal is opened
  useEffect(() => {
    if (isOpen) {
      setName('');
      setAppId('');
      setEnvironment('development');
      setCustomDomain('');
    }
  }, [isOpen]);

  // Handle Escape key to close if existing projects exist
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && hasExistingProjects && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasExistingProjects, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !appId.trim()) return;

    onAddProject({
      name: name.trim(),
      appId: appId.trim().toLowerCase().replace(/\s+/g, '-'),
      environment,
      customDomain: customDomain.trim() || undefined
    });

    // Clear state after adding
    setName('');
    setAppId('');
    setEnvironment('development');
    setCustomDomain('');
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && hasExistingProjects && onClose) {
      onClose();
    }
  };

  return (
    <div 
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 8, 14, 0.75)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
    >
      <div style={{
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-active)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '560px',
        boxShadow: 'var(--shadow-lg), 0 0 30px var(--primary-glow)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Close icon button if user already has other projects */}
        {hasExistingProjects && onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              zIndex: 10,
              transition: 'all 0.15s ease'
            }}
            title="Close modal (Esc)"
          >
            <X size={16} />
          </button>
        )}

        {/* Modal Header */}
        <div style={{
          padding: '28px 32px 20px',
          textAlign: 'center',
          background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.12) 0%, transparent 100%)',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.45)',
            marginBottom: '14px'
          }}>
            <Layers size={28} color="#ffffff" />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {hasExistingProjects ? 'Connect Another Bubble App 🚀' : 'Welcome to Bubble.io Dev Studio! 🚀'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '420px', margin: '6px auto 0' }}>
            {hasExistingProjects
              ? 'Enter the details for your new Bubble workspace to start backups, dead code audits, and AI translation.'
              : "Let's connect your first Bubble application to unlock automated backups, dead code audits, AI translation, and visual regression tests."}
          </p>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="input-label">Project Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. My SaaS Platform"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              autoFocus
            />
          </div>

          <div className="grid-2">
            <div>
              <label className="input-label">Bubble App ID / Subdomain *</label>
              <input
                type="text"
                required
                placeholder="e.g. my-app-prod"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="input"
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                From <code>your-app.bubbleapps.io</code>
              </span>
            </div>

            <div>
              <label className="input-label">Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as any)}
                className="select"
              >
                <option value="development">Development (Test)</option>
                <option value="staging">Staging</option>
                <option value="live">Live (Production)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="input-label">Custom Domain (Optional)</label>
            <input
              type="text"
              placeholder="e.g. app.mydomain.com"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              className="input"
            />
          </div>

          {/* Action Buttons */}
          {hasExistingProjects ? (
            <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '12px', fontSize: '0.95rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1.4, padding: '12px', fontSize: '0.95rem' }}
              >
                <Plus size={18} />
                <span>Add Bubble App</span>
              </button>
            </div>
          ) : (
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '6px', fontSize: '0.95rem' }}
            >
              <Plus size={18} />
              <span>Connect Application & Start Studio</span>
            </button>
          )}
        </form>

        {/* Demo sandbox option */}
        <div style={{
          padding: '16px 32px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-card-hover)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FlaskConical size={16} color="var(--accent-amber)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Just exploring for now?
            </span>
          </div>

          <button
            type="button"
            onClick={onLoadDemoProject}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.775rem' }}
          >
            <span>Load Demo Sandbox App</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
