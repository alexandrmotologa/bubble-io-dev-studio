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
  Search,
  Plus,
  Play,
  ShieldAlert,
  Server,
  FileCode,
  Download,
  Share2,
  Workflow,
  Upload,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  GitBranch,
  Sparkles,
  History,
  Wrench,
  Trash2,
  FileSpreadsheet,
  Tag,
  Bookmark,
  ListFilter,
  Focus,
  AlertTriangle,
  CheckCircle2,
  Key,
  ShieldCheck,
  Info,
  FileText,
  Clock,
  Calendar,
  CheckCheck,
  RotateCcw,
  UploadCloud,
  X
} from 'lucide-react';
import { 
  BackupResult, 
  BubbleDataType, 
  BubbleSchema, 
  EnvDiffReport,
  PiiAuditReport, 
  ProjectProfile, 
  QueryConstraint, 
  QueryResultPage, 
  ReleaseChecklistTask,
  SchemaLockfile, 
  SchemaMigration, 
  SeedExecutionPlan 
} from '../types';
import { DevOpsEngine } from '../core/devops/devopsEngine';
import { PiiScanner } from '../core/devops/piiScanner';
import { SchemaMigrationsEngine } from '../core/devops/schemaMigrations';
import { RelationalSeederEngine } from '../core/devops/relationalSeeder';
import { DbExporterEngine } from '../core/devops/dbExporter';
import { CiGeneratorsEngine, CiPipelinePreset } from '../core/devops/ciGenerators';
import { TemplateScaffolderEngine } from '../core/devops/templateScaffolder';
import { MockServerEngine } from '../core/devops/mockServer';
import { EnvSyncEngine } from '../core/env-sync/envSyncEngine';
import { ProjectStore } from '../core/storage/projectStore';
import { IndexedDbStore } from '../core/storage/indexedDbStore';
import { DataGridTable } from '../components/DataGridTable';
import { WorkflowFlowchart } from '../components/WorkflowFlowchart';
import { DatabaseSnapshotManager } from '../components/DatabaseSnapshotManager';
import { MermaidViewer } from '../components/MermaidViewer';
import { toast } from '../core/toast/toastManager';

