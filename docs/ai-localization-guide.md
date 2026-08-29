# 🌐 AI Localization Studio Guide (v2.9.0-beta)

The **AI Localization Studio** provides multi-provider AI translation, recursive string extraction from `.bubble` files, translation memory caching, brand glossary protection, and real-time cost estimation.

---

## 1. Subtabs & Module Structure

The **AI Localization Studio** contains 5 specialized subtabs:

1. **🌐 Localization Studio & Matrix View**:
   - Single Language and Multi-Language Matrix Views.
   - Filter by category pills (`UI`, `Error`, `Notification`, `Email`, `Option Set`) and translation status (`All`, `Pending`, `Ready / Translated`).
   - Single-click row-level AI translation and multi-language batch execution.
   - 1-click extraction directly from the attached `.bubble` blueprint.

2. **📖 Brand Glossary & Dynamic Token Protection**:
   - Protect brand names (e.g. `Bubble.io`, `Stripe`, `OAuth`, `API`) and dynamic Bubble expressions (e.g. `[Current User]`, `[Parent group's Thing]`, `[Result of step 1]`) from AI modification.
   - Pre-configured 1-click **Bubble Standard Token Presets**.

3. **🗄️ Translation Memory (Cache)**:
   - High-speed zero-latency cache indexed by `hash(sourceText + targetLang)`.
   - Metrics: Cached strings count, characters saved, and accumulated API dollar savings.
   - 1-click cache purge controller.

4. **🧪 Pseudo-Localization & UI Stress Testing**:
   - Interactive live input tester with configurable text expansion (20%, 30%, 40%, 50%).
   - Simulates accented glyphs (`[!! Ŝȧṽē Ċħȧñɠēş !!]`) to detect layout clipping in Bubble responsive groups.

5. **💰 Token & Cost Estimator**:
   - Real-time cost estimates for current strings across Google Gemini, OpenAI, Anthropic (Claude 3.7 Sonnet), DeepSeek V3, Groq, and Ollama (Local/Offline).
   - Multiplied projections based on the number of selected target languages.

---

## 2. Multi-Provider AI Gateway

| Provider | Recommended Models | Strengths |
| :--- | :--- | :--- |
| **Google Gemini** | `gemini-2.0-flash`, `gemini-1.5-pro` | High context window, natural fluency |
| **Anthropic Claude** | `claude-3-7-sonnet`, `claude-3-5-haiku` | Nuanced tone and brand adaptation |
| **OpenAI** | `gpt-4o`, `gpt-4o-mini` | Consistent grammar and dialect accuracy |
| **DeepSeek** | `deepseek-chat`, `deepseek-reasoner` | High quality at disruptive token economics |
| **Groq** | `llama-3.3-70b-versatile` | Real-time ultra-fast batch translation |
| **Ollama** | `llama3`, `mistral`, `qwen2.5` | 100% private, offline, on-premise translation |

---

## 3. Exporting to Bubble.io

1. Select your target language(s).
2. Click **"Export Bubble CSV"** (or **"Export N CSVs"** / **"JSON Bundle"**).
3. Open your **Bubble Editor** ➔ **Settings** ➔ **Languages**.
4. Upload the CSV via **"Import CSV"** to apply all translations across your app in seconds.
