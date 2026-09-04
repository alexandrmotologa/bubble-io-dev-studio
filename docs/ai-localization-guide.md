# 🌐 AI Localization Studio Guide (v3.3.8)

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

4. **💰 Cost Estimator & Token Analytics**:
   - Calculate projected token consumption and API costs across 7 providers before launching bulk jobs.
   - Compare pricing across Google Gemini, OpenAI, Claude, DeepSeek, and Groq.

5. **📤 Bubble CSV Exporter**:
   - Export translations directly formatted for Bubble's native language settings:
     ```csv
     Bubble Text ID,Original Text,French,German,Spanish
     ```
   - Ready for 1-click import into **Bubble Editor ➔ Settings ➔ Languages**.
