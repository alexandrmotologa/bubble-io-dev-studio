import { GlobalSettings, ProjectProfile } from '../../types';
import { DevOpsEngine } from './devopsEngine';
import { IndexedDbStore } from '../storage/indexedDbStore';
import { ActivityStore } from '../activity/activityStore';
import { toast } from '../toast/toastManager';

export class AutoBackupScheduler {
  private static timerId: any = null;
  private static isRunning = false;

  private static getIntervalMs(interval?: 'disabled' | '6h' | '12h' | '24h'): number | null {
    switch (interval) {
      case '6h':
        return 6 * 60 * 60 * 1000;
      case '12h':
        return 12 * 60 * 60 * 1000;
      case '24h':
        return 24 * 60 * 60 * 1000;
      default:
        return null;
    }
  }

  private static getLastRunKey(projectId: string): string {
    return `bubble_dev_studio_autobackup_last_run_${projectId}`;
  }

  public static getLastRun(projectId: string): number | null {
    try {
      const val = localStorage.getItem(this.getLastRunKey(projectId));
      return val ? parseInt(val, 10) : null;
    } catch {
      return null;
    }
  }

  private static setLastRun(projectId: string, timestamp: number): void {
    try {
      localStorage.setItem(this.getLastRunKey(projectId), timestamp.toString());
    } catch (e) {
      console.warn('[AutoBackupScheduler] Failed to save last run timestamp:', e);
    }
  }

  /**
   * Enforces retention policy by removing oldest backups beyond the retention limit.
   */
  public static async pruneOldBackups(retentionLimit: number): Promise<number> {
    if (retentionLimit <= 0) return 0;
    try {
      const allBackups = await IndexedDbStore.getAllBackups();
      if (allBackups.length <= retentionLimit) return 0;

      // Sort oldest first
      const sorted = [...allBackups].sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeA - timeB;
      });

      const excessCount = sorted.length - retentionLimit;
      const toDelete = sorted.slice(0, excessCount);

      for (const backup of toDelete) {
        if (backup.backupId) {
          await IndexedDbStore.deleteBackup(backup.backupId);
        }
      }

      return excessCount;
    } catch (e) {
      console.warn('[AutoBackupScheduler] Error pruning backups:', e);
      return 0;
    }
  }

  /**
   * Evaluate whether an automatic backup should trigger for the active project.
   */
  public static async checkAndExecute(
    project?: ProjectProfile,
    settings?: GlobalSettings
  ): Promise<boolean> {
    if (!project || !settings) return false;
    if (this.isRunning) return false;

    const intervalMs = this.getIntervalMs(settings.autoBackupInterval);
    if (!intervalMs) return false;

    const lastRun = this.getLastRun(project.id);
    const now = Date.now();

    if (lastRun && now - lastRun < intervalMs) {
      return false; // Not due yet
    }

    this.isRunning = true;
    try {
      console.log(`[AutoBackupScheduler] Running scheduled backup for ${project.name} (${project.appId})...`);
      
      const result = await DevOpsEngine.runBackup(project);
      this.setLastRun(project.id, now);

      // Record activity
      ActivityStore.record({
        type: 'backup',
        title: 'Scheduled Auto-Backup Completed',
        message: `${result.backupId} • ${result.recordCount.toLocaleString()} records exported (${result.fileSizeKb} KB)`,
        projectId: project.id,
        metadata: { backupId: result.backupId, recordCount: result.recordCount }
      });

      // Show toast
      toast.success(
        'Auto-Backup Completed',
        `Automated scheduled snapshot ${result.backupId} saved (${result.recordCount.toLocaleString()} records).`,
        undefined,
        6000
      );

      // Enforce retention
      const retention = settings.autoBackupRetention || 10;
      await this.pruneOldBackups(retention);

      return true;
    } catch (e: any) {
      console.warn('[AutoBackupScheduler] Scheduled backup failed:', e);
      ActivityStore.record({
        type: 'backup',
        title: 'Scheduled Auto-Backup Failed',
        message: e?.message || 'Unknown error during scheduled backup',
        projectId: project.id
      });
      return false;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start the background ticker (checks every 60 seconds)
   */
  public static start(
    getActiveProject: () => ProjectProfile | undefined,
    getSettings: () => GlobalSettings
  ): () => void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }

    // Run first check after 5 seconds to avoid startup slowdown
    const initialTimer = setTimeout(() => {
      this.checkAndExecute(getActiveProject(), getSettings());
    }, 5000);

    // Run ongoing ticker every 60 seconds
    this.timerId = setInterval(() => {
      this.checkAndExecute(getActiveProject(), getSettings());
    }, 60000);

    return () => {
      clearTimeout(initialTimer);
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }
    };
  }
}
