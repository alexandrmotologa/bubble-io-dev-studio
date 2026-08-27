# 🌐 AI Localization Studio Guide

The **AI Localization Studio** provides multi-provider AI translation, recursive string extraction from `.bubble` files, translation memory caching, and brand glossary protection.

---

## 1. Deep Recursive `.bubble` String Extractor

Unlike shallow translators, the studio's AST crawler traverses all nested layers:

* **UI Elements**: Text blocks, input placeholders, button labels, dropdown default captions, tooltips.
* **Option Sets**: All custom Option Set display values and static attributes.
* **Workflow Notifications**: Email subject lines, email HTML body text, browser alert popups, toast notifications.

Click **"⚡ Extract All Strings from Attached .bubble Blueprint"** to parse and sync all strings into IndexedDB.

---

## 2. Multi-Provider AI Translation Gateway

Translate into 77+ languages using your preferred AI model:

| Provider | Recommended Models | Strengths |
| :--- | :--- | :--- |
| **Google Gemini** | `gemini-2.0-flash`, `gemini-1.5-pro` | High context window, natural fluency |
| **Anthropic Claude** | `claude-3-7-sonnet`, `claude-3-5-haiku` | Nuanced tone and brand adaptation |
| **OpenAI** | `gpt-4o`, `gpt-4o-mini` | Consistent grammar and dialect accuracy |
| **DeepSeek** | `deepseek-chat`, `deepseek-reasoner` | High quality at disruptive token economics |
| **Groq** | `llama-3.3-70b-versatile` | Real-time ultra-fast batch translation |
| **Ollama** | `llama3`, `mistral`, `qwen2.5` | 100% private, offline, on-premise translation |

---

## 3. Translation Memory & Glossary Protection

* **Translation Memory**: All translations are cached in IndexedDB by `hash(sourceText + targetLang)`. Re-running translations skips existing entries with 0 API calls and 0 token cost.
* **Glossary Preservation**: Define terms that must NEVER be translated (e.g. `Bubble`, `Dev Studio`, `Stripe`, dynamic tokens like `[Current User's Name]`).
* **Pseudo-Localization**: Test layout expansion for languages like German or Romanian before running live translations:
  ```text
  "Save Changes" ➔ "[!! Ŝȧṽē Ċħȧñɠēş !!]"
  ```

---

## 4. Exporting to Bubble.io

1. Click **"Export Bubble CSV"**.
2. Open your **Bubble Editor** ➔ **Settings** ➔ **Languages**.
3. Import the CSV to apply all translations across your app in seconds.
