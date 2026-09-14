import { BubbleDataType, BubbleSchema, BubbleField, BubbleOptionSet } from '../../types';

export class DbExporterEngine {
  /**
   * Generates SQLite DDL table creation statement & INSERT queries for a single data type
   */
  public static generateSqliteExport(dataType: BubbleDataType, sampleRecords: Record<string, any>[] = []): string {
    const tableName = dataType.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    
    let sql = `-- ==========================================================\n`;
    sql += `-- SQLite Database Export for Bubble Data Type: ${dataType.name}\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += `-- ==========================================================\n\n`;

    sql += `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
    sql += `  "_id" TEXT PRIMARY KEY,\n`;
    sql += `  "created_date" TEXT,\n`;
    sql += `  "modified_date" TEXT,\n`;

    const fieldDefs: string[] = [];
    for (const f of dataType.fields) {
      let sqlType = 'TEXT';
      if (f.type === 'number') sqlType = 'REAL';
      else if (f.type === 'boolean') sqlType = 'INTEGER';
      
      fieldDefs.push(`  "${f.name}" ${sqlType}`);
    }

    sql += fieldDefs.join(',\n') + '\n);\n\n';

    // Generate INSERT statements for sample / exported records
    if (sampleRecords.length > 0) {
      sql += `-- INSERT ${sampleRecords.length} record(s)\n`;
      for (const rec of sampleRecords) {
        const cols = ['_id', ...dataType.fields.map(f => f.name)];
        const vals = cols.map(col => {
          const val = rec[col];
          if (val === undefined || val === null) return 'NULL';
          if (typeof val === 'number') return val;
          if (typeof val === 'boolean') return val ? 1 : 0;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return `'${String(val).replace(/'/g, "''")}'`;
        });

        sql += `INSERT OR REPLACE INTO "${tableName}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${vals.join(', ')});\n`;
      }
    }

    return sql;
  }

  /**
   * Generates PostgreSQL DDL & Upsert statements for a single data type
   */
  public static generatePostgresExport(dataType: BubbleDataType, sampleRecords: Record<string, any>[] = []): string {
    const tableName = dataType.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    let sql = `-- ==========================================================\n`;
    sql += `-- PostgreSQL Database Export for Bubble Data Type: ${dataType.name}\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += `-- ==========================================================\n\n`;

    sql += `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
    sql += `  "_id" VARCHAR(255) PRIMARY KEY,\n`;
    sql += `  "created_date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n`;
    sql += `  "modified_date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n`;

    const fieldDefs: string[] = [];
    for (const f of dataType.fields) {
      let pgType = 'TEXT';
      if (f.type === 'number') pgType = 'NUMERIC';
      else if (f.type === 'boolean') pgType = 'BOOLEAN';
      else if (f.type === 'date') pgType = 'TIMESTAMP WITH TIME ZONE';
      else if (f.isList) pgType = 'JSONB';

      fieldDefs.push(`  "${f.name}" ${pgType}`);
    }

    sql += fieldDefs.join(',\n') + '\n);\n\n';

    if (sampleRecords.length > 0) {
      sql += `-- Sample Batch Upsert\n`;
      for (const rec of sampleRecords) {
        const cols = ['_id', ...dataType.fields.map(f => f.name)];
        const vals = cols.map(col => {
          const val = rec[col];
          if (val === undefined || val === null) return 'NULL';
          if (typeof val === 'number') return val;
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
          return `'${String(val).replace(/'/g, "''")}'`;
        });

        const updateAssignments = dataType.fields.map(f => `"${f.name}" = EXCLUDED."${f.name}"`).join(', ');

        sql += `INSERT INTO "${tableName}" (${cols.map(c => `"${c}"`).join(', ')})\n`;
        sql += `VALUES (${vals.join(', ')})\n`;
        sql += `ON CONFLICT ("_id") DO UPDATE SET ${updateAssignments || '"modified_date" = NOW()'};\n\n`;
      }
    }

    return sql;
  }

  /**
   * Generates Google BigQuery Schema JSON and streaming payload
   */
  public static generateBigQueryExport(dataType: BubbleDataType, projectId: string = 'my-gcp-project', datasetId: string = 'bubble_data'): string {
    const tableName = `bubble_${dataType.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;

    const bqSchema = [
      { name: '_id', type: 'STRING', mode: 'REQUIRED', description: 'Unique Bubble record identifier' },
      { name: 'created_date', type: 'TIMESTAMP', mode: 'NULLABLE' },
      { name: 'modified_date', type: 'TIMESTAMP', mode: 'NULLABLE' },
      ...dataType.fields.map(f => {
        let bqType = 'STRING';
        if (f.type === 'number') bqType = 'FLOAT64';
        else if (f.type === 'boolean') bqType = 'BOOL';
        else if (f.type === 'date') bqType = 'TIMESTAMP';

        return {
          name: f.name.replace(/[^a-zA-Z0-9_]/g, '_'),
          type: bqType,
          mode: f.isList ? 'REPEATED' : f.required ? 'REQUIRED' : 'NULLABLE',
          description: `Imported from Bubble field ${f.name} (${f.type})`
        };
      })
    ];

    const cliCommand = `# BigQuery CLI Table Creation Command:\nbq mk --table \\\n  --description "Exported from Bubble.io ${dataType.name}" \\\n  ${projectId}:${datasetId}.${tableName} \\\n  schema.json\n\n`;

    return cliCommand + JSON.stringify(bqSchema, null, 2);
  }

