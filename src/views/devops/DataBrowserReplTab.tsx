import React, { useState } from 'react';
import { Search, Plus, Database, Table, Sparkles, RefreshCw } from 'lucide-react';
import { BubbleSchema, ProjectProfile, QueryConstraint, QueryResultPage } from '../../types';
import { DevOpsEngine } from '../../core/devops/devopsEngine';

interface DataBrowserReplTabProps {
  schema: BubbleSchema | null;
  activeProject?: ProjectProfile;
  onLog: (module: 'devops', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
  onNavigateToDataGrid?: () => void;
  onNavigateToSeeder?: () => void;
}

export const DataBrowserReplTab: React.FC<DataBrowserReplTabProps> = ({
  schema,
  activeProject,
  onLog,
  onNavigateToDataGrid,
  onNavigateToSeeder
}) => {
  const [queryType, setQueryType] = useState<string>(
    schema?.dataTypes && schema.dataTypes.length > 0 ? schema.dataTypes[0].name : 'User'
  );
  const [querySearch, setQuerySearch] = useState('');
  const [queryResults, setQueryResults] = useState<QueryResultPage | null>(null);
  const [queryConstraintKey, setQueryConstraintKey] = useState('');
  const [queryConstraintOp, setQueryConstraintOp] = useState<'equals' | 'not equal' | 'text contains' | 'greater than' | 'less than' | 'is_empty' | 'is_not_empty'>('equals');
  const [queryConstraintVal, setQueryConstraintVal] = useState('');
  const [activeConstraints, setActiveConstraints] = useState<QueryConstraint[]>([]);
  const [isFetchingQuery, setIsFetchingQuery] = useState(false);

  const handleRunQuery = async () => {
    if (!activeProject) return;
    setIsFetchingQuery(true);
    onLog('devops', `Executing live Bubble Data API query for table '${queryType}'...`);
    try {
      const res = await DevOpsEngine.queryTable(queryType, 0, 25, querySearch, activeConstraints, activeProject);
      setQueryResults(res);
      if (res.records.length > 0) {
        onLog('devops', `Live query returned ${res.records.length} of ${res.total} record(s) for '${queryType}'.`, 'success');
      } else {
        onLog('devops', `Query returned 0 records for '${queryType}'. Check Data API permissions in Bubble.`, 'info');
      }
    } catch (e: any) {
      onLog('devops', `Query error: ${e.message}`, 'error');
    } finally {
      setIsFetchingQuery(false);
    }
  };

  const handleAddConstraint = () => {
    if (!queryConstraintKey) return;
    const newConstraint: QueryConstraint = {
      key: queryConstraintKey,
      constraint_type: queryConstraintOp,
      value: queryConstraintVal
    };
    setActiveConstraints([...activeConstraints, newConstraint]);
    setQueryConstraintKey('');
    setQueryConstraintVal('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Search size={18} color="var(--primary)" />
              <span>Interactive Bubble Data REPL & Table Browser</span>
            </div>
            <div className="card-subtitle">Search, filter, and inspect records directly from your Bubble Data API in real-time</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: '160px' }}>
            <label className="input-label">Data Type</label>
            <select value={queryType} onChange={e => setQueryType(e.target.value)} className="select">
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
          <div style={{ flex: 1, minWidth: '220px' }}>
            <label className="input-label">Text Search</label>
            <input type="text" placeholder="Search any field..." value={querySearch} onChange={e => setQuerySearch(e.target.value)} className="input" />
          </div>
          <button onClick={handleRunQuery} disabled={isFetchingQuery} className="btn btn-primary btn-sm" style={{ marginTop: '22px', minWidth: '130px' }}>
            <Search size={14} className={isFetchingQuery ? 'spin' : ''} />
            <span>{isFetchingQuery ? 'Fetching...' : 'Fetch Records'}</span>
          </button>
        </div>

        {/* Constraint filter builder */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginTop: '12px', flexWrap: 'wrap' }}>
          <div>
            <label className="input-label">Field</label>
            <input type="text" placeholder="e.g. role, price" value={queryConstraintKey} onChange={e => setQueryConstraintKey(e.target.value)} className="input" style={{ width: '140px' }} />
          </div>
          <div>
            <label className="input-label">Constraint Operator</label>
            <select value={queryConstraintOp} onChange={e => setQueryConstraintOp(e.target.value as any)} className="select" style={{ width: '150px' }}>
              <option value="equals">equals</option>
              <option value="not equal">not equal</option>
              <option value="text contains">text contains</option>
              <option value="greater than">greater than</option>
              <option value="less than">less than</option>
              <option value="is_empty">is empty</option>
              <option value="is_not_empty">is not empty</option>
            </select>
          </div>
          <div>
            <label className="input-label">Value</label>
            <input type="text" placeholder="Filter value..." value={queryConstraintVal} onChange={e => setQueryConstraintVal(e.target.value)} className="input" style={{ width: '150px' }} />
          </div>
          <button onClick={handleAddConstraint} className="btn btn-secondary btn-sm" style={{ height: '38px' }}>
            <Plus size={13} />
            <span>Add Filter</span>
          </button>
        </div>

