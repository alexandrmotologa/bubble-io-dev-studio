export type ActivityType =
  | 'backup'
  | 'audit'
  | 'sync'
  | 'translation'
  | 'security'
  | 'migration'
  | 'export'
  | 'settings'
  | 'project'
  | 'system';

export interface ActivityEntry {
  id: string;
  timestamp: string; // ISO string
  type: ActivityType;
  title: string;
  message: string;
  module?: string;
  projectId?: string;
  metadata?: Record<string, any>;
}

const ACTIVITY_STORE_KEY = 'bubble_dev_studio_activity_log';
const MAX_ENTRIES = 500;

/**
 * Persistent activity log for tracking user actions and system events across sessions.
 * Stores entries in localStorage with subscriber pattern for real-time UI updates.
 */
export class ActivityStore {
  private static entries: ActivityEntry[] = [];
  private static isLoaded = false;
  private static listeners: Array<(entries: ActivityEntry[]) => void> = [];

  /**
   * Load entries from localStorage on first access
   */
  private static ensureLoaded(): void {
    if (this.isLoaded) return;
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(ACTIVITY_STORE_KEY);
        if (raw) {
          this.entries = JSON.parse(raw);
        }
      } catch (e) {
        console.warn('[ActivityStore] Failed to load activity log:', e);
      }
    }
    this.isLoaded = true;
  }

  /**
   * Persist entries to localStorage
   */
  private static persist(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(ACTIVITY_STORE_KEY, JSON.stringify(this.entries));
    } catch (e) {
      console.warn('[ActivityStore] Failed to persist activity log:', e);
    }
  }

  /**
   * Notify all subscribers of changes
   */
  private static notify(): void {
    for (const listener of this.listeners) {
      try {
        listener([...this.entries]);
      } catch (e) {
        console.error('[ActivityStore] Listener error:', e);
      }
    }
  }

  /**
   * Subscribe to activity log changes
   */
  public static subscribe(listener: (entries: ActivityEntry[]) => void): () => void {
    this.ensureLoaded();
    this.listeners.push(listener);
    listener([...this.entries]); // Initial notification
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Record a new activity entry
   */
  public static record(entry: Omit<ActivityEntry, 'id' | 'timestamp'> & { timestamp?: string }): ActivityEntry {
    this.ensureLoaded();
    const newEntry: ActivityEntry = {
      id: 'act_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
      timestamp: entry.timestamp || new Date().toISOString(),
      ...entry
    };

    this.entries.unshift(newEntry);

    // Auto-prune older entries past MAX_ENTRIES
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(0, MAX_ENTRIES);
    }

    this.persist();
    this.notify();
    return newEntry;
  }

  /**
   * Get all activities, optionally filtered by project or type
   */
  public static getActivities(filter?: { projectId?: string; type?: ActivityType; limit?: number }): ActivityEntry[] {
    this.ensureLoaded();
    let result = [...this.entries];

    if (filter?.projectId) {
      result = result.filter(e => !e.projectId || e.projectId === filter.projectId);
    }

    if (filter?.type) {
      result = result.filter(e => e.type === filter.type);
    }

    if (filter?.limit && filter.limit > 0) {
      result = result.slice(0, filter.limit);
    }

    return result;
  }

  /**
   * Clear all entries or entries for a specific project
   */
  public static clear(projectId?: string): void {
    this.ensureLoaded();
    if (projectId) {
      this.entries = this.entries.filter(e => e.projectId !== projectId);
    } else {
      this.entries = [];
    }
    this.persist();
    this.notify();
  }
}
