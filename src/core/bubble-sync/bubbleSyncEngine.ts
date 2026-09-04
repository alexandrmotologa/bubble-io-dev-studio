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
    toast.info('Please use the Bubble Dev Studio Companion Chrome extension for seamless authentication.');
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
   * Opens the unpacked Chrome Companion Extension folder in Windows Explorer / Finder
   * so the user can click "Load unpacked" in chrome://extensions.
   */
  public static async openCompanionFolder(): Promise<boolean> {
    if (typeof window !== 'undefined' && (window.electronAPI as any)?.companionOpenFolder) {
      const res = await (window.electronAPI as any).companionOpenFolder();
      if (res.success) {
        toast.info('Opened Companion Extension folder in File Explorer.');
        return true;
      } else {
        toast.error('Could not open extension folder: ' + res.error);
        return false;
      }
    }
    toast.error('Companion installation is supported in Desktop App.');
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

    toast.info('Opened Bubble in your browser. Use the Companion extension or click "Export" under Settings > General.');
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
   * Sync app file helper for backward compatibility
   */
  public static async syncAppFile(
    project: ProjectProfile,
    onProgress?: (message: string) => void
  ): Promise<BubbleSyncResult> {
    onProgress?.('Syncing via Bubble Companion or Downloads folder...');
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
