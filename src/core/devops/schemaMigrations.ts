import { BubbleDataType, BubbleSchema, MigrationChange, SchemaLockfile, SchemaMigration } from '../../types';

export class SchemaMigrationsEngine {
  /**
   * Creates a baseline lockfile snapshot from current schema
   */
  public static createLockfile(schema: BubbleSchema): SchemaLockfile {
    const tables: Record<string, { fields: Record<string, string> }> = {};

    for (const dt of schema.dataTypes) {
      const fields: Record<string, string> = {};
      for (const f of dt.fields) {
        fields[f.name] = `${f.type}${f.isList ? '[]' : ''}`;
      }
      tables[dt.name] = { fields };
    }

    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      app: schema.appName,
      tables
    };
  }

  /**
   * Generates declarative migration changes between baseline lockfile and current schema
   */
  public static generateMigration(
    name: string,
    description: string,
    currentSchema: BubbleSchema,
    lockfile: SchemaLockfile
  ): SchemaMigration {
    const changes: MigrationChange[] = [];
    const currentTableNames = new Set(currentSchema.dataTypes.map(t => t.name));
    const lockTableNames = new Set(Object.keys(lockfile.tables));

    // 1. Detect ADD_TABLE
    for (const dt of currentSchema.dataTypes) {
      if (!lockTableNames.has(dt.name)) {
        changes.push({
          action: 'ADD_TABLE',
          table: dt.name
        });
        // Also add all its initial fields
        for (const f of dt.fields) {
          changes.push({
            action: 'ADD_FIELD',
            table: dt.name,
            field: f.name,
            type: `${f.type}${f.isList ? '[]' : ''}`
          });
        }
      }
    }

    // 2. Detect REMOVE_TABLE
    for (const lockTableName of Object.keys(lockfile.tables)) {
      if (!currentTableNames.has(lockTableName)) {
        changes.push({
          action: 'REMOVE_TABLE',
          table: lockTableName
        });
      }
    }

    // 3. Detect ADD_FIELD, REMOVE_FIELD, CHANGE_FIELD_TYPE on existing tables
    for (const dt of currentSchema.dataTypes) {
      if (lockfile.tables[dt.name]) {
        const lockFields = lockfile.tables[dt.name].fields;
        const currentFields = new Map(dt.fields.map(f => [f.name, `${f.type}${f.isList ? '[]' : ''}`]));

        // New fields
        for (const [fName, fType] of currentFields.entries()) {
          if (!lockFields[fName]) {
            changes.push({
              action: 'ADD_FIELD',
              table: dt.name,
              field: fName,
              type: fType
            });
          } else if (lockFields[fName] !== fType) {
            changes.push({
              action: 'CHANGE_FIELD_TYPE',
              table: dt.name,
              field: fName,
              previousType: lockFields[fName],
              type: fType
            });
          }
        }

        // Removed fields
        for (const lockFieldName of Object.keys(lockFields)) {
          if (!currentFields.has(lockFieldName)) {
            changes.push({
              action: 'REMOVE_FIELD',
              table: dt.name,
              field: lockFieldName
            });
          }
        }
      }
    }

    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);

    return {
      version: timestamp,
      name: name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'migration',
      description,
      createdAt: new Date().toISOString(),
      app: currentSchema.appName,
      environment: currentSchema.version,
      changes
    };
  }

  /**
   * Provides sample initial migrations list for historical view
   */
  public static getSampleMigrations(appName: string): SchemaMigration[] {
    return [
      {
        version: '20260810140000',
        name: 'init_schema_baseline',
        description: 'Initial schema baseline with User, Product, Order and Category data types',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        app: appName,
        environment: 'version-live',
        changes: [
          { action: 'ADD_TABLE', table: 'User' },
          { action: 'ADD_FIELD', table: 'User', field: 'email', type: 'text' },
          { action: 'ADD_FIELD', table: 'User', field: 'role', type: 'option_set.user_role' },
          { action: 'ADD_TABLE', table: 'Product' },
          { action: 'ADD_FIELD', table: 'Product', field: 'title', type: 'text' },
          { action: 'ADD_FIELD', table: 'Product', field: 'price', type: 'number' },
          { action: 'ADD_TABLE', table: 'Order' },
          { action: 'ADD_TABLE', table: 'Category' }
        ]
      },
      {
        version: '20260818093000',
        name: 'add_order_stripe_charge_id',
        description: 'Add stripe_charge_id field for payment webhook reconciliation',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        app: appName,
        environment: 'version-test',
        changes: [
          { action: 'ADD_FIELD', table: 'Order', field: 'stripe_charge_id', type: 'text' },
          { action: 'ADD_FIELD', table: 'Product', field: 'inventory_count', type: 'number' }
        ]
      }
    ];
  }
}
