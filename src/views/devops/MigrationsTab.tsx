import React, { useState } from 'react';
import { 
  GitCompare, 
  Plus, 
  History, 
  Download, 
  Code, 
  RotateCcw, 
  Focus, 
  Copy, 
  X 
} from 'lucide-react';
import { BubbleSchema, SchemaLockfile, SchemaMigration } from '../../types';
import { SchemaMigrationsEngine } from '../../core/devops/schemaMigrations';
import { toast } from '../../core/toast/toastManager';

interface MigrationsTabProps {
  schema: BubbleSchema | null;
  lockfile: SchemaLockfile | null;
  migrations: SchemaMigration[];
  onSetMigrations: (migrations: SchemaMigration[]) => void;
  onLog: (module: 'devops', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const MigrationsTab: React.FC<MigrationsTabProps> = ({
  schema,
  lockfile,
  migrations,
  onSetMigrations,
  onLog
}) => {
  const [newMigrationName, setNewMigrationName] = useState('');
  const [newMigrationDesc, setNewMigrationDesc] = useState('');
  const [migrationSqlDialect, setMigrationSqlDialect] = useState<'postgres' | 'mysql' | 'sqlite' | 'bigquery'>('postgres');
  const [selectedMigrationForVisualDiff, setSelectedMigrationForVisualDiff] = useState<SchemaMigration | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
    onLog('devops', `Copied ${label} to clipboard.`, 'info');
  };

  const handleGenerateMigration = () => {
    if (!schema || !lockfile) return;
    const mig = SchemaMigrationsEngine.generateMigration(
      newMigrationName || 'schema_update',
      newMigrationDesc || 'Manual migration tracking changes against baseline lockfile',
      schema,
      lockfile
    );
    onSetMigrations([mig, ...migrations]);
    setNewMigrationName('');
    setNewMigrationDesc('');
    toast.success(`Generated migration ${mig.version}_${mig.name}.json`);
    onLog('devops', `Generated migration '${mig.version}_${mig.name}.json' with ${mig.changes.length} declarative operation(s).`, 'success');
  };

  const handleDownloadLockfile = () => {
    if (!lockfile) return;
    const payload = JSON.stringify(lockfile, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema.lock.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded schema.lock.json`);
    onLog('devops', `Downloaded schema lockfile.`, 'success');
  };

  const handleDownloadMigrationJson = (migration: SchemaMigration) => {
    const payload = JSON.stringify(migration, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${migration.version}_${migration.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${migration.version}_${migration.name}.json`);
    onLog('devops', `Downloaded declarative migration JSON.`, 'success');
  };

  const handleDownloadMigrationSql = (migration: SchemaMigration) => {
    const sql = SchemaMigrationsEngine.generateSqlDdl(migration, migrationSqlDialect);
    const blob = new Blob([sql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${migration.version}_${migration.name}_${migrationSqlDialect}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${migration.version}_${migration.name}_${migrationSqlDialect}.sql`);
    onLog('devops', `Downloaded ${migrationSqlDialect.toUpperCase()} migration SQL.`, 'success');
  };

  const handleDownloadMigrationDownSql = (migration: SchemaMigration) => {
    const sql = SchemaMigrationsEngine.generateDownSqlDdl(migration, migrationSqlDialect);
    const blob = new Blob([sql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${migration.version}_${migration.name}_rollback_${migrationSqlDialect}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${migration.version}_${migration.name}_rollback_${migrationSqlDialect}.sql`);
    onLog('devops', `Downloaded Rollback SQL DDL (${migrationSqlDialect.toUpperCase()}).`, 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <GitCompare size={18} color="var(--primary)" />
              <span>Schema-as-Code Migration Generator</span>
            </div>
            <div className="card-subtitle">Track, version control, and compare schema changes against <code>migrations/schema.lock.json</code></div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <label className="input-label">Migration Name</label>
            <input
              type="text"
              placeholder="e.g. add_payment_tracking_fields"
              value={newMigrationName}
              onChange={e => setNewMigrationName(e.target.value)}
              className="input"
            />
          </div>
          <div style={{ flex: 2, minWidth: '300px' }}>
            <label className="input-label">Description / Rationale</label>
            <input
              type="text"
              placeholder="e.g. Added stripe_charge_id and invoice_pdf fields to Order table"
              value={newMigrationDesc}
              onChange={e => setNewMigrationDesc(e.target.value)}
              className="input"
            />
          </div>
          <button onClick={handleGenerateMigration} className="btn btn-primary btn-sm" style={{ height: '38px' }}>
            <Plus size={14} />
            <span>Generate Migration</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div className="card-title" style={{ margin: 0 }}>
            <History size={16} color="var(--primary)" />
            <span>Recorded Migration History ({migrations.length})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Dialect:</span>
              <select
                value={migrationSqlDialect}
                onChange={e => setMigrationSqlDialect(e.target.value as any)}
                className="select"
                style={{ fontSize: '0.75rem', padding: '3px 8px', height: '28px' }}
              >
                <option value="postgres">PostgreSQL (Supabase / Neon)</option>
                <option value="mysql">MySQL (PlanetScale / RDS)</option>
                <option value="sqlite">SQLite (Turso / Local)</option>
                <option value="bigquery">Google BigQuery DDL</option>
              </select>
            </div>

            {lockfile && (
              <button
                type="button"
                onClick={handleDownloadLockfile}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.725rem', padding: '3px 8px', height: '28px' }}
                title="Download schema.lock.json lockfile snapshot"
              >
                <Download size={12} />
                <span>Lockfile (.json)</span>
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {migrations.map(m => (
            <div key={m.version} style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="badge badge-indigo" style={{ fontFamily: 'var(--font-mono)' }}>{m.version}</span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{m.name}</strong>
                  <span className="badge badge-cyan">{m.environment}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedMigrationForVisualDiff(m)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.725rem', padding: '3px 8px', color: 'var(--accent-cyan)' }}
                    title="View Visual Diff & SQL preview"
                  >
                    <Focus size={12} />
                    <span>Visual Diff</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadMigrationJson(m)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.725rem', padding: '3px 8px' }}
                    title="Download declarative migration JSON"
                  >
                    <Download size={12} />
                    <span>JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadMigrationSql(m)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.725rem', padding: '3px 8px', color: 'var(--accent-emerald)' }}
                    title={`Download UP SQL DDL for ${migrationSqlDialect.toUpperCase()}`}
                  >
                    <Code size={12} />
                    <span>SQL (UP)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadMigrationDownSql(m)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.725rem', padding: '3px 8px', color: 'var(--accent-rose)' }}
                    title={`Download Rollback DOWN SQL DDL for ${migrationSqlDialect.toUpperCase()}`}
                  >
                    <RotateCcw size={12} />
                    <span>Rollback (DOWN)</span>
                  </button>

                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                    {new Date(m.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {m.description && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  {m.description}
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {m.changes.map((c, idx) => (
                  <span
                    key={idx}
                    className="badge badge-amber"
                    style={{ fontSize: '0.7rem', cursor: 'pointer' }}
                    onClick={() => setSelectedMigrationForVisualDiff(m)}
                    title="Click to view detailed change diff"
                  >
                    {c.action}: {c.table}{c.field ? `.${c.field}` : ''} {c.type ? `(${c.type})` : ''}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Migration Diff & SQL Inspector Modal */}
      {selectedMigrationForVisualDiff && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '680px',
            backgroundColor: 'var(--bg-surface-elevated, #121826)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: 'var(--radius-lg, 12px)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.15)',
            overflow: 'hidden',
            animation: 'modalSlideIn 0.2s ease-out'
          }}>
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(18, 24, 38, 0.9) 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary, #6366f1)'
                }}>
                  <Code size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Migration Visualizer: {selectedMigrationForVisualDiff.version}_{selectedMigrationForVisualDiff.name}
                  </h2>
                  <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                    Schema-as-Code Declarative & Multi-Dialect DDL
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMigrationForVisualDiff(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Changes List */}
              <div>
                <label className="input-label">Declarative Schema Operations ({selectedMigrationForVisualDiff.changes.length})</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                  {selectedMigrationForVisualDiff.changes.map((c, idx) => (
                    <div key={idx} style={{
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.75rem'
                    }}>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>
                        <strong>{c.table}</strong>{c.field ? `.${c.field}` : ''}
                      </span>
                      <span className={`badge ${c.action === 'ADD_FIELD' || c.action === 'ADD_TABLE' ? 'badge-emerald' : 'badge-amber'}`}>
                        {c.action} {c.type ? `(${c.type})` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SQL UP Preview */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="input-label" style={{ margin: 0 }}>Generated Forward SQL (UP) - {migrationSqlDialect.toUpperCase()}</label>
                  <button
                    type="button"
                    onClick={() => {
                      const sql = SchemaMigrationsEngine.generateSqlDdl(selectedMigrationForVisualDiff, migrationSqlDialect);
                      handleCopy(sql, 'UP SQL DDL');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                  >
                    <Copy size={11} />
                    <span>Copy UP SQL</span>
                  </button>
                </div>
                <pre style={{
                  margin: 0,
                  padding: '10px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.725rem',
                  color: 'var(--accent-emerald)',
                  overflowX: 'auto',
                  maxHeight: '140px'
                }}>
                  {SchemaMigrationsEngine.generateSqlDdl(selectedMigrationForVisualDiff, migrationSqlDialect)}
                </pre>
              </div>

              {/* SQL DOWN Rollback Preview */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="input-label" style={{ margin: 0 }}>Generated Rollback SQL (DOWN) - {migrationSqlDialect.toUpperCase()}</label>
                  <button
                    type="button"
                    onClick={() => {
                      const sql = SchemaMigrationsEngine.generateDownSqlDdl(selectedMigrationForVisualDiff, migrationSqlDialect);
                      handleCopy(sql, 'DOWN SQL DDL');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                  >
                    <Copy size={11} />
                    <span>Copy DOWN SQL</span>
                  </button>
                </div>
                <pre style={{
                  margin: 0,
                  padding: '10px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.725rem',
                  color: 'var(--accent-rose)',
                  overflowX: 'auto',
                  maxHeight: '120px'
                }}>
                  {SchemaMigrationsEngine.generateDownSqlDdl(selectedMigrationForVisualDiff, migrationSqlDialect)}
                </pre>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedMigrationForVisualDiff(null)}
                  className="btn btn-primary btn-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
