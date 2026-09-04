// Runs in the MAIN world context of bubble.io to access window.app directly
(function() {
  window.addEventListener('BUBBLE_DEV_STUDIO_REQUEST_SYNC', function() {
    try {
      const app = window.app;
      if (!app) {
        window.dispatchEvent(new CustomEvent('BUBBLE_DEV_STUDIO_RESPONSE_SYNC', {
          detail: { success: false, error: 'Bubble Editor is still loading or window.app is not accessible yet.' }
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
        detail: { success: false, error: err.message || 'Unknown error extracting Bubble AST.' }
      }));
    }
  });
})();
