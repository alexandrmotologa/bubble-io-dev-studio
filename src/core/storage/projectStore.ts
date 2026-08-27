import { GlobalSettings, ProjectProfile } from '../../types';

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

  private constructor() {
    this.settings = this.load();
  }

  public static getInstance(): ProjectStore {
    if (!ProjectStore.instance) {
      ProjectStore.instance = new ProjectStore();
    }
    return ProjectStore.instance;
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

  public save(settings: GlobalSettings): void {
    this.settings = settings;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }

  public getSettings(): GlobalSettings {
    return this.settings;
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
    this.save(this.settings);
  }
}
