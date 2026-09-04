// Bubble Dev Studio Companion - Content Script
(function() {
  if (window.__bubbleDevStudioCompanionInjected) return;
  window.__bubbleDevStudioCompanionInjected = true;

  const BRIDGE_URL = 'http://127.0.0.1:41890/sync';
  const STATUS_URL = 'http://127.0.0.1:41890/status';

  // 1. Inject pageScript into the main DOM context
  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('pageScript.js');
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
  } catch (e) {
    console.warn('[Bubble Dev Studio Companion] Script injection failed:', e);
  }

  // 2. Only inject floating UI if we are in the Bubble Editor
  const isEditor = window.location.hostname.endsWith('bubble.io') && window.location.pathname.includes('/page');
  if (!isEditor) return;

  // Create Toast Notification helper
  function showToast(message, type = 'info') {
    const existing = document.getElementById('bds-companion-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'bds-companion-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 74px;
      right: 24px;
      z-index: 9999999;
      background: ${type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#1e1b4b'};
      color: #ffffff;
      padding: 12px 18px;
      border-radius: 10px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.15);
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      transform: translateY(10px);
      opacity: 0;
    `;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // 3. Inject Floating Button in Bubble Editor
  function injectFloatingButton() {
    if (document.getElementById('bds-floating-sync-container')) return;

    const container = document.createElement('div');
    container.id = 'bds-floating-sync-container';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 24px;
      z-index: 9999998;
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    const button = document.createElement('button');
    button.id = 'bds-floating-sync-btn';
    button.title = 'Send full AST & workflows to Bubble Dev Studio Desktop (port 41890)';
    button.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 10px 16px;
      border-radius: 50px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.45);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
    `;
    button.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
      </svg>
      <span>Sync to Dev Studio</span>
    `;

    button.onmouseover = () => {
      button.style.transform = 'translateY(-2px) scale(1.03)';
      button.style.boxShadow = '0 6px 24px rgba(99, 102, 241, 0.6)';
    };
    button.onmouseout = () => {
      button.style.transform = 'translateY(0) scale(1)';
      button.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.45)';
    };

    button.onclick = () => triggerSync();

    container.appendChild(button);
    document.body.appendChild(container);
  }

  async function autoTriggerBubbleExport() {
    showToast('⚡ Auto-triggering official Bubble Export...', 'info');

    function findExportButton() {
      const allEls = Array.from(document.querySelectorAll('button, div[role="button"], input[type="button"], a, div'));
      return allEls.find(el => {
        const text = (el.innerText || el.textContent || '').trim().toLowerCase();
        return (text === 'export application' || text.includes('export application')) && el.offsetParent !== null;
      });
    }

    function findSettingsTab() {
      const byAttr = document.querySelector('[data-tab*="setting" i], [title*="Setting" i], [aria-label*="Setting" i]');
      if (byAttr && byAttr.offsetParent !== null) return byAttr;

      const candidates = Array.from(document.querySelectorAll('div, button, a, li, span'));
      return candidates.find(el => {
        const text = (el.innerText || el.textContent || '').trim().toLowerCase();
        return text === 'settings' && el.children.length <= 2 && el.offsetParent !== null;
      });
    }

    let exportBtn = findExportButton();

    if (!exportBtn) {
      const settingsTab = findSettingsTab();
      if (settingsTab) {
        showToast('⚙️ Switching to Settings tab...', 'info');
        settingsTab.click();
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 300));
          exportBtn = findExportButton();
          if (exportBtn) break;
        }
      } else {
        if (!window.location.search.includes('tab=general') && !window.location.search.includes('tab=tabs-')) {
          showToast('⚙️ Opening Settings > General...', 'info');
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set('tab', 'general');
          window.location.href = currentUrl.toString();
          return true;
        }
      }
    }

    if (exportBtn) {
      exportBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(r => setTimeout(r, 300));
      exportBtn.click();
      showToast('🎉 Bubble Export triggered! Dev Studio is auto-catching the file...', 'success');
      return true;
    }

    showToast('👉 Click Settings (⚙️) > General > "Export application". Dev Studio will auto-import it!', 'info');
    return false;
  }

  // 4. Trigger extraction and transmission
  let isSyncing = false;
  function triggerSync() {
    if (isSyncing) return;
    isSyncing = true;

    const btn = document.getElementById('bds-floating-sync-btn');
    if (btn) {
      btn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: bds-spin 1s linear infinite;">
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
        <span>Reading AST...</span>
      `;
    }

    // Add spin keyframes if not present
    if (!document.getElementById('bds-spin-style')) {
      const style = document.createElement('style');
      style.id = 'bds-spin-style';
      style.textContent = `@keyframes bds-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
    }

    const responseHandler = async (event) => {
      window.removeEventListener('BUBBLE_DEV_STUDIO_RESPONSE_SYNC', responseHandler);

      const res = event.detail;
      if (!res || !res.success || !res.data) {
        if (res && res.fallbackToExport) {
          await autoTriggerBubbleExport();
        } else {
          showToast('❌ ' + (res?.error || 'Failed to extract Bubble data from editor'), 'error');
        }
        resetButton();
        return;
      }

      showToast('🚀 Sending application blueprint to Dev Studio...', 'info');

      try {
        const response = await fetch(BRIDGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: res.data,
            origin: window.location.href,
            title: document.title,
            stats: res.stats
          })
        });

        const result = await response.json();
        if (result.success) {
          const stats = res.stats || {};
          showToast(`✨ Synced! (${stats.pagesCount || 1} Pages, ${stats.workflowsCount || 0} Workflows, ${stats.elementsCount || 0} Elements)`, 'success');
        } else {
          showToast('⚠️ Dev Studio bridge returned an error: ' + (result.error || 'Unknown'), 'error');
        }
      } catch (networkErr) {
        showToast('⚠️ Bubble Dev Studio is not open or bridge on port 41890 is unreachable.', 'error');
      } finally {
        resetButton();
      }
    };

    window.addEventListener('BUBBLE_DEV_STUDIO_RESPONSE_SYNC', responseHandler);
    window.dispatchEvent(new CustomEvent('BUBBLE_DEV_STUDIO_REQUEST_SYNC'));

    // Safety timeout
    setTimeout(() => {
      if (isSyncing) {
        window.removeEventListener('BUBBLE_DEV_STUDIO_RESPONSE_SYNC', responseHandler);
        resetButton();
      }
    }, 15000);
  }

  function resetButton() {
    isSyncing = false;
    const btn = document.getElementById('bds-floating-sync-btn');
    if (btn) {
      btn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        <span>Sync to Dev Studio</span>
      `;
    }
  }

  // Inject button when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFloatingButton);
  } else {
    injectFloatingButton();
  }

  // Periodic check in case Bubble re-renders navigation
  setInterval(injectFloatingButton, 3000);

  // Listen for trigger messages from popup
  chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
    if (req.action === 'trigger_sync') {
      triggerSync();
      sendResponse({ status: 'triggered' });
    }
  });

  // Check if URL has auto-sync parameter
  if (window.location.search.includes('sync_studio=true') || window.location.hash.includes('auto-sync=true')) {
    setTimeout(triggerSync, 2500);
  }
})();
