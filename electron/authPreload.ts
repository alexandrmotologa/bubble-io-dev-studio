import { webFrame } from 'electron';

// Run in isolated world 0 (main page context) BEFORE any Google or Bubble scripts execute
try {
  webFrame.executeJavaScriptInIsolatedWorld(0, [
    {
      code: `
        try {
          // Remove Chromium Client Hints that Google uses to detect Electron
          delete window.navigator.userAgentData;
          Object.defineProperty(window.navigator, 'userAgentData', {
            get: () => undefined,
            configurable: true
          });
        } catch (e) {}
      `
    }
  ]);
} catch (e) {
  console.error('authPreload error:', e);
}
