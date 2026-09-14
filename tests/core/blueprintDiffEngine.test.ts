import { describe, it, expect } from 'vitest';
import { BlueprintDiffEngine } from '../../src/core/blueprint-diff/blueprintDiffEngine';

describe('BlueprintDiffEngine', () => {
  const baseApp = {
    name: 'Version 1',
    pages: {
      index: {
        name: 'index',
        elements: { el1: { name: 'Hero' } },
        workflows: { wf1: { name: 'On Click', event_type: 'click', actions: [{}] } }
      }
    },
    data_types: {
      user: {
        fields: { email: { type: 'text' } }
      }
    }
  };

  const updatedApp = {
    name: 'Version 2',
    pages: {
      index: {
        name: 'index',
        elements: { el1: { name: 'Hero' }, el2: { name: 'Footer' } },
        workflows: { wf1: { name: 'On Click', event_type: 'click', actions: [{}, {}] } }
      },
      pricing: {
        name: 'pricing',
        elements: { card: { name: 'Pro Plan' } },
        workflows: {}
      }
    },
    data_types: {
      user: {
        fields: {
          email: { type: 'text' },
          stripe_id: { type: 'text' }
        }
      }
    }
  };

  it('should detect added pages, elements, workflows, and database fields', () => {
    const diff = BlueprintDiffEngine.compareBlueprints(baseApp, updatedApp);

    expect(diff.summary.totalChanges).toBeGreaterThan(0);
    expect(diff.summary.addedCount).toBeGreaterThan(0);

    const addedPricing = diff.items.find(i => i.category === 'page' && i.name === 'pricing');
    expect(addedPricing).toBeDefined();
    expect(addedPricing?.changeType).toBe('added');

    const addedField = diff.items.find(i => i.category === 'database' && i.name.includes('stripe_id'));
    expect(addedField).toBeDefined();
    expect(addedField?.changeType).toBe('added');
  });

  it('should generate markdown diff report correctly', () => {
    const diff = BlueprintDiffEngine.compareBlueprints(baseApp, updatedApp);
    const md = BlueprintDiffEngine.generateMarkdownReport(diff);

    expect(md).toContain('# Bubble.io Blueprint Diff Report');
    expect(md).toContain('🟢 ADDED');
    expect(md).toContain('pricing');
  });
});
