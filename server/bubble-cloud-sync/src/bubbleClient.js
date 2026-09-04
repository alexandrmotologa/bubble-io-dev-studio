const axios = require('axios');

class BubbleCloudClient {
  constructor(options = {}) {
    this.sessionCookie = options.sessionCookie || process.env.BUBBLE_BOT_SESSION || '';
    this.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
  }

  setSessionCookie(cookie) {
    this.sessionCookie = cookie;
  }

  /**
   * Fetch full application AST JSON tree from Bubble.io
   */
  async fetchAppTree(appId, branch = 'test', customCookie = null) {
    const cookie = customCookie || this.sessionCookie;
    if (!cookie) {
      throw new Error('No Bubble session cookie configured. Provide BUBBLE_BOT_SESSION in .env or pass sessionCookie in request.');
    }

    const cleanAppId = appId.trim();
    const cleanBranch = (branch || 'test').trim();

    const headers = {
      'User-Agent': this.userAgent,
      'Cookie': cookie.includes('=') ? cookie : `bubble_session=${cookie}`,
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': `https://bubble.io/page?id=${encodeURIComponent(cleanAppId)}&tab=tabs-general`
    };

    // --- STRATEGY 1: Official export endpoint (/appeditor/export/...) ---
    // Full application AST with 100% fidelity (all workflows, elements, data types, settings, option sets)
    try {
      console.log(`[BubbleClient] Probing /appeditor/export for ${cleanAppId} (${cleanBranch})...`);
      const exportUrl = `https://bubble.io/appeditor/export/${encodeURIComponent(cleanBranch)}/${encodeURIComponent(cleanAppId)}.bubble`;
      const exportRes = await axios.get(exportUrl, {
        headers: {
          ...headers,
          'Accept': '*/*'
        },
        timeout: 35000,
        validateStatus: (status) => status < 400
      });

      if (exportRes.status === 200 && exportRes.data && (typeof exportRes.data === 'object')) {
        console.log(`[BubbleClient] Successfully retrieved full official export for ${cleanAppId}`);
        const stats = this.calculateStats(exportRes.data);
        return {
          success: true,
          appId: cleanAppId,
          branch: cleanBranch,
          stats,
          data: exportRes.data
        };
      }
    } catch (err) {
      console.warn(`[BubbleClient] Strategy 1 (/appeditor/export) fallback:`, err.message);
    }

    // --- STRATEGY 2: Internal Bubble Editor protocol (/appeditor/load_multiple_paths) ---
    // Fallback if export endpoint is restricted
    try {
      console.log(`[BubbleClient] Probing /appeditor/load_multiple_paths fallback for ${cleanAppId} (${cleanBranch})...`);
      const loadUrl = `https://bubble.io/appeditor/load_multiple_paths/${encodeURIComponent(cleanAppId)}/${encodeURIComponent(cleanBranch)}`;
      
      const initRes = await axios.post(loadUrl, {
        path_arrays: [
          ["_index", "id_to_path"],
          ["user_types"],
          ["styles"]
        ],
        no_chunking: true
      }, {
        headers,
        timeout: 25000,
        validateStatus: (status) => status < 500
      });

      if (initRes.status === 200 && initRes.data?.data) {
        const idToPath = initRes.data.data[0]?.data || {};
        const userTypes = initRes.data.data[1]?.data || {};
        const styles = initRes.data.data[2]?.data || {};

        if (Object.keys(idToPath).length > 0 || Object.keys(userTypes).length > 0) {
          console.log(`[BubbleClient] Connected via editor protocol (${Object.keys(idToPath).length} symbols, ${Object.keys(userTypes).length} types)`);

          const pageKeys = new Set();
          const edKeys = new Set();

          for (const [id, path] of Object.entries(idToPath)) {
            if (typeof path === 'string') {
              const parts = path.split('.');
              if (parts[0] === '%p3' && parts[1]) pageKeys.add(parts[1]);
              else if (parts[0] === '%ed' && parts[1]) edKeys.add(parts[1]);
            }
          }

          // Fetch all pages and reusable elements
          const queries = [
            ...Array.from(pageKeys).map(p => ["%p3", p]),
            ...Array.from(edKeys).map(e => ["%ed", e])
          ];

          const pages = {};
          const element_definitions = {};

          if (queries.length > 0) {
            const chunkSize = 50;
            for (let i = 0; i < queries.length; i += chunkSize) {
              const chunk = queries.slice(i, i + chunkSize);
              const batchRes = await axios.post(loadUrl, {
                path_arrays: chunk,
                no_chunking: true
              }, { headers, timeout: 30000 });

              if (batchRes.status === 200 && batchRes.data?.data) {
                batchRes.data.data.forEach((item, chunkIdx) => {
                  const queryIdx = i + chunkIdx;
                  const [type, key] = queries[queryIdx];
                  if (type === '%p3') {
                    const pageData = item.data;
                    if (pageData) {
                      const pageName = pageData['%nm'] || key;
                      pages[pageName] = pageData;
                    }
                  } else if (type === '%ed') {
                    if (item.data) element_definitions[key] = item.data;
                  }
                });
              }
            }
          }

          const fullApp = {
            pages,
            user_types: userTypes,
            styles,
            element_definitions,
            _index: { id_to_path: idToPath }
          };

          const stats = this.calculateStats(fullApp);
          return {
            success: true,
            appId: cleanAppId,
            branch: cleanBranch,
            stats,
            data: fullApp
          };
        }
      }
    } catch (err) {
      console.warn(`[BubbleClient] Strategy 2 (/appeditor/load_multiple_paths) failed:`, err.message);
    }

    throw new Error('Could not extract application AST. Ensure the bot account is added as a Collaborator to this Bubble app (Settings -> Collaboration).');
  }

