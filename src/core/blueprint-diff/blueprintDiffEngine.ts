import { BubbleParser, ParsedBubbleApp } from '../audit/bubbleParser';

export type DiffChangeType = 'added' | 'removed' | 'modified';

export interface BlueprintDiffItem {
  id: string;
  category: 'page' | 'element' | 'workflow' | 'database' | 'plugin' | 'option_set';
  name: string;
  location?: string;
  changeType: DiffChangeType;
  details?: string;
  before?: any;
  after?: any;
}

export interface BlueprintDiffSummary {
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  totalChanges: number;
  baseAppName: string;
  compareAppName: string;
}

export interface BlueprintDiffReport {
  timestamp: string;
  summary: BlueprintDiffSummary;
  items: BlueprintDiffItem[];
}

export class BlueprintDiffEngine {
  /**
   * Compares two raw .bubble JSON objects or parsed apps to detect structural differences.
   */
  public static compareBlueprints(baseJson: any, compareJson: any): BlueprintDiffReport {
    const baseApp: ParsedBubbleApp = BubbleParser.parse(baseJson);
    const compareApp: ParsedBubbleApp = BubbleParser.parse(compareJson);

    const items: BlueprintDiffItem[] = [];

    // 1. Compare Pages
    const basePagesMap = new Map(baseApp.pages.map(p => [p.name, p]));
    const comparePagesMap = new Map(compareApp.pages.map(p => [p.name, p]));

    for (const [name, p] of comparePagesMap.entries()) {
      if (!basePagesMap.has(name)) {
        items.push({
          id: `page_add_${name}`,
          category: 'page',
          name,
          changeType: 'added',
          details: `New page created with ${p.elementsCount} elements and ${p.workflowsCount} workflows`,
          after: p
        });
      } else {
        const basePage = basePagesMap.get(name)!;
        if (basePage.elementsCount !== p.elementsCount || basePage.workflowsCount !== p.workflowsCount) {
          items.push({
            id: `page_mod_${name}`,
            category: 'page',
            name,
            changeType: 'modified',
            details: `Elements: ${basePage.elementsCount} → ${p.elementsCount}, Workflows: ${basePage.workflowsCount} → ${p.workflowsCount}`,
            before: basePage,
            after: p
          });
        }
      }
    }

    for (const [name, p] of basePagesMap.entries()) {
      if (!comparePagesMap.has(name)) {
        items.push({
          id: `page_rem_${name}`,
          category: 'page',
          name,
          changeType: 'removed',
          details: `Page was deleted (${p.elementsCount} elements, ${p.workflowsCount} workflows removed)`,
          before: p
        });
      }
    }

    // 2. Compare Workflows
    const baseWfMap = new Map(baseApp.workflows.map(w => [`${w.page}::${w.name}`, w]));
    const compareWfMap = new Map(compareApp.workflows.map(w => [`${w.page}::${w.name}`, w]));

    for (const [key, w] of compareWfMap.entries()) {
      if (!baseWfMap.has(key)) {
        items.push({
          id: `wf_add_${key}`,
          category: 'workflow',
          name: w.name,
          location: w.page,
          changeType: 'added',
          details: `Event "${w.eventType}" created (${w.actionsCount} actions)`,
          after: w
        });
      } else {
        const baseWf = baseWfMap.get(key)!;
        if (baseWf.actionsCount !== w.actionsCount || baseWf.eventType !== w.eventType) {
          items.push({
            id: `wf_mod_${key}`,
            category: 'workflow',
            name: w.name,
            location: w.page,
            changeType: 'modified',
            details: `Actions: ${baseWf.actionsCount} → ${w.actionsCount}`,
            before: baseWf,
            after: w
          });
        }
      }
    }

    for (const [key, w] of baseWfMap.entries()) {
      if (!compareWfMap.has(key)) {
        items.push({
          id: `wf_rem_${key}`,
          category: 'workflow',
          name: w.name,
          location: w.page,
          changeType: 'removed',
          details: `Workflow deleted from page "${w.page}"`,
          before: w
        });
      }
    }

    // 3. Compare Database Fields & Data Types
    const baseFieldsMap = new Map(baseApp.dbFields.map(f => [`${f.table}.${f.field}`, f]));
    const compareFieldsMap = new Map(compareApp.dbFields.map(f => [`${f.table}.${f.field}`, f]));

    for (const [key, f] of compareFieldsMap.entries()) {
      if (!baseFieldsMap.has(key)) {
        items.push({
          id: `db_add_${key}`,
          category: 'database',
          name: `${f.table} → ${f.field}`,
          location: f.table,
          changeType: 'added',
          details: `Field added with type: ${f.type}`,
          after: f
        });
      } else {
        const baseField = baseFieldsMap.get(key)!;
        if (baseField.type !== f.type) {
          items.push({
            id: `db_mod_${key}`,
            category: 'database',
            name: `${f.table} → ${f.field}`,
            location: f.table,
            changeType: 'modified',
            details: `Type changed: ${baseField.type} → ${f.type}`,
            before: baseField,
            after: f
          });
        }
      }
    }

    for (const [key, f] of baseFieldsMap.entries()) {
      if (!compareFieldsMap.has(key)) {
        items.push({
          id: `db_rem_${key}`,
          category: 'database',
          name: `${f.table} → ${f.field}`,
          location: f.table,
          changeType: 'removed',
          details: `Field removed from table "${f.table}"`,
          before: f
        });
      }
    }

    // 4. Compare Plugins
    const basePluginMap = new Map(baseApp.plugins.map(p => [p.name, p]));
    const comparePluginMap = new Map(compareApp.plugins.map(p => [p.name, p]));

    for (const [name, p] of comparePluginMap.entries()) {
      if (!basePluginMap.has(name)) {
        items.push({
          id: `plug_add_${name}`,
          category: 'plugin',
          name,
          changeType: 'added',
          details: `Plugin installed (${p.actions.length} actions, ${p.elements.length} elements)`,
          after: p
        });
      }
    }

    for (const [name, p] of basePluginMap.entries()) {
      if (!comparePluginMap.has(name)) {
        items.push({
          id: `plug_rem_${name}`,
          category: 'plugin',
          name,
          changeType: 'removed',
          details: `Plugin uninstalled`,
          before: p
        });
      }
    }

    // 5. Compare Option Sets
    const baseOptMap = new Map(baseApp.optionSets.map(o => [o.name, o]));
    const compareOptMap = new Map(compareApp.optionSets.map(o => [o.name, o]));

    for (const [name, o] of compareOptMap.entries()) {
      if (!baseOptMap.has(name)) {
        items.push({
          id: `opt_add_${name}`,
          category: 'option_set',
          name,
          changeType: 'added',
          details: `Option Set added with ${o.options.length} options: ${o.options.slice(0, 3).join(', ')}`,
          after: o
        });
      } else {
        const baseOpt = baseOptMap.get(name)!;
        if (baseOpt.options.length !== o.options.length) {
          items.push({
            id: `opt_mod_${name}`,
            category: 'option_set',
            name,
            changeType: 'modified',
            details: `Options count changed: ${baseOpt.options.length} → ${o.options.length}`,
            before: baseOpt,
            after: o
          });
        }
      }
    }

    for (const [name, o] of baseOptMap.entries()) {
      if (!compareOptMap.has(name)) {
        items.push({
          id: `opt_rem_${name}`,
          category: 'option_set',
          name,
          changeType: 'removed',
          details: `Option Set deleted`,
          before: o
        });
      }
    }

    // Calculate Summary
    const addedCount = items.filter(i => i.changeType === 'added').length;
    const removedCount = items.filter(i => i.changeType === 'removed').length;
    const modifiedCount = items.filter(i => i.changeType === 'modified').length;

    return {
      timestamp: new Date().toISOString(),
      summary: {
        addedCount,
        removedCount,
        modifiedCount,
        totalChanges: items.length,
        baseAppName: baseApp.appName,
        compareAppName: compareApp.appName
      },
      items
    };
  }

