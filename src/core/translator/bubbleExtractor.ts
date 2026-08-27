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

    // 1. Extract App Texts
    if (rawJson.app_texts) {
      for (const [key, textVal] of Object.entries<any>(rawJson.app_texts)) {
        if (typeof textVal === 'string' && textVal.trim()) {
          seenTexts.add(textVal);
          items.push({
            id: `apptext_${key}`,
            key,
            sourceText: textVal,
            category: 'ui',
            status: 'pending'
          });
        }
      }
    }

    // 2. Extract Option Sets
    if (rawJson.option_sets) {
      for (const [osKey, osData] of Object.entries<any>(rawJson.option_sets)) {
        if (osData.options && Array.isArray(osData.options)) {
          for (const opt of osData.options) {
            const optText = typeof opt === 'string' ? opt : opt.display || opt.value;
            if (optText && !seenTexts.has(optText)) {
              seenTexts.add(optText);
              items.push({
                id: `opt_${osKey}_${optText}`,
                key: `opt_${osKey}_${optText.replace(/[^a-zA-Z0-9]/g, '_')}`,
                sourceText: optText,
                category: 'option_set',
                status: 'pending'
              });
            }
          }
        }
      }
    }

    // 3. Extract inline page elements (Buttons, Text blocks, Placeholder inputs)
    if (rawJson.pages) {
      for (const [pageName, pageData] of Object.entries<any>(rawJson.pages)) {
        if (pageData.elements) {
          for (const [elKey, el] of Object.entries<any>(pageData.elements)) {
            const candidateText = el.text || el.placeholder || el.button_text || el.label;
            if (candidateText && typeof candidateText === 'string' && candidateText.length > 2 && !seenTexts.has(candidateText)) {
              seenTexts.add(candidateText);
              items.push({
                id: `elem_${pageName}_${elKey}`,
                key: `${pageName}_${elKey}`,
                sourceText: candidateText,
                category: 'ui',
                context: `Page: ${pageName}`,
                status: 'pending'
              });
            }
          }
        }
      }
    }

    return items;
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
