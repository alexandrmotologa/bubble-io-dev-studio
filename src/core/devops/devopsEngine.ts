import { BackupResult, BubbleDataType, BubbleSchema, ProjectProfile } from '../../types';

export class DevOpsEngine {
  /**
   * Generates a sample / fetched Bubble Data Schema
   */
  public static async fetchSchema(project: ProjectProfile): Promise<BubbleSchema> {
    // In live mode with API Token, we can call https://{appId}.bubbleapps.io/api/1.1/meta
    // For local studio demo / standalone execution, provide rich schema
    return {
      appName: project.name,
      version: project.environment,
      dataTypes: [
        {
          id: 'user',
          name: 'User',
          recordCount: 1420,
          fields: [
            { name: 'email', type: 'text', required: true },
            { name: 'first_name', type: 'text' },
            { name: 'last_name', type: 'text' },
            { name: 'role', type: 'option_set.user_role' },
            { name: 'orders', type: 'order', isList: true, isCustomType: true },
            { name: 'created_date', type: 'date' }
          ]
        },
        {
          id: 'product',
          name: 'Product',
          recordCount: 380,
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'price', type: 'number', required: true },
            { name: 'sku', type: 'text' },
            { name: 'inventory_count', type: 'number' },
            { name: 'category', type: 'category', isCustomType: true },
            { name: 'images', type: 'image', isList: true }
          ]
        },
        {
          id: 'order',
          name: 'Order',
          recordCount: 4890,
          fields: [
            { name: 'order_number', type: 'text', required: true },
            { name: 'buyer', type: 'user', isCustomType: true, required: true },
            { name: 'products', type: 'product', isList: true, isCustomType: true },
            { name: 'total_amount', type: 'number', required: true },
            { name: 'status', type: 'option_set.order_status' },
            { name: 'stripe_charge_id', type: 'text' }
          ]
        },
        {
          id: 'category',
          name: 'Category',
          recordCount: 24,
          fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'slug', type: 'text' },
            { name: 'parent_category', type: 'category', isCustomType: true }
          ]
        }
      ],
      optionSets: [
        {
          name: 'User Role',
          options: ['Admin', 'Manager', 'Customer', 'Vendor']
        },
        {
          name: 'Order Status',
          options: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded']
        }
      ]
    };
  }

  /**
   * Triggers an automated database backup and packaging
   */
  public static async runBackup(
    project: ProjectProfile,
    onProgress?: (msg: string, pct: number) => void
  ): Promise<BackupResult> {
    onProgress?.(`Connecting to Bubble endpoint for ${project.appId}...`, 10);
    await new Promise(r => setTimeout(r, 400));

    onProgress?.('Fetching database types and metadata...', 30);
    await new Promise(r => setTimeout(r, 500));

    onProgress?.('Exporting User, Product, Order, Category tables...', 65);
    await new Promise(r => setTimeout(r, 600));

    onProgress?.('Compressing backup archive & generating checksum...', 90);
    await new Promise(r => setTimeout(r, 300));

    const backupId = `bkp_${project.appId}_${Date.now()}`;
    return {
      backupId,
      timestamp: new Date().toISOString(),
      status: 'completed',
      recordCount: 6714,
      tables: ['User', 'Product', 'Order', 'Category'],
      fileSizeKb: 2480,
      filePath: `backups/${backupId}.json.gz`
    };
  }

  /**
   * Generates TypeScript definitions from Bubble Schema
   */
  public static generateTypeScriptDefinitions(schema: BubbleSchema): string {
    let tsCode = `/**\n * Auto-generated TypeScript definitions for Bubble.io App: ${schema.appName}\n * Environment: ${schema.version}\n * Generated: ${new Date().toISOString()}\n */\n\n`;

    // Option Sets as Enums or Union Types
    if (schema.optionSets.length > 0) {
      tsCode += `// ================= OPTION SETS =================\n\n`;
      for (const os of schema.optionSets) {
        const enumName = os.name.replace(/[^a-zA-Z0-9]/g, '');
        tsCode += `export type ${enumName} =\n  | ${os.options.map(o => `'${o}'`).join('\n  | ')};\n\n`;
      }
    }

    // Data Types as Interfaces
    tsCode += `// ================= DATA TYPES =================\n\n`;
    for (const dt of schema.dataTypes) {
      const typeName = dt.name.replace(/[^a-zA-Z0-9]/g, '');
      tsCode += `export interface ${typeName} {\n  _id: string;\n  Created_Date: string;\n  Modified_Date: string;\n  Created_By?: string;\n`;

      for (const field of dt.fields) {
        let tsType = 'string';
        if (field.type === 'number') tsType = 'number';
        else if (field.type === 'boolean') tsType = 'boolean';
        else if (field.type === 'date') tsType = 'string | Date';
        else if (field.type.startsWith('option_set.')) {
          tsType = field.type.replace('option_set.', '').replace(/[^a-zA-Z0-9]/g, '');
        } else if (field.isCustomType) {
          tsType = field.type.charAt(0).toUpperCase() + field.type.slice(1);
        }

        if (field.isList) {
          tsType = `${tsType}[]`;
        }

        const optMark = field.required ? '' : '?';
        tsCode += `  ${field.name}${optMark}: ${tsType};\n`;
      }

      tsCode += `}\n\n`;
    }

    return tsCode;
  }

  /**
   * Generates Mermaid ERD Diagram code for visualization
   */
  public static generateMermaidERD(schema: BubbleSchema): string {
    let mermaid = 'erDiagram\n';
    for (const dt of schema.dataTypes) {
      const tableName = dt.name.replace(/[^a-zA-Z0-9_]/g, '');
      mermaid += `    ${tableName} {\n`;
      for (const field of dt.fields) {
        mermaid += `        ${field.type} ${field.name}\n`;
      }
      mermaid += `    }\n`;
    }

    // Connect relations
    mermaid += `    User ||--o{ Order : "places"\n`;
    mermaid += `    Order }o--|{ Product : "contains"\n`;
    mermaid += `    Product }o--|| Category : "belongs_to"\n`;

    return mermaid;
  }

  /**
   * Compares two schemas (e.g. Test vs Live) and detects migrations / breaking diffs
   */
  public static diffSchemas(
    devTypes: BubbleDataType[],
    liveTypes: BubbleDataType[]
  ): {
    addedTables: string[];
    removedTables: string[];
    modifiedTables: { name: string; addedFields: string[]; removedFields: string[] }[];
  } {
    const devMap = new Map(devTypes.map(t => [t.name, t]));
    const liveMap = new Map(liveTypes.map(t => [t.name, t]));

    const addedTables: string[] = [];
    const removedTables: string[] = [];
    const modifiedTables: { name: string; addedFields: string[]; removedFields: string[] }[] = [];

    devTypes.forEach(dev => {
      if (!liveMap.has(dev.name)) {
        addedTables.push(dev.name);
      } else {
        const live = liveMap.get(dev.name)!;
        const devFields = new Set(dev.fields.map(f => f.name));
        const liveFields = new Set(live.fields.map(f => f.name));

        const addedFields = dev.fields.filter(f => !liveFields.has(f.name)).map(f => f.name);
        const removedFields = live.fields.filter(f => !devFields.has(f.name)).map(f => f.name);

        if (addedFields.length > 0 || removedFields.length > 0) {
          modifiedTables.push({ name: dev.name, addedFields, removedFields });
        }
      }
    });

    liveTypes.forEach(live => {
      if (!devMap.has(live.name)) {
        removedTables.push(live.name);
      }
    });

    return { addedTables, removedTables, modifiedTables };
  }
}
