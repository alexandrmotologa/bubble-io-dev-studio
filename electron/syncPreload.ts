import { webFrame } from 'electron';

// Run in isolated world 0 (main page context) BEFORE any Bubble scripts run
try {
  webFrame.executeJavaScriptInIsolatedWorld(0, [
    {
      code: `
        window.__bubble_has_permission_error = false;
        window.__bubble_intercepted_alert = '';
        window.alert = function(msg) {
          const s = String(msg || '');
          window.__bubble_intercepted_alert = s;
          if (s.toLowerCase().includes('permission') || s.toLowerCase().includes('not have permission')) {
            window.__bubble_has_permission_error = true;
          }
          console.warn('[Bubble Alert Intercepted in Preload]', s);
        };
        window.confirm = function() { return true; };
      `
    }
  ]);
} catch (e) {
  console.error('syncPreload error:', e);
}
