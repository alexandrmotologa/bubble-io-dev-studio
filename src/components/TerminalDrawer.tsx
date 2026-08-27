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
          <Terminal size={14} color="var(--accent-cyan)" />
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Studio Console & Live Output</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.725rem' }}>({filteredLogs.length} events)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={12} color="var(--text-muted)" />
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                color: 'var(--text-secondary)',
                fontSize: '0.725rem',
                padding: '2px 6px',
                outline: 'none'
              }}
            >
              <option value="all" style={{ background: '#111827' }}>All Modules</option>
              <option value="devops" style={{ background: '#111827' }}>DevOps & Schema</option>
              <option value="audit" style={{ background: '#111827' }}>Audit & Dead Code</option>
              <option value="translator" style={{ background: '#111827' }}>AI Translator</option>
              <option value="visual-tester" style={{ background: '#111827' }}>Visual Tester</option>
              <option value="system" style={{ background: '#111827' }}>System</option>
            </select>
          </div>

          <button
            onClick={onClearLogs}
            className="btn btn-secondary btn-sm"
            style={{ padding: '2px 8px', fontSize: '0.725rem' }}
            title="Clear logs"
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="terminal-body">
        {filteredLogs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', padding: '12px 0', textAlign: 'center' }}>
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
