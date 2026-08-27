export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warn' | 'info' | 'loading';
  title: string;
  message?: string;
  action?: ToastAction;
  duration?: number; // ms, 0 or undefined for default 5000ms, Infinity for sticky
  createdAt: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private static instance: ToastManager;
  private toasts: ToastItem[] = [];
  private listeners: ToastListener[] = [];

  private constructor() {}

  public static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  public subscribe(listener: ToastListener): () => void {
    this.listeners.push(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener([...this.toasts]);
      } catch (e) {
        console.error('Toast listener error:', e);
      }
    }
  }

  public show(options: Omit<ToastItem, 'id' | 'createdAt'> & { id?: string }): string {
    const id = options.id || `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastItem = {
      ...options,
      id,
      duration: options.duration !== undefined ? options.duration : (options.type === 'loading' ? Infinity : 5000),
      createdAt: Date.now()
    };

    // If toast with this id already exists, replace it (e.g. updating loading to success)
    const existingIdx = this.toasts.findIndex(t => t.id === id);
    if (existingIdx >= 0) {
      this.toasts[existingIdx] = newToast;
    } else {
      this.toasts = [newToast, ...this.toasts].slice(0, 5); // Keep max 5 toasts
    }

    this.notify();

    if (newToast.duration && newToast.duration !== Infinity) {
      setTimeout(() => {
        this.dismiss(id);
      }, newToast.duration);
    }

    return id;
  }

  public success(title: string, message?: string, action?: ToastAction, duration?: number): string {
    return this.show({ type: 'success', title, message, action, duration });
  }

  public error(title: string, message?: string, action?: ToastAction, duration?: number): string {
    return this.show({ type: 'error', title, message, action, duration: duration || 7000 });
  }

  public warn(title: string, message?: string, action?: ToastAction, duration?: number): string {
    return this.show({ type: 'warn', title, message, action, duration });
  }

  public info(title: string, message?: string, action?: ToastAction, duration?: number): string {
    return this.show({ type: 'info', title, message, action, duration });
  }

  public loading(title: string, message?: string, action?: ToastAction): string {
    return this.show({ type: 'loading', title, message, action, duration: Infinity });
  }

  public update(id: string, updates: Partial<Omit<ToastItem, 'id' | 'createdAt'>>): void {
    const idx = this.toasts.findIndex(t => t.id === id);
    if (idx >= 0) {
      const current = this.toasts[idx];
      const duration = updates.duration !== undefined ? updates.duration : (updates.type === 'loading' ? Infinity : 5000);
      this.toasts[idx] = {
        ...current,
        ...updates,
        duration
      };
      this.notify();

      if (duration && duration !== Infinity) {
        setTimeout(() => {
          this.dismiss(id);
        }, duration);
      }
    }
  }

  public dismiss(id: string): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }

  public clear(): void {
    this.toasts = [];
    this.notify();
  }
}

export const toast = ToastManager.getInstance();
