import { app, BrowserWindow, ipcMain, shell, Menu, MenuItemConstructorOptions, dialog, clipboard, safeStorage, session } from 'electron';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { autoUpdater } from 'electron-updater';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createAppMenu() {
  const isMac = process.platform === 'darwin';

  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project...',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu:new-project');
            }
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'MTLG Labs (mtlglabs.space)',
          click: async () => {
            await shell.openExternal('https://mtlglabs.space');
          }
        },
        {
          label: 'Author Portfolio (mtlg.site)',
          click: async () => {
            await shell.openExternal('https://mtlg.site');
          }
        },
        {
          label: 'Author GitHub (@alexandrmotologa)',
          click: async () => {
            await shell.openExternal('https://github.com/alexandrmotologa');
          }
        },
        { type: 'separator' },
        {
          label: 'GitHub Repository',
          click: async () => {
            await shell.openExternal('https://github.com/alexandrmotologa/bubble-io-dev-studio');
          }
        },
        {
          label: 'Documentation & Guides',
          click: async () => {
            await shell.openExternal('https://github.com/alexandrmotologa/bubble-io-dev-studio#readme');
          }
        },
        {
          label: 'Check for Updates...',
          click: async () => {
            if (mainWindow) {
              if (isDev) {
                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: 'Development Mode',
                  message: 'Update Check Skipped in Dev Mode',
                  detail: `Current App Version: v${app.getVersion()}\nRunning in development environment with local Vite server. In production release builds, this automatically checks GitHub releases for new packages.`,
                  buttons: ['OK']
                });
                return;
              }
              try {
                mainWindow.webContents.send('updater:status', { status: 'checking' });
                await autoUpdater.checkForUpdates();
              } catch (e: any) {
                dialog.showMessageBox(mainWindow, {
                  type: 'error',
                  title: 'Update Check Failed',
                  message: 'Could not check for updates',
                  detail: e.message || 'Please verify your network connection or GitHub repository availability.',
                  buttons: ['OK']
                });
              }
            }
          }
        },
        { type: 'separator' },
        {
          label: 'About Bubble.io Dev Studio',
          click: () => {
            if (mainWindow) {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'About Bubble.io Dev Studio',
                message: `Bubble.io Dev Studio v${app.getVersion()} (Production Stable)`,
                detail: `All-in-one Developer Studio & GUI for Bubble.io (DevOps, Schema, Dead Code Audit, AI Translation, Visual QA)\n\nAuthor: Alexandr Motologa | MTLG Labs\nStudio: https://mtlglabs.space\nPersonal Hub: https://mtlg.site\nGitHub: https://github.com/alexandrmotologa`,
                buttons: ['OK']
              });
            }
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    title: 'Bubble.io Dev Studio',
    icon: process.platform === 'win32'
      ? path.join(__dirname, '../build/icon.ico')
      : path.join(__dirname, '../build/icon.png'),
    backgroundColor: '#080b11',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  createAppMenu();

  if (isDev) {
    const devPort = process.env.PORT || '5180';
    mainWindow.loadURL(`http://127.0.0.1:${devPort}`);
    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
      console.warn(`[Electron] Failed to load ${validatedURL}: [${errorCode}] ${errorDescription}, falling back to built dist...`);
      const distIndex = path.join(__dirname, '../dist/index.html');
      if (fs.existsSync(distIndex)) {
        mainWindow?.loadFile(distIndex);
      }
    });
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[Renderer L${level}] ${message} (${sourceId}:${line})`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Initialize in-app auto-update notifications and listeners
  initAutoUpdater();

  if (!isDev) {
    const updateConfigPath = path.join(process.resourcesPath, 'app-update.yml');
    if (fs.existsSync(updateConfigPath)) {
      setTimeout(() => {
        autoUpdater.checkForUpdates().catch((err: any) => {
          console.warn('Silent auto-update check on startup failed:', err?.message || err);
        });
      }, 10000);
    }
  }

  // Handle external links opening in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:') || url.startsWith('mailto:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();
  startLocalBridgeServer();
  initDownloadsWatcher(true);
  try {
    extractCompanionExtension();
  } catch (e) {
    console.warn('[Companion] Pre-extraction error:', e);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('shell:open-external', async (_event, url: string) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('mailto:'))) {
    await shell.openExternal(url);
  }
});

ipcMain.handle('http:fetch', async (_event, url: string, headers?: Record<string, string>) => {
  try {
    const res = await fetch(url, { method: 'GET', headers: headers || {} });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
});

// Issue #4 Fix: Native safeStorage encryption for API tokens & credentials
ipcMain.handle('secure:encrypt', async (_event, plainText: string) => {
  if (!plainText || typeof plainText !== 'string') return '';
  try {
    if (safeStorage && safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(plainText);
      return `enc:${encrypted.toString('base64')}`;
    }
  } catch (e) {
    console.warn('safeStorage encryption warning:', e);
  }
  return plainText;
});

ipcMain.handle('secure:decrypt', async (_event, cipherText: string) => {
  if (!cipherText || typeof cipherText !== 'string') return '';
  if (cipherText.startsWith('enc:') && safeStorage && safeStorage.isEncryptionAvailable()) {
    try {
      const buffer = Buffer.from(cipherText.slice(4), 'base64');
      return safeStorage.decryptString(buffer);
    } catch (e) {
      console.warn('safeStorage decryption warning:', e);
      return cipherText;
    }
  }
  return cipherText;
});

ipcMain.handle('secure:is-available', async () => {
  return safeStorage ? safeStorage.isEncryptionAvailable() : false;
});

// Issue #3 Fix: Real headless page screenshot capture for Bubble visual testing
ipcMain.handle('visual:capture-page', async (_event, targetUrl: string, width: number, height: number, customHeaders?: Record<string, string>) => {
  let captureWin: BrowserWindow | null = null;
  const targetW = Math.max(320, width || 1920);
  const targetH = Math.max(240, height || 1080);

  try {
    captureWin = new BrowserWindow({
      width: targetW,
      height: targetH,
      show: false,
      useContentSize: true,
      webPreferences: {
        offscreen: true,
        sandbox: true,
        webSecurity: false
      }
    });

    if (customHeaders && Object.keys(customHeaders).length > 0) {
      captureWin.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
        callback({ requestHeaders: { ...details.requestHeaders, ...customHeaders } });
      });
    }

    await captureWin.loadURL(targetUrl);
    // Allow dynamic UI, fonts, and client workflows 1200ms to paint
    await new Promise(r => setTimeout(r, 1200));

    const image = await captureWin.webContents.capturePage({ x: 0, y: 0, width: targetW, height: targetH });
    const dataUrl = image.toDataURL();
    return { success: true, dataUrl, width: targetW, height: targetH };
  } catch (err: any) {
    return { success: false, error: err.message || 'Page capture failed' };
  } finally {
    if (captureWin) {
      captureWin.destroy();
      captureWin = null;
    }
  }
});

// Community Feature #1: Native In-App Auto-Updater
function sendUpdaterStatus(statusData: any) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater:status', statusData);
  }
}

function initAutoUpdater() {
  autoUpdater.logger = console;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    sendUpdaterStatus({ status: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    sendUpdaterStatus({
      status: 'available',
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
    });
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('toast:show', {
        type: 'info',
        title: 'New Update Available',
        message: `Bubble.io Dev Studio v${info.version} is available. Downloading update in background...`
      });
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    sendUpdaterStatus({
      status: 'not-available',
      version: info?.version || app.getVersion()
    });
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('toast:show', {
        type: 'success',
        title: 'Up to Date',
        message: `Bubble.io Dev Studio v${app.getVersion()} is currently the latest version.`
      });
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    sendUpdaterStatus({
      status: 'downloading',
      percent: Math.round(progressObj.percent),
      transferred: progressObj.transferred,
      total: progressObj.total,
      bytesPerSecond: progressObj.bytesPerSecond
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendUpdaterStatus({
      status: 'downloaded',
      version: info.version
    });
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('toast:show', {
        type: 'success',
        title: 'Update Ready to Install',
        message: `Version v${info.version} has been downloaded. Restart the application to apply.`
      });
    }
  });

  autoUpdater.on('error', (err) => {
    const errorMsg = err == null ? 'unknown' : (err.message || err.toString());
    console.warn('autoUpdater error:', errorMsg);
    sendUpdaterStatus({
      status: 'error',
      error: errorMsg
    });
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('toast:show', {
        type: 'error',
        title: 'Update Check Issue',
        message: errorMsg
      });
    }
  });
}

ipcMain.handle('updater:check', async () => {
  if (isDev) {
    return {
      status: 'dev-mode',
      currentVersion: app.getVersion(),
      message: 'Auto-update is disabled in development mode'
    };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return {
      status: 'checked',
      currentVersion: app.getVersion(),
      updateInfo: result?.updateInfo
    };
  } catch (err: any) {
    return {
      status: 'error',
      currentVersion: app.getVersion(),
      error: err.message || 'Failed to check for updates'
    };
  }
});

ipcMain.handle('updater:download', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('updater:install', async () => {
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('updater:get-info', async () => {
  return {
    currentVersion: app.getVersion(),
    isPackaged: app.isPackaged,
    platform: process.platform
  };
});

// ============================================================================
// Community Feature #2: In-App .bubble Auto-Download & Direct Sync
// ============================================================================

let downloadsWatcher: fs.FSWatcher | null = null;
let isDownloadsWatcherActive = false;

function initDownloadsWatcher(enable: boolean): boolean {
  if (downloadsWatcher) {
    try {
      downloadsWatcher.close();
    } catch (e) {
      // ignore
    }
    downloadsWatcher = null;
  }
  isDownloadsWatcherActive = enable;
  if (!enable) return true;

  try {
    const downloadsPath = app.getPath('downloads');
    if (!fs.existsSync(downloadsPath)) return false;

    let debounceTimer: NodeJS.Timeout | null = null;

    downloadsWatcher = fs.watch(downloadsPath, (_eventType, filename) => {
      if (!filename) return;
      const lower = filename.toLowerCase();
      if (!lower.endsWith('.bubble') && !lower.endsWith('.json')) return;

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        try {
          const fullPath = path.join(downloadsPath, filename);
          if (!fs.existsSync(fullPath)) return;
          const stat = fs.statSync(fullPath);
          if (stat.size < 100) return;

          const raw = fs.readFileSync(fullPath, 'utf-8');
          const data = JSON.parse(raw);
          if (data && (data.pages || data.workflows || data.types || data.user_types || data.schema || data.app_version)) {
            let pagesCount = 0;
            let workflowsCount = 0;
            let elementsCount = 0;
            let dataTypesCount = 0;
            let appTextsCount = 0;

            if (data.pages && typeof data.pages === 'object') {
              pagesCount = Object.keys(data.pages).length;
              for (const p of Object.values<any>(data.pages)) {
                if (p.elements) elementsCount += Object.keys(p.elements).length;
                if (p.events || p.workflows) workflowsCount += Object.keys(p.events || p.workflows || {}).length;
              }
            }
            if (data.element_definitions) {
              elementsCount += Object.keys(data.element_definitions).length;
            }
            if (data.workflows) workflowsCount += Object.keys(data.workflows).length;
            if (data.user_types) dataTypesCount += Object.keys(data.user_types).length;
            if (data.custom_types) dataTypesCount += Object.keys(data.custom_types).length;
            if (data.types) dataTypesCount += Object.keys(data.types).length;
            if (data.app_texts) appTextsCount = Object.keys(data.app_texts).length;

            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('bubbleSync:fileDetected', {
                fileName: filename,
                filePath: fullPath,
                content: data,
                stats: {
                  pagesCount: pagesCount || 1,
                  workflowsCount: workflowsCount || 0,
                  elementsCount: elementsCount || 0,
                  dataTypesCount: dataTypesCount || 0,
                  appTextsCount: appTextsCount || 0
                }
              });
            }
          }
        } catch (e) {
          // ignore incomplete writes or non-Bubble JSON
        }
      }, 800);
    });

    return true;
  } catch (err) {
    console.warn('Failed to initialize downloads watcher:', err);
    return false;
  }
}

ipcMain.handle('bubbleSync:setDownloadsWatcher', async (_event, enabled: boolean) => {
  return initDownloadsWatcher(enabled);
});

ipcMain.handle('bubbleSync:checkAuth', async () => {
  try {
    const authSession = session.fromPartition('persist:bubble_session');
    const cookies = await authSession.cookies.get({ domain: 'bubble.io' });
    if (!cookies || cookies.length === 0) {
      return { isAuthenticated: false };
    }
    // Verify session by probing bubble.io/home with manual redirect
    const res = await authSession.fetch('https://bubble.io/home', {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const location = res.headers.get('location') || '';
    if (res.status === 302 && location.includes('/login')) {
      return { isAuthenticated: false };
    }
    if (res.status === 200 && !res.url.includes('/login')) {
      return { isAuthenticated: true };
    }
    return { isAuthenticated: false };
  } catch (err) {
    return { isAuthenticated: false };
  }
});

function copyDirRecursive(src: string, dest: string) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function extractCompanionExtension(): string | null {
  const targetDir = path.join(app.getPath('userData'), 'extensions', 'bubble-dev-studio-companion');

  // Candidate source locations:
  // 1. Unpacked resources (process.resourcesPath/extensions/bubble-dev-studio-companion)
  // 2. Dev mode relative path (__dirname/../extensions/bubble-dev-studio-companion)
  // 3. Inside app.asar (app.getAppPath()/extensions/bubble-dev-studio-companion)
  const candidates = [
    path.join(process.resourcesPath, 'extensions/bubble-dev-studio-companion'),
    path.join(__dirname, '../extensions/bubble-dev-studio-companion'),
    path.join(app.getAppPath(), 'extensions/bubble-dev-studio-companion')
  ];

  let sourceFound: string | null = null;
  for (const cand of candidates) {
    try {
      if (fs.existsSync(path.join(cand, 'manifest.json'))) {
        sourceFound = cand;
        break;
      }
    } catch {
      // ignore
    }
  }

  if (sourceFound) {
    // In dev mode (not packaged and not in asar), can return source directory directly
    if (!app.isPackaged && !sourceFound.includes('app.asar')) {
      return sourceFound;
    }

    try {
      copyDirRecursive(sourceFound, targetDir);
      return targetDir;
    } catch (err) {
      console.error('Failed to copy companion extension into userData:', err);
    }
  }

  if (fs.existsSync(path.join(targetDir, 'manifest.json'))) {
    return targetDir;
  }

  return null;
}

ipcMain.handle('companion:openFolder', async () => {
  try {
    const extDir = extractCompanionExtension();
    if (extDir && fs.existsSync(extDir)) {
      await shell.openPath(extDir);
      clipboard.writeText(extDir);
      return { success: true, path: extDir };
    } else {
      return { success: false, error: 'Companion extension source files not found.' };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('bubbleSync:checkRecentDownloads', async (_event, appId?: string) => {
  try {
    const downloadsDir = app.getPath('downloads');
    if (!fs.existsSync(downloadsDir)) return { found: false };

    const files = fs.readdirSync(downloadsDir);
    const cleanAppId = (appId || '').toLowerCase().trim();

    const candidates: Array<{ name: string; fullPath: string; mtime: number; size: number }> = [];

    for (const f of files) {
      const lower = f.toLowerCase();
      if (!lower.endsWith('.bubble') && !lower.endsWith('.json')) continue;
      const fullPath = path.join(downloadsDir, f);
      try {
        const st = fs.statSync(fullPath);
        // within last 14 days and size > 500 bytes
        if (st.size > 500 && Date.now() - st.mtimeMs < 14 * 24 * 3600 * 1000) {
          candidates.push({
            name: f,
            fullPath,
            mtime: st.mtimeMs,
            size: st.size
          });
        }
      } catch {}
    }

    if (candidates.length === 0) return { found: false };

    // Sort: 1) contains appId first, 2) non-api-generated first, 3) newest mtime
    candidates.sort((a, b) => {
      const aLower = a.name.toLowerCase();
      const bLower = b.name.toLowerCase();

      const aMatch = cleanAppId && aLower.includes(cleanAppId);
      const bMatch = cleanAppId && bLower.includes(cleanAppId);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;

      const aIsApi = aLower.includes('_api_generated');
      const bIsApi = bLower.includes('_api_generated');
      if (!aIsApi && bIsApi) return -1;
      if (aIsApi && !bIsApi) return 1;

      return b.mtime - a.mtime;
    });

    const top = candidates[0];
    const raw = fs.readFileSync(top.fullPath, 'utf8');
    const data = JSON.parse(raw);

    let pagesCount = 0;
    let workflowsCount = 0;
    let elementsCount = 0;
    let dataTypesCount = 0;
    let appTextsCount = 0;

    if (data.pages && typeof data.pages === 'object') {
      pagesCount = Object.keys(data.pages).length;
      for (const p of Object.values<any>(data.pages)) {
        if (p.elements) elementsCount += Object.keys(p.elements).length;
        if (p.events || p.workflows) workflowsCount += Object.keys(p.events || p.workflows || {}).length;
      }
    }
    if (data.element_definitions) {
      elementsCount += Object.keys(data.element_definitions).length;
    }
    if (data.workflows) workflowsCount += Object.keys(data.workflows).length;
    if (data.user_types) dataTypesCount += Object.keys(data.user_types).length;
    if (data.custom_types) dataTypesCount += Object.keys(data.custom_types).length;
    if (data.types) dataTypesCount += Object.keys(data.types).length;
    if (data.app_texts) appTextsCount = Object.keys(data.app_texts).length;

    return {
      found: true,
      fileName: top.name,
      filePath: top.fullPath,
      sizeBytes: top.size,
      mtime: top.mtime,
      content: data,
      stats: {
        pagesCount: pagesCount || 1,
        workflowsCount: workflowsCount || 0,
        elementsCount: elementsCount || 0,
        dataTypesCount: dataTypesCount || 0,
        appTextsCount: appTextsCount || 0
      }
    };
  } catch (err: any) {
    return { found: false, error: err.message };
  }
});

// Legacy backward-compatible stubs
ipcMain.handle('bubbleSync:login', async () => {
  return { isAuthenticated: false, error: 'Please use Chrome Companion or Downloads auto-detect.' };
});

ipcMain.handle('bubbleSync:fetchApp', async (_event, appId: string) => {
  return { success: false, error: 'Please use Chrome Companion or Downloads auto-detect.' };
});

ipcMain.handle('bubbleSync:logout', async () => {
  try {
    const authSession = session.fromPartition('persist:bubble_session');
    await authSession.clearStorageData();
    return true;
  } catch (err) {
    return false;
  }
});

ipcMain.handle('bubbleSync:showInFolder', async (_event, filePath: string) => {
  if (filePath && fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath);
    return true;
  }
  return false;
});

ipcMain.handle('bubbleSync:exportBlueprintToDisk', async (_event, { fileName, data }: { fileName: string; data: any }) => {
  try {
    const downloadsDir = app.getPath('downloads');
    const safeName = fileName || `bubble_export_${Date.now()}.bubble`;
    const targetPath = path.join(downloadsDir, safeName);
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf8');
    shell.showItemInFolder(targetPath);
    return { success: true, filePath: targetPath };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// Local HTTP Bridge Server for Default Browser Sync (Chrome, Edge, Brave, Safari, Firefox)
let localBridgeServer: http.Server | null = null;
const BRIDGE_PORT = 41890;

function startLocalBridgeServer() {
  if (localBridgeServer) return;

  localBridgeServer = http.createServer((req, res) => {
    // Enable CORS from any browser origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === 'POST' && (req.url === '/sync' || req.url === '/api/sync')) {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 250 * 1024 * 1024) { // 250MB limit
          req.destroy();
        }
      });

      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          const appData = payload.data || payload.app || payload;
          const originUrl = payload.origin || '';

          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('bubbleSync:browserAppReceived', {
              data: appData,
              originUrl,
              stats: payload.stats
            });
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Received by Bubble Dev Studio' }));
        } catch (err: any) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err?.message || 'Invalid JSON' }));
        }
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ready', port: BRIDGE_PORT, app: 'Bubble.io Dev Studio' }));
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  localBridgeServer.on('error', (err: any) => {
    console.warn('[BridgeServer] Port conflict or error on 41890:', err?.message);
  });

  localBridgeServer.listen(BRIDGE_PORT, '127.0.0.1', () => {
    console.log(`[BridgeServer] Listening on http://127.0.0.1:${BRIDGE_PORT} for default browser sync`);
  });
}




