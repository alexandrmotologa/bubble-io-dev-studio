export type ThemeMode = 'dark' | 'light' | 'system';

export type NavigationTab = 
  | 'dashboard'
  | 'devops'
  | 'audit'
  | 'translator'
  | 'visual-tester'
  | 'security'
  | 'wu-profiler'
  | 'api-studio'
  | 'doc-gen'
  | 'settings';

export interface ProjectProfile {
  id: string;
  name: string;
  appId: string;
  environment: 'version-test' | 'version-live' | string;
  apiToken?: string;
  customDomain?: string;
  aiProvider?: string;
  aiModel?: string;
  aiApiKey?: string;
  httpBasicUser?: string;
  httpBasicPassword?: string;
  blueprintExportJson?: any;
  blueprintFileName?: string;
  stats?: {
    pagesCount?: number;
    workflowsCount?: number;
    elementsCount?: number;
    dataTypesCount?: number;
    appTextsCount?: number;
  };
  createdAt: string;
  lastActiveAt?: string;
}

export interface GlobalSettings {
  theme: ThemeMode;
  activeProjectId?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
  openrouterApiKey?: string;
  groqApiKey?: string;
  deepseekApiKey?: string;
  xaiApiKey?: string;
  opencodeApiKey?: string;
  ollamaUrl?: string;
  defaultAiModel: string;
  autoSaveReports: boolean;
  projects: ProjectProfile[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  module: 'system' | 'devops' | 'audit' | 'translator' | 'visual-tester' | 'security' | 'wu-profiler' | 'api-studio' | 'copilot';
  message: string;
  details?: any;
}

// ============================================================================
// 1. DEVOPS & BUBBLE CLI TYPES
// ============================================================================

export interface BubbleField {
  name: string;
  type: string;
  isList?: boolean;
  isCustomType?: boolean;
  required?: boolean;
  description?: string;
}

export interface BubbleDataType {
  id: string;
  name: string;
  fields: BubbleField[];
  recordCount?: number;
}

export interface BubbleOptionSet {
  name: string;
  options: string[];
}

export interface BubbleSchema {
  appName: string;
  version: string;
  dataTypes: BubbleDataType[];
  optionSets: BubbleOptionSet[];
}

export interface BackupOptions {
  dataType: string;
  environment: 'version-test' | 'version-live';
  format: 'json' | 'csv';
  limit?: number;
  sinceDate?: string;
  constraintJson?: string;
  encryptPassphrase?: string;
  cloudDestination?: string; // s3:// or gs://
  scope?: 'all' | 'selective';
  selectedTables?: string[];
}

export interface BackupResult {
  backupId: string;
  timestamp: string;
  status: 'completed' | 'failed' | 'in_progress';
  recordCount: number;
  tables: string[];
  fileSizeKb: number;
  filePath?: string;
  format: 'json' | 'csv';
  encrypted?: boolean;
  cloudUrl?: string;
  checksum?: string;
  scope?: 'all' | 'selective';
}

// Schema Migrations (Schema-as-Code)
export type MigrationAction = 
  | 'ADD_TABLE'
  | 'REMOVE_TABLE'
  | 'ADD_FIELD'
  | 'REMOVE_FIELD'
  | 'CHANGE_FIELD_TYPE';

export interface MigrationChange {
  action: MigrationAction;
  table: string;
  field?: string;
  type?: string;
  previousType?: string;
  options?: any;
}

export interface SchemaMigration {
  version: string;
  name: string;
  description?: string;
  createdAt: string;
  app: string;
  environment: string;
  changes: MigrationChange[];
}

export interface SchemaLockfile {
  version: string;
  lastUpdated: string;
  app: string;
  tables: Record<string, { fields: Record<string, string> }>;
}

// Relational Seeder Graph
export interface SeedGraphNode {
  ref: string;
  type: string;
  data: Record<string, any>;
  dependencies: string[];
  status: 'pending' | 'created' | 'patched' | 'failed';
  createdId?: string;
}

export interface SeedExecutionPlan {
  totalRecords: number;
  types: string[];
  nodes: SeedGraphNode[];
  circularRefs: { from: string; to: string; field: string }[];
  steps: { step: number; description: string; nodeRefs: string[] }[];
}

// PII & Privacy Audit
export type PiiRiskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type PiiCategory = 
  | 'CREDENTIALS'
  | 'FINANCIAL'
  | 'GOVERNMENT_ID'
  | 'BIOMETRIC'
  | 'CONTACT_PII'
  | 'MEDICAL'
  | 'GEOLOCATION'
  | 'DEMOGRAPHICS';

export interface PiiFinding {
  id: string;
  table: string;
  field: string;
  type: string;
  severity: PiiRiskSeverity;
  category: PiiCategory;
  description: string;
  recommendation: string;
}

export interface PiiAuditReport {
  scannedAt: string;
  appName: string;
  environment: string;
  totalTypes: number;
  totalFields: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  findings: PiiFinding[];
}

// REPL & Data Browser
export interface QueryConstraint {
  key: string;
  constraint_type: 'equals' | 'not equal' | 'text contains' | 'greater than' | 'less than' | 'is_empty' | 'is_not_empty';
  value?: any;
}

export interface QueryResultPage {
  dataType: string;
  records: Record<string, any>[];
  cursor: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Database Export Target
export type DbExportTarget = 'sqlite' | 'postgres' | 'bigquery';

export interface DbExportConfig {
  target: DbExportTarget;
  dataType: string;
  environment: 'version-test' | 'version-live';
  limit?: number;
  sqlitePath?: string;
  pgConnectionString?: string;
  bqProjectId?: string;
  bqDatasetId?: string;
}

// Mock Server
export interface MockServerEndpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  sampleResponse: any;
}

// ============================================================================
// 2. DEAD CODE DETECTOR & AST AUDIT TYPES
// ============================================================================

export type DeadItemType = 
  | 'element'
  | 'workflow'
  | 'custom_event'
  | 'db_field'
  | 'style'
  | 'option_set'
  | 'plugin'
  | 'security_rule';

export interface DeadItem {
  id: string;
  name: string;
  type: DeadItemType;
  pageName?: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  canAutoClean: boolean;
  referencesCount?: number;
  referencedBy?: string[];
  rawElement?: any;
}

export interface DagNode {
  id: string;
  name: string;
  type: string;
  category: 'page' | 'element' | 'workflow' | 'field' | 'style' | 'plugin' | 'option_set';
  isDead: boolean;
  status?: 'active' | 'warning' | 'dead';
  pageParent?: string;
  callCount?: number;
  orphanReason?: string;
  referencedBy?: string[];
  callsTo?: string[];
  incomingEdges: number;
  outgoingEdges: number;
}

export interface DagEdge {
  from: string;
  to: string;
  label?: string;
}

export interface DagGraphData {
  nodes: DagNode[];
  edges: DagEdge[];
}

export interface AppDiffResult {
  beforeScore: number;
  afterScore: number;
  scoreDelta: number;
  fixedIssues: DeadItem[];
  newIssues: DeadItem[];
  unchangedCount: number;
}

export interface AuditHealthReport {
  score: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  totalElements: number;
  deadElementsCount: number;
  totalWorkflows: number;
  deadWorkflowsCount: number;
  totalFields: number;
  deadFieldsCount: number;
  totalStyles: number;
  deadStylesCount: number;
  totalPlugins: number;
  deadPluginsCount: number;
  totalOptionSets: number;
  deadOptionSetsCount: number;
  deadItems: DeadItem[];
  recommendations: string[];
  analyzedAt: string;
  appName?: string;
  graph?: DagGraphData;
}

// ============================================================================
// 3. AI TRANSLATOR TYPES
// ============================================================================

export type TranslationProviderType = 
  | 'openai' 
  | 'anthropic' 
  | 'gemini' 
  | 'openrouter' 
  | 'groq' 
  | 'xai' 
  | 'opencode' 
  | 'ollama';

export interface TranslationItem {
  id: string;
  key: string;
  sourceText: string;
  translatedText?: string;
  translations?: Record<string, string>; // Multi-language translations keyed by locale (e.g. { 'ro_ro': '...', 'fr_fr': '...' })
  category: 'ui' | 'error' | 'notification' | 'email' | 'db_value' | 'option_set';
  status: 'pending' | 'translated' | 'reviewed' | 'failed';
  tokensUsed?: number;
  context?: string;
}

export interface TranslationJobConfig {
  sourceLang: string;
  targetLang: string;
  provider: TranslationProviderType;
  model: string;
  temperature: number;
  tone: 'professional' | 'casual' | 'formal' | 'concise' | 'marketing';
  useGlossary: boolean;
  useCache: boolean;
  glossary?: Record<string, string>;
  apiKey?: string;
  ollamaUrl?: string;
}

export interface TranslationJobResult {
  jobId: string;
  sourceLang: string;
  targetLang: string;
  items: TranslationItem[];
  totalCount: number;
  successCount: number;
  cacheHitCount: number;
  tokensUsed: number;
  estimatedCostUsd: number;
  completedAt: string;
}

export interface TranslationMemoryStats {
  totalCachedEntries: number;
  languages: string[];
  totalCharsSaved: number;
  estimatedSavingsUsd: number;
}

export interface CostEstimate {
  provider: string;
  model: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUsd: number;
  isFree: boolean;
}

// ============================================================================
// 4. VISUAL REGRESSION & QA TYPES
// ============================================================================

export interface ViewportConfig {
  name: string;
  width: number;
  height: number;
  isCustom?: boolean;
}

export interface VisualTestCase {
  id: string;
  name: string;
  pageUrl: string;
  viewport: ViewportConfig;
  status: 'passed' | 'failed' | 'running' | 'untested';
  diffPercentage?: number;
  baselineImage?: string; // Data URL / path
  currentImage?: string;  // Data URL / path
  diffImage?: string;     // Data URL / path
  lastRun?: string;
  waitForSelector?: string;
  waitForTimeout?: number;
  maskSelectors?: string[];
  diffPixelsCount?: number;
}

export interface VisualSuiteResult {
  suiteId: string;
  totalTests: number;
  passed: number;
  failed: number;
  executedAt: string;
  cases: VisualTestCase[];
}

export interface VisualAuthSettings {
  enabled: boolean;
  loginUrl: string;
  usernameField?: string;
  passwordField?: string;
  submitButtonSelector?: string;
  username?: string;
  password?: string;
  httpBasicUser?: string;
  httpBasicPassword?: string;
  storageStateJson?: string;
}

// ============================================================================
// 5. SECURITY & PRIVACY RULES RBAC TYPES
// ============================================================================

export type RbacAccessLevel = 'full' | 'conditional' | 'hidden' | 'none';

export interface PrivacyRuleMatrixRow {
  dataType: string;
  role: string;
  findInSearches: boolean;
  viewAllFields: boolean;
  allowedFields: string[];
  restrictedFields: string[];
  conditionExpression?: string;
  accessLevel: RbacAccessLevel;
}

export interface InsecureEndpointFinding {
  id: string;
  endpointName: string;
  route: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  issue: string;
  recommendation: string;
  hasAuth: boolean;
  isPublic: boolean;
  ignoredPrivacyRules: boolean;
}

export interface ComplianceFrameworkScore {
  framework: 'GDPR' | 'SOC2' | 'HIPAA' | 'PCI-DSS';
  score: number; // 0 - 100
  status: 'COMPLIANT' | 'NEEDS_REVIEW' | 'NON_COMPLIANT';
  issuesCount: number;
  description: string;
}

export interface EveryoneElseRiskItem {
  dataType: string;
  riskLevel: 'CRITICAL' | 'WARNING' | 'HARDENED';
  sensitiveFieldsCount: number;
  publicSearchAllowed: boolean;
  publicViewAllFields: boolean;
  recommendedRule: string;
  bubbleExpression: string;
}

export interface SecurityRemediationRule {
  id: string;
  dataType: string;
  ruleName: string;
  roleTarget: string;
  bubbleExpression: string;
  viewAllFields: boolean;
  findInSearches: boolean;
  allowedFields: string[];
  blockedFields: string[];
  rationale: string;
}

export interface SecurityAuditReport {
  timestamp: string;
  overallScore: number; // 0-100
  securityGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  criticalVulnerabilitiesCount: number;
  warningsCount: number;
  openTypesCount: number;
  matrix: PrivacyRuleMatrixRow[];
  insecureEndpoints: InsecureEndpointFinding[];
  exposedSensitiveFields: {
    dataType: string;
    field: string;
    reason: string;
    piiType?: string;
  }[];
  complianceScores?: ComplianceFrameworkScore[];
  everyoneElseRisks?: EveryoneElseRiskItem[];
  remediations?: SecurityRemediationRule[];
}

// ============================================================================
// 6. WORKLOAD UNITS (WU) & QUERY PROFILER TYPES
// ============================================================================

export type WuOperationType = 
  | 'search_unconstrained' 
  | 'nested_search' 
  | 'client_filter_large_list' 
  | 'bulk_unbatched_update' 
  | 'recursive_scheduled_loop' 
  | 'unindexed_sort'
  | 'heavy_custom_state'
  | 'unbatched_api_call';

export interface WuBottleneck {
  id: string;
  location: string;
  pageName?: string;
  workflowName?: string;
  operationType: WuOperationType;
  severity: 'critical' | 'high' | 'medium' | 'info';
  category: 'Database Queries' | 'Backend Workflows' | 'Frontend Rendering' | 'API & Webhooks' | 'Data Architecture';
  description: string;
  rootCause: string;
  estimatedMonthlyWu: number;
  estimatedCostUsd: number;
  suggestedFix: string;
  beforeCodeSnippet?: string;
  afterCodeSnippet?: string;
  wuReductionPercent: number;
  affectedRecordsCount?: number;
}

export interface WuExecutionStep {
  stepNumber: number;
  name: string;
  component: 'Database Engine' | 'Workflow Engine' | 'Browser Runtime' | 'API Connector';
  costWu: number;
  details: string;
  isBottleneck?: boolean;
}

export interface WuSandboxPreset {
  id: string;
  title: string;
  category: string;
  description: string;
  badExpression: string;
  goodExpression: string;
  beforeCostWu: number;
  afterCostWu: number;
  wuReductionPercent: number;
  steps: WuExecutionStep[];
  explanation: string;
}

export interface WuCapacityPlan {
  id: string;
  name: string;
  monthlyWuAllowance: number;
  basePriceUsd: number;
  additionalCostPer100kWu: number;
  utilizationPercent: number;
  status: 'optimal' | 'tight' | 'exceeded' | 'underutilized';
  isRecommended?: boolean;
}

export interface WuBurnRatePoint {
  timeLabel: string;
  wuConsumed: number;
  primaryDriver: 'User Searches' | 'Scheduled Backend Cron' | 'API Webhooks' | 'Database Mutations' | 'Page Initialization';
}

export interface WuSpikeScenario {
  id: string;
  name: string;
  description: string;
  trafficMultiplier: number;
  projectedMonthlyWu: number;
  estimatedOverageUsd: number;
  willTriggerThrottling: boolean;
  status: 'safe' | 'warning' | 'danger';
}

export interface WuInventoryItem {
  id: string;
  type: 'search' | 'page' | 'backend_workflow' | 'api_endpoint' | 'custom_state';
  name: string;
  location: string;
  estimatedMonthlyWu: number;
  sharePercent: number;
  executionFrequency: string;
  dataVolume: string;
  status: 'optimized' | 'needs_review' | 'critical';
  recommendation: string;
}

export interface WuProfileReport {
  timestamp: string;
  totalEstimatedMonthlyWu: number;
  estimatedMonthlyCostUsd: number;
  potentialSavingsMonthlyWu: number;
  potentialSavingsCostUsd: number;
  efficiencyScore: number; // 0-100
  clientVsServerRatio: {
    clientPercentage: number;
    serverPercentage: number;
  };
  topConsumingPages: {
    pageName: string;
    wuPercent: number;
    estimatedWu: number;
  }[];
  topConsumingWorkflows: {
    workflowName: string;
    trigger: string;
    estimatedWu: number;
  }[];
  bottlenecks: WuBottleneck[];
  capacityPlans: WuCapacityPlan[];
  burnRateTimeline: WuBurnRatePoint[];
  spikeScenarios: WuSpikeScenario[];
  inventoryItems: WuInventoryItem[];
}

// ============================================================================
// 7. API STUDIO & WEBHOOK TYPES
// ============================================================================

export interface WebhookLogEntry {
  id: string;
  timestamp: string;
  method: 'POST' | 'GET' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  status: number;
  statusText?: string;
  headers: Record<string, string>;
  queryParams?: Record<string, string>;
  bodyJson: any;
  responseBody: any;
  durationMs: number;
  origin?: string;
  replayedFromId?: string;
}

export interface ApiConnectorParameter {
  key: string;
  value: string;
  isPrivate?: boolean;
  isOptional?: boolean;
  isQuerystring?: boolean;
  isClientSafe?: boolean;
  description?: string;
}

export interface ApiConnectorHeader {
  key: string;
  value: string;
  isPrivate?: boolean;
  description?: string;
}

export interface ApiConnectorCallConfig {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  useAs: 'data' | 'action';
  dataCategory: 'json' | 'text' | 'image' | 'xml';
  headers: ApiConnectorHeader[];
  parameters: ApiConnectorParameter[];
  bodyType: 'json' | 'form-data' | 'raw';
  bodyPayload?: string;
  authType?: 'none' | 'bearer' | 'basic' | 'custom_header' | 'query_param';
  authConfig?: {
    username?: string;
    password?: string;
    token?: string;
    headerKey?: string;
    headerValue?: string;
  };
  tag?: string;
  description?: string;
}

export interface OpenApiEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  summary: string;
  description?: string;
  tags: string[];
  parameters: {
    name: string;
    in: 'query' | 'header' | 'path' | 'cookie';
    required?: boolean;
    type?: string;
    description?: string;
    example?: any;
  }[];
  requestBodySchema?: any;
  responses: Record<string, { description?: string; schema?: any }>;
  selected?: boolean;
  callConfig: ApiConnectorCallConfig;
}

