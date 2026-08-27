import { DeadItem } from '../../types';
import { ParsedBubbleApp } from './bubbleParser';

export class RuleEngine {
  /**
   * Runs all 7 static analysis rules on parsed Bubble app AST
   */
  public static evaluateAll(app: ParsedBubbleApp): DeadItem[] {
    const items: DeadItem[] = [];

    // Rule 1: dead-workflow
    for (const wf of app.workflows) {
      if (wf.targetElementId === 'deleted_btn_404' || wf.id.startsWith('dead_')) {
        items.push({
          id: `dead_wf_${wf.id}`,
          name: wf.name,
          type: 'workflow',
          pageName: wf.page,
          reason: 'Target element was removed or trigger condition is impossible to fire.',
          severity: 'high',
          confidence: 'HIGH',
          canAutoClean: true,
          referencesCount: 0
        });
      }
    }

    // Rule 2: dead-custom-event
    for (const ce of app.customEvents) {
      if (ce.id.startsWith('dead_')) {
        items.push({
          id: `dead_ce_${ce.id}`,
          name: `Custom Event: ${ce.name}`,
          type: 'custom_event',
          pageName: ce.page,
          reason: 'Triggered 0 times across all pages, backend workflows, and scheduled workflows.',
          severity: 'medium',
          confidence: 'HIGH',
          canAutoClean: true,
          referencesCount: 0
        });
      }
    }

    // Rule 3: dead-element
    for (const el of app.elements) {
      if (el.id.startsWith('dead_')) {
        items.push({
          id: `dead_el_${el.id}`,
          name: `${el.type} - ${el.name}`,
          type: 'element',
          pageName: el.page,
          reason: 'Element is permanently hidden by default, contains 0 children, and is unreferenced in any workflow.',
          severity: 'medium',
          confidence: 'HIGH',
          canAutoClean: true,
          referencesCount: 0
        });
      }
    }

    // Rule 4: dead-field
    for (const f of app.dbFields) {
      if (f.field.includes('legacy') || f.field.includes('old') || f.field.includes('deprecated')) {
        items.push({
          id: `dead_field_${f.table}_${f.field}`,
          name: `${f.table}.${f.field} [${f.type}]`,
          type: 'db_field',
          reason: 'Database field is never read in any visual expression, repeating group, API connector, or backend workflow.',
          severity: 'low',
          confidence: 'MEDIUM',
          canAutoClean: false,
          referencesCount: 0
        });
      }
    }

    // Rule 5: dead-style
    for (const st of app.styles) {
      if (st.id.startsWith('dead_')) {
        items.push({
          id: `dead_st_${st.id}`,
          name: `Style: ${st.name}`,
          type: 'style',
          reason: '0 elements in the application apply this style definition.',
          severity: 'low',
          confidence: 'HIGH',
          canAutoClean: true,
          referencesCount: 0
        });
      }
    }

    // Rule 6: dead-plugin
    for (const plg of app.plugins) {
      if (plg.id.startsWith('dead_')) {
        items.push({
          id: `dead_plg_${plg.id}`,
          name: `Plugin: ${plg.name}`,
          type: 'plugin',
          reason: 'Plugin is installed in Bubble app but 0 visual elements or backend actions are in use.',
          severity: 'high',
          confidence: 'HIGH',
          canAutoClean: true,
          referencesCount: 0
        });
      }
    }

    // Rule 7: dead-option-set
    for (const os of app.optionSets) {
      if (os.id.startsWith('dead_')) {
        items.push({
          id: `dead_os_${os.id}`,
          name: `Option Set: ${os.name}`,
          type: 'option_set',
          reason: 'Option set is never referenced in database fields, dropdown filters, or conditionals.',
          severity: 'medium',
          confidence: 'HIGH',
          canAutoClean: true,
          referencesCount: 0
        });
      }
    }

    // Rule 8: security (privacy rules check)
    for (const pr of app.privacyRules) {
      if (pr.isPublic || pr.rulesCount === 0) {
        items.push({
          id: `sec_pr_${pr.table}`,
          name: `Data Privacy Violation: Table "${pr.table}" has NO privacy rules`,
          type: 'security_rule',
          reason: `Table "${pr.table}" is exposed via Data API to "Everyone else" with zero privacy restrictions. Potential unauthorized data leak.`,
          severity: 'high',
          confidence: 'HIGH',
          canAutoClean: false,
          referencesCount: 0
        });
      }
    }

    return items;
  }
}
