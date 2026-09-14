# DevOps & Database Studio Guide

DevOps & Database Studio provides tools to manage Bubble.io database schemas, live records, TypeScript bindings, backups, and environment releases.

---

## Module Structure

The module is organized into four sections:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              DevOps & Database Studio                                  │
├────────────────────┬────────────────────┬────────────────────┬─────────────────────────┤
│ Data Studio        │ Schema & Flow      │ Backups & DevOps   │ Dev Tools & CI/CD       │
│   • Live Data Grid │   • Schema Explorer│   • Table Backups  │   • CI/CD Presets       │
│   • REPL Query     │   • Blueprint Sync │   • SHA-256 Hashes │   • Multi-SQL Migration │
│   • Relational Seed│   • Downloads Watch│   • Snapshots Diff │   • SDK Generator       │
│   • CSV/JSON Import│   • Interactive ERD│   • Down Rollbacks │   • Mock API Server     │
│                    │   • Flowchart Graph│   • Dev vs Live    │                         │
│                    │   • TypeScript/Zod │                    │                         │
└────────────────────┴────────────────────┴────────────────────┴─────────────────────────┘
```

---

## 1. Data Studio (Data & Records)

### Interactive Data Grid
* **Live CRUD Explorer**: Connects to Bubble's Data API (`/api/1.1/obj/[table]`) to view and query records.
* **CSV & JSON Batch Importer**: Import `.csv` or `.json` files with automatic column mapping, type casting (`number`, `boolean`, `date`), and progress indicators.
* **Template Guides**: Preview and download CSV and JSON templates matching your selected table schema.
* **Inline Editing**: Double-click any table cell to update values directly via `PATCH`.
* **Record Drawer**: Side panel to inspect all fields, types, and raw JSON payloads for any selected row.
* **Exposure Warning**: If a table is not enabled under Bubble *Settings > API > Data API*, the studio flags the HTTP 404 response and links to the relevant Bubble settings page.

### Relational Data Seeder
* **Cross-Table Foreign Key Linking**: Define parent records using `"_ref": "@alias"` and reference them in child tables (e.g., `"owner": "@user_admin"`).
* **Dependency Resolution**: Topologically sorts tables by dependency hierarchy, creates parents first, collects real Bubble `_id` values, and replaces `@alias` references before creating child records.
* **Circular Reference Handling**: Detects circular dependencies and resolves them using two-pass deferred `PATCH` requests.

---

## 2. Schema & Flow (Architecture & Types)

### Blueprint Synchronization
Import your application structure using three methods:
1. **Cloud Direct Sync**: Uses the sync service and collaborator account (`bubbledevstudio.bot@gmail.com`) to download the complete AST into `~/Downloads/[appId]-cloud-sync.bubble`.
2. **Downloads Watcher**: Monitors `~/Downloads` for exports downloaded from Bubble *Settings > General*.
3. **Manual File Import**: Select any `.bubble` or `.json` file from your local disk.

### Schema Explorer & Option Sets
Inspect custom data types, fields, nullability, list relations, and Option Sets with visual badges.

### Interactive SVG ERD Diagram
Entity-relationship diagram with pan, zoom controls, and export options:
* **Vector SVG**: Download scalable `.svg` files with inline styling.
* **High-Res PNG (2x Retina & 3x Ultra-DPI)**: Canvas-rasterized images with anti-aliasing on dark or light backgrounds.
* **Copy PNG to Clipboard**: Copy rendered diagram images directly to the system clipboard for pasting into Notion, Slack, or documentation.
* **Mermaid Syntax**: Copyable Mermaid.js source text.

### Workflow Flowchart Map
Interactive node graph displaying triggers, actions, database writes, and conditional branches (`Only when...`), with a side drawer for action properties and expressions. Flowcharts also support full Mermaid rendering with high-resolution SVG and PNG exports.

### TypeScript, Zod & SDK Studio
* **TypeScript Interfaces (`.d.ts`)**: Strict type definitions for database tables.
* **Zod Schemas**: Runtime validation schemas for external API inputs.
* **Type-Safe API Client SDK**: Zero-dependency TypeScript SDK with CRUD methods matching your schema.

---

## 3. Backups, DevOps & Migrations

### Table Backups
* Run full or table-specific backups with row counts and compressed JSON exports.
* **SHA-256 Checksums**: Generates a SHA-256 hash for each backup file to verify data integrity.
* **JSON Archive Restore**: Restore backups from previous `.json` export archives.

### Snapshots & Difference Auditing
* Save table states to local IndexedDB before making schema or bulk data changes.
* **Differential Search**: Filter records by added, modified, or deleted status.
* **Diff Export**: Export change summaries in Markdown (`.md`) or JSON.

### 1-Click Database Migration Generator
Extracts schema definitions from your Bubble project and generates migration scripts:
* **Supabase SQL**:
  - Enables `uuid-ossp` and `pgcrypto` extensions.
  - Generates `CREATE TABLE` definitions with `_id`, `created_date`, and `modified_date`.
  - Enables Row Level Security (`ENABLE ROW LEVEL SECURITY;`) with starter access policies for authenticated users.
  - Adds `handle_updated_at()` trigger functions to keep timestamps in sync.
  - Maps Bubble Option Sets to PostgreSQL `ENUM` types.
  - Adds foreign key constraints via `ALTER TABLE` after table creation, preventing circular dependency errors.
  - Creates B-tree indexes on foreign keys and creation dates.
* **Standard PostgreSQL**:
  - Wraps statements in an atomic transaction (`BEGIN; ... COMMIT;`).
  - Maps Bubble data types accurately (`number` to `NUMERIC`, `boolean` to `BOOLEAN`, `date` to `TIMESTAMPTZ`, `geographic address` to `JSONB`, `list of <type>` to `JSONB DEFAULT '[]'::jsonb`).
* **Prisma Schema (`schema.prisma`)**:
  - Generates models with `@id`, `@map("_id")`, and table attribute maps (`@@map("...")`).
  - Maps Bubble Option Sets to Prisma `enum` definitions.
  - Configures explicit relations with scalar ID fields and `@relation` references.

### Dev vs Live Cross-Environment Sync
* Compare table schemas between `version-test` and `version-live` to spot schema drift.
* **Drift Risk Indicator**: Calculates deployment risk as High, Medium, or Low.
* **Pre-Release Checklist**: Verification tracker for release sign-offs.
* **Sign-Off Reports**: Exports Markdown reports for release records.

---

## 4. Dev Tools & CI/CD (Tooling & Automation)

### CI/CD Pipeline Presets
Export workflow files for GitHub Actions or GitLab CI:
1. Scheduled Nightly Database Backup
2. PR Schema Drift and Lockfile Verification
3. Privacy Rules and Security Check
4. Continuous Data Sync to PostgreSQL / Supabase

### Code Boilerplate Generator
Download TypeScript templates for:
* Bubble Plugin Server-Side Action (SSA)
* Typed CRUD API Connector
* Webhook Receiver (Express)
* Type-Safe SDK Quickstart
