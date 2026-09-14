import { describe, it, expect } from 'vitest';
import { DbExporterEngine } from '../../src/core/devops/dbExporter';
import { BubbleSchema } from '../../src/types';

describe('DbExporterEngine - Full Migration Generator', () => {
  const mockSchema: BubbleSchema = {
    appName: 'Fintech SaaS',
    version: '1.0.0',
    dataTypes: [
      {
        name: 'User',
        fields: [
          { name: 'email', type: 'text', required: true },
          { name: 'is_admin', type: 'boolean' },
          { name: 'balance', type: 'number' }
        ]
      },
      {
        name: 'Transaction',
        fields: [
          { name: 'amount', type: 'number', required: true },
          { name: 'customer', type: 'custom.User' },
          { name: 'tags', type: 'text', isList: true }
        ]
      }
    ],
    optionSets: [
      {
        name: 'OrderStatus',
        options: ['Pending', 'Processing', 'Completed', 'Cancelled']
      }
    ]
  };

  it('should generate valid Supabase migration with RLS, UUIDs, and foreign keys', () => {
    const supabaseSql = DbExporterEngine.generateSupabaseMigration(mockSchema);

    expect(supabaseSql).toContain('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    expect(supabaseSql).toContain('CREATE TABLE IF NOT EXISTS public."user"');
    expect(supabaseSql).toContain('CREATE TABLE IF NOT EXISTS public."transaction"');
    expect(supabaseSql).toContain('ENABLE ROW LEVEL SECURITY;');
    expect(supabaseSql).toContain('CREATE POLICY "Allow authenticated read on user"');
    expect(supabaseSql).toContain('ALTER TABLE public."transaction" ADD CONSTRAINT "fk_transaction_customer"');
    expect(supabaseSql).toContain('FOREIGN KEY ("customer") REFERENCES public."user" ("_id")');
    expect(supabaseSql).toContain('handle_updated_at()');
  });

  it('should generate PostgreSQL transactional DDL with Option Set enums', () => {
    const pgSql = DbExporterEngine.generatePostgresFullMigration(mockSchema);

    expect(pgSql).toContain('BEGIN;');
    expect(pgSql).toContain('CREATE TYPE "orderstatus_enum" AS ENUM (\'Pending\', \'Processing\', \'Completed\', \'Cancelled\');');
    expect(pgSql).toContain('CREATE TABLE IF NOT EXISTS "user"');
    expect(pgSql).toContain('CREATE TABLE IF NOT EXISTS "transaction"');
    expect(pgSql).toContain('FOREIGN KEY ("customer") REFERENCES "user" ("_id")');
    expect(pgSql).toContain('COMMIT;');
  });

  it('should generate complete Prisma schema with relations and enums', () => {
    const prisma = DbExporterEngine.generatePrismaSchema(mockSchema);

    expect(prisma).toContain('generator client {');
    expect(prisma).toContain('datasource db {');
    expect(prisma).toContain('enum OrderStatus {');
    expect(prisma).toContain('model User {');
    expect(prisma).toContain('model Transaction {');
    expect(prisma).toContain('customerId String? @map("customer")');
    expect(prisma).toContain('customer User? @relation(fields: [customerId], references: [id])');
    expect(prisma).toContain('@@map("user")');
    expect(prisma).toContain('@@map("transaction")');
  });
});
