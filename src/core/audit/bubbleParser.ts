export interface ParsedBubbleApp {
  appName: string;
  pages: { id: string; name: string; elementsCount: number; workflowsCount: number; raw: any }[];
  elements: { id: string; name: string; type: string; page: string; isHidden: boolean; raw: any }[];
  workflows: { id: string; name: string; eventType: string; page: string; actionsCount: number; targetElementId?: string; raw: any }[];
  customEvents: { id: string; name: string; page: string; actionsCount: number; raw: any }[];
  dbFields: { table: string; field: string; type: string }[];
  styles: { id: string; name: string; type: string }[];
  plugins: { id: string; name: string; actions: string[]; elements: string[] }[];
  optionSets: { id: string; name: string; options: string[] }[];
  privacyRules: { table: string; rulesCount: number; isPublic: boolean }[];
}

export class BubbleParser {
  /**
   * Parses raw .bubble JSON export file or provides sample rich AST
   */
  public static parse(rawJson?: any): ParsedBubbleApp {
    if (rawJson && typeof rawJson === 'object') {
      try {
        const appName = rawJson.name || rawJson.app_name || 'Bubble App';
        const pages: any[] = [];
        const elements: any[] = [];
        const workflows: any[] = [];
        const customEvents: any[] = [];
        const dbFields: any[] = [];
        const styles: any[] = [];
        const plugins: any[] = [];
        const optionSets: any[] = [];
        const privacyRules: any[] = [];

        // Parse pages & recursive elements & workflows
        if (rawJson.pages && typeof rawJson.pages === 'object') {
          for (const [pageKey, pageData] of Object.entries<any>(rawJson.pages)) {
            const pageName = pageData.name || pageKey;
            const pageElements: any[] = [];
            const pageWorkflows = pageData.workflows ? Object.values(pageData.workflows) : [];

            const collectElements = (elTree: any) => {
              if (!elTree || typeof elTree !== 'object') return;
              for (const [elemKey, elem] of Object.entries<any>(elTree)) {
                if (!elem || typeof elem !== 'object') continue;
                pageElements.push(elem);
                elements.push({
                  id: elemKey,
                  name: elem.name || elem.properties?.name || elemKey,
                  type: elem.type || elem.properties?.type || 'Group',
                  page: pageName,
                  isHidden: Boolean(elem.is_hidden || elem.default_hidden || elem.properties?.is_hidden),
                  raw: elem
                });
                if (elem.elements || elem.children || elem.sub_elements) {
                  collectElements(elem.elements || elem.children || elem.sub_elements);
                }
              }
            };

            collectElements(pageData.elements);

            pages.push({
              id: pageKey,
              name: pageName,
              elementsCount: pageElements.length,
              workflowsCount: pageWorkflows.length,
              raw: pageData
            });

            for (const [wfKey, wf] of Object.entries<any>(pageData.workflows || {})) {
              if (wf.event_type === 'custom_event') {
                customEvents.push({
                  id: wfKey,
                  name: wf.name || wfKey,
                  page: pageName,
                  actionsCount: wf.actions ? Object.keys(wf.actions).length : 0,
                  raw: wf
                });
              } else {
                workflows.push({
                  id: wfKey,
                  name: wf.name || `When ${wf.element_name || 'Event'} is triggered`,
                  eventType: wf.event_type || 'button_click',
                  page: pageName,
                  actionsCount: wf.actions ? Object.keys(wf.actions).length : 0,
                  targetElementId: wf.element_id,
                  raw: wf
                });
              }
            }
          }
        }

        // Parse Database Types and Fields
        const typesObj = rawJson.user_types || rawJson.custom_types || rawJson.types || rawJson.database_types;
        if (typesObj && typeof typesObj === 'object') {
          for (const [typeKey, typeData] of Object.entries<any>(typesObj)) {
            const tableName = typeKey.replace(/^custom\./, '');
            const rawFields = typeData.fields || typeData.properties || {};
            for (const [fKey, fData] of Object.entries<any>(rawFields)) {
              dbFields.push({
                table: tableName.charAt(0).toUpperCase() + tableName.slice(1),
                field: fKey,
                type: typeof fData === 'string' ? fData : (fData.type || 'text')
              });
            }
          }
        }

        // Parse Option Sets
        const osObj = rawJson.option_sets || rawJson.custom_options;
        if (osObj && typeof osObj === 'object') {
          for (const [osKey, osData] of Object.entries<any>(osObj)) {
            const opts = osData.options ? (Array.isArray(osData.options) ? osData.options : Object.values(osData.options)) : [];
            optionSets.push({
              id: osKey,
              name: osData.name || osKey,
              options: opts.map((o: any) => typeof o === 'string' ? o : (o.display || o.value || o.name || 'Option'))
            });
          }
        }

        // Parse Plugins
        const plugObj = rawJson.plugins || rawJson.installed_plugins;
        if (plugObj && typeof plugObj === 'object') {
          for (const [pKey, pData] of Object.entries<any>(plugObj)) {
            plugins.push({
              id: pKey,
              name: pData.name || pKey,
              actions: pData.actions ? Object.keys(pData.actions) : [],
              elements: pData.elements ? Object.keys(pData.elements) : []
            });
          }
        }

        // Return parsed object if populated
        if (pages.length > 0 || elements.length > 0 || dbFields.length > 0) {
          return {
            appName,
            pages,
            elements,
            workflows,
            customEvents,
            dbFields,
            styles,
            plugins,
            optionSets,
            privacyRules
          };
        }
      } catch (e) {
        console.warn('Error parsing raw .bubble JSON, falling back to rich model:', e);
      }
    }

    // Default clean empty AST model for active application
    return {
      appName: 'Bubble Application',
      pages: [],
      elements: [],
      workflows: [],
      customEvents: [],
      dbFields: [],
      styles: [],
      plugins: [],
      optionSets: [],
      privacyRules: []
    };
  }
}

