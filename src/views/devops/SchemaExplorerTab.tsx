import React, { useState } from 'react';
import { 
  Search, 
  Database, 
  Tag, 
  ChevronsUpDown, 
  ChevronsDownUp, 
  Zap, 
  RefreshCw, 
  Upload, 
  Code, 
  ChevronRight, 
  Copy 
} from 'lucide-react';
import { BubbleSchema, ProjectProfile } from '../../types';
import { toast } from '../../core/toast/toastManager';

interface SchemaExplorerTabProps {
  schema: BubbleSchema | null;
  activeProject?: ProjectProfile;
  isSyncingBubble: boolean;
  isFetchingSchema: boolean;
  on1ClickBubbleSync: () => void;
  onImportSchemaFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadTemplateSchema: () => void;
  onLoadSchema: () => void;
  onNavigateToDataGrid: (typeName: string) => void;
  onLog: (module: 'devops', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const SchemaExplorerTab: React.FC<SchemaExplorerTabProps> = ({
  schema,
  activeProject,
  isSyncingBubble,
  isFetchingSchema,
  on1ClickBubbleSync,
  onImportSchemaFile,
  onLoadTemplateSchema,
  onLoadSchema,
  onNavigateToDataGrid,
  onLog
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [schemaFilterType, setSchemaFilterType] = useState<'all' | 'tables' | 'option_sets'>('all');
  const [schemaSortMode, setSchemaSortMode] = useState<'name' | 'fields_desc' | 'fields_asc'>('name');
  const [collapsedTables, setCollapsedTables] = useState<Set<string>>(new Set());
  const [collapsedOptionSets, setCollapsedOptionSets] = useState<Set<string>>(new Set());

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
    onLog('devops', `Copied ${label} to clipboard.`, 'info');
  };

  const toggleCollapseTable = (id: string) => {
    setCollapsedTables(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleCollapseOptionSet = (name: string) => {
    setCollapsedOptionSets(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const expandAllTables = () => {
    setCollapsedTables(new Set());
    setCollapsedOptionSets(new Set());
  };

  const collapseAllTables = () => {
    if (!schema) return;
    setCollapsedTables(new Set(schema.dataTypes.map(d => d.id || d.name)));
    setCollapsedOptionSets(new Set(schema.optionSets.map(os => os.name)));
  };

  return (
    <div>
      {/* Header & Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search tables, fields or option values..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input"
              style={{ paddingLeft: '34px' }}
            />
          </div>

          {schema && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Category Filter Pills: All | Tables | Option Sets */}
              <div style={{
                display: 'flex',
                background: 'var(--bg-input)',
                padding: '2px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                gap: '2px'
              }}>
                <button
                  type="button"
                  onClick={() => setSchemaFilterType('all')}
                  className={`btn btn-sm ${schemaFilterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.725rem', padding: '4px 10px', border: 'none', borderRadius: '4px' }}
                >
                  <span>All ({schema.dataTypes.length + schema.optionSets.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSchemaFilterType('tables')}
                  className={`btn btn-sm ${schemaFilterType === 'tables' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.725rem', padding: '4px 10px', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Database size={11} />
                  <span>Data Tables ({schema.dataTypes.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSchemaFilterType('option_sets')}
                  className={`btn btn-sm ${schemaFilterType === 'option_sets' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.725rem', padding: '4px 10px', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Tag size={11} />
                  <span>Option Sets ({schema.optionSets.length})</span>
                </button>
              </div>

              {/* Sort Mode Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sort:</span>
                <select
                  value={schemaSortMode}
                  onChange={(e) => setSchemaSortMode(e.target.value as any)}
                  className="select"
                  style={{ fontSize: '0.7rem', padding: '3px 6px', width: 'auto' }}
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="fields_desc">Most Fields First</option>
                  <option value="fields_asc">Fewest Fields First</option>
                </select>
              </div>

              {/* Expand All / Collapse All Controls */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={expandAllTables}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                  title="Expand all table and option set lists"
                >
                  <ChevronsUpDown size={12} />
                  <span>Expand All</span>
                </button>
                <button
                  type="button"
                  onClick={collapseAllTables}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                  title="Collapse all table and option set lists"
                >
                  <ChevronsDownUp size={12} />
                  <span>Collapse All</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={on1ClickBubbleSync}
            disabled={isSyncingBubble}
            className="btn btn-primary btn-sm"
            title="Directly fetch the latest .bubble file from your Bubble Editor session"
          >
            <Zap size={12} className={isSyncingBubble ? 'spin' : ''} />
            <span>{isSyncingBubble ? 'Syncing...' : '⚡ 1-Click Sync from Bubble.io'}</span>
          </button>

          <button
            type="button"
            onClick={onLoadSchema}
            disabled={isFetchingSchema}
            className="btn btn-secondary btn-sm"
            title="Fetch live schema via Bubble Meta API"
          >
            <RefreshCw size={12} className={isFetchingSchema ? 'spin' : ''} />
            <span>{isFetchingSchema ? 'Fetching...' : 'Fetch Schema from Data API'}</span>
          </button>

          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
            <Upload size={12} />
            <span>Import .bubble File</span>
            <input
              type="file"
              accept=".json,.bubble"
              onChange={onImportSchemaFile}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {!schema || (schema.dataTypes.length === 0 && schema.optionSets.length === 0) ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px', background: 'var(--bg-card)' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            color: 'var(--primary)'
          }}>
            <Database size={24} />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            No Database Schema Loaded for {activeProject?.name || 'Workspace'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 16px', lineHeight: 1.5 }}>
            Sync your application file directly from your Bubble.io account with 1-click, or import an exported <code>.bubble</code> file.
          </p>

          {/* Instructions Pill Banner */}
          <div style={{ maxWidth: '540px', margin: '0 auto 20px', padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>💡 How to load your application schema:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span>1. <strong>⚡ 1-Click Direct Sync</strong>: Click <em>"1-Click Sync from Bubble.io"</em> below to automatically fetch your app file.</span>
              <span>2. <strong>Option B (Offline / Manual)</strong>: In Bubble Editor, go to <em>Settings ➔ General ➔ Export application</em> and import your <code>.bubble</code> file.</span>
              <span>3. <strong>Option C (Live API)</strong>: In Bubble Editor ➔ <em>Settings ➔ API</em>, check <em>"Enable Data API"</em>.</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={on1ClickBubbleSync}
              disabled={isSyncingBubble}
              className="btn btn-primary btn-sm"
              style={{ gap: '6px' }}
            >
              <Zap size={13} className={isSyncingBubble ? 'spin' : ''} />
              <span>{isSyncingBubble ? 'Syncing...' : '⚡ 1-Click Sync from Bubble.io'}</span>
            </button>

            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
              <Upload size={13} />
              <span>Import .bubble File</span>
              <input
                type="file"
                accept=".json,.bubble"
                onChange={onImportSchemaFile}
                style={{ display: 'none' }}
              />
            </label>

            <button onClick={onLoadTemplateSchema} className="btn btn-secondary btn-sm" style={{ color: 'var(--accent-cyan)' }}>
              <Code size={13} />
              <span>Load Template Schema for {activeProject?.appId || 'App'}</span>
            </button>

            <button onClick={onLoadSchema} disabled={isFetchingSchema} className="btn btn-secondary btn-sm">
              <RefreshCw size={13} className={isFetchingSchema ? 'spin' : ''} />
              <span>{isFetchingSchema ? 'Fetching...' : 'Retry Live Data API'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '48px' }}>
          {/* SECTION 1: DATA TABLES */}
          {(schemaFilterType === 'all' || schemaFilterType === 'tables') && (() => {
            const filteredTables = schema.dataTypes.filter(dt => 
              !searchTerm || 
              dt.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              dt.fields.some(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()) || f.type.toLowerCase().includes(searchTerm.toLowerCase()))
            );

            const sortedTables = [...filteredTables].sort((a, b) => {
              if (schemaSortMode === 'fields_desc') return b.fields.length - a.fields.length;
              if (schemaSortMode === 'fields_asc') return a.fields.length - b.fields.length;
              return a.name.localeCompare(b.name);
            });

            return (
              <div>
                {schemaFilterType === 'all' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Database size={16} color="var(--primary)" />
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Data Tables ({sortedTables.length} of {schema.dataTypes.length})
                      </h4>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Dynamic database tables and field definitions
                    </span>
                  </div>
                )}

                {sortedTables.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                    No Data Tables matching "{searchTerm}"
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
                    gap: '16px',
                    alignItems: 'start'
                  }}>
                    {sortedTables.map((dt) => {
                      const tableKey = dt.id || dt.name;
                      const isCollapsed = collapsedTables.has(tableKey);

                      return (
                        <div
                          key={dt.id || dt.name}
                          className="card"
                          style={{
                            padding: isCollapsed ? '12px 16px' : '16px 18px',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: isCollapsed ? '1px solid var(--border-subtle)' : '1px solid rgba(99, 102, 241, 0.45)',
                            background: isCollapsed ? 'var(--bg-card)' : 'rgba(99, 102, 241, 0.02)',
                            borderRadius: 'var(--radius-md)'
                          }}
                        >
                          {/* Header */}
                          <div
                            onClick={() => toggleCollapseTable(tableKey)}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              cursor: 'pointer',
                              userSelect: 'none',
                              paddingBottom: isCollapsed ? '0' : '12px',
                              borderBottom: isCollapsed ? 'none' : '1px solid var(--border-subtle)',
                              marginBottom: isCollapsed ? '0' : '12px',
                              gap: '10px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: '22px',
                                  height: '22px',
                                  minWidth: '22px',
                                  borderRadius: '5px',
                                  background: isCollapsed ? 'rgba(255, 255, 255, 0.05)' : 'rgba(99, 102, 241, 0.2)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: isCollapsed ? 'var(--text-muted)' : 'var(--primary)',
                                  transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                                  transition: 'transform 0.2s ease, background 0.2s ease',
                                  flexShrink: 0
                                }}
                              >
                                <ChevronRight size={13} />
                              </div>

                              <div
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  minWidth: '26px',
                                  borderRadius: '6px',
                                  background: 'rgba(99, 102, 241, 0.15)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}
                              >
                                <Database size={13} color="var(--primary)" />
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                <h3
                                  style={{
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                    margin: 0,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    minWidth: '40px'
                                  }}
                                  title={dt.name}
                                >
                                  {dt.name}
                                </h3>

                                {dt.recordCount && dt.recordCount > 0 ? (
                                  <span className="badge badge-cyan" style={{ fontSize: '0.625rem', padding: '1px 6px', flexShrink: 0 }}>
                                    {dt.recordCount.toLocaleString()} rows
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                              <span className="badge badge-indigo" style={{ fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                                {dt.fields.length} Fields
                              </span>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateToDataGrid(dt.name);
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.7rem', padding: '3px 9px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                                title={`Browse and edit records of ${dt.name} in Interactive Data Studio`}
                              >
                                <Search size={11} />
                                <span>Browse</span>
                              </button>
                            </div>
                          </div>

                          {/* Expanded Content Area */}
                          {!isCollapsed && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', color: 'var(--text-muted)', padding: '0 2px' }}>
                                <span>Schema Fields ({dt.fields.length})</span>
                                <span style={{ color: 'var(--accent-cyan)' }}>Live Data API Enabled</span>
                              </div>

                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '6px',
                                  maxHeight: dt.fields.length > 8 ? '320px' : 'none',
                                  overflowY: dt.fields.length > 8 ? 'auto' : 'visible',
                                  paddingRight: dt.fields.length > 8 ? '4px' : '0'
                                }}
                              >
                                {dt.fields.map((f, i) => {
                                  const isFieldMatch = searchTerm && (f.name.toLowerCase().includes(searchTerm.toLowerCase()) || f.type.toLowerCase().includes(searchTerm.toLowerCase()));
                                  return (
                                    <div
                                      key={i}
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '6px 10px',
                                        borderRadius: 'var(--radius-sm)',
                                        background: isFieldMatch ? 'rgba(99, 102, 241, 0.18)' : 'var(--bg-input)',
                                        border: isFieldMatch ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                                        fontSize: '0.775rem'
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <code style={{ color: isFieldMatch ? '#fff' : 'var(--text-primary)', fontWeight: 600 }}>{f.name}</code>
                                        {f.required && <span className="badge badge-rose" style={{ fontSize: '0.6rem', padding: '0 4px' }}>Required</span>}
                                      </div>
                                      <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.725rem' }}>
                                        {f.type}{f.isList ? '[]' : ''}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => onNavigateToDataGrid(dt.name)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '0.725rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)' }}
                                >
                                  <Search size={12} />
                                  <span>Open in Data Studio Table ➔</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* SECTION 2: OPTION SETS */}
          {(schemaFilterType === 'all' || schemaFilterType === 'option_sets') && (() => {
            const filteredOptionSets = (schema.optionSets || []).filter(os => 
              !searchTerm || 
              os.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              os.options.some(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()))
            );

            return (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tag size={16} color="var(--accent-amber)" />
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Option Sets & Global Enums ({filteredOptionSets.length} of {schema.optionSets.length})
                    </h4>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Predefined static choice lists and system enumerations
                  </span>
                </div>

                {filteredOptionSets.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                    {schema.optionSets.length === 0 ? 'No Option Sets defined in this blueprint or schema export.' : `No Option Sets matching "${searchTerm}"`}
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
                    gap: '16px',
                    alignItems: 'start'
                  }}>
                    {filteredOptionSets.map((os) => {
                      const isCollapsed = collapsedOptionSets.has(os.name);

                      return (
                        <div
                          key={os.name}
                          className="card"
                          style={{
                            padding: isCollapsed ? '12px 16px' : '16px 18px',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: isCollapsed ? '1px solid var(--border-subtle)' : '1px solid rgba(245, 158, 11, 0.45)',
                            background: isCollapsed ? 'var(--bg-card)' : 'rgba(245, 158, 11, 0.02)',
                            borderRadius: 'var(--radius-md)'
                          }}
                        >
                          {/* Header */}
                          <div
                            onClick={() => toggleCollapseOptionSet(os.name)}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              cursor: 'pointer',
                              userSelect: 'none',
                              paddingBottom: isCollapsed ? '0' : '12px',
                              borderBottom: isCollapsed ? 'none' : '1px solid var(--border-subtle)',
                              marginBottom: isCollapsed ? '0' : '12px',
                              gap: '10px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: '22px',
                                  height: '22px',
                                  minWidth: '22px',
                                  borderRadius: '5px',
                                  background: isCollapsed ? 'rgba(255, 255, 255, 0.05)' : 'rgba(245, 158, 11, 0.2)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: isCollapsed ? 'var(--text-muted)' : 'var(--accent-amber)',
                                  transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                                  transition: 'transform 0.2s ease, background 0.2s ease',
                                  flexShrink: 0
                                }}
                              >
                                <ChevronRight size={13} />
                              </div>

                              <div
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  minWidth: '26px',
                                  borderRadius: '6px',
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}
                              >
                                <Tag size={13} color="var(--accent-amber)" />
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                <h3
                                  style={{
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                    margin: 0,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    minWidth: '40px'
                                  }}
                                  title={os.name}
                                >
                                  {os.name}
                                </h3>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                              <span className="badge badge-amber" style={{ fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                                {os.options.length} Values
                              </span>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(JSON.stringify(os.options, null, 2), `${os.name} values`);
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.7rem', padding: '3px 9px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                                title={`Copy all ${os.options.length} option values as JSON`}
                              >
                                <Copy size={11} />
                                <span>Copy JSON</span>
                              </button>
                            </div>
                          </div>

                          {/* Expanded Content Area */}
                          {!isCollapsed && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', color: 'var(--text-muted)', padding: '0 2px' }}>
                                <span>Defined Choices ({os.options.length})</span>
                                <span>Click any pill to copy value</span>
                              </div>

                              <div
                                style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: '6px',
                                  maxHeight: os.options.length > 15 ? '260px' : 'none',
                                  overflowY: os.options.length > 15 ? 'auto' : 'visible',
                                  padding: '2px 0'
                                }}
                              >
                                {os.options.map((opt, oIdx) => {
                                  const isOptMatch = searchTerm && opt.toLowerCase().includes(searchTerm.toLowerCase());
                                  return (
                                    <span
                                      key={oIdx}
                                      onClick={() => handleCopy(opt, `value '${opt}'`)}
                                      style={{
                                        padding: '4px 10px',
                                        borderRadius: 'var(--radius-sm)',
                                        background: isOptMatch ? 'rgba(245, 158, 11, 0.25)' : 'var(--bg-input)',
                                        border: isOptMatch ? '1px solid var(--accent-amber)' : '1px solid var(--border-subtle)',
                                        fontSize: '0.775rem',
                                        color: isOptMatch ? '#fff' : 'var(--text-primary)',
                                        fontWeight: 500,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                      }}
                                      title={`Click to copy "${opt}"`}
                                    >
                                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-amber)', display: 'inline-block' }} />
                                      <code>{opt}</code>
                                    </span>
                                  );
                                })}
                              </div>

                              {os.options.length === 0 && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                                  No options defined in this Option Set.
                                </div>
                              )}

                              {os.options.length > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '6px', borderTop: '1px dashed var(--border-subtle)' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(os.options.map(o => `'${o}'`).join(' | '), `${os.name} TypeScript union`)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '0.7rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    title="Copy as TypeScript Union Type"
                                  >
                                    <Code size={11} />
                                    <span>Copy as TS Union</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleCopy(os.options.join(', '), `${os.name} CSV`)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '0.7rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    title="Copy as Comma-Separated Values"
                                  >
                                    <Copy size={11} />
                                    <span>Copy CSV</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
