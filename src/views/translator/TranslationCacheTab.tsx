import React from 'react';
import { Database, Trash2 } from 'lucide-react';
import { TranslationMemoryStats } from '../../types';

interface TranslationCacheTabProps {
  memoryStats: TranslationMemoryStats;
  handleClearCache: () => void;
}

export const TranslationCacheTab: React.FC<TranslationCacheTabProps> = ({
  memoryStats,
  handleClearCache
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}>
      <div className="grid-3" style={{ gap: '12px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL CACHED STRINGS</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{memoryStats.totalCachedEntries}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Instant 0ms lookup across builds</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CHARACTERS SAVED</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{memoryStats.totalCharsSaved.toLocaleString()}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Zero duplicate token usage</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ESTIMATED API SAVINGS</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>${memoryStats.estimatedSavingsUsd}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Cumulative lifetime savings</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Database size={18} color="var(--primary)" />
              <span>Translation Memory Cache Controller</span>
            </div>
            <div className="card-subtitle">Prevents paying twice for identical strings across Bubble releases and builds</div>
          </div>
          <button onClick={handleClearCache} className="btn btn-secondary btn-sm" style={{ color: '#f43f5e' }}>
            <Trash2 size={13} />
            <span>Clear Memory Cache</span>
          </button>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
          Cached languages: <strong>{memoryStats.languages.join(', ').toUpperCase() || 'None'}</strong>
        </div>
      </div>
    </div>
  );
};
