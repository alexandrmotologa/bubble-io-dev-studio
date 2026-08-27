import { BubbleSchema, SeedExecutionPlan, SeedGraphNode } from '../../types';

export class RelationalSeederEngine {
  /**
   * Parses relational seed JSON and constructs execution DAG
   */
  public static parseAndPlan(seedData: Record<string, any[]>): SeedExecutionPlan {
    const nodes: SeedGraphNode[] = [];
    const types = Object.keys(seedData);
    const refMap = new Map<string, SeedGraphNode>();
    const circularRefs: { from: string; to: string; field: string }[] = [];

    // 1. First pass: Register all nodes and temporary references
    let autoRefCounter = 1;
    for (const [typeName, records] of Object.entries(seedData)) {
      if (!Array.isArray(records)) continue;

      for (const record of records) {
        const ref = record._ref || `@auto_${typeName.toLowerCase()}_${autoRefCounter++}`;
        const cleanData = { ...record };
        delete cleanData._ref;

        const node: SeedGraphNode = {
          ref,
          type: typeName,
          data: cleanData,
          dependencies: [],
          status: 'pending'
        };

        nodes.push(node);
        refMap.set(ref, node);
      }
    }

    // 2. Second pass: Extract dependencies from `@alias` references
    for (const node of nodes) {
      for (const [fieldKey, val] of Object.entries(node.data)) {
        if (typeof val === 'string' && val.startsWith('@')) {
          if (refMap.has(val) && val !== node.ref) {
            node.dependencies.push(val);
          }
        } else if (Array.isArray(val)) {
          for (const item of val) {
            if (typeof item === 'string' && item.startsWith('@') && refMap.has(item)) {
              node.dependencies.push(item);
            }
          }
        }
      }
      // Deduplicate dependencies
      node.dependencies = Array.from(new Set(node.dependencies));
    }

    // 3. Detect circular dependencies and compute execution steps
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const resolvedOrder: string[] = [];

    const hasCycle = (ref: string): boolean => {
      visited.add(ref);
      recStack.add(ref);

      const node = refMap.get(ref);
      if (node) {
        for (const depRef of node.dependencies) {
          if (!visited.has(depRef)) {
            if (hasCycle(depRef)) return true;
          } else if (recStack.has(depRef)) {
            // Circular reference found!
            circularRefs.push({ from: node.ref, to: depRef, field: 'relation' });
          }
        }
      }

      recStack.delete(ref);
      resolvedOrder.push(ref);
      return false;
    };

    for (const node of nodes) {
      if (!visited.has(node.ref)) {
        hasCycle(node.ref);
      }
    }

    // 4. Group into multi-stage execution steps (independent nodes first)
    const steps: { step: number; description: string; nodeRefs: string[] }[] = [];
    const pendingNodes = new Set(nodes.map(n => n.ref));
    const createdRefs = new Set<string>();
    let stepNum = 1;

    while (pendingNodes.size > 0) {
      const readyBatch: string[] = [];

      for (const ref of pendingNodes) {
        const node = refMap.get(ref)!;
        const allDepsSatisfied = node.dependencies.every(d => createdRefs.has(d) || circularRefs.some(c => c.from === ref && c.to === d));
        if (allDepsSatisfied) {
          readyBatch.push(ref);
        }
      }

      if (readyBatch.length === 0) {
        // Fallback for remaining circular dependencies
        const next = Array.from(pendingNodes)[0];
        readyBatch.push(next);
      }

      for (const ref of readyBatch) {
        pendingNodes.delete(ref);
        createdRefs.add(ref);
      }

      const typeSummary = Array.from(new Set(readyBatch.map(r => refMap.get(r)!.type))).join(', ');
      steps.push({
        step: stepNum++,
        description: `Create ${readyBatch.length} record(s) of type: ${typeSummary}`,
        nodeRefs: readyBatch
      });
    }

    // If circular references exist, add deferred 2-pass PATCH step
    if (circularRefs.length > 0) {
      steps.push({
        step: stepNum++,
        description: `2-Pass Deferred Resolution: PATCH ${circularRefs.length} circular relationship link(s)`,
        nodeRefs: circularRefs.map(c => c.from)
      });
    }

    return {
      totalRecords: nodes.length,
      types,
      nodes,
      circularRefs,
      steps
    };
  }

