import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  Layers, 
  HardDriveDownload, 
  Wrench, 
  RefreshCw, 
  Table, 
  Search, 
  Share2, 
  GitBranch, 
  Code, 
  ShieldAlert, 
  History, 
  GitCompare, 
  FileCode, 
  Server, 
  Workflow, 
  Plus 
} from 'lucide-react';
import { 
  BubbleSchema, 
  ProjectProfile, 
  SchemaLockfile, 
  SchemaMigration 
} from '../types';
import { DevOpsEngine } from '../core/devops/devopsEngine';
import { BubbleSyncEngine } from '../core/bubble-sync/bubbleSyncEngine';
import { PiiScanner } from '../core/devops/piiScanner';
import { SchemaMigrationsEngine } from '../core/devops/schemaMigrations';
import { MockServerEngine } from '../core/devops/mockServer';
import { ProjectStore } from '../core/storage/projectStore';
import { toast } from '../core/toast/toastManager';

// Subcomponents & Tabs
import { DataGridTable } from '../components/DataGridTable';
import { WorkflowFlowchart } from '../components/WorkflowFlowchart';
import { DatabaseSnapshotManager } from '../components/DatabaseSnapshotManager';
import { BlueprintDiffViewer } from '../components/BlueprintDiffViewer';

import { SchemaExplorerTab } from './devops/SchemaExplorerTab';
import { ErdVisualizerTab } from './devops/ErdVisualizerTab';
import { TypesZodTab } from './devops/TypesZodTab';
import { MigrationsTab } from './devops/MigrationsTab';
import { EnvSyncTab } from './devops/EnvSyncTab';
import { BackupsTab } from './devops/BackupsTab';
import { DataBrowserReplTab } from './devops/DataBrowserReplTab';
import { RelationalSeederTab } from './devops/RelationalSeederTab';
import { DbExportTab } from './devops/DbExportTab';
import { PiiAuditTab } from './devops/PiiAuditTab';
import { CiCdTab } from './devops/CiCdTab';
import { MockServerTab } from './devops/MockServerTab';
import { WorkflowTriggerTab } from './devops/WorkflowTriggerTab';

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
  | 'workflow'
  | 'blueprint_diff';

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
  blueprint_diff: 'devops',
  
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

interface DevOpsViewProps {
  activeProject?: ProjectProfile;
  initialSubTab?: DevOpsSubTab;
  onLog: (module: 'devops', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
  onOpenConnectModal?: () => void;
}

export const DevOpsView: React.FC<DevOpsViewProps> = ({ 
  activeProject, 
  initialSubTab, 
  onLog, 
  onOpenConnectModal 
}) => {
  const [activeCategory, setActiveCategory] = useState<DevOpsCategory>(
    initialSubTab ? SUBTAB_TO_CATEGORY[initialSubTab] || 'schema' : 'data'
  );
  const [subTab, setSubTab] = useState<DevOpsSubTab>(initialSubTab || 'data_grid');

  const [schema, setSchema] = useState<BubbleSchema | null>(null);
  const [dataGridActiveType, setDataGridActiveType] = useState<string>('User');
  const [isFetchingSchema, setIsFetchingSchema] = useState(false);
  const [isSyncingBubble, setIsSyncingBubble] = useState(false);

  // Migrations & Lockfile State
  const [lockfile, setLockfile] = useState<SchemaLockfile | null>(null);
  const [migrations, setMigrations] = useState<SchemaMigration[]>([]);

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
  };

