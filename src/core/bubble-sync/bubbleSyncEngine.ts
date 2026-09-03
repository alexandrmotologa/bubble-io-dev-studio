import { ProjectProfile } from '../../types';
import { toast } from '../toast/toastManager';
import { ProjectStore } from '../storage/projectStore';

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

    toast.info('Opening secure Bubble.io login window...');
    const result = await window.electronAPI.bubbleSyncLogin();
    if (result.isAuthenticated) {
      toast.success('Successfully authenticated with Bubble.io!');
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
   * 1-Click Syncs the application file (.bubble) directly from Bubble Editor
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
      // In web browser preview mode fallback:
      const err = '1-Click Direct Sync requires the Bubble Dev Studio Desktop App.';
      toast.error(err);
      return { success: false, error: err };
    }

    onProgress?.(`Connecting to Bubble.io for ${project.appId}...`);
    try {
      const result = await window.electronAPI.bubbleSyncFetchApp(project.appId);

      if (result.success && result.data) {
        const fileName = result.fileName || `${project.appId}_synced_${Date.now()}.bubble`;
        
        // Update project with newly retrieved app data
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
