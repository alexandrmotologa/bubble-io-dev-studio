import { TranslationItem } from '../../types';

export class BubbleExtractor {
  /**
   * Extracts localized strings, App Texts, Option Sets, and inline button/label texts from .bubble file
   */
  public static extractFromBubbleJson(rawJson: any): TranslationItem[] {
    const items: TranslationItem[] = [];
    const seenTexts = new Set<string>();

    if (!rawJson || typeof rawJson !== 'object') {
      return this.getSampleBubbleTexts();
    }

    const addText = (text: any, key: string, category: 'ui' | 'error' | 'email' | 'option_set' | 'notification', context?: string) => {
      if (typeof text !== 'string') return;
      const clean = text.trim();
      // Skip if empty, purely numeric, or trivial
      if (!clean || clean.length < 2 || /^\d+$/.test(clean) || seenTexts.has(clean)) return;
      // Skip internal Bubble system markers
      if (clean.startsWith('b_') && !clean.includes(' ')) return;

      seenTexts.add(clean);
      items.push({
        id: `trans_${items.length + 1}_${key.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
        key: key.replace(/[^a-zA-Z0-9_-]/g, '_'),
        sourceText: clean,
        category,
        context,
        status: 'pending'
      });
    };

    // 1. Extract App Texts
    if (rawJson.app_texts && typeof rawJson.app_texts === 'object') {
      for (const [key, textVal] of Object.entries<any>(rawJson.app_texts)) {
        addText(textVal, `app_text_${key}`, 'ui', 'Bubble App Text');
      }
    }

    // 2. Extract Option Sets
    const optionSets = rawJson.option_sets || rawJson.custom_options || {};
    if (typeof optionSets === 'object') {
      for (const [osKey, osData] of Object.entries<any>(optionSets)) {
        if (!osData || typeof osData !== 'object') continue;
        const rawOpts = osData.values || osData.options || osData.choices || osData.list || [];
        const opts = Array.isArray(rawOpts) ? rawOpts : Object.values(rawOpts);
        for (const opt of opts) {
          const optVal = typeof opt === 'string' ? opt : (opt?.display || opt?.value || opt?.db_value || opt?.name || opt?.text);
          if (optVal) {
            addText(String(optVal), `opt_${osKey}_${optVal}`, 'option_set', `Option Set: ${osData.display || osKey}`);
          }
        }
      }
    }

    // 3. Extract Recursive Elements from Pages & Reusable Elements
    const pages = rawJson.pages || {};
    const reusables = rawJson.reusable_elements || rawJson.custom_elements || {};
    const allContainers = { ...pages, ...reusables };

    const crawlElement = (el: any, path: string) => {
      if (!el || typeof el !== 'object') return;

      // Extract properties
      const props = el.properties || el;
      const candidateProperties = [
        { key: 'text', prop: props.text, cat: 'ui' as const },
        { key: 'placeholder', prop: props.placeholder, cat: 'ui' as const },
        { key: 'button_text', prop: props.button_text, cat: 'ui' as const },
        { key: 'caption', prop: props.caption, cat: 'ui' as const },
        { key: 'label', prop: props.label, cat: 'ui' as const },
        { key: 'title', prop: props.title, cat: 'ui' as const },
        { key: 'heading', prop: props.heading, cat: 'ui' as const },
        { key: 'tooltip', prop: props.tooltip, cat: 'ui' as const },
        { key: 'content', prop: props.content, cat: 'ui' as const },
        { key: 'body', prop: props.body, cat: 'email' as const },
        { key: 'subject', prop: props.subject, cat: 'email' as const },
        { key: 'error_message', prop: props.error_message, cat: 'error' as const },
        { key: 'alert_message', prop: props.alert_message, cat: 'notification' as const }
      ];

      for (const cp of candidateProperties) {
        if (typeof cp.prop === 'string') {
          addText(cp.prop, `${path}_${cp.key}`, cp.cat, path);
        }
      }

      // Recurse into nested children / elements
      const children = el.elements || el.children || el.sub_elements;
      if (children && typeof children === 'object') {
        const childEntries = Array.isArray(children) ? children.entries() : Object.entries(children);
        for (const [cKey, child] of childEntries) {
          const childName = (child as any)?.name || (child as any)?.id || cKey;
          crawlElement(child, `${path}_${childName}`);
        }
      }
    };

    for (const [containerName, containerData] of Object.entries<any>(allContainers)) {
      if (containerData?.elements) {
        const elEntries = Array.isArray(containerData.elements) ? containerData.elements.entries() : Object.entries(containerData.elements);
        for (const [elKey, el] of elEntries) {
          crawlElement(el, `${containerName}_${elKey}`);
        }
      }
    }

    // 4. Extract Workflow Alerts, Send Email text, and notifications
    const workflows = rawJson.workflows || rawJson.api_workflows || rawJson.backend_workflows || {};
    if (typeof workflows === 'object') {
      for (const [wfKey, wf] of Object.entries<any>(workflows)) {
        if (wf?.actions && typeof wf.actions === 'object') {
          const actions = Array.isArray(wf.actions) ? wf.actions : Object.values(wf.actions);
          for (const action of actions) {
            const aProps = (action as any)?.properties || action;
            if (aProps?.subject) addText(aProps.subject, `wf_${wfKey}_email_sub`, 'email', `Workflow: ${wfKey}`);
            if (aProps?.body) addText(aProps.body, `wf_${wfKey}_email_body`, 'email', `Workflow: ${wfKey}`);
            if (aProps?.message) addText(aProps.message, `wf_${wfKey}_msg`, 'notification', `Workflow: ${wfKey}`);
            if (aProps?.error_message) addText(aProps.error_message, `wf_${wfKey}_err`, 'error', `Workflow: ${wfKey}`);
          }
        }
      }
    }

    return items.length > 0 ? items : this.getSampleBubbleTexts();
  }

  public static getSampleBubbleTexts(): TranslationItem[] {
    return [
      {
        id: 'trans_1',
        key: 'nav_dashboard_title',
        sourceText: 'Welcome back to your workspace overview',
        category: 'ui',
        status: 'pending'
      },
      {
        id: 'trans_2',
        key: 'btn_upgrade_plan',
        sourceText: 'Upgrade to Pro to unlock unlimited team members',
        category: 'ui',
        status: 'pending'
      },
      {
        id: 'trans_3',
        key: 'err_invalid_credentials',
        sourceText: 'Invalid email address or password provided. Please check your credentials.',
        category: 'error',
        status: 'pending'
      },
      {
        id: 'trans_4',
        key: 'notify_payment_success',
        sourceText: 'Your payment of [amount] has been successfully processed.',
        category: 'notification',
        status: 'pending'
      },
      {
        id: 'trans_5',
        key: 'modal_delete_confirm',
        sourceText: 'Are you sure you want to permanently delete this project? This action cannot be undone.',
        category: 'ui',
        status: 'pending'
      },
      {
        id: 'trans_6',
        key: 'opt_user_role_admin',
        sourceText: 'Administrator (Full Workspace Permissions)',
        category: 'option_set',
        status: 'pending'
      }
    ];
  }
}