  const loadSchema = async () => {
    if (!activeProject) return;
    setIsFetchingSchema(true);
    onLog('devops', `Fetching schema for project: ${activeProject.name}...`);
    try {
      const s = await DevOpsEngine.fetchSchema(activeProject);
      setSchema(s);
      MockServerEngine.initFromSchema(s);

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
        setDataGridActiveType(s.dataTypes[0].name);
        onLog('devops', `Loaded ${s.dataTypes.length} real data types from Bubble API.`, 'success');
      } else {
        setLockfile(null);
        setMigrations([]);
        onLog('devops', `Ready. Connect with private API token or import .bubble JSON to inspect schema.`, 'info');
      }
    } catch (e: any) {
      onLog('devops', `Schema fetch notice: ${e.message}`, 'warn');
    } finally {
      setIsFetchingSchema(false);
    }
  };

  const handle1ClickBubbleSync = async () => {
    if (!activeProject) return;
    setIsSyncingBubble(true);
    onLog('devops', `Initiating Sync from Bubble.io for ${activeProject.name}...`);
    try {
      let res;
      if (activeProject.apiToken) {
        onLog('devops', 'Generating blueprint directly from Bubble Data API...', 'info');
        res = await BubbleSyncEngine.generateBlueprintFromApi(activeProject, (msg) => onLog('devops', msg));
      } else {
        const auth = await BubbleSyncEngine.checkAuthStatus();
        if (auth.isAuthenticated) {
          res = await BubbleSyncEngine.syncAppFile(activeProject, (msg) => onLog('devops', msg));
        } else {
          onLog('devops', 'Opening Bubble.io login window...', 'info');
          const loginRes = await BubbleSyncEngine.login();
          if (loginRes.isAuthenticated) {
            res = await BubbleSyncEngine.syncAppFile(activeProject, (msg) => onLog('devops', msg));
          } else {
            toast.error('Bubble authentication was not completed.');
            return;
          }
        }
      }

      if (res && res.data) {
        const parsedSchema = DevOpsEngine.parseBubbleSchemaJson(res.data, activeProject);
        setSchema(parsedSchema);
        MockServerEngine.initFromSchema(parsedSchema);
        toast.success(`Synced & loaded ${parsedSchema.dataTypes.length} tables from Bubble.io!`);
      }
    } finally {
      setIsSyncingBubble(false);
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
        MockServerEngine.initFromSchema(parsedSchema);

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

        if (parsedSchema.dataTypes.length > 0) {
          setDataGridActiveType(parsedSchema.dataTypes[0].name);
        }

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
    MockServerEngine.initFromSchema(template);

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

    if (template.dataTypes.length > 0) {
      setDataGridActiveType(template.dataTypes[0].name);
    }

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

  useEffect(() => {
    if (activeProject) {
      loadSchema();
    }
  }, [activeProject?.id, activeProject?.blueprintFileName, activeProject?.blueprintExportJson]);

  const piiFindingsCount = useMemo(() => {
    if (!schema) return 0;
    return PiiScanner.scanSchema(schema).findings.length;
  }, [schema]);

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
            <RefreshCw size={13} className={isFetchingSchema ? 'spin' : ''} />
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
              <span>PII Privacy ({piiFindingsCount})</span>
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
              onClick={() => setSubTab('env_sync')}
              className={`btn btn-sm ${subTab === 'env_sync' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', fontSize: '0.775rem' }}
            >
              <Layers size={13} />
              <span>Dev vs Live Sync</span>
            </button>
            <button
              onClick={() => setSubTab('blueprint_diff')}
              className={`btn btn-sm ${subTab === 'blueprint_diff' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', fontSize: '0.775rem' }}
            >
              <GitCompare size={13} />
              <span>Blueprint Diff</span>
            </button>
          </>
        )}

        {activeCategory === 'tools' && (
          <>
            <button
              onClick={() => setSubTab('cicd')}
              className={`btn btn-sm ${subTab === 'cicd' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', fontSize: '0.775rem' }}
            >
              <FileCode size={13} />
              <span>CI/CD Pipelines</span>
            </button>
            <button
              onClick={() => setSubTab('export_db')}
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

      {/* Render Active Subtab */}
      {subTab === 'data_grid' && (
        <DataGridTable 
          project={activeProject} 
          dataTypes={schema?.dataTypes || []} 
          activeDataType={dataGridActiveType}
          onLog={onLog} 
        />
      )}

      {subTab === 'workflow_flowchart' && (
        <WorkflowFlowchart 
          blueprintExportJson={activeProject.blueprintExportJson} 
          onLog={onLog} 
        />
      )}

      {subTab === 'snapshots' && (
        <DatabaseSnapshotManager 
          project={activeProject} 
          dataTypes={schema?.dataTypes || []} 
          onLog={onLog} 
        />
      )}

      {subTab === 'blueprint_diff' && (
        <BlueprintDiffViewer 
          activeProject={activeProject}
          projects={ProjectStore.getInstance().getSettings().projects}
        />
      )}

      {subTab === 'schema' && (
        <SchemaExplorerTab 
          schema={schema}
          activeProject={activeProject}
          isSyncingBubble={isSyncingBubble}
          isFetchingSchema={isFetchingSchema}
          on1ClickBubbleSync={handle1ClickBubbleSync}
          onImportSchemaFile={handleImportSchemaFile}
          onLoadTemplateSchema={handleLoadTemplateSchema}
          onLoadSchema={loadSchema}
          onNavigateToDataGrid={(typeName) => {
            setDataGridActiveType(typeName);
            setActiveCategory('data');
            setSubTab('data_grid');
          }}
          onLog={onLog}
        />
      )}

      {subTab === 'erd' && (
        <ErdVisualizerTab schema={schema} />
      )}

      {subTab === 'types' && (
        <TypesZodTab 
          schema={schema} 
          appName={activeProject.appId} 
          onLog={onLog} 
        />
      )}

      {subTab === 'migrations' && (
        <MigrationsTab 
          schema={schema}
          lockfile={lockfile}
          migrations={migrations}
          onSetMigrations={setMigrations}
          onLog={onLog}
        />
      )}

      {subTab === 'env_sync' && (
        <EnvSyncTab 
          schema={schema}
          activeProject={activeProject}
          onLog={onLog}
          onNavigateToSchema={() => {
            setActiveCategory('schema');
            setSubTab('schema');
          }}
        />
      )}

      {subTab === 'backups' && (
        <BackupsTab 
          schema={schema}
          activeProject={activeProject}
          onLog={onLog}
        />
      )}

      {subTab === 'query' && (
        <DataBrowserReplTab 
          schema={schema}
          activeProject={activeProject}
          onLog={onLog}
          onNavigateToDataGrid={() => {
            setActiveCategory('data');
            setSubTab('data_grid');
          }}
          onNavigateToSeeder={() => {
            setActiveCategory('data');
            setSubTab('seeder');
          }}
        />
      )}

      {subTab === 'seeder' && (
        <RelationalSeederTab 
          schema={schema}
          activeProject={activeProject}
          onLog={onLog}
        />
      )}

      {subTab === 'export_db' && (
        <DbExportTab 
          schema={schema}
          onLog={onLog}
        />
      )}

      {subTab === 'pii_audit' && (
        <PiiAuditTab 
          schema={schema}
          onLog={onLog}
        />
      )}

      {subTab === 'cicd' && (
        <CiCdTab 
          schema={schema}
          activeProject={activeProject}
          onLog={onLog}
        />
      )}

      {subTab === 'mock_server' && (
        <MockServerTab 
          schema={schema}
          onLog={onLog}
        />
      )}

      {subTab === 'workflow' && (
        <WorkflowTriggerTab 
          activeProject={activeProject}
          onLog={onLog}
        />
      )}
    </div>
  );
};