  // ==========================================================================
  // ENTERPRISE 1-CLICK FULL DATABASE MIGRATION GENERATORS
  // ==========================================================================

  /**
   * Generates production-ready Supabase SQL Migration:
   * - Enables uuid-ossp extension
   * - Creates tables with RLS enabled
   * - Establishes Foreign Keys & Indexes
   * - Configures updated_at trigger and standard RLS policies
   */
  public static generateSupabaseMigration(schema: BubbleSchema): string {
    let sql = `-- ==========================================================\n`;
    sql += `-- SUPABASE MIGRATION SCRIPT (Bubble.io -> Supabase PostgreSQL)\n`;
    sql += `-- Application: ${schema.appName || 'Bubble App'}\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += `-- ==========================================================\n\n`;

    sql += `-- 1. Enable Essential Extensions\n`;
    sql += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n`;
    sql += `CREATE EXTENSION IF NOT EXISTS "pgcrypto";\n\n`;

    sql += `-- 2. Automatic Updated_At Trigger Function\n`;
    sql += `CREATE OR REPLACE FUNCTION public.handle_updated_at()\n`;
    sql += `RETURNS TRIGGER AS $$\n`;
    sql += `BEGIN\n`;
    sql += `  NEW.modified_date = NOW();\n`;
    sql += `  RETURN NEW;\n`;
    sql += `END;\n`;
    sql += `$$ LANGUAGE plpgsql;\n\n`;

    // Map of known table names for foreign key detection
    const tableNames = new Set(schema.dataTypes.map(d => this.formatTableName(d.name)));
    const foreignKeyStatements: string[] = [];
    const indexStatements: string[] = [];

    // 3. Create Tables
    sql += `-- 3. Tables & Columns Definition\n`;
    for (const dt of schema.dataTypes) {
      const tableName = this.formatTableName(dt.name);

      sql += `CREATE TABLE IF NOT EXISTS public."${tableName}" (\n`;
      sql += `  "_id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,\n`;
      sql += `  "created_date" TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n`;
      sql += `  "modified_date" TIMESTAMPTZ NOT NULL DEFAULT NOW()`;

      for (const field of dt.fields) {
        const colName = this.formatColumnName(field.name);
        const { pgType, isRef, refTarget } = this.resolvePgType(field, tableNames);

        sql += `,\n  "${colName}" ${pgType}`;

        // Register Foreign Key if field references another Bubble Data Type
        if (isRef && refTarget && refTarget !== tableName) {
          const fkName = `fk_${tableName}_${colName}`;
          foreignKeyStatements.push(
            `ALTER TABLE public."${tableName}" ADD CONSTRAINT "${fkName}" FOREIGN KEY ("${colName}") REFERENCES public."${refTarget}" ("_id") ON DELETE SET NULL;`
          );
          indexStatements.push(
            `CREATE INDEX IF NOT EXISTS "idx_${tableName}_${colName}" ON public."${tableName}" ("${colName}");`
          );
        }
      }

      sql += `\n);\n\n`;

      // Enable RLS for this table
      sql += `-- Enable Row Level Security (RLS) on ${tableName}\n`;
      sql += `ALTER TABLE public."${tableName}" ENABLE ROW LEVEL SECURITY;\n\n`;

      // Standard RLS Policies
      sql += `CREATE POLICY "Allow authenticated read on ${tableName}"\n`;
      sql += `  ON public."${tableName}" FOR SELECT\n`;
      sql += `  TO authenticated\n`;
      sql += `  USING (true);\n\n`;

      sql += `CREATE POLICY "Allow authenticated insert/update on ${tableName}"\n`;
      sql += `  ON public."${tableName}" FOR ALL\n`;
      sql += `  TO authenticated\n`;
      sql += `  USING (auth.uid() IS NOT NULL);\n\n`;

      // Add Updated_At trigger
      sql += `DROP TRIGGER IF EXISTS trg_${tableName}_updated_at ON public."${tableName}";\n`;
      sql += `CREATE TRIGGER trg_${tableName}_updated_at\n`;
      sql += `  BEFORE UPDATE ON public."${tableName}"\n`;
      sql += `  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();\n\n`;

      // Primary index on created_date
      indexStatements.push(
        `CREATE INDEX IF NOT EXISTS "idx_${tableName}_created_date" ON public."${tableName}" ("created_date" DESC);`
      );
    }

    // 4. Foreign Key Constraints
    if (foreignKeyStatements.length > 0) {
      sql += `-- 4. Relational Foreign Key Constraints\n`;
      sql += foreignKeyStatements.join('\n') + '\n\n';
    }

    // 5. Performance Indexes
    if (indexStatements.length > 0) {
      sql += `-- 5. Performance Indexes\n`;
      sql += indexStatements.join('\n') + '\n\n';
    }

    return sql;
  }

