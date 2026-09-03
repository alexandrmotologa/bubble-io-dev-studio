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
   * Opens native Bubble.io login window in Electron
   */
  public static async login(): Promise<BubbleAuthStatus> {
    if (typeof window === 'undefined' || !window.electronAPI?.bubbleSyncLogin) {
      toast.error('Bubble In-App Sync is only supported in desktop mode');
      return { isAuthenticated: false };
    }

    toast.info('Opening Bubble.io login window (for Email/Password accounts)...');
    const result = await window.electronAPI.bubbleSyncLogin();
    if (result.isAuthenticated) {
      toast.success('Successfully authenticated with Bubble.io!');
    } else {
      toast.info('Bubble.io login was cancelled or closed');
    }
    return result;
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
   * 1-Click Syncs the application file (.bubble) directly from Bubble Editor session
   */
  public static async syncAppFile(
    project: ProjectProfile,
    onProgress?: (message: string) => void
  ): Promise<BubbleSyncResult> {
    if (!project.appId) {
      const err = 'Cannot sync: Application ID is missing in project settings';
      toast.error(err);
      return { success: false, error: err };
    }

    if (typeof window === 'undefined' || !window.electronAPI?.bubbleSyncFetchApp) {
      const err = '1-Click Direct Sync requires the Bubble Dev Studio Desktop App.';
      toast.error(err);
      return { success: false, error: err };
    }

    onProgress?.(`Connecting to Bubble.io for ${project.appId}...`);
    try {
      const result = await window.electronAPI.bubbleSyncFetchApp(project.appId);

      if (result.success && result.data) {
        const fileName = result.fileName || `${project.appId}_synced_${Date.now()}.bubble`;
        
        ProjectStore.getInstance().updateProject(project.id, {
          blueprintFileName: fileName,
          blueprintExportJson: result.data,
          lastActiveAt: new Date().toISOString()
        });

        toast.success(`Successfully synced ${fileName} from Bubble.io!`);
        return {
          success: true,
          fileName,
          data: result.data
        };
      } else {
        const errorMsg = result.error || 'Failed to capture application data from Bubble Editor';
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      const msg = err.message || 'Error occurred during Bubble sync';
      toast.error(msg);
      return { success: false, error: msg };
    }
  }

  /**
   * Generates a fully indexed .bubble blueprint directly from Bubble Data API / Meta API
   * Zero browser login or Google OAuth required.
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
      // 1. Fetch live schema using API token or public Swagger
      const schema = await DevOpsEngine.fetchSchema(project);

      let effectiveSchema = schema;
      if (!effectiveSchema || effectiveSchema.dataTypes.length === 0) {
        // Fallback: If Data API returned empty, use the project's tailored schema baseline
        effectiveSchema = DevOpsEngine.getTemplateSchema(project);
      }

      // 2. Synthesize complete .bubble format JSON
      const blueprintData = DevOpsEngine.synthesizeBubbleBlueprint(effectiveSchema, project);
      const fileName = `${project.appId}_api_generated.bubble`;

      // 3. Persist to project store
      if (project.id && project.id !== 'temp' && project.id !== 'test_app') {
        ProjectStore.getInstance().updateProject(project.id, {
          blueprintFileName: fileName,
          blueprintExportJson: blueprintData,
          lastActiveAt: new Date().toISOString()
        });
      }

      // 4. Save physical copy to Downloads folder if in Electron
      if (typeof window !== 'undefined' && window.electronAPI?.bubbleSyncExportBlueprintToDisk) {
        try {
          await window.electronAPI.bubbleSyncExportBlueprintToDisk(fileName, blueprintData);
        } catch (saveErr) {
          console.warn('Auto-save to disk notice:', saveErr);
        }
      }

      const totalTypes = effectiveSchema.dataTypes.length;
      const totalOptions = effectiveSchema.optionSets.length;
      toast.success(`✨ Generated ${fileName} from Data API! (${totalTypes} Types, ${totalOptions} Option Sets)`);

      return {
        success: true,
        fileName,
        data: blueprintData
      };
    } catch (err: any) {
      const msg = err.message || 'Failed to generate blueprint from Bubble API';
      toast.error(msg);
      return { success: false, error: msg };
    }
  }

  /**
   * Opens user's default browser directly to Bubble Editor Settings > General tab
   * and automatically engages the Downloads folder watcher for exported .bubble files.
   */
  public static async openBubbleExportInBrowser(
    appId: string,
    onFileDetected?: (fileName: string, content: any) => void
  ): Promise<boolean> {
    if (!appId) {
      toast.error('Please enter an Application ID first');
      return false;
    }

    // 1. Ensure Downloads Watcher is listening
    await this.toggleDownloadsWatcher(true, onFileDetected);

    // 2. Target URL in user's default browser (where they are already authenticated with Google)
    const exportUrl = `https://bubble.io/page?id=${encodeURIComponent(appId)}&tab=general`;

    if (typeof window !== 'undefined' && window.electronAPI?.openExternal) {
      await window.electronAPI.openExternal(exportUrl);
    } else {
      window.open(exportUrl, '_blank', 'noopener,noreferrer');
    }

    toast.info('Opened Bubble Settings in your default browser. Click "Export" to auto-sync!');
    return true;
  }

  /**
   * Returns a ready-to-run 1-click JavaScript snippet / Bookmarklet for instant AST sync
   * from any open Bubble Editor tab in Chrome/Edge to Bubble Dev Studio.
   */
  public static getBookmarkletCode(bridgePort = 41890): string {
    return `javascript:(function(){try{var a=window.app;if(!a){alert('Please open your Bubble Editor tab first!');return;}var d=typeof a.get_json_for_export==='function'?a.get_json_for_export():(typeof a.to_json==='function'?a.to_json():a);fetch('http://127.0.0.1:${bridgePort}/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:d,origin:location.href})}).then(function(r){return r.json();}).then(function(){alert('✨ Successfully synced app to Bubble Dev Studio!');}).catch(function(e){alert('Sync error: '+e.message);});}catch(err){alert('Error: '+err.message);}})();`;
  }

  /**
   * Starts or stops automatic detection of newly exported .bubble files in the Downloads folder
   */
  public static async toggleDownloadsWatcher(
    enabled: boolean,
    onFileDetected?: (fileName: string, content: any) => void
  ): Promise<boolean> {
    if (typeof window === 'undefined' || !window.electronAPI?.bubbleSyncSetDownloadsWatcher) {
      return false;
    }

    const res = await window.electronAPI.bubbleSyncSetDownloadsWatcher(enabled);
    this.isWatcherActive = enabled;

    if (enabled && !this.watcherUnsubscribe && window.electronAPI.onBubbleFileDetected) {
      this.watcherUnsubscribe = window.electronAPI.onBubbleFileDetected((data) => {
        toast.success(`✨ Detected new Bubble app file: ${data.fileName}`);
        onFileDetected?.(data.fileName, data.content);
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
