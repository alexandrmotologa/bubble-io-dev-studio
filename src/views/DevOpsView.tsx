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
  FileSpreadsheet
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
import { CiGeneratorsEngine } from '../core/devops/ciGenerators';
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
  const [collapsedTables, setCollapsedTables] = useState<Set<string>>(new Set());

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

  const expandAllTables = () => {
    setCollapsedTables(new Set());
  };

  const collapseAllTables = () => {
    if (!schema) return;
    setCollapsedTables(new Set(schema.dataTypes.map(d => d.id || d.name)));
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

  // Migrations state
  const [lockfile, setLockfile] = useState<SchemaLockfile | null>(null);
  const [migrations, setMigrations] = useState<SchemaMigration[]>([]);
  const [newMigrationName, setNewMigrationName] = useState('');
  const [newMigrationDesc, setNewMigrationDesc] = useState('');

  // PII state
  const [piiReport, setPiiReport] = useState<PiiAuditReport | null>(null);

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
  const [ciCron, setCiCron] = useState('0 3 * * *');
  const [ciTypes, setCiTypes] = useState('');
  const [generatedCiYaml, setGeneratedCiYaml] = useState('');
  const [scaffoldType, setScaffoldType] = useState<'plugin-action' | 'api-connector' | 'webhook'>('plugin-action');
  const [scaffoldName, setScaffoldName] = useState('ProcessWorkflow');
  const [generatedScaffoldCode, setGeneratedScaffoldCode] = useState('');

  // Mock Server state
  const [mockStatus, setMockStatus] = useState(MockServerEngine.getStatus());
  const [mockTestType, setMockTestType] = useState('user');
  const [mockTestId, setMockTestId] = useState('');
  const [mockTestResponse, setMockTestResponse] = useState<any>(null);

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
      const payload = JSON.stringify(backup, null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${backup.backupId}.${backup.format || 'json'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onLog('devops', `Downloaded backup archive ${backup.backupId}.`, 'success');
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
          sinceDate: backupSinceDate || undefined
        },
        (msg, pct) => {
          setBackupStatusText(msg);
          setBackupProgress(pct);
          onLog('devops', msg);
        }
      );
      await loadBackups();
      onLog('devops', `Backup completed: ${result.backupId} (${result.recordCount} records, ${result.fileSizeKb} KB)`, 'success');
    } catch (e: any) {
      onLog('devops', `Backup failed: ${e.message}`, 'error');
    } finally {
      setIsBackingUp(false);
      setBackupProgress(0);
    }
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
    onLog('devops', `Generated migration '${mig.version}_${mig.name}.json' with ${mig.changes.length} declarative operation(s).`, 'success');
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

  const updateScaffoldCode = () => {
    if (scaffoldType === 'plugin-action') {
      setGeneratedScaffoldCode(TemplateScaffolderEngine.scaffoldPluginAction(scaffoldName));
    } else if (scaffoldType === 'api-connector') {
      setGeneratedScaffoldCode(TemplateScaffolderEngine.scaffoldApiConnector(scaffoldName));
    } else {
      setGeneratedScaffoldCode(TemplateScaffolderEngine.scaffoldWebhookReceiver(scaffoldName));
    }
  };

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search tables or fields..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="input"
                  style={{ paddingLeft: '34px' }}
                />
              </div>

              {schema && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-indigo" style={{ fontSize: '0.75rem' }}>
                    {schema.dataTypes.length} Tables • {schema.optionSets.length} Option Sets
                  </span>

                  {/* Expand All / Collapse All Controls */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={expandAllTables}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                      title="Expand all table field lists"
                    >
                      <ChevronsUpDown size={12} />
                      <span>Expand All</span>
                    </button>
                    <button
                      type="button"
                      onClick={collapseAllTables}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                      title="Collapse all table field lists"
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

          {!schema || schema.dataTypes.length === 0 ? (
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
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '16px',
              alignItems: 'start',
              paddingBottom: '48px'
            }}>
              {schema.dataTypes
                .filter(dt => !searchTerm || dt.name.toLowerCase().includes(searchTerm.toLowerCase()) || dt.fields.some(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())))
                .map((dt) => {
                  const tableKey = dt.id || dt.name;
                  const isCollapsed = collapsedTables.has(tableKey);

                  return (
                    <div
                      key={dt.id}
                      className="card"
                      style={{
                        padding: '16px 18px',
                        transition: 'all 0.15s ease',
                        border: isCollapsed ? '1px solid var(--border-subtle)' : '1px solid var(--border-active)'
                      }}
                    >
                      {/* Clickable Header with Expand/Collapse toggle */}
                      <div
                        onClick={() => toggleCollapseTable(tableKey)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          userSelect: 'none',
                          paddingBottom: isCollapsed ? '0' : '14px',
                          borderBottom: isCollapsed ? 'none' : '1px solid var(--border-subtle)',
                          marginBottom: isCollapsed ? '0' : '14px',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            minWidth: '24px',
                            borderRadius: '6px',
                            background: isCollapsed ? 'rgba(255, 255, 255, 0.05)' : 'rgba(99, 102, 241, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isCollapsed ? 'var(--text-muted)' : 'var(--primary)',
                            flexShrink: 0
                          }}>
                            {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                          </div>

                          <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                              <Database size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
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
                            </div>
                            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {dt.recordCount && dt.recordCount > 0 ? (
                                <span style={{ color: 'var(--accent-cyan)' }}>
                                  {dt.recordCount.toLocaleString()} records in database
                                </span>
                              ) : (
                                <span>Schema Defined • Live query via Data API</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <span className={`badge ${isCollapsed ? 'badge-indigo' : 'badge-cyan'}`} style={{ fontSize: '0.68rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
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
                            style={{ fontSize: '0.7rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}
                            title={`Browse and edit records of ${dt.name} in Interactive Data Studio`}
                          >
                            <Search size={11} />
                            <span>Browse Data</span>
                          </button>
                        </div>
                      </div>

                      {/* Collapsible Fields Section */}
                      {!isCollapsed && (
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              maxHeight: dt.fields.length > 8 ? '360px' : 'none',
                              overflowY: dt.fields.length > 8 ? 'auto' : 'visible',
                              paddingRight: dt.fields.length > 8 ? '4px' : '0'
                            }}
                          >
                            {dt.fields.map((f, i) => (
                              <div
                                key={i}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '7px 10px',
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'var(--bg-input)',
                                  border: '1px solid var(--border-subtle)',
                                  fontSize: '0.8rem'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <code style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{f.name}</code>
                                  {f.required && <span className="badge badge-rose" style={{ fontSize: '0.625rem' }}>Required</span>}
                                </div>
                                <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.725rem' }}>
                                  {f.type}{f.isList ? '[]' : ''}
                                </span>
                              </div>
                            ))}
                          </div>

                          {dt.fields.length > 8 && (
                            <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', paddingTop: '8px' }}>
                              Showing all {dt.fields.length} fields (scrollable list)
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
      )}

      {/* SUBTAB 2: ERD GRAPH */}
      {subTab === 'erd' && (
        <MermaidViewer 
          chart={mermaidErd} 
          title="Entity Relationship Diagram (ERD Graph)"
        />
      )}

      {/* SUBTAB 3: TYPESCRIPT DEFINITIONS */}
      {subTab === 'types' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Code size={18} color="var(--accent-emerald)" />
                <span>Auto-Generated TypeScript Interfaces (.d.ts)</span>
              </div>
              <div className="card-subtitle">Strongly typed interfaces with Option Set enums for Node.js backends and Bubble plugins</div>
            </div>
            <button onClick={() => handleCopy(tsDefinitions, 'TypeScript definitions')} className="btn btn-secondary btn-sm">
              {copied ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
          <pre style={{
            background: 'var(--bg-input)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            color: '#86efac',
            overflowX: 'auto',
            maxHeight: '480px'
          }}>
            {tsDefinitions}
          </pre>
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
            <div className="card-title" style={{ marginBottom: '14px' }}>
              <span>Recorded Migration History ({migrations.length})</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {migrations.map(m => (
                <div key={m.version} style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-indigo">{m.version}</span>
                      <strong>{m.name}</strong>
                      <span className="badge badge-cyan">{m.environment}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                  {m.description && <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{m.description}</div>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {m.changes.map((c, idx) => (
                      <span key={idx} className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
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
                <div className="card-title">
                  <Layers size={18} color="var(--accent-cyan)" />
                  <span>Cross-Environment Diff & Pre-Release Checklist</span>
                </div>
                <div className="card-subtitle">
                  Comparing <code>version-test</code> (Development) ➔ <code>live</code> (Production)
                </div>
              </div>
              <button onClick={loadEnvSync} disabled={isSyncingEnv} className="btn btn-primary btn-sm">
                <RefreshCw size={13} className={isSyncingEnv ? 'spin' : ''} />
                <span>{isSyncingEnv ? 'Analyzing Diff...' : 'Run Env Diff'}</span>
              </button>
            </div>

            {envDiff && (
              <div className="grid-3" style={{ marginTop: '14px' }}>
                <div className="card" style={{ background: 'var(--bg-input)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NEW TABLES PENDING DEPLOY</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: envDiff.missingDataTypesInTarget.length > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                    {envDiff.missingDataTypesInTarget.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{envDiff.missingDataTypesInTarget.join(', ') || 'All tables synced'}</div>
                </div>

                <div className="card" style={{ background: 'var(--bg-input)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NEW FIELDS PENDING DEPLOY</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: envDiff.missingFieldsInTarget.length > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                    {envDiff.missingFieldsInTarget.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Across User, Order, Product</div>
                </div>

                <div className="card" style={{ background: 'var(--bg-input)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SECRET KEYS VALIDATION</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: envDiff.secretKeyMismatches.some(k => k.inSource && !k.inTarget) ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                    {envDiff.secretKeyMismatches.filter(k => k.inSource && !k.inTarget).length} Missing
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>In Live environment settings</div>
                </div>
              </div>
            )}
          </div>

          {/* Release Tasks Checklist */}
          {releaseTasks.length > 0 && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: '12px' }}>
                <span>Pre-Release Checklist ({releaseTasks.filter(t => t.completed).length} / {releaseTasks.length} Ready)</span>
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
                      cursor: 'pointer'
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
                <div className="card-subtitle">Export records with encryption, cloud destination, and incremental date filters</div>
              </div>
              <button onClick={handleRunBackup} disabled={isBackingUp} className="btn btn-primary btn-sm">
                <HardDriveDownload size={14} />
                <span>{isBackingUp ? 'Exporting...' : 'Start Backup'}</span>
              </button>
            </div>

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div className="card-title" style={{ margin: 0 }}>
                <HardDriveDownload size={16} color="var(--accent-cyan)" />
                <span>Created Backups & Archives ({backupsList.length})</span>
              </div>
              <button onClick={loadBackups} className="btn btn-secondary btn-sm" title="Reload stored backups">
                <RefreshCw size={12} />
                <span>Refresh List</span>
              </button>
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
                        {b.encrypted && (
                          <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                            AES-256
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
                        onClick={() => handleDeleteBackup(b.backupId)}
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
            <div className="card-header">
              <div>
                <div className="card-title">
                  <ShieldAlert size={18} color="var(--accent-rose)" />
                  <span>Personally Identifiable Information (PII) & Privacy Audit</span>
                </div>
                <div className="card-subtitle">Scans schema field names across 8 vulnerability categories with Bubble Privacy Rule remediations</div>
              </div>
            </div>

            <div className="grid-3">
              <div className="card" style={{ padding: '12px 16px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                <div style={{ fontSize: '0.75rem', color: '#f43f5e', fontWeight: 700 }}>CRITICAL RISK FINDINGS</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f43f5e', marginTop: '2px' }}>{piiReport.criticalCount}</div>
              </div>
              <div className="card" style={{ padding: '12px 16px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>HIGH RISK FINDINGS</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>{piiReport.highCount}</div>
              </div>
              <div className="card" style={{ padding: '12px 16px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700 }}>MEDIUM RISK FINDINGS</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6', marginTop: '2px' }}>{piiReport.mediumCount}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: '12px' }}>
              <span>Identified Vulnerable Fields ({piiReport.findings.length})</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {piiReport.findings.map(f => (
                <div key={f.id} style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${f.severity === 'CRITICAL' ? 'badge-rose' : f.severity === 'HIGH' ? 'badge-amber' : 'badge-cyan'}`}>
                        {f.severity}
                      </span>
                      <strong>{f.table}.{f.field}</strong>
                      <span className="badge badge-indigo">{f.category}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>{f.description}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 10px', borderRadius: '4px' }}>
                    💡 <strong>Bubble Privacy Rule Fix:</strong> {f.recommendation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 10: CI/CD & TEMPLATES */}
      {subTab === 'cicd' && (
        <div className="grid-2">
          {/* Left: CI/CD Workflow Generator */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <FileCode size={18} color="var(--primary)" />
                  <span>CI/CD Pipeline Generator</span>
                </div>
                <div className="card-subtitle">Automate scheduled nightly backups in GitHub Actions or GitLab CI</div>
              </div>
              <button onClick={() => handleCopy(generatedCiYaml, 'CI YAML')} className="btn btn-secondary btn-sm">
                <Copy size={13} />
                <span>Copy YAML</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <div style={{ flex: 1 }}>
                <label className="input-label">Provider</label>
                <select value={ciProvider} onChange={e => { setCiProvider(e.target.value as any); setTimeout(updateCiWorkflow, 50); }} className="select">
                  <option value="github">GitHub Actions (.github/workflows)</option>
                  <option value="gitlab">GitLab CI (.gitlab-ci.yml)</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="input-label">Cron Schedule (UTC)</label>
                <input type="text" value={ciCron} onChange={e => { setCiCron(e.target.value); setTimeout(updateCiWorkflow, 50); }} className="input" />
              </div>
            </div>

            <pre style={{
              background: 'var(--bg-input)',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.775rem',
              color: '#c4b5fd',
              overflowX: 'auto',
              maxHeight: '380px'
            }}>
              {generatedCiYaml}
            </pre>
          </div>

          {/* Right: Integration Template Scaffolder */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <Code size={18} color="var(--accent-cyan)" />
                  <span>Integration Template Scaffolding</span>
                </div>
                <div className="card-subtitle">Generate boilerplate for plugin actions, CRUD connectors, and webhook receivers</div>
              </div>
              <button onClick={() => handleCopy(generatedScaffoldCode, 'Scaffold Code')} className="btn btn-secondary btn-sm">
                <Copy size={13} />
                <span>Copy Code</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <div style={{ flex: 1 }}>
                <label className="input-label">Template Type</label>
                <select value={scaffoldType} onChange={e => { setScaffoldType(e.target.value as any); setTimeout(updateScaffoldCode, 50); }} className="select">
                  <option value="plugin-action">Plugin Server-Side Action</option>
                  <option value="api-connector">CRUD API Connector</option>
                  <option value="webhook">Data Change Webhook Receiver</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="input-label">Component Name</label>
                <input type="text" value={scaffoldName} onChange={e => { setScaffoldName(e.target.value); setTimeout(updateScaffoldCode, 50); }} className="input" />
              </div>
            </div>

            <pre style={{
              background: 'var(--bg-input)',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.775rem',
              color: '#7dd3fc',
              overflowX: 'auto',
              maxHeight: '380px'
            }}>
              {generatedScaffoldCode}
            </pre>
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
