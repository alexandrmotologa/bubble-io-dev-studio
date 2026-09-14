import { describe, it, expect } from 'vitest';
import { CopilotEngine } from '../../src/core/ai/copilotEngine';
import { BubbleSchema } from '../../src/types';

describe('CopilotEngine', () => {
  const sampleSchema: BubbleSchema = {
    dataTypes: [
      {
        name: 'Order',
        fields: [
          { name: 'status', type: 'text' },
          { name: 'total', type: 'number' },
          { name: 'created_date', type: 'date' }
        ],
        recordCount: 1500
      },
      {
        name: 'Customer',
        fields: [
          { name: 'email', type: 'text' },
          { name: 'active', type: 'boolean' }
        ],
        recordCount: 320
      }
    ],
    optionSets: [
      {
        name: 'OrderStatus',
        options: ['Pending', 'Processing', 'Delivered', 'Cancelled']
      }
    ]
  };

  it('generates schema-aware search queries from natural language', async () => {
    const res = await CopilotEngine.generateSearchQuery(
      'find all active customers who have an email',
      sampleSchema
    );

    expect(res).toBeDefined();
    expect(res.targetType).toBe('Customer');
    expect(res.bubbleExpression).toContain('Customer');
    expect(res.optimizationTips).toBeDefined();
    expect(res.optimizationTips.length).toBeGreaterThan(0);
  });

  it('generates heuristic fallback query with field constraints when offline', async () => {
    const res = await CopilotEngine.generateSearchQuery(
      'show me orders with status delivered',
      sampleSchema
    );

    expect(res.targetType).toBe('Order');
    expect(res.bubbleExpression).toContain('Order');
    expect(res.constraints.length).toBeGreaterThan(0);
  });

  it('generates regex patterns with human-readable explanations', async () => {
    const res = await CopilotEngine.generateRegex('match a valid email address');

    expect(res).toBeDefined();
    expect(res.pattern).toBeDefined();
    expect(res.pattern.length).toBeGreaterThan(0);
    expect(res.explanation).toBeDefined();
    expect(res.sampleMatches.length).toBeGreaterThan(0);

    // Verify the regex pattern compiles without runtime error
    const compiled = new RegExp(res.pattern);
    expect(compiled).toBeInstanceOf(RegExp);
  });

  it('generates phone number regex with valid test cases', async () => {
    const res = await CopilotEngine.generateRegex('international phone number format');

    expect(res.pattern).toBeDefined();
    expect(res.sampleMatches.length).toBeGreaterThan(0);
  });
});