        {activeConstraints.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
            {activeConstraints.map((c, i) => (
              <span key={i} className="badge badge-cyan" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {c.key} {c.constraint_type} "{c.value}"
                <button onClick={() => setActiveConstraints(activeConstraints.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '10px' }}>✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Results Table */}
      {queryResults && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={16} color="var(--primary)" />
                <span>Results for <code>{queryResults.dataType}</code> ({queryResults.records.length} of {queryResults.total} records)</span>
              </div>
              <div className="card-subtitle" style={{ fontSize: '0.75rem', marginTop: '2px', color: 'var(--text-muted)' }}>
                Endpoint: <code>/api/1.1/obj/{queryResults.dataType.toLowerCase()}</code> • Environment: <code>{activeProject?.environment || 'version-test'}</code>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={onNavigateToDataGrid}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem' }}
              >
                <Table size={13} />
                <span>Open Full Data Grid</span>
              </button>
            </div>
          </div>

          {queryResults.records.length === 0 ? (
            <div style={{
              padding: '28px 20px',
              textAlign: 'center',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              margin: '12px 0'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)'
              }}>
                <Database size={20} />
              </div>

              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                  No live database records returned for "{queryResults.dataType}"
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto', lineHeight: 1.5 }}>
                  The Bubble Data API queried this endpoint successfully, but returned 0 rows. This means the table is either empty or reading is restricted by Bubble privacy rules.
                </p>
              </div>

              <div style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(0, 0, 0, 0.25)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textAlign: 'left',
                maxWidth: '560px',
                width: '100%',
                lineHeight: 1.6,
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>⚡ Checklist for Bubble Data API:</div>
                <div>1. Open <strong>Bubble Editor</strong> ➔ <strong>Settings (⚙️)</strong> ➔ <strong>API</strong> tab.</div>
                <div>2. Under <strong>"Data API"</strong>, verify that <strong>"{queryResults.dataType}"</strong> is checked.</div>
                <div>3. Check <strong>Data</strong> ➔ <strong>Privacy</strong> tab to verify your API token role can find and view fields.</div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  onClick={onNavigateToSeeder}
                  className="btn btn-secondary btn-sm"
                >
                  <Sparkles size={13} />
                  <span>Seed Sample Records</span>
                </button>
                <button
                  onClick={handleRunQuery}
                  disabled={isFetchingQuery}
                  className="btn btn-primary btn-sm"
                >
                  <RefreshCw size={13} className={isFetchingQuery ? 'spin' : ''} />
                  <span>Re-query Live Data</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    {Object.keys(queryResults.records[0]).map(k => (
                      <th key={k} style={{ padding: '8px 12px', fontWeight: 600 }}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queryResults.records.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      {Object.values(row).map((val: any, vIdx) => (
                        <td key={vIdx} style={{ padding: '8px 12px' }}>
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
