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

        // Parse pages & elements
        if (rawJson.pages) {
          for (const [pageKey, pageData] of Object.entries<any>(rawJson.pages)) {
            const pageName = pageData.name || pageKey;
            const pageElements = pageData.elements ? Object.values(pageData.elements) : [];
            const pageWorkflows = pageData.workflows ? Object.values(pageData.workflows) : [];

            pages.push({
              id: pageKey,
              name: pageName,
              elementsCount: pageElements.length,
              workflowsCount: pageWorkflows.length,
              raw: pageData
            });

            for (const [elemKey, elem] of Object.entries<any>(pageData.elements || {})) {
              elements.push({
                id: elemKey,
                name: elem.name || elemKey,
                type: elem.type || 'Group',
                page: pageName,
                isHidden: Boolean(elem.is_hidden || elem.default_hidden),
                raw: elem
              });
            }

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

        // Return parsed object if populated
        if (pages.length > 0 || elements.length > 0) {
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

