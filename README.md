# 🚀 Bubble.io Dev Studio

[![Version](https://img.shields.io/badge/Version-3.3.9-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-34-47848F.svg?style=flat&logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev/)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-informational.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Bubble.io Dev Studio** is the all-in-one enterprise desktop IDE and developer toolchain designed specifically for **Bubble.io** builders, agencies, and QA teams. It unifies live data management, visual workflow logic graphs, multi-provider AI localization, pixel-perfect visual regression testing, AST dead code elimination, security RBAC auditing, and 1-click technical documentation generation.

---

## 📥 Download Desktop App (v3.3.9 Pre-Built Binaries)

For developers and teams who want to run the desktop application directly without compiling from source:

| Platform | Download Link (v3.3.9 Production Stable) | Package Format | Architecture |
| :--- | :--- | :--- | :--- |
| **🪟 Windows** | [**Bubble.io-Dev-Studio-Setup-3.3.9.exe**](https://github.com/alexandrmotologa/bubble-io-dev-studio/releases/download/v3.3.9/Bubble.io-Dev-Studio-Setup-3.3.9.exe) • [Portable .exe](https://github.com/alexandrmotologa/bubble-io-dev-studio/releases/download/v3.3.9/Bubble.io-Dev-Studio-3.3.9.exe) | NSIS Setup / Portable | x64 |
| **🍎 macOS** | [**Bubble.io-Dev-Studio-3.3.9.dmg**](https://github.com/alexandrmotologa/bubble-io-dev-studio/releases/download/v3.3.9/Bubble.io-Dev-Studio-3.3.9.dmg) • [.zip](https://github.com/alexandrmotologa/bubble-io-dev-studio/releases/download/v3.3.9/Bubble.io-Dev-Studio-3.3.9-mac.zip) | Apple Disk Image / ZIP | Apple Silicon (M1–M4) & Intel |
| **🐧 Linux** | [**Bubble.io-Dev-Studio-3.3.9.AppImage**](https://github.com/alexandrmotologa/bubble-io-dev-studio/releases/download/v3.3.9/Bubble.io-Dev-Studio-3.3.9.AppImage) | AppImage format | x64 |

> 🚀 **GitHub Release Hub**: [**View Official v3.3.9 Release & Changelog on GitHub**](https://github.com/alexandrmotologa/bubble-io-dev-studio/releases/tag/v3.3.9) | [Latest Release](https://github.com/alexandrmotologa/bubble-io-dev-studio/releases/latest)
>
> 💡 **First-Time Windows Installation Note**: Because this is an open-source/indie release that is not signed with an enterprise EV certificate, Windows SmartScreen may show a prompt saying *"Windows protected your PC"*. Simply click **"More info"** ➔ **"Run anyway"** to launch the installer.

---

## 📚 Table of Contents
- [📥 Download Desktop App](#-download-desktop-app-v338-pre-built-binaries)
- [🌟 Architecture & Modules Overview](#-architecture--modules-overview)
- [⚡ Complete Blueprint Synchronization Matrix](#-complete-blueprint-synchronization-matrix)
- [🚀 Step-by-Step Quick Start Guide](#-step-by-step-quick-start-guide)
- [✨ Core Features & Capabilities](#-core-features--capabilities)
  - [1. ⚡ 1-Click Cloud Direct Sync & Collaborator Bot](#1-1-click-cloud-direct-sync--collaborator-bot)
  - [2. 🛠️ DevOps & Database Studio](#2-devops--database-studio-4-domain-architecture)
  - [3. 🔀 Visual Workflow Flowchart & Logic Visualizer](#3-visual-workflow-flowchart--logic-visualizer)
  - [4. 🛡️ Security & Privacy Rules Auditor (RBAC & Sandbox)](#4-security--privacy-rules-auditor-rbac--sandbox)
  - [5. ⚡ Workload Units (WU) & Query Profiler](#5-workload-units-wu--query-profiler)
  - [6. 🩺 AST Dead Code Detector & Health Scorer](#6-ast-dead-code-detector--health-scorer)
  - [7. 🌐 AI Localization Studio (7x Providers)](#7-ai-localization-studio-7x-providers)
  - [8. 📸 Visual QA & Multi-Viewport Suite](#8-visual-qa--multi-viewport-suite)
  - [9. 🔌 Webhooks, cURL & Plugin Action SDK Builder](#9-webhooks-curl--plugin-action-sdk-builder)
  - [10. 📚 1-Click Developer Documentation Book (DocGen)](#10-1-click-developer-documentation-book-docgen)
  - [11. 🔄 Native Auto-Update & Zero-Data-Loss Relaunch](#11-native-auto-update--zero-data-loss-relaunch)
- [⌨️ Global Keyboard Shortcuts](#️-global-keyboard-shortcuts)
- [📖 In-Depth Documentation Guides (`docs/`)](#-in-depth-documentation-guides-docs)
- [💻 Tech Stack](#-tech-stack)
- [🛠️ Local Development & Build](#️-local-development--build)
- [📄 License & Credits](#-license--credits)

---

## 🌟 Architecture & Modules Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   Bubble.io Dev Studio                                          │
├───────────────────┬───────────────────┬───────────────────┬───────────────────┬─────────────────┤
│ 🛠️ DevOps & Data  │ 🔀 Workflow Nodes │ 🛡️ Security & RBAC│ ⚡ WU Cost Profiler│ 🩺 Dead Code AST│
│   • Data Studio   │   • Flowchart Map │   • RBAC Matrix   │   • Search Audit  │   • DAG Tree    │
│   • ERD & Types   │   • Blocking Check│   • Role Sandbox  │   • Monthly Cost  │   • Health %    │
│   • Snapshots DB  │   • Mermaid Export│   • Public Scanner│   • N+1 Loop Check│   • Safe Purge  │
│   • CI/CD Presets │   • Step Drawer   │   • SARIF Reports │   • Optimizer     │   • Manifest    │
├───────────────────┼───────────────────┼───────────────────┼───────────────────┼─────────────────┤
│ 🌐 AI Translation │ 📸 Visual QA      │ 🔌 Webhooks & SDK │ 📚 DocGen Book    │ ⚡ Cloud Sync   │
│   • 7x AI Models  │   • Pixel Diff    │   • Webhook Logs  │   • Data Dict     │   • Bot Direct  │
│   • Memory Cache  │   • Basic Auth    │   • cURL to Bubble│   • Markdown/HTML │   • Downloads   │
│   • Bubble CSV    │   • Viewports     │   • Plugin Action │   • PDF Print     │   • Auto-Watcher│
└───────────────────┴───────────────────┴───────────────────┴───────────────────┴─────────────────┘
```

---

## ⚡ Application Blueprint Synchronization Matrix

Bubble.io Dev Studio supports **3 streamlined synchronization pathways** to ingest your application's AST (UI elements, workflows, pages, and database schemas) into the desktop workspace:

| Method | Mechanism | Prerequisites | Setup Effort | Target Use Case |
| :--- | :--- | :--- | :---: | :--- |
| **⚡ 1-Click Cloud Direct Sync** | Dedicated Cloud Sync microservice communicates via our collaborator bot (`bubbledevstudio.bot@gmail.com`). | Invite bot under Bubble *Settings ➔ Collaboration*. | ~30 seconds | Automated 1-click cloud sync without leaving the desktop IDE. |
| **📁 Local Auto-Detect Watcher** | Dev Studio background file watcher monitoring the OS `~/Downloads` directory. | None. Click *"Export application"* in Bubble *Settings ➔ General*. | Zero setup | Zero-configuration auto-import when manually exporting in browser. |
| **📄 Manual File Import** | Built-in drag-and-drop file dropzone. | Existing `.bubble` or `.json` file on disk. | Zero setup | Completely offline environments and historical version diffs. |

👉 *For full technical specifications, read the [Cloud Direct Sync Guide](docs/cloud-sync-guide.md).*

---

## 🚀 Step-by-Step Quick Start Guide

### Step 1: Connect Your Bubble Application
1. Launch **Bubble.io Dev Studio**.
2. Click **Connect Application** (or press `Ctrl+N` / `Cmd+N`) to open the **5-Step Connection Wizard**:
   - **Step 1: App Identity**: Enter your Application Name, Bubble App ID (or editor URL), Target Environment (`version-test` or `version-live`), and optional Custom Domain. Dev Studio runs an instant HTTP reachability test.
   - **Step 2: Authentication & Security**: Enter your Private API Bearer Token from Bubble (*Settings ➔ API ➔ Generate new API token*). Toggle Data API, automated backups, and PII privacy checks. Includes optional Agency Plan HTTP Basic Auth.
   - **Step 3: AI Model & Localization**: Select your preferred AI provider (Ollama for 100% offline free use, or Google Gemini, OpenAI, Claude, Groq, DeepSeek, xAI). Click *Test Connection* to verify credentials.
   - **Step 4: Application Blueprint (.bubble / JSON)**: Choose your sync method:
     - Click **⚡ 1-Click Cloud Sync** (after inviting `bubbledevstudio.bot@gmail.com` in Bubble *Settings ➔ Collaboration*), OR
     - Click **Open Bubble Settings > General** to trigger the Downloads Watcher and click *Export application* in Bubble, OR
     - Drag and drop your `.bubble` file into the dropzone.
   - **Step 5: Verification & Launch**: Review pre-flight diagnostic checklist and launch your workspace!

### Step 2: Manage Live Data in Data Studio
1. Open **DevOps & Database Studio ➔ Data Studio**.
2. Browse live database records in an Airtable/Supabase-style grid.
3. Double-click any cell to edit (`PATCH`), use the **Smart CSV/JSON Batch Importer**, or seed relational records using `@alias` foreign keys.

### Step 3: Run Security & Privacy Audits
1. Open **Security & RBAC Auditor**.
2. Inspect the **Role-Based Access Control (RBAC) Matrix** to find unauthenticated table exposures.
3. Switch personas in the **Role Access Simulator** (*Guest*, *Owner*, *Admin*) to view live record masking.
4. Copy ready-to-paste Bubble privacy expressions or export a **SARIF 2.1.0 JSON** report for GitHub CodeQL.

### Step 4: Detect Dead Code & Optimize Workload Units (WU)
1. Open **AST Dead Code Detector** to inspect your application health score (0–100%).
2. View unreferenced visual elements, unused custom events, and generate safe purge manifests.
3. Open **WU Cost Profiler** to identify unconstrained searches and N+1 repeating group loops.

---

## ✨ Core Features & Capabilities

### 1. ⚡ 1-Click Cloud Direct Sync & Collaborator Bot
* **Autonomous Microservice**: Hosted on a secure, dedicated Cloud Infrastructure microservice.
* **Official Export Protocol Priority**: Extracts application definitions directly via `https://bubble.io/appeditor/export/${branch}/${appId}.bubble`, providing 100% full AST fidelity (all pages, workflows, UI elements, and data models).
* **Compact Storage Optimization**: Files are saved directly to `~/Downloads/[appId]-cloud-sync.bubble` as compact JSON (~10.8 MB instead of 29.4 MB formatted), matching Bubble's official export size byte-for-byte.
* **Strict Security & Zero Data Leakage**: The bot **never** reads, queries, or touches live user records from your database. Bot session credentials reside in an isolated `.env` file on the private VM, protected by IP-based rate limiting (30 req / 15 min).

### 2. 🛠️ DevOps & Database Studio (4-Domain Architecture)
* **Categorized 4-Domain Layout**: Structured into **Data Studio**, **Schema & Flow**, **Backups & DevOps**, and **Dev Tools & CI/CD**.
* **Interactive Data Studio (Live Grid)**: Live CRUD explorer, inline cell editing (`PATCH`), record drawer, multi-column sorting, and JSON/CSV export.
* **Smart CSV & JSON Batch Importer**: Upload files with automatic column mapping, type conversion, and live batch progress tracking.
* **Relational Data Seeder (DAG & 2-Pass)**: Seed interconnected multi-table records using `_ref: "@alias"` references with automatic topological sorting and circular link resolution.
* **Interactive Visual SVG ERD**: Entity-relationship diagram with smooth Pan, Zoom, SVG export, and copyable Mermaid script.
* **TypeScript & Zod Studio**: Generate production `.d.ts` definitions, runtime Zod validation schemas, and a zero-dependency **Type-Safe Bubble API Client SDK**.
* **Selective Micro-Backups & Archival Hub**: Run full or table-scoped backups with **SHA-256 integrity checksums**, AES-256 encryption, and local JSON archive restore.
* **Point-in-Time Database Snapshots & Differential Search**: Capture table states before risky operations, search differential changes, and download Markdown/JSON audit diffs.
* **Schema Migrations (Schema-as-Code)**: Declarative lockfiles (`schema.lock.json`), multi-dialect DDL generators (**PostgreSQL/Supabase**, **MySQL/PlanetScale**, **SQLite/Turso**, **Google BigQuery**), and automated **DOWN Rollback SQL scripts**.
* **Dev vs Live Cross-Environment Sync**: Real-time schema drift comparison between `version-test` and `live`, dynamic drift risk indicator (`HIGH/MEDIUM/LOW`), and pre-release sign-off checklists.
* **CI/CD Pipeline Generator**: 4 production presets with 1-click `.yml` export for GitHub Actions and GitLab CI.

### 3. 🔀 Visual Workflow Flowchart & Logic Visualizer
* **Interactive Node Graphs**: Renders sequential workflow chains with color-coded nodes (*Triggers, Database Writes, Emails, API Calls, Navigation*).
* **Conditional Branch Inspector**: Visualizes `"Only when..."` constraints attached to workflows and individual actions.
* **Step-by-Step Action Drawer**: Lateral inspection drawer breaking down individual actions, properties, parameters, and expressions.
* **Performance Advisor**: Flags client-blocking actions (e.g. synchronous email sending on the frontend) and suggests server backend scheduling.
* **Mermaid Flowchart Export**: Copy-pasteable diagram syntax for pull requests and documentation.

### 4. 🛡️ Security & Privacy Rules Auditor (RBAC & Sandbox)
* **RBAC Access Matrix**: Automatic permission mapping across *Admin*, *Authenticated User*, and *Guest / Everyone Else*.
* **Role Access Simulator & Security Sandbox**: Interactive persona switcher (*Guest*, *Logged-in User*, *Record Owner*, *System Admin*) with visual record payload simulation (🟢 VISIBLE, 🟡 MASKED, 🔴 REDACTED).
* **"Everyone Else" Public Risk Scanner**: Detects unauthenticated table scraping risks via `/api/1.1/obj/` and categorizes tables into `CRITICAL RISK`, `UNPROTECTED`, and `HARDENED`.
* **Bubble Privacy Rules Generator**: Step-by-step remediation recipes with copyable Bubble rule expressions for the Bubble Data > Privacy editor.
* **Regulatory Compliance Posture**: Live compliance scorecard across **GDPR (Articles 5 & 32)**, **SOC 2 Type II**, **PCI-DSS**, and **HIPAA**.
* **Multi-Format Export**: Generates comprehensive **Executive Markdown Reports (.md)** and **SARIF 2.1.0 JSON** for GitHub CodeQL / CI/CD security scanning.

### 5. ⚡ Workload Units (WU) & Query Profiler
* **WU Monthly Cost Estimator**: Estimates monthly Workload Units and hosting costs based on data complexity.
* **Unconstrained Search Detection**: Identifies `Do a search for` queries lacking server-side constraints.
* **Client vs. Server Ratio**: Optimizes resource distribution between browser-executed queries and backend workers.

### 6. 🩺 AST Dead Code Detector & Health Scorer
* **Health Score & Grade**: Visual gauge (0–100%) with letter grading (`A+` to `F`).
* **Deep AST Scanner**: Traverses nested groups, popups, repeating groups, workflows, custom events, styles, and plugins.
* **DAG Dependency Graph**: Interactive visual tree displaying element-to-workflow relational dependencies.
* **Safe Cleanup Assistant**: Generates actionable purge manifests for unreferenced elements.

### 7. 🌐 AI Localization Studio (7x Providers)
* **Recursive `.bubble` String Extractor**: Extracts 100% of UI texts, input placeholders, button labels, tooltips, Option Sets, and workflow alerts.
* **7 AI Providers Supported**: Google Gemini, OpenAI (GPT-4o), Anthropic Claude (3.7 Sonnet), DeepSeek (V3/R1), Groq (Llama 3.3 70B), OpenRouter, and local Ollama.
* **Translation Memory**: IndexedDB hash caching to prevent duplicate translations and eliminate token waste.
* **Brand Glossary**: Enforces non-translatable brand terms and dynamic Bubble tokens (`[Current User]`).
* **Bubble CSV Export**: 1-Click export formatted for immediate import in Bubble Language Settings.

### 8. 📸 Visual QA & Multi-Viewport Suite
* **Multi-Device Matrix**: Synchronized testing across Desktop (`1920x1080`), Laptop (`1440x900`), Tablet (`768x1024`), and Mobile (`375x812`).
* **Pixel Regression Engine**: Pixel-by-pixel visual diff with pass/fail threshold indicators.
* **4 Inspection Modes**: Split-Screen Slider, Side-by-Side Zoom, Onion Skin Overlay (0–100% opacity), and Heatmap Discrepancy Highlight.
* **Agency Plan HTTP Basic Auth Bypass**: Seamless credential injection for password-protected Bubble apps.

### 9. 🔌 Webhooks, cURL & Plugin Action SDK Builder
* **Live Webhook Inspector**: Inspect incoming payloads, query parameters, and execution response codes.
* **cURL ➔ Bubble Connector Parser**: Convert standard curl snippets into Bubble API Connector configurations.
* **Plugin Action SDK Generator**: Generates typed Server-Side Actions (SSA), Client-Side Actions (CSA), TypeScript types, and `package.json` for Bubble Plugin Builder.

### 10. 📚 1-Click Developer Documentation Book (DocGen)
* **Dual-Mode Documentation**: Switch seamlessly between **[✨ AI Narrative Book]** (meaningful, business-oriented architectural manual) and **[📋 Raw Data Dictionary]** (concise table/field specs).
* **Interactive Formatted Reader**: In-app rich HTML preview with GitBook/Stripe-quality tables, typography, and badges, plus 1-click toggle to raw Markdown source.
* **Per-Chapter AI Re-generation & Refinement**: Re-synthesize individual chapters with live AI on demand, complete with an optional prompt refinement bar for custom focus (e.g. GDPR, security runbooks, webhook retry policies).
* **AI Chapter Co-Pilot**: Draft custom technical runbooks, disaster recovery plans, or integration guides with 1-click AI presets in the Custom Chapter Composer.
* **Semantic Domain Classifier**: Automatically classifies applications (*E-Commerce*, *B2B SaaS*, *CRM*, *Social Communities*) and deduces business missions and primary actor personas.
* **Narrative Architecture Chapters**: Executive Summary, Data Architecture & Entity Lifecycles, User Journeys & Workflow Automation Chains, and Zero-Trust Security Governance.
* **Multi-Format Export**: In-app reader, **Markdown (.md)**, **Standalone HTML Manual** with embedded Mermaid ERD, **JSON Architecture Spec**, and **Print-to-PDF**.

### 11. 🔄 Native Auto-Update & Zero-Data-Loss Relaunch
* **Seamless Distribution**: Powered by `electron-updater` and connected to official GitHub Releases (`alexandrmotologa/bubble-io-dev-studio`).
* **Live Progress Tracking**: Displays real-time download speed (MB/s) and percentage.
* **Persistent Update Prompt with Restart Later**: Displays a sleek persistent prompt with **"Restart Now"** or **"Restart Later"** options so active developer workflows are never interrupted.
* **Zero Data Loss Guarantee**: App executable binaries reside in `%LOCALAPPDATA%\Programs\bubble-io-dev-studio\`, while all user workspaces, API keys, database snapshots, and IndexedDB stores reside in `%APPDATA%\bubble-io-dev-studio\` and remain 100% intact across updates.

---

## ⌨️ Global Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + K` / `Cmd + K` | **Global Command Palette** (Quick navigation, actions, and project switcher) |
| `Ctrl + I` / `Cmd + I` | **Bubble AI Copilot** (Natural language query & regex generator) |
| `Ctrl + B` / `Cmd + B` | **Trigger Quick Database Backup** |
| `Ctrl + \`` | **Toggle Real-time Log Console Drawer** |

---

## 📖 In-Depth Documentation Guides (`docs/`)

Explore detailed engineering specifications and user manuals in the [`docs/`](docs/) directory:

- ⚡ [1-Click Cloud Direct Sync & Collaborator Bot Guide](docs/cloud-sync-guide.md)
- 🏛️ [System Architecture & Storage Specifications](docs/architecture.md)
- 🛠️ [DevOps & Database Studio Guide](docs/devops-guide.md)
- 🔀 [Workflow Flowchart & Logic Visualizer Guide](docs/workflows-guide.md)
- 🛡️ [Security & Privacy Rules Auditor Guide](docs/security-guide.md)
- ⚡ [Workload Units (WU) Profiler Guide](docs/wu-profiler-guide.md)
- 🌐 [AI Localization & Translation Studio Guide](docs/ai-localization-guide.md)
- 🔌 [Webhooks & API Studio Guide](docs/api-studio-guide.md)
- 📸 [Visual QA & Multi-Viewport Suite Guide](docs/visual-qa-guide.md)
- 📚 [DocGen Developer Book Guide](docs/docgen-guide.md)
- ⚙️ [Settings & Integrations Hub Guide](docs/settings-guide.md)

---

## 💻 Tech Stack

* **Core Desktop Shell**: [Electron 34](https://www.electronjs.org/) + TypeScript 5.7
* **Frontend Framework**: [React 18](https://react.dev/) + [Vite 6](https://vitejs.dev/)
* **Styling**: Native High-Performance CSS Variables & Modern Glassmorphism
* **Visual Graph Engines**: [Mermaid.js](https://mermaid.js.org/) (Interactive SVG Zoom & Flowcharts) + [Lucide Icons](https://lucide.dev/)
* **Local Persistence**: IndexedDB (Backups, Snapshots, Translation Memory) + LocalStorage (Project Store)
* **Cloud Sync Microservice**: Node.js 20+ Express Microservice on Cloud Infrastructure
* **Distribution & Updates**: `electron-updater` + GitHub Releases CI/CD

---

## 🛠️ Local Development & Build

### Prerequisites
* **Node.js**: `v20.0.0` or higher
* **npm**: `v10.0.0` or higher

### Local Development
```bash
# 1. Clone repository
git clone https://github.com/alexandrmotologa/bubble-io-dev-studio.git
cd bubble-io-dev-studio

# 2. Install dependencies
npm install

# 3. Start Vite dev server + Electron shell
npm run dev
```

### Type Checking & Production Build
```bash
# Run TypeScript compilation check
npm run typecheck

# Build Vite bundle
npm run build:vite

# Package Windows desktop installer
npm run dist:win
```

---

## 📄 License & Credits

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

<p align="center">
  <b>Bubble.io Dev Studio</b> • Built with ❤️ by <b><a href="https://mtlg.site">Alexandr Motologa</a></b> | <b><a href="https://mtlglabs.space">MTLG Labs</a></b>
</p>
<p align="center">
  <a href="https://mtlglabs.space">🧪 MTLG Labs Ecosystem</a> • 
  <a href="https://mtlg.site">🌐 Personal Portfolio</a> • 
  <a href="https://github.com/alexandrmotologa">🐙 GitHub</a>
</p>
