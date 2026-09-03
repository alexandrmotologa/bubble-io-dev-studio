# ⚙️ Settings & Integrations Hub Guide (v3.1.1)

The **Settings & Integrations Hub** manages multi-provider AI credentials, Bubble workspace connections, auto-update releases, zero-telemetry security storage, and client-side system diagnostics.

---

## 1. Subtabs Overview

### 1. 🔑 AI Providers & Keys (`keys`)
- **Multi-Provider LLM Engine**: Configure API keys for **Google Gemini** (Gemini 2.0 Flash / Pro), **Anthropic Claude** (Claude 3.7 Sonnet / Haiku), **OpenAI** (GPT-4o / 4o-mini), **Groq** (Llama 3.3 70B), **xAI** (Grok 2), **OpenCode Router**, **OpenRouter**, and **Ollama** (Local/Offline on `http://localhost:11434`).
- **Live AI Connection Test**: Test connectivity, round-trip latency (ms), and model accessibility with 1 click.
- **Show/Hide Key Toggle**: Mask or unmask API keys for secure screen-sharing.

### 2. 🗂️ Bubble Apps & Workspaces (`workspaces`)
- **Bubble.io Direct Sync Hub**:
  - Connect your Bubble.io account securely via native session window (`persist:bubble_session`).
  - **Auto-Detect Downloads (ON/OFF)**: Background file watcher monitoring your local `Downloads` folder for newly exported `.bubble` or `.json` files, auto-linking them to your active workspace.
  - **⚡ 1-Click Sync**: Pull the application file directly from your open Bubble Editor session without manual downloads.
- **Workspace Manager**: View all connected Bubble applications with environment badges (`VERSION-TEST`, `LIVE`), custom domains, and App IDs.
- **Manual Workspace Editor Modal (`Edit Details`)**: Directly edit application title, Bubble App ID, target environment, custom domain, Data API URL, private bearer API token, and Agency Plan HTTP Basic Auth credentials (username & password).
- **Full Workspace Bundle Archive (`.bds`)**: 1-Click export and import of portable workspace configurations (schemas, credentials, snapshots, and attached blueprints).
- **Live Health & Ping**: Real-time HTTP reachability check and latency measurement.
- **5-Step Verification Pills**: Visual verification status across App Reachability, Token Security, AI Provider, Blueprint sync, and Audit readiness.

### 3. 🎨 Theme & Studio Preferences (`preferences`)
- **Theme Mode**: Switch between **Cyber Slate** (Dark Theme) and **Clean Studio** (Light Theme).
- **Automated Report Saving**: Toggle automatic local persistence for HTML, SARIF, and JSON test reports.
- **Local Storage Controller**: Manage and purge IndexedDB and localStorage caches.

### 4. 🔄 Application Updates & Releases (`general` / `diagnostics`)
- **In-App Auto-Update System**: Integrated with official GitHub Releases.
- **Background Check**: Notifies you when new updates are available.
- **Live Progress Bar**: Displays download percentage, transfer speed (KB/s or MB/s), and total package size.
- **1-Click Restart & Install**: Automatically updates the desktop application upon completion.

### 5. 💻 System Diagnostics (`diagnostics`)
- **Diagnostic Metrics**: Quick glance at Studio Version, Connected Workspaces count, and Active AI Model.
- **Environment Summary**: Complete runtime details including IndexedDB status and client platform.
- **Export Diagnostics JSON**: 1-Click download of a diagnostic bundle for troubleshooting and bug reporting.

### 6. ℹ️ About & Credits (`about`)
- **Release Edition**: Version `v3.1.0` (Production Stable Suite).
- **Author Credits**: Designed and built by **Alexandr Motologa | MTLG Labs** ([mtlglabs.space](https://mtlglabs.space) • [mtlg.site](https://mtlg.site)).
- **Ecosystem & Support Links**: MTLG Labs Ecosystem, Personal Portfolio Hub, GitHub repository, Buy Me a Coffee, and direct email (`contact@mtlglabs.space`).