export interface OpenApiImportResult {
  apiTitle: string;
  version: string;
  description?: string;
  baseUrl: string;
  callsCount: number;
  tags: string[];
  endpoints: OpenApiEndpoint[];
  calls: ApiConnectorCallConfig[];
}

// ============================================================================
// 8. MULTI-ENVIRONMENT SYNC TYPES
// ============================================================================

export interface EnvDiffReport {
  timestamp: string;
  sourceEnv: string;
  targetEnv: string;
  missingDataTypesInTarget: string[];
  missingFieldsInTarget: { dataType: string; fieldName: string; fieldType: string }[];
  missingOptionSetsInTarget: string[];
  secretKeyMismatches: { keyName: string; inSource: boolean; inTarget: boolean }[];
  readyForDeploy: boolean;
}

export interface ReleaseChecklistTask {
  id: string;
  title: string;
  category: 'database' | 'security' | 'api_keys' | 'verification';
  completed: boolean;
  autoExecutable: boolean;
}

// ============================================================================
// 9. AI COPILOT TYPES
// ============================================================================

export interface CopilotQueryRequest {
  naturalLanguagePrompt: string;
  targetDataType: string;
  provider: string;
}

export interface CopilotQueryResponse {
  interpretedQuery: string;
  bubbleConstraints: {
    key: string;
    constraint_type: string;
    value: any;
  }[];
  explanation: string;
  dataApiUrlSnippet: string;
}

