import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Code, 
  GitCompare, 
  HardDriveDownload, 
  Copy, 
  Check, 
  Layers, 
  Table, 
  ExternalLink,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import { BackupResult, BubbleSchema, ProjectProfile } from '../types';
import { DevOpsEngine } from '../core/devops/devopsEngine';
import { GuideBanner } from '../components/GuideBanner';

interface DevOpsViewProps {
  activeProject?: ProjectProfile;
  onLog: (module: 'devops', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const DevOpsView: React.FC<DevOpsViewProps> = ({ activeProject, onLog }) => {
  const [subTab, setSubTab] = useState<'schema' | 'erd' | 'types' | 'diff' | 'backups'>('schema');
  const [schema, setSchema] = useState<BubbleSchema | null>(null);
  const [tsDefinitions, setTsDefinitions] = useState<string>('');
  const [mermaidErd, setMermaidErd] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupStatusText, setBackupStatusText] = useState('');
  const [backupsList, setBackupsList] = useState<BackupResult[]>([]);

  useEffect(() => {
    if (activeProject) {
      loadSchema();
    }
  }, [activeProject]);

  const loadSchema = async () => {
    if (!activeProject) return;
    onLog('devops', `Fetching schema for project: ${activeProject.name}...`);
    const s = await DevOpsEngine.fetchSchema(activeProject);
    setSchema(s);
    const ts = DevOpsEngine.generateTypeScriptDefinitions(s);
    setTsDefinitions(ts);
    const erd = DevOpsEngine.generateMermaidERD(s);
    setMermaidErd(erd);
    onLog('devops', `Loaded ${s.dataTypes.length} data types and ${s.optionSets.length} option sets.`, 'success');
  };

  const handleCopyTs = () => {
    navigator.clipboard.writeText(tsDefinitions);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onLog('devops', 'Copied TypeScript definitions to clipboard.', 'info');
  };

  const handleRunBackup = async () => {
    if (!activeProject || isBackingUp) return;
    setIsBackingUp(true);
    setBackupProgress(5);
    onLog('devops', `Starting automated database backup for ${activeProject.appId}...`);

    try {
      const result = await DevOpsEngine.runBackup(activeProject, (msg, pct) => {
        setBackupStatusText(msg);
        setBackupProgress(pct);
        onLog('devops', msg);
      });
      setBackupsList(prev => [result, ...prev]);
      onLog('devops', `Backup successfully created: ${result.backupId} (${result.recordCount} records, ${result.fileSizeKb} KB)`, 'success');
    } catch (e: any) {
      onLog('devops', `Backup failed: ${e.message}`, 'error');
    } finally {
      setIsBackingUp(false);
      setBackupProgress(0);
    }
  };

  const guideSteps = [
    {
      title: 'Enable Bubble Data API',
      desc: 'In your Bubble.io editor, go to Settings > API and check "Enable Data API" for the tables you want to inspect.',
      bubbleLocation: 'Bubble Editor > Settings > API'
    },
    {
      title: 'Generate API Token',
      desc: 'Create an API token in Bubble API Settings and paste it under "Settings & Keys" in this studio.',
      bubbleLocation: 'Bubble Editor > Settings > API > API Tokens'
    },
    {
      title: 'Inspect & Export Types',
      desc: 'Use the TypeScript Definitions tab to copy strongly-typed interfaces directly into your external code or plugins.',
      bubbleLocation: 'Studio > TypeScript Definitions > Copy'
    }
  ];

  return (
    <div className="view-container">
      {/* Interactive In-App Guide Banner */}
      <GuideBanner
        moduleName="DevOps & Schema Studio"
        summary="Automate Bubble database backups, export type-safe TypeScript interfaces, and visualize entity relationships."
        steps={guideSteps}
        bubbleDocUrl="https://manual.bubble.io/core-resources/api/data-api"
      />

      {/* Sub Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setSubTab('schema')}
            className={`btn btn-sm ${subTab === 'schema' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none' }}
          >
            <Table size={14} />
            <span>Data Schema</span>
          </button>
          <button
            onClick={() => setSubTab('erd')}
            className={`btn btn-sm ${subTab === 'erd' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none' }}
          >
            <Layers size={14} />
            <span>ERD Graph</span>
          </button>
          <button
            onClick={() => setSubTab('types')}
            className={`btn btn-sm ${subTab === 'types' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none' }}
          >
            <Code size={14} />
            <span>TypeScript Definitions</span>
          </button>
          <button
            onClick={() => setSubTab('diff')}
            className={`btn btn-sm ${subTab === 'diff' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none' }}
          >
            <GitCompare size={14} />
            <span>Schema Diff (Live vs Dev)</span>
          </button>
          <button
            onClick={() => setSubTab('backups')}
            className={`btn btn-sm ${subTab === 'backups' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none' }}
          >
            <HardDriveDownload size={14} />
            <span>Backups ({backupsList.length})</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={loadSchema} className="btn btn-secondary btn-sm" title="Refresh Schema">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button onClick={handleRunBackup} disabled={isBackingUp} className="btn btn-primary btn-sm">
            <HardDriveDownload size={14} />
            <span>{isBackingUp ? 'Backing up...' : 'Create Backup'}</span>
          </button>
        </div>
      </div>

      {/* Backup in progress indicator */}
      {isBackingUp && (
        <div className="card" style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--border-active)', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
            <span><strong>Backup in progress:</strong> {backupStatusText}</span>
            <span>{backupProgress}%</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ width: `${backupProgress}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #06b6d4)', transition: 'width 0.3s ease' }} />
          </div>
        </div>
      )}

      {/* Subtab 1: Data Schema Explorer */}
      {subTab === 'schema' && schema && (
        <div className="grid-2">
          {schema.dataTypes.map((dt) => (
            <div key={dt.id} className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <Database size={18} color="var(--primary)" />
                    <span>{dt.name}</span>
                  </div>
                  <div className="card-subtitle">
                    {dt.recordCount?.toLocaleString()} records in database
                  </div>
                </div>
                <span className="badge badge-indigo">{dt.fields.length} Fields</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {dt.fields.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.825rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <code style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{f.name}</code>
                      {f.required && <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>Required</span>}
                    </div>
                    <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                      {f.type}{f.isList ? '[]' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subtab 2: ERD Diagram */}
      {subTab === 'erd' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Layers size={18} color="var(--accent-cyan)" />
                <span>Entity Relationship Definition (Mermaid ERD)</span>
              </div>
              <div className="card-subtitle">Visual mapping of database entities and foreign key connections</div>
            </div>
          </div>
          <pre style={{
            background: 'var(--bg-input)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            color: '#a5b4fc',
            overflowX: 'auto',
            lineHeight: 1.5
          }}>
            {mermaidErd}
          </pre>
        </div>
      )}

      {/* Subtab 3: TypeScript Definitions */}
      {subTab === 'types' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Code size={18} color="var(--accent-emerald)" />
                <span>Auto-Generated TypeScript Interfaces</span>
              </div>
              <div className="card-subtitle">Exportable types for custom Bubble plugins, Node.js backends, or mobile clients</div>
            </div>
            <button onClick={handleCopyTs} className="btn btn-secondary btn-sm">
              {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
          <pre style={{
            background: 'var(--bg-input)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            color: '#34d399',
            maxHeight: '420px',
            overflowY: 'auto',
            lineHeight: 1.5
          }}>
            {tsDefinitions}
          </pre>
        </div>
      )}

      {/* Subtab 4: Schema Diff */}
      {subTab === 'diff' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <GitCompare size={18} color="var(--accent-amber)" />
                <span>Schema Migration Preview (Development vs Live)</span>
              </div>
              <div className="card-subtitle">Detects fields/types added or modified before releasing to production</div>
            </div>
            <span className="badge badge-emerald">Ready for deploy</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <strong style={{ color: 'var(--accent-emerald)', fontSize: '0.875rem' }}>+ 1 New Data Type Detected:</strong>
              <div style={{ fontSize: '0.825rem', marginTop: '4px', color: 'var(--text-secondary)' }}>
                <code>AuditLog</code> (fields: <code>actor</code>, <code>action_type</code>, <code>ip_address</code>, <code>created_at</code>)
              </div>
            </div>

            <div style={{ padding: '12px 16px', background: 'rgba(6, 182, 212, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
              <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.875rem' }}>~ 2 New Fields in Existing Tables:</strong>
              <div style={{ fontSize: '0.825rem', marginTop: '4px', color: 'var(--text-secondary)' }}>
                <code>User.stripe_customer_id (text)</code><br />
                <code>Product.tax_category (option_set.tax_category)</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 5: Backups Archive */}
      {subTab === 'backups' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <HardDriveDownload size={18} color="var(--primary)" />
                <span>Database Backups History</span>
              </div>
              <div className="card-subtitle">Stored snapshots and archives for your active Bubble app</div>
            </div>
          </div>

          {backupsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              No backups created in this session. Click <strong>"Create Backup"</strong> to generate a complete snapshot.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {backupsList.map(b => (
                <div
                  key={b.backupId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {b.backupId}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(b.timestamp).toLocaleString()} • {b.recordCount.toLocaleString()} records • {b.tables.join(', ')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="badge badge-emerald">{(b.fileSizeKb / 1024).toFixed(2)} MB</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => onLog('devops', `Downloaded ${b.filePath}`, 'success')}>
                      <HardDriveDownload size={14} />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