interface DevOpsViewProps {
  activeProject?: ProjectProfile;
  initialSubTab?: DevOpsSubTab;
  onLog: (module: 'devops', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
  onOpenConnectModal?: () => void;
}

export type DevOpsSubTab = 
  | 'data_grid'
  | 'schema'
  | 'erd'
  | 'workflow_flowchart'
  | 'snapshots'
  | 'types'
  | 'migrations'
  | 'env_sync'
  | 'backups'
  | 'query'
  | 'seeder'
  | 'export_db'
  | 'pii_audit'
  | 'cicd'
  | 'mock_server'
  | 'workflow';

export type DevOpsCategory = 'data' | 'schema' | 'devops' | 'tools';

const SUBTAB_TO_CATEGORY: Record<DevOpsSubTab, DevOpsCategory> = {
  data_grid: 'data',
  query: 'data',
  seeder: 'data',
  
  schema: 'schema',
  erd: 'schema',
  workflow_flowchart: 'schema',
  types: 'schema',
  pii_audit: 'schema',
  
  backups: 'devops',
  snapshots: 'devops',
  migrations: 'devops',
  env_sync: 'devops',
  
  cicd: 'tools',
  export_db: 'tools',
  mock_server: 'tools',
  workflow: 'tools'
};

const CATEGORY_DEFAULT_SUBTAB: Record<DevOpsCategory, DevOpsSubTab> = {
  data: 'data_grid',
  schema: 'schema',
  devops: 'backups',
  tools: 'cicd'
};

export const DevOpsView: React.FC<DevOpsViewProps> = ({ activeProject, initialSubTab, onLog, onOpenConnectModal }) => {
  const [activeCategory, setActiveCategory] = useState<DevOpsCategory>(
    initialSubTab ? SUBTAB_TO_CATEGORY[initialSubTab] || 'schema' : 'data'
  );
  const [subTab, setSubTab] = useState<DevOpsSubTab>(initialSubTab || 'data_grid');

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
      setActiveCategory(SUBTAB_TO_CATEGORY[initialSubTab] || 'schema');
    }
  }, [initialSubTab]);

  const handleSelectCategory = (cat: DevOpsCategory) => {
    setActiveCategory(cat);
    const defaultSub = CATEGORY_DEFAULT_SUBTAB[cat];
    setSubTab(defaultSub);
    if (defaultSub === 'backups' || cat === 'devops') loadBackups();
    if (defaultSub === 'env_sync') loadEnvSync();
    if (defaultSub === 'export_db') updateDbExportScript();
    if (defaultSub === 'cicd') { updateCiWorkflow(); updateScaffoldCode(); }
  };
  const [schema, setSchema] = useState<BubbleSchema | null>(null);
  const [tsDefinitions, setTsDefinitions] = useState<string>('');
  const [mermaidErd, setMermaidErd] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [schemaFilterType, setSchemaFilterType] = useState<'all' | 'tables' | 'option_sets'>('all');
  const [collapsedTables, setCollapsedTables] = useState<Set<string>>(new Set());
  const [collapsedOptionSets, setCollapsedOptionSets] = useState<Set<string>>(new Set());

  // ERD Subgraph Focus state
  const [erdFocusedTable, setErdFocusedTable] = useState<string>('ALL');

  // Schema Explorer state
  const [schemaSortMode, setSchemaSortMode] = useState<'name' | 'fields_desc' | 'fields_asc'>('name');

  // TypeScript Studio Options State
  const [tsMode, setTsMode] = useState<'interfaces' | 'zod' | 'client'>('interfaces');
  const [tsIncludeJsDoc, setTsIncludeJsDoc] = useState(true);
  const [tsIncludeCrudDtos, setTsIncludeCrudDtos] = useState(true);
  const [tsIncludeEnvelopes, setTsIncludeEnvelopes] = useState(true);
  const [tsGeneratedCode, setTsGeneratedCode] = useState<string>('');

  useEffect(() => {
    if (!schema) {
      setTsGeneratedCode('');
      return;
    }
    if (tsMode === 'interfaces') {
      setTsGeneratedCode(DevOpsEngine.generateTypeScriptDefinitions(schema, {
        includeJsDoc: tsIncludeJsDoc,
        includeCrudDtos: tsIncludeCrudDtos,
        includeEnvelopes: tsIncludeEnvelopes,
        includeSchemaMap: true
      }));
    } else if (tsMode === 'zod') {
      setTsGeneratedCode(DevOpsEngine.generateZodValidationSchemas(schema));
    } else if (tsMode === 'client') {
      setTsGeneratedCode(DevOpsEngine.generateTypedApiClient(schema));
    }
  }, [schema, tsMode, tsIncludeJsDoc, tsIncludeCrudDtos, tsIncludeEnvelopes]);

  useEffect(() => {
    if (!schema) {
      setMermaidErd('');
      return;
    }
    const erd = DevOpsEngine.generateMermaidERD(schema, erdFocusedTable);
    setMermaidErd(erd);
  }, [schema, erdFocusedTable]);

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

  // Active Data Grid Table Selection
  const [dataGridActiveType, setDataGridActiveType] = useState<string>('User');

  // Backup & Restore state
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupStatusText, setBackupStatusText] = useState('');
  const [backupsList, setBackupsList] = useState<BackupResult[]>([]);
  const [backupFormat, setBackupFormat] = useState<'json' | 'csv'>('json');
  const [backupEncryptPass, setBackupEncryptPass] = useState('');
  const [backupCloudDest, setBackupCloudDest] = useState('');
  const [backupSinceDate, setBackupSinceDate] = useState('');
  const [backupToDelete, setBackupToDelete] = useState<BackupResult | null>(null);
  const [backupScope, setBackupScope] = useState<'all' | 'selective'>('all');
  const [selectedBackupTables, setSelectedBackupTables] = useState<string[]>(['User', 'Product', 'Order']);
  const [showScheduleBackupModal, setShowScheduleBackupModal] = useState<boolean>(false);
  const [scheduleCronFreq, setScheduleCronFreq] = useState<'daily' | '6hours' | 'weekly'>('daily');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Migrations state
  const [lockfile, setLockfile] = useState<SchemaLockfile | null>(null);
  const [migrations, setMigrations] = useState<SchemaMigration[]>([]);
  const [newMigrationName, setNewMigrationName] = useState('');
  const [newMigrationDesc, setNewMigrationDesc] = useState('');
  const [migrationSqlDialect, setMigrationSqlDialect] = useState<'postgres' | 'mysql' | 'sqlite' | 'bigquery'>('postgres');
  const [selectedMigrationForVisualDiff, setSelectedMigrationForVisualDiff] = useState<SchemaMigration | null>(null);

  // Env Sync state
  const [showEnvSignoffModal, setShowEnvSignoffModal] = useState<boolean>(false);

  // PII state
  const [piiReport, setPiiReport] = useState<PiiAuditReport | null>(null);
  const [piiSeverityFilter, setPiiSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [piiCategoryFilter, setPiiCategoryFilter] = useState<string>('ALL');
  const [piiSearchQuery, setPiiSearchQuery] = useState<string>('');

  // Data Studio Column & Row Inspector state
  const [dataGridColumnSearch, setDataGridColumnSearch] = useState<string>('');
  const [dataGridSelectedRow, setDataGridSelectedRow] = useState<Record<string, any> | null>(null);

  // REPL Query state
  const [queryType, setQueryType] = useState('User');
  const [querySearch, setQuerySearch] = useState('');
  const [queryResults, setQueryResults] = useState<QueryResultPage | null>(null);
  const [queryConstraintKey, setQueryConstraintKey] = useState('');
  const [queryConstraintOp, setQueryConstraintOp] = useState<'equals' | 'not equal' | 'text contains' | 'greater than' | 'less than' | 'is_empty' | 'is_not_empty'>('equals');
  const [queryConstraintVal, setQueryConstraintVal] = useState('');
  const [activeConstraints, setActiveConstraints] = useState<QueryConstraint[]>([]);
  const [isFetchingQuery, setIsFetchingQuery] = useState(false);

  // Relational Seeder state
  const [seedDataJson, setSeedDataJson] = useState<string>('{\n  "User": [\n    {\n      "_ref": "@user_1",\n      "email": "user@example.com"\n    }\n  ]\n}');
  const [seedPlan, setSeedPlan] = useState<SeedExecutionPlan | null>(null);
  const [seedValidation, setSeedValidation] = useState<{ valid: boolean; errors: string[]; warnings: string[] } | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // DB Export state
  const [exportDbTarget, setExportDbTarget] = useState<'sqlite' | 'postgres' | 'bigquery'>('sqlite');
  const [exportDbType, setExportDbType] = useState('User');
  const [generatedDbScript, setGeneratedDbScript] = useState('');

  // CI/CD & Scaffolding state
  const [ciProvider, setCiProvider] = useState<'github' | 'gitlab'>('github');
  const [ciPreset, setCiPreset] = useState<CiPipelinePreset>('backup');
  const [ciCron, setCiCron] = useState('0 3 * * *');
  const [ciTypes, setCiTypes] = useState('');
  const [generatedCiYaml, setGeneratedCiYaml] = useState('');
  const [scaffoldType, setScaffoldType] = useState<'plugin-action' | 'api-connector' | 'webhook' | 'sdk-quickstart'>('plugin-action');
  const [scaffoldName, setScaffoldName] = useState('ProcessWorkflow');
  const [generatedScaffoldCode, setGeneratedScaffoldCode] = useState('');

  // Mock Server state
  const [mockStatus, setMockStatus] = useState(MockServerEngine.getStatus());
  const [mockTestType, setMockTestType] = useState('user');
  const [mockTestId, setMockTestId] = useState('');
  const [mockTestResponse, setMockTestResponse] = useState<any>(null);

  // Environment Diff Details Inspector States
  const [selectedEnvField, setSelectedEnvField] = useState<{ dataType: string; fieldName: string; fieldType: string } | null>(null);
  const [selectedSecretKey, setSelectedSecretKey] = useState<{ keyName: string; inSource: boolean; inTarget: boolean } | null>(null);
  const [selectedNewTable, setSelectedNewTable] = useState<string | null>(null);

  // Workflow Trigger state
  const [wfName, setWfName] = useState('backend_workflow');
  const [wfPayload, setWfPayload] = useState('{\n  "key": "value"\n}');
  const [wfResponse, setWfResponse] = useState<any>(null);
  const [isTriggeringWf, setIsTriggeringWf] = useState(false);

  // Env Sync state
  const [envDiff, setEnvDiff] = useState<EnvDiffReport | null>(null);
  const [releaseTasks, setReleaseTasks] = useState<ReleaseChecklistTask[]>([]);
  const [isSyncingEnv, setIsSyncingEnv] = useState(false);

  const [isFetchingSchema, setIsFetchingSchema] = useState(false);

  const loadEnvSync = async () => {
    setIsSyncingEnv(true);
    try {
      const diff = await EnvSyncEngine.compareEnvironments('version-test', 'live', schema, activeProject);
      setEnvDiff(diff);
      setReleaseTasks(EnvSyncEngine.getReleaseChecklist(diff));
      onLog('devops', 'Completed Cross-Environment Diff (Development vs Live).', 'info');
    } finally {
      setIsSyncingEnv(false);
    }
  };

  useEffect(() => {
    loadBackups();
    if (activeProject) {
      loadSchema();
    }
  }, [activeProject?.id, activeProject?.blueprintFileName, activeProject?.blueprintExportJson]);

  useEffect(() => {
    if (subTab === 'backups') {
      loadBackups();
    }
  }, [subTab]);

  const loadSchema = async () => {
    if (!activeProject) return;
    setIsFetchingSchema(true);
    onLog('devops', `Fetching schema for project: ${activeProject.name}...`);
    try {
      const s = await DevOpsEngine.fetchSchema(activeProject);
      setSchema(s);
      setCollapsedTables(new Set(s.dataTypes.map(d => d.id || d.name)));
      setCollapsedOptionSets(new Set(s.optionSets.map(os => os.name)));
      MockServerEngine.initFromSchema(s);
      
      // Generate TypeScript
      const ts = s.dataTypes.length > 0 
        ? DevOpsEngine.generateTypeScriptDefinitions(s)
        : '// No data types loaded yet.\n// Fetch schema from Bubble Data API or import a .bubble export JSON to generate TypeScript interfaces.';
      setTsDefinitions(ts);

      // Generate ERD
      const erd = s.dataTypes.length > 0
        ? DevOpsEngine.generateMermaidERD(s)
        : 'erDiagram\n    %% No data types loaded yet. Fetch live schema to view ERD.';
      setMermaidErd(erd);

      // Baseline lockfile & baseline migrations
      if (s.dataTypes.length > 0) {
        const lf = SchemaMigrationsEngine.createLockfile(s);
        setLockfile(lf);
        const baselineMigration: SchemaMigration = {
          version: '001',
          name: `init_${s.appName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_baseline`,
          description: `Initial schema baseline with ${s.dataTypes.length} data types: ${s.dataTypes.map(d => d.name).join(', ')}`,
          createdAt: new Date().toISOString(),
          app: s.appName,
          environment: s.version || activeProject?.environment || 'version-test',
          changes: s.dataTypes.flatMap(dt => [
            { action: 'ADD_TABLE' as const, table: dt.name },
            ...dt.fields.map(f => ({
              action: 'ADD_FIELD' as const,
              table: dt.name,
              field: f.name,
              type: f.type
            }))
          ])
        };
        setMigrations([baselineMigration]);
        const pii = PiiScanner.scanSchema(s);
        setPiiReport(pii);

        const typeNames = s.dataTypes.map(t => t.name);
        setCiTypes(typeNames.join(', '));
        setQueryType(typeNames[0]);
        setExportDbType(typeNames[0]);
        setMockTestType(typeNames[0].toLowerCase());
        setSeedDataJson(JSON.stringify(RelationalSeederEngine.generateSeedTemplateForSchema(s), null, 2));
      } else {
        setLockfile(null);
        setMigrations([]);
        setPiiReport(null);
      }

      setQueryResults(null);
      updateCiWorkflow();
      updateScaffoldCode();
      updateDbExportScript();

      if (s.dataTypes.length > 0) {
        onLog('devops', `Loaded ${s.dataTypes.length} real data types from Bubble API.`, 'success');
      } else {
        onLog('devops', `Ready. Connect with private API token or import .bubble JSON to inspect schema.`, 'info');
      }
    } catch (e: any) {
      onLog('devops', `Schema fetch notice: ${e.message}`, 'warn');
    } finally {
      setIsFetchingSchema(false);
    }
  };

  const handleImportSchemaFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const parsedSchema = DevOpsEngine.parseBubbleSchemaJson(parsed, activeProject);
        setSchema(parsedSchema);
        setCollapsedTables(new Set(parsedSchema.dataTypes.map(d => d.id || d.name)));
        setCollapsedOptionSets(new Set(parsedSchema.optionSets.map(os => os.name)));
        MockServerEngine.initFromSchema(parsedSchema);

        const ts = DevOpsEngine.generateTypeScriptDefinitions(parsedSchema);
        setTsDefinitions(ts);

        const erd = DevOpsEngine.generateMermaidERD(parsedSchema);
        setMermaidErd(erd);

        const lf = SchemaMigrationsEngine.createLockfile(parsedSchema);
        setLockfile(lf);
        const baselineMigration: SchemaMigration = {
          version: '001',
          name: `init_${parsedSchema.appName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_baseline`,
          description: `Initial schema baseline with ${parsedSchema.dataTypes.length} data types: ${parsedSchema.dataTypes.map(d => d.name).join(', ')}`,
          createdAt: new Date().toISOString(),
          app: parsedSchema.appName,
          environment: parsedSchema.version || activeProject?.environment || 'version-test',
          changes: parsedSchema.dataTypes.flatMap(dt => [
            { action: 'ADD_TABLE' as const, table: dt.name },
            ...dt.fields.map(f => ({
              action: 'ADD_FIELD' as const,
              table: dt.name,
              field: f.name,
              type: f.type
            }))
          ])
        };
        setMigrations([baselineMigration]);

        const pii = PiiScanner.scanSchema(parsedSchema);
        setPiiReport(pii);

        if (parsedSchema.dataTypes.length > 0) {
          const typeNames = parsedSchema.dataTypes.map(t => t.name);
          setCiTypes(typeNames.join(', '));
          setQueryType(typeNames[0]);
          setExportDbType(typeNames[0]);
          setMockTestType(typeNames[0].toLowerCase());
          setSeedDataJson(JSON.stringify(RelationalSeederEngine.generateSeedTemplateForSchema(parsedSchema), null, 2));
        }

        // Persist attached blueprint into project storage
        if (activeProject) {
          ProjectStore.getInstance().updateProject(activeProject.id, {
            blueprintExportJson: parsed,
            blueprintFileName: file.name,
            stats: {
              ...(activeProject.stats || {}),
              dataTypesCount: parsedSchema.dataTypes.length
            }
          });
        }

        onLog('devops', `Imported schema from file '${file.name}' with ${parsedSchema.dataTypes.length} data types!`, 'success');
      } catch (err: any) {
        onLog('devops', `Failed to parse schema file: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleLoadTemplateSchema = () => {
    if (!activeProject) return;
    const template = DevOpsEngine.getTemplateSchema(activeProject);
    setSchema(template);
    setCollapsedTables(new Set(template.dataTypes.map(d => d.id || d.name)));
    setCollapsedOptionSets(new Set(template.optionSets.map(os => os.name)));
    MockServerEngine.initFromSchema(template);

    const ts = DevOpsEngine.generateTypeScriptDefinitions(template);
    setTsDefinitions(ts);

    const erd = DevOpsEngine.generateMermaidERD(template);
    setMermaidErd(erd);

    const lf = SchemaMigrationsEngine.createLockfile(template);
    setLockfile(lf);
    const baselineMigration: SchemaMigration = {
      version: '001',
      name: `init_${template.appName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_baseline`,
      description: `Initial schema baseline with ${template.dataTypes.length} data types: ${template.dataTypes.map(d => d.name).join(', ')}`,
      createdAt: new Date().toISOString(),
      app: template.appName,
      environment: template.version || activeProject.environment || 'version-test',
      changes: template.dataTypes.flatMap(dt => [
        { action: 'ADD_TABLE' as const, table: dt.name },
        ...dt.fields.map(f => ({
          action: 'ADD_FIELD' as const,
          table: dt.name,
          field: f.name,
          type: f.type
        }))
      ])
    };
    setMigrations([baselineMigration]);

    const pii = PiiScanner.scanSchema(template);
    setPiiReport(pii);

    if (template.dataTypes.length > 0) {
      const typeNames = template.dataTypes.map(t => t.name);
      setCiTypes(typeNames.join(', '));
      setQueryType(typeNames[0]);
      setExportDbType(typeNames[0]);
      setMockTestType(typeNames[0].toLowerCase());
      setSeedDataJson(JSON.stringify(RelationalSeederEngine.generateSeedTemplateForSchema(template), null, 2));
    }

    // Save into project storage
    ProjectStore.getInstance().updateProject(activeProject.id, {
      blueprintExportJson: template,
      blueprintFileName: `${activeProject.appId}_template.json`,
      stats: {
        ...(activeProject.stats || {}),
        dataTypesCount: template.dataTypes.length
      }
    });

    onLog('devops', `Populated ${template.dataTypes.length} data types for '${activeProject.name}'!`, 'success');
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
    onLog('devops', `Copied ${label} to clipboard.`, 'info');
  };

  const handleDownloadCode = (code: string, defaultFilename: string) => {
    const blob = new Blob([code], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${defaultFilename}!`);
    onLog('devops', `Downloaded ${defaultFilename} to disk.`, 'success');
  };

  const loadBackups = async () => {
    try {
      const rawBackups = await IndexedDbStore.getAllBackups();
      const formatted: BackupResult[] = rawBackups
        .map(b => (b.data && b.data.backupId ? b.data : b))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setBackupsList(formatted);
    } catch (e) {
      console.warn('Failed to load backups from IndexedDbStore:', e);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    try {
      await IndexedDbStore.deleteBackup(backupId);
      await loadBackups();
      onLog('devops', `Deleted backup archive ${backupId}.`, 'info');
    } catch (e: any) {
      onLog('devops', `Failed to delete backup: ${e.message}`, 'error');
    }
  };

  const handleDownloadBackup = (backup: BackupResult) => {
    try {
      const ext = `${backup.format || 'json'}${backup.encrypted ? '.enc' : ''}`;
      const payload = JSON.stringify(backup, null, 2);
      const mime = backup.format === 'csv' ? 'text/csv' : 'application/json';
      const blob = new Blob([payload], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${backup.backupId}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${backup.backupId}.${ext}`);
      onLog('devops', `Downloaded backup archive ${backup.backupId}.${ext}.`, 'success');
    } catch (e: any) {
      onLog('devops', `Failed to download backup: ${e.message}`, 'error');
    }
  };

  const handleRunBackup = async () => {
    if (!activeProject || isBackingUp) return;
    setIsBackingUp(true);
    setBackupProgress(5);
    onLog('devops', `Starting database backup for ${activeProject.appId}...`);

    try {
      const result = await DevOpsEngine.runBackup(
        activeProject,
        {
          format: backupFormat,
          encryptPassphrase: backupEncryptPass || undefined,
          cloudDestination: backupCloudDest || undefined,
          sinceDate: backupSinceDate || undefined,
          scope: backupScope,
          selectedTables: backupScope === 'selective' ? selectedBackupTables : undefined
        },
        (msg, pct) => {
          setBackupStatusText(msg);
          setBackupProgress(pct);
          onLog('devops', msg);
        }
      );
      await loadBackups();
      toast.success(`Backup completed: ${result.backupId}`);
      onLog('devops', `Backup completed: ${result.backupId} (${result.recordCount} records, ${result.fileSizeKb} KB)`, 'success');
    } catch (e: any) {
      onLog('devops', `Backup failed: ${e.message}`, 'error');
    } finally {
      setIsBackingUp(false);
      setBackupProgress(0);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = JSON.parse(text);
        const importedBackup: BackupResult = {
          backupId: parsed.backupId || `imported_bkp_${Date.now()}`,
          timestamp: parsed.timestamp || new Date().toISOString(),
          status: 'completed',
          recordCount: parsed.recordCount || (Array.isArray(parsed.records) ? parsed.records.length : 1420),
          tables: parsed.tables || [parsed.dataType || 'User'],
          fileSizeKb: Math.round(file.size / 1024) || 120,
          format: parsed.format || 'json',
          encrypted: Boolean(parsed.encrypted),
          checksum: parsed.checksum || `sha256:${Date.now().toString(16)}a7f3c9e2`,
          scope: parsed.scope || 'all'
        };

        await IndexedDbStore.saveBackup({
          backupId: importedBackup.backupId,
          timestamp: importedBackup.timestamp,
          data: importedBackup,
          recordCount: importedBackup.recordCount
        });

        await loadBackups();
        toast.success(`Imported backup archive ${importedBackup.backupId}`);
        onLog('devops', `Successfully imported backup archive ${importedBackup.backupId} (${importedBackup.recordCount} records).`, 'success');
      } catch (err: any) {
        toast.error(`Failed to import backup: ${err.message}`);
        onLog('devops', `Import backup error: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleGenerateMigration = () => {
    if (!schema || !lockfile) return;
    const mig = SchemaMigrationsEngine.generateMigration(
      newMigrationName || 'schema_update',
      newMigrationDesc || 'Manual migration tracking changes against baseline lockfile',
      schema,
      lockfile
    );
    setMigrations([mig, ...migrations]);
    setNewMigrationName('');
    setNewMigrationDesc('');
    toast.success(`Generated migration ${mig.version}_${mig.name}.json`);
    onLog('devops', `Generated migration '${mig.version}_${mig.name}.json' with ${mig.changes.length} declarative operation(s).`, 'success');
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

  const handleExportEnvSignoffMarkdown = () => {
    if (!envDiff) return;
    const completedTasks = releaseTasks.filter(t => t.completed);
    const readyPct = Math.round((completedTasks.length / (releaseTasks.length || 1)) * 100);

    let md = `# 🚀 Bubble.io Production Release Sign-off & Audit Report\n\n`;
    md += `- **Application:** ${activeProject?.name || activeProject?.appId || 'Bubble App'}\n`;
    md += `- **Generated:** ${new Date().toISOString()}\n`;
    md += `- **Release Readiness:** ${readyPct}% (${completedTasks.length} / ${releaseTasks.length} Checks Passed)\n`;
    md += `- **Target Environment:** \`${envDiff.targetEnv}\` (Production)\n\n`;

    md += `## 📊 Environment Diff Summary\n\n`;
    md += `| Category | Status |\n| :--- | :--- |\n`;
    md += `| 🗃️ New Tables Pending Deploy | ${envDiff.missingDataTypesInTarget.length} (${envDiff.missingDataTypesInTarget.join(', ') || 'None - All Synced'}) |\n`;
    md += `| 📝 New Fields Pending Deploy | ${envDiff.missingFieldsInTarget.length} fields |\n`;
    md += `| 🔑 Secret Keys & API Status | ${envDiff.secretKeyMismatches.filter(k => k.inTarget).length} / ${envDiff.secretKeyMismatches.length} Verified in Live |\n\n`;

    if (envDiff.missingFieldsInTarget.length > 0) {
      md += `### 📝 Pending Fields List\n\n`;
      for (const f of envDiff.missingFieldsInTarget) {
        md += `- \`${f.dataType}.${f.fieldName}\` (Type: \`${f.fieldType}\`)\n`;
      }
      md += `\n`;
    }

    md += `## ✅ Pre-Release Checklist Sign-off\n\n`;
    for (const t of releaseTasks) {
      md += `- [${t.completed ? 'x' : ' '}] **[${t.category.toUpperCase()}]** ${t.title}\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `release_signoff_${activeProject?.appId || 'bubble'}_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Exported Pre-Release Sign-off Report (.md)');
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

  const handleRunQuery = async () => {
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

  const handleLoadRelationalExample = () => {
    const example = {
      User: [
        {
          _ref: "@user_admin",
          email: "john.doe@example.com",
          first_name: "John",
          last_name: "Doe",
          role: "Admin",
          is_active: true
        },
        {
          _ref: "@user_member",
          email: "jane.smith@example.com",
          first_name: "Jane",
          last_name: "Smith",
          role: "Member",
          is_active: true
        }
      ],
      Company: [
        {
          _ref: "@company_main",
          name: "DevStudio Labs",
          owner: "@user_admin",
          tier: "Enterprise"
        }
      ],
      Project: [
        {
          _ref: "@project_alpha",
          title: "Bubble AI Toolchain",
          company: "@company_main",
          lead_user: "@user_admin",
          members: ["@user_admin", "@user_member"],
          budget: 15000,
          is_active: true
        }
      ]
    };
    setSeedDataJson(JSON.stringify(example, null, 2));
    onLog('devops', 'Loaded multi-table relational seed example with @ref aliases.', 'info');
  };

  const handleGenerateSchemaTemplate = () => {
    if (!schema || schema.dataTypes.length === 0) {
      onLog('devops', 'No schema data types found to generate template.', 'warn');
      return;
    }
    const generated = RelationalSeederEngine.generateSeedTemplateForSchema(schema);
    setSeedDataJson(JSON.stringify(generated, null, 2));
    onLog('devops', `Generated relational template for ${schema.dataTypes.length} schema types.`, 'success');
  };

  const handleParseSeedPlan = () => {
    try {
      const parsed = JSON.parse(seedDataJson);
      const plan = RelationalSeederEngine.parseAndPlan(parsed);
      setSeedPlan(plan);

      if (schema) {
        const check = RelationalSeederEngine.preflightCheck(parsed, schema);
        setSeedValidation(check);
      }
      onLog('devops', `Compiled relational execution plan: ${plan.totalRecords} records across ${plan.types.length} types in ${plan.steps.length} steps.`, 'success');
    } catch (e: any) {
      onLog('devops', `Invalid JSON in relational seeder: ${e.message}`, 'error');
    }
  };

  const handleExecuteSeed = async () => {
    if (!seedPlan || isSeeding) return;
    setIsSeeding(true);
    onLog('devops', 'Starting relational graph import with automatic DAG resolution...');
    try {
      const result = await RelationalSeederEngine.executePlan(seedPlan, activeProject, (step, total, msg) => {
        onLog('devops', `[Step ${step}/${total}] ${msg}`);
      });
      if (result.errors && result.errors.length > 0) {
        onLog('devops', `Relational seeding completed with ${result.errors.length} error(s): ${result.errors.join(', ')}`, 'warn');
      } else {
        onLog('devops', `Relational seeding completed! Created ${result.createdCount} linked records.`, 'success');
      }
    } catch (e: any) {
      onLog('devops', `Seeding error: ${e.message}`, 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const updateDbExportScript = () => {
    if (!schema) return;
    const dt = schema.dataTypes.find(t => t.name.toLowerCase() === exportDbType.toLowerCase()) || schema.dataTypes[0];
    const sampleRecords = queryResults?.records || [];

    if (exportDbTarget === 'sqlite') {
      setGeneratedDbScript(DbExporterEngine.generateSqliteExport(dt, sampleRecords));
    } else if (exportDbTarget === 'postgres') {
      setGeneratedDbScript(DbExporterEngine.generatePostgresExport(dt, sampleRecords));
    } else {
      setGeneratedDbScript(DbExporterEngine.generateBigQueryExport(dt));
    }
  };

  const updateCiWorkflow = () => {
    const typesArr = ciTypes.split(',').map(s => s.trim()).filter(Boolean);
    const options = {
      provider: ciProvider,
      preset: ciPreset,
      dataTypes: typesArr,
      environment: (activeProject?.environment as any) || 'version-test',
      cronSchedule: ciCron,
      retentionDays: 30,
      format: backupFormat,
      cliVersion: 'latest'
    };

    if (ciProvider === 'github') {
      setGeneratedCiYaml(CiGeneratorsEngine.generateGitHubActionsWorkflow(options));
    } else {
      setGeneratedCiYaml(CiGeneratorsEngine.generateGitLabCiPipeline(options));
    }
  };

  const handleDownloadCiYaml = () => {
    const filename = ciProvider === 'github' ? 'bubble_ci_workflow.yml' : '.gitlab-ci.yml';
    const blob = new Blob([generatedCiYaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
    onLog('devops', `Downloaded CI/CD workflow configuration: ${filename}`, 'success');
  };

  const updateScaffoldCode = () => {
    if (scaffoldType === 'plugin-action') {
      setGeneratedScaffoldCode(TemplateScaffolderEngine.scaffoldPluginAction(scaffoldName));
    } else if (scaffoldType === 'api-connector') {
      setGeneratedScaffoldCode(TemplateScaffolderEngine.scaffoldApiConnector(scaffoldName));
    } else if (scaffoldType === 'webhook') {
      setGeneratedScaffoldCode(TemplateScaffolderEngine.scaffoldWebhookReceiver(scaffoldName));
    } else {
      setGeneratedScaffoldCode(TemplateScaffolderEngine.scaffoldSdkQuickstart(activeProject?.appId || 'bubble-app'));
    }
  };

  const handleDownloadScaffoldCode = () => {
    const filename = `${scaffoldName.toLowerCase()}_${scaffoldType.replace('-', '_')}.ts`;
    handleDownloadCode(generatedScaffoldCode, filename);
  };

  useEffect(() => {
    updateCiWorkflow();
  }, [ciProvider, ciPreset, ciCron, ciTypes, backupFormat, activeProject?.environment]);

  useEffect(() => {
    updateScaffoldCode();
  }, [scaffoldType, scaffoldName, activeProject?.appId]);

  useEffect(() => {
    updateDbExportScript();
  }, [exportDbTarget, exportDbType, schema, queryResults]);

  const handleToggleMockServer = () => {
    if (mockStatus.isRunning) {
      MockServerEngine.stopServer();
      setMockStatus(MockServerEngine.getStatus());
      onLog('devops', 'Local Bubble mock server stopped.', 'warn');
    } else {
      MockServerEngine.startServer(3333);
      setMockStatus(MockServerEngine.getStatus());
      onLog('devops', 'Local Bubble mock server started on http://localhost:3333', 'success');
    }
  };

  const handleTestMockRequest = (method: 'GET' | 'POST' | 'PATCH' | 'DELETE') => {
    const res = MockServerEngine.simulateRequest(method, mockTestType, mockTestId || undefined, { title: 'Test Product', price: 99 });
    setMockTestResponse(res);
    onLog('devops', `Mock request ${method} /api/1.1/obj/${mockTestType} -> Status ${res.status}`);
  };

  const handleTriggerWorkflow = async () => {
    if (!activeProject || isTriggeringWf) return;
    setIsTriggeringWf(true);
    onLog('devops', `Triggering backend workflow '${wfName}' on ${activeProject.appId}...`);
    try {
      const res = await DevOpsEngine.triggerWorkflow(activeProject, wfName, wfPayload);
      setWfResponse(res);
      onLog('devops', `Workflow '${wfName}' returned HTTP ${res.httpCode} in ${res.executionTimeMs}ms`, 'success');
    } catch (e: any) {
      onLog('devops', `Workflow trigger failed: ${e.message}`, 'error');
    } finally {
      setIsTriggeringWf(false);
    }
  };

  if (!activeProject) {
    return (
      <div className="view-container">
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)', border: '1px solid var(--border-active)' }}>
          <Database size={44} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>No Bubble Application Connected</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Connect a Bubble app using its App ID and Private API Key to explore live database schemas, render ERD diagrams, generate TypeScript definitions, and run relational migrations.
          </p>
          {onOpenConnectModal && (
            <button onClick={onOpenConnectModal} className="btn btn-primary" style={{ padding: '10px 20px' }}>
              <Plus size={16} />
              <span>Connect Bubble App</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="view-container">
      {/* Category Tabs (Primary Domain Switcher) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-surface-elevated)',
        padding: '6px 8px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Tier 1 Categories */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {/* 1. Data & Records */}
          <button
            onClick={() => handleSelectCategory('data')}
            className={`btn btn-sm ${activeCategory === 'data' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '8px 14px',
              fontSize: '0.825rem',
              fontWeight: activeCategory === 'data' ? 700 : 500,
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <Database size={15} />
            <span>Data Studio</span>
          </button>

          {/* 2. Schema & Architecture */}
          <button
            onClick={() => handleSelectCategory('schema')}
            className={`btn btn-sm ${activeCategory === 'schema' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '8px 14px',
              fontSize: '0.825rem',
              fontWeight: activeCategory === 'schema' ? 700 : 500,
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <Layers size={15} />
            <span>Schema & Flow</span>
          </button>

          {/* 3. Backups & Migrations */}
          <button
            onClick={() => handleSelectCategory('devops')}
            className={`btn btn-sm ${activeCategory === 'devops' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '8px 14px',
              fontSize: '0.825rem',
              fontWeight: activeCategory === 'devops' ? 700 : 500,
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <HardDriveDownload size={15} />
            <span>Backups & DevOps</span>
          </button>

          {/* 4. Developer Tools & CI/CD */}
          <button
            onClick={() => handleSelectCategory('tools')}
            className={`btn btn-sm ${activeCategory === 'tools' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '8px 14px',
              fontSize: '0.825rem',
              fontWeight: activeCategory === 'tools' ? 700 : 500,
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <Wrench size={15} />
            <span>Dev Tools & CI/CD</span>
          </button>
        </div>

        {/* Sync Button */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={loadSchema} className="btn btn-secondary btn-sm" title="Refresh Live Schema">
            <RefreshCw size={13} />
            <span>Sync Schema</span>
          </button>
        </div>
      </div>

      {/* Tier 2: Sub-tool Bar for Active Category */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 6px',
        background: 'var(--bg-input)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-subtle)',
        flexWrap: 'wrap'
      }}>
        {activeCategory === 'data' && (
          <>
            <button
              onClick={() => setSubTab('data_grid')}
              className={`btn btn-sm ${subTab === 'data_grid' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', fontSize: '0.775rem' }}
            >
              <Table size={13} />
              <span>Interactive Data Studio</span>
            </button>
            <button
              onClick={() => setSubTab('query')}
              className={`btn btn-sm ${subTab === 'query' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', fontSize: '0.775rem' }}
            >
              <Search size={13} />
              <span>Live REPL & Query</span>
            </button>
            <button
              onClick={() => setSubTab('seeder')}
              className={`btn btn-sm ${subTab === 'seeder' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', fontSize: '0.775rem' }}
            >
              <Share2 size={13} />
              <span>Relational Seeder</span>
            </button>
          </>
        )}

        {activeCategory === 'schema' && (
          <>
            <button
              onClick={() => setSubTab('schema')}
              className={`btn btn-sm ${subTab === 'schema' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', fontSize: '0.775rem' }}
            >
              <Table size={13} />
              <span>Schema Explorer</span>
            </button>
            <button
              onClick={() => setSubTab('erd')}
              className={`btn btn-sm ${subTab === 'erd' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', fontSize: '0.775rem' }}
            >
              <Layers size={13} />
              <span>ERD Graph</span>
            </button>
            <button
              onClick={() => setSubTab('workflow_flowchart')}
              className={`btn btn-sm ${subTab === 'workflow_flowchart' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', fontSize: '0.775rem' }}
            >
              <GitBranch size={13} />
              <span>Workflow Flowchart</span>
            </button>
            <button
              onClick={() => setSubTab('types')}
              className={`btn btn-sm ${subTab === 'types' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', fontSize: '0.775rem' }}
            >
              <Code size={13} />
              <span>TypeScript (.d.ts)</span>
            </button>
            <button
              onClick={() => setSubTab('pii_audit')}
              className={`btn btn-sm ${subTab === 'pii_audit' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', fontSize: '0.775rem' }}
            >
              <ShieldAlert size={13} />
              <span>PII Privacy ({piiReport?.findings.length || 0})</span>
            </button>
          </>
        )}

        {activeCategory === 'devops' && (
          <>
            <button
              onClick={() => setSubTab('backups')}
              className={`btn btn-sm ${subTab === 'backups' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', fontSize: '0.775rem' }}
            >
              <HardDriveDownload size={13} />
              <span>Backup & Restore</span>
            </button>
            <button
              onClick={() => setSubTab('snapshots')}
              className={`btn btn-sm ${subTab === 'snapshots' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', fontSize: '0.775rem' }}
            >
              <History size={13} />
              <span>Database Snapshots</span>
            </button>
            <button
              onClick={() => setSubTab('migrations')}
              className={`btn btn-sm ${subTab === 'migrations' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', fontSize: '0.775rem' }}
            >
              <GitCompare size={13} />
              <span>Schema Migrations ({migrations.length})</span>
            </button>
            <button
              onClick={() => { setSubTab('env_sync'); loadEnvSync(); }}
              className={`btn btn-sm ${subTab === 'env_sync' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', fontSize: '0.775rem' }}
            >
              <Layers size={13} />
              <span>Dev vs Live Sync</span>
            </button>
          </>
        )}

        {activeCategory === 'tools' && (
          <>
            <button
              onClick={() => { setSubTab('cicd'); updateCiWorkflow(); updateScaffoldCode(); }}
              className={`btn btn-sm ${subTab === 'cicd' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', fontSize: '0.775rem' }}
            >
              <FileCode size={13} />
              <span>CI/CD Pipelines</span>
            </button>
            <button
              onClick={() => { setSubTab('export_db'); updateDbExportScript(); }}
              className={`btn btn-sm ${subTab === 'export_db' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', fontSize: '0.775rem' }}
            >
              <Database size={13} />
              <span>SQL / DB Export</span>
            </button>
            <button
              onClick={() => setSubTab('mock_server')}
              className={`btn btn-sm ${subTab === 'mock_server' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', fontSize: '0.775rem' }}
            >
              <Server size={13} />
              <span>Mock API Server</span>
            </button>
            <button
              onClick={() => setSubTab('workflow')}
              className={`btn btn-sm ${subTab === 'workflow' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', fontSize: '0.775rem' }}
            >
              <Workflow size={13} />
              <span>Workflow Trigger</span>
            </button>
          </>
        )}
      </div>

      {/* Backup in progress banner */}
      {isBackingUp && (
        <div className="card" style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--border-active)', padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
            <span><strong>Backup in progress:</strong> {backupStatusText}</span>
            <span>{backupProgress}%</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ width: `${backupProgress}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #06b6d4)', transition: 'width 0.3s ease' }} />
          </div>
        </div>
      )}

      {/* SUBTAB 0: INTERACTIVE DATA STUDIO */}
      {subTab === 'data_grid' && (
        <DataGridTable 
          project={activeProject} 
          dataTypes={schema?.dataTypes || []} 
          activeDataType={dataGridActiveType}
          onLog={onLog} 
        />
      )}

      {/* SUBTAB: WORKFLOW FLOWCHART */}
      {subTab === 'workflow_flowchart' && (
        <WorkflowFlowchart 
          blueprintExportJson={activeProject.blueprintExportJson} 
          onLog={onLog} 
        />
      )}

      {/* SUBTAB: DATABASE SNAPSHOTS & ROLLBACK */}
      {subTab === 'snapshots' && (
        <DatabaseSnapshotManager 
          project={activeProject} 
          dataTypes={schema?.dataTypes || []} 
          onLog={onLog} 
        />
      )}

      {/* SUBTAB 1: SCHEMA EXPLORER */}
      {subTab === 'schema' && (
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={loadSchema}
                disabled={isFetchingSchema}
                className="btn btn-secondary btn-sm"
                title="Fetch live schema via Bubble Meta API"
              >
                <RefreshCw size={12} className={isFetchingSchema ? 'spin' : ''} />
                <span>{isFetchingSchema ? 'Fetching...' : 'Fetch Schema from Data API'}</span>
              </button>

              <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                <Upload size={12} />
                <span>Import Schema JSON</span>
                <input
                  type="file"
                  accept=".json,.bubble"
                  onChange={handleImportSchemaFile}
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
                Bubble Data API endpoints require <strong>"Enable Data API"</strong> in your Bubble app's <code>Settings ➔ API</code>, or you can import your exported <code>.bubble</code> file directly.
              </p>

              {/* Instructions Pill Banner */}
              <div style={{ maxWidth: '540px', margin: '0 auto 20px', padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>💡 How to enable schema extraction:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>1. <strong>Option A (Offline / Instant)</strong>: In Bubble Editor, go to <em>Settings ➔ General ➔ Export application</em> and import your <code>.bubble</code> file below.</span>
                  <span>2. <strong>Option B (Live API)</strong>: In Bubble Editor ➔ <em>Settings ➔ API</em>, check <em>"Enable Data API"</em> and select the data types you want to expose.</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                  <Upload size={13} />
                  <span>Import .bubble / Blueprint JSON</span>
                  <input
                    type="file"
                    accept=".json,.bubble"
                    onChange={handleImportSchemaFile}
                    style={{ display: 'none' }}
                  />
                </label>

                <button onClick={handleLoadTemplateSchema} className="btn btn-secondary btn-sm" style={{ color: 'var(--accent-cyan)' }}>
                  <Code size={13} />
                  <span>Load Template Schema for {activeProject?.appId || 'App'}</span>
                </button>

                <button onClick={loadSchema} disabled={isFetchingSchema} className="btn btn-secondary btn-sm">
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
                            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
                            gap: '16px',
                            alignItems: 'start'
                          }}>
                            {sortedTables.map((dt) => {
                          const tableKey = dt.id || dt.name;
                          const isCollapsed = collapsedTables.has(tableKey);

                          return (
                            <div
                              key={dt.id}
                              className="card"
                              style={{
                                padding: isCollapsed ? '12px 16px' : '16px 18px',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                border: isCollapsed ? '1px solid var(--border-subtle)' : '1px solid rgba(99, 102, 241, 0.45)',
                                background: isCollapsed ? 'var(--bg-card)' : 'rgba(99, 102, 241, 0.02)',
                                borderRadius: 'var(--radius-md)'
                              }}
                            >
                              {/* Header (Single-row, perfectly centered) */}
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
                                  gap: '12px'
                                }}
                              >
                                {/* Left: Chevron + Icon + Title + Badges */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
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

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
                                    <h3
                                      style={{
                                        fontSize: '0.925rem',
                                        fontWeight: 700,
                                        color: 'var(--text-primary)',
                                        margin: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                      }}
                                      title={dt.name}
                                    >
                                      {dt.name}
                                    </h3>

                                    <span className="badge badge-indigo" style={{ fontSize: '0.625rem', padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.3px', flexShrink: 0 }}>
                                      Table
                                    </span>

                                    {dt.recordCount && dt.recordCount > 0 ? (
                                      <span className="badge badge-cyan" style={{ fontSize: '0.625rem', padding: '1px 6px', flexShrink: 0 }}>
                                        {dt.recordCount.toLocaleString()} rows
                                      </span>
                                    ) : null}
                                  </div>
                                </div>

                                {/* Right: Field Count Badge + Action Button */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                  <span className="badge badge-indigo" style={{ fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                                    {dt.fields.length} Fields
                                  </span>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDataGridActiveType(dt.name);
                                      setSubTab('data_grid');
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
                                  {/* Metadata Subheader */}
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

                                  {/* Quick Footer Action */}
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDataGridActiveType(dt.name);
                                        setSubTab('data_grid');
                                      }}
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
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
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
                              {/* Header (Single-row, perfectly centered) */}
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
                                  gap: '12px'
                                }}
                              >
                                {/* Left: Chevron + Icon + Title + Badge */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
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

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
                                    <h3
                                      style={{
                                        fontSize: '0.925rem',
                                        fontWeight: 700,
                                        color: 'var(--text-primary)',
                                        margin: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                      }}
                                      title={os.name}
                                    >
                                      {os.name}
                                    </h3>

                                    <span className="badge badge-amber" style={{ fontSize: '0.625rem', padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.3px', flexShrink: 0 }}>
                                      Option Set
                                    </span>
                                  </div>
                                </div>

                                {/* Right: Values Count Badge + Action Button */}
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
                                  {/* Metadata Subheader */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', color: 'var(--text-muted)', padding: '0 2px' }}>
                                    <span>Defined Choices ({os.options.length})</span>
                                    <span>Click any pill to copy value</span>
                                  </div>

                                  {/* Option Set Values Pills Grid */}
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

                                  {/* Quick Export Footer Toolbar */}
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
      )}

      {/* SUBTAB 2: ERD GRAPH */}
      {subTab === 'erd' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Subgraph Focus Toolbar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-card)',
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Focus size={15} color="var(--primary)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Subgraph Focus:
                </span>
              </div>
              <select
                value={erdFocusedTable}
                onChange={(e) => setErdFocusedTable(e.target.value)}
                className="select"
                style={{ fontSize: '0.775rem', padding: '4px 10px', width: 'auto', minWidth: '220px' }}
              >
                <option value="ALL">🌐 All Tables ({schema?.dataTypes.length || 0} Models)</option>
                {schema?.dataTypes.map(dt => (
                  <option key={dt.name} value={dt.name}>
                    🎯 Focus: {dt.name} + Relations ({dt.fields.length} fields)
                  </option>
                ))}
              </select>

              {erdFocusedTable !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setErdFocusedTable('ALL')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                >
                  Reset Focus
                </button>
              )}
            </div>

            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              {erdFocusedTable === 'ALL' 
                ? `Showing complete enterprise database schema with all dynamic relations`
                : `Focused on '${erdFocusedTable}' and all connected parent & child tables`}
            </div>
          </div>

          <MermaidViewer 
            chart={mermaidErd} 
            title={`Entity Relationship Diagram ${erdFocusedTable !== 'ALL' ? `(Focus: ${erdFocusedTable})` : '(Full Schema)'}`}
          />
        </div>
      )}

      {/* SUBTAB 3: TYPESCRIPT DEFINITIONS & ENTERPRISE SDK */}
      {subTab === 'types' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '20px' }}>
            {/* Header with Title and Mode Switcher */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <div>
                <div className="card-title" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Code size={20} color="var(--accent-emerald)" />
                  <span>TypeScript Studio & Type-Safe CodeGen</span>
                </div>
                <div className="card-subtitle" style={{ fontSize: '0.775rem', marginTop: '4px' }}>
                  Generate enterprise-grade TypeScript interfaces, runtime Zod validation schemas, and a zero-dependency Bubble API client
                </div>
              </div>

              {/* Mode Selector Segmented Tabs */}
              <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '3px', borderRadius: 'var(--radius-md)', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setTsMode('interfaces')}
                  className={`btn btn-sm ${tsMode === 'interfaces' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ border: 'none', padding: '5px 12px', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  TypeScript (.d.ts)
                </button>
                <button
                  type="button"
                  onClick={() => setTsMode('zod')}
                  className={`btn btn-sm ${tsMode === 'zod' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ border: 'none', padding: '5px 12px', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  Zod Validation (.ts)
                </button>
                <button
                  type="button"
                  onClick={() => setTsMode('client')}
                  className={`btn btn-sm ${tsMode === 'client' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ border: 'none', padding: '5px 12px', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  Type-Safe API Client SDK
                </button>
              </div>
            </div>

            {/* Options Toolbar & Export Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
              {/* Options Toggles */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                {tsMode === 'interfaces' && (
                  <>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.775rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={tsIncludeJsDoc}
                        onChange={(e) => setTsIncludeJsDoc(e.target.checked)}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <span>JSDoc Annotations</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.775rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={tsIncludeCrudDtos}
                        onChange={(e) => setTsIncludeCrudDtos(e.target.checked)}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <span>CRUD DTOs (Create / Update)</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.775rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={tsIncludeEnvelopes}
                        onChange={(e) => setTsIncludeEnvelopes(e.target.checked)}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <span>API Pagination Envelopes</span>
                    </label>
                  </>
                )}

                {tsMode === 'zod' && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Generates runtime validation schemas for Webhooks, Serverless endpoints, and API payload safety (requires <code>zod</code>).
                  </span>
                )}

                {tsMode === 'client' && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Zero-dependency client library using native <code>fetch</code> with full autocompletion and error handling.
                  </span>
                )}
              </div>

              {/* Action Buttons: Copy & Download */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const filename = tsMode === 'interfaces' 
                      ? `${schema?.appName || 'bubble'}-schema.d.ts` 
                      : tsMode === 'zod' 
                        ? `${schema?.appName || 'bubble'}-schemas.zod.ts` 
                        : `${schema?.appName || 'bubble'}-client.ts`;
                    handleDownloadCode(tsGeneratedCode, filename);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={13} color="var(--primary)" />
                  <span>
                    Download {tsMode === 'interfaces' ? '.d.ts' : tsMode === 'zod' ? 'Zod (.ts)' : 'Client (.ts)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(tsGeneratedCode, `${tsMode} code`)}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '5px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            {/* Code Output Viewer */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.675rem',
                color: 'var(--text-muted)',
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '3px 8px',
                borderRadius: '4px',
                backdropFilter: 'blur(4px)',
                zIndex: 2
              }}>
                <span>{schema ? `${schema.dataTypes.length} Models • ${schema.optionSets.length} Option Sets` : 'No schema loaded'}</span>
                <span>•</span>
                <span>{tsGeneratedCode.split('\n').length} lines</span>
              </div>

              <pre style={{
                background: 'var(--bg-input)',
                padding: '18px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: '#86efac',
                overflowX: 'auto',
                maxHeight: '520px',
                lineHeight: 1.5,
                margin: 0
              }}>
                {tsGeneratedCode || '// No schema available to generate TypeScript definitions.'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: SCHEMA MIGRATIONS */}
      {subTab === 'migrations' && (
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
        </div>
      )}

      {/* SUBTAB: DEV VS LIVE ENV SYNC */}
      {subTab === 'env_sync' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div className="card-title" style={{ margin: 0 }}>
                    <Layers size={18} color="var(--accent-cyan)" />
                    <span>Cross-Environment Diff & Pre-Release Checklist</span>
                  </div>
                  {envDiff && (
                    <span
                      className={`badge ${
                        envDiff.secretKeyMismatches.some(k => k.inSource && !k.inTarget)
                          ? 'badge-rose'
                          : envDiff.missingDataTypesInTarget.length > 0
                          ? 'badge-amber'
                          : 'badge-emerald'
                      }`}
                      style={{ fontSize: '0.675rem', fontWeight: 700 }}
                    >
                      {envDiff.secretKeyMismatches.some(k => k.inSource && !k.inTarget)
                        ? '🔴 HIGH DRIFT RISK (Missing Keys)'
                        : envDiff.missingDataTypesInTarget.length > 0
                        ? '🟡 MEDIUM DRIFT RISK (New Tables)'
                        : '🟢 LOW DRIFT RISK (Additive Fields Only)'}
                    </span>
                  )}
                </div>
                <div className="card-subtitle" style={{ marginTop: '4px' }}>
                  Comparing <code>version-test</code> (Development) ➔ <code>live</code> (Production)
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {envDiff && (
                  <button
                    type="button"
                    onClick={handleExportEnvSignoffMarkdown}
                    className="btn btn-secondary btn-sm"
                    title="Export Pre-Release Sign-off Markdown Report"
                  >
                    <FileText size={13} color="var(--accent-cyan)" />
                    <span>Export Sign-off (.md)</span>
                  </button>
                )}
                <button onClick={loadEnvSync} disabled={isSyncingEnv} className="btn btn-primary btn-sm">
                  <RefreshCw size={13} className={isSyncingEnv ? 'spin' : ''} />
                  <span>{isSyncingEnv ? 'Analyzing Diff...' : 'Run Env Diff'}</span>
                </button>
              </div>
            </div>

            {envDiff && (
              <>
                <div className="grid-3" style={{ marginTop: '14px' }}>
                  <div
                    className="card"
                    style={{ background: 'var(--bg-input)', cursor: envDiff.missingDataTypesInTarget.length > 0 ? 'pointer' : 'default', transition: 'all 0.15s ease' }}
                    onClick={() => envDiff.missingDataTypesInTarget.length > 0 && setSelectedNewTable(envDiff.missingDataTypesInTarget[0])}
                    title={envDiff.missingDataTypesInTarget.length > 0 ? 'Click to inspect pending new table' : undefined}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NEW TABLES PENDING DEPLOY</div>
                      {envDiff.missingDataTypesInTarget.length > 0 && <Info size={13} color="var(--accent-amber)" />}
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: envDiff.missingDataTypesInTarget.length > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                      {envDiff.missingDataTypesInTarget.length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', wordBreak: 'break-word', lineHeight: 1.3 }}>
                      {envDiff.missingDataTypesInTarget.join(', ') || 'All tables synced in Live'}
                    </div>
                  </div>

                  <div className="card" style={{ background: 'var(--bg-input)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NEW FIELDS PENDING DEPLOY</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: envDiff.missingFieldsInTarget.length > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                      {envDiff.missingFieldsInTarget.length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', wordBreak: 'break-word', lineHeight: 1.3 }}>
                      Across {Array.from(new Set(envDiff.missingFieldsInTarget.map(f => f.dataType))).join(', ') || 'all models'}
                    </div>
                  </div>

                  <div className="card" style={{ background: 'var(--bg-input)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SECRET KEYS & API STATUS</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: envDiff.secretKeyMismatches.some(k => k.inSource && !k.inTarget) ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                      {envDiff.secretKeyMismatches.filter(k => k.inSource && k.inTarget).length} / {envDiff.secretKeyMismatches.length} Verified
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>In Live environment settings</div>
                  </div>
                </div>

                {/* Pending Fields Table */}
                {envDiff.missingFieldsInTarget.length > 0 && (
                  <div style={{ marginTop: '14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={15} color="var(--accent-amber)" />
                        <span>Pending Fields in Development (Click to inspect field definition)</span>
                      </div>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{envDiff.missingFieldsInTarget.length} fields</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '12px' }}>
                      {envDiff.missingFieldsInTarget.map((f, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedEnvField(f)}
                          style={{
                            padding: '12px 14px',
                            background: 'rgba(245, 158, 11, 0.07)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(245, 158, 11, 0.25)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          title="Click to view full field details and deployment safety info"
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong style={{ fontSize: '0.825rem', color: 'var(--text-primary)', wordBreak: 'break-word', lineHeight: 1.3, display: 'block' }}>
                              {f.dataType}.{f.fieldName}
                            </strong>
                            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>Type: <code style={{ color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>{f.fieldType}</code></span>
                              <span style={{ color: 'var(--text-muted)' }}>• Click for details</span>
                            </div>
                          </div>
                          <span className="badge badge-amber" style={{ fontSize: '0.65rem', flexShrink: 0, marginTop: '2px' }}>PENDING</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Secret Keys Checklist Grid */}
                <div style={{ marginTop: '14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={15} color="var(--accent-emerald)" />
                      <span>Live Environment Configuration & Permissions (Click to view guide)</span>
                    </div>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>4 Security Checks</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                    {envDiff.secretKeyMismatches.map((k, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedSecretKey(k)}
                        style={{
                          padding: '12px 14px',
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        title="Click to view security and setup documentation"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Key size={14} color="var(--primary)" />
                          </div>
                          <span style={{ fontSize: '0.775rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', wordBreak: 'break-all', fontWeight: 600 }}>
                            {k.keyName}
                          </span>
                        </div>
                        <span className={`badge ${k.inTarget ? 'badge-emerald' : 'badge-rose'}`} style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                          {k.inTarget ? 'LIVE SYNCED' : 'MISSING IN LIVE'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Release Tasks Checklist */}
          {releaseTasks.length > 0 && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                <div className="card-title" style={{ margin: 0 }}>
                  <CheckCircle2 size={16} color="var(--accent-emerald)" />
                  <span>Pre-Release Checklist ({releaseTasks.filter(t => t.completed).length} / {releaseTasks.length} Ready)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '120px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${(releaseTasks.filter(t => t.completed).length / releaseTasks.length) * 100}%`,
                        height: '100%',
                        background: releaseTasks.filter(t => t.completed).length === releaseTasks.length ? 'var(--accent-emerald)' : 'var(--primary)',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                  <span className={`badge ${releaseTasks.filter(t => t.completed).length === releaseTasks.length ? 'badge-emerald' : 'badge-amber'}`}>
                    {releaseTasks.filter(t => t.completed).length === releaseTasks.length ? 'READY TO DEPLOY' : 'IN PROGRESS'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {releaseTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => setReleaseTasks(releaseTasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      background: 'var(--bg-input)',
                      borderRadius: 'var(--radius-sm)',
                      border: task.completed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => {}}
                      style={{ cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1, fontSize: '0.85rem', color: task.completed ? 'var(--accent-emerald)' : 'var(--text-primary)', textDecoration: task.completed ? 'line-through' : 'none' }}>
                      {task.title}
                    </div>
                    <span className={`badge ${task.category === 'database' ? 'badge-indigo' : task.category === 'security' ? 'badge-rose' : 'badge-cyan'}`} style={{ textTransform: 'capitalize' }}>
                      {task.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal 1: Pending Field Detailed Inspector */}
          {selectedEnvField && (
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
                maxWidth: '520px',
                backgroundColor: 'var(--bg-surface-elevated, #121826)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: 'var(--radius-lg, 12px)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.15)',
                overflow: 'hidden',
                animation: 'modalSlideIn 0.2s ease-out'
              }}>
                <div style={{
                  padding: '18px 22px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(18, 24, 38, 0.9) 100%)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(245, 158, 11, 0.2)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-amber)'
                    }}>
                      <Info size={18} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        Field Deployment Inspector
                      </h2>
                      <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                        Pending field in Development (version-test)
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedEnvField(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '0.8rem'
                  }}>
                    <div>• <strong>Data Model (Table):</strong> <span style={{ color: 'var(--accent-cyan)' }}>{selectedEnvField.dataType}</span></div>
                    <div>• <strong>Field Name:</strong> <code style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{selectedEnvField.fieldName}</code></div>
                    <div>• <strong>Bubble Field Type:</strong> <span className="badge badge-indigo">{selectedEnvField.fieldType}</span></div>
                    <div>• <strong>Status:</strong> <span className="badge badge-amber">PENDING LIVE DEPLOY</span></div>
                  </div>

                  <div style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    fontSize: '0.75rem',
                    color: 'var(--accent-emerald)',
                    lineHeight: 1.4
                  }}>
                    🛡️ <strong>Safety Analysis:</strong> Adding this field will not cause data loss in Live. Existing records in production will simply hold a <code>null</code> value for this field until written.
                  </div>

                  <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginBottom: '4px' }}>TypeScript Interface Representation:</div>
                    <code style={{ fontSize: '0.775rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {selectedEnvField.fieldName}?: {selectedEnvField.fieldType === 'number' ? 'number' : selectedEnvField.fieldType === 'boolean' ? 'boolean' : selectedEnvField.fieldType === 'date' ? 'string' : 'string'};
                    </code>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedEnvField(null)}
                      className="btn btn-secondary btn-sm"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${selectedEnvField.dataType}.${selectedEnvField.fieldName} (${selectedEnvField.fieldType})`);
                        toast.success('Field reference copied!');
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      <Copy size={13} />
                      <span>Copy Field Reference</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal 2: Secret Key & Configuration Guide Modal */}
          {selectedSecretKey && (
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
                maxWidth: '520px',
                backgroundColor: 'var(--bg-surface-elevated, #121826)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: 'var(--radius-lg, 12px)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.2)',
                overflow: 'hidden',
                animation: 'modalSlideIn 0.2s ease-out'
              }}>
                <div style={{
                  padding: '18px 22px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(18, 24, 38, 0.9) 100%)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(99, 102, 241, 0.25)',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)'
                    }}>
                      <Key size={18} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        Security Key Configuration
                      </h2>
                      <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                        Environment credentials & endpoint verification
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedSecretKey(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '0.8rem'
                  }}>
                    <div>• <strong>Configuration Key:</strong> <code style={{ color: 'var(--accent-cyan)' }}>{selectedSecretKey.keyName}</code></div>
                    <div>• <strong>Development Status:</strong> <span className="badge badge-emerald">CONFIGURED & ACTIVE</span></div>
                    <div>• <strong>Live Production Status:</strong> <span className={`badge ${selectedSecretKey.inTarget ? 'badge-emerald' : 'badge-rose'}`}>{selectedSecretKey.inTarget ? 'LIVE SYNCED' : 'ACTION REQUIRED'}</span></div>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {selectedSecretKey.keyName === 'BUBBLE_API_TOKEN' && 'This bearer token authenticates API calls made to your Live Bubble Data and Workflow endpoints.'}
                    {selectedSecretKey.keyName === 'DATA_API_ACCESS' && 'Ensures the Bubble Data API is enabled for client reading/writing across active models in Live.'}
                    {selectedSecretKey.keyName === 'META_API_ACCESS' && 'Allows introspection of Swagger/OpenAPI schema endpoints for automated documentation generation.'}
                    {selectedSecretKey.keyName === 'WEBHOOK_SIGNING_SECRET' && 'Cryptographically validates incoming HTTP webhook payloads to prevent unauthorized request forgery.'}
                  </div>

                  <div style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    fontSize: '0.75rem',
                    color: 'var(--text-primary)',
                    lineHeight: 1.4
                  }}>
                    📍 <strong>Bubble Settings Location:</strong> In your Bubble Editor, navigate to <strong>Settings ➔ API</strong> to verify token permissions and privacy rule defaults.
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedSecretKey(null)}
                      className="btn btn-primary btn-sm"
                    >
                      Understood
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal 3: New Table Detailed Inspector */}
          {selectedNewTable && (
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
                maxWidth: '500px',
                backgroundColor: 'var(--bg-surface-elevated, #121826)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: 'var(--radius-lg, 12px)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.15)',
                overflow: 'hidden',
                animation: 'modalSlideIn 0.2s ease-out'
              }}>
                <div style={{
                  padding: '18px 22px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(18, 24, 38, 0.9) 100%)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(245, 158, 11, 0.2)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-amber)'
                    }}>
                      <Table size={18} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        New Table Pending Deploy
                      </h2>
                      <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                        Data type created in Development
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedNewTable(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '0.8rem'
                  }}>
                    <div>• <strong>Table Name:</strong> <code style={{ color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>{selectedNewTable}</code></div>
                    <div>• <strong>Environment Status:</strong> <span className="badge badge-amber">EXISTS IN DEV ONLY</span></div>
                    <div>• <strong>Deployment Action:</strong> Will be created in Live upon publishing.</div>
                  </div>

                  <div style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(244, 63, 94, 0.08)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    fontSize: '0.75rem',
                    color: 'var(--accent-rose)',
                    lineHeight: 1.4
                  }}>
                    ⚠️ <strong>Privacy Rules Check:</strong> Ensure you define Privacy Rules for <code>{selectedNewTable}</code> before publishing to Live to avoid unintended public Data API exposure.
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedNewTable(null)}
                      className="btn btn-secondary btn-sm"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedNewTable(null);
                        setSubTab('schema');
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      <span>View in Schema Explorer</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 5: BACKUP & RESTORE */}
      {subTab === 'backups' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <HardDriveDownload size={18} color="var(--accent-cyan)" />
                  <span>Automated Database Backup & Export</span>
                </div>
                <div className="card-subtitle">Export records with encryption, selective table scoping, and cloud target destination</div>
              </div>
              <button onClick={handleRunBackup} disabled={isBackingUp} className="btn btn-primary btn-sm">
                <HardDriveDownload size={14} className={isBackingUp ? 'spin' : ''} />
                <span>{isBackingUp ? 'Exporting...' : 'Start Backup'}</span>
              </button>
            </div>

            {/* Scope Selection */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Backup Scope:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setBackupScope('all')}
                  className={`btn btn-sm ${backupScope === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  All Tables (Full Database)
                </button>
                <button
                  type="button"
                  onClick={() => setBackupScope('selective')}
                  className={`btn btn-sm ${backupScope === 'selective' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  Selective Tables (Micro-Backup)
                </button>
              </div>

              {backupScope === 'selective' && schema && (
                <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedBackupTables(schema.dataTypes.map(d => d.name))}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBackupTables([])}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Selective Tables Chips */}
            {backupScope === 'selective' && schema && (
              <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {schema.dataTypes.map(dt => {
                  const isSelected = selectedBackupTables.includes(dt.name);
                  return (
                    <button
                      key={dt.id || dt.name}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedBackupTables(selectedBackupTables.filter(t => t !== dt.name));
                        } else {
                          setSelectedBackupTables([...selectedBackupTables, dt.name]);
                        }
                      }}
                      className={`badge ${isSelected ? 'badge-cyan' : 'badge-indigo'}`}
                      style={{
                        cursor: 'pointer',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        opacity: isSelected ? 1 : 0.6,
                        border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid transparent'
                      }}
                    >
                      {isSelected ? '✓ ' : '+ '}{dt.name}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="grid-4" style={{ marginTop: '12px' }}>
              <div>
                <label className="input-label">Output Format</label>
                <select value={backupFormat} onChange={e => setBackupFormat(e.target.value as any)} className="select">
                  <option value="json">JSON (Structured)</option>
                  <option value="csv">CSV (Spreadsheet)</option>
                </select>
              </div>
              <div>
                <label className="input-label">Incremental (Since Date)</label>
                <input type="date" value={backupSinceDate} onChange={e => setBackupSinceDate(e.target.value)} className="input" />
              </div>
              <div>
                <label className="input-label">AES-256 Passphrase (Optional)</label>
                <input type="password" placeholder="Passphrase..." value={backupEncryptPass} onChange={e => setBackupEncryptPass(e.target.value)} className="input" />
              </div>
              <div>
                <label className="input-label">Cloud Destination (S3 / GCS)</label>
                <input type="text" placeholder="s3://my-bucket/backups" value={backupCloudDest} onChange={e => setBackupCloudDest(e.target.value)} className="input" />
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div className="card-title" style={{ margin: 0 }}>
                <HardDriveDownload size={16} color="var(--accent-cyan)" />
                <span>Created Backups & Archives ({backupsList.length})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportBackup}
                  accept=".json"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowScheduleBackupModal(true)}
                  className="btn btn-secondary btn-sm"
                  title="Generate automated scheduled cron backup workflow"
                >
                  <Clock size={13} color="var(--accent-amber)" />
                  <span>Schedule (Cron)</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary btn-sm"
                  title="Import and restore backup from JSON archive"
                >
                  <UploadCloud size={13} color="var(--accent-cyan)" />
                  <span>Import Archive (.json)</span>
                </button>
                <button onClick={loadBackups} className="btn btn-secondary btn-sm" title="Reload stored backups">
                  <RefreshCw size={12} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {backupsList.length === 0 ? (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '24px 20px',
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}>
                <HardDriveDownload size={32} style={{ margin: '0 auto 10px', opacity: 0.4, display: 'block' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  No Backups Stored Yet
                </div>
                <div style={{ fontSize: '0.8rem', maxWidth: '460px', margin: '0 auto 12px', lineHeight: 1.5 }}>
                  Click <strong>"Start Backup"</strong> above or press <code>Ctrl+B</code> / <code>Cmd+B</code> to export your Bubble database. Backups are stored safely in local IndexedDB.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {backupsList.map(b => (
                  <div
                    key={b.backupId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: 'var(--bg-input)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                          {b.backupId}
                        </span>
                        <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                          COMPLETED
                        </span>
                        <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                          {(b.format || 'json').toUpperCase()}
                        </span>
                        {b.scope === 'selective' && (
                          <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                            SELECTIVE ({b.tables?.length || 1})
                          </span>
                        )}
                        {b.encrypted && (
                          <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                            AES-256
                          </span>
                        )}
                        {b.checksum && (
                          <span
                            className="badge badge-indigo"
                            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', cursor: 'pointer' }}
                            onClick={() => handleCopy(b.checksum!, 'Checksum')}
                            title={`Click to copy SHA-256: ${b.checksum}`}
                          >
                            {b.checksum.substring(0, 16)}...
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--accent-cyan)' }}>{b.recordCount.toLocaleString()} records</strong> • {b.fileSizeKb} KB • {new Date(b.timestamp).toLocaleString()}
                      </div>
                      {b.tables && b.tables.length > 0 && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          Tables: {b.tables.join(', ')}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleDownloadBackup(b)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                        title="Download backup file"
                      >
                        <Download size={13} />
                        <span>Download</span>
                      </button>

                      <button
                        onClick={() => handleCopy(b.backupId, 'Backup ID')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '5px 8px' }}
                        title="Copy Backup ID"
                      >
                        <Copy size={13} />
                      </button>

                      <button
                        onClick={() => setBackupToDelete(b)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '5px 8px', color: 'var(--accent-rose)' }}
                        title="Delete Backup"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete Backup Confirmation Modal */}
          {backupToDelete && (
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
                maxWidth: '460px',
                backgroundColor: 'var(--bg-surface-elevated, #121826)',
                border: '1px solid rgba(244, 63, 94, 0.35)',
                borderRadius: 'var(--radius-lg, 12px)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(244, 63, 94, 0.15)',
                overflow: 'hidden',
                animation: 'modalSlideIn 0.2s ease-out'
              }}>
                {/* Modal Header */}
                <div style={{
                  padding: '18px 22px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(18, 24, 38, 0.9) 100%)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(244, 63, 94, 0.2)',
                      border: '1px solid rgba(244, 63, 94, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-rose, #f43f5e)'
                    }}>
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        Delete Database Backup
                      </h2>
                      <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                        Permanent deletion confirmation
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBackupToDelete(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Body */}
                <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    Are you sure you want to permanently delete backup <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{backupToDelete.backupId}</strong>?
                  </p>

                  <div style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.775rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div>• <strong>Format:</strong> {(backupToDelete.format || 'json').toUpperCase()}{backupToDelete.encrypted ? ' (AES-256 Encrypted)' : ''}</div>
                    <div>• <strong>Records:</strong> {backupToDelete.recordCount.toLocaleString()} rows</div>
                    <div>• <strong>File Size:</strong> {backupToDelete.fileSizeKb} KB</div>
                    <div>• <strong>Created:</strong> {new Date(backupToDelete.timestamp).toLocaleString()}</div>
                    {backupToDelete.tables && backupToDelete.tables.length > 0 && (
                      <div>• <strong>Tables:</strong> {backupToDelete.tables.join(', ')}</div>
                    )}
                  </div>

                  <div style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    fontSize: '0.75rem',
                    color: 'var(--accent-rose)'
                  }}>
                    ⚠️ This action is irreversible. The backup archive stored in local IndexedDB will be permanently erased.
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setBackupToDelete(null)}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const id = backupToDelete.backupId;
                        setBackupToDelete(null);
                        await handleDeleteBackup(id);
                      }}
                      className="btn btn-primary btn-sm"
                      style={{
                        backgroundColor: 'var(--accent-rose, #f43f5e)',
                        borderColor: 'rgba(244, 63, 94, 0.4)'
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Yes, Delete Backup</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Backup (Cron / GitHub Action) Modal */}
          {showScheduleBackupModal && (
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
                maxWidth: '560px',
                backgroundColor: 'var(--bg-surface-elevated, #121826)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: 'var(--radius-lg, 12px)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.15)',
                overflow: 'hidden',
                animation: 'modalSlideIn 0.2s ease-out'
              }}>
                <div style={{
                  padding: '18px 22px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(18, 24, 38, 0.9) 100%)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(245, 158, 11, 0.2)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-amber, #f59e0b)'
                    }}>
                      <Clock size={18} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        Automated Backup Scheduler
                      </h2>
                      <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                        GitHub Actions & CI/CD Cron Scaffolder
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowScheduleBackupModal(false)}
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
                  <div>
                    <label className="input-label">Backup Frequency</label>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setScheduleCronFreq('daily')}
                        className={`btn btn-sm ${scheduleCronFreq === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem', flex: 1 }}
                      >
                        Daily (Midnight UTC)
                      </button>
                      <button
                        type="button"
                        onClick={() => setScheduleCronFreq('6hours')}
                        className={`btn btn-sm ${scheduleCronFreq === '6hours' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem', flex: 1 }}
                      >
                        Every 6 Hours
                      </button>
                      <button
                        type="button"
                        onClick={() => setScheduleCronFreq('weekly')}
                        className={`btn btn-sm ${scheduleCronFreq === 'weekly' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem', flex: 1 }}
                      >
                        Weekly (Sunday)
                      </button>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="input-label" style={{ margin: 0 }}>GitHub Actions Workflow YAML (<code>.github/workflows/bubble_backup.yml</code>)</label>
                      <button
                        type="button"
                        onClick={() => {
                          const cronExpr = scheduleCronFreq === 'daily' ? '0 0 * * *' : scheduleCronFreq === '6hours' ? '0 */6 * * *' : '0 0 * * 0';
                          const yaml = `name: Scheduled Bubble.io Database Backup
on:
  schedule:
    - cron: '${cronExpr}'
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Automated Backup via Bubble Dev Studio CLI
        env:
          BUBBLE_API_TOKEN: \${{ secrets.BUBBLE_API_TOKEN }}
          BUBBLE_APP_ID: '${activeProject?.appId || 'bubble-app'}'
        run: |
          echo "Starting automated database export for $BUBBLE_APP_ID..."
          curl -X POST "https://$BUBBLE_APP_ID.bubbleapps.io/api/1.1/obj/User" \\
            -H "Authorization: Bearer $BUBBLE_API_TOKEN" \\
            -o backup_user_\$(date +%Y%m%d_%H%M%S).json
          echo "Backup completed successfully."
`;
                          handleCopy(yaml, 'GitHub Actions YAML');
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                      >
                        <Copy size={11} />
                        <span>Copy YAML</span>
                      </button>
                    </div>

                    <pre style={{
                      margin: 0,
                      padding: '12px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.725rem',
                      color: 'var(--accent-cyan)',
                      overflowX: 'auto',
                      maxHeight: '180px'
                    }}>
{`name: Scheduled Bubble.io Database Backup
on:
  schedule:
    - cron: '${scheduleCronFreq === 'daily' ? '0 0 * * *' : scheduleCronFreq === '6hours' ? '0 */6 * * *' : '0 0 * * 0'}'
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Run Backup Job
        env:
          BUBBLE_API_TOKEN: \${{ secrets.BUBBLE_API_TOKEN }}
        run: |
          echo "Running automated backup for ${activeProject?.appId || 'bubble-app'}..."`}
                    </pre>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setShowScheduleBackupModal(false)}
                      className="btn btn-primary btn-sm"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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
      )}

      {/* SUBTAB 6: DATA BROWSER REPL */}
      {subTab === 'query' && (
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
                      <option key={dt.id} value={dt.name}>{dt.name}</option>
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
                    onClick={() => setSubTab('data_grid')}
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
                      onClick={() => setSubTab('seeder')}
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
      )}

      {/* SUBTAB 7: RELATIONAL SEEDER */}
      {subTab === 'seeder' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Relational Syntax & Rules Guide Card */}
          <div className="card" style={{ background: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="var(--primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  How Relational Seeding Works (3 Simple Steps)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.725rem', color: 'var(--accent-cyan)' }}>
                <span style={{ background: 'rgba(6, 182, 212, 0.08)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
                  1. Load/Write ➔ 2. Validate DAG ➔ 3. Execute
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: 'var(--accent-cyan)', display: 'block', marginBottom: '3px' }}>Step 1. Define Aliases (<code>_ref</code>)</strong>
                Give parent records a temporary alias (e.g. <code>"_ref": "@user_admin"</code>) instead of real Bubble IDs.
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: 'var(--accent-emerald)', display: 'block', marginBottom: '3px' }}>Step 2. Link Child Records</strong>
                Use the <code>@alias</code> in any related field (e.g. <code>"owner": "@user_admin"</code> or <code>"company": "@comp_acme"</code>).
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: 'var(--accent-indigo)', display: 'block', marginBottom: '3px' }}>Step 3. Auto DAG Resolution</strong>
                The engine sorts tables topologically, inserts parents first, captures real Bubble IDs, and injects them into children.
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: 'var(--accent-amber)', display: 'block', marginBottom: '3px' }}>Circular References (2-Pass)</strong>
                Circular relations are automatically created and resolved in a 2nd-pass <code>PATCH</code> request.
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div className="card-title">
                  <Share2 size={18} color="var(--accent-cyan)" />
                  <span>Relational Seed JSON Editor</span>
                </div>
                <div className="card-subtitle">Write relational JSON, load pre-built templates, or generate from your schema</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={handleGenerateSchemaTemplate} className="btn btn-secondary btn-sm" title="Step 1: Generate seed structure from active project schema">
                  <Sparkles size={12} />
                  <span>Schema Template</span>
                </button>
                <button onClick={handleLoadRelationalExample} className="btn btn-secondary btn-sm" title="Step 1: Load sample multi-table example with linked users, companies and projects">
                  <FileSpreadsheet size={12} />
                  <span>Sample Example</span>
                </button>
                <button onClick={() => handleCopy(seedDataJson, 'Relational Seed JSON')} className="btn btn-secondary btn-sm" title="Copy JSON">
                  <Copy size={12} />
                </button>
                <button onClick={handleParseSeedPlan} className="btn btn-secondary btn-sm" title="Step 2: Validate syntax and calculate DAG insertion order" style={{ border: '1px solid var(--primary)' }}>
                  <Play size={13} color="var(--primary)" />
                  <span style={{ fontWeight: 700 }}>Validate & Plan DAG</span>
                </button>
                <button onClick={handleExecuteSeed} disabled={!seedPlan || isSeeding} className="btn btn-primary btn-sm" title={!seedPlan ? 'Click "Validate & Plan DAG" first to enable execution' : 'Step 3: Insert all records into Bubble Data API'}>
                  <Upload size={13} className={isSeeding ? 'spin' : ''} />
                  <span>{isSeeding ? 'Seeding...' : 'Execute Live Seed'}</span>
                </button>
              </div>
            </div>

            {/* Validation Feedback Banner */}
            {seedValidation && (
              <div style={{
                marginBottom: '12px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: seedValidation.valid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                border: `1px solid ${seedValidation.valid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                fontSize: '0.775rem'
              }}>
                <div style={{ fontWeight: 700, color: seedValidation.valid ? 'var(--accent-emerald)' : 'var(--accent-rose)', marginBottom: '4px' }}>
                  {seedValidation.valid ? '✓ Preflight Schema Check Passed' : '⚠ Schema Validation Issues Detected'}
                </div>
                {seedValidation.errors.map((err, i) => (
                  <div key={i} style={{ color: 'var(--accent-rose)', marginLeft: '8px' }}>• {err}</div>
                ))}
                {seedValidation.warnings.map((warn, i) => (
                  <div key={i} style={{ color: 'var(--accent-amber)', marginLeft: '8px' }}>• {warn}</div>
                ))}
              </div>
            )}

            <textarea
              rows={14}
              value={seedDataJson}
              onChange={e => setSeedDataJson(e.target.value)}
              className="input"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', width: '100%', resize: 'vertical' }}
            />
          </div>

          {seedPlan && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: '12px' }}>
                <span>Execution Plan ({seedPlan.totalRecords} Records • {seedPlan.steps.length} Stages)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {seedPlan.steps.map((st) => (
                  <div key={st.step} style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="badge badge-indigo">Stage {st.step}</span>
                    <span style={{ fontSize: '0.85rem' }}>{st.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 8: DB EXPORT */}
      {subTab === 'export_db' && (
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
                <select value={exportDbTarget} onChange={e => { setExportDbTarget(e.target.value as any); setTimeout(updateDbExportScript, 50); }} className="select">
                  <option value="sqlite">SQLite (Local .db / sql.js)</option>
                  <option value="postgres">PostgreSQL (Server / Supabase)</option>
                  <option value="bigquery">Google BigQuery (Enterprise DWH)</option>
                </select>
              </div>
              <div>
                <label className="input-label">Data Type to Export</label>
                <select value={exportDbType} onChange={e => { setExportDbType(e.target.value); setTimeout(updateDbExportScript, 50); }} className="select">
                  <option value="User">User</option>
                  <option value="Product">Product</option>
                  <option value="Order">Order</option>
                  <option value="Category">Category</option>
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
      )}

      {/* SUBTAB 9: PII PRIVACY AUDIT */}
      {subTab === 'pii_audit' && piiReport && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={18} color="var(--accent-rose)" />
                  <span>Personally Identifiable Information (PII) & Privacy Audit</span>
                </div>
                <div className="card-subtitle">Scans schema field names across 8 vulnerability categories with Bubble Privacy Rule remediations</div>
              </div>

              {/* Quick Export Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    const md = PiiScanner.generateMarkdownReport(piiReport);
                    handleDownloadCode(md, `${piiReport.appName || 'bubble'}-pii-audit-report.md`);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Download size={13} color="var(--primary)" />
                  <span>Report (.md)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const json = JSON.stringify(piiReport, null, 2);
                    handleDownloadCode(json, `${piiReport.appName || 'bubble'}-pii-audit.json`);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Download size={13} color="var(--accent-cyan)" />
                  <span>Report (.json)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const matrix = PiiScanner.generatePrivacyRulesMatrix(piiReport);
                    handleCopy(matrix, 'Privacy Rules Matrix');
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>Copy Privacy Matrix</span>
                </button>
              </div>
            </div>

            {/* Metric Risk Cards with Click-to-Filter */}
            <div className="grid-3" style={{ marginBottom: '16px' }}>
              <div 
                onClick={() => setPiiSeverityFilter(prev => prev === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
                className="card" 
                style={{ 
                  padding: '12px 16px', 
                  background: piiSeverityFilter === 'CRITICAL' ? 'rgba(244, 63, 94, 0.22)' : 'rgba(244, 63, 94, 0.1)', 
                  border: piiSeverityFilter === 'CRITICAL' ? '2px solid #f43f5e' : '1px solid rgba(244, 63, 94, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Click to filter Critical findings"
              >
                <div style={{ fontSize: '0.75rem', color: '#f43f5e', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>CRITICAL RISK FINDINGS</span>
                  {piiSeverityFilter === 'CRITICAL' && <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>FILTER ACTIVE</span>}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f43f5e', marginTop: '2px' }}>{piiReport.criticalCount}</div>
              </div>

              <div 
                onClick={() => setPiiSeverityFilter(prev => prev === 'HIGH' ? 'ALL' : 'HIGH')}
                className="card" 
                style={{ 
                  padding: '12px 16px', 
                  background: piiSeverityFilter === 'HIGH' ? 'rgba(245, 158, 11, 0.22)' : 'rgba(245, 158, 11, 0.1)', 
                  border: piiSeverityFilter === 'HIGH' ? '2px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Click to filter High findings"
              >
                <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>HIGH RISK FINDINGS</span>
                  {piiSeverityFilter === 'HIGH' && <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>FILTER ACTIVE</span>}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>{piiReport.highCount}</div>
              </div>

              <div 
                onClick={() => setPiiSeverityFilter(prev => prev === 'MEDIUM' ? 'ALL' : 'MEDIUM')}
                className="card" 
                style={{ 
                  padding: '12px 16px', 
                  background: piiSeverityFilter === 'MEDIUM' ? 'rgba(59, 130, 246, 0.22)' : 'rgba(59, 130, 246, 0.1)', 
                  border: piiSeverityFilter === 'MEDIUM' ? '2px solid #3b82f6' : '1px solid rgba(59, 130, 246, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Click to filter Medium findings"
              >
                <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>MEDIUM RISK FINDINGS</span>
                  {piiSeverityFilter === 'MEDIUM' && <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>FILTER ACTIVE</span>}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6', marginTop: '2px' }}>{piiReport.mediumCount}</div>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', background: 'var(--bg-input)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              {/* Severity Pill Selector */}
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '4px' }}>Severity:</span>
                <button
                  type="button"
                  onClick={() => setPiiSeverityFilter('ALL')}
                  className={`btn btn-sm ${piiSeverityFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '3px 9px', fontSize: '0.7rem' }}
                >
                  All ({piiReport.findings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPiiSeverityFilter('CRITICAL')}
                  className={`btn btn-sm ${piiSeverityFilter === 'CRITICAL' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '3px 9px', fontSize: '0.7rem', color: piiSeverityFilter === 'CRITICAL' ? '#fff' : '#f43f5e' }}
                >
                  Critical ({piiReport.criticalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setPiiSeverityFilter('HIGH')}
                  className={`btn btn-sm ${piiSeverityFilter === 'HIGH' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '3px 9px', fontSize: '0.7rem', color: piiSeverityFilter === 'HIGH' ? '#fff' : '#f59e0b' }}
                >
                  High ({piiReport.highCount})
                </button>
                <button
                  type="button"
                  onClick={() => setPiiSeverityFilter('MEDIUM')}
                  className={`btn btn-sm ${piiSeverityFilter === 'MEDIUM' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '3px 9px', fontSize: '0.7rem', color: piiSeverityFilter === 'MEDIUM' ? '#fff' : '#3b82f6' }}
                >
                  Medium ({piiReport.mediumCount})
                </button>
              </div>

              {/* Category Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Category:</span>
                <select
                  value={piiCategoryFilter}
                  onChange={(e) => setPiiCategoryFilter(e.target.value)}
                  className="select"
                  style={{ fontSize: '0.75rem', padding: '3px 8px', width: 'auto', minWidth: '150px' }}
                >
                  <option value="ALL">All Categories</option>
                  <option value="CREDENTIALS">Credentials & Tokens</option>
                  <option value="CONTACT_PII">Contact & Addresses</option>
                  <option value="GOVERNMENT_ID">Government IDs</option>
                  <option value="FINANCIAL">Financial & Banking</option>
                  <option value="BIOMETRIC">Biometrics</option>
                  <option value="MEDICAL">Medical & Health</option>
                  <option value="GEOLOCATION">Geolocation & GPS</option>
                  <option value="DEMOGRAPHICS">Demographics</option>
                </select>
              </div>

              {/* Instant Search Input */}
              <div style={{ flex: 1, minWidth: '180px', position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search table or field name (e.g. User, email, token)..."
                  value={piiSearchQuery}
                  onChange={(e) => setPiiSearchQuery(e.target.value)}
                  className="input"
                  style={{ paddingLeft: '30px', fontSize: '0.75rem', padding: '4px 8px 4px 30px' }}
                />
              </div>

              {(piiSeverityFilter !== 'ALL' || piiCategoryFilter !== 'ALL' || piiSearchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setPiiSeverityFilter('ALL');
                    setPiiCategoryFilter('ALL');
                    setPiiSearchQuery('');
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Filtered Findings List */}
          {(() => {
            const filteredFindings = piiReport.findings.filter(f => {
              if (piiSeverityFilter !== 'ALL' && f.severity !== piiSeverityFilter) return false;
              if (piiCategoryFilter !== 'ALL' && f.category !== piiCategoryFilter) return false;
              if (piiSearchQuery) {
                const q = piiSearchQuery.toLowerCase();
                const matchTable = f.table.toLowerCase().includes(q);
                const matchField = f.field.toLowerCase().includes(q);
                const matchDesc = f.description.toLowerCase().includes(q);
                if (!matchTable && !matchField && !matchDesc) return false;
              }
              return true;
            });

            return (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <span>Identified Vulnerable Fields ({filteredFindings.length} of {piiReport.findings.length})</span>
                  </div>
                </div>

                {filteredFindings.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    No PII findings match your active filter criteria.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredFindings.map(f => (
                      <div key={f.id} style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={`badge ${f.severity === 'CRITICAL' ? 'badge-rose' : f.severity === 'HIGH' ? 'badge-amber' : 'badge-cyan'}`}>
                              {f.severity}
                            </span>
                            <strong style={{ fontSize: '0.9rem' }}>{f.table}.{f.field}</strong>
                            <span className="badge badge-indigo">{f.category}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({f.type})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(`${f.table}.${f.field}`, 'Field name')}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.675rem', padding: '2px 6px' }}
                            title="Copy field reference"
                          >
                            <Copy size={10} />
                          </button>
                        </div>
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>{f.description}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 10px', borderRadius: '4px' }}>
                          💡 <strong>Bubble Privacy Rule Fix:</strong> {f.recommendation}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* SUBTAB 10: CI/CD & TEMPLATES */}
      {subTab === 'cicd' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Architecture & Concept Guide Banner */}
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)'
                }}>
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Enterprise CI/CD Pipelines & DevOps for Bubble.io
                  </h3>
                  <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                    Standardize automated backup jobs, Pull Request schema gates, and SDK scaffolding
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.725rem' }}>
                <span className="badge badge-indigo">Zero-Config Automation</span>
                <span className="badge badge-emerald">GitHub Actions & GitLab CI</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: 'var(--accent-cyan)', display: 'block', marginBottom: '3px' }}>1. Set Secrets in Repository</strong>
                Add <code>BUBBLE_APP_NAME</code> and <code>BUBBLE_API_KEY</code> into GitHub <em>Settings &gt; Secrets and variables &gt; Actions</em>.
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: 'var(--accent-emerald)', display: 'block', marginBottom: '3px' }}>2. Pick Pipeline Preset</strong>
                Choose between automated nightly backups, PR schema drift verification, or continuous Supabase replication.
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '3px' }}>3. Commit & Run in Cloud</strong>
                Download the <code>.yml</code> file and commit into <code>.github/workflows/</code> to run on GitHub's global cloud runners.
              </div>
            </div>
          </div>

          {/* Main 2-Column Grid */}
          <div className="grid-2">
            {/* Left: CI/CD Workflow Generator */}
            <div className="card">
              <div className="card-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div className="card-title">
                    <FileCode size={18} color="var(--primary)" />
                    <span>CI/CD Pipeline Generator</span>
                  </div>
                  <div className="card-subtitle">Generate YAML workflows for GitHub Actions and GitLab CI</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={handleDownloadCiYaml}
                    className="btn btn-secondary btn-sm"
                    title="Download Workflow File"
                  >
                    <Download size={12} color="var(--accent-emerald)" />
                    <span>Download YAML</span>
                  </button>
                  <button onClick={() => handleCopy(generatedCiYaml, 'CI YAML')} className="btn btn-secondary btn-sm">
                    <Copy size={12} />
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label className="input-label">Pipeline Preset & Goal</label>
                  <select
                    value={ciPreset}
                    onChange={e => setCiPreset(e.target.value as any)}
                    className="select"
                  >
                    <option value="backup">📦 Scheduled Nightly Automated Database Backup</option>
                    <option value="schema_drift">🛡️ PR Schema Drift & Lockfile Verification Gate</option>
                    <option value="security_gate">🔐 PII Privacy Rules & Security Vulnerability Gate</option>
                    <option value="supabase_sync">⚡ Continuous Data Sync to Supabase / PostgreSQL</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="input-label">CI Provider</label>
                    <select
                      value={ciProvider}
                      onChange={e => setCiProvider(e.target.value as any)}
                      className="select"
                    >
                      <option value="github">GitHub Actions (.github/workflows)</option>
                      <option value="gitlab">GitLab CI (.gitlab-ci.yml)</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="input-label">Cron Schedule (UTC)</label>
                    <input
                      type="text"
                      value={ciCron}
                      onChange={e => setCiCron(e.target.value)}
                      className="input"
                    />
                  </div>
                </div>
              </div>

              <pre style={{
                background: 'var(--bg-input)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: '#c4b5fd',
                overflowX: 'auto',
                maxHeight: '380px'
              }}>
                {generatedCiYaml}
              </pre>
            </div>

            {/* Right: Integration Template Scaffolder */}
            <div className="card">
              <div className="card-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div className="card-title">
                    <Code size={18} color="var(--accent-cyan)" />
                    <span>Integration Template Scaffolding</span>
                  </div>
                  <div className="card-subtitle">Generate production-ready boilerplate for plugins, APIs, and SDKs</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={handleDownloadScaffoldCode}
                    className="btn btn-secondary btn-sm"
                    title="Download Boilerplate Script"
                  >
                    <Download size={12} color="var(--accent-cyan)" />
                    <span>Download Code</span>
                  </button>
                  <button onClick={() => handleCopy(generatedScaffoldCode, 'Scaffold Code')} className="btn btn-secondary btn-sm">
                    <Copy size={12} />
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Template Pattern</label>
                  <select
                    value={scaffoldType}
                    onChange={e => setScaffoldType(e.target.value as any)}
                    className="select"
                  >
                    <option value="plugin-action">Plugin Server-Side Action (Node.js)</option>
                    <option value="api-connector">CRUD API Connector (TypeScript)</option>
                    <option value="webhook">Data Change Webhook Receiver (Express)</option>
                    <option value="sdk-quickstart">Type-Safe SDK Client Quickstart</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Component / Type Name</label>
                  <input
                    type="text"
                    value={scaffoldName}
                    onChange={e => setScaffoldName(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <pre style={{
                background: 'var(--bg-input)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: '#7dd3fc',
                overflowX: 'auto',
                maxHeight: '380px'
              }}>
                {generatedScaffoldCode}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 11: MOCK SERVER */}
      {subTab === 'mock_server' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <Server size={18} color="var(--accent-emerald)" />
                  <span>Local Mock Bubble API Server</span>
                </div>
                <div className="card-subtitle">In-memory Express-compatible mock API router for offline development and testing</div>
              </div>
              <button onClick={handleToggleMockServer} className={`btn ${mockStatus.isRunning ? 'btn-secondary' : 'btn-primary'} btn-sm`}>
                <Server size={13} />
                <span>{mockStatus.isRunning ? 'Stop Mock Server' : 'Start Mock Server (Port 3333)'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginTop: '6px' }}>
              <span className={`badge ${mockStatus.isRunning ? 'badge-emerald' : 'badge-rose'}`}>
                {mockStatus.isRunning ? 'RUNNING ON PORT ' + mockStatus.port : 'OFFLINE'}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Loaded Data Types: <strong>{mockStatus.loadedTypes.join(', ')}</strong> ({mockStatus.totalRecords} records in memory)
              </span>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-title" style={{ marginBottom: '10px' }}>
                <span>Available Mock Endpoints</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {MockServerEngine.getEndpoints().map((ep, idx) => (
                  <div key={idx} style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className={`badge ${ep.method === 'GET' ? 'badge-indigo' : ep.method === 'POST' ? 'badge-emerald' : ep.method === 'PATCH' ? 'badge-amber' : 'badge-rose'}`}>
                        {ep.method}
                      </span>
                      <code style={{ fontSize: '0.8rem', color: '#fff' }}>{ep.path}</code>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ep.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-title" style={{ marginBottom: '10px' }}>
                <span>Live Mock Endpoint Tester</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <select value={mockTestType} onChange={e => setMockTestType(e.target.value)} className="select" style={{ width: '120px' }}>
                  <option value="user">User</option>
                  <option value="product">Product</option>
                  <option value="order">Order</option>
                </select>
                <input type="text" placeholder="Record ID (optional)" value={mockTestId} onChange={e => setMockTestId(e.target.value)} className="input" style={{ flex: 1 }} />
                <button onClick={() => handleTestMockRequest('GET')} className="btn btn-secondary btn-sm">GET</button>
                <button onClick={() => handleTestMockRequest('POST')} className="btn btn-primary btn-sm">POST</button>
              </div>

              {mockTestResponse && (
                <pre style={{
                  background: 'var(--bg-input)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: '#a5f3fc',
                  maxHeight: '260px',
                  overflowY: 'auto'
                }}>
                  {JSON.stringify(mockTestResponse, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 12: WORKFLOW TRIGGER */}
      {subTab === 'workflow' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <Workflow size={18} color="var(--accent-cyan)" />
                  <span>Backend Workflow API Trigger</span>
                </div>
                <div className="card-subtitle">Dispatch API calls to backend workflows with custom parameters</div>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label className="input-label">Workflow API Name</label>
              <input type="text" value={wfName} onChange={e => setWfName(e.target.value)} className="input" placeholder="e.g. send-invoice" />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label className="input-label">Parameters Payload (JSON)</label>
              <textarea rows={6} value={wfPayload} onChange={e => setWfPayload(e.target.value)} className="input" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', resize: 'vertical' }} />
            </div>

            <button onClick={handleTriggerWorkflow} disabled={isTriggeringWf} className="btn btn-primary btn-sm">
              <Play size={13} />
              <span>{isTriggeringWf ? 'Triggering...' : 'Dispatch Backend Workflow'}</span>
            </button>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: '12px' }}>
              <span>Workflow API Response</span>
            </div>
            {wfResponse ? (
              <pre style={{
                background: 'var(--bg-input)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: '#86efac'
              }}>
                {JSON.stringify(wfResponse, null, 2)}
              </pre>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0' }}>
                Trigger a workflow on the left to view the live HTTP response.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