  calculateStats(data) {
    let pagesCount = 0;
    let workflowsCount = 0;
    let elementsCount = 0;
    let dataTypesCount = 0;
    let appTextsCount = 0;

    if (data.pages && typeof data.pages === 'object') {
      pagesCount = Object.keys(data.pages).length;
      for (const page of Object.values(data.pages)) {
        if (page && typeof page === 'object') {
          if (page.elements && typeof page.elements === 'object') {
            elementsCount += Object.keys(page.elements).length;
          }
          if (page.events && typeof page.events === 'object') {
            workflowsCount += Object.keys(page.events).length;
          } else if (page.workflows && typeof page.workflows === 'object') {
            workflowsCount += Object.keys(page.workflows).length;
          }

          if (page['%el'] && typeof page['%el'] === 'object') {
            elementsCount += Object.keys(page['%el']).length;
          }
          if (page['%wf'] && typeof page['%wf'] === 'object') {
            workflowsCount += Object.keys(page['%wf']).length;
          }
        }
      }
    }

    if (data.element_definitions && typeof data.element_definitions === 'object') {
      elementsCount += Object.keys(data.element_definitions).length;
      for (const ed of Object.values(data.element_definitions)) {
        if (ed && typeof ed === 'object') {
          if (ed['%el']) elementsCount += Object.keys(ed['%el']).length;
          if (ed['%wf']) workflowsCount += Object.keys(ed['%wf']).length;
          if (ed.elements) elementsCount += Object.keys(ed.elements).length;
          if (ed.workflows) workflowsCount += Object.keys(ed.workflows).length;
        }
      }
    }

    if (data.workflows && typeof data.workflows === 'object') {
      workflowsCount += Object.keys(data.workflows).length;
    }

    const typesObj = data.user_types || data.custom_types || data.types;
    if (typesObj && typeof typesObj === 'object') {
      dataTypesCount = Object.keys(typesObj).length;
    }

    if (data.app_texts && typeof data.app_texts === 'object') {
      appTextsCount = Object.keys(data.app_texts).length;
    }

    return {
      pagesCount,
      workflowsCount,
      elementsCount,
      dataTypesCount,
      appTextsCount
    };
  }
}

module.exports = { BubbleCloudClient };