  /**
   * Generates formatted Markdown report of the blueprint diff.
   */
  public static generateMarkdownReport(report: BlueprintDiffReport): string {
    const lines: string[] = [];
    lines.push(`# Bubble.io Blueprint Diff Report`);
    lines.push(`Generated: ${new Date(report.timestamp).toLocaleString()}`);
    lines.push(``);
    lines.push(`## Summary`);
    lines.push(`- **Baseline Workspace**: ${report.summary.baseAppName}`);
    lines.push(`- **Comparison Target**: ${report.summary.compareAppName}`);
    lines.push(`- **Total Differences**: ${report.summary.totalChanges}`);
    lines.push(`- 🟢 **Added**: ${report.summary.addedCount}`);
    lines.push(`- 🔴 **Removed**: ${report.summary.removedCount}`);
    lines.push(`- 🟡 **Modified**: ${report.summary.modifiedCount}`);
    lines.push(``);

    const categories: Array<{ key: BlueprintDiffItem['category']; label: string }> = [
      { key: 'page', label: 'Pages & Views' },
      { key: 'workflow', label: 'Workflows & Events' },
      { key: 'database', label: 'Database Schema & Fields' },
      { key: 'option_set', label: 'Option Sets' },
      { key: 'plugin', label: 'Installed Plugins' }
    ];

    for (const cat of categories) {
      const catItems = report.items.filter(i => i.category === cat.key);
      if (catItems.length === 0) continue;

      lines.push(`### ${cat.label} (${catItems.length})`);
      lines.push(`| Status | Name | Location | Details |`);
      lines.push(`| :--- | :--- | :--- | :--- |`);

      for (const item of catItems) {
        const badge = item.changeType === 'added' ? '🟢 ADDED' : item.changeType === 'removed' ? '🔴 REMOVED' : '🟡 MODIFIED';
        lines.push(`| ${badge} | **${item.name}** | ${item.location || '-'} | ${item.details || '-'} |`);
      }
      lines.push(``);
    }

    return lines.join('\n');
  }
}