  /**
   * Generates full PostgreSQL Transactional DDL migration:
   * - ENUM types from Option Sets
   * - Foreign key references & composite indexes
   */
  public static generatePostgresFullMigration(schema: BubbleSchema): string {
    let sql = `-- ==========================================================\n`;
    sql += `-- POSTGRESQL DDL PRODUCTION MIGRATION SCRIPT\n`;
    sql += `-- Application: ${schema.appName || 'Bubble App'}\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += `-- ==========================================================\n\n`;

    sql += `BEGIN;\n\n`;

    // 1. Option Sets to Postgres ENUMs
    if (schema.optionSets && schema.optionSets.length > 0) {
      sql += `-- 1. Custom ENUM Types from Bubble Option Sets\n`;
      for (const os of schema.optionSets) {
        const enumName = `${this.formatTableName(os.name)}_enum`;
        const opts = os.options.map(o => `'${o.replace(/'/g, "''")}'`).join(', ');
        sql += `DO $$ BEGIN\n`;
        sql += `  CREATE TYPE "${enumName}" AS ENUM (${opts || "'default'"});\n`;
        sql += `EXCEPTION\n`;
        sql += `  WHEN duplicate_object THEN null;\n`;
        sql += `END $$;\n\n`;
      }
    }

    const tableNames = new Set(schema.dataTypes.map(d => this.formatTableName(d.name)));
    const foreignKeyStatements: string[] = [];
    const indexStatements: string[] = [];

    // 2. Tables & Fields
    sql += `-- 2. Tables Schema\n`;
    for (const dt of schema.dataTypes) {
      const tableName = this.formatTableName(dt.name);

      sql += `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
      sql += `  "_id" VARCHAR(255) PRIMARY KEY,\n`;
      sql += `  "created_date" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,\n`;
      sql += `  "modified_date" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`;

      for (const field of dt.fields) {
        const colName = this.formatColumnName(field.name);
        const { pgType, isRef, refTarget } = this.resolvePgType(field, tableNames);

        sql += `,\n  "${colName}" ${pgType}`;

        if (isRef && refTarget && refTarget !== tableName) {
          foreignKeyStatements.push(
            `ALTER TABLE "${tableName}" ADD CONSTRAINT "fk_${tableName}_${colName}" FOREIGN KEY ("${colName}") REFERENCES "${refTarget}" ("_id") ON DELETE SET NULL;`
          );
          indexStatements.push(
            `CREATE INDEX IF NOT EXISTS "idx_${tableName}_${colName}" ON "${tableName}" ("${colName}");`
          );
        }
      }

      sql += `\n);\n\n`;
      indexStatements.push(
        `CREATE INDEX IF NOT EXISTS "idx_${tableName}_created_date" ON "${tableName}" ("created_date");`
      );
    }

    if (foreignKeyStatements.length > 0) {
      sql += `-- 3. Foreign Keys\n`;
      sql += foreignKeyStatements.join('\n') + '\n\n';
    }

    if (indexStatements.length > 0) {
      sql += `-- 4. Indexes\n`;
      sql += indexStatements.join('\n') + '\n\n';
    }

    sql += `COMMIT;\n`;
    return sql;
  }

  /**
   * Generates Prisma Schema definition (schema.prisma)
   */
  public static generatePrismaSchema(schema: BubbleSchema): string {
    let prisma = `// ==========================================================\n`;
    prisma += `// PRISMA SCHEMA DEFINITION (Bubble.io Schema Migration)\n`;
    prisma += `// Application: ${schema.appName || 'Bubble App'}\n`;
    prisma += `// Generated: ${new Date().toISOString()}\n`;
    prisma += `// ==========================================================\n\n`;

    prisma += `generator client {\n`;
    prisma += `  provider = "prisma-client-js"\n`;
    prisma += `}\n\n`;

    prisma += `datasource db {\n`;
    prisma += `  provider = "postgresql"\n`;
    prisma += `  url      = env("DATABASE_URL")\n`;
    prisma += `}\n\n`;

    // 1. Option Sets as Prisma Enums
    if (schema.optionSets && schema.optionSets.length > 0) {
      prisma += `// Enums from Bubble Option Sets\n`;
      for (const os of schema.optionSets) {
        const enumName = this.toPascalCase(os.name);
        prisma += `enum ${enumName} {\n`;
        for (const opt of os.options) {
          const sanitized = opt.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
          prisma += `  ${sanitized}\n`;
        }
        prisma += `}\n\n`;
      }
    }

    const tableNames = new Set(schema.dataTypes.map(d => this.formatTableName(d.name)));

    // 2. Models
    for (const dt of schema.dataTypes) {
      const modelName = this.toPascalCase(dt.name);
      const tableName = this.formatTableName(dt.name);

      prisma += `model ${modelName} {\n`;
      prisma += `  id           String   @id @default(uuid()) @map("_id")\n`;
      prisma += `  createdDate  DateTime @default(now()) @map("created_date")\n`;
      prisma += `  modifiedDate DateTime @updatedAt @map("modified_date")\n`;

      for (const field of dt.fields) {
        const prismaFieldName = this.toCamelCase(field.name);
        const { prismaType, isRef, refModel } = this.resolvePrismaType(field, tableNames);

        if (isRef && refModel && refModel !== modelName) {
          // Foreign key scalar and relation field
          const foreignKeyField = `${prismaFieldName}Id`;
          prisma += `  ${foreignKeyField} String? @map("${this.formatColumnName(field.name)}")\n`;
          prisma += `  ${prismaFieldName} ${refModel}? @relation(fields: [${foreignKeyField}], references: [id])\n`;
        } else {
          const optionalMark = field.required ? '' : (field.isList ? '' : '?');
          const listMark = field.isList ? '[]' : '';
          prisma += `  ${prismaFieldName} ${prismaType}${listMark}${optionalMark} @map("${this.formatColumnName(field.name)}")\n`;
        }
      }

      prisma += `\n  @@map("${tableName}")\n`;
      prisma += `}\n\n`;
    }

    return prisma;
  }

  // ==========================================================================
  // HELPER FORMATTING FUNCTIONS
  // ==========================================================================

  private static formatTableName(name: string): string {
    return name.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
  }

  private static formatColumnName(name: string): string {
    return name.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
  }

  private static toPascalCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[^a-zA-Z0-9_]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('');
  }

  private static toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  private static resolvePgType(field: BubbleField, tableNames: Set<string>): { pgType: string; isRef: boolean; refTarget?: string } {
    if (field.isList) {
      return { pgType: 'JSONB DEFAULT \'[]\'::jsonb', isRef: false };
    }

    const typeLower = field.type.toLowerCase();

    // Check if type references custom datatype (e.g. custom.user or user)
    const cleanRef = typeLower.replace(/^custom\./, '');
    const formattedRef = this.formatTableName(cleanRef);
    if (tableNames.has(formattedRef)) {
      return { pgType: 'TEXT', isRef: true, refTarget: formattedRef };
    }

    switch (typeLower) {
      case 'number':
        return { pgType: 'NUMERIC', isRef: false };
      case 'boolean':
        return { pgType: 'BOOLEAN DEFAULT FALSE', isRef: false };
      case 'date':
        return { pgType: 'TIMESTAMPTZ', isRef: false };
      case 'file':
      case 'image':
        return { pgType: 'TEXT', isRef: false };
      case 'geographic_address':
      case 'geographic address':
        return { pgType: 'JSONB', isRef: false };
      default:
        return { pgType: 'TEXT', isRef: false };
    }
  }

  private static resolvePrismaType(field: BubbleField, tableNames: Set<string>): { prismaType: string; isRef: boolean; refModel?: string } {
    const typeLower = field.type.toLowerCase();
    const cleanRef = typeLower.replace(/^custom\./, '');
    const formattedRef = this.formatTableName(cleanRef);

    if (tableNames.has(formattedRef)) {
      return { prismaType: 'String', isRef: true, refModel: this.toPascalCase(cleanRef) };
    }

    switch (typeLower) {
      case 'number':
        return { prismaType: 'Float', isRef: false };
      case 'boolean':
        return { prismaType: 'Boolean', isRef: false };
      case 'date':
        return { prismaType: 'DateTime', isRef: false };
      case 'file':
      case 'image':
      case 'text':
        return { prismaType: 'String', isRef: false };
      case 'geographic_address':
      case 'geographic address':
        return { prismaType: 'Json', isRef: false };
      default:
        return { prismaType: field.isList ? 'Json' : 'String', isRef: false };
    }
  }
}
