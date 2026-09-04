import { ProjectProfile } from '../../types';
import { toast } from '../toast/toastManager';
import { ProjectStore } from '../storage/projectStore';
import { DevOpsEngine } from '../devops/devopsEngine';

export interface BubbleAuthStatus {
  isAuthenticated: boolean;
  userEmail?: string;
}

export interface BubbleSyncResult {
  success: boolean;
  fileName?: string;
  data?: any;
  stats?: {
    pagesCount: number;
    workflowsCount: number;
    elementsCount: number;
    dataTypesCount: number;
    appTextsCount: number;
  };
  error?: string;
}

export class BubbleSyncEngine {
  private static isWatcherActive = false;
  private static watcherUnsubscribe: (() => void) | null = null;

  /**
   * Checks if user has an active authenticated session with Bubble.io
   */
  public static async checkAuthStatus(): Promise<BubbleAuthStatus> {
    if (typeof window !== 'undefined' && window.electronAPI?.bubbleSyncCheckAuth) {
      return await window.electronAPI.bubbleSyncCheckAuth();
    }
    return { isAuthenticated: false };
  }

  /**
   * Safe login helper
   */
  public static async login(): Promise<BubbleAuthStatus> {
    toast.info('Please use 1-Click Cloud Sync or export your .bubble file.');
    return { isAuthenticated: false };
  }

  /**
   * Clears saved Bubble session
   */
  public static async logout(): Promise<boolean> {
    if (typeof window !== 'undefined' && window.electronAPI?.bubbleSyncLogout) {
      await window.electronAPI.bubbleSyncLogout();
      toast.info('Disconnected Bubble.io session');
      return true;
    }
    return false;
  }

  /**
   * Checks Downloads directory for recent .bubble files matching the current app or recently exported
   */
  public static async checkRecentDownloads(appId?: string): Promise<{
    found: boolean;
    fileName?: string;
    filePath?: string;
    sizeBytes?: number;
    mtime?: number;
    content?: any;
    stats?: {
      pagesCount: number;
      workflowsCount: number;
      elementsCount: number;
      dataTypesCount: number;
      appTextsCount: number;
    };
  }> {
    if (typeof window !== 'undefined' && (window.electronAPI as any)?.bubbleSyncCheckRecentDownloads) {
      return await (window.electronAPI as any).bubbleSyncCheckRecentDownloads(appId);
    }
    return { found: false };
  }

  /**
   * Opens user's default browser directly to Bubble Editor for the given application
   */
  public static async openBubbleInBrowser(appId: string): Promise<boolean> {
    if (!appId) {
      toast.error('Please enter an Application ID first');
      return false;
    }

    const editorUrl = `https://bubble.io/page?id=${encodeURIComponent(appId)}&tab=general`;

    if (typeof window !== 'undefined' && window.electronAPI?.openExternal) {
      await window.electronAPI.openExternal(editorUrl);
    } else {
      window.open(editorUrl, '_blank', 'noopener,noreferrer');
    }

    toast.info('Opened Bubble in your browser. Click "Export" under Settings > General to download your blueprint.');
    return true;
  }

  /**
   * Opens user's default browser directly to Bubble Editor Settings > General tab
   * and automatically engages the Downloads folder watcher for exported .bubble files.
   */
  public static async openBubbleExportInBrowser(
    appId: string,
    onFileDetected?: (fileName: string, content: any, stats?: any) => void
  ): Promise<boolean> {
    if (onFileDetected) {
      await this.toggleDownloadsWatcher(true, onFileDetected);
    }
    return this.openBubbleInBrowser(appId);
  }

