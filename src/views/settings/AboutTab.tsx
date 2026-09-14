import React from 'react';
import { 
  RefreshCw, 
  CheckCircle2, 
  Download, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Layers, 
  Globe, 
  Github, 
  ExternalLink 
} from 'lucide-react';
import { UpdaterStatusData } from '../../types';
import { APP_VERSION, APP_VERSION_LABEL, APP_NAME, APP_EDITION } from '../../version';

interface AboutTabProps {
  updaterStatus: UpdaterStatusData;
  isCheckingUpdate: boolean;
  lastCheckTime: string | null;
  appRuntimeInfo: { isPackaged: boolean; platform: string };
  handleCheckForUpdates: () => Promise<void>;
  handleDownloadUpdate: () => Promise<void>;
  handleInstallUpdate: () => Promise<void>;
}

export const AboutTab: React.FC<AboutTabProps> = ({
  updaterStatus,
  isCheckingUpdate,
  lastCheckTime,
  appRuntimeInfo,
  handleCheckForUpdates,
  handleDownloadUpdate,
  handleInstallUpdate
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Auto-Updater Section */}
      <div className="card" style={{ border: '1px solid var(--border-active)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 8px 20px -4px rgba(16, 185, 129, 0.4)'
            }}>
              <RefreshCw size={22} className={isCheckingUpdate ? 'animate-spin' : ''} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Application Updates & Releases
                </h3>
                <span className="badge badge-indigo">Auto-Updater</span>
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Seamless in-app delta updates powered by GitHub Releases & electron-updater
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {updaterStatus.status === 'downloaded' ? (
              <button
                onClick={handleInstallUpdate}
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: '#fff', fontWeight: 600 }}
              >
                <CheckCircle2 size={16} />
                <span>Restart & Install v{updaterStatus.version || ''}</span>
              </button>
            ) : updaterStatus.status === 'available' && !updaterStatus.percent ? (
              <button
                onClick={handleDownloadUpdate}
                className="btn btn-primary"
              >
                <Download size={15} />
                <span>Download Update v{updaterStatus.version}</span>
              </button>
            ) : (
              <button
                onClick={handleCheckForUpdates}
                disabled={isCheckingUpdate}
                className="btn btn-secondary"
              >
                <RefreshCw size={14} className={isCheckingUpdate ? 'animate-spin' : ''} />
                <span>{isCheckingUpdate ? 'Checking Releases...' : 'Check for Updates'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Version & Runtime Status Pills */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div style={{ background: 'var(--bg-input)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Installed Version</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>v{updaterStatus.currentVersion || APP_VERSION}</span>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>{APP_EDITION}</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Environment & Target</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
              {appRuntimeInfo.isPackaged ? `Packaged (${appRuntimeInfo.platform})` : 'Desktop Dev Environment'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Update Channel</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-emerald)', marginTop: '4px' }}>
              GitHub Official Releases (Stable)
            </div>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Checked</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)', marginTop: '4px' }}>
              {lastCheckTime ? lastCheckTime : 'On Application Launch'}
            </div>
          </div>
        </div>

        {/* Live Progress Bar when downloading */}
        {updaterStatus.status === 'downloading' && (
          <div style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid var(--border-active)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={15} color="var(--accent-cyan)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Downloading update package...
                </span>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {updaterStatus.percent || 0}%
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                width: `${updaterStatus.percent || 0}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #6366f1 0%, #06b6d4 100%)',
                borderRadius: '999px',
                transition: 'width 0.3s ease'
              }} />
            </div>
            {Boolean(updaterStatus.bytesPerSecond) && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Speed: {((updaterStatus.bytesPerSecond || 0) / (1024 * 1024)).toFixed(1)} MB/s • Transferred: {((updaterStatus.transferred || 0) / (1024 * 1024)).toFixed(1)} MB / {((updaterStatus.total || 0) / (1024 * 1024)).toFixed(1)} MB
              </div>
            )}
          </div>
        )}

        {/* Status Messages */}
        {updaterStatus.status === 'downloaded' && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--accent-emerald)'
          }}>
            <CheckCircle2 size={18} />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              Update <strong>v{updaterStatus.version}</strong> downloaded successfully! Click <strong>Restart & Install</strong> above to apply the update immediately, or it will install automatically on exit.
            </span>
          </div>
        )}

        {updaterStatus.status === 'available' && (
          <div style={{
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--accent-cyan)'
          }}>
            <Sparkles size={18} />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              A newer version <strong>v{updaterStatus.version}</strong> is available on GitHub Releases. Downloading delta payload in the background.
            </span>
          </div>
        )}

        {updaterStatus.status === 'not-available' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem'
          }}>
            <Check size={16} color="var(--accent-emerald)" />
            <span>You are currently running the latest official version of Bubble.io Dev Studio.</span>
          </div>
        )}

        {updaterStatus.status === 'dev-mode' && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#fbbf24',
            fontSize: '0.825rem'
          }}>
            <AlertCircle size={16} />
            <span>Development environment detected. Live auto-download & installation are activated in packaged production releases (Windows NSIS/Portable, macOS DMG, Linux AppImage).</span>
          </div>
        )}

        {updaterStatus.status === 'error' && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--accent-rose)',
            fontSize: '0.85rem'
          }}>
            <AlertCircle size={16} />
            <span>Update verification issue: {updaterStatus.error || 'Network error or repository unreachable'}.</span>
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 8px 24px -4px rgba(99, 102, 241, 0.5)'
          }}>
            <Layers size={30} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {APP_NAME}
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {APP_VERSION_LABEL} • Designed & Built by <strong>Alexandr Motologa | MTLG Labs</strong>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: '0 0 16px' }}>
          <strong>Bubble.io Dev Studio</strong> is a desktop workspace for Bubble.io developers. It provides tools for database schemas, dead code audits, workload unit profiling, webhooks, documentation generation, localization, and visual testing.
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
          <a
            href="https://mtlglabs.space"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.15))', border: '1px solid var(--border-active)' }}
          >
            <Globe size={14} color="var(--accent-cyan)" />
            <span>🧪 MTLG Labs (mtlglabs.space)</span>
          </a>

          <a
            href="https://mtlg.site"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
          >
            <Globe size={14} color="var(--primary)" />
            <span>🌐 Personal Hub (mtlg.site)</span>
          </a>

          <a
            href="https://github.com/alexandrmotologa"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
          >
            <Github size={14} />
            <span>GitHub @alexandrmotologa</span>
          </a>

          <a
            href="https://github.com/alexandrmotologa/bubble-io-dev-studio"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
          >
            <ExternalLink size={14} />
            <span>Repository</span>
          </a>
        </div>
      </div>
    </div>
  );
};
