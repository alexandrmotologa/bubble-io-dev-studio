import React, { useState, useEffect } from 'react';
import { Layers, Plus, FlaskConical, ArrowRight, X, Key, Globe, HelpCircle, ShieldCheck } from 'lucide-react';
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
  const [apiToken, setApiToken] = useState('');
  const [showTokenHelp, setShowTokenHelp] = useState(false);

  // Reset form fields every time modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setAppId('');
      setEnvironment('development');
      setCustomDomain('');
      setApiToken('');
      setShowTokenHelp(false);
    }
  }, [isOpen]);

  // Handle Escape key to close
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
    const cleanAppId = appId.trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\.bubbleapps\.io.*$/, '')
      .replace(/[\/\s]+/g, '-');

    if (!name.trim() || !cleanAppId) return;

    onAddProject({
      name: name.trim(),
      appId: cleanAppId,
      environment,
      customDomain: customDomain.trim() || undefined,
      apiToken: apiToken.trim() || undefined
    });

    // Clear state
    setName('');
    setAppId('');
    setEnvironment('development');
    setCustomDomain('');
    setApiToken('');
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
        background: 'rgba(5, 8, 14, 0.72)',
        backdropFilter: 'blur(8px)',
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
        borderRadius: '16px',
        width: '100%',
        maxWidth: '540px',
        boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.35), 0 0 24px var(--primary-glow)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Close icon button */}
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
            title="Close (Esc)"
          >
            <X size={15} />
          </button>
        )}

        {/* Modal Header */}
        <div style={{
          padding: '24px 28px 18px',
          textAlign: 'center',
          background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%)',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(99, 102, 241, 0.35)',
            marginBottom: '10px'
          }}>
            <Layers size={24} color="#ffffff" />
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {hasExistingProjects ? 'Connect Another Bubble App 🚀' : 'Connect Your Bubble.io App 🚀'}
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Configure your workspace for live database schema, backups, and QA
          </p>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Project Display Name */}
          <div>
            <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Project Name <span style={{ color: 'var(--accent-rose)' }}>*</span></span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Internal label in Studio</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Quiz2Coin Platform"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              autoFocus
            />
          </div>

          {/* Bubble Subdomain / App ID */}
          <div>
            <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Bubble Subdomain / App ID <span style={{ color: 'var(--accent-rose)' }}>*</span></span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Do not enter email</span>
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden'
            }}>
              <span style={{
                padding: '0 10px',
                fontSize: '0.775rem',
                color: 'var(--text-muted)',
                background: 'rgba(0,0,0,0.06)',
                borderRight: '1px solid var(--border-subtle)',
                userSelect: 'none',
                height: '38px',
                display: 'flex',
                alignItems: 'center'
              }}>
                https://
              </span>
              <input
                type="text"
                required
                placeholder="quiz2coin-search-test"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '0 12px',
                  height: '38px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              />
              <span style={{
                padding: '0 10px',
                fontSize: '0.775rem',
                color: 'var(--text-muted)',
                background: 'rgba(0,0,0,0.06)',
                borderLeft: '1px solid var(--border-subtle)',
                userSelect: 'none',
                height: '38px',
                display: 'flex',
                alignItems: 'center'
              }}>
                .bubbleapps.io
              </span>
            </div>
          </div>

          {/* Bubble API Token (Optional / Recommended) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="input-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={13} color="var(--primary)" />
                <span>Bubble Data API Token</span>
                <span className="badge badge-indigo" style={{ fontSize: '0.625rem', padding: '1px 6px' }}>Recommended</span>
              </label>
              <button
                type="button"
                onClick={() => setShowTokenHelp(!showTokenHelp)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.725rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0
                }}
              >
                <HelpCircle size={12} />
                <span>{showTokenHelp ? 'Hide Guide' : 'Where to find?'}</span>
              </button>
            </div>

            <input
              type="password"
              placeholder="e.g. 7f8a9b2c3d4e..."
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              className="input"
            />

            {/* Expandable / Compact Help Guide */}
            {showTokenHelp && (
              <div style={{
                marginTop: '8px',
                padding: '10px 12px',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5
              }}>
                <strong>How to enable in Bubble.io:</strong>
                <ol style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  <li>Open your Bubble Editor &gt; <strong>Settings &gt; API</strong></li>
                  <li>Check <strong>"Enable Data API"</strong> &amp; select your data tables</li>
                  <li>Click <strong>"Generate a new API token"</strong> and paste it above</li>
                </ol>
              </div>
            )}
          </div>

          {/* Environment & Custom Domain (2-column layout) */}
          <div className="grid-2">
            <div>
              <label className="input-label">Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as any)}
                className="select"
              >
                <option value="development">Development (version-test)</option>
                <option value="staging">Staging (Branch / Pre-Live)</option>
                <option value="live">Live (Production Domain)</option>
              </select>
            </div>

            <div>
              <label className="input-label">Custom Domain (Optional)</label>
              <input
                type="text"
                placeholder="e.g. app.myproject.com"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            {hasExistingProjects && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ flex: 1, height: '40px' }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2, height: '40px' }}
            >
              <Plus size={16} />
              <span>Connect Application</span>
            </button>
          </div>
        </form>

        {/* Footer: Demo Sandbox Shortcut */}
        {!hasExistingProjects && (
          <div style={{
            padding: '12px 24px',
            background: 'var(--bg-input)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.775rem',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FlaskConical size={14} color="var(--accent-amber)" />
              <span>Just testing or exploring features?</span>
            </div>
            <button
              type="button"
              onClick={onLoadDemoProject}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.725rem', padding: '4px 10px' }}
            >
              <span>Load Sandbox Demo</span>
              <ArrowRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
