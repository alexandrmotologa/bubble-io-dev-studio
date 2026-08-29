# 🚀 Bubble.io Dev Studio

[![Version](https://img.shields.io/badge/Version-3.0.0-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-34-47848F.svg?style=flat&logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev/)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-informational.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Bubble.io Dev Studio** is the all-in-one enterprise desktop IDE and developer toolchain designed specifically for **Bubble.io** builders, agencies, and QA teams. It unifies live data management, visual workflow logic graphs, multi-provider AI localization, pixel-perfect visual regression testing, AST dead code elimination, security RBAC auditing, and 1-click technical documentation generation.

---

## 📥 Download Desktop App (v3.0.0 Pre-Built Binaries)

For developers and teams who want to run the desktop application directly without compiling from source:

| Platform | Download Link (v3.0.0 Production Stable) | Package Format | Architecture |
| :--- | :--- | :--- | :--- |
| **🪟 Windows** | [**Bubble.io.Dev.Studio.Setup.3.0.0.exe**](https://github.com/alexandrmotologa/bubble-io-dev-studio/releases/download/v3.0.0/Bubble.io.Dev.Studio.Setup.3.0.0.exe) • [Portable .exe](https://github.com/alexandrmotologa/bubble-io-dev-studio/releases/download/v3.0.0/Bubble.io.Dev.Studio.3.0.0.exe) | NSIS Setup / Portable | x64 |
| **🍎 macOS** | [**Bubble.io.Dev.Studio-3.0.0.dmg**](https://github.com/alexandrmotologa/bubble-io-dev-studio/releases/download/v3.0.0/Bubble.io.Dev.Studio-3.0.0.dmg) • [.zip](https://github.com/alexandrmotologa/bubble-io-dev-studio/releases/download/v3.0.0/Bubble.io.Dev.Studio-3.0.0-mac.zip) | Apple Disk Image / ZIP | Apple Silicon (M1/M2/M3/M4) & Intel |
| **🐧 Linux** | [**Bubble.io.Dev.Studio-3.0.0.AppImage**](https://github.com/alexandrmotologa/bubble-io-dev-studio/releases/download/v3.0.0/Bubble.io.Dev.Studio-3.0.0.AppImage) • [.deb](https://github.com/alexandrmotologa/bubble-io-dev-studio/releases/download/v3.0.0/bubble-io-dev-studio_3.0.0_amd64.deb) | AppImage / Debian package | x64 |

> 🚀 **GitHub Release Hub**: [**View Official v3.0.0 Release & Changelog on GitHub**](https://github.com/alexandrmotologa/bubble-io-dev-studio/releases/tag/v3.0.0) | [Latest Release](https://github.com/alexandrmotologa/bubble-io-dev-studio/releases/latest)
>
> 💡 **First-Time Windows Installation Note**: Because this is an open-source/indie release that is not signed with an expensive enterprise EV certificate, Windows SmartScreen may show a blue prompt saying *"Windows protected your PC"*. Simply click **"More info"** ➔ **"Run anyway"** to launch the installer.

---

## 📚 Table of Contents
- [📥 Download Desktop App](#-download-desktop-app-pre-built-binaries)
- [🌟 Architecture & Modules Overview](#-architecture--modules-overview)
- [✨ Core Features & Capabilities](#-core-features--capabilities)
  - [1. DevOps & Database Studio](#1-devops--database-studio-2-tier-categorized-architecture)
  - [2. Visual Workflow Flowchart & Logic Visualizer](#2-visual-workflow-flowchart--logic-visualizer)
  - [3. Security & Privacy Rules Auditor (RBAC & Sandbox)](#3-security--privacy-rules-auditor-rbac--sandbox)
  - [4. Workload Units (WU) & Query Profiler](#4-workload-units-wu--query-profiler)
  - [5. AST Dead Code Detector & Health Scorer](#5-ast-dead-code-detector--health-scorer)
  - [6. AI Localization Studio (7x Providers)](#6-ai-localization-studio-7x-providers)
  - [7. Visual QA & Multi-Viewport Suite](#7-visual-qa--multi-viewport-suite)
  - [8. Webhooks, cURL & Plugin Action SDK Builder](#8-webhooks-curl--plugin-action-sdk-builder)
  - [9. 1-Click Developer Documentation Book (DocGen)](#9-1-click-developer-documentation-book-docgen)
- [⌨️ Global Keyboard Shortcuts](#️-global-keyboard-shortcuts)
- [📖 In-Depth Documentation Guides (`docs/`)](#-in-depth-documentation-guides-docs)
- [💻 Tech Stack](#-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [📦 Packaging & Distribution](#-packaging--distribution)

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
│ 🌐 AI Translation │ 📸 Visual QA      │ 🔌 Webhooks & SDK │ 📚 DocGen Book    │ 🤖 AI Copilot   │
│   • 7x AI Models  │   • Pixel Diff    │   • Webhook Logs  │   • Data Dict     │   • Query Gen   │
│   • Memory Cache  │   • Basic Auth    │   • cURL to Bubble│   • Markdown/HTML │   • Regex Helper│
│   • Bubble CSV    │   • Viewports     │   • Plugin Action │   • PDF Print     │   • AST Insights│
└───────────────────┴───────────────────┴───────────────────┴───────────────────┴─────────────────┘
```

---

## ✨ Core Features & Capabilities

### 1. DevOps & Database Studio (2-Tier Categorized Architecture)
* **Categorized 4-Domain Layout**: Structured into **Data Studio**, **Schema & Flow**, **Backups & DevOps**, and **Dev Tools & CI/CD** for zero cognitive clutter.
* **Interactive Data Studio (Live Grid)**: Airtable/Supabase-style visual grid for live Bubble Data API records. Includes inline cell editing (`PATCH`), new record modal, multi-column sorting, search, deep record inspection drawer, and CSV/JSON export.
* **📥 Smart CSV & JSON Batch Importer**: Upload `.csv` or `.json` files with automated column mapping, type conversion, live progress tracking, and batch creation.
* **🌱 Relational Data Seeder (DAG & 2-Pass Resolution)**: Seed interconnected multi-table datasets using `_ref: "@alias"` references with automatic topological sorting and circular link resolution.
* **Interactive Visual SVG ERD**: Visual entity-relationship diagram with smooth Pan, Zoom In/Out, SVG export, and copyable Mermaid diagram script.
* **TypeScript & Zod Studio**: Generate production-grade `.d.ts` definitions, Zod validation schemas, and a zero-dependency **Type-Safe Bubble API Client SDK**.
* **Backup & Restore Hub (IndexedDB Persisted)**: Run full or selective micro-backups with table scoping, tamper-proof **SHA-256 integrity checksums**, AES-256 passphrase encryption, local storage, and JSON archive import/restore.
* **Point-in-Time Database Snapshots & Differential Search**: Capture table states before risky operations, search differential changes in real-time, and download Markdown (`.md`) or JSON audit diffs.
* **Schema Migrations (Schema-as-Code)**: Declarative lockfiles (`schema.lock.json`), multi-dialect DDL generators (**PostgreSQL/Supabase**, **MySQL/PlanetScale**, **SQLite/Turso**, **Google BigQuery**), and automated **DOWN Rollback SQL scripts**.
* **Dev vs Live Sync & Sign-off**: Real-time schema drift comparisons between `version-test` and `live`, dynamic drift risk indicator (`HIGH/MEDIUM/LOW`), 0-100% pre-release checklist, and downloadable Markdown Sign-Off report.
* **CI/CD Pipeline Generator**: 4 production presets (*Nightly Automated Backup, PR Schema Drift Gate, PII Security Gate, Supabase/PostgreSQL Continuous Sync*) with GitHub Actions / GitLab CI export and 1-click `.yml` download.
* **Integration Template Scaffolder**: Instant boilerplate generator for Bubble Plugin Server-Side Actions (Node.js), CRUD API Connectors (TypeScript), Webhook Receivers (Express), and Type-Safe SDK Quickstarts with 1-click `.ts` download.

### 2. Visual Workflow Flowchart & Logic Visualizer
* **Interactive Node Graphs**: Renders sequential workflow chains with color-coded nodes for *Triggers, Database Writes, Emails, API Calls, and Navigation*.
* **Conditional Branch Inspector**: Visualizes `"Only when..."` constraints attached to workflows and individual actions.
* **Step-by-Step Action Drawer**: Lateral inspection drawer breaking down individual actions, properties, parameters, and expressions.
* **Performance Advisor**: Flags client-blocking actions (e.g. synchronous email sending on the frontend) and suggests server backend scheduling.
* **Mermaid Flowchart Export**: Copy-pasteable diagram syntax for pull requests and documentation.

### 3. Security & Privacy Rules Auditor (RBAC & Sandbox)
* **RBAC Access Matrix**: Automatic permission mapping across *Admin*, *Authenticated User*, and *Guest / Everyone Else* with filtered views (`Restricted Only`) and detail inspection modals.
* **🎛️ Role Access Simulator & Security Sandbox**: Interactive persona switcher (*Guest*, *Other Authenticated User*, *Record Owner*, *System Administrator*) with live visual record payload simulation (🟢 VISIBLE, 🟡 MASKED, 🔴 REDACTED) and search query verdicts.
* **🚨 "Everyone Else" Public Risk Scanner**: Detects unauthenticated table scraping risks via `/api/1.1/obj/` and categorizes tables into `CRITICAL RISK`, `UNPROTECTED`, and `HARDENED`.
* **💡 Bubble Privacy Rules Generator**: Step-by-step remediation recipes with copyable Bubble rule expressions for the Bubble Data > Privacy editor.
* **⚖️ Regulatory Compliance Posture**: Live compliance scorecard across **GDPR (Articles 5 & 32)**, **SOC 2 Type II**, **PCI-DSS**, and **HIPAA**.
* **Multi-Format Export**: Generates comprehensive **Executive Markdown Reports (.md)** and **SARIF 2.1.0 JSON** for GitHub CodeQL / CI/CD security scanning.

### 4. Workload Units (WU) & Query Profiler
* **WU Monthly Cost Estimator**: Estimates monthly Workload Units and hosting costs based on data complexity.
* **Unconstrained Search Detection**: Identifies `Do a search for` queries lacking server-side constraints.
* **Client vs. Server Ratio**: Optimizes resource distribution between browser-executed queries and backend workers.

### 5. AST Dead Code Detector & Health Scorer
* **Health Score & Grade**: Visual gauge (0–100%) with letter grading (`A+` to `F`).
* **Deep AST Scanner**: Traverses nested groups, popups, repeating groups, workflows, custom events, styles, and plugins.
* **DAG Dependency Graph**: Interactive visual tree displaying element-to-workflow relational dependencies.
* **Safe Cleanup Assistant**: Generates actionable purge manifests for unreferenced elements.

### 6. AI Localization Studio (7x Providers)
* **Recursive `.bubble` String Extractor**: Extracts 100% of UI texts, input placeholders, button labels, tooltips, Option Sets, and workflow alerts.
* **7 AI Providers Supported**: Google Gemini, OpenAI (GPT-4o), Anthropic Claude (3.7 Sonnet), DeepSeek (V3/R1), Groq (Llama 3.3 70B), OpenRouter, and local Ollama.
* **Translation Memory**: IndexedDB hash caching to prevent duplicate translations and eliminate token waste.
* **Brand Glossary**: Enforces non-translatable brand terms and dynamic Bubble tokens (`[Current User]`).
* **Bubble CSV Export**: 1-Click export formatted for immediate import in Bubble Language Settings.

### 7. Visual QA & Multi-Viewport Suite
* **Multi-Device Matrix**: Synchronized testing across Desktop (`1920x1080`), Laptop (`1440x900`), Tablet (`768x1024`), and Mobile (`375x812`).
* **Pixel Regression Engine**: Pixel-by-pixel visual diff with pass/fail threshold indicators.
* **3 Inspection Modes**: Split-Screen Slider, Side-by-Side Zoom, and Onion Skin Overlay (0–100% opacity).
* **Agency Plan HTTP Basic Auth Bypass**: Seamless credential injection for password-protected Bubble apps.

### 8. Webhooks, cURL & Plugin Action SDK Builder
* **Live Webhook Inspector**: Inspect incoming payloads, query parameters, and execution response codes.
* **cURL ➔ Bubble Connector Parser**: Convert standard curl snippets into Bubble API Connector configurations.
* **Plugin Action SDK Generator**: Generates typed Server-Side Actions (SSA), Client-Side Actions (CSA), TypeScript types, and `package.json` for Bubble Plugin Builder.

### 9. 1-Click Developer Documentation Book (DocGen)
* **Comprehensive Chapters**: Generates Executive Summary, Data Dictionary, ERD Diagram, Privacy Rules Matrix, API Catalog, Localization Status, and AST Quality Scorecard.
* **Multi-Format Export**: Searchable in-app reader, **Markdown (.md)**, **Standalone HTML Manual**, and **Print-to-PDF**.

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

Explore detailed engineering specifications and user manuals in the [`docs/`](file:///b:/workgit/bubble-io-dev-studio/docs) directory:

- 🏛️ [System Architecture & Storage Specifications](file:///b:/workgit/bubble-io-dev-studio/docs/architecture.md)
- 🛠️ [DevOps & Database Studio Guide](file:///b:/workgit/bubble-io-dev-studio/docs/devops-guide.md)
- 🔀 [Workflow Flowchart & Logic Visualizer Guide](file:///b:/workgit/bubble-io-dev-studio/docs/workflows-guide.md)
- 🛡️ [Security & Privacy Rules Auditor Guide](file:///b:/workgit/bubble-io-dev-studio/docs/security-guide.md)
- ⚡ [Workload Units (WU) Profiler Guide](file:///b:/workgit/bubble-io-dev-studio/docs/wu-profiler-guide.md)
- 🌐 [AI Localization & Translation Studio Guide](file:///b:/workgit/bubble-io-dev-studio/docs/ai-localization-guide.md)
- 🔌 [Webhooks & API Studio Guide](file:///b:/workgit/bubble-io-dev-studio/docs/api-studio-guide.md)
- 📸 [Visual QA & Multi-Viewport Suite Guide](file:///b:/workgit/bubble-io-dev-studio/docs/visual-qa-guide.md)
- 📚 [DocGen Developer Book Guide](file:///b:/workgit/bubble-io-dev-studio/docs/docgen-guide.md)
- ⚙️ [Settings & Integrations Hub Guide](file:///b:/workgit/bubble-io-dev-studio/docs/settings-guide.md)

---

## 💻 Tech Stack

* **Core Desktop Shell**: [Electron 34](https://www.electronjs.org/) + TypeScript 5.7
* **Frontend Framework**: [React 18](https://react.dev/) + [Vite 6](https://vitejs.dev/)
* **Styling**: Native High-Performance CSS Variables & Modern Glassmorphism
* **Visual Graph Engines**: [Mermaid.js](https://mermaid.js.org/) (Interactive SVG Zoom & Flowcharts) + [Lucide Icons](https://lucide.dev/)
* **Local Persistence**: IndexedDB (Backups, Snapshots, Translation Memory) + LocalStorage (Project Store)
* **Testing & Automation**: Vitest + Native Headless Chromium QA Suite

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: `v20.0.0` or higher
* **npm**: `v10.0.0` or higher

### Local Development
```bash
# 1. Clone the repository
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

# Build Vite web bundle
npm run build:vite

# Package Windows desktop installer
npm run dist:win
```

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](file:///b:/workgit/bubble-io-dev-studio/LICENSE) for more information.

---

<p align="center">
  <b>Bubble.io Dev Studio</b> • Built with ❤️ by <b><a href="https://mtlg.site">Alexandr Motologa</a></b> | <b><a href="https://mtlglabs.space">MTLG Labs</a></b>
</p>
<p align="center">
  <a href="https://mtlglabs.space">🧪 MTLG Labs Ecosystem</a> • 
  <a href="https://mtlg.site">🌐 Personal Portfolio</a> • 
  <a href="https://github.com/alexandrmotologa">🐙 GitHub</a> • 
  <a href="https://buymeacoffee.com/mtlg">☕ Buy Me a Coffee</a> • 
  <a href="mailto:contact@mtlglabs.space">✉️ contact@mtlglabs.space</a>
</p>
