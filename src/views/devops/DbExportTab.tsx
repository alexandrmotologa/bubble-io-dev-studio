import React, { useState, useEffect } from 'react';
import { Database, Copy, Download, Layers, Sparkles, Check, FileCode, Server } from 'lucide-react';
import { BubbleSchema } from '../../types';
import { DbExporterEngine } from '../../core/devops/dbExporter';
import { toast } from '../../core/toast/toastManager';

interface DbExportTabProps {
  schema: BubbleSchema | null;
  sampleRecords?: any[];
  onLog?: (module: 'devops', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

type MigrationDialect = 'supabase' | 'postgres' | 'prisma';
type SingleTableTarget = 'sqlite' | 'postgres' | 'bigquery';

export const DbExportTab: React.FC<DbExportTabProps> = ({
  schema,
  sampleRecords = [],
  onLog
}) => {
  const [exportMode, setExportMode] = useState<'full_migration' | 'single_table'>('full_migration');
  const [migrationDialect, setMigrationDialect] = useState<MigrationDialect>('supabase');

  // Single table states
  const [exportDbTarget, setExportDbTarget] = useState<SingleTableTarget>('sqlite');
  const [exportDbType, setExportDbType] = useState<string>(
    schema?.dataTypes && schema.dataTypes.length > 0 ? schema.dataTypes[0].name : 'User'
  );

  const [generatedScript, setGeneratedScript] = useState<string>('');

  useEffect(() => {
    if (!schema || schema.dataTypes.length === 0) {
      setGeneratedScript('-- No active schema loaded to generate database migration.');
      return;
    }

    if (exportMode === 'full_migration') {
      if (migrationDialect === 'supabase') {
        setGeneratedScript(DbExporterEngine.generateSupabaseMigration(schema));
      } else if (migrationDialect === 'postgres') {
        setGeneratedScript(DbExporterEngine.generatePostgresFullMigration(schema));
      } else {
        setGeneratedScript(DbExporterEngine.generatePrismaSchema(schema));
      }
    } else {
      const dt = schema.dataTypes.find(t => t.name.toLowerCase() === exportDbType.toLowerCase()) || schema.dataTypes[0];
      if (exportDbTarget === 'sqlite') {
        setGeneratedScript(DbExporterEngine.generateSqliteExport(dt, sampleRecords));
      } else if (exportDbTarget === 'postgres') {
        setGeneratedScript(DbExporterEngine.generatePostgresExport(dt, sampleRecords));
      } else {
        setGeneratedScript(DbExporterEngine.generateBigQueryExport(dt));
      }
    }
  }, [schema, exportMode, migrationDialect, exportDbTarget, exportDbType, sampleRecords]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
    onLog?.('devops', `Copied ${label} to clipboard.`, 'info');
  };

  const handleDownload = () => {
    if (!generatedScript) return;
    const isPrisma = exportMode === 'full_migration' && migrationDialect === 'prisma';
    const filename = isPrisma 
      ? 'schema.prisma' 
      : `${exportMode === 'full_migration' ? migrationDialect : exportDbTarget}_migration_${Date.now()}.sql`;
    const mimeType = isPrisma ? 'text/plain;charset=utf-8' : 'application/sql;charset=utf-8';

    const blob = new Blob([generatedScript], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filename}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Controls Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Database size={18} color="var(--primary)" />
              <span>1-Click Database Migration & DDL Exporter</span>
            </div>
            <div className="card-subtitle">
              Export your Bubble.io database schema to Supabase, PostgreSQL, Prisma ORM, SQLite, or BigQuery
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => handleCopy(generatedScript, 'Migration Script')} className="btn btn-secondary btn-sm">
              <Copy size={13} />
              <span>Copy Script</span>
            </button>
            <button onClick={handleDownload} className="btn btn-primary btn-sm">
              <Download size={13} />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Mode Selector Toggle */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setExportMode('full_migration')}
            className={`btn btn-sm ${exportMode === 'full_migration' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '10px' }}
          >
            <Layers size={14} />
            <span>🔄 Full App Migration (Supabase / Postgres / Prisma)</span>
          </button>
          <button
            onClick={() => setExportMode('single_table')}
            className={`btn btn-sm ${exportMode === 'single_table' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '10px' }}
          >
            <Server size={14} />
            <span>📊 Single Table Export (SQLite / BigQuery / Upsert)</span>
          </button>
        </div>

        {/* Full Migration Mode Configuration */}
        {exportMode === 'full_migration' ? (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                onClick={() => setMigrationDialect('supabase')}
                className={`btn btn-sm ${migrationDialect === 'supabase' ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  background: migrationDialect === 'supabase' ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' : undefined,
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <span>⚡ Supabase SQL (RLS + Foreign Keys + Triggers)</span>
              </button>
              <button
                onClick={() => setMigrationDialect('postgres')}
                className={`btn btn-sm ${migrationDialect === 'postgres' ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  background: migrationDialect === 'postgres' ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' : undefined,
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <span>🐘 PostgreSQL Production DDL (Enums + Indexes)</span>
              </button>
              <button
                onClick={() => setMigrationDialect('prisma')}
                className={`btn btn-sm ${migrationDialect === 'prisma' ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  background: migrationDialect === 'prisma' ? 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' : undefined,
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <span>💎 Prisma ORM (schema.prisma Models)</span>
              </button>
            </div>

            {/* Migration Summary Stats */}
            <div className="grid-4" style={{ marginBottom: '14px' }}>
              <div style={{ padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TOTAL TABLES</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {schema?.dataTypes.length || 0} Models
                </div>
              </div>
              <div style={{ padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>OPTION SET ENUMS</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                  {schema?.optionSets?.length || 0} Enums
                </div>
              </div>
              <div style={{ padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ROW LEVEL SECURITY</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                  {migrationDialect === 'supabase' ? 'Enabled (Auto)' : 'Native DDL'}
                </div>
              </div>
              <div style={{ padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PRIMARY KEYS</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                  UUID / _id
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Single Table Configuration */
          <div className="grid-2" style={{ marginBottom: '14px' }}>
            <div>
              <label className="input-label">Target Database Provider</label>
              <select value={exportDbTarget} onChange={e => setExportDbTarget(e.target.value as any)} className="select">
                <option value="sqlite">SQLite (Local .db / sql.js)</option>
                <option value="postgres">PostgreSQL Single Table</option>
                <option value="bigquery">Google BigQuery (Enterprise DWH)</option>
              </select>
            </div>
            <div>
              <label className="input-label">Data Type to Export</label>
              <select value={exportDbType} onChange={e => setExportDbType(e.target.value)} className="select">
                {schema?.dataTypes && schema.dataTypes.length > 0 ? (
                  schema.dataTypes.map(dt => (
                    <option key={dt.id || dt.name} value={dt.name}>{dt.name}</option>
                  ))
                ) : (
                  <option value="User">User</option>
                )}
              </select>
            </div>
          </div>
        )}

        {/* Code Output Viewer */}
        <pre style={{
          background: 'var(--bg-input)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.825rem',
          color: migrationDialect === 'prisma' && exportMode === 'full_migration' ? '#67e8f9' : '#fde047',
          overflowX: 'auto',
          maxHeight: '440px'
        }}>
          {generatedScript}
        </pre>
      </div>
    </div>
  );
};
