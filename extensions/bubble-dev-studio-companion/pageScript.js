// Runs in the MAIN world context of bubble.io to access window and iframes directly
(function() {
  function findBubbleApp() {
    // 1. Direct window candidates
    const candidates = [
      window.app,
      window.bubble_app,
      window.current_app,
      window._app,
      window.editor && window.editor.app,
      window.BubbleEditor && window.BubbleEditor.app,
      window.package && window.package.app,
      window.Bubble && window.Bubble.app,
      window.bubble && window.bubble.app
    ];

    for (const c of candidates) {
      if (c && typeof c === 'object' && (c.pages || c.pages_dict || c.get_json_for_export || c.to_json || c.user_types)) {
        return c;
      }
    }

    // 2. Check iframes (Bubble canvas preview is rendered inside an iframe)
    try {
      const iframes = document.querySelectorAll('iframe');
      for (const frame of iframes) {
        try {
          const cw = frame.contentWindow;
          if (!cw) continue;
          const iframeCandidates = [
            cw.app,
            cw.bubble_app,
            cw.current_app,
            cw._app,
            cw.editor && cw.editor.app
          ];
          for (const ic of iframeCandidates) {
            if (ic && typeof ic === 'object' && (ic.pages || ic.pages_dict || ic.get_json_for_export || ic.to_json || ic.user_types)) {
              return ic;
            }
          }
        } catch (e) {
          // Ignore cross-origin errors
        }
      }
    } catch (e) {}

    return null;
  }

  window.addEventListener('BUBBLE_DEV_STUDIO_REQUEST_SYNC', function() {
    try {
      const app = findBubbleApp();
      if (!app) {
        window.dispatchEvent(new CustomEvent('BUBBLE_DEV_STUDIO_RESPONSE_SYNC', {
          detail: {
            success: false,
            fallbackToExport: true,
            error: 'In-memory window.app is encapsulated in this editor version.'
          }
        }));
        return;
      }

      let appData = null;
      if (typeof app.get_json_for_export === 'function') {
        appData = app.get_json_for_export();
      } else if (typeof app.to_json === 'function') {
        appData = app.to_json();
      } else {
        appData = {
          pages: app.pages || app.pages_dict || {},
          user_types: app.user_types || app.custom_types || app.types || {},
          custom_types: app.custom_types || app.user_types || app.types || {},
          option_sets: app.option_sets || app.option_sets_dict || {},
          workflows: app.workflows || {},
          element_definitions: app.element_definitions || {},
          styles: app.styles || {},
          api: app.api || app.api_connectors || {},
          app_version: app.app_version || 'live'
        };
      }

      let pagesCount = 0;
      let workflowsCount = 0;
      let elementsCount = 0;

      if (appData.pages && typeof appData.pages === 'object') {
        pagesCount = Object.keys(appData.pages).length;
        for (const p of Object.values(appData.pages)) {
          if (p.elements) elementsCount += Object.keys(p.elements).length;
          if (p.events || p.workflows) workflowsCount += Object.keys(p.events || p.workflows || {}).length;
        }
      }
      if (appData.element_definitions) {
        elementsCount += Object.keys(appData.element_definitions).length;
      }

      window.dispatchEvent(new CustomEvent('BUBBLE_DEV_STUDIO_RESPONSE_SYNC', {
        detail: {
          success: true,
          data: appData,
          stats: {
            pagesCount,
            workflowsCount,
            elementsCount,
            typesCount: Object.keys(appData.user_types || appData.types || {}).length
          }
        }
      }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('BUBBLE_DEV_STUDIO_RESPONSE_SYNC', {
        detail: {
          success: false,
          fallbackToExport: true,
          error: (err && err.message) || 'Unknown error extracting Bubble AST.'
        }
      }));
    }
  });
})();
