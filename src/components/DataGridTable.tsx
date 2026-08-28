import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
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
  Code2,
  Eye
} from 'lucide-react';
import Papa from 'papaparse';
import { BubbleDataType, DataGridColumn, DataGridFilter, DataGridRecord, DataGridSort, ProjectProfile } from '../types';
import { DataGridEngine } from '../core/data-grid/dataGridEngine';
import { toast } from '../core/toast/toastManager';

/**
 * Smart field resolver that matches Bubble Data API keys across naming variations,
 * type suffixes (e.g. "Pid text" -> "Pid" / "pid"), case-insensitivity and snake_case.
 */
export function resolveRecordValue(record: Record<string, any>, fieldKey: string): any {
  if (!record || typeof record !== 'object') return undefined;
  if (record[fieldKey] !== undefined) return record[fieldKey];

  const lowerKey = fieldKey.toLowerCase();
  const foundExact = Object.keys(record).find(k => k.toLowerCase() === lowerKey);
  if (foundExact !== undefined) return record[foundExact];

  const strippedKey = fieldKey.replace(/\s+(text|number|date|boolean|image|file|geo|user|list|custom)$/i, '').trim();
  if (strippedKey && record[strippedKey] !== undefined) return record[strippedKey];

  const foundStripped = Object.keys(record).find(k => k.toLowerCase() === strippedKey.toLowerCase());
  if (foundStripped !== undefined) return record[foundStripped];

  const targetAlpha = fieldKey.toLowerCase().replace(/[^a-z0-9]/g, '');
  const strippedAlpha = strippedKey.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const k of Object.keys(record)) {
    const kAlpha = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (kAlpha === targetAlpha || kAlpha === strippedAlpha) {
      return record[k];
    }
  }

  return undefined;
}

export function resolveRealFieldKey(record: Record<string, any>, fieldKey: string): string {
  if (!record || typeof record !== 'object') return fieldKey;
  if (record[fieldKey] !== undefined) return fieldKey;

  const lowerKey = fieldKey.toLowerCase();
  const foundExact = Object.keys(record).find(k => k.toLowerCase() === lowerKey);
  if (foundExact !== undefined) return foundExact;

  const strippedKey = fieldKey.replace(/\s+(text|number|date|boolean|image|file|geo|user|list|custom)$/i, '').trim();
  if (strippedKey && record[strippedKey] !== undefined) return strippedKey;

  const foundStripped = Object.keys(record).find(k => k.toLowerCase() === strippedKey.toLowerCase());
  if (foundStripped !== undefined) return foundStripped;

  const targetAlpha = fieldKey.toLowerCase().replace(/[^a-z0-9]/g, '');
  const strippedAlpha = strippedKey.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const k of Object.keys(record)) {
    const kAlpha = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (kAlpha === targetAlpha || kAlpha === strippedAlpha) {
      return k;
    }
  }

  return strippedKey || fieldKey;
}

/**
 * Shortens a long 32-char Bubble unique ID into a clean pill format (e.g. 17600401...758000)
 */
export function formatShortId(id: string): string {
  if (!id) return '';
  if (id.length <= 16) return id;
  return `${id.slice(0, 8)}...${id.slice(-6)}`;
}

/**
 * Cleanly formats any complex or primitive value for spreadsheet display
 */
