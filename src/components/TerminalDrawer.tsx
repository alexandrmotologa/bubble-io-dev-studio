import React, { useState } from 'react';
import { Terminal, Trash2, X, Filter } from 'lucide-react';
import { LogEntry } from '../types';

interface TerminalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const TerminalDrawer: React.FC<TerminalDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs
}) => {
  const [filterModule, setFilterModule] = useState<string>('all');

  if (!isOpen) return null;

  const filteredLogs = filterModule === 'all' 
    ? logs 
    : logs.filter(l => l.module === filterModule);

  return (
    <div className="terminal-drawer" style={{ height: '230px' }}>
      <div className="terminal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={15} color="var(--primary)" />
          <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
            Studio Console & Live Output
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.725rem', fontFamily: 'var(--font-mono)' }}>
            ({filteredLogs.length} events)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={12} color="var(--text-muted)" />
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="select"
              style={{
                padding: '3px 8px',
                fontSize: '0.75rem',
                height: '28px',
                minWidth: '130px',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <option value="all">All Modules</option>
              <option value="devops">DevOps & Schema</option>
              <option value="audit">Audit & Dead Code</option>
              <option value="translator">AI Translator</option>
              <option value="visual-tester">Visual Tester</option>
              <option value="system">System Logs</option>
            </select>
          </div>

          <button
            onClick={onClearLogs}
            className="btn btn-secondary btn-sm"
            style={{ padding: '3px 8px', fontSize: '0.75rem', height: '28px' }}
            title="Clear all recorded logs"
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              borderRadius: '4px'
            }}
            title="Close console drawer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="terminal-body">
        {filteredLogs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', padding: '18px 0', textAlign: 'center', fontSize: '0.8rem' }}>
            No logs recorded yet. Run a backup, audit, translation, or visual test to see live output.
          </div>
        ) : (
          filteredLogs.map(log => (
            <div key={log.id} className="log-line">
              <span className="log-time">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
              <span className="log-module">[{log.module.toUpperCase()}]</span>
              <span className={`log-msg-${log.level}`}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
