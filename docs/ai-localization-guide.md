# AI Localization Studio Guide

The AI Localization Studio extracts application strings from `.bubble` files, translates them across multiple AI providers, manages translation memory, and exports translations directly for Bubble's language settings.

---

## Subtabs & Module Structure

The module contains five main sections:

### 1. Localization Studio & Matrix View
- **Views**: Single language view and multi-language matrix view.
- **Filtering**: Filter by category (`UI`, `Error`, `Notification`, `Email`, `Option Set`) and translation status (`All`, `Pending`, `Ready / Translated`).
- **Batch Processing**: Run single-string translations or batch translate across multiple target languages simultaneously.
- **CSV Import & Merge**: Import external Bubble App Text or database CSV files. The import merges new strings with existing ones while preserving extracted Option Sets without duplicates.
- **Blueprint Isolation**: Importing CSVs or `.bubble` files in this module operates only on the local translation workspace and does not modify the project's saved `.bubble` blueprint.
- **Sync Blueprint**: Use the `Sync .bubble` button to re-extract strings and Option Sets directly from the attached blueprint.

### 2. Brand Glossary & Token Protection
- Keep brand names (such as `Bubble.io`, `Stripe`, `OAuth`, `API`) and dynamic Bubble expressions (`[Current User]`, `[Parent group's Thing]`, `[Result of step 1]`) intact during translation.
- Includes preset rules for common Bubble tokens.
- Add custom protected terms to prevent translation.

### 3. Translation Memory (Cache)
- Caches translated strings in IndexedDB using `hash(sourceText + targetLang)`.
- Displays metrics for cached string count, character count, and estimated API savings.
- Includes a button to clear the translation cache when needed.

### 4. Pseudo-Localization Testing
- Simulates 20% to 50% text expansion and accented character replacements to test whether Bubble UI containers handle longer text before translating.

### 5. Cost Estimator & Token Analytics
- Calculates projected token usage and API costs across providers before running large batch jobs.
- Compares estimates across Google Gemini, OpenAI, Claude, DeepSeek, Groq, xAI, OpenCode, and Ollama.

### 6. Bubble CSV & JSON Bundle Exporter
- Exports translations matching Bubble's native format:
  ```csv
  Bubble Text ID,Original Text,French,German,Spanish
  ```
- Exports multi-language JSON bundles for external frontend setups.
- Files can be imported directly in **Bubble Editor > Settings > Languages**.
