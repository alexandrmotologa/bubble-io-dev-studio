# ⚙️ Settings & Integrations Hub Guide (v3.3.8)

The **Settings & Integrations Hub** manages multi-provider AI credentials, Bubble workspace connections, 1-click cloud sync configurations, auto-update releases, and zero-data-loss system persistence.

---

## 1. Subtabs Overview

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                             Settings & Integrations Hub                                │
├────────────────────┬────────────────────┬────────────────────┬─────────────────────────┤
│ 🔑 AI Providers    │ 🗂️ Bubble Apps     │ 🎨 Preferences     │ 🔄 Updates & System     │
│   • 7x Providers   │   • 5-Step Wizard  │   • Themes (2x)    │   • Auto-Updater        │
│   • Local Ollama   │   • Cloud Sync     │   • Auto Reports   │   • Zero-Loss Relaunch  │
│   • Latency Ping   │   • Downloads Watch│   • Storage Purge  │   • System Diagnostics  │
│   • Model Select   │   • Manual Import  │                    │   • Diagnostic Bundle   │
└────────────────────┴────────────────────┴────────────────────┴─────────────────────────┘
```

---

## 2. Detailed Settings Modules

### 1. 🔑 AI Providers & Keys (`keys`)
- **Multi-Provider LLM Gateway**: Configure API keys for:
  - **Google Gemini** (`gemini-2.0-flash`, `gemini-1.5-pro`)
  - **Anthropic Claude** (`claude-3-7-sonnet`, `claude-3-5-haiku`)
  - **OpenAI** (`gpt-4o`, `gpt-4o-mini`, `o3-mini`)
  - **Groq** (`llama-3.3-70b-versatile`, ultra-low latency LPU)
  - **DeepSeek** (`deepseek-chat`, `deepseek-reasoner`)
  - **xAI** (`grok-2`)
  - **OpenRouter** (Unified multi-model aggregator)
  - **Ollama** (100% private, local execution on `http://localhost:11434` with automated local model tag discovery via `/api/tags`).
- **Live AI Connection Test**: Test connectivity, round-trip latency (ms), and model accessibility with 1 click.
- **Show/Hide Key Toggle**: Mask or unmask API keys for secure screen-sharing.

### 2. 🗂️ Bubble Apps & Workspaces (`workspaces`)
- **5-Step Connect App Wizard**:
  - **Step 1: App Identity**: Enter Application Name, App ID (or URL), Target Environment (`version-test` vs `version-live`), and Custom Domain. Runs live reachability test.
  - **Step 2: Authentication & Security**: Enter Private Bearer API Token (from Bubble *Settings ➔ API*), toggle Data API, automated backups, and PII auditing. Includes optional Agency Plan HTTP Basic Auth. Runs live token verification.
  - **Step 3: AI Setup & Model Selection**: Pick an AI provider (Ollama by default) or cloud LLM with live connection testing.
  - **Step 4: Blueprint & Schema Export File**: Choose between:
    - **⚡ 1-Click Cloud Sync**: Autonomous sync via collaborator bot (`bubbledevstudio.bot@gmail.com`) and Oracle Cloud VM microservice.
    - **📁 Local Auto-Detect**: Monitors `~/Downloads` folder while you click *"Export application"* in Bubble.
    - **📄 Manual Dropzone**: Drag-and-drop `.bubble` or `.json` files directly.
  - **Step 5: Pre-Flight Checklist & Launch**: Complete verification summary before opening workspace.
- **Workspace Manager**: View all connected Bubble applications with environment badges, latency indicators, and quick-switching.
- **Full Workspace Bundle Archive (`.bds`)**: 1-Click export and import of portable workspace configurations (schemas, credentials, snapshots, and attached blueprints).

### 3. 🎨 Theme & Studio Preferences (`preferences`)
- **Theme Mode**: Switch between **Cyber Slate** (Dark Theme) and **Clean Studio** (Light Theme).
- **Automated Report Saving**: Toggle automatic local persistence for HTML, SARIF, and JSON test reports.
- **Local Storage Controller**: Inspect cache size and safely purge IndexedDB and localStorage records.

### 4. 🔄 Application Updates & Auto-Updater (`general` / `diagnostics`)
- **Native Auto-Update System**: Powered by `electron-updater` and connected to GitHub Releases (`alexandrmotologa/bubble-io-dev-studio`).
- **Background Checks**: Automatically verifies if a newer version is available.
- **Live Progress Tracking**: Displays real-time download percentage, transfer speed (MB/s), and total payload size.
- **Sticky Restart & Install**: Once downloaded, click **"Restart & Install vX.X.X"** to immediately patch the application.
- **Zero Data Loss Guarantee**:
  - Updating replaces only the runtime binaries located in `%LOCALAPPDATA%\Programs\bubble-io-dev-studio\`.
  - Your user profiles, connected projects, API tokens, snapshots, and IndexedDB stores located in `%APPDATA%\bubble-io-dev-studio\` are completely untouched and 100% preserved.

### 5. 💻 System Diagnostics (`diagnostics`)
- **Diagnostic Metrics**: Overview of Studio Version, Connected Workspaces count, and Active AI Model.
- **Environment Summary**: Complete runtime details including IndexedDB status, Electron, Node, and Chrome versions.
- **Export Diagnostics JSON**: 1-Click download of a diagnostic bundle for troubleshooting and GitHub issues.

### 6. ℹ️ About & Credits (`about`)
- **Release Edition**: Version `v3.3.8` (Production Stable Suite).
- **Author Credits**: Designed and built by **Alexandr Motologa | MTLG Labs** ([mtlglabs.space](https://mtlglabs.space) • [mtlg.site](https://mtlg.site)).
- **Ecosystem & Support Links**: MTLG Labs Ecosystem, Personal Portfolio Hub, GitHub repository, and direct email support (`contact@mtlglabs.space`).
