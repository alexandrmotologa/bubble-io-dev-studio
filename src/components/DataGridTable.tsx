import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  ArrowUpDown, 
  Check, 
  X, 
  Edit3, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { BubbleDataType, DataGridColumn, DataGridFilter, DataGridRecord, DataGridSort, ProjectProfile } from '../types';
import { DataGridEngine } from '../core/data-grid/dataGridEngine';

interface DataGridTableProps {
  project?: ProjectProfile;
  dataTypes: BubbleDataType[];
  activeDataType?: string;
  onLog: (module: 'devops', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const DataGridTable: React.FC<DataGridTableProps> = ({
  project,
  dataTypes,
  activeDataType: initialDataType,
  onLog
}) => {
  const [selectedType, setSelectedType] = useState<string>(initialDataType || dataTypes[0]?.name || 'User');
  const [records, setRecords] = useState<DataGridRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState<DataGridSort | null>(null);
  const [filters, setFilters] = useState<DataGridFilter[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Inline Cell Editing State
  const [editingCell, setEditingCell] = useState<{ recordId: string; field: string; value: any } | null>(null);
  const [isSavingCell, setIsSavingCell] = useState(false);

  // New Record Modal State
  const [isNewRecordModalOpen, setIsNewRecordModalOpen] = useState(false);
  const [newRecordData, setNewRecordData] = useState<Record<string, any>>({});
  const [isCreating, setIsCreating] = useState(false);

  // Pagination State
  const [cursor, setCursor] = useState(0);
  const [limit, setLimit] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (dataTypes.length > 0 && !dataTypes.some(d => d.name === selectedType)) {
      setSelectedType(dataTypes[0].name);
    }
  }, [dataTypes]);

  useEffect(() => {
    loadRecords();
  }, [selectedType, cursor, limit, sort]);

  const activeDtObj = dataTypes.find(d => d.name === selectedType);
  const columns: DataGridColumn[] = [
    { key: '_id', label: 'ID / Key', type: 'id', width: 140 },
    ...(activeDtObj?.fields.map(f => ({
      key: f.name,
      label: f.name.charAt(0).toUpperCase() + f.name.slice(1).replace(/_/g, ' '),
      type: f.type,
      required: f.required
    })) || [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'status', label: 'Status', type: 'text' }
    ]),
    { key: 'Created Date', label: 'Created Date', type: 'date', width: 160 },
    { key: 'Modified Date', label: 'Modified Date', type: 'date', width: 160 }
  ];

