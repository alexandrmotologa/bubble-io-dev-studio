import { GlobalSettings, ProjectProfile } from '../../types';
import { IndexedDbStore } from './indexedDbStore';

const STORAGE_KEY = 'bubble_dev_studio_settings_v2';

const DEFAULT_SETTINGS: GlobalSettings = {
  theme: 'dark',
  defaultAiModel: 'gemini-2.0-flash',
  autoSaveReports: true,
  projects: [],
  activeProjectId: undefined
};

export class ProjectStore {
  private static instance: ProjectStore;
  private settings: GlobalSettings;
  private listeners: Array<(settings: GlobalSettings) => void> = [];
  private isHydrated: boolean = false;

  private constructor() {
    this.settings = this.load();
    // Kick off background hydration from IndexedDB
    this.hydrateAsync().catch(err => {
      console.warn('Initial blueprint hydration from IndexedDB failed:', err);
    });
  }

  public static getInstance(): ProjectStore {
    if (!ProjectStore.instance) {
      ProjectStore.instance = new ProjectStore();
    }
    return ProjectStore.instance;
  }

  public subscribe(listener: (settings: GlobalSettings) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.settings);
      } catch (e) {
        console.error('ProjectStore listener error:', e);
      }
    }
  }

  private load(): GlobalSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using defaults', e);
    }
    return DEFAULT_SETTINGS;
  }

  /**
   * Asynchronously hydrates all settings, profiles, and full blueprint ASTs from IndexedDB into memory
   */
  public async hydrateAsync(): Promise<GlobalSettings> {
    try {
      // 1. Hydrate full global settings from IndexedDB if available
      const dbSettings = await IndexedDbStore.getGlobalSettings();
      if (dbSettings && typeof dbSettings === 'object') {
        this.settings = {
          ...DEFAULT_SETTINGS,
          ...this.settings,
          ...dbSettings,
          projects: dbSettings.projects && dbSettings.projects.length > 0 
            ? dbSettings.projects 
            : this.settings.projects
        };
      }

      // 2. Hydrate heavy blueprint ASTs
      const blueprints = await IndexedDbStore.getAllBlueprints();
      let updated = false;

      for (const project of this.settings.projects) {
        if (!project.blueprintExportJson && blueprints[project.id]) {
          project.blueprintExportJson = blueprints[project.id];
          updated = true;
        }
      }

      this.isHydrated = true;
      this.notify();
    } catch (e) {
      console.warn('Could not hydrate settings and blueprints from IndexedDB:', e);
    }
    return this.settings;
  }

  public save(settings: GlobalSettings): void {
    this.settings = settings;

    // 1. Persist 100% full settings into IndexedDB (completely safe from 5MB quota)
    IndexedDbStore.setGlobalSettings(settings).catch(err => {
      console.warn('Failed to save settings in IndexedDB:', err);
    });

    // 2. Persist full blueprint JSONs into IndexedDB (supports 100s of MBs)
    for (const project of settings.projects) {
      if (project.blueprintExportJson) {
        IndexedDbStore.setBlueprint(project.id, project.blueprintExportJson).catch(err => {
          console.warn(`Failed to save blueprint in IndexedDB for project ${project.id}:`, err);
        });
      }
    }

    // 3. Prepare lightweight settings for localStorage as immediate synchronous cache
    const safeSettings: GlobalSettings = {
      ...settings,
      projects: settings.projects.map(p => {
        // Strip heavy blueprintExportJson from localStorage to stay well below 5MB browser quota
        const { blueprintExportJson, ...lightweightProfile } = p;
        return lightweightProfile;
      })
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeSettings));
    } catch (e) {
      console.warn('Could not save lightweight settings to localStorage, attempting minimal save', e);
      try {
        // Fallback minimal save
        const minimalSettings = {
          ...safeSettings,
          projects: safeSettings.projects.map(p => ({
            id: p.id,
            name: p.name,
            appId: p.appId,
            environment: p.environment,
            apiToken: p.apiToken,
            blueprintFileName: p.blueprintFileName,
            aiProvider: p.aiProvider,
            aiModel: p.aiModel
          }))
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalSettings));
      } catch (err2) {
        console.error('Fatal localStorage quota error:', err2);
      }
    }

    this.notify();
  }

  public getSettings(): GlobalSettings {
    return this.settings;
  }

  public updateSettings(partial: Partial<GlobalSettings>): void {
    this.save({
      ...this.settings,
      ...partial
    });
  }

  public getActiveProject(): ProjectProfile | undefined {
    if (this.settings.projects.length === 0) return undefined;
    return this.settings.projects.find(p => p.id === this.settings.activeProjectId) || this.settings.projects[0];
  }

  public setActiveProject(id: string): void {
    this.settings.activeProjectId = id;
    const project = this.settings.projects.find(p => p.id === id);
    if (project) {
      project.lastActiveAt = new Date().toISOString();
    }
    this.save(this.settings);
  }

  public addProject(project: Omit<ProjectProfile, 'id' | 'createdAt'>): ProjectProfile {
    const newProject: ProjectProfile = {
      ...project,
      id: 'proj_' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };
    this.settings.projects.push(newProject);
    this.settings.activeProjectId = newProject.id;
    this.save(this.settings);
    return newProject;
  }

  public updateProject(id: string, updates: Partial<ProjectProfile>): void {
    const idx = this.settings.projects.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.settings.projects[idx] = { ...this.settings.projects[idx], ...updates };
      this.save(this.settings);
    }
  }

  public deleteProject(id: string): void {
    this.settings.projects = this.settings.projects.filter(p => p.id !== id);
    if (this.settings.activeProjectId === id) {
      this.settings.activeProjectId = this.settings.projects[0]?.id;
    }
    IndexedDbStore.deleteBlueprint(id).catch(err => {
      console.warn(`Failed to delete blueprint from IndexedDB for project ${id}:`, err);
    });
    this.save(this.settings);
  }
}