export function formatDisplayValue(val: any): string {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);

  if (typeof val === 'object') {
    // Bubble User authentication object
    if (val.email?.email) return val.email.email;
    if (val.email && typeof val.email === 'string') return val.email;
    if (val.url && typeof val.url === 'string') return val.url;
    if (val.filename && typeof val.filename === 'string') return val.filename;
    if (Array.isArray(val)) {
      if (val.length === 0) return '[]';
      if (val.every(item => typeof item === 'string' || typeof item === 'number')) {
        return val.join(', ');
      }
      return `[${val.length} items]`;
    }
    return JSON.stringify(val);
  }

  return String(val);
}

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
  const [columnSearchTerm, setColumnSearchTerm] = useState<string>('');

  // Inline Cell Editing State
  const [editingCell, setEditingCell] = useState<{ recordId: string; field: string; value: any } | null>(null);
  const [isSavingCell, setIsSavingCell] = useState(false);

  // Record Inspector Modal State
  const [inspectingRecord, setInspectingRecord] = useState<DataGridRecord | null>(null);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalShowAll, setModalShowAll] = useState(false);

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

  // Export Menu & Full Table Bulk Export State
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isFullExportModalOpen, setIsFullExportModalOpen] = useState(false);
  const [fullExportProgress, setFullExportProgress] = useState<{ fetched: number; total: number; percent: number; statusText: string }>({ fetched: 0, total: 0, percent: 0, statusText: '' });
  const [isExportingFull, setIsExportingFull] = useState(false);
  const exportAbortControllerRef = useRef<AbortController | null>(null);

  // Pagination State
  const [cursor, setCursor] = useState(0);
  const [limit, setLimit] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [apiStatus, setApiStatus] = useState<'exposed' | 'not_exposed' | 'unauthorized' | 'not_configured' | 'cors_blocked' | null>(null);
  const [apiMessage, setApiMessage] = useState<string | null>(null);

  // Mouse Click & Drag Pan-to-Scroll State
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [isDraggingScroll, setIsDraggingScroll] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragScrollLeft, setDragScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('input, button, select, a, textarea, [data-interactive]') || target.tagName === 'INPUT' || target.tagName === 'BUTTON') {
      return;
    }
    if (!tableScrollRef.current) return;
    setIsDraggingScroll(true);
    setDragStartX(e.pageX - tableScrollRef.current.offsetLeft);
    setDragScrollLeft(tableScrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDraggingScroll(false);
  };

  const handleMouseUp = () => {
    setIsDraggingScroll(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingScroll || !tableScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableScrollRef.current.offsetLeft;
    const walk = (x - dragStartX) * 1.5;
    tableScrollRef.current.scrollLeft = dragScrollLeft - walk;
  };

  useEffect(() => {
    if (initialDataType && initialDataType !== selectedType) {
      setSelectedType(initialDataType);
      setCursor(0);
    }
  }, [initialDataType]);

  useEffect(() => {
    if (dataTypes.length > 0 && !dataTypes.some(d => d.name.toLowerCase() === selectedType.toLowerCase())) {
      setSelectedType(dataTypes[0].name);
    }
  }, [dataTypes]);

  useEffect(() => {
    loadRecords();
  }, [selectedType, cursor, limit, sort]);

  // Robust case-insensitive and custom. prefix matching for active DataType
  const activeDtObj = React.useMemo(() => {
    if (!dataTypes || dataTypes.length === 0) return undefined;
    const selNorm = selectedType.toLowerCase().replace(/^custom\./, '').trim();
    return dataTypes.find(d => {
      const dNorm = d.name.toLowerCase().replace(/^custom\./, '').trim();
      return dNorm === selNorm || d.name.toLowerCase() === selectedType.toLowerCase();
    }) || dataTypes[0];
  }, [dataTypes, selectedType]);
  
  // Dynamically build ALL columns including all 100+ schema fields and live record keys
  const columns: DataGridColumn[] = React.useMemo(() => {
    const colList: DataGridColumn[] = [];
    const addedKeys = new Set<string>();

    // 1. Always start with _id (220px width for ample breathing room)
    colList.push({ key: '_id', label: 'Unique ID', type: 'id', width: 220 });
    addedKeys.add('_id');

    // 2. Add ALL schema fields (e.g. all 105 fields defined in Bubble blueprint)
    if (activeDtObj?.fields && activeDtObj.fields.length > 0) {
      for (const f of activeDtObj.fields) {
        const cleanName = f.name.replace(/\s+(text|number|date|boolean|image|file|geo|user|list|custom)$/i, '').trim();
        const keyLower = f.name.toLowerCase();
        const cleanLower = cleanName.toLowerCase();

        if (cleanLower === '_id' || cleanLower === 'created date' || cleanLower === 'modified date') continue;

        if (!addedKeys.has(keyLower) && !addedKeys.has(cleanLower)) {
          let label = cleanName.replace(/_/g, ' ');
          label = label.charAt(0).toUpperCase() + label.slice(1);

          colList.push({
            key: f.name,
            label,
            type: f.type,
            required: f.required,
            width: 180
          });
          addedKeys.add(keyLower);
          addedKeys.add(cleanLower);
        }
      }
    }

    // 3. Add any extra keys discovered in live records (e.g. authentication object)
    if (records.length > 0) {
      for (const rec of records.slice(0, 10)) {
        for (const [k, v] of Object.entries(rec)) {
          const kLower = k.toLowerCase();
          const cleanK = k.replace(/\s+(text|number|date|boolean|image|file|geo|user|list|custom)$/i, '').trim().toLowerCase();

          if (k === '_id' || kLower === 'created date' || kLower === 'modified date') continue;

          if (!addedKeys.has(kLower) && !addedKeys.has(cleanK)) {
            let detectedType: DataGridColumn['type'] = 'text';
            if (typeof v === 'number') detectedType = 'number';
            else if (typeof v === 'boolean') detectedType = 'boolean';
            else if (kLower.includes('date')) detectedType = 'date';
            else if (Array.isArray(v)) detectedType = 'list';

            let label = k.replace(/_/g, ' ');
            if (k === 'authentication') label = 'Authentication (Email)';
            else label = label.charAt(0).toUpperCase() + label.slice(1);

            colList.push({
              key: k,
              label,
              type: detectedType,
              width: 180
            });
            addedKeys.add(kLower);
            addedKeys.add(cleanK);
          }
        }
      }
    }

    // Fallback if empty
    if (colList.length === 1) {
      colList.push({ key: 'name', label: 'Name', type: 'text', width: 180 });
      colList.push({ key: 'status', label: 'Status', type: 'text', width: 180 });
    }

    // 4. Always end with Created Date and Modified Date
    colList.push({ key: 'Created Date', label: 'Created Date', type: 'date', width: 160 });
    colList.push({ key: 'Modified Date', label: 'Modified Date', type: 'date', width: 160 });

    return colList;
  }, [records, activeDtObj, selectedType]);

  const visibleColumns: DataGridColumn[] = React.useMemo(() => {
    if (!columnSearchTerm.trim()) return columns;
    const q = columnSearchTerm.toLowerCase().trim();
    return columns.filter(col => {
      if (col.key === '_id') return true;
      return col.key.toLowerCase().includes(q) || col.label.toLowerCase().includes(q);
    });
  }, [columns, columnSearchTerm]);

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
      const targetRecord = records.find(r => r._id === editingCell.recordId);
      const realKey = targetRecord ? resolveRealFieldKey(targetRecord, editingCell.field) : editingCell.field;

      const res = await DataGridEngine.updateRecordField(
        project,
        selectedType,
        editingCell.recordId,
        realKey,
        editingCell.value
      );
      if (res.success) {
        setRecords(prev => prev.map(r => {
          if (r._id === editingCell.recordId) {
            return {
              ...r,
              [editingCell.field]: editingCell.value,
              [realKey]: editingCell.value
            };
          }
          return r;
        }));
        toast.success('Field Updated', `Updated '${realKey}' successfully.`);
        onLog('devops', `Updated '${selectedType}.${realKey}' for ${editingCell.recordId}`, 'success');
      }
    } catch (e: any) {
      toast.error('Update Failed', e.message);
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

  const downloadCsvBlob = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSelectedCsv = () => {
    setIsExportMenuOpen(false);
    if (selectedRowIds.size === 0) {
      toast.warn('No rows selected. Check row checkboxes to export selected.');
      return;
    }
    const targetRecords = records.filter(r => selectedRowIds.has(r._id));
    const csv = DataGridEngine.exportToCsv(columns, targetRecords);
    downloadCsvBlob(csv, `bubble_${selectedType.toLowerCase()}_selected_${targetRecords.length}_records_${Date.now()}.csv`);
    toast.success(`Exported ${targetRecords.length} selected record(s) to CSV.`);
    onLog('devops', `Exported ${targetRecords.length} selected records from '${selectedType}' to CSV.`, 'success');
  };

  const handleExportCurrentPageCsv = () => {
    setIsExportMenuOpen(false);
    if (records.length === 0) {
      toast.warn('No records on current page to export.');
      return;
    }
    const csv = DataGridEngine.exportToCsv(columns, records);
    downloadCsvBlob(csv, `bubble_${selectedType.toLowerCase()}_page_${cursor + 1}_to_${cursor + records.length}_${Date.now()}.csv`);
    toast.success(`Exported ${records.length} current page record(s) to CSV.`);
    onLog('devops', `Exported ${records.length} current page records from '${selectedType}' to CSV.`, 'success');
  };

  const handleStartFullExport = async () => {
    setIsExportMenuOpen(false);
    if (!project) {
      toast.error('No active Bubble project selected.');
      return;
    }
    setIsFullExportModalOpen(true);
    setIsExportingFull(true);
    setFullExportProgress({
      fetched: 0,
      total: totalCount || 0,
      percent: 0,
      statusText: 'Connecting to Bubble Data API and initializing stream...'
    });

    const abortController = new AbortController();
    exportAbortControllerRef.current = abortController;

    try {
      const res = await DataGridEngine.exportEntireTable(
        project,
        selectedType,
        columns,
        (p) => setFullExportProgress(p),
        abortController.signal
      );

      setIsExportingFull(false);

      if (res.success && res.csv) {
        downloadCsvBlob(res.csv, `bubble_${selectedType.toLowerCase()}_FULL_EXPORT_${res.totalExported}_records_${new Date().toISOString().slice(0, 10)}.csv`);
        toast.success(`🎉 Full table export completed! ${res.totalExported.toLocaleString()} records downloaded.`);
        onLog('devops', `Full table export finished: ${res.totalExported.toLocaleString()} records exported from '${selectedType}' to CSV.`, 'success');
        setTimeout(() => setIsFullExportModalOpen(false), 1200);
      } else {
        if (res.error) {
          toast.error(`Export error: ${res.error}`);
          onLog('devops', `Full table export failed: ${res.error}`, 'error');
        }
      }
    } catch (e: any) {
      setIsExportingFull(false);
      toast.error(`Full table export error: ${e.message}`);
      onLog('devops', `Full table export error: ${e.message}`, 'error');
    }
  };

  const handleCancelFullExport = () => {
    if (exportAbortControllerRef.current) {
      exportAbortControllerRef.current.abort();
      toast.info('Export process cancelled by user.');
    }
    setIsExportingFull(false);
    setIsFullExportModalOpen(false);
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

          {/* Export Dropdown Menu */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Export CSV Options"
            >
              <Download size={13} />
              <span>Export CSV</span>
              <ChevronDown size={12} style={{ transform: isExportMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
            </button>

            {isExportMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '6px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
                  width: '260px',
                  zIndex: 999,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '6px'
                }}
              >
                <button
                  type="button"
                  onClick={handleExportSelectedCsv}
                  disabled={selectedRowIds.size === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: 'transparent',
                    color: selectedRowIds.size > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                    cursor: selectedRowIds.size > 0 ? 'pointer' : 'not-allowed',
                    fontSize: '0.8rem',
                    textAlign: 'left',
                    opacity: selectedRowIds.size > 0 ? 1 : 0.5
                  }}
                  onMouseEnter={(e) => { if (selectedRowIds.size > 0) e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={14} color="var(--primary)" />
                    <span>Export Selected</span>
                  </div>
                  <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                    {selectedRowIds.size} rows
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCurrentPageCsv}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileSpreadsheet size={14} color="var(--accent-cyan)" />
                    <span>Export Current Page</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {records.length} rows
                  </span>
                </button>

                <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />

                <button
                  type="button"
                  onClick={handleStartFullExport}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: 'rgba(99, 102, 241, 0.08)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.18)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={14} color="var(--primary)" />
                    <span>Export Entire Table</span>
                  </div>
                  <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                    All Records
                  </span>
                </button>
              </div>
            )}
          </div>

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

      {/* Scroll Hint, Column Count & Instant Column Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', color: 'var(--text-muted)', padding: '0 4px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>
            Showing <strong>{visibleColumns.length}</strong> of <strong>{columns.length}</strong> fields • Double-click cell to edit
          </span>
          {columnSearchTerm && (
            <span className="badge badge-indigo" style={{ fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>Filtered by: "{columnSearchTerm}"</span>
              <button
                type="button"
                onClick={() => setColumnSearchTerm('')}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, display: 'flex' }}
                title="Clear column filter"
              >
                <X size={10} />
              </button>
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Quick Jump / Filter Columns Input */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={`Filter ${columns.length} columns...`}
              value={columnSearchTerm}
              onChange={(e) => setColumnSearchTerm(e.target.value)}
              className="input"
              style={{ paddingLeft: '26px', fontSize: '0.75rem', padding: '3px 8px 3px 26px', height: '26px' }}
            />
            {columnSearchTerm && (
              <button
                type="button"
                onClick={() => setColumnSearchTerm('')}
                style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)' }}>
            <span style={{ background: 'rgba(6, 182, 212, 0.08)', padding: '2px 10px', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
              ↔️ Drag to Pan columns
            </span>
          </span>
        </div>
      </div>

      {/* Main Interactive Table Grid with Smooth Horizontal Scroll & Drag-to-Pan */}
      <div
        ref={tableScrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className="data-grid-scroll-container"
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          overflowX: 'auto',
          overflowY: 'auto',
          maxHeight: '680px',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          position: 'relative',
          cursor: isDraggingScroll ? 'grabbing' : 'default',
          userSelect: isDraggingScroll ? 'none' : 'auto'
        }}
      >
        <table style={{ minWidth: `${Math.max(1200, visibleColumns.length * 180)}px`, width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.8rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-input)' }}>
              <th style={{
                width: '44px',
                minWidth: '44px',
                padding: '10px 12px',
                textAlign: 'center',
                position: 'sticky',
                left: 0,
                top: 0,
                zIndex: 12,
                background: 'var(--bg-input)',
                borderBottom: '1px solid var(--border-subtle)'
              }}>
                <input
                  type="checkbox"
                  checked={records.length > 0 && selectedRowIds.size === records.length}
                  onChange={handleToggleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              {visibleColumns.map(col => {
                const isId = col.key === '_id';
                return (
                  <th
                    key={col.key}
                    onClick={() => {
                      if (isId) return;
                      setSort(prev => prev?.field === col.key ? { field: col.key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { field: col.key, direction: 'asc' });
                    }}
                    style={{
                      padding: '10px 14px',
                      color: 'var(--text-secondary)',
                      fontWeight: 700,
                      cursor: isId ? 'default' : 'pointer',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                      width: isId ? '220px' : '180px',
                      minWidth: isId ? '220px' : '180px',
                      position: 'sticky',
                      top: 0,
                      left: isId ? '44px' : undefined,
                      zIndex: isId ? 12 : 10,
                      background: 'var(--bg-input)',
                      borderBottom: '1px solid var(--border-subtle)',
                      borderRight: isId ? '1px solid var(--border-subtle)' : undefined,
                      boxShadow: isId ? '4px 0 8px rgba(0,0,0,0.1)' : undefined
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
                );
              })}
              <th style={{
                width: '80px',
                minWidth: '80px',
                padding: '10px 12px',
                textAlign: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                background: 'var(--bg-input)',
                borderBottom: '1px solid var(--border-subtle)'
              }}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={visibleColumns.length + 2} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  <RefreshCw size={20} className="spin" style={{ margin: '0 auto 8px' }} />
                  <div>Loading live records from Bubble Data API...</div>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 2} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
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
                      background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                      transition: 'background 0.1s ease'
                    }}
                  >
                    <td style={{
                      textAlign: 'center',
                      padding: '8px 12px',
                      position: 'sticky',
                      left: 0,
                      zIndex: 2,
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)',
                      borderBottom: '1px solid var(--border-subtle)'
                    }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectRow(record._id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>

                    {visibleColumns.map(col => {
                      const isId = col.key === '_id';
                      const isEditing = editingCell?.recordId === record._id && editingCell?.field === col.key;
                      const rawVal = isId ? record._id : (record[col.key] !== undefined ? record[col.key] : resolveRecordValue(record, col.key));
                      const displayVal = formatDisplayValue(rawVal);

                      return (
                        <td
                          key={col.key}
                          onDoubleClick={() => {
                            if (!isId && !col.key.includes('Date')) {
                              setEditingCell({ recordId: record._id, field: col.key, value: rawVal ?? '' });
                            }
                          }}
                          style={{
                            padding: isId ? '8px 12px' : '8px 14px',
                            width: isId ? '220px' : '180px',
                            minWidth: isId ? '220px' : '180px',
                            maxWidth: isId ? '220px' : '340px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: isId || col.key.includes('Date') ? 'default' : 'pointer',
                            position: isId ? 'sticky' : undefined,
                            left: isId ? '44px' : undefined,
                            zIndex: isId ? 2 : 1,
                            background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)',
                            borderBottom: '1px solid var(--border-subtle)',
                            borderRight: isId ? '1px solid var(--border-subtle)' : undefined,
                            boxShadow: isId ? '4px 0 8px rgba(0,0,0,0.06)' : undefined
                          }}
                          title={isId ? record._id : displayVal}
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
                                style={{ height: '26px', fontSize: '0.75rem', padding: '2px 6px', width: '100%' }}
                              />
                              <button onClick={handleCellSave} disabled={isSavingCell} className="btn btn-primary btn-sm" style={{ padding: '2px 6px', height: '26px' }}>
                                <Check size={11} />
                              </button>
                              <button onClick={() => setEditingCell(null)} className="btn btn-secondary btn-sm" style={{ padding: '2px 6px', height: '26px' }}>
                                <X size={11} />
                              </button>
                            </div>
                          ) : isId ? (
                            <span
                              onClick={() => setInspectingRecord(record)}
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.725rem',
                                color: 'var(--accent-cyan)',
                                cursor: 'pointer',
                                background: 'rgba(6, 182, 212, 0.08)',
                                padding: '3px 10px',
                                borderRadius: '5px',
                                border: '1px solid rgba(6, 182, 212, 0.25)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                whiteSpace: 'nowrap'
                              }}
                              title={`Click to inspect full ID: ${record._id}`}
                            >
                              <span>{formatShortId(record._id)}</span>
                              <Eye size={11} style={{ opacity: 0.8 }} />
                            </span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                              <span style={{
                                fontFamily: col.key.includes('Date') ? 'var(--font-mono)' : 'inherit',
                                fontSize: '0.8rem',
                                color: 'var(--text-primary)'
                              }}>
                                {displayVal ? (
                                  displayVal
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', opacity: 0.4 }}>null</span>
                                )}
                              </span>
                              {!col.key.includes('Date') && (
                                <Edit3
                                  size={11}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCell({ recordId: record._id, field: col.key, value: rawVal ?? '' });
                                  }}
                                  style={{ opacity: 0.3, cursor: 'pointer', flexShrink: 0 }}
                                />
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    <td style={{
                      textAlign: 'center',
                      padding: '8px 12px',
                      borderBottom: '1px solid var(--border-subtle)',
                      whiteSpace: 'nowrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button
                          onClick={() => setInspectingRecord(record)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', opacity: 0.8 }}
                          title="Inspect Full Record"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(record._id)}
                          style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', opacity: 0.7 }}
                          title="Delete Record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Pagination Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.775rem',
        color: 'var(--text-secondary)',
        background: 'var(--bg-surface-elevated)',
        padding: '10px 16px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
        marginTop: '6px',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>
            Showing <strong>{records.length > 0 ? cursor + 1 : 0} - {Math.min(totalCount, cursor + records.length)}</strong> of <strong>{totalCount.toLocaleString()}</strong> records in <code>{selectedType}</code>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setCursor(0);
            }}
            className="select"
            style={{ fontSize: '0.75rem', padding: '4px 10px', height: '30px', width: 'auto' }}
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
            style={{ padding: '4px 12px', height: '30px' }}
          >
            <ChevronLeft size={13} />
            <span>Prev</span>
          </button>

          <button
            onClick={() => setCursor(cursor + limit)}
            disabled={!hasMore || isLoading}
            className="btn btn-secondary btn-sm"
            style={{ padding: '4px 12px', height: '30px' }}
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

      {/* Record Details Inspector Modal */}
      {inspectingRecord && (() => {
        // Collect all schema fields + record keys
        const allFieldEntries: { key: string; label: string; type: string; value: any; isPopulated: boolean }[] = [];
        const seenKeys = new Set<string>();

        // 1. Schema fields (all 105 fields from Bubble blueprint!)
        if (activeDtObj?.fields && activeDtObj.fields.length > 0) {
          for (const f of activeDtObj.fields) {
            const cleanName = f.name.replace(/\s+(text|number|date|boolean|image|file|geo|user|list|custom)$/i, '').trim();
            const val = resolveRecordValue(inspectingRecord, f.name);
            const isPop = val !== null && val !== undefined && val !== '';
            
            let label = cleanName.replace(/_/g, ' ');
            label = label.charAt(0).toUpperCase() + label.slice(1);

            allFieldEntries.push({
              key: f.name,
              label,
              type: f.type,
              value: val,
              isPopulated: isPop
            });
            seenKeys.add(f.name.toLowerCase());
            seenKeys.add(cleanName.toLowerCase());
          }
        }

        // 2. Extra keys in inspectingRecord not in schema
        for (const [k, v] of Object.entries(inspectingRecord)) {
          if (k === '_id') continue;
          const kLower = k.toLowerCase();
          const cleanK = k.replace(/\s+(text|number|date|boolean|image|file|geo|user|list|custom)$/i, '').trim().toLowerCase();
          if (!seenKeys.has(kLower) && !seenKeys.has(cleanK)) {
            let label = k.replace(/_/g, ' ');
            if (k === 'authentication') label = 'Authentication (Email)';
            else label = label.charAt(0).toUpperCase() + label.slice(1);

            allFieldEntries.push({
              key: k,
              label,
              type: typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : 'text',
              value: v,
              isPopulated: v !== null && v !== undefined && v !== ''
            });
            seenKeys.add(kLower);
            seenKeys.add(cleanK);
          }
        }

        const populatedCount = allFieldEntries.filter(f => f.isPopulated).length;
        const totalCount = allFieldEntries.length;

        // Filter based on modalSearchTerm
        const filteredEntries = allFieldEntries.filter(f => {
          if (!modalSearchTerm) return true;
          const searchNorm = modalSearchTerm.toLowerCase();
          const strVal = formatDisplayValue(f.value).toLowerCase();
          return f.key.toLowerCase().includes(searchNorm) || f.label.toLowerCase().includes(searchNorm) || strVal.includes(searchNorm);
        });

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <div className="card" style={{
              width: '100%',
              maxWidth: '850px',
              height: '85vh',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              border: '1px solid var(--border-subtle)'
            }}>
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Eye size={20} color="var(--accent-cyan)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Record Details ({selectedType})</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                        {inspectingRecord._id}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(inspectingRecord._id);
                          toast.success('ID Copied!');
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        title="Copy ID"
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(inspectingRecord, null, 2));
                      toast.success('JSON Copied to Clipboard!');
                    }}
                    className="btn btn-secondary btn-sm"
                    title="Copy full JSON"
                  >
                    <Copy size={12} />
                    <span>Copy JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setInspectingRecord(null); setModalSearchTerm(''); }}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Search & Summary Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder={`Search among all ${totalCount} fields (e.g. balance, email, wallet, solana)...`}
                    value={modalSearchTerm}
                    onChange={(e) => setModalSearchTerm(e.target.value)}
                    className="input"
                    style={{ paddingLeft: '30px', height: '34px', fontSize: '0.775rem', width: '100%' }}
                  />
                  {modalSearchTerm && (
                    <button
                      onClick={() => setModalSearchTerm('')}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  <strong>{populatedCount}</strong> filled • <strong>{totalCount}</strong> total schema fields
                </div>
              </div>

              {/* Modal Body: Scrollable Table Container */}
              <div
                className="data-grid-scroll-container"
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)'
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.775rem' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface-elevated)', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                    <tr style={{ textAlign: 'left' }}>
                      <th style={{ padding: '9px 12px', width: '38%', color: 'var(--text-secondary)', fontWeight: 700, borderBottom: '1px solid var(--border-subtle)' }}>Field Name</th>
                      <th style={{ padding: '9px 12px', color: 'var(--text-secondary)', fontWeight: 700, borderBottom: '1px solid var(--border-subtle)' }}>Value</th>
                      <th style={{ width: '44px', padding: '9px 12px', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Unique ID row */}
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(6, 182, 212, 0.04)' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>_id (Unique ID)</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)', fontWeight: 400 }}>(id)</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', borderBottom: '1px solid var(--border-subtle)' }}>
                        {inspectingRecord._id}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(inspectingRecord._id);
                            toast.success('ID Copied!');
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                          title="Copy ID"
                        >
                          <Copy size={12} />
                        </button>
                      </td>
                    </tr>

                    {/* All other schema & record fields */}
                    {filteredEntries.map((field) => {
                      const displayVal = formatDisplayValue(field.value);
                      const isNull = !field.isPopulated;

                      return (
                        <tr key={field.key} style={{ background: isNull ? 'transparent' : 'rgba(99, 102, 241, 0.04)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{field.label}</span>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 400 }}>({field.type})</span>
                            </div>
                          </td>
                          <td style={{
                            padding: '8px 12px',
                            color: isNull ? 'var(--text-muted)' : 'var(--text-primary)',
                            fontStyle: isNull ? 'italic' : 'normal',
                            fontWeight: isNull ? 400 : 500,
                            wordBreak: 'break-all',
                            borderBottom: '1px solid var(--border-subtle)'
                          }}>
                            {isNull ? (
                              <span style={{ opacity: 0.35 }}>null</span>
                            ) : (
                              displayVal
                            )}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
                            {!isNull && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(displayVal);
                                  toast.success(`Copied ${field.label}!`);
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                title={`Copy ${field.label}`}
                              >
                                <Copy size={12} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {filteredEntries.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No fields matching '{modalSearchTerm}'
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', flexShrink: 0 }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  Showing <strong>{filteredEntries.length}</strong> of <strong>{totalCount}</strong> fields
                </div>
                <button
                  type="button"
                  onClick={() => { setInspectingRecord(null); setModalSearchTerm(''); }}
                  className="btn btn-secondary btn-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Full Table Bulk Export Progress Modal */}
      {isFullExportModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '520px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)',
            border: '1px solid var(--border-subtle)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={20} color="var(--primary)" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    Export Entire Table: {selectedType}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    Streaming full dataset via Bubble Data API (100 records/batch)
                  </div>
                </div>
              </div>

              {!isExportingFull && (
                <button
                  type="button"
                  onClick={() => setIsFullExportModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '6px' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Progress Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {fullExportProgress.statusText || 'Exporting records...'}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {fullExportProgress.percent}%
                </span>
              </div>

              {/* Progress Track */}
              <div style={{
                height: '10px',
                background: 'var(--bg-input)',
                borderRadius: '99px',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.max(3, fullExportProgress.percent)}%`,
                  background: 'linear-gradient(90deg, var(--primary), var(--accent-cyan))',
                  borderRadius: '99px',
                  transition: 'width 0.2s ease',
                  boxShadow: '0 0 12px var(--primary-glow)'
                }} />
              </div>

              {/* Statistics Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                background: 'var(--bg-input)',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                marginTop: '4px'
              }}>
                <div>
                  <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Records Downloaded
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    {fullExportProgress.fetched.toLocaleString()}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Estimated Total
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    {fullExportProgress.total > 0 ? fullExportProgress.total.toLocaleString() : 'Counting...'}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              {isExportingFull ? (
                <button
                  type="button"
                  onClick={handleCancelFullExport}
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--accent-rose)' }}
                >
                  <X size={13} />
                  <span>Cancel / Stop Export</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsFullExportModalOpen(false)}
                  className="btn btn-primary btn-sm"
                >
                  <Check size={13} />
                  <span>Done</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Record Inspector Drawer / Modal */}
      {inspectingRecord && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '780px',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)',
            border: '1px solid var(--border-subtle)',
            padding: '20px'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Eye size={20} color="var(--accent-cyan)" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Record Details: {selectedType}</span>
                    <span className="badge badge-indigo" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                      {inspectingRecord._id}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Vertical inspector across all fields for quick auditing & copying
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(inspectingRecord, null, 2));
                    toast.success('Record JSON copied to clipboard!');
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Copy size={12} />
                  <span>Copy JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectingRecord(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Search within Record Fields */}
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search within this record's fields and values..."
                value={modalSearchTerm}
                onChange={(e) => setModalSearchTerm(e.target.value)}
                className="input"
                style={{ paddingLeft: '30px', fontSize: '0.75rem', padding: '6px 10px 6px 30px' }}
              />
            </div>

            {/* Fields List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingRight: '4px',
              maxHeight: '480px'
            }}>
              {columns
                .filter(col => {
                  if (!modalSearchTerm.trim()) return true;
                  const q = modalSearchTerm.toLowerCase();
                  const rawVal = col.key === '_id' ? inspectingRecord._id : resolveRecordValue(inspectingRecord, col.key);
                  const strVal = String(rawVal ?? '').toLowerCase();
                  return col.key.toLowerCase().includes(q) || col.label.toLowerCase().includes(q) || strVal.includes(q);
                })
                .map(col => {
                  const isId = col.key === '_id';
                  const rawVal = isId ? inspectingRecord._id : resolveRecordValue(inspectingRecord, col.key);
                  const displayVal = formatDisplayValue(rawVal);
                  const isEmpty = rawVal === null || rawVal === undefined || rawVal === '';

                  return (
                    <div
                      key={col.key}
                      style={{
                        padding: '10px 14px',
                        background: 'var(--bg-input)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}
                    >
                      <div style={{ flex: '0 0 200px', minWidth: '160px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                          {col.label}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {col.key}
                          </span>
                          <span className="badge badge-indigo" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
                            {col.type}
                          </span>
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0, wordBreak: 'break-word', fontSize: '0.8rem' }}>
                        {isEmpty ? (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.75rem' }}>null / empty</span>
                        ) : typeof rawVal === 'boolean' ? (
                          <span className={`badge ${rawVal ? 'badge-emerald' : 'badge-rose'}`} style={{ fontSize: '0.7rem' }}>
                            {rawVal ? 'TRUE' : 'FALSE'}
                          </span>
                        ) : Array.isArray(rawVal) ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {rawVal.map((item, idx) => (
                              <span key={idx} className="badge badge-indigo" style={{ fontSize: '0.675rem' }}>
                                {String(item)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontFamily: isId || col.key.includes('Date') ? 'var(--font-mono)' : 'inherit', color: isId ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                            {displayVal}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(typeof rawVal === 'object' ? JSON.stringify(rawVal) : String(rawVal ?? ''));
                          toast.success(`Copied '${col.label}' value!`);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 6px', fontSize: '0.675rem' }}
                        title={`Copy ${col.label} value`}
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
              <button
                type="button"
                onClick={() => setInspectingRecord(null)}
                className="btn btn-primary btn-sm"
                style={{ padding: '6px 16px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
