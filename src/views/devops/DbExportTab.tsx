import React, { useState, useEffect } from 'react';
import { Database, Copy } from 'lucide-react';
import { BubbleSchema } from '../../types';
import { DbExporterEngine } from '../../core/devops/dbExporter';
import { toast } from '../../core/toast/toastManager';

interface DbExportTabProps {
  schema: BubbleSchema | null;
  sampleRecords?: any[];
  onLog?: (module: 'devops', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const DbExportTab: React.FC<DbExportTabProps> = ({
  schema,
  sampleRecords = [],
  onLog
}) => {
  const [exportDbTarget, setExportDbTarget] = useState<'sqlite' | 'postgres' | 'bigquery'>('sqlite');
  const [exportDbType, setExportDbType] = useState<string>(
    schema?.dataTypes && schema.dataTypes.length > 0 ? schema.dataTypes[0].name : 'User'
  );
  const [generatedDbScript, setGeneratedDbScript] = useState<string>('');

  useEffect(() => {
    if (!schema || schema.dataTypes.length === 0) {
      setGeneratedDbScript('-- No schema loaded to export database DDL/DML.');
      return;
    }
    const dt = schema.dataTypes.find(t => t.name.toLowerCase() === exportDbType.toLowerCase()) || schema.dataTypes[0];
    if (exportDbTarget === 'sqlite') {
      setGeneratedDbScript(DbExporterEngine.generateSqliteExport(dt, sampleRecords));
    } else if (exportDbTarget === 'postgres') {
      setGeneratedDbScript(DbExporterEngine.generatePostgresExport(dt, sampleRecords));
    } else {
      setGeneratedDbScript(DbExporterEngine.generateBigQueryExport(dt));
    }
  }, [schema, exportDbTarget, exportDbType, sampleRecords]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
    onLog?.('devops', `Copied ${label} to clipboard.`, 'info');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Database size={18} color="var(--accent-amber)" />
              <span>Database Exporter (SQLite, PostgreSQL, BigQuery)</span>
            </div>
            <div className="card-subtitle">Generate zero-compilation DDL table schemas and bulk upsert scripts</div>
          </div>
          <button onClick={() => handleCopy(generatedDbScript, 'DB Script')} className="btn btn-secondary btn-sm">
            <Copy size={13} />
            <span>Copy Script</span>
          </button>
        </div>

        <div className="grid-2" style={{ marginBottom: '12px' }}>
          <div>
            <label className="input-label">Target Database Provider</label>
            <select value={exportDbTarget} onChange={e => setExportDbTarget(e.target.value as any)} className="select">
              <option value="sqlite">SQLite (Local .db / sql.js)</option>
              <option value="postgres">PostgreSQL (Server / Supabase)</option>
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
                <>
                  <option value="User">User</option>
                  <option value="Product">Product</option>
                  <option value="Order">Order</option>
                  <option value="Category">Category</option>
                </>
              )}
            </select>
          </div>
        </div>

        <pre style={{
          background: 'var(--bg-input)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.825rem',
          color: '#fde047',
          overflowX: 'auto',
          maxHeight: '380px'
        }}>
          {generatedDbScript}
        </pre>
      </div>
    </div>
  );
};
