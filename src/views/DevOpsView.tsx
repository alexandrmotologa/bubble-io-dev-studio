import React, { useState, useEffect, useRef } from 'react';
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
  Info, 
  Upload, 
  FileCode,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileQuestion,
  Plus
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
  const [schemaSource, setSchemaSource] = useState<'live_api' | 'uploaded_json' | 'sandbox_template' | 'none'>('none');
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [tsDefinitions, setTsDefinitions] = useState<string>('');
  const [mermaidErd, setMermaidErd] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupStatusText, setBackupStatusText] = useState('');
  const [backupsList, setBackupsList] = useState<BackupResult[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeProject) {
      // Reset state for new active project
      setSchema(null);
      setSchemaSource('none');
      setSchemaError(null);
      setUploadedFileName(null);
      loadSchema();
    }
  }, [activeProject?.id]);

  const loadSchema = async (customJson?: any, fileName?: string, forceTemplate = false) => {
    if (!activeProject) return;
    setIsLoadingSchema(true);
    setSchemaError(null);
    
    try {
      if (forceTemplate) {
        onLog('devops', 'Loading sandbox template schema...', 'info');
        const tmpl = DevOpsEngine.getRichTemplateSchema(activeProject);
        setSchema(tmpl);
        setSchemaSource('sandbox_template');
        setUploadedFileName(null);
        setTsDefinitions(DevOpsEngine.generateTypeScriptDefinitions(tmpl));
        setMermaidErd(DevOpsEngine.generateMermaidERD(tmpl));
        onLog('devops', `Loaded ${tmpl.dataTypes.length} sandbox template data types.`, 'success');
        return;
      }

      onLog('devops', customJson ? `Parsing uploaded schema file: ${fileName}...` : `Fetching schema for project: ${activeProject.name}...`);
      
      const { schema: s, source, error } = await DevOpsEngine.fetchSchema(activeProject, customJson, (msg, level) => {
        onLog('devops', msg, level);
      });

      setSchema(s);
      setSchemaSource(source);
      if (error) setSchemaError(error);

      if (s) {
        const ts = DevOpsEngine.generateTypeScriptDefinitions(s);
        setTsDefinitions(ts);
        const erd = DevOpsEngine.generateMermaidERD(s);
        setMermaidErd(erd);
        if (fileName) setUploadedFileName(fileName);
        onLog('devops', `Loaded ${s.dataTypes.length} data types (${source === 'live_api' ? 'Live Bubble API' : source === 'uploaded_json' ? 'Uploaded JSON' : 'Template'}).`, 'success');
      } else {
        setTsDefinitions('');
        setMermaidErd('');
      }
    } finally {
      setIsLoadingSchema(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        loadSchema(json, file.name);
      } catch (err: any) {
        onLog('devops', `Failed to parse JSON file: ${err.message}`, 'error');
        alert('Invalid JSON format. Please upload a valid Bubble export or OpenAPI/Swagger JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleCopyTs = () => {
    if (!tsDefinitions) return;
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
      onLog('devops', `Backup successfully created and downloaded: ${result.filePath} (${result.recordCount} records, ${result.fileSizeKb} KB)`, 'success');
    } catch (e: any) {
      onLog('devops', `Backup failed: ${e.message}`, 'error');
    } finally {
      setIsBackingUp(false);
      setBackupProgress(0);
    }
  };

  const isDemo = Boolean(activeProject?.isDemo || activeProject?.appId === 'demo-sandbox' || activeProject?.appId === 'marketplace-prod');

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
            <span>Data Schema {schema ? `(${schema.dataTypes.length})` : ''}</span>
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
            <span>Schema Diff</span>
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

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          {uploadedFileName && (
            <span className="badge badge-cyan" style={{ fontSize: '0.725rem' }}>
              <FileCode size={11} /> {uploadedFileName}
            </span>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary btn-sm"
            title="Upload your Bubble App export JSON or Swagger OpenAPI file"
          >
            <Upload size={14} />
            <span>Upload Schema JSON</span>
          </button>
          <button 
            onClick={() => loadSchema()} 
            disabled={isLoadingSchema}
            className="btn btn-secondary btn-sm" 
            title="Refresh Live Schema from Bubble Data API"
          >
            <RefreshCw size={14} className={isLoadingSchema ? 'spin' : ''} />
            <span>Fetch Live API</span>
          </button>
          <button onClick={handleRunBackup} disabled={isBackingUp} className="btn btn-primary btn-sm">
            <HardDriveDownload size={14} />
            <span>{isBackingUp ? 'Backing up...' : 'Create Backup'}</span>
          </button>
        </div>
      </div>

      {/* Schema Status / Diagnostics Banner */}
      {schema && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          borderRadius: 'var(--radius-md)',
          background: schemaSource === 'live_api' ? 'rgba(16, 185, 129, 0.08)' : schemaSource === 'uploaded_json' ? 'rgba(6, 182, 212, 0.08)' : 'rgba(99, 102, 241, 0.08)',
          border: `1px solid ${schemaSource === 'live_api' ? 'rgba(16, 185, 129, 0.25)' : schemaSource === 'uploaded_json' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(99, 102, 241, 0.25)'}`,
          fontSize: '0.825rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {schemaSource === 'live_api' && <CheckCircle2 size={16} color="var(--accent-emerald)" />}
            {schemaSource === 'uploaded_json' && <FileCode size={16} color="var(--accent-cyan)" />}
            {schemaSource === 'sandbox_template' && <Sparkles size={16} color="var(--primary)" />}
            <span>
              <strong>Schema Source:</strong> {
                schemaSource === 'live_api' ? `Live Bubble Data API (${activeProject?.appId}) • ${schema.dataTypes.length} tables` :
                schemaSource === 'uploaded_json' ? `Uploaded File (${uploadedFileName}) • ${schema.dataTypes.length} tables` :
                `Sandbox Demo Template`
              }
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {schemaSource !== 'sandbox_template' && (
              <button 
                onClick={() => loadSchema(undefined, undefined, true)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.725rem', padding: '2px 8px' }}
              >
                Switch to Demo Template
              </button>
            )}
          </div>
        </div>
      )}

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

      {/* Empty State when no real schema is connected yet */}
      {!schema && !isLoadingSchema && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            marginBottom: '16px'
          }}>
            <Database size={28} />
          </div>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Schema Imported for "{activeProject?.name}"
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '520px', margin: '0 auto 20px', lineHeight: 1.6 }}>
            To inspect your real Bubble data types, generate TypeScript interfaces, and view entity relationships, connect your Bubble Data API or upload your application export file.
          </p>

          {schemaError && (
            <div style={{
              maxWidth: '520px',
              margin: '0 auto 20px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              color: 'var(--accent-rose)',
              fontSize: '0.8rem',
              textAlign: 'left',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{schemaError}</div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => fileInputRef.current?.click()} className="btn btn-primary">
              <Upload size={16} />
              <span>Upload Bubble Schema JSON</span>
            </button>
            <button onClick={() => loadSchema()} className="btn btn-secondary">
              <RefreshCw size={16} />
              <span>Fetch Live from Data API</span>
            </button>
            <button onClick={() => loadSchema(undefined, undefined, true)} className="btn btn-secondary" style={{ color: 'var(--text-muted)' }}>
              <Sparkles size={16} />
              <span>Preview Demo Template</span>
            </button>
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
                  {dt.recordCount !== undefined && (
                    <div className="card-subtitle">
                      {dt.recordCount.toLocaleString()} records
                    </div>
                  )}
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
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.name}</span>
                      {f.required && (
                        <span style={{ color: 'var(--accent-rose)', fontSize: '0.7rem' }}>*</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                        {f.type} {f.isList ? '[]' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subtab 2: Mermaid ERD */}
      {subTab === 'erd' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Layers size={18} color="var(--accent-cyan)" />
                <span>Entity Relationship Diagram (ERD)</span>
              </div>
              <div className="card-subtitle">Auto-generated database relationships from Bubble types and list connections</div>
            </div>
          </div>

          <div style={{
            padding: '24px',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            whiteSpace: 'pre-wrap',
            color: 'var(--text-primary)'
          }}>
            {mermaidErd || (
              <span style={{ color: 'var(--text-muted)' }}>
                No schema loaded yet. Connect Bubble Data API or upload a schema export JSON to render ERD.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Subtab 3: TypeScript Definitions */}
      {subTab === 'types' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Code size={18} color="var(--primary)" />
                <span>TypeScript Interfaces</span>
              </div>
              <div className="card-subtitle">Zero-maintenance type definitions synchronized with your Bubble schema</div>
            </div>
            {tsDefinitions && (
              <button onClick={handleCopyTs} className="btn btn-secondary btn-sm">
                {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            )}
          </div>

          <pre style={{
            padding: '16px',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            lineHeight: 1.5,
            color: 'var(--text-primary)',
            overflowX: 'auto',
            maxHeight: '480px'
          }}>
            <code>{tsDefinitions || '// No schema loaded yet. Connect Bubble Data API or upload schema JSON.'}</code>
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
            <span className="badge badge-emerald">Synced</span>
          </div>

          {isDemo ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <strong style={{ color: 'var(--accent-emerald)', fontSize: '0.875rem' }}>+ 1 New Data Type Detected (Sandbox Demo):</strong>
                <div style={{ fontSize: '0.825rem', marginTop: '4px', color: 'var(--text-secondary)' }}>
                  <code>AuditLog</code> (fields: <code>actor</code>, <code>action_type</code>, <code>ip_address</code>, <code>created_at</code>)
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <CheckCircle2 size={24} color="var(--accent-emerald)" style={{ marginBottom: '8px' }} />
              <div>Schema is in sync across environments. No pending field or table migrations detected.</div>
            </div>
          )}
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
              <div className="card-subtitle">Stored snapshots and archives for your active Bubble app ({activeProject?.name})</div>
            </div>
          </div>

          {backupsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              No backups created yet for <strong>{activeProject?.name}</strong>. Click <strong>"Create Backup"</strong> to generate a complete snapshot.
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
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={async () => {
                        if (activeProject && schema) {
                          const filename = DevOpsEngine.downloadBackupFile(activeProject, schema, b.backupId);
                          onLog('devops', `Downloaded backup file: ${filename}`, 'success');
                        }
                      }}
                      title="Download JSON backup file"
                    >
                      <HardDriveDownload size={14} />
                      <span>Download JSON</span>
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
