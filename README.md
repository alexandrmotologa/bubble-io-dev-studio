# 🚀 Bubble.io Dev Studio

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-34-47848F.svg?style=flat&logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev/)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-informational.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Bubble.io Dev Studio** is the all-in-one enterprise desktop IDE and developer toolchain designed specifically for **Bubble.io** builders, agencies, and QA teams. It unifies live data management, visual workflow logic graphs, multi-provider AI localization, pixel-perfect visual regression testing, AST dead code elimination, security RBAC auditing, and 1-click technical documentation generation.

---

## 📚 Table of Contents
- [🌟 Architecture & Modules Overview](#-architecture--modules-overview)
- [✨ Core Features & Capabilities](#-core-features--capabilities)
  - [1. DevOps & Database Studio](#1-devops--database-studio)
  - [2. Visual Workflow Flowchart & Logic Visualizer](#2-visual-workflow-flowchart--logic-visualizer)
  - [3. Security & Privacy Rules Auditor](#3-security--privacy-rules-auditor)
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
│   • ERD & Types   │   • Blocking Check│   • PII Scanner   │   • Monthly Cost  │   • Health %    │
│   • Snapshots     │   • Mermaid Export│   • API Audit     │   • N+1 Loop Check│   • Safe Purge  │
├───────────────────┼───────────────────┼───────────────────┼───────────────────┼─────────────────┤
│ 🌐 AI Translation │ 📸 Visual QA      │ 🔌 Webhooks & SDK │ 📚 DocGen Book    │ 🤖 AI Copilot   │
│   • 7x AI Models  │   • Pixel Diff    │   • Webhook Logs  │   • Data Dict     │   • Query Gen   │
│   • Memory Cache  │   • Basic Auth    │   • cURL to Bubble│   • Markdown/HTML │   • Regex Helper│
│   • Bubble CSV    │   • Viewports     │   • Plugin Action │   • PDF Print     │   • AST Insights│
└───────────────────┴───────────────────┴───────────────────┴───────────────────┴─────────────────┘
```

---

## ✨ Core Features & Capabilities

### 1. DevOps & Database Studio
* **Interactive Data Studio (CRUD)**: Airtable/Supabase-style visual grid for live Bubble Data API records. Includes inline cell editing (`PATCH`), new record modal, multi-column sorting, search, and CSV/JSON export.
* **Schema Explorer & Mermaid ERD**: Inspect custom data types, fields, nullability, and auto-generate relational ERD diagrams.
* **TypeScript Generator**: Generate production-grade `.d.ts` definitions for Bubble plugins and external clients.
* **Point-in-Time Database Snapshots & 1-Click Rollback**: Capture table states before risky migrations, compare field-level diffs, and restore previous states with automated compensations.
* **Dev vs Live Sync**: Real-time schema drift comparisons between `version-test` and `version-live`.

### 2. Visual Workflow Flowchart & Logic Visualizer
* **Interactive Node Graphs**: Renders sequential workflow chains with color-coded nodes for *Triggers, Database Writes, Emails, API Calls, and Navigation*.
* **Conditional Branch Inspector**: Visualizes `"Only when..."` constraints attached to workflows and individual actions.
* **Performance Advisor**: Flags client-blocking actions (e.g. synchronous email sending on the frontend) and suggests server backend scheduling.
* **Mermaid Flowchart Export**: Copy-pasteable diagram syntax for pull requests and documentation.

### 3. Security & Privacy Rules Auditor
* **RBAC Access Matrix**: Automatic permission mapping across *Admin*, *Authenticated User*, and *Guest / Everyone Else*.
* **Sensitive Data (PII) Scanner**: Deep regex scanning for exposed emails, tokens, secrets, phone numbers, and Stripe financial data.
* **Insecure Backend API Detector**: Flags API workflows configured with *"Run without authentication"* or *"Ignore Privacy Rules"*.
* **Audit Report Exporter**: Comprehensive Markdown reports with severity grading and remediation steps.

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
- ⚡ [Workload Units (WU) & Query Profiler Guide](file:///b:/workgit/bubble-io-dev-studio/docs/wu-profiler-guide.md)
- 🌐 [AI Localization Studio Guide](file:///b:/workgit/bubble-io-dev-studio/docs/ai-localization-guide.md)
- 📸 [Visual QA & Regression Suite Guide](file:///b:/workgit/bubble-io-dev-studio/docs/visual-qa-guide.md)
- 🌐 [Webhooks & API Studio Guide](file:///b:/workgit/bubble-io-dev-studio/docs/api-studio-guide.md)
- 📚 [1-Click Developer Documentation Book (DocGen) Guide](file:///b:/workgit/bubble-io-dev-studio/docs/docgen-guide.md)

---

## 💻 Tech Stack

* **Desktop Framework**: [Electron 34](https://www.electronjs.org/) + Node.js
* **Frontend UI**: [React 18](https://react.dev/) + [Vite 6](https://vitejs.dev/) + [TypeScript 5.7](https://www.typescriptlang.org/)
* **Database & Persistence**: Native Promise-based IndexedDB Multi-Store
* **Design & Icons**: Vanilla CSS Variables, Glassmorphism, Dark/Light Themes, [Lucide React](https://lucide.dev/)
* **Packaging**: [electron-builder](https://www.electron.build/)

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) v18 or higher
* npm v9 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/alexandrmotologa/bubble-io-dev-studio.git

# Navigate into the directory
cd bubble-io-dev-studio

# Install dependencies
npm install
```

### Development Mode

To start the Vite dev server and launch the desktop Electron application:

```bash
npm run dev
```

---

## 📦 Packaging & Distribution

### Build for Windows (.exe NSIS installer & portable)
```bash
npm run dist:win
```

### Build for macOS (.dmg & .zip for Apple Silicon & Intel)
```bash
npm run dist:mac
```

### Build for Linux (.AppImage & .deb)
```bash
npm run dist:linux
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