  /**
   * Validates seed schema against live or loaded Bubble schema
   */
  public static preflightCheck(
    seedData: Record<string, any[]>,
    schema: BubbleSchema
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const schemaTypesMap = new Map(schema.dataTypes.map(t => [t.name.toLowerCase(), t]));

    for (const [seedType, records] of Object.entries(seedData)) {
      const matchedType = schemaTypesMap.get(seedType.toLowerCase());
      if (!matchedType) {
        errors.push(`Type '${seedType}' defined in seed does not exist in Bubble schema.`);
        continue;
      }

      const fieldMap = new Map(matchedType.fields.map(f => [f.name.toLowerCase(), f]));

      for (const rec of records) {
        for (const [fieldKey, fieldVal] of Object.entries(rec)) {
          if (fieldKey === '_ref') continue;
          const matchedField = fieldMap.get(fieldKey.toLowerCase());
          if (!matchedField) {
            warnings.push(`Field '${fieldKey}' on type '${seedType}' is not in Bubble schema (will be created or ignored by Bubble).`);
          } else {
            // Check type matching
            if (typeof fieldVal === 'number' && matchedField.type === 'text') {
              warnings.push(`Number value provided for text field '${seedType}.${matchedField.name}'.`);
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Executes or simulates relational seeding step-by-step
   */
  public static async executePlan(
    plan: SeedExecutionPlan,
    onProgress?: (step: number, total: number, message: string) => void
  ): Promise<{ success: boolean; createdCount: number; createdRecords: Record<string, string> }> {
    const createdMap: Record<string, string> = {}; // ref -> realId

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      onProgress?.(i + 1, plan.steps.length, step.description);
      await new Promise(r => setTimeout(r, 350));

      for (const ref of step.nodeRefs) {
        if (!createdMap[ref]) {
          const fakeBubbleId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          createdMap[ref] = fakeBubbleId;
          const node = plan.nodes.find(n => n.ref === ref);
          if (node) {
            node.status = 'created';
            node.createdId = fakeBubbleId;
          }
        }
      }
    }

    return {
      success: true,
      createdCount: plan.nodes.length,
      createdRecords: createdMap
    };
  }

  /**
   * Sample catalog relational dataset for quick demo / testing
   */
  public static getSampleRelationalData(): Record<string, any[]> {
    return {
      Category: [
        { _ref: '@cat_electronics', Name: 'Electronics', Slug: 'electronics' },
        { _ref: '@cat_laptops', Name: 'Laptops', Slug: 'laptops', Parent_Category: '@cat_electronics' },
        { _ref: '@cat_accessories', Name: 'Accessories', Slug: 'accessories', Parent_Category: '@cat_electronics' }
      ],
      Product: [
        {
          _ref: '@prod_macbook',
          Title: 'MacBook Pro M3 Max 16"',
          Price: 3499,
          Category: '@cat_laptops',
          SKU: 'MBP-M3-16'
        },
        {
          _ref: '@prod_stand',
          Title: 'Aluminum Ergonomic Laptop Stand',
          Price: 69.99,
          Category: '@cat_accessories',
          SKU: 'ACC-STAND-01'
        }
      ],
      User: [
        { _ref: '@user_buyer', Email: 'alex.motologa@bubbledeveloper.com', First_Name: 'Alex', Role: 'Admin' }
      ],
      Order: [
        {
          _ref: '@order_1001',
          Order_Number: 'ORD-98214',
          Buyer: '@user_buyer',
          Products: ['@prod_macbook', '@prod_stand'],
          Total_Amount: 3568.99,
          Status: 'Processing'
        }
      ]
    };
  }
}
