import { BubbleDataType, DbExportConfig } from '../../types';

export class DbExporterEngine {
  /**
   * Generates SQLite DDL table creation statement & INSERT queries
   */
  public static generateSqliteExport(dataType: BubbleDataType, sampleRecords: Record<string, any>[]): string {
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
   * Generates PostgreSQL DDL & Upsert statements
   */
  public static generatePostgresExport(dataType: BubbleDataType, sampleRecords: Record<string, any>[]): string {
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
}