  const loadRecords = async () => {
    if (!project) return;
    setIsLoading(true);
    try {
      const res = await DataGridEngine.fetchRecords(project, selectedType, {
        limit,
        cursor,
        sort,
        filters,
        searchTerm
      });
      setRecords(res.records);
      setTotalCount(res.totalCount);
      setHasMore(res.hasMore);
    } catch (e: any) {
      onLog('devops', `Failed to load records for table '${selectedType}': ${e.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCellSave = async () => {
    if (!editingCell || !project) return;
    setIsSavingCell(true);
    try {
      const res = await DataGridEngine.updateRecordField(
        project,
        selectedType,
        editingCell.recordId,
        editingCell.field,
        editingCell.value
      );
      if (res.success) {
        setRecords(prev => prev.map(r => r._id === editingCell.recordId ? { ...r, [editingCell.field]: editingCell.value } : r));
        onLog('devops', `Updated '${selectedType}.${editingCell.field}' for ${editingCell.recordId}`, 'success');
      }
    } catch (e: any) {
      onLog('devops', `Cell update failed: ${e.message}`, 'error');
    } finally {
      setIsSavingCell(false);
      setEditingCell(null);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setIsCreating(true);
    try {
      const res = await DataGridEngine.createRecord(project, selectedType, newRecordData);
      if (res.success) {
        onLog('devops', `Created record in table '${selectedType}' (ID: ${res.recordId})`, 'success');
        setIsNewRecordModalOpen(false);
        setNewRecordData({});
        loadRecords();
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!project || !window.confirm(`Are you sure you want to delete record '${recordId}'?`)) return;
    try {
      const res = await DataGridEngine.deleteRecord(project, selectedType, recordId);
      if (res.success) {
        setRecords(prev => prev.filter(r => r._id !== recordId));
        setSelectedRowIds(prev => {
          const next = new Set(prev);
          next.delete(recordId);
          return next;
        });
        onLog('devops', `Deleted record ${recordId} from table '${selectedType}'`, 'info');
      }
    } catch (e: any) {
      onLog('devops', `Failed to delete record: ${e.message}`, 'error');
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedRowIds.size === records.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(records.map(r => r._id)));
    }
  };

  const handleExportCsv = () => {
    const targetRecords = selectedRowIds.size > 0 
      ? records.filter(r => selectedRowIds.has(r._id))
      : records;
    const csv = DataGridEngine.exportToCsv(columns, targetRecords);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bubble_${selectedType.toLowerCase()}_export_${Date.now()}.csv`;
    a.click();
    onLog('devops', `Exported ${targetRecords.length} records to CSV.`, 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Toolbar: Table Selector, Search, Filter & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Table Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database size={16} color="var(--primary)" />
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCursor(0);
                setSelectedRowIds(new Set());
              }}
              className="select"
              style={{ fontWeight: 700, padding: '6px 12px', minWidth: '160px' }}
            >
              {dataTypes.map(dt => (
                <option key={dt.id || dt.name} value={dt.name}>
                  {dt.name} {dt.recordCount ? `(${dt.recordCount})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Search */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={`Search ${selectedType}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadRecords()}
              className="input"
              style={{ paddingLeft: '30px', height: '32px', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedRowIds.size > 0 && (
            <span className="badge badge-indigo" style={{ fontSize: '0.75rem' }}>
              {selectedRowIds.size} Selected
            </span>
          )}

          <button onClick={handleExportCsv} className="btn btn-secondary btn-sm" title="Export to CSV">
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          <button onClick={() => setIsNewRecordModalOpen(true)} className="btn btn-primary btn-sm">
            <Plus size={13} />
            <span>New Record</span>
          </button>

          <button onClick={loadRecords} disabled={isLoading} className="btn btn-secondary btn-sm" title="Refresh Live Data">
            <RefreshCw size={13} className={isLoading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Interactive Table Grid */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        overflowX: 'auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ width: '40px', padding: '10px 12px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={records.length > 0 && selectedRowIds.size === records.length}
                  onChange={handleToggleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => {
                    if (col.key === '_id') return;
                    setSort(prev => prev?.field === col.key ? { field: col.key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { field: col.key, direction: 'asc' });
                  }}
                  style={{
                    padding: '10px 14px',
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: col.key === '_id' ? 'default' : 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{col.label}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 400 }}>({col.type})</span>
                    {sort?.field === col.key && (
                      <span style={{ color: 'var(--primary)' }}>{sort.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
              <th style={{ width: '60px', padding: '10px 12px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + 2} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  <RefreshCw size={20} className="spin" style={{ margin: '0 auto 8px' }} />
                  <div>Loading live records from Bubble Data API...</div>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  <Database size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No records found in table '{selectedType}'</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Click "New Record" to insert your first entry.</div>
                </td>
              </tr>
            ) : (
              records.map(record => {
                const isSelected = selectedRowIds.has(record._id);

                return (
                  <tr
                    key={record._id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                      transition: 'background 0.1s ease'
                    }}
                  >
                    <td style={{ textAlign: 'center', padding: '8px 12px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectRow(record._id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>

                    {columns.map(col => {
                      const isEditing = editingCell?.recordId === record._id && editingCell?.field === col.key;
                      const rawVal = record[col.key];
                      const displayVal = typeof rawVal === 'object' ? JSON.stringify(rawVal) : String(rawVal ?? '');

                      return (
                        <td
                          key={col.key}
                          onDoubleClick={() => {
                            if (col.key !== '_id' && !col.key.includes('Date')) {
                              setEditingCell({ recordId: record._id, field: col.key, value: rawVal ?? '' });
                            }
                          }}
                          style={{
                            padding: '8px 14px',
                            maxWidth: '260px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: col.key === '_id' || col.key.includes('Date') ? 'default' : 'pointer'
                          }}
                          title={displayVal}
                        >
                          {isEditing ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input
                                autoFocus
                                type={col.type === 'number' ? 'number' : 'text'}
                                value={editingCell.value}
                                onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCellSave();
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                className="input"
                                style={{ height: '26px', fontSize: '0.75rem', padding: '2px 6px' }}
                              />
                              <button onClick={handleCellSave} disabled={isSavingCell} className="btn btn-primary btn-sm" style={{ padding: '2px 6px', height: '26px' }}>
                                <Check size={11} />
                              </button>
                              <button onClick={() => setEditingCell(null)} className="btn btn-secondary btn-sm" style={{ padding: '2px 6px', height: '26px' }}>
                                <X size={11} />
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                              <span style={{ fontFamily: col.key === '_id' || col.key.includes('Date') ? 'var(--font-mono)' : 'inherit', fontSize: col.key === '_id' ? '0.75rem' : '0.8rem', color: col.key === '_id' ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                                {displayVal || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>null</span>}
                              </span>
                              {col.key !== '_id' && !col.key.includes('Date') && (
                                <Edit3
                                  size={11}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCell({ recordId: record._id, field: col.key, value: rawVal ?? '' });
                                  }}
                                  style={{ opacity: 0.3, cursor: 'pointer' }}
                                />
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    <td style={{ textAlign: 'center', padding: '8px 12px' }}>
                      <button
                        onClick={() => handleDeleteRecord(record._id)}
                        style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', opacity: 0.7 }}
                        title="Delete Record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Pagination Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <div>
          Showing <strong>{records.length}</strong> of <strong>{totalCount}</strong> records in <code>{selectedType}</code>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="select"
            style={{ fontSize: '0.75rem', padding: '2px 8px', height: '28px' }}
          >
            <option value="15">15 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>

          <button
            onClick={() => setCursor(Math.max(0, cursor - limit))}
            disabled={cursor === 0 || isLoading}
            className="btn btn-secondary btn-sm"
            style={{ padding: '4px 8px', height: '28px' }}
          >
            <ChevronLeft size={13} />
            <span>Prev</span>
          </button>

          <button
            onClick={() => setCursor(cursor + limit)}
            disabled={!hasMore || isLoading}
            className="btn btn-secondary btn-sm"
            style={{ padding: '4px 8px', height: '28px' }}
          >
            <span>Next</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* New Record Modal */}
      {isNewRecordModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="card-header">
              <div>
                <div className="card-title">
                  <Plus size={18} color="var(--primary)" />
                  <span>Insert New Record: {selectedType}</span>
                </div>
                <div className="card-subtitle">Fill in field values according to the table schema</div>
              </div>
              <button onClick={() => setIsNewRecordModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeDtObj?.fields.map(f => (
                <div key={f.name}>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{f.name} {f.required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{f.type}</span>
                  </label>
                  <input
                    type={f.type === 'number' ? 'number' : 'text'}
                    placeholder={`Enter ${f.name}...`}
                    value={newRecordData[f.name] ?? ''}
                    onChange={(e) => setNewRecordData({ ...newRecordData, [f.name]: e.target.value })}
                    required={f.required}
                    className="input"
                  />
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsNewRecordModalOpen(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={isCreating} className="btn btn-primary btn-sm">
                  <Check size={14} />
                  <span>{isCreating ? 'Creating...' : 'Insert Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
