# ⚙️ Settings & Integrations Hub Guide (v2.9.0-beta)

The **Settings & Integrations Hub** manages multi-provider AI credentials, Bubble workspace connections, zero-telemetry security storage, and client-side system diagnostics.

---

## 1. Subtabs Overview

### 1. 🔑 AI Providers & Keys (`keys`)
- **Multi-Provider LLM Engine**: Configure API keys for **Google Gemini** (Gemini 2.0 Flash / Pro), **Anthropic Claude** (Claude 3.7 Sonnet / Haiku), **OpenAI** (GPT-4o / 4o-mini), **Groq** (Llama 3.3 70B), **xAI** (Grok 2), **OpenCode Router**, **OpenRouter**, and **Ollama** (Local/Offline).
- **Live AI Connection Test**: Test connectivity, round-trip latency (ms), and model accessibility with 1 click.
- **Show/Hide Key Toggle**: Mask or unmask API keys for secure screen-sharing.

### 2. 🗂️ Bubble Apps & Workspaces (`workspaces`)
- **Workspace Manager**: View all connected Bubble applications with environment badges (`VERSION-TEST`, `LIVE`), custom domains, and App IDs.
- **Live Health & Ping**: Real-time HTTP reachability check and latency measurement.
- **Blueprint Attachment**: Attach or replace `.bubble` JSON export files to unlock automated schema extraction, workflow DAGs, and page route catalogs.
- **5-Step Verification Pills**: Visual verification status across App Reachability, Token Security, AI Provider, Blueprint sync, and Audit readiness.

### 3. 🎨 Theme & Studio Preferences (`preferences`)
- **Theme Mode**: Switch between **Cyber Slate** (Dark Theme) and **Clean Studio** (Light Theme).
- **Automated Report Saving**: Toggle automatic local persistence for HTML, SARIF, and JSON test reports.
- **Local Storage Controller**: Manage and purge IndexedDB and localStorage caches.

### 4. 💻 System Diagnostics (`diagnostics`)
- **Diagnostic Metrics**: Quick glance at Studio Version, Connected Workspaces count, and Active AI Model.
- **Environment Summary**: Complete runtime details including IndexedDB status and client platform.
- **Export Diagnostics JSON**: 1-Click download of a diagnostic bundle for troubleshooting and bug reporting.

### 5. ℹ️ About & Credits (`about`)
- **Release Edition**: Version `2.7.0-beta` (Enterprise Suite).
- **Author Credits**: Designed and built by **Alexandr Motologa | MTLG Labs**.
- **Community Links**: GitHub repository, Buy Me a Coffee, and contact email.
