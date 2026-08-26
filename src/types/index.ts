export type ThemeMode = 'dark' | 'light' | 'system';

export type NavigationTab = 
  | 'dashboard'
  | 'devops'
  | 'audit'
  | 'translator'
  | 'visual-tester'
  | 'settings';

export interface ProjectProfile {
  id: string;
  name: string;
  appId: string;
  environment: 'development' | 'staging' | 'live';
  apiToken?: string;
  customDomain?: string;
  createdAt: string;
  lastActiveAt?: string;
}

export interface GlobalSettings {
  theme: ThemeMode;
  activeProjectId?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
  groqApiKey?: string;
  opencodeApiKey?: string;
  opencodeEndpoint?: string;
  ollamaEndpoint?: string;
  ollamaModel?: string;
  defaultAiModel: string;
  autoSaveReports: boolean;
  projects: ProjectProfile[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  module: 'system' | 'devops' | 'audit' | 'translator' | 'visual-tester';
  message: string;
  details?: any;
}

// DevOps & Schema Types
export interface BubbleField {
  name: string;
  type: string;
  isList?: boolean;
  isCustomType?: boolean;
  required?: boolean;
}

export interface BubbleDataType {
  id: string;
  name: string;
  fields: BubbleField[];
  recordCount?: number;
}

export interface BubbleSchema {
  appName: string;
  version: string;
  dataTypes: BubbleDataType[];
  optionSets: { name: string; options: string[] }[];
}

export interface BackupResult {
  backupId: string;
  timestamp: string;
  status: 'completed' | 'failed' | 'in_progress';
  recordCount: number;
  tables: string[];
  fileSizeKb: number;
  filePath?: string;
}

// Audit & Dead Code Types
export interface DeadItem {
  id: string;
  name: string;
  type: 'element' | 'workflow' | 'custom_event' | 'db_field' | 'style' | 'option_set';
  pageName?: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  canAutoClean: boolean;
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
  deadItems: DeadItem[];
  recommendations: string[];
  analyzedAt: string;
}

// AI Translation Types
export interface TranslationItem {
  id: string;
  key: string;
  sourceText: string;
  translatedText?: string;
  category: 'ui' | 'error' | 'notification' | 'email' | 'db_value';
  status: 'pending' | 'translated' | 'reviewed' | 'failed';
  tokensUsed?: number;
}

export interface TranslationJobConfig {
  sourceLang: string;
  targetLang: string;
  provider: 'openai' | 'anthropic' | 'gemini' | 'groq' | 'opencode' | 'ollama' | 'mock';
  model: string;
  temperature: number;
  tone: 'professional' | 'casual' | 'formal' | 'concise';
  useGlossary: boolean;
  glossary?: Record<string, string>;
  customEndpoint?: string;
}

export interface TranslationJobResult {
  jobId: string;
  sourceLang: string;
  targetLang: string;
  items: TranslationItem[];
  totalCount: number;
  successCount: number;
  tokensUsed: number;
  completedAt: string;
}

// Visual Regression & QA Types
export interface ViewportConfig {
  name: string;
  width: number;
  height: number;
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
}

export interface VisualSuiteResult {
  suiteId: string;
  totalTests: number;
  passed: number;
  failed: number;
  executedAt: string;
  cases: VisualTestCase[];
}
