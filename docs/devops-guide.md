# 🛠️ DevOps & Database Studio Guide

The **DevOps & Database Studio** is an enterprise-grade toolchain for managing Bubble.io database schemas, live records, TypeScript bindings, automated backups, and environment releases.

---

## 🌟 2-Tier Structured Architecture

To provide a clean, distraction-free workflow, the module is organized into **4 Focused Core Domains**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              DevOps & Database Studio                                  │
├────────────────────┬────────────────────┬────────────────────┬─────────────────────────┤
│ 📊 Data Studio     │ 📑 Schema & Flow   │ 💾 Backups & DevOps│ 🛠️ Dev Tools & CI/CD   │
│   • Live Data Grid │   • Schema Explorer│   • Selective Back │   • 4x CI/CD Presets    │
│   • REPL Query     │   • Interactive ERD│   • SHA-256 Hashes │   • Multi-SQL Migration │
│   • Relational Seed│   • Step Flowchart │   • Snapshots Diff │   • SDK Scaffolder      │
│   • CSV/JSON Import│   • TypeScript/Zod │   • Down Rollbacks │   • Mock API & Trigger  │
│                    │   • API Client SDK │   • Dev vs Live    │                         │
└────────────────────┴────────────────────┴────────────────────┴─────────────────────────┘
```

---

## 1. Domain 1: Data Studio (`Data & Records`)

### 📊 Interactive Data Studio (Live Spreadsheet Grid)
* **Live CRUD Explorer**: Direct integration with Bubble's Data API (`/api/1.1/obj/[table]`).
* **📥 Smart CSV & JSON Batch Importer**: Upload `.csv` (RFC 4180) or `.json` (array of objects) files with automated column mapping, type casting (`number`, `boolean`, `date`), live progress tracking, and batch creation.
* **📖 Interactive In-App Template Guides**: Preview and copy ready-to-use CSV and JSON templates matching your selected table schema with 1-click `Download CSV` / `Download JSON` buttons.
* **Inline Cell Editing**: Double-click any cell or click the pencil icon to update fields in real-time (`PATCH`).
* **Deep Record Inspector**: Lateral drawer inspecting all fields, types, and raw JSON payloads.
* **Auto Exposure Warning**: If a table is not exposed under Bubble *Settings ➔ API ➔ Data API*, the studio automatically detects HTTP 404 and provides a 1-click checklist with Bubble settings deep-links.

### 🌱 Relational Data Seeder & DAG Resolver
* **Cross-Table Foreign Key Linking**: Define parent records using `"_ref": "@alias"` and reference them anywhere in child tables (e.g. `"owner": "@user_admin"`).
* **Automatic DAG Resolution**: Topologically sorts tables by dependency hierarchy, creates parents first, captures real Bubble `_id`s, and replaces `@alias` references with real IDs before creating dependent children.
* **2-Pass Deferred Resolution for Circular References**: Automatically detects circular dependencies and schedules deferred `PATCH` requests.

---

## 2. Domain 2: Schema & Flow (`Architecture & Types`)

### 📑 Schema Explorer & Option Sets
* Inspect custom data types, fields, nullability, list relations, and Option Sets with clean visual badges.

### 🕸️ Interactive SVG ERD Diagram
* Visual entity-relationship diagram with smooth Pan, Zoom In/Out, 1-Click SVG download, and copyable Mermaid.js script.

### 🔀 Workflow Flowchart Map & Step Drawer
* Interactive DAG node graph displaying workflow triggers, actions, database writes, and condition branches (`Only when...`).
* Includes a lateral action drawer breaking down individual action properties and parameters.

### 🏷️ TypeScript, Zod & SDK Studio
* **TypeScript Interfaces (`.d.ts`)**: Strict type-safe models for all database tables.
* **Zod Validation Schemas**: Runtime validation schemas for external API ingestion.
* **Type-Safe Bubble API Client SDK**: Zero-dependency TypeScript SDK with full CRUD methods for your schema.

---

## 3. Domain 3: Backups & DevOps (`Reliability & Migrations`)

### 💾 Selective Micro-Backups & Archival Hub
* Run full or table-scoped **Selective Micro-Backups** with row counts and compressed JSON exports.
* **SHA-256 Integrity Checksums**: Every backup generates a tamper-proof SHA-256 hash with 1-click clipboard copy.
* **Local JSON Archive Import & Restore**: Restore backups from previous `.json` archive files.

### 📸 Point-in-Time Snapshots & Differential Search
* Capture table states before risky operations into local IndexedDB.
* **Live Differential Search**: Filter added, modified, or deleted records in real-time.
* **Multi-Format Diff Export**: Export comparison diffs to **Markdown (`.md`)** or **JSON**.

### 📜 Schema Migrations (Schema-as-Code)
* Tracks schema changes against baseline `schema.lock.json`.
* **Multi-Dialect DDL Generator**: Generates database creation and migration scripts for:
  - 🐘 **PostgreSQL / Supabase**
  - 🐬 **MySQL / PlanetScale**
  - 🪶 **SQLite / Turso**
  - 📊 **Google BigQuery DDL**
* **DOWN Migration Rollback Script**: Automatically generates inverse SQL scripts to rollback schema changes safely.

### 🔄 Dev vs Live Cross-Environment Sync
* Compare table schemas between `version-test` and `version-live` to prevent schema drift.
* **Dynamic Environmental Drift Risk Badge**: Automatic calculation of `HIGH`, `MEDIUM`, or `LOW` deployment risk.
* **Pre-Release Checklist**: Interactive 0–100% verification tracker.
* **Sign-Off Report Export**: 1-click Markdown Sign-Off report ready for release documentation.

---

## 4. Domain 4: Dev Tools & CI/CD (`Tooling & Automation`)

### 🚀 CI/CD Pipeline Presets
Generate production-ready CI/CD pipelines with 1-click **Download Workflow (.yml)**:
1. 📦 **Scheduled Nightly Automated Database Backup**
2. 🛡️ **PR Schema Drift & Lockfile Verification Gate**
3. 🔐 **PII Privacy Rules & Security Vulnerability Gate**
4. ⚡ **Continuous Data Sync to Supabase / PostgreSQL**

Supports both **GitHub Actions** and **GitLab CI**.

### 🧱 Integration Template Scaffolder
Generates production-tested boilerplate with 1-click **Download TypeScript (.ts)**:
* **Bubble Plugin Server-Side Action (SSA)**
* **Type-Safe CRUD API Connector**
* **Webhook Receiver (Express)**
* **Type-Safe SDK Quickstart**
