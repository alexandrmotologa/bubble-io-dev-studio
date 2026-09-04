const axios = require('axios');

class BubbleCloudClient {
  constructor(options = {}) {
    this.sessionCookie = options.sessionCookie || process.env.BUBBLE_BOT_SESSION || '';
    this.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
  }

  /**
   * Set or update active session cookie
   */
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

    // 1. Prepare authenticated headers mirroring a genuine collaborator session
    const headers = {
      'User-Agent': this.userAgent,
      'Cookie': cookie.includes('=') ? cookie : `bubble_session=${cookie}`,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin'
    };

    // 2. Fetch editor page which contains the bootstrap state
    const editorUrl = `https://bubble.io/page?id=${encodeURIComponent(cleanAppId)}&branch=${encodeURIComponent(cleanBranch)}&tab=tabs-general`;
    
    const pageResponse = await axios.get(editorUrl, {
      headers,
      maxRedirects: 5,
      timeout: 30000,
      validateStatus: (status) => status < 400
    });

    const html = pageResponse.data;
    if (typeof html !== 'string') {
      throw new Error('Unexpected response format from Bubble.io');
    }

    // Check if redirected to login
    if (html.includes('id="login-form"') || html.includes('Log into Bubble') || pageResponse.request?.res?.responseUrl?.includes('/login')) {
      throw new Error('Authentication failed: Bot session cookie expired or invalid. Please refresh BUBBLE_BOT_SESSION.');
    }

    // 3. Extract JSON payload from script tags or window.__app / bubble_page_data
    let appJson = null;

    // Pattern A: window.bubble_page_data or window.app_data
    const pageDataMatch = html.match(/(?:window\.)?(?:bubble_page_data|app_data|bootstrap_data)\s*=\s*(\{.+?\});/s);
    if (pageDataMatch) {
      try {
        appJson = JSON.parse(pageDataMatch[1]);
      } catch (e) {}
    }

    // Pattern B: Embedded JSON in script type="application/json"
    if (!appJson) {
      const scriptMatches = html.matchAll(/<script[^>]*type=["']application\/json["'][^>]*>(.+?)<\/script>/gis);
      for (const m of scriptMatches) {
        try {
          const parsed = JSON.parse(m[1]);
          if (parsed.pages || parsed.user_types || parsed.custom_types) {
            appJson = parsed;
            break;
          }
        } catch (e) {}
      }
    }

    // Pattern C: Attempt internal MGT API with authenticated cookie
    if (!appJson) {
      try {
        const mgtUrl = `https://bubble.io/api/1.1/mgt/app/${encodeURIComponent(cleanAppId)}/data`;
        const mgtRes = await axios.get(mgtUrl, {
          headers: {
            ...headers,
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          timeout: 15000
        });
        if (mgtRes.data && (mgtRes.data.pages || mgtRes.data.user_types)) {
          appJson = mgtRes.data;
        }
      } catch (e) {}
    }

    if (!appJson) {
      throw new Error('Could not extract application AST. Ensure the bot account is added as a Collaborator to this Bubble app.');
    }

    // 4. Calculate accurate blueprint statistics
    const stats = this.calculateStats(appJson);

    return {
      success: true,
      appId: cleanAppId,
      branch: cleanBranch,
      stats,
      data: appJson
    };
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
        }
      }
    }

    if (data.element_definitions && typeof data.element_definitions === 'object') {
      elementsCount += Object.keys(data.element_definitions).length;
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
