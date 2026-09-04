import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  platform: string;
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
  sendToMain: (channel: string, data: any) => void;
  receiveFromMain: (channel: string, func: (...args: any[]) => void) => () => void;
  openExternal: (url: string) => Promise<void>;
  fetchHttp: (url: string, headers?: Record<string, string>) => Promise<{ ok: boolean; status?: number; data?: any; error?: string }>;
  secureEncrypt: (plainText: string) => Promise<string>;
  secureDecrypt: (cipherText: string) => Promise<string>;
  isEncryptionAvailable: () => Promise<boolean>;
  capturePage: (url: string, width: number, height: number, headers?: Record<string, string>) => Promise<{ success: boolean; dataUrl?: string; error?: string; width?: number; height?: number }>;
  checkForUpdates: () => Promise<any>;
  downloadUpdate: () => Promise<{ success: boolean; error?: string }>;
  installUpdate: () => Promise<void>;
  getAppInfo: () => Promise<{ currentVersion: string; isPackaged: boolean; platform: string }>;
  bubbleSyncLogin: () => Promise<{ isAuthenticated: boolean; userEmail?: string }>;
  bubbleSyncLogout: () => Promise<boolean>;
  bubbleSyncCheckAuth: () => Promise<{ isAuthenticated: boolean; userEmail?: string }>;
  bubbleSyncFetchApp: (appId: string) => Promise<{ success: boolean; fileName?: string; filePath?: string; data?: any; error?: string }>;
  bubbleSyncSetDownloadsWatcher: (enabled: boolean) => Promise<boolean>;
  bubbleSyncShowInFolder: (filePath: string) => Promise<boolean>;
  bubbleSyncExportBlueprintToDisk: (fileName: string, data: any) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  companionOpenFolder: () => Promise<{ success: boolean; path?: string; error?: string }>;
  bubbleSyncCheckRecentDownloads: (appId?: string) => Promise<{
    found: boolean;
    fileName?: string;
    filePath?: string;
    sizeBytes?: number;
    mtime?: number;
    content?: any;
    stats?: {
      pagesCount: number;
      workflowsCount: number;
      elementsCount: number;
      dataTypesCount: number;
      appTextsCount: number;
    };
    error?: string;
  }>;
  onBubbleFileDetected: (callback: (data: { fileName: string; content: any; stats?: any }) => void) => () => void;
  onBrowserAppReceived: (callback: (data: { data: any; originUrl?: string; stats?: any }) => void) => () => void;
}

const api: ElectronAPI = {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  sendToMain: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  receiveFromMain: (channel, func) => {
    const subscription = (_event: any, ...args: any[]) => func(...args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
  openExternal: async (url: string) => {
    return ipcRenderer.invoke('shell:open-external', url);
  },
  fetchHttp: async (url: string, headers?: Record<string, string>) => {
    return ipcRenderer.invoke('http:fetch', url, headers);
  },
  secureEncrypt: async (plainText: string) => {
    return ipcRenderer.invoke('secure:encrypt', plainText);
  },
  secureDecrypt: async (cipherText: string) => {
    return ipcRenderer.invoke('secure:decrypt', cipherText);
  },
  isEncryptionAvailable: async () => {
    return ipcRenderer.invoke('secure:is-available');
  },
  capturePage: async (url: string, width: number, height: number, headers?: Record<string, string>) => {
    return ipcRenderer.invoke('visual:capture-page', url, width, height, headers);
  },
  checkForUpdates: async () => {
    return ipcRenderer.invoke('updater:check');
  },
  downloadUpdate: async () => {
    return ipcRenderer.invoke('updater:download');
  },
  installUpdate: async () => {
    return ipcRenderer.invoke('updater:install');
  },
  getAppInfo: async () => {
    return ipcRenderer.invoke('updater:get-info');
  },
  bubbleSyncLogin: async () => {
    return ipcRenderer.invoke('bubbleSync:login');
  },
  bubbleSyncLogout: async () => {
    return ipcRenderer.invoke('bubbleSync:logout');
  },
  bubbleSyncCheckAuth: async () => {
    return ipcRenderer.invoke('bubbleSync:checkAuth');
  },
  bubbleSyncFetchApp: async (appId: string) => {
    return ipcRenderer.invoke('bubbleSync:fetchApp', appId);
  },
  bubbleSyncSetDownloadsWatcher: async (enabled: boolean) => {
    return ipcRenderer.invoke('bubbleSync:setDownloadsWatcher', enabled);
  },
  bubbleSyncShowInFolder: async (filePath: string) => {
    return ipcRenderer.invoke('bubbleSync:showInFolder', filePath);
  },
  bubbleSyncExportBlueprintToDisk: async (fileName: string, data: any) => {
    return ipcRenderer.invoke('bubbleSync:exportBlueprintToDisk', { fileName, data });
  },
  companionOpenFolder: async () => {
    return ipcRenderer.invoke('companion:openFolder');
  },
  bubbleSyncCheckRecentDownloads: async (appId?: string) => {
    return ipcRenderer.invoke('bubbleSync:checkRecentDownloads', appId);
  },
  onBubbleFileDetected: (callback: (data: { fileName: string; content: any; stats?: any }) => void) => {
    const subscription = (_event: any, data: any) => callback(data);
    ipcRenderer.on('bubbleSync:fileDetected', subscription);
    return () => {
      ipcRenderer.removeListener('bubbleSync:fileDetected', subscription);
    };
  },
  onBrowserAppReceived: (callback: (data: { data: any; originUrl?: string; stats?: any }) => void) => {
    const subscription = (_event: any, data: any) => callback(data);
    ipcRenderer.on('bubbleSync:browserAppReceived', subscription);
    return () => {
      ipcRenderer.removeListener('bubbleSync:browserAppReceived', subscription);
    };
  }
};

contextBridge.exposeInMainWorld('electronAPI', api);

