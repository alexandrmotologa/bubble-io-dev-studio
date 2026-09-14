export type NotificationType = 'success' | 'error' | 'warn' | 'info';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  timestamp: string; // ISO
  read: boolean;
  targetTab?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

const NOTIFICATION_STORAGE_KEY = 'bubble_dev_studio_notifications';
const MAX_NOTIFICATIONS = 200;

export class NotificationStore {
  private static items: NotificationItem[] = [];
  private static isLoaded = false;
  private static listeners: Array<(items: NotificationItem[]) => void> = [];

  private static ensureLoaded(): void {
    if (this.isLoaded) return;
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
        if (raw) {
          this.items = JSON.parse(raw);
        }
      } catch (e) {
        console.warn('[NotificationStore] Failed to load notifications:', e);
      }
    }
    this.isLoaded = true;
  }

  private static persist(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(this.items));
    } catch (e) {
      console.warn('[NotificationStore] Failed to persist notifications:', e);
    }
  }

  private static notify(): void {
    for (const listener of this.listeners) {
      try {
        listener([...this.items]);
      } catch (e) {
        console.error('[NotificationStore] Listener error:', e);
      }
    }
  }

  public static subscribe(listener: (items: NotificationItem[]) => void): () => void {
    this.ensureLoaded();
    this.listeners.push(listener);
    listener([...this.items]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public static add(
    item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'> & { id?: string; timestamp?: string }
  ): NotificationItem {
    this.ensureLoaded();

    const newItem: NotificationItem = {
      id: item.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: item.timestamp || new Date().toISOString(),
      read: false,
      ...item
    };

    // Prevent duplicate IDs (e.g. if updated from toast)
    const existingIndex = this.items.findIndex(n => n.id === newItem.id);
    if (existingIndex >= 0) {
      this.items[existingIndex] = { ...this.items[existingIndex], ...newItem };
    } else {
      this.items.unshift(newItem);
    }

    if (this.items.length > MAX_NOTIFICATIONS) {
      this.items = this.items.slice(0, MAX_NOTIFICATIONS);
    }

    this.persist();
    this.notify();
    return newItem;
  }

  public static getUnreadCount(): number {
    this.ensureLoaded();
    return this.items.filter(n => !n.read).length;
  }

  public static markAsRead(id: string): void {
    this.ensureLoaded();
    const item = this.items.find(n => n.id === id);
    if (item && !item.read) {
      item.read = true;
      this.persist();
      this.notify();
    }
  }

  public static markAllAsRead(): void {
    this.ensureLoaded();
    let hasChanges = false;
    for (const item of this.items) {
      if (!item.read) {
        item.read = true;
        hasChanges = true;
      }
    }
    if (hasChanges) {
      this.persist();
      this.notify();
    }
  }

  public static clearAll(): void {
    this.ensureLoaded();
    this.items = [];
    this.persist();
    this.notify();
  }

  public static delete(id: string): void {
    this.ensureLoaded();
    this.items = this.items.filter(n => n.id !== id);
    this.persist();
    this.notify();
  }
}
