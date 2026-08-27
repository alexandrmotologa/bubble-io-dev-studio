/**
 * Native Promise-based IndexedDB storage for large Bubble application blueprints (.bubble files > 5MB)
 * Prevents browser localStorage QuotaExceededError when storing large application ASTs.
 */

const DB_NAME = 'BubbleDevStudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'blueprints';

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
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'projectId' });
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

  /**
   * Saves a large blueprint object for a project ID
   */
  public static async setBlueprint(projectId: string, blueprintJson: any): Promise<void> {
    if (!projectId || !blueprintJson) return;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put({ projectId, blueprintJson, updatedAt: Date.now() });

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB setBlueprint failed:', e);
    }
  }

  /**
   * Retrieves the blueprint object for a project ID
   */
  public static async getBlueprint(projectId: string): Promise<any | null> {
    if (!projectId) return null;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(projectId);

        req.onsuccess = () => {
          resolve(req.result ? req.result.blueprintJson : null);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB getBlueprint failed:', e);
      return null;
    }
  }

  /**
   * Deletes a blueprint from IndexedDB
   */
  public static async deleteBlueprint(projectId: string): Promise<void> {
    if (!projectId) return;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(projectId);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB deleteBlueprint failed:', e);
    }
  }

  /**
   * Retrieves all stored blueprints as a map of projectId -> blueprintJson
   */
  public static async getAllBlueprints(): Promise<Record<string, any>> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
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
}
