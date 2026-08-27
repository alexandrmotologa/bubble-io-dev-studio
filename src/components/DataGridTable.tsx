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
  Layers,
  AlertTriangle,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Copy,
  BookOpen,
  FileText,
  Code2
} from 'lucide-react';
import Papa from 'papaparse';
import { BubbleDataType, DataGridColumn, DataGridFilter, DataGridRecord, DataGridSort, ProjectProfile } from '../types';
import { DataGridEngine } from '../core/data-grid/dataGridEngine';
import { toast } from '../core/toast/toastManager';

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

  // Import Modal State (CSV & JSON)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importRawRows, setImportRawRows] = useState<any[]>([]);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatusText, setImportStatusText] = useState('');
  const [templateGuideTab, setTemplateGuideTab] = useState<'csv' | 'json' | 'rules'>('csv');
  const [templateCopied, setTemplateCopied] = useState(false);

  // Pagination State
  const [cursor, setCursor] = useState(0);
  const [limit, setLimit] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [apiStatus, setApiStatus] = useState<'exposed' | 'not_exposed' | 'unauthorized' | 'not_configured' | 'cors_blocked' | null>(null);
  const [apiMessage, setApiMessage] = useState<string | null>(null);

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
      setApiStatus(res.apiExposureStatus || null);
      setApiMessage(res.apiMessage || null);
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

  const handleFileSelected = (file: File) => {
    setImportFileName(file.name);
    const isJson = file.name.endsWith('.json');

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      let parsedRows: any[] = [];
      let headers: string[] = [];

      if (isJson) {
        try {
          const json = JSON.parse(content);
          if (Array.isArray(json)) {
            parsedRows = json;
          } else if (json[selectedType] && Array.isArray(json[selectedType])) {
            parsedRows = json[selectedType];
          } else {
            const firstArray = Object.values(json).find(v => Array.isArray(v)) as any[];
            parsedRows = firstArray || [json];
          }
          if (parsedRows.length > 0) {
            headers = Object.keys(parsedRows[0]);
          }
        } catch (err: any) {
          onLog('devops', `JSON parse error: ${err.message}`, 'error');
          return;
        }
      } else {
        // CSV Parsing via PapaParse
        const result = Papa.parse(content, { header: true, skipEmptyLines: true });
        parsedRows = result.data as any[];
        headers = result.meta.fields || [];
      }

      setImportRawRows(parsedRows);
      setImportHeaders(headers);

      // Auto-match headers to target fields
      const mapping: Record<string, string> = {};
      const fields = activeDtObj?.fields || [];
      for (const h of headers) {
        const cleanH = h.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        const matched = fields.find(f => f.name.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanH);
        if (matched) {
          mapping[h] = matched.name;
        } else {
          mapping[h] = h;
        }
      }
      setColumnMapping(mapping);
    };

    reader.readAsText(file);
  };

  const handleRunBatchImport = async () => {
    if (!project || importRawRows.length === 0 || isImporting) return;
    setIsImporting(true);
    setImportProgress(0);

    const toastId = toast.loading(
      `Importing ${importRawRows.length} records into ${selectedType}...`,
      'Preparing batch payload...'
    );

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < importRawRows.length; i++) {
        const rawRow = importRawRows[i];
        const payload: Record<string, any> = {};

        for (const [header, targetField] of Object.entries(columnMapping)) {
          if (!targetField || targetField === '__ignore__') continue;
          let val = rawRow[header];
          if (val === undefined || val === null || val === '') continue;

          // Type conversions based on target field
          const fieldDef = activeDtObj?.fields.find(f => f.name === targetField);
          if (fieldDef?.type === 'number') {
            const num = Number(val);
            if (!isNaN(num)) val = num;
          } else if (fieldDef?.type === 'boolean') {
            val = String(val).toLowerCase() === 'true' || val === '1' || val === true;
          }

          payload[targetField] = val;
        }

        const pct = Math.round(((i + 1) / importRawRows.length) * 100);
        setImportProgress(pct);
        setImportStatusText(`Inserting record ${i + 1} of ${importRawRows.length}...`);

        try {
          const res = await DataGridEngine.createRecord(project, selectedType, payload);
          if (res.success) {
            successCount++;
          } else {
            errorCount++;
            errors.push(`Row ${i + 1}: ${res.message}`);
          }
        } catch (rowErr: any) {
          errorCount++;
          errors.push(`Row ${i + 1}: ${rowErr.message}`);
        }

        // Small throttle to respect rate limits
        if (i % 5 === 0) {
          await new Promise(r => setTimeout(r, 60));
        }
      }

      await loadRecords();

      if (errorCount === 0) {
        toast.update(toastId, {
          type: 'success',
          title: `Import Completed! (${successCount} records)`,
          message: `Successfully imported ${successCount} record(s) into table '${selectedType}'.`,
          duration: 6000
        });
        onLog('devops', `Successfully imported ${successCount} records into ${selectedType}.`, 'success');
        setIsImportModalOpen(false);
        setImportRawRows([]);
        setImportFileName('');
      } else {
        toast.update(toastId, {
          type: 'warn',
          title: `Import Finished with Warnings (${successCount} OK, ${errorCount} Failed)`,
          message: `${successCount} created, ${errorCount} failed: ${errors[0] || ''}`,
          duration: 8000
        });
        onLog('devops', `Import finished: ${successCount} created, ${errorCount} failed.`, 'warn');
      }
    } catch (e: any) {
      toast.update(toastId, {
        type: 'error',
        title: 'Batch Import Failed',
        message: e.message
      });
      onLog('devops', `Batch import error: ${e.message}`, 'error');
    } finally {
      setIsImporting(false);
      setImportProgress(0);
      setImportStatusText('');
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

  const getSampleCsvSnippet = () => {
    const fields = activeDtObj?.fields || [];
    const headers = fields.map(f => `"${f.name}"`).join(',');
    const sampleRow = fields.map(f => {
      if (f.type === 'number') return '100';
      if (f.type === 'boolean') return 'true';
      if (f.name.toLowerCase().includes('email')) return '"john.doe@example.com"';
      return `"${f.name}_sample"`;
    }).join(',');
    return `${headers}\n${sampleRow}`;
  };

  const getSampleJsonSnippet = () => {
    const fields = activeDtObj?.fields || [];
    const sampleObj: Record<string, any> = {};
    for (const f of fields) {
      if (f.type === 'number') sampleObj[f.name] = 100;
      else if (f.type === 'boolean') sampleObj[f.name] = true;
      else if (f.name.toLowerCase().includes('email')) sampleObj[f.name] = 'john.doe@example.com';
      else sampleObj[f.name] = `Sample ${f.name}`;
    }
    return JSON.stringify([sampleObj], null, 2);
  };

  const handleDownloadSampleCsv = () => {
    const csvContent = getSampleCsvSnippet();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedType.toLowerCase()}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onLog('devops', `Downloaded sample CSV template for '${selectedType}'.`, 'info');
  };

  const handleDownloadSampleJson = () => {
    const jsonContent = getSampleJsonSnippet();
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedType.toLowerCase()}_template.json`;
    a.click();
    URL.revokeObjectURL(url);
    onLog('devops', `Downloaded sample JSON template for '${selectedType}'.`, 'info');
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

          <button onClick={() => setIsImportModalOpen(true)} className="btn btn-secondary btn-sm" title="Import CSV or JSON records">
            <Upload size={13} />
            <span>Import Data</span>
          </button>

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

      {/* Bubble Data API Exposure Warning Banner */}
      {apiStatus === 'not_exposed' && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          color: 'var(--text-primary)'
        }}>
          <div style={{ color: 'var(--accent-amber)', marginTop: '2px', flexShrink: 0 }}>
            <AlertTriangle size={18} />
          </div>
          <div style={{ flex: 1, fontSize: '0.8rem', lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '2px' }}>
              Data Type "{selectedType}" is not exposed in your Bubble Data API
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              Bubble returns <code>404 Not Found</code> for unexposed tables. To expose this data type:
            </div>
            <div style={{ margin: '6px 0 0 12px', color: 'var(--text-primary)', fontSize: '0.775rem' }}>
              <div>1. Open <strong>Bubble Editor</strong> ➔ <strong>Settings (⚙️)</strong> ➔ <strong>API</strong> tab.</div>
              <div>2. In the <strong>"Data API"</strong> section, check the box <strong>[✓] "{selectedType}"</strong>.</div>
              <div>3. In <strong>Data ➔ Privacy</strong>, ensure rules permit searching/reading.</div>
            </div>
          </div>
          {project && (
            <a
              href={`https://bubble.io/page?name=index&id=${project.appId}&tab=tabs-1`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.725rem', whiteSpace: 'nowrap' }}
            >
              <span>Open Bubble Settings</span>
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      )}

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
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setCursor(0);
            }}
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

      {/* Import Data Modal (CSV & JSON) */}
      {isImportModalOpen && (
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
          <div className="card" style={{ maxWidth: '680px', width: '100%', maxHeight: '88vh', overflowY: 'auto' }}>
            <div className="card-header">
              <div>
                <div className="card-title">
                  <Upload size={18} color="var(--primary)" />
                  <span>Import Data into: {selectedType}</span>
                </div>
                <div className="card-subtitle">Upload CSV or JSON file with automatic column mapping & schema validation</div>
              </div>
              <button onClick={() => { setIsImportModalOpen(false); setImportRawRows([]); setImportFileName(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
              {/* File Upload Dropzone */}
              {importRawRows.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div
                    style={{
                      border: '2px dashed var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '32px 20px',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.01)',
                      cursor: 'pointer'
                    }}
                    onClick={() => document.getElementById('data-grid-file-import')?.click()}
                  >
                    <FileSpreadsheet size={36} color="var(--primary)" style={{ margin: '0 auto 10px', display: 'block' }} />
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Click to select CSV or JSON file
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Supports RFC 4180 CSV exports and JSON arrays
                    </div>
                    <input
                      id="data-grid-file-import"
                      type="file"
                      accept=".csv,.json"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelected(file);
                      }}
                    />
                  </div>

                  {/* Sample Template Download Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(99, 102, 241, 0.05)',
                    border: '1px solid rgba(99, 102, 241, 0.15)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    fontSize: '0.775rem'
                  }}>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      Need a ready-to-use template for <strong>{selectedType}</strong>?
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleDownloadSampleCsv}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.725rem', padding: '3px 8px' }}
                      >
                        <Download size={12} />
                        <span>Download CSV</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadSampleJson}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.725rem', padding: '3px 8px' }}
                      >
                        <Download size={12} />
                        <span>Download JSON</span>
                      </button>
                    </div>
                  </div>

                  {/* Interactive Template Viewer & Syntax Guide */}
                  <div style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden'
                  }}>
                    {/* Header Tab Selector */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderBottom: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setTemplateGuideTab('csv')}
                          className={`btn btn-sm ${templateGuideTab === 'csv' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '0.725rem', padding: '3px 8px' }}
                        >
                          <FileText size={12} />
                          <span>CSV Format</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateGuideTab('json')}
                          className={`btn btn-sm ${templateGuideTab === 'json' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '0.725rem', padding: '3px 8px' }}
                        >
                          <Code2 size={12} />
                          <span>JSON Format</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateGuideTab('rules')}
                          className={`btn btn-sm ${templateGuideTab === 'rules' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '0.725rem', padding: '3px 8px' }}
                        >
                          <BookOpen size={12} />
                          <span>Syntax & Rules</span>
                        </button>
                      </div>

                      {templateGuideTab !== 'rules' && (
                        <button
                          type="button"
                          onClick={() => {
                            const snippet = templateGuideTab === 'csv' ? getSampleCsvSnippet() : getSampleJsonSnippet();
                            navigator.clipboard.writeText(snippet);
                            setTemplateCopied(true);
                            setTimeout(() => setTemplateCopied(false), 2000);
                            onLog('devops', `Copied ${templateGuideTab.toUpperCase()} template to clipboard.`, 'info');
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.725rem', padding: '3px 8px' }}
                          title="Copy template snippet to clipboard"
                        >
                          {templateCopied ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                          <span>{templateCopied ? 'Copied!' : 'Copy Code'}</span>
                        </button>
                      )}
                    </div>

                    {/* Body Content */}
                    <div style={{ padding: '12px', fontSize: '0.775rem' }}>
                      {templateGuideTab === 'csv' && (
                        <div>
                          <div style={{ color: 'var(--text-muted)', marginBottom: '6px', fontSize: '0.725rem' }}>
                            RFC 4180 standard CSV structure for table <strong>{selectedType}</strong>. First line is headers:
                          </div>
                          <pre style={{
                            margin: 0,
                            padding: '10px 12px',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: 'var(--radius-sm)',
                            fontFamily: 'var(--font-mono)',
                            color: '#38bdf8',
                            overflowX: 'auto',
                            maxHeight: '120px'
                          }}>
                            {getSampleCsvSnippet()}
                          </pre>
                        </div>
                      )}

                      {templateGuideTab === 'json' && (
                        <div>
                          <div style={{ color: 'var(--text-muted)', marginBottom: '6px', fontSize: '0.725rem' }}>
                            Standard JSON array of objects representing records for <strong>{selectedType}</strong>:
                          </div>
                          <pre style={{
                            margin: 0,
                            padding: '10px 12px',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: 'var(--radius-sm)',
                            fontFamily: 'var(--font-mono)',
                            color: '#a78bfa',
                            overflowX: 'auto',
                            maxHeight: '130px'
                          }}>
                            {getSampleJsonSnippet()}
                          </pre>
                        </div>
                      )}

                      {templateGuideTab === 'rules' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                          <div>• <strong>Auto Column Matching:</strong> Headers matching Bubble field names (case-insensitive) are mapped automatically.</div>
                          <div>• <strong>Type Casting:</strong> Numbers and booleans (<code>true</code> / <code>false</code>) are parsed into native Bubble field types.</div>
                          <div>• <strong>Automatic IDs:</strong> Do not supply <code>_id</code> in new records; Bubble automatically assigns unique 32-character identifiers and timestamps.</div>
                          <div>• <strong>Ignore Columns:</strong> Any extraneous column can be set to <code>-- Ignore / Do Not Import --</code> during column mapping.</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* File Info Bar */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--bg-input)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileSpreadsheet size={16} color="var(--accent-emerald)" />
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{importFileName}</span>
                      <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
                        {importRawRows.length} records detected
                      </span>
                    </div>
                    <button
                      onClick={() => { setImportRawRows([]); setImportFileName(''); }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                    >
                      Change File
                    </button>
                  </div>

                  {/* Exposure Warning */}
                  {apiStatus === 'not_exposed' && (
                    <div style={{
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 12px',
                      fontSize: '0.775rem',
                      color: 'var(--accent-amber)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <AlertTriangle size={15} />
                      <span>Note: '{selectedType}' is currently not exposed in Bubble Data API settings.</span>
                    </div>
                  )}

                  {/* Column Mapping Section */}
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                      Column Mapping (File Column ➔ Target Bubble Field)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                      {importHeaders.map(h => (
                        <div
                          key={h}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto 1fr',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          <span style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {h}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>➔</span>
                          <select
                            value={columnMapping[h] || '__ignore__'}
                            onChange={(e) => setColumnMapping({ ...columnMapping, [h]: e.target.value })}
                            className="select"
                            style={{ fontSize: '0.75rem', padding: '3px 8px', height: '28px' }}
                          >
                            <option value="__ignore__">-- Ignore / Do Not Import --</option>
                            {activeDtObj?.fields.map(f => (
                              <option key={f.name} value={f.name}>
                                {f.name} ({f.type})
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preview First 3 Rows */}
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                      Data Preview (First {Math.min(3, importRawRows.length)} rows)
                    </div>
                    <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.725rem' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-input)' }}>
                            {importHeaders.slice(0, 5).map(h => (
                              <th key={h} style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {importRawRows.slice(0, 3).map((row, rIdx) => (
                            <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                              {importHeaders.slice(0, 5).map(h => (
                                <td key={h} style={{ padding: '6px 8px', color: 'var(--text-secondary)' }}>
                                  {String(row[h] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Progress Bar when importing */}
                  {isImporting && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem' }}>
                        <span>{importStatusText}</span>
                        <span>{importProgress}%</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: `${importProgress}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #06b6d4)', transition: 'width 0.2s ease' }} />
                      </div>
                    </div>
                  )}

                  {/* Footer Modal Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => { setIsImportModalOpen(false); setImportRawRows([]); setImportFileName(''); }}
                      className="btn btn-secondary btn-sm"
                      disabled={isImporting}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleRunBatchImport}
                      disabled={isImporting || importRawRows.length === 0}
                      className="btn btn-primary btn-sm"
                    >
                      <Upload size={14} className={isImporting ? 'spin' : ''} />
                      <span>{isImporting ? 'Importing...' : `Start Batch Import (${importRawRows.length})`}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
