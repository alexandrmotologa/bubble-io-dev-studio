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

    // Default rich AST model for analysis and demo
    return {
      appName: 'SaaS Marketplace Core',
      pages: [
        { id: 'p_index', name: 'index', elementsCount: 84, workflowsCount: 32, raw: {} },
        { id: 'p_checkout', name: 'checkout', elementsCount: 42, workflowsCount: 28, raw: {} },
        { id: 'p_dashboard', name: 'dashboard', elementsCount: 110, workflowsCount: 45, raw: {} },
        { id: 'p_settings', name: 'settings', elementsCount: 56, workflowsCount: 19, raw: {} },
        { id: 'p_legacy_v1', name: 'legacy_promo_v1', elementsCount: 18, workflowsCount: 6, raw: {} }
      ],
      elements: [
        { id: 'elem_hero', name: 'Group Hero Section', type: 'Group', page: 'index', isHidden: false, raw: {} },
        { id: 'elem_cta', name: 'Button - Get Started Now', type: 'Button', page: 'index', isHidden: false, raw: {} },
        { id: 'dead_elem_1', name: 'Group - Old Banner (Legacy V1)', type: 'Group', page: 'index', isHidden: true, raw: {} },
        { id: 'dead_elem_2', name: 'Button - Temporary Test Checkout', type: 'Button', page: 'checkout', isHidden: true, raw: {} },
        { id: 'dead_elem_3', name: 'FloatingGroup - Beta Feedback Widget', type: 'FloatingGroup', page: 'dashboard', isHidden: true, raw: {} }
      ],
      workflows: [
        { id: 'wf_signup', name: 'When Button_GetStarted is clicked -> Sign up user', eventType: 'click', page: 'index', actionsCount: 4, targetElementId: 'elem_cta', raw: {} },
        { id: 'wf_pay', name: 'When Button_Pay is clicked -> Stripe Charge', eventType: 'click', page: 'checkout', actionsCount: 6, raw: {} },
        { id: 'dead_wf_1', name: 'Workflow: When Button_Submit is clicked (Draft)', eventType: 'click', page: 'settings', actionsCount: 1, targetElementId: 'deleted_btn_404', raw: {} },
        { id: 'dead_wf_2', name: 'Workflow: When Page is Loaded (Old Experiment B)', eventType: 'page_load', page: 'index', actionsCount: 2, raw: {} }
      ],
      customEvents: [
        { id: 'dead_ce_1', name: 'send_legacy_sms_notification', page: 'global', actionsCount: 3, raw: {} },
        { id: 'ce_analytics', name: 'track_mixpanel_conversion', page: 'global', actionsCount: 2, raw: {} }
      ],
      dbFields: [
        { table: 'User', field: 'email', type: 'text' },
        { table: 'User', field: 'first_name', type: 'text' },
        { table: 'User', field: 'legacy_fax_number', type: 'text' },
        { table: 'Order', field: 'order_number', type: 'text' },
        { table: 'Order', field: 'old_discount_code_temp', type: 'text' },
        { table: 'Product', field: 'deprecated_supplier_notes', type: 'text' }
      ],
      styles: [
        { id: 'st_btn_primary', name: 'Button - Primary Blue Gradient', type: 'button' },
        { id: 'st_h1_main', name: 'Heading 1 - Inter Bold Dark', type: 'text' },
        { id: 'dead_st_1', name: 'Heading 1 - Green Neon Vintage', type: 'text' },
        { id: 'dead_st_2', name: 'Group - Card Vintage Shadow Border', type: 'group' }
      ],
      plugins: [
        { id: 'plg_stripe', name: 'Stripe Official Payments', actions: ['Charge Customer', 'Create Customer'], elements: ['Stripe Elements'] },
        { id: 'plg_lucide', name: 'Lucide Icon Pack', actions: [], elements: ['Lucide Icon'] },
        { id: 'dead_plg_1', name: 'Legacy Flash Charts V2', actions: ['Render Flash XML'], elements: ['Flash Widget'] }
      ],
      optionSets: [
        { id: 'os_role', name: 'User Role', options: ['Admin', 'Manager', 'Customer'] },
        { id: 'os_status', name: 'Order Status', options: ['Pending', 'Processing', 'Delivered'] },
        { id: 'dead_os_1', name: 'Legacy Shipping Carrier 2023', options: ['AirMail', 'PonyExpress', 'FaxPost'] }
      ],
      privacyRules: [
        { table: 'User', rulesCount: 2, isPublic: false },
        { table: 'Order', rulesCount: 1, isPublic: false },
        { table: 'InternalLogs', rulesCount: 0, isPublic: true }
      ]
    };
  }
}
