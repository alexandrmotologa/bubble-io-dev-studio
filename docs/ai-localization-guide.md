# 🌐 AI Localization Studio Guide (v3.3.15)

The **AI Localization Studio** provides multi-provider AI translation, recursive string extraction from `.bubble` files, translation memory caching, brand glossary protection, real-time cost estimation, and robust CSV merge capabilities.

---

## 1. Subtabs & Module Structure

The **AI Localization Studio** contains 5 specialized subtabs with pixel-perfect, standardized 42px form controls:

1. **🌐 Localization Studio & Matrix View**:
   - Single Language and Multi-Language Matrix Views.
   - Filter by category pills (`UI`, `Error`, `Notification`, `Email`, `Option Set`) and translation status (`All`, `Pending`, `Ready / Translated`).
   - Single-click row-level AI translation and simultaneous multi-language batch execution.
   - **Smart CSV Import & Merge**: Importing external Bubble App Text or live Database CSV files intelligently merges new strings with existing ones, preserving extracted Option Sets without duplication.
   - **Project Blueprint Isolation**: Importing CSVs or `.bubble` files in this module operates strictly on the local translation workspace and **never** modifies or overwrites the project's attached `.bubble` blueprint (`activeProject.blueprintExportJson`).
   - **`Sync .bubble` Button**: One-click re-extraction directly from the project's attached `.bubble` blueprint at any time.

2. **📖 Brand Glossary & Dynamic Token Protection**:
   - Protect brand names (e.g. `Bubble.io`, `Stripe`, `OAuth`, `API`) and dynamic Bubble expressions (e.g. `[Current User]`, `[Parent group's Thing]`, `[Result of step 1]`) from AI modification.
   - Pre-configured 1-click **Bubble Standard Token Presets**.
   - Standardized input dimensions aligned with global studio inputs.

3. **🗄️ Translation Memory (Cache)**:
   - High-speed zero-latency cache indexed by `hash(sourceText + targetLang)`.
   - Metrics: Cached strings count, characters saved, and accumulated API dollar savings.
   - 1-click cache purge controller.

4. **🧪 Pseudo-Localization Testing**:
   - Simulates text expansion (20%–50%) and diacritic transformations to stress-test Bubble UI responsiveness before translating.

5. **💰 Cost Estimator & Token Analytics**:
   - Calculate projected token consumption and API costs across 9 providers before launching bulk jobs.
   - Compare pricing across Google Gemini, OpenAI, Claude, DeepSeek, Groq, xAI, OpenCode, and Ollama.

6. **📤 Bubble CSV & JSON Bundle Exporter**:
   - Export translations directly formatted for Bubble's native language settings:
     ```csv
     Bubble Text ID,Original Text,French,German,Spanish
     ```
   - Export consolidated multi-language JSON bundles for headless or mobile architectures.
   - Ready for 1-click import into **Bubble Editor ➔ Settings ➔ Languages**.