  /**
   * Computes accurate Bubble application AST statistics
   */
  public static calculateBlueprintStats(data: any): {
    pagesCount: number;
    workflowsCount: number;
    elementsCount: number;
    dataTypesCount: number;
    appTextsCount: number;
  } {
    if (!data || typeof data !== 'object') {
      return { pagesCount: 0, workflowsCount: 0, elementsCount: 0, dataTypesCount: 0, appTextsCount: 0 };
    }

    let pagesCount = 0;
    let workflowsCount = 0;
    let elementsCount = 0;
    let dataTypesCount = 0;
    let appTextsCount = 0;

    if (data.pages && typeof data.pages === 'object') {
      pagesCount = Object.keys(data.pages).length;
      for (const p of Object.values<any>(data.pages)) {
        if (p.elements && typeof p.elements === 'object') {
          elementsCount += Object.keys(p.elements).length;
        }
        if (p.events && typeof p.events === 'object') {
          workflowsCount += Object.keys(p.events).length;
        } else if (p.workflows && typeof p.workflows === 'object') {
          workflowsCount += Object.keys(p.workflows).length;
        }
      }
    }

    if (data.element_definitions && typeof data.element_definitions === 'object') {
      elementsCount += Object.keys(data.element_definitions).length;
    }
    if (data.workflows && typeof data.workflows === 'object') {
      workflowsCount += Object.keys(data.workflows).length;
    }
    if (data.user_types && typeof data.user_types === 'object') {
      dataTypesCount += Object.keys(data.user_types).length;
    }
    if (data.custom_types && typeof data.custom_types === 'object') {
      dataTypesCount += Object.keys(data.custom_types).length;
    }
    if (data.types && typeof data.types === 'object') {
      dataTypesCount += Object.keys(data.types).length;
    }
    if (data.app_texts && typeof data.app_texts === 'object') {
      appTextsCount = Object.keys(data.app_texts).length;
    }

    return {
      pagesCount: pagesCount || 1,
      workflowsCount: workflowsCount || 0,
      elementsCount: elementsCount || 0,
      dataTypesCount: dataTypesCount || 0,
      appTextsCount: appTextsCount || 0
    };
  }

  /**
   * Generates a schema blueprint directly from Bubble Data API / Meta API (Schema fallback)
   */
  public static async generateBlueprintFromApi(
    project: ProjectProfile,
    onProgress?: (message: string) => void
  ): Promise<BubbleSyncResult> {
    if (!project.appId) {
      const err = 'Application ID is missing';
      toast.error(err);
      return { success: false, error: err };
    }

    onProgress?.(`Connecting to Bubble Meta API for "${project.appId}"...`);

    try {
      const schema = await DevOpsEngine.fetchSchema(project);
      let effectiveSchema = schema;
      if (!effectiveSchema || effectiveSchema.dataTypes.length === 0) {
        effectiveSchema = DevOpsEngine.getTemplateSchema(project);
      }

      const blueprintData = DevOpsEngine.synthesizeBubbleBlueprint(effectiveSchema, project);
      const fileName = `${project.appId}_api_generated.bubble`;

      if (project.id && project.id !== 'temp' && project.id !== 'test_app') {
        ProjectStore.getInstance().updateProject(project.id, {
          blueprintFileName: fileName,
          blueprintExportJson: blueprintData,
          lastActiveAt: new Date().toISOString()
        });
      }

      const stats = this.calculateBlueprintStats(blueprintData);
      return {
        success: true,
        fileName,
        data: blueprintData,
        stats
      };
    } catch (err: any) {
      const msg = err.message || 'Failed to generate blueprint from Bubble API';
      toast.error(msg);
      return { success: false, error: msg };
    }
  }

