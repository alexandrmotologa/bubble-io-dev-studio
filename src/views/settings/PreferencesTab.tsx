import React from 'react';
import { Palette, HardDrive, Clock, Trash2 } from 'lucide-react';
import { GlobalSettings, ThemeMode } from '../../types';
import { TranslatorEngine } from '../../core/translator/translatorEngine';
import { toast } from '../../core/toast/toastManager';

interface PreferencesTabProps {
  formData: GlobalSettings;
  setFormData: React.Dispatch<React.SetStateAction<GlobalSettings>>;
  onSaveSettings: (settings: GlobalSettings) => void;
}

export const PreferencesTab: React.FC<PreferencesTabProps> = ({
  formData,
  setFormData,
  onSaveSettings
}) => {
  return (
    <div className="grid-2">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Palette size={18} color="var(--primary)" />
              <span>Studio Visual Theme</span>
            </div>
            <div className="card-subtitle">Select visual skin for Bubble Dev Studio</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="input-label">Theme Mode</label>
            <select
              value={formData.theme}
              onChange={(e) => {
                const newTheme = e.target.value as ThemeMode;
                const updated: GlobalSettings = { ...formData, theme: newTheme };
                setFormData(updated);
                document.documentElement.setAttribute('data-theme', newTheme);
                onSaveSettings(updated);
              }}
              className="select select-premium"
            >
              <option value="dark">Dark Theme (Cyber Slate)</option>
              <option value="light">Light Theme (Clean Studio)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
            <input
              type="checkbox"
              id="autosave"
              checked={formData.autoSaveReports}
              onChange={(e) => {
                const updated: GlobalSettings = { ...formData, autoSaveReports: e.target.checked };
                setFormData(updated);
                onSaveSettings(updated);
              }}
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
            />
            <label htmlFor="autosave" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
              Automatically save HTML, SARIF & JSON reports locally
            </label>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <HardDrive size={18} color="var(--accent-cyan)" />
              <span>Local Storage Controller</span>
            </div>
            <div className="card-subtitle">Manage client-side IndexedDB & localStorage caches</div>
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 12px' }}>
            All schema snapshots, dead code audit histories, visual test references, and translation memory dictionaries are stored locally on your device.
          </p>
          <button
            type="button"
            onClick={() => {
              TranslatorEngine.clearMemoryCache();
              toast.info('Cleared translation memory cache');
            }}
            className="btn btn-secondary btn-sm"
            style={{ color: 'var(--accent-rose)' }}
          >
            <Trash2 size={13} />
            <span>Purge Translation Cache</span>
          </button>
        </div>
      </div>

      {/* Scheduled Auto-Backup & Retention Card */}
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              <Clock size={18} color="var(--primary)" />
              <span>Automated Scheduled Backups & Snapshot Retention</span>
            </div>
            <div className="card-subtitle">
              Configure automatic background snapshots and retention pruning for active workspaces
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div>
            <label className="input-label">Auto-Backup Frequency</label>
            <select
              value={formData.autoBackupInterval || 'disabled'}
              onChange={(e) => {
                const val = e.target.value as 'disabled' | '6h' | '12h' | '24h';
                const updated: GlobalSettings = { ...formData, autoBackupInterval: val };
                setFormData(updated);
                onSaveSettings(updated);
              }}
              className="select select-premium"
            >
              <option value="disabled">Disabled (Manual Only)</option>
              <option value="6h">Every 6 Hours (High Frequency)</option>
              <option value="12h">Every 12 Hours</option>
              <option value="24h">Every 24 Hours (Daily Snapshot)</option>
            </select>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Backups run silently in the background when Bubble Dev Studio is open.
            </div>
          </div>

          <div>
            <label className="input-label">Retention Policy (Max Backups Kept)</label>
            <select
              value={formData.autoBackupRetention || 10}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                const updated: GlobalSettings = { ...formData, autoBackupRetention: val };
                setFormData(updated);
                onSaveSettings(updated);
              }}
              className="select select-premium"
            >
              <option value={5}>Keep last 5 backups</option>
              <option value={10}>Keep last 10 backups (Recommended)</option>
              <option value={20}>Keep last 20 backups</option>
              <option value={50}>Keep last 50 backups</option>
            </select>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Older snapshots beyond this limit will be automatically pruned.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
          <input
            type="checkbox"
            id="autobackup-sync"
            checked={formData.autoBackupBeforeSync !== false}
            onChange={(e) => {
              const updated: GlobalSettings = { ...formData, autoBackupBeforeSync: e.target.checked };
              setFormData(updated);
              onSaveSettings(updated);
            }}
            style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
          />
          <label htmlFor="autobackup-sync" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
            Automatically create safety backup before 1-Click Sync or database push
          </label>
        </div>
      </div>
    </div>
  );
};
