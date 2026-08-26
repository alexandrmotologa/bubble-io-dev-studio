# 🚀 Bubble.io Dev Studio

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-34-47848F.svg?style=flat&logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev/)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-informational.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Bubble.io Dev Studio** is an all-in-one desktop GUI application designed specifically for **Bubble.io** developers, agencies, and QA teams. It unifies 4 powerful developer CLI tools into a single, cohesive, cross-platform studio with real-time logging, interactive visual inspectors, and credential management.

---

## 🌟 Integrated Modules

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Bubble.io Dev Studio                            │
├──────────────────┬──────────────────┬──────────────────┬───────────────┤
│ 🛠️ DevOps & Schema│ 🩺 Dead Code &   │ 🌐 AI            │ 📸 Visual QA  │
│    Studio        │    Health Scorer │    Localization  │    Suite      │
│                  │                  │                  │               │
│ • Auto Backups   │ • AST Graph Scan │ • Multi-Provider │ • Multi-Res   │
│ • ERD Visualizer │ • Orphaned WFs   │ • Glossaries     │ • Pixel Diff  │
│ • Schema Diffs   │ • Unused DB/UI   │ • Bubble CSVs    │ • HTML Report │
│ • TypeScript Gen │ • Health Score % │ • Live Previews  │ • Split View  │
└──────────────────┴──────────────────┴──────────────────┴───────────────┘
```

### 1. 🛠️ DevOps & Database Studio *(from `bubble-io-cli`)*
* **Automated Backups**: Create, archive, and download full database snapshots with single-click triggers.
* **Schema Explorer & ERD**: Inspect Bubble data types, relations, and view auto-generated Mermaid ERD diagrams.
* **TypeScript Generator**: Export type-safe TypeScript interfaces for Bubble plugins, external APIs, and mobile clients.
* **Schema Diffs & Migration Preview**: Compare Development vs Live environments before releasing.

### 2. 🩺 Dead Code & Health Scorer *(from `bubble-io-dead-code-detector`)*
* **Health Score & Grade**: Visual gauge (0–100%) with letter grading (A+ to F).
* **AST Dependency Audit**: Detects unreferenced UI elements, orphaned workflows, unused database fields, and redundant styles.
* **Cleanup Manifest**: Export actionable JSON manifests with safe cleanup recommendations.

### 3. 🌐 AI Localization Studio *(from `bubble-io-ai-translator`)*
* **Multi-Provider AI**: Powered by OpenAI (GPT-4o), Anthropic (Claude 3.5 Sonnet), and Google Gemini.
* **Tone & Vocabulary Tuning**: Professional, Casual, Formal, or Concise tone selection.
* **Glossary Support**: Preserve brand names, tokens like `[current_user]`, and technical terms.
* **Bubble CSV Export**: Direct export of localized strings ready for import into Bubble's Language Settings.

### 4. 📸 Visual QA & Regression Suite *(from `bubble-io-visual-tester`)*
* **Multi-Viewport Testing**: Test pages across Desktop (1920x1080), Tablet (768x1024), and Mobile (375x812).
* **Interactive Diff Slider**: Split-screen divider to inspect visual deviations pixel-by-pixel.
* **Automated QA Reports**: Export standalone HTML reports with test statistics and side-by-side screenshots.

---

## 💻 Tech Stack

* **Desktop Core**: [Electron](https://www.electronjs.org/) + [Node.js](https://nodejs.org/)
* **Frontend UI**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Design System**: Vanilla CSS Variables, Glassmorphism, Dark & Light Mode themes
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

To start the Vite dev server and launch the Electron desktop window with hot reloading:

```bash
npm run dev
```

---

## 📦 Packaging & Distribution (Windows & macOS)

### Build for Windows (.exe NSIS installer & portable)
```bash
npm run dist:win
```

### Build for macOS (.dmg & .zip for Apple Silicon & Intel)
```bash
npm run dist:mac
```

### Build for both platforms
```bash
npm run dist:all
```

The packaged binaries and installers will be generated inside the `release/` directory.

---

## ⚙️ Configuration & Security

* Credentials (Bubble API Tokens, OpenAI / Anthropic / Gemini keys) are stored **locally** on your machine and are never transmitted to third-party tracking services.
* Multiple application profiles can be configured under **Settings & Keys**.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Alexandr Motologa**
* GitHub: [@alexandrmotologa](https://github.com/alexandrmotologa)