  /**
   * Checks the connectivity and health of the Cloud Sync microservice (Oracle / Self-hosted)
   */
  public static async checkCloudServerHealth(serverUrl: string): Promise<{ ok: boolean; version?: string; error?: string }> {
    if (!serverUrl) return { ok: false, error: 'No URL provided' };
    try {
      const cleanUrl = serverUrl.replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/health`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        return { ok: true, version: data.version };
      }
      return { ok: false, error: `HTTP ${res.status}` };
    } catch (e: any) {
      return { ok: false, error: e.message || 'Unreachable' };
    }
  }

  /**
   * Syncs application AST directly from the Cloud Sync microservice (Oracle Cloud / Buildprint mode)
   */
  public static async syncFromCloudServer(
    serverUrl: string,
    appId: string,
    branch: string = 'test',
    apiSecret?: string
  ): Promise<BubbleSyncResult> {
    if (!serverUrl || !appId) {
      toast.error('Cloud server URL and App ID are required.');
      return { success: false, error: 'Missing serverUrl or appId' };
    }

    const cleanUrl = serverUrl.replace(/\/+$/, '');
    const endpoint = `${cleanUrl}/v1/sync`;

    toast.info('Connecting to Cloud Sync Bot...');

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (apiSecret) {
        headers['Authorization'] = `Bearer ${apiSecret}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ appId: appId.trim(), branch: branch.trim() })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status ${response.status}`);
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Server did not return application data');
      }

      const stats = result.stats || this.calculateBlueprintStats(result.data);
      toast.success(`✨ Cloud Sync completed! (${stats.pagesCount} Pages, ${stats.workflowsCount} Workflows)`);

      const fileName = `${appId}-cloud-sync.bubble`;

      // Auto-save a local copy to Downloads folder if running in Electron
      if (typeof window !== 'undefined' && window.electronAPI?.bubbleSyncExportBlueprintToDisk) {
        try {
          const exportRes = await window.electronAPI.bubbleSyncExportBlueprintToDisk(fileName, result.data);
          if (exportRes.success) {
            toast.info(`💾 Saved local copy to Downloads: ${fileName}`);
          }
        } catch (e) {
          console.warn('Could not auto-save blueprint to disk:', e);
        }
      }

      return {
        success: true,
        fileName,
        data: result.data,
        stats
      };
    } catch (err: any) {
      const rawMsg = err.message || 'Failed to connect to Cloud Sync server';
      const sanitizedMsg = rawMsg.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?\b/g, 'Cloud Bot');
      toast.error(`Cloud Sync Failed: ${sanitizedMsg}`);
      return { success: false, error: sanitizedMsg };
    }
  }

  /**
   * Sync app file helper for backward compatibility
   */
  public static async syncAppFile(
    project: ProjectProfile,
    onProgress?: (message: string) => void
  ): Promise<BubbleSyncResult> {
    onProgress?.('Checking recent downloads or cloud exports...');
    const recent = await this.checkRecentDownloads(project.appId);
    if (recent.found && recent.content) {
      return {
        success: true,
        fileName: recent.fileName,
        data: recent.content,
        stats: recent.stats
      };
    }
    return {
      success: false,
      error: 'No export found. Please open Bubble in Chrome and click Sync or Export.'
    };
  }

  /**
   * Starts or stops automatic detection of newly exported .bubble files in the Downloads folder
   */
  public static async toggleDownloadsWatcher(
    enabled: boolean,
    onFileDetected?: (fileName: string, content: any, stats?: any) => void
  ): Promise<boolean> {
    if (typeof window === 'undefined' || !window.electronAPI?.bubbleSyncSetDownloadsWatcher) {
      return false;
    }

    const res = await window.electronAPI.bubbleSyncSetDownloadsWatcher(enabled);
    this.isWatcherActive = enabled;

    if (enabled && !this.watcherUnsubscribe && window.electronAPI.onBubbleFileDetected) {
      this.watcherUnsubscribe = window.electronAPI.onBubbleFileDetected((data: any) => {
        toast.success(`✨ Detected new Bubble app export: ${data.fileName}`);
        onFileDetected?.(data.fileName, data.content, data.stats);
      });
    } else if (!enabled && this.watcherUnsubscribe) {
      this.watcherUnsubscribe();
      this.watcherUnsubscribe = null;
    }

    return res;
  }

  public static isDownloadsWatcherActive(): boolean {
    return this.isWatcherActive;
  }
}