export interface CopilotRegexRequest {
  description: string;
  sampleInput: string;
  flavor?: 'bubble_find_and_replace' | 'bubble_extract_regex' | 'standard_pcre';
}

export interface CopilotRegexResponse {
  regexPattern: string;
  regexFlags: string;
  explanation: string;
  matchesSample: boolean;
  matchedValues: string[];
}

// ============================================================================
// 10. DATA GRID & LIVE CRUD TYPES
// ============================================================================

export interface DataGridColumn {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  isList?: boolean;
  width?: number;
}

export interface DataGridFilter {
  id: string;
  field: string;
  operator: 'equals' | 'not equal' | 'text contains' | 'greater than' | 'less than' | 'is_empty' | 'is_not_empty';
  value: any;
}

export interface DataGridSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface DataGridRecord {
  _id: string;
  'Created Date'?: string;
  'Modified Date'?: string;
  'Created By'?: string;
  [key: string]: any;
}

export interface DataGridMutationResult {
  success: boolean;
  recordId?: string;
  message?: string;
  data?: any;
}

// ============================================================================
// 11. WORKFLOW FLOWCHART & LOGIC VISUALIZER TYPES
// ============================================================================

export type WorkflowNodeType = 
  | 'trigger'
  | 'condition'
  | 'db_write'
  | 'api_call'
  | 'email'
  | 'custom_event'
  | 'navigation'
  | 'plugin_action'
  | 'misc';

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  label: string;
  sublabel?: string;
  categoryName?: string;
  explanation?: string;
  rawType?: string;
  condition?: string;
  actionIndex?: number;
  details?: Record<string, any>;
  isBlockingClient?: boolean;
  performanceImpact?: string;
  executionLocation?: 'Client (Browser)' | 'Server (Backend)';
}

