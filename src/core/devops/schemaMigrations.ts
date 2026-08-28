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

  /**
   * Generates SQL DDL migration statements for PostgreSQL, MySQL, SQLite, or BigQuery
   */
  public static generateSqlDdl(
    migration: SchemaMigration,
    dialect: 'postgres' | 'mysql' | 'sqlite' | 'bigquery' = 'postgres'
  ): string {
    let sql = `-- ==========================================================================\n`;
    sql += `-- Migration (UP): ${migration.version}_${migration.name}\n`;
    sql += `-- Description: ${migration.description || 'Schema change migration'}\n`;
    sql += `-- App: ${migration.app} (${migration.environment})\n`;
    sql += `-- Generated: ${migration.createdAt}\n`;
    sql += `-- Dialect: ${dialect.toUpperCase()}\n`;
    sql += `-- ==========================================================================\n\n`;

    const mapSqlType = (bubbleType: string): string => {
      const b = (bubbleType || 'text').toLowerCase();
      if (b.includes('[]') || b.includes('list')) return dialect === 'postgres' ? 'JSONB' : dialect === 'bigquery' ? 'ARRAY<STRING>' : 'JSON';
      if (b.includes('number') || b.includes('int')) return dialect === 'sqlite' ? 'INTEGER' : dialect === 'bigquery' ? 'NUMERIC' : 'NUMERIC';
      if (b.includes('date')) return dialect === 'postgres' ? 'TIMESTAMPTZ' : dialect === 'bigquery' ? 'TIMESTAMP' : 'DATETIME';
      if (b.includes('bool')) return dialect === 'sqlite' ? 'INTEGER' : 'BOOLEAN';
      if (b.includes('geo') || b.includes('address')) return dialect === 'postgres' ? 'JSONB' : 'JSON';
      return dialect === 'bigquery' ? 'STRING' : 'TEXT';
    };

    for (const c of migration.changes) {
      const tbl = c.table.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const fld = c.field ? c.field.toLowerCase().replace(/[^a-z0-9_]/g, '_') : '';
      const colType = mapSqlType(c.type || 'text');

      switch (c.action) {
        case 'ADD_TABLE':
          sql += `-- Create table ${c.table}\n`;
          if (dialect === 'bigquery') {
            sql += `CREATE TABLE IF NOT EXISTS \`${tbl}\` (\n`;
            sql += `    id STRING NOT NULL,\n`;
            sql += `    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),\n`;
            sql += `    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP()\n`;
            sql += `);\n\n`;
          } else {
            sql += `CREATE TABLE IF NOT EXISTS "${tbl}" (\n`;
            sql += `    "id" VARCHAR(64) PRIMARY KEY,\n`;
            sql += `    "created_date" ${mapSqlType('date')} DEFAULT CURRENT_TIMESTAMP,\n`;
            sql += `    "modified_date" ${mapSqlType('date')} DEFAULT CURRENT_TIMESTAMP\n`;
            sql += `);\n\n`;
          }
          break;
        case 'REMOVE_TABLE':
          sql += `-- Drop table ${c.table}\n`;
          if (dialect === 'bigquery') {
            sql += `DROP TABLE IF EXISTS \`${tbl}\`;\n\n`;
          } else {
            sql += `DROP TABLE IF EXISTS "${tbl}" CASCADE;\n\n`;
          }
          break;
        case 'ADD_FIELD':
          sql += `-- Add column ${c.field} to ${c.table}\n`;
          if (dialect === 'bigquery') {
            sql += `ALTER TABLE \`${tbl}\` ADD COLUMN IF NOT EXISTS ${fld} ${colType};\n\n`;
          } else {
            sql += `ALTER TABLE "${tbl}" ADD COLUMN IF NOT EXISTS "${fld}" ${colType};\n\n`;
          }
          break;
        case 'REMOVE_FIELD':
          sql += `-- Drop column ${c.field} from ${c.table}\n`;
          if (dialect === 'bigquery') {
            sql += `ALTER TABLE \`${tbl}\` DROP COLUMN IF EXISTS ${fld};\n\n`;
          } else {
            sql += `ALTER TABLE "${tbl}" DROP COLUMN IF EXISTS "${fld}";\n\n`;
          }
          break;
        case 'CHANGE_FIELD_TYPE':
          sql += `-- Modify column ${c.field} type on ${c.table}\n`;
          if (dialect === 'postgres') {
            sql += `ALTER TABLE "${tbl}" ALTER COLUMN "${fld}" TYPE ${colType} USING "${fld}"::${colType};\n\n`;
          } else if (dialect === 'bigquery') {
            sql += `-- BigQuery does not support direct column type changes without recreate\n`;
          } else {
            sql += `ALTER TABLE "${tbl}" MODIFY COLUMN "${fld}" ${colType};\n\n`;
          }
          break;
      }
    }

    return sql;
  }

  /**
   * Generates Rollback (DOWN) SQL DDL migration statements
   */
  public static generateDownSqlDdl(
    migration: SchemaMigration,
    dialect: 'postgres' | 'mysql' | 'sqlite' | 'bigquery' = 'postgres'
  ): string {
    let sql = `-- ==========================================================================\n`;
    sql += `-- Migration (DOWN - Rollback): ${migration.version}_${migration.name}\n`;
    sql += `-- Description: Reverts ${migration.name}\n`;
    sql += `-- App: ${migration.app} (${migration.environment})\n`;
    sql += `-- Dialect: ${dialect.toUpperCase()}\n`;
    sql += `-- ==========================================================================\n\n`;

    // Reverse order of changes for rollback
    const reversed = [...migration.changes].reverse();

    for (const c of reversed) {
      const tbl = c.table.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const fld = c.field ? c.field.toLowerCase().replace(/[^a-z0-9_]/g, '_') : '';

      switch (c.action) {
        case 'ADD_TABLE':
          sql += `-- Revert ADD_TABLE: Drop table ${c.table}\n`;
          sql += dialect === 'bigquery' ? `DROP TABLE IF EXISTS \`${tbl}\`;\n\n` : `DROP TABLE IF EXISTS "${tbl}" CASCADE;\n\n`;
          break;
        case 'REMOVE_TABLE':
          sql += `-- Revert REMOVE_TABLE: Recreate table ${c.table}\n`;
          sql += `CREATE TABLE IF NOT EXISTS "${tbl}" ("id" VARCHAR(64) PRIMARY KEY);\n\n`;
          break;
        case 'ADD_FIELD':
          sql += `-- Revert ADD_FIELD: Drop column ${c.field} from ${c.table}\n`;
          sql += dialect === 'bigquery' ? `ALTER TABLE \`${tbl}\` DROP COLUMN IF EXISTS ${fld};\n\n` : `ALTER TABLE "${tbl}" DROP COLUMN IF EXISTS "${fld}";\n\n`;
          break;
        case 'REMOVE_FIELD':
          sql += `-- Revert REMOVE_FIELD: Re-add column ${c.field} to ${c.table}\n`;
          sql += `ALTER TABLE "${tbl}" ADD COLUMN IF NOT EXISTS "${fld}" TEXT;\n\n`;
          break;
        case 'CHANGE_FIELD_TYPE':
          sql += `-- Revert CHANGE_FIELD_TYPE: Restore column ${c.field} type on ${c.table}\n`;
          if (c.previousType && dialect === 'postgres') {
            sql += `ALTER TABLE "${tbl}" ALTER COLUMN "${fld}" TYPE ${c.previousType};\n\n`;
          }
          break;
      }
    }

    return sql;
  }
}
