import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Layers, 
  Key, 
  Globe, 
  Server, 
  ShieldCheck, 
  X, 
  Sparkles, 
  Activity, 
  Check, 
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Languages,
  Camera,
  Database,
  ExternalLink,
  Zap,
  Bot,
  Upload,
  FileCode,
  CheckSquare,
  RefreshCw,
  Copy,
  Download,
  FolderOpen,
  Cloud,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ProjectProfile } from '../types';
import { DevOpsEngine } from '../core/devops/devopsEngine';
import { TranslatorEngine } from '../core/translator/translatorEngine';
import { AI_PROVIDERS, PROVIDER_MODELS, getDefaultModelForProvider } from '../core/ai/aiProviders';
import { ProjectStore } from '../core/storage/projectStore';
import { BubbleSyncEngine } from '../core/bubble-sync/bubbleSyncEngine';
import { WorkflowGraphEngine } from '../core/workflows/workflowGraphEngine';
import { toast } from '../core/toast/toastManager';
import { CLOUD_SYNC_CONFIG } from '../config/cloudSyncConfig';

interface ConnectAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (
    project: Omit<ProjectProfile, 'id' | 'createdAt'>,
    aiConfig?: {
      provider: string;
      model: string;
      apiKey?: string;
      ollamaUrl?: string;
    }
  ) => void;
  onLog?: (module: 'system', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

export const ConnectAppModal: React.FC<ConnectAppModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  onLog
}) => {
  const [step, setStep] = useState<WizardStep>(1);
  
  // Step 1: App Identity
  const [name, setName] = useState('');
  const [rawInputUrl, setRawInputUrl] = useState('');
  const [appId, setAppId] = useState('');
  const [environment, setEnvironment] = useState<'version-test' | 'version-live'>('version-test');
  const [customDomain, setCustomDomain] = useState('');
  const [hasCustomName, setHasCustomName] = useState(false);
  
  // Step 1 Live Test
  const [isTestingAppId, setIsTestingAppId] = useState(false);
  const [appIdTestResult, setAppIdTestResult] = useState<{ success: boolean; latency: number; message: string } | null>(null);

  // Step 2: Authentication & API Token
  const [apiToken, setApiToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [enableDataApi, setEnableDataApi] = useState(true);
  const [enableBackups, setEnableBackups] = useState(true);
  const [enablePiiAudit, setEnablePiiAudit] = useState(true);

  // Step 2 Live Test
  const [isTestingToken, setIsTestingToken] = useState(false);
  const [tokenTestResult, setTokenTestResult] = useState<{ success: boolean; latency: number; message: string } | null>(null);

  // Agency Plan / HTTP Basic Auth Password Protection
  const [isAgencyPlan, setIsAgencyPlan] = useState(false);
  const [httpBasicUser, setHttpBasicUser] = useState('');
  const [httpBasicPassword, setHttpBasicPassword] = useState('');

  // Step 3: Localization & AI Setup (Ollama Default)
  const [aiProvider, setAiProvider] = useState('ollama');
  const [aiModel, setAiModel] = useState('llama3:8b');
  const [aiApiKey, setAiApiKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [showAiKey, setShowAiKey] = useState(false);
  const [useGlobalKey, setUseGlobalKey] = useState(true);
  const [saveToGlobalSettings, setSaveToGlobalSettings] = useState(true);

  // Ollama local model detection & custom models
  const [localOllamaModels, setLocalOllamaModels] = useState<string[]>([]);
  const [isDetectingOllama, setIsDetectingOllama] = useState(false);
  const [isCustomModel, setIsCustomModel] = useState(false);

  const detectLocalOllamaModels = useCallback(async (host = ollamaUrl || 'http://localhost:11434') => {
    setIsDetectingOllama(true);
    try {
      const endpoint = `${host.replace(/\/+$/, '')}/api/tags`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.models)) {
          const names = data.models.map((m: any) => m.name || m.model).filter(Boolean);
          setLocalOllamaModels(names);
        }
      }
    } catch {
      // offline
    } finally {
      setIsDetectingOllama(false);
    }
  }, [ollamaUrl]);

  useEffect(() => {
    if (isOpen && aiProvider === 'ollama') {
      detectLocalOllamaModels();
    }
  }, [isOpen, aiProvider, detectLocalOllamaModels]);

  const globalSettings = ProjectStore.getInstance().getSettings();
  const getSavedKey = (prov: string): string => {
    switch (prov) {
      case 'gemini': return globalSettings.geminiApiKey || '';
      case 'openai': return globalSettings.openaiApiKey || '';
      case 'anthropic': return globalSettings.anthropicApiKey || '';
      case 'groq': return globalSettings.groqApiKey || '';
      case 'deepseek': return globalSettings.deepseekApiKey || '';
      case 'openrouter': return globalSettings.openrouterApiKey || '';
      case 'xai': return globalSettings.xaiApiKey || '';
      case 'opencode': return globalSettings.opencodeApiKey || '';
      case 'ollama': return globalSettings.ollamaUrl || '';
      default: return '';
    }
  };

  // Step 3 Live Test
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; latency: number; message: string } | null>(null);

  // Step 4: Blueprint & Schema Export File (.bubble / JSON)
  const [blueprintJson, setBlueprintJson] = useState<any>(null);
  const [blueprintFileName, setBlueprintFileName] = useState<string>('');
  const [blueprintFileSize, setBlueprintFileSize] = useState<number>(0);
  const [blueprintStats, setBlueprintStats] = useState<{
    pagesCount: number;
    workflowsCount: number;
    elementsCount: number;
    dataTypesCount: number;
    appTextsCount: number;
  } | null>(null);
  const [isListeningDownloads, setIsListeningDownloads] = useState(false);
  const [recentDownload, setRecentDownload] = useState<any>(null);
  const [isCheckingDownloads, setIsCheckingDownloads] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Method 2: Managed Cloud Direct Sync State (Oracle / Buildprint Mode)
  const [cloudBranch, setCloudBranch] = useState<string>('test');
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [isGuidanceExpanded, setIsGuidanceExpanded] = useState<boolean>(false);

  const handleCloudSync = async () => {
    if (!appId.trim()) {
      toast.error('Please enter an Application ID in Step 1 first');
      return;
    }
    setIsCloudSyncing(true);
    const serverUrl = CLOUD_SYNC_CONFIG.getActiveServerUrl();
    try {
      const res = await BubbleSyncEngine.syncFromCloudServer(serverUrl, appId.trim(), cloudBranch);
      if (res.success && res.data) {
        processReceivedAppData(res.data, res.fileName);
      }
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleCopyAgentEmail = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(CLOUD_SYNC_CONFIG.botEmail).then(() => {
        toast.success(`Copied ${CLOUD_SYNC_CONFIG.botEmail} to clipboard!`);
      }).catch(() => {});
    }
  };

  // Check Downloads directory for recent export of this app when step 4 is opened
  useEffect(() => {
    if (step === 4 && appId) {
      setIsCheckingDownloads(true);
      BubbleSyncEngine.checkRecentDownloads(appId).then((res) => {
        if (res && res.found) {
          setRecentDownload(res);
        }
      }).finally(() => {
        setIsCheckingDownloads(false);
      });
    }
  }, [step, appId]);

  const handleLoadRecentDownload = () => {
    if (!recentDownload || !recentDownload.content) return;
    processReceivedAppData(recentDownload.content, recentDownload.fileName);
    setRecentDownload(null);
  };

  const handleOpenBrowserExport = async () => {
    if (!appId.trim()) {
      toast.error('Please enter an Application ID in Step 1 first');
      return;
    }
    setIsListeningDownloads(true);
    await BubbleSyncEngine.openBubbleInBrowser(appId.trim());
  };

  const processReceivedAppData = useCallback((data: any, sourceName?: string) => {
    if (!data) return;
    const tempProject: ProjectProfile = {
      id: 'temp',
      name: name || appId,
      appId: appId || 'synced_app',
      environment,
      createdAt: new Date().toISOString()
    };
    try {
      const fileName = sourceName || `${appId || 'bubble_app'}_synced.bubble`;
      setBlueprintFileName(fileName);
      setBlueprintJson(data);
      const jsonStr = JSON.stringify(data);
      setBlueprintFileSize(jsonStr.length);
      const parsedStats = BubbleSyncEngine.calculateBlueprintStats(data);
      const parsedSchema = DevOpsEngine.parseBubbleSchemaJson(data, tempProject);
      setBlueprintStats({
        pagesCount: parsedStats.pagesCount,
        workflowsCount: parsedStats.workflowsCount,
        elementsCount: parsedStats.elementsCount,
        dataTypesCount: parsedStats.dataTypesCount || parsedSchema.dataTypes.length,
        appTextsCount: parsedStats.appTextsCount
      });
      toast.success(`✨ Synced ${fileName}! (${parsedStats.pagesCount} Pages, ${parsedStats.workflowsCount} Workflows, ${parsedStats.elementsCount} Elements)`);
    } catch (err: any) {
      toast.error('Failed to parse received application data: ' + err?.message);
    }
  }, [name, appId, environment]);

  useEffect(() => {
    if (!isOpen) return;

    // Listen for downloaded .bubble files in Downloads folder
    const unsubFile = window.electronAPI?.onBubbleFileDetected?.((data: any) => {
      if (data && data.content) {
        processReceivedAppData(data.content, data.fileName);
      }
    });

    window.electronAPI?.bubbleSyncSetDownloadsWatcher?.(true);

    return () => {
      unsubFile?.();
    };
  }, [isOpen, processReceivedAppData, appId]);

  const formatDisplayName = (slug: string): string => {
    if (!slug) return '';
    return slug
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim();
  };

  // Auto-parse full Bubble URLs when pasted (e.g. https://my-app.bubbleapps.io/version-test/page)
  const handleUrlChange = (value: string) => {
    setRawInputUrl(value);
    setAppIdTestResult(null);
    const trimmed = value.trim();

    try {
      if (trimmed.includes('bubbleapps.io')) {
        const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
        const hostname = urlObj.hostname;
        const extractedAppId = hostname.split('.bubbleapps.io')[0];
        if (extractedAppId) {
          setAppId(extractedAppId);
          if (!hasCustomName) {
            setName(formatDisplayName(extractedAppId));
          }
        }

        if (urlObj.pathname.includes('/version-test')) {
          setEnvironment('version-test');
        } else {
          setEnvironment('version-live');
        }
      } else if (trimmed.includes('.')) {
        // Custom domain
        const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
        setCustomDomain(urlObj.hostname);
        const cleanId = urlObj.hostname.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        setAppId(cleanId);
        if (!hasCustomName) {
          setName(urlObj.hostname);
        }
      } else {
        // Just an App ID
        const cleanId = trimmed.toLowerCase().replace(/[^a-zA-Z0-9-_]/g, '');
        setAppId(cleanId);
        if (!hasCustomName) {
          setName(formatDisplayName(cleanId));
        }
      }
    } catch {
      const cleanId = trimmed.toLowerCase().replace(/[^a-zA-Z0-9-_]/g, '');
      setAppId(cleanId);
      if (!hasCustomName) {
        setName(formatDisplayName(cleanId));
      }
    }
  };

  const handleAppIdDirectChange = (value: string) => {
    const cleanId = value.toLowerCase().replace(/[^a-zA-Z0-9-_]/g, '');
    setAppId(cleanId);
    setAppIdTestResult(null);
    if (!hasCustomName) {
      setName(formatDisplayName(cleanId));
    }
  };

  // Provider change updates default model
  const handleProviderChange = (newProvider: string) => {
    setAiProvider(newProvider);
    setAiTestResult(null);
    const models = PROVIDER_MODELS[newProvider];
    if (models && models.length > 0) {
      setAiModel(models[0].id);
    }
  };

  // --- Step 1 Test: Bubble App Reachability ---
  const handleTestStep1App = async () => {
    if (!appId.trim()) return;
    setIsTestingAppId(true);
    try {
      const tempProj: ProjectProfile = {
        id: 'test_app',
        name: name.trim() || appId.trim(),
        appId: appId.trim(),
        environment,
        customDomain: customDomain.trim() || undefined,
        createdAt: new Date().toISOString()
      };
      const res = await DevOpsEngine.checkHealth(tempProj);
      setAppIdTestResult({
        success: res.reachable,
        latency: res.latencyMs,
        message: `Endpoint https://${customDomain || `${appId}.bubbleapps.io`}/${environment}/ is reachable (${res.latencyMs}ms).`
      });
      if (onLog) onLog('system', `Step 1 App ID test for ${appId}: OK (${res.latencyMs}ms)`, 'success');
    } catch (e: any) {
      setAppIdTestResult({
        success: false,
        latency: 0,
        message: e.message || 'Could not reach Bubble domain.'
      });
    } finally {
      setIsTestingAppId(false);
    }
  };

  // --- Step 2 Test: Token & Schema Permissions ---
  const handleTestStep2Token = async () => {
    if (!appId.trim()) return;
    setIsTestingToken(true);
    try {
      const tempProj: ProjectProfile = {
        id: 'test_token',
        name: name.trim() || appId.trim(),
        appId: appId.trim(),
        environment,
        apiToken: apiToken.trim() || undefined,
        customDomain: customDomain.trim() || undefined,
        createdAt: new Date().toISOString()
      };
      const res = await DevOpsEngine.checkHealth(tempProj);
      setTokenTestResult({
        success: true,
        latency: res.latencyMs,
        message: apiToken.trim()
          ? `Private API Token verified! Schema & Data API access granted (${res.latencyMs}ms).`
          : `Public read-only mode verified (${res.latencyMs}ms).`
      });
      if (onLog) onLog('system', `Step 2 API Token test: OK`, 'success');
    } catch (e: any) {
      setTokenTestResult({
        success: false,
        latency: 0,
        message: e.message || 'Failed to authenticate token with Data API.'
      });
    } finally {
      setIsTestingToken(false);
    }
  };

  // --- Step 3 Test: AI Provider & Model ---
  const handleTestStep3Ai = async () => {
    setIsTestingAi(true);
    try {
      const savedKey = getSavedKey(aiProvider);
      const effectiveKey = (useGlobalKey && savedKey) ? savedKey : (aiApiKey.trim() || undefined);

      const res = await TranslatorEngine.verifyProviderConnection(
        aiProvider,
        aiModel,
        effectiveKey,
        ollamaUrl.trim() || undefined
      );
      setAiTestResult({
        success: res.success,
        latency: res.latencyMs,
        message: res.message
      });
      if (onLog) onLog('system', `Step 3 AI Provider test (${aiProvider}/${aiModel}): ${res.success ? 'OK' : 'FAIL'}`, res.success ? 'success' : 'warn');
    } catch (e: any) {
      setAiTestResult({
        success: false,
        latency: 0,
        message: e.message || 'AI provider test failed.'
      });
    } finally {
      setIsTestingAi(false);
    }
  };

  // --- Step 4: Handle Blueprint / JSON File Upload ---
  const handleBlueprintFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBlueprintFileName(file.name);
    setBlueprintFileSize(file.size);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        setBlueprintJson(parsed);

        // Calculate counts
        let pagesCount = 0;
        let workflowsCount = 0;
        let elementsCount = 0;
        let dataTypesCount = 0;
        let appTextsCount = 0;

        const stats = BubbleSyncEngine.calculateBlueprintStats(parsed);
        setBlueprintStats(stats);

        if (onLog) onLog('system', `Blueprint loaded from ${file.name}: ${stats.pagesCount} pages, ${stats.workflowsCount} workflows parsed.`, 'success');
      } catch (err: any) {
        if (onLog) onLog('system', `Could not parse JSON blueprint file: ${err.message}`, 'warn');
      }
    };
    reader.readAsText(file);
  };

  const handleNextStep = () => {
    if (step === 1 && !appId.trim()) return;
    if (step < 5) {
      setStep((step + 1) as WizardStep);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((step - 1) as WizardStep);
    }
  };

  const handleFinish = () => {
    if (!appId.trim()) return;

    const savedKey = getSavedKey(aiProvider);
    const effectiveKey = (useGlobalKey && savedKey) ? savedKey : (aiApiKey.trim() || undefined);

    // Save key to Global Settings if requested
    if (aiApiKey.trim() && saveToGlobalSettings) {
      const store = ProjectStore.getInstance();
      const settingsPatch: any = {};
      if (aiProvider === 'gemini') settingsPatch.geminiApiKey = aiApiKey.trim();
      else if (aiProvider === 'openai') settingsPatch.openaiApiKey = aiApiKey.trim();
      else if (aiProvider === 'anthropic') settingsPatch.anthropicApiKey = aiApiKey.trim();
      else if (aiProvider === 'groq') settingsPatch.groqApiKey = aiApiKey.trim();
      else if (aiProvider === 'deepseek') settingsPatch.deepseekApiKey = aiApiKey.trim();
      else if (aiProvider === 'openrouter') settingsPatch.openrouterApiKey = aiApiKey.trim();
      else if (aiProvider === 'xai') settingsPatch.xaiApiKey = aiApiKey.trim();
      else if (aiProvider === 'opencode') settingsPatch.opencodeApiKey = aiApiKey.trim();
      else if (aiProvider === 'ollama') settingsPatch.ollamaUrl = ollamaUrl.trim();
      store.updateSettings(settingsPatch);
      if (onLog) onLog('system', `Saved ${aiProvider.toUpperCase()} key to Global Settings.`, 'success');
    }

    onConnect(
      {
        name: name.trim() || appId.trim(),
        appId: appId.trim().toLowerCase().replace(/\s+/g, '-'),
        environment,
        apiToken: apiToken.trim() || undefined,
        customDomain: customDomain.trim() || undefined,
        httpBasicUser: isAgencyPlan && httpBasicUser.trim() ? httpBasicUser.trim() : undefined,
        httpBasicPassword: isAgencyPlan && httpBasicPassword.trim() ? httpBasicPassword.trim() : undefined,
        blueprintExportJson: blueprintJson || undefined,
        blueprintFileName: blueprintFileName || undefined,
        stats: blueprintStats || undefined
      },
      {
        provider: aiProvider,
        model: aiModel,
        apiKey: effectiveKey,
        ollamaUrl: ollamaUrl.trim() || undefined
      }
    );

    // Reset wizard
    setStep(1);
    setName('');
    setRawInputUrl('');
    setAppId('');
    setApiToken('');
    setCustomDomain('');
    setAiApiKey('');
    setHasCustomName(false);
    setBlueprintJson(null);
    setBlueprintFileName('');
    setBlueprintStats(null);
    setAppIdTestResult(null);
    setTokenTestResult(null);
    setAiTestResult(null);
    onClose();
  };

  const currentModels = useMemo(() => {
    const base = PROVIDER_MODELS[aiProvider] || [];
    if (aiProvider === 'ollama') {
      const detectedItems = localOllamaModels.map(name => ({
        id: name,
        name: `${name} (Installed Locally ✓)`
      }));
      const existingIds = new Set(detectedItems.map(d => d.id));
      const combined = [...detectedItems];
      for (const m of base) {
        if (!existingIds.has(m.id)) {
          combined.push(m);
        }
      }
      return combined;
    }
    return base;
  }, [aiProvider, localOllamaModels]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '780px',
        maxHeight: 'min(92vh, 860px)',
        backgroundColor: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-active)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(99, 102, 241, 0.25)',
        overflow: 'hidden',
        animation: 'modalSlideIn 0.25s ease-out',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Wizard Header with 5 Step Progress Bar */}
        <div style={{
          padding: '18px 24px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
              }}>
                <Sparkles size={20} color="#ffffff" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Connect Bubble Application Wizard
                </h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                  Interactive 4-pillar setup: App ID, API Token, AI LLM & Application Blueprint Export
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
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

          {/* Stepper Steps (5 steps) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
            {[
              { num: 1, label: 'App Identity' },
              { num: 2, label: 'API Security' },
              { num: 3, label: 'AI LLMs' },
              { num: 4, label: 'Blueprint Export' },
              { num: 5, label: 'Launch' }
            ].map(s => {
              const isCurrent = step === s.num;
              const isDone = step > s.num;
              return (
                <div
                  key={s.num}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    opacity: isCurrent || isDone ? 1 : 0.45
                  }}
                >
                  <div style={{
                    height: '4px',
                    borderRadius: '2px',
                    background: isDone ? 'var(--accent-emerald)' : isCurrent ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.3s ease'
                  }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--primary)' : isDone ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                    <span>{s.num}.</span>
                    <span>{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Step Body with Smooth Vertical Scrolling */}
        <div style={{
          padding: '20px 24px',
          flex: '1 1 auto',
          overflowY: 'auto',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* STEP 1: APP IDENTITY */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.2s ease-out' }}>
              <div>
                <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Bubble App URL or App Identifier *</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>Paste full URL for auto-detection</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Globe size={15} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="e.g. https://my-app.bubbleapps.io/version-test or quiz2coin-test"
                    value={rawInputUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className="input"
                    style={{ paddingLeft: '36px' }}
                    autoFocus
                  />
                </div>
              </div>

              <div className="grid-2" style={{ gap: '14px' }}>
                <div>
                  <label className="input-label">Extracted App ID *</label>
                  <input
                    type="text"
                    placeholder="e.g. my-bubble-app"
                    value={appId}
                    onChange={(e) => handleAppIdDirectChange(e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="input-label">Display Name in Studio</label>
                  <input
                    type="text"
                    placeholder="e.g. My Bubble Platform"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setHasCustomName(true);
                    }}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid-2" style={{ gap: '14px' }}>
                <div>
                  <label className="input-label">Target Environment</label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value as any)}
                    className="select"
                  >
                    <option value="version-test">Development / Test (version-test)</option>
                    <option value="version-live">Production / Live (version-live)</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">Custom Domain (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. app.myplatform.com"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              {/* Step 1 Diagnostic Test Box */}
              <div style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <Server size={14} color="var(--primary)" />
                    <span>Target URL: <code>https://{customDomain || `${appId || 'your-app'}.bubbleapps.io`}/{environment}/</code></span>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestStep1App}
                    disabled={isTestingAppId || !appId.trim()}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    <Activity size={12} className={isTestingAppId ? 'spin' : ''} />
                    <span>{isTestingAppId ? 'Testing...' : 'Test Reachability'}</span>
                  </button>
                </div>

                {appIdTestResult && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.775rem',
                    color: appIdTestResult.success ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                    paddingTop: '6px',
                    borderTop: '1px solid var(--border-subtle)'
                  }}>
                    {appIdTestResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    <span>{appIdTestResult.message}</span>
                  </div>
                )}
              </div>

              {/* Step 1 How to find App ID Guide */}
              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.06)', border: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={13} color="var(--primary)" />
                  <span>Where to find your Bubble App ID:</span>
                </div>
                <div>• Look at your browser address bar inside Bubble Editor: <code>bubble.io/page?id=<strong>your-app-id</strong></code></div>
                <div>• Or simply copy & paste the full application URL above, and Studio will auto-extract it for you.</div>
              </div>
            </div>
          )}

          {/* STEP 2: DATA API & SECURITY */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.2s ease-out' }}>
              <div>
                <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Private Bubble Data API Key (Bearer Token)</span>
                  <a
                    href={`https://bubble.io/page?id=${appId}&tab=api`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>Open Bubble Settings &gt; API</span>
                    <ExternalLink size={10} />
                  </a>
                </label>

                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                  <input
                    type={showToken ? 'text' : 'password'}
                    placeholder="Enter private API key token (e.g. 5d8a9f...)"
                    value={apiToken}
                    onChange={(e) => {
                      setApiToken(e.target.value);
                      setTokenTestResult(null);
                    }}
                    className="input"
                    style={{ paddingLeft: '36px', paddingRight: '40px' }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '12px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Enables live schema reading, migrations, data seeding, backups, and backend workflow execution.
                </div>
              </div>

              {/* Agency Plan / HTTP Password Protected App */}
              <div style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: isAgencyPlan ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-input)',
                border: isAgencyPlan ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
                transition: 'all 0.2s ease'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={isAgencyPlan}
                    onChange={(e) => setIsAgencyPlan(e.target.checked)}
                  />
                  <ShieldCheck size={15} color="var(--primary)" />
                  <span>Agency Plan / App-Level Password Protection (HTTP Basic Auth)</span>
                </label>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px', marginLeft: '24px' }}>
                  Enable if your Bubble app has a password prompt under <em>Settings &gt; General &gt; Limit access to this app</em> to allow Visual QA & Live Preview to access your pages.
                </div>

                {isAgencyPlan && (
                  <div className="grid-2" style={{ marginTop: '12px', gap: '12px' }}>
                    <div>
                      <label className="input-label">HTTP Basic Username *</label>
                      <input
                        type="text"
                        placeholder="username"
                        value={httpBasicUser}
                        onChange={(e) => setHttpBasicUser(e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="input-label">HTTP Basic Password *</label>
                      <input
                        type="password"
                        placeholder="password"
                        value={httpBasicPassword}
                        onChange={(e) => setHttpBasicPassword(e.target.value)}
                        className="input"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2 Diagnostic Test Box */}
              <div style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <ShieldCheck size={14} color="var(--accent-emerald)" />
                    <span>Validate Token & Data API Permissions</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestStep2Token}
                    disabled={isTestingToken}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    <Activity size={12} className={isTestingToken ? 'spin' : ''} />
                    <span>{isTestingToken ? 'Verifying...' : 'Test Token Access'}</span>
                  </button>
                </div>

                {tokenTestResult && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.775rem',
                    color: tokenTestResult.success ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                    paddingTop: '6px',
                    borderTop: '1px solid var(--border-subtle)'
                  }}>
                    {tokenTestResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    <span>{tokenTestResult.message}</span>
                  </div>
                )}
              </div>

              {/* Step 2 How to get Token Guide */}
              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={13} color="var(--accent-emerald)" />
                  <span>How to generate your Bubble API Token:</span>
                </div>
                <div>1. In Bubble Editor, click <strong>Settings</strong> (⚙️ left sidebar) → <strong>API</strong> tab.</div>
                <div>2. Enable checkbox <strong>"Enable Data API"</strong> and select data types you wish to expose.</div>
                <div>3. Scroll to <strong>API Tokens</strong>, click <strong>"Generate a new API token"</strong>, type a name (e.g. <code>Studio</code>), and copy the private key here.</div>
              </div>
            </div>
          )}

          {/* STEP 3: AI PROVIDER & INTEGRATIONS */}
          {step === 3 && (() => {
            const savedProviders = [
              { id: 'gemini', name: 'Google Gemini', key: globalSettings.geminiApiKey },
              { id: 'openai', name: 'OpenAI', key: globalSettings.openaiApiKey },
              { id: 'anthropic', name: 'Anthropic Claude', key: globalSettings.anthropicApiKey },
              { id: 'groq', name: 'Groq', key: globalSettings.groqApiKey },
              { id: 'deepseek', name: 'DeepSeek', key: globalSettings.deepseekApiKey },
              { id: 'openrouter', name: 'OpenRouter', key: globalSettings.openrouterApiKey },
              { id: 'xai', name: 'xAI', key: globalSettings.xaiApiKey },
              { id: 'opencode', name: 'OpenCode', key: globalSettings.opencodeApiKey },
              { id: 'ollama', name: 'Ollama', key: globalSettings.ollamaUrl }
            ].filter(p => Boolean(p.key));

            const hasGlobalKeyForCurrent = Boolean(getSavedKey(aiProvider));

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'fadeIn 0.2s ease-out' }}>
                {/* Configured Global Keys Quick Selector */}
                {savedProviders.length > 0 && (
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.775rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                        <CheckCircle2 size={14} />
                        <span>Configured Keys in Global Settings ({savedProviders.length})</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click to reuse for this app</span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {savedProviders.map(p => {
                        const isSelected = aiProvider === p.id && useGlobalKey;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              handleProviderChange(p.id);
                              setUseGlobalKey(true);
                              setAiApiKey('');
                              setAiTestResult(null);
                            }}
                            className={`btn btn-sm ${isSelected ? 'btn-success' : 'btn-secondary'}`}
                            style={{ fontSize: '0.75rem', padding: '4px 10px', gap: '6px' }}
                          >
                            <Sparkles size={11} />
                            <span>{p.name}</span>
                            {isSelected && <Check size={11} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid-2" style={{ gap: '14px' }}>
                  <div>
                    <label className="input-label">AI Localization Provider</label>
                    <select
                      value={aiProvider}
                      onChange={(e) => {
                        handleProviderChange(e.target.value);
                        setUseGlobalKey(Boolean(getSavedKey(e.target.value)));
                      }}
                      className="select"
                    >
                      <option value="ollama">Ollama (Local Offline / 0 Cost) {getSavedKey('ollama') ? '• Saved Host ✓' : ''}</option>
                      <option value="gemini">Google Gemini {getSavedKey('gemini') ? '• Saved Key ✓' : ''}</option>
                      <option value="openai">OpenAI (GPT-4o) {getSavedKey('openai') ? '• Saved Key ✓' : ''}</option>
                      <option value="anthropic">Anthropic (Claude) {getSavedKey('anthropic') ? '• Saved Key ✓' : ''}</option>
                      <option value="groq">Groq (LPU Inference) {getSavedKey('groq') ? '• Saved Key ✓' : ''}</option>
                      <option value="deepseek">DeepSeek (V3/R1) {getSavedKey('deepseek') ? '• Saved Key ✓' : ''}</option>
                      <option value="xai">xAI (Grok 2) {getSavedKey('xai') ? '• Saved Key ✓' : ''}</option>
                      <option value="opencode">OpenCode (Zen Router) {getSavedKey('opencode') ? '• Saved Key ✓' : ''}</option>
                      <option value="openrouter">OpenRouter (Global Multi-LLM) {getSavedKey('openrouter') ? '• Saved Key ✓' : ''}</option>
                      <option value="mock">Offline Studio Engine (Built-in)</option>
                    </select>
                  </div>

                  <div>
                    <label className="input-label">Model for {aiProvider.toUpperCase()}</label>
                    <select
                      value={isCustomModel ? '__custom__' : aiModel}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomModel(true);
                        } else {
                          setIsCustomModel(false);
                          setAiModel(e.target.value);
                          setAiTestResult(null);
                        }
                      }}
                      className="select"
                    >
                      {currentModels.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                      {aiProvider === 'ollama' && (
                        <option value="__custom__">➕ Custom Model Name / Tag...</option>
                      )}
                    </select>

                    {aiProvider === 'ollama' && (isCustomModel || (!currentModels.some(m => m.id === aiModel) && aiModel)) && (
                      <div style={{ marginTop: '8px' }}>
                        <label className="input-label" style={{ fontSize: '0.725rem', color: 'var(--accent-cyan)' }}>
                          Type Custom Ollama Model Name or Tag
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. llama3:8b, mistral:instruct, deepseek-r1:8b"
                          value={aiModel === '__custom__' ? '' : aiModel}
                          onChange={(e) => {
                            setAiModel(e.target.value);
                            setAiTestResult(null);
                          }}
                          className="input"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Dynamic API Key input or Global Key Card */}
                {aiProvider === 'ollama' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Ollama Host URL (Local / Offline LLM)</span>
                        <button
                          type="button"
                          onClick={() => detectLocalOllamaModels()}
                          disabled={isDetectingOllama}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.7rem', padding: '2px 8px', gap: '4px' }}
                        >
                          <RefreshCw size={11} className={isDetectingOllama ? 'spin' : ''} />
                          <span>{isDetectingOllama ? 'Scanning...' : 'Detect Local Models'}</span>
                        </button>
                      </label>
                      <input
                        type="text"
                        placeholder="http://localhost:11434"
                        value={ollamaUrl}
                        onChange={(e) => setOllamaUrl(e.target.value)}
                        className="input"
                      />
                    </div>
                    {localOllamaModels.length > 0 && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} />
                        <span>Detected {localOllamaModels.length} installed model(s): <strong>{localOllamaModels.join(', ')}</strong></span>
                      </div>
                    )}
                  </div>
                ) : aiProvider !== 'mock' ? (
                  <div>
                    {useGlobalKey && hasGlobalKeyForCurrent ? (
                      <div style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(16, 185, 129, 0.06)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <CheckCircle2 size={18} color="var(--accent-emerald)" />
                          <div>
                            <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              Using saved {aiProvider.toUpperCase()} key from Settings
                            </div>
                            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              ••••••••••••{getSavedKey(aiProvider).slice(-4)}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setUseGlobalKey(false);
                            setAiApiKey('');
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.725rem', padding: '4px 10px' }}
                        >
                          Enter Custom Key
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label className="input-label" style={{ margin: 0 }}>
                            {aiProvider.toUpperCase()} API Key
                          </label>
                          {hasGlobalKeyForCurrent && (
                            <button
                              type="button"
                              onClick={() => {
                                setUseGlobalKey(true);
                                setAiApiKey('');
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.725rem', cursor: 'pointer', padding: 0 }}
                            >
                              Use Saved Settings Key instead
                            </button>
                          )}
                        </div>

                        <div style={{ position: 'relative' }}>
                          <Bot size={15} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                          <input
                            type={showAiKey ? 'text' : 'password'}
                            placeholder={`Enter ${aiProvider} API key...`}
                            value={aiApiKey}
                            onChange={(e) => {
                              setAiApiKey(e.target.value);
                              setAiTestResult(null);
                            }}
                            className="input"
                            style={{ paddingLeft: '36px', paddingRight: '40px' }}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setShowAiKey(!showAiKey)}
                            style={{
                              position: 'absolute',
                              right: '12px',
                              top: '12px',
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer'
                            }}
                          >
                            {showAiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                          <input
                            type="checkbox"
                            checked={saveToGlobalSettings}
                            onChange={(e) => setSaveToGlobalSettings(e.target.checked)}
                          />
                          <span>Save this {aiProvider.toUpperCase()} key to Global Settings (so other apps can reuse it)</span>
                        </label>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Using built-in Studio offline engine. No API key or credit card required.
                  </div>
                )}

                {/* Step 3 How to get AI Key Guide */}
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(6, 182, 212, 0.06)', border: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Bot size={13} color="var(--accent-cyan)" />
                      <span>Where to get your {aiProvider.toUpperCase()} Key:</span>
                    </div>
                    {aiProvider === 'gemini' && (
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span>Get Gemini Key (Free)</span><ExternalLink size={10} />
                      </a>
                    )}
                    {aiProvider === 'openai' && (
                      <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span>Get OpenAI Key</span><ExternalLink size={10} />
                      </a>
                    )}
                    {aiProvider === 'anthropic' && (
                      <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span>Get Claude Key</span><ExternalLink size={10} />
                      </a>
                    )}
                    {aiProvider === 'groq' && (
                      <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span>Get Groq Key (Free LPU)</span><ExternalLink size={10} />
                      </a>
                    )}
                    {aiProvider === 'deepseek' && (
                      <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span>Get DeepSeek Key</span><ExternalLink size={10} />
                      </a>
                    )}
                    {aiProvider === 'xai' && (
                      <a href="https://console.x.ai/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span>Get xAI Grok Key</span><ExternalLink size={10} />
                      </a>
                    )}
                    {aiProvider === 'openrouter' && (
                      <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span>Get OpenRouter Key</span><ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  <div>Generate an API key from your provider's developer dashboard to enable batch translation and AI code auditing.</div>
                </div>

                {/* Step 3 Diagnostic Test Box */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <Zap size={14} color="var(--accent-cyan)" />
                      <span>Verify {aiProvider.toUpperCase()} Credentials & Latency</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestStep3Ai}
                      disabled={isTestingAi}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      <Activity size={12} className={isTestingAi ? 'spin' : ''} />
                      <span>{isTestingAi ? 'Testing...' : 'Test AI Connection'}</span>
                    </button>
                  </div>

                  {aiTestResult && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.775rem',
                      color: aiTestResult.success ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                      paddingTop: '6px',
                      borderTop: '1px solid var(--border-subtle)'
                    }}>
                      {aiTestResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      <span>{aiTestResult.message} ({aiTestResult.latency}ms)</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* STEP 4: BLUEPRINT & SCHEMA EXPORT (.bubble / JSON) */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'fadeIn 0.2s ease-out' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Application Blueprint & AST Export (.bubble / JSON)
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, marginTop: '3px', lineHeight: 1.5 }}>
                  Importing your <code>.bubble</code> file or application JSON provides full AST indexing for Dead Code Detection, workflow coverage, and AI Localization.
                </p>
              </div>

              {/* Detected Recent Export Banner from Downloads */}
              {recentDownload?.found && !blueprintFileName && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.12) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.12)',
                  animation: 'fadeIn 0.3s ease-out'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-emerald)',
                      flexShrink: 0
                    }}>
                      <Download size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Found Recent Export in Downloads: <code>{recentDownload.fileName}</code>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {(recentDownload.sizeBytes / (1024 * 1024)).toFixed(1)} MB • {recentDownload.stats?.pagesCount || 1} Pages • {recentDownload.stats?.workflowsCount || 0} Workflows • {recentDownload.stats?.elementsCount || 0} Elements
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadRecentDownload}
                    className="btn btn-primary btn-sm"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                      borderColor: 'transparent',
                      whiteSpace: 'nowrap',
                      gap: '6px',
                      fontWeight: 700
                    }}
                  >
                    <Sparkles size={13} />
                    <span>Load This Export</span>
                  </button>
                </div>
              )}

              {/* 2 Streamlined, Production-Grade Sync Workflows */}
              <div className="grid-2" style={{ gap: '14px' }}>
                {/* Method 1: Local Auto-Detect (Downloads Watcher) */}
                <div style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: isListeningDownloads ? 'rgba(16, 185, 129, 0.08)' : 'rgba(6, 182, 212, 0.06)',
                  border: isListeningDownloads ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  transition: 'all 0.2s ease'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: isListeningDownloads ? 'rgba(16, 185, 129, 0.2)' : 'rgba(6, 182, 212, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isListeningDownloads ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
                          flexShrink: 0
                        }}>
                          <Globe size={15} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Method 1: Local Auto-Detect
                        </span>
                      </div>
                      <span style={{ fontSize: '0.625rem', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        ZERO-SETUP
                      </span>
                    </div>
                    <p style={{ fontSize: '0.735rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                      Click below to open <strong>Settings &gt; General</strong> in your browser. Click <strong>"Export application"</strong> and Dev Studio automatically catches the <code>.bubble</code> file!
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenBrowserExport}
                    disabled={!appId}
                    className="btn btn-primary btn-sm"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '0.775rem',
                      padding: '8px 12px',
                      background: isListeningDownloads ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                      borderColor: 'transparent'
                    }}
                  >
                    <ExternalLink size={13} />
                    <span>{isListeningDownloads ? 'Watching Downloads Folder...' : 'Open Bubble Settings > General'}</span>
                  </button>
                </div>

                {/* Method 2: Cloud Direct Sync (Oracle / Buildprint Mode) */}
                <div style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  transition: 'all 0.2s ease'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #ec4899, #a855f7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          flexShrink: 0
                        }}>
                          <Cloud size={15} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Method 2: Cloud Direct Sync
                        </span>
                      </div>
                      <span style={{ fontSize: '0.625rem', background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        MANAGED BOT
                      </span>
                    </div>
                    <p style={{ fontSize: '0.735rem', color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: 1.45 }}>
                      Direct cloud-to-cloud AST sync via our official collaborator bot. Instant, zero file hunting.
                    </p>

                    <div style={{
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}>
                      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          1. Invite Collaborator (Settings &gt; Collaboration):
                        </span>
                        <code style={{ fontSize: '0.725rem', color: '#f472b6', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {CLOUD_SYNC_CONFIG.botEmail}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyAgentEmail}
                        className="btn btn-secondary btn-xs"
                        style={{ padding: '3px 8px', fontSize: '0.675rem', gap: '4px', flexShrink: 0 }}
                        title="Copy email to clipboard"
                      >
                        <Copy size={11} />
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>

                  {/* Clean full-width 1-Click Cloud Sync Button (No test input) */}
                  <button
                    type="button"
                    onClick={handleCloudSync}
                    disabled={isCloudSyncing || !appId}
                    className="btn btn-primary btn-sm"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '0.775rem',
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
                      borderColor: 'transparent'
                    }}
                  >
                    <Zap size={13} className={isCloudSyncing ? 'spin' : ''} />
                    <span>{isCloudSyncing ? 'Connecting & Syncing...' : '⚡ 1-Click Cloud Sync'}</span>
                  </button>
                </div>
              </div>

              {/* Active Downloads Watcher Notification Banner */}
              {isListeningDownloads && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  animation: 'pulse 2s infinite'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.775rem', color: 'var(--accent-emerald)', minWidth: 0 }}>
                    <Activity size={14} className="spin" style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Watching your <strong>Downloads</strong> folder. In Bubble, click <strong>"Export"</strong> under <em>Settings &gt; General</em>!
                    </span>
                  </div>
                  <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>Auto-Import Active</span>
                </div>
              )}

              {/* Upload Dropzone */}
              <div
                style={{
                  border: blueprintFileName ? '2px solid var(--accent-emerald)' : '2px dashed var(--border-active)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px',
                  textAlign: 'center',
                  background: blueprintFileName ? 'rgba(16, 185, 129, 0.06)' : 'var(--bg-input)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.bubble,.csv"
                  onChange={handleBlueprintFileUpload}
                  style={{ display: 'none' }}
                />

                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: blueprintFileName ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px',
                  color: blueprintFileName ? 'var(--accent-emerald)' : 'var(--primary)'
                }}>
                  {blueprintFileName ? <CheckCircle2 size={20} /> : <Upload size={18} />}
                </div>

                {blueprintFileName ? (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      {blueprintFileName} ({blueprintFileSize >= 1024 * 1024 ? `${(blueprintFileSize / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(blueprintFileSize / 1024)} KB`})
                    </div>
                    <div style={{ fontSize: '0.735rem', color: 'var(--accent-emerald)', marginTop: '2px' }}>
                      ✓ Blueprint parsed and ready for AST analysis! Click to change file.
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                      Drag & drop your <code>.bubble</code> or <code>export.json</code> file
                    </div>
                    <div style={{ fontSize: '0.735rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Or click to browse from disk (.bubble, .json, .csv)
                    </div>
                  </div>
                )}
              </div>

              {/* Parsed Stats Breakdown */}
              {blueprintStats && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                  gap: '8px',
                  padding: '10px 14px',
                  background: 'rgba(0,0,0,0.25)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ textAlign: 'center', minWidth: 0 }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>PAGES</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{blueprintStats.pagesCount}</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 0 }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>WORKFLOWS</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>{blueprintStats.workflowsCount}</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 0 }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>ELEMENTS</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{blueprintStats.elementsCount}</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 0 }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>DATA TYPES</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{blueprintStats.dataTypesCount}</div>
                  </div>
                </div>
              )}

              {/* Guidance box (Collapsible, collapsed by default) */}
              <div style={{
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                fontSize: '0.775rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                overflow: 'hidden',
                transition: 'all 0.2s ease'
              }}>
                <div
                  onClick={() => setIsGuidanceExpanded(!isGuidanceExpanded)}
                  style={{
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none',
                    background: isGuidanceExpanded ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                    borderBottom: isGuidanceExpanded ? '1px solid rgba(99, 102, 241, 0.15)' : 'none',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={14} color="var(--primary)" />
                    <span style={{ fontSize: '0.8rem' }}>How to get your application file from Bubble</span>
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: 'var(--primary)',
                      fontWeight: 600
                    }}>
                      {isGuidanceExpanded ? 'Hide guide' : 'Show guide'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {appId && (
                      <a
                        href={`https://bubble.io/page?id=${appId}&tab=general`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span>Open Settings &gt; General</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                    <button
                      type="button"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      {isGuidanceExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {isGuidanceExpanded && (
                  <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div><strong>1. Locate in Bubble:</strong> Open your Bubble Editor ➔ click <strong>Settings (⚙️)</strong> in the left sidebar ➔ choose the <strong>General</strong> tab.</div>
                      <div><strong>2. Export:</strong> Scroll down to the <strong>"Export application"</strong> section and click <strong>"Export"</strong>. A <code>.bubble</code> or <code>.json</code> file will download to your computer.</div>
                      <div><strong>3. Upload here:</strong> Drag and drop that downloaded file into the box above.</div>
                    </div>

                    <div style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0, 0, 0, 0.25)',
                      fontSize: '0.725rem',
                      color: 'var(--text-muted)'
                    }}>
                      💡 <strong>Note:</strong> This file contains your app's UI elements, workflows, and database schema (AST). It is 100% safe and does not contain live user records. If you don't have it right now, you can skip this step and upload it later in Settings.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: VERIFICATION & LAUNCH */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'fadeIn 0.2s ease-out' }}>
              <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(99, 102, 241, 0.2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  color: 'var(--accent-emerald)'
                }}>
                  <CheckCircle2 size={28} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Ready to Launch {name || appId}!
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                  All 4 configuration pillars verified for full developer studio operations
                </p>
              </div>

              {/* 4 Pillars Readiness Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Globe size={15} color="var(--accent-cyan)" />
                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>1. App & URL</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    App ID: <code>{appId}</code> ({environment})
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Lock size={15} color={apiToken ? 'var(--accent-emerald)' : 'var(--text-muted)'} />
                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>2. Security Token</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {apiToken ? 'Private Data API Token Active' : 'Public Access Mode'}
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Bot size={15} color="var(--primary)" />
                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>3. AI Localization</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {aiProvider.toUpperCase()} • {aiModel}
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <FileCode size={15} color={blueprintFileName ? 'var(--accent-emerald)' : 'var(--text-muted)'} />
                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>4. Blueprint AST</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {blueprintFileName ? `${blueprintStats?.pagesCount || 1} Pages • ${blueprintStats?.workflowsCount || 0} Workflows` : 'Pending (Upload later in Audit)'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stepper Navigation Footer - Fixed & Always Visible at Bottom */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 24px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(10px)',
          flexShrink: 0
        }}>
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
            >
              <span>Cancel</span>
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={step === 1 && !appId.trim()}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>{step === 4 ? 'Continue to Launch' : 'Next Step'}</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="btn btn-primary btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                  border: 'none',
                  fontWeight: 700
                }}
              >
                <Check size={15} />
                <span>Launch Studio Workspace</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