export interface WorkflowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  isConditional?: boolean;
}

export interface WorkflowGraphData {
  workflowId: string;
  workflowName: string;
  pageName: string;
  eventType: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  optimizationAdvice: string[];
}

export interface TypeScriptGeneratorOptions {
  mode?: 'interfaces' | 'zod' | 'client';
  includeJsDoc?: boolean;
  includeCrudDtos?: boolean;
  includeEnvelopes?: boolean;
  includeSchemaMap?: boolean;
}

// ============================================================================
// 12. PLUGIN STUDIO & SDK GENERATOR TYPES
// ============================================================================

export interface PluginParameterDef {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'object' | 'list_text' | 'list_number' | 'file';
  required: boolean;
  description?: string;
  sampleValue?: any;
}

export interface PluginSdkActionConfig {
  actionName: string;
  actionType: 'server_side' | 'client_side';
  description: string;
  apiUrl?: string;
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  enableRetry?: boolean;
  maxRetries?: number;
  timeoutMs?: number;
  useBubbleContextKeys?: boolean;
  bubbleApiKeyName?: string;
  parameters: PluginParameterDef[];
  returnsValue: boolean;
  returnFields?: PluginParameterDef[];
}

export interface PluginGeneratedSdk {
  serverSideCode: string;
  clientSideCode: string;
  typeScriptInterfaces: string;
  packageJsonSnippet: string;
}

