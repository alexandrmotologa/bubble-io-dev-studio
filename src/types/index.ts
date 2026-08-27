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
  | 'settings';

export interface ProjectProfile {
  id: string;
  name: string;
  appId: string;
  environment: 'version-test' | 'version-live' | string;
  apiToken?: string;
  customDomain?: string;
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
  | 'ollama' 
  | 'mock';

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
}

// ============================================================================
// 6. WORKLOAD UNITS (WU) & QUERY PROFILER TYPES
// ============================================================================

export interface WuBottleneck {
  id: string;
  location: string;
  pageName?: string;
  workflowName?: string;
  operationType: 'search_unconstrained' | 'nested_search' | 'client_filter_large_list' | 'bulk_unbatched_update' | 'recursive_scheduled_loop' | 'unindexed_sort';
  severity: 'critical' | 'high' | 'medium';
  description: string;
  estimatedMonthlyWu: number;
  estimatedCostUsd: number;
  suggestedFix: string;
}

export interface WuProfileReport {
  timestamp: string;
  totalEstimatedMonthlyWu: number;
  estimatedMonthlyCostUsd: number;
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
  headers: Record<string, string>;
  bodyJson: any;
  responseBody: any;
  durationMs: number;
}

export interface ApiConnectorCallConfig {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  useAs: 'data' | 'action';
  dataCategory: 'json' | 'text' | 'image' | 'xml';
  headers: { key: string; value: string; isPrivate?: boolean }[];
  parameters: { key: string; value: string; isClientSafe?: boolean; isOptional?: boolean }[];
  bodyType: 'json' | 'form-data' | 'raw';
  bodyPayload?: string;
}

export interface OpenApiImportResult {
  apiTitle: string;
  version: string;
  callsCount: number;
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
