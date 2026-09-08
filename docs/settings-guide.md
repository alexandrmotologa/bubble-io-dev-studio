# Settings & Integrations Guide

The Settings & Integrations view manages AI provider credentials, workspace connections, cloud sync settings, and application updates.

---

## Subtabs Overview

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                             Settings & Integrations                                    │
├────────────────────┬────────────────────┬────────────────────┬─────────────────────────┤
│ AI Providers       │ Bubble Apps        │ Preferences        │ Updates & System        │
│   • API Keys       │   • Connect Wizard │   • Theme Select   │   • Auto-Updater        │
│   • Local Ollama   │   • Cloud Sync     │   • Auto Reports   │   • Data Retention      │
│   • Latency Test   │   • Downloads Watch│   • Storage Purge  │   • System Diagnostics  │
│   • Custom Models  │   • Manual Import  │                    │   • Diagnostic Bundle   │
└────────────────────┴────────────────────┴────────────────────┴─────────────────────────┘
```

---

## Module Sections

### 1. AI Providers & Keys
- **Supported Providers**: Configure credentials for:
  - **Google Gemini** (`gemini-2.0-flash`, `gemini-1.5-pro`)
  - **Anthropic Claude** (`claude-3-7-sonnet`, `claude-3-5-haiku`)
  - **OpenAI** (`gpt-4o`, `gpt-4o-mini`, `o3-mini`)
  - **Groq** (`llama-3.3-70b-versatile`, `qwen/qwen3.8-27b`)
  - **DeepSeek** (`deepseek-chat`, `deepseek-reasoner`)
  - **xAI** (`grok-2`)
  - **OpenRouter** (unified API aggregator)
  - **Ollama** (local offline execution on `http://localhost:11434`, with automatic model detection via `/api/tags`).
- **Custom Model Identifiers**: Enter any custom model name or fine-tuned variant.
- **Connection Test**: Test network reachability and round-trip response time in milliseconds.
- **Key Visibility**: Toggle between masked and unmasked display for screen sharing.

### 2. Bubble Apps & Workspaces
- **Connection Wizard**:
  - **Step 1: App Identity**: Enter your Application Name, App ID (or URL), environment (`version-test` or `version-live`), and optional custom domain.
  - **Step 2: Authentication & Security**: Enter your Private API Bearer Token, enable Data API access, backups, and privacy checks. Includes optional HTTP Basic Auth for password-protected environments.
  - **Step 3: AI Setup**: Select a default AI provider and model.
  - **Step 4: Blueprint Export**: Select Cloud Direct Sync, Downloads Watcher, or manual file dropzone.
  - **Step 5: Pre-Flight Checklist**: Review settings before opening the workspace.
- **Workspace Switching**: Switch between connected applications with environment and latency indicators.
- **Workspace Bundle Export (`.bds`)**: Export or import portable workspace configuration files (schemas, credentials, snapshots, and attached blueprints).

### 3. Preferences
- **Theme Selection**: Switch between **Cyber Slate** (dark theme) and **Clean Studio** (light theme).
- **Automated Report Saving**: Toggle automatic local saving of HTML, SARIF, and JSON reports.
- **Local Storage Management**: Inspect storage usage and clear IndexedDB or localStorage caches.

### 4. Updates & System Diagnostics
- **Automatic Updates**: Powered by `electron-updater` and GitHub Releases (`alexandrmotologa/bubble-io-dev-studio`).
- **Update Checks**: Checks in the background for new versions on startup.
- **Progress Tracking**: Displays download progress and transfer speeds.
- **Restart Prompt**: Choose between restarting immediately or postponing until later.
- **Data Retention Across Updates**:
  - Updates only modify the application binary directory (`%LOCALAPPDATA%\Programs\bubble-io-dev-studio\`).
  - Workspaces, project settings, API tokens, snapshots, and IndexedDB databases remain in `%APPDATA%\bubble-io-dev-studio\` and are preserved during updates.

### 5. Diagnostics
- **Metrics Summary**: Displays the current studio version, number of connected projects, and active AI model.
- **Environment Details**: Runtime versions for Electron, Node.js, and Chromium, plus IndexedDB status.
- **Diagnostic Export**: Download a diagnostic JSON bundle for troubleshooting and bug reports.

### 6. About & Support
- Version details and release channel.
- Project author links and repository references.
- Direct support contact: `contact@mtlglabs.space`.
