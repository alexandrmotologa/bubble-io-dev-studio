/**
 * Native Promise-based IndexedDB storage for Bubble Dev Studio
 * Handles large blueprints (.bubble files), translations cache, backups, and visual test baselines.
 * Completely eliminates browser localStorage 5MB quota limits.
 */

const DB_NAME = 'BubbleDevStudioDB';
const DB_VERSION = 3;

export const DB_STORES = {
  SETTINGS: 'settings',
  BLUEPRINTS: 'blueprints',
  TRANSLATIONS: 'translations',
  BACKUPS: 'backups',
  VISUAL_BASELINES: 'visual_baselines'
} as const;

export type DbStoreName = typeof DB_STORES[keyof typeof DB_STORES];

export class IndexedDbStore {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  private static getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB is not supported in this environment.'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 0. Settings & Project Profiles Store
        if (!db.objectStoreNames.contains(DB_STORES.SETTINGS)) {
          db.createObjectStore(DB_STORES.SETTINGS, { keyPath: 'key' });
        }

        // 1. Blueprints Store
        if (!db.objectStoreNames.contains(DB_STORES.BLUEPRINTS)) {
          db.createObjectStore(DB_STORES.BLUEPRINTS, { keyPath: 'projectId' });
        }

        // 2. Translations Memory & Cache Store
        if (!db.objectStoreNames.contains(DB_STORES.TRANSLATIONS)) {
          db.createObjectStore(DB_STORES.TRANSLATIONS, { keyPath: 'key' });
        }

        // 3. Database Backups Store
        if (!db.objectStoreNames.contains(DB_STORES.BACKUPS)) {
          db.createObjectStore(DB_STORES.BACKUPS, { keyPath: 'backupId' });
        }

        // 4. Visual Test Baselines & Screenshots Store
        if (!db.objectStoreNames.contains(DB_STORES.VISUAL_BASELINES)) {
          db.createObjectStore(DB_STORES.VISUAL_BASELINES, { keyPath: 'caseId' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /* =========================================================================
   * 1. Blueprints (.bubble files & ASTs)
   * ========================================================================= */
  public static async setBlueprint(projectId: string, blueprintJson: any): Promise<void> {
    if (!projectId || !blueprintJson) return;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORES.BLUEPRINTS, 'readwrite');
        const store = tx.objectStore(DB_STORES.BLUEPRINTS);
        const req = store.put({ projectId, blueprintJson, updatedAt: Date.now() });

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB setBlueprint failed:', e);
    }
  }

  public static async getBlueprint(projectId: string): Promise<any | null> {
    if (!projectId) return null;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORES.BLUEPRINTS, 'readonly');
        const store = tx.objectStore(DB_STORES.BLUEPRINTS);
        const req = store.get(projectId);

        req.onsuccess = () => resolve(req.result ? req.result.blueprintJson : null);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB getBlueprint failed:', e);
      return null;
    }
  }

  public static async deleteBlueprint(projectId: string): Promise<void> {
    if (!projectId) return;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORES.BLUEPRINTS, 'readwrite');
        const store = tx.objectStore(DB_STORES.BLUEPRINTS);
        const req = store.delete(projectId);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB deleteBlueprint failed:', e);
    }
  }

  public static async getAllBlueprints(): Promise<Record<string, any>> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORES.BLUEPRINTS, 'readonly');
        const store = tx.objectStore(DB_STORES.BLUEPRINTS);
        const req = store.getAll();

        req.onsuccess = () => {
          const map: Record<string, any> = {};
          if (Array.isArray(req.result)) {
            for (const item of req.result) {
              if (item.projectId && item.blueprintJson) {
                map[item.projectId] = item.blueprintJson;
              }
            }
          }
          resolve(map);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB getAllBlueprints failed:', e);
      return {};
    }
  }

  /* =========================================================================
   * 2. Translation Memory & Glossaries
   * ========================================================================= */
  public static async setTranslationCache(cache: Record<string, string>): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORES.TRANSLATIONS, 'readwrite');
        const store = tx.objectStore(DB_STORES.TRANSLATIONS);
        const req = store.put({ key: 'translation_memory_cache', data: cache, updatedAt: Date.now() });

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB setTranslationCache failed:', e);
    }
  }

  public static async getTranslationCache(): Promise<Record<string, string> | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORES.TRANSLATIONS, 'readonly');
        const store = tx.objectStore(DB_STORES.TRANSLATIONS);
        const req = store.get('translation_memory_cache');

        req.onsuccess = () => resolve(req.result ? req.result.data : null);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB getTranslationCache failed:', e);
      return null;
    }
  }

  public static async setGlossary(glossary: Record<string, string>): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORES.TRANSLATIONS, 'readwrite');
        const store = tx.objectStore(DB_STORES.TRANSLATIONS);
        const req = store.put({ key: 'translation_glossary', data: glossary, updatedAt: Date.now() });

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB setGlossary failed:', e);
    }
  }

  public static async getGlossary(): Promise<Record<string, string> | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORES.TRANSLATIONS, 'readonly');
        const store = tx.objectStore(DB_STORES.TRANSLATIONS);
        const req = store.get('translation_glossary');

        req.onsuccess = () => resolve(req.result ? req.result.data : null);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB getGlossary failed:', e);
      return null;
    }
  }

  /* =========================================================================
   * 3. Database Backups
   * ========================================================================= */
  public static async saveBackup(backup: { backupId: string; timestamp: string; data: any; recordCount: number }): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORES.BACKUPS, 'readwrite');
        const store = tx.objectStore(DB_STORES.BACKUPS);
        const req = store.put(backup);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB saveBackup failed:', e);
    }
  }

  public static async getAllBackups(): Promise<any[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORES.BACKUPS, 'readonly');
        const store = tx.objectStore(DB_STORES.BACKUPS);
        const req = store.getAll();

        req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB getAllBackups failed:', e);
      return [];
    }
  }

  /* =========================================================================
   * 4. Global Settings & Project Profiles
   * ========================================================================= */
  public static async setGlobalSettings(settings: any): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORES.SETTINGS, 'readwrite');
        const store = tx.objectStore(DB_STORES.SETTINGS);
        const req = store.put({ key: 'global_settings', settings, updatedAt: Date.now() });

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB setGlobalSettings failed:', e);
    }
  }

  public static async getGlobalSettings(): Promise<any | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORES.SETTINGS, 'readonly');
        const store = tx.objectStore(DB_STORES.SETTINGS);
        const req = store.get('global_settings');

        req.onsuccess = () => resolve(req.result ? req.result.settings : null);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB getGlobalSettings failed:', e);
      return null;
    }
  }
}