// ============================================================================
// 13. DEVELOPER DOCUMENTATION BOOK (DOCGEN) TYPES
// ============================================================================

export interface DocSection {
  id: string;
  title: string;
  icon: string;
  category: 'overview' | 'database' | 'security' | 'api' | 'workflows' | 'localization' | 'quality' | 'custom';
  markdownContent: string;
  badge?: string;
  enabled?: boolean;
  isCustom?: boolean;
  order?: number;
}

export interface DocBookProject {
  title: string;
  generatedAt: string;
  appName: string;
  version: string;
  author?: string;
  sections: DocSection[];
  stats: {
    dataTypesCount: number;
    fieldsCount: number;
    workflowsCount: number;
    privacyRulesCount: number;
    endpointsCount: number;
    languagesCount: number;
  };
}

// ============================================================================
// 14. DATABASE SNAPSHOT & ROLLBACK TYPES
// ============================================================================

export interface DatabaseSnapshot {
  id: string;
  name: string;
  description?: string;
  appName: string;
  environment: string;
  createdAt: string;
  dataType: string;
  recordCount: number;
  records: DataGridRecord[];
}

export interface SnapshotFieldDiff {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface SnapshotRecordDiff {
  recordId: string;
  diffType: 'added' | 'modified' | 'deleted';
  fieldDiffs?: SnapshotFieldDiff[];
  recordData: DataGridRecord;
}

export interface SnapshotComparisonReport {
  baselineSnapshotId: string;
  targetSnapshotId: string;
  dataType: string;
  addedCount: number;
  modifiedCount: number;
  deletedCount: number;
  unchangedCount: number;
  recordDiffs: SnapshotRecordDiff[];
}

export interface RollbackExecutionResult {
  success: boolean;
  totalCompensations: number;
  recreatedRecords: number;
  restoredFields: number;
  purgedNewRecords: number;
  failedCount: number;
  logs: string[];
}

export interface UpdaterStatusData {
  status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error' | 'dev-mode';
  version?: string;
  releaseDate?: string;
  releaseNotes?: string;
  percent?: number;
  transferred?: number;
  total?: number;
  bytesPerSecond?: number;
  error?: string;
  message?: string;
  currentVersion?: string;
}

export interface BubbleAuthStatus {
  isAuthenticated: boolean;
  userEmail?: string;
}

export interface BubbleSyncResult {
  success: boolean;
  fileName?: string;
  data?: any;
  error?: string;
}

declare global {
  interface Window {
    electronAPI?: {
      platform: string;
      versions: {
        node: string;
        chrome: string;
        electron: string;
      };
      sendToMain: (channel: string, data: any) => void;
      receiveFromMain: (channel: string, func: (...args: any[]) => void) => () => void;
      openExternal: (url: string) => Promise<void>;
      fetchHttp: (url: string, headers?: Record<string, string>) => Promise<{ ok: boolean; status?: number; data?: any; error?: string }>;
      secureEncrypt: (plainText: string) => Promise<string>;
      secureDecrypt: (cipherText: string) => Promise<string>;
      isEncryptionAvailable: () => Promise<boolean>;
      capturePage: (url: string, width: number, height: number, headers?: Record<string, string>) => Promise<{ success: boolean; dataUrl?: string; error?: string; width?: number; height?: number }>;
      checkForUpdates: () => Promise<any>;
      downloadUpdate: () => Promise<{ success: boolean; error?: string }>;
      installUpdate: () => Promise<void>;
      getAppInfo: () => Promise<{ currentVersion: string; isPackaged: boolean; platform: string }>;
      bubbleSyncLogin: () => Promise<BubbleAuthStatus>;
      bubbleSyncLogout: () => Promise<boolean>;
      bubbleSyncCheckAuth: () => Promise<BubbleAuthStatus>;
      bubbleSyncFetchApp: (appId: string) => Promise<BubbleSyncResult>;
      bubbleSyncSetDownloadsWatcher: (enabled: boolean) => Promise<boolean>;
      bubbleSyncShowInFolder: (filePath: string) => Promise<boolean>;
      bubbleSyncExportBlueprintToDisk: (fileName: string, data: any) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      onBubbleFileDetected: (callback: (data: { fileName: string; content: any }) => void) => () => void;
      onBrowserAppReceived?: (callback: (data: { data: any; originUrl?: string }) => void) => () => void;
    };
  }
}

