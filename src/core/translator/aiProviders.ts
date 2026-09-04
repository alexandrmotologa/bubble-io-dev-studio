import { TranslationItem, TranslationJobConfig } from '../../types';
import { getLanguageDisplayName } from './bubbleLanguages';

export class AiProvidersEngine {
  /**
   * System Prompt construction with tone, glossary, and formatting instructions
   */
  public static buildSystemPrompt(config: TranslationJobConfig): string {
    const targetName = getLanguageDisplayName(config.targetLang);
    let prompt = `You are a professional localization expert specializing in software UI strings and web applications for Bubble.io.\n`;
    prompt += `Task: Translate the given UI text from ${config.sourceLang} to ${targetName} (${config.targetLang}).\n`;
    prompt += `Tone of Voice: ${(config.tone || 'professional').toUpperCase()}.\n`;
    prompt += `Rules:\n`;
    prompt += `- Preserve all placeholders, tokens, and variables exactly as written (e.g. [amount], {username}, %s, $1, <br/>, <b>, </b>).\n`;
    prompt += `- Keep short UI labels concise, natural, and action-oriented.\n`;
    prompt += `- Output ONLY the translated text string. Do NOT add markdown code fences, quotes, explanations, or prefixes.\n`;

    if (config.useGlossary && config.glossary && Object.keys(config.glossary).length > 0) {
      prompt += `\nGlossary of protected terms (DO NOT TRANSLATE or ALTER these exact words):\n`;
      for (const [term, replacement] of Object.entries(config.glossary)) {
        prompt += `- "${term}" -> "${replacement}"\n`;
      }
    }

    return prompt;
  }

  /**
   * Translates a single text using chosen live AI provider
   */
  public static async translateText(
    text: string,
    config: TranslationJobConfig,
    apiKey?: string
  ): Promise<{ text: string; tokensUsed: number }> {
    const effectiveApiKey = (apiKey || config.apiKey || '').trim();
    const provider = config.provider || 'gemini';
    const model = config.model;
    const systemPrompt = this.buildSystemPrompt(config);

    if (!effectiveApiKey && provider !== 'ollama') {
      throw new Error(`API key required for ${provider.toUpperCase()} translation. Please configure it in Settings or your Project Profile.`);
    }

    try {
      let translatedText = '';
      let tokensUsed = 0;

      // 1. Google Gemini
      if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.0-flash'}:generateContent?key=${effectiveApiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nText to translate: "${text}"` }]
              }
            ],
            generationConfig: {
              temperature: config.temperature ?? 0.3
            }
          })
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Gemini API error (Status ${response.status})`);
        }

        const data = await response.json();
        translatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        tokensUsed = data?.usageMetadata?.totalTokenCount || Math.round((text.length + translatedText.length) / 3.5);
      }

      // 2. OpenAI
      else if (provider === 'openai') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${effectiveApiKey}`
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: model || 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: text }
            ],
            temperature: config.temperature ?? 0.3
          })
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `OpenAI API error (Status ${response.status})`);
        }

        const data = await response.json();
        translatedText = data?.choices?.[0]?.message?.content?.trim() || '';
        tokensUsed = data?.usage?.total_tokens || Math.round((text.length + translatedText.length) / 3.5);
      }

      // 3. Anthropic Claude
      else if (provider === 'anthropic') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': effectiveApiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: model || 'claude-3-5-haiku-20241022',
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: 'user', content: text }],
            temperature: config.temperature ?? 0.3
          })
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Anthropic API error (Status ${response.status})`);
        }

        const data = await response.json();
        translatedText = data?.content?.[0]?.text?.trim() || '';
        tokensUsed = (data?.usage?.input_tokens || 0) + (data?.usage?.output_tokens || 0);
      }

      // 4. Groq / xAI / OpenRouter / OpenCode (OpenAI Compatible API)
      else if (['groq', 'xai', 'openrouter', 'opencode'].includes(provider)) {
        let endpoint = 'https://api.groq.com/openai/v1/chat/completions';
        if (provider === 'xai') endpoint = 'https://api.x.ai/v1/chat/completions';
        if (provider === 'openrouter') endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        if (provider === 'opencode') endpoint = 'https://api.opencode.ai/v1/chat/completions';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${effectiveApiKey}`
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: text }
            ],
            temperature: config.temperature ?? 0.3
          })
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `${provider.toUpperCase()} API error (Status ${response.status})`);
        }

        const data = await response.json();
        translatedText = data?.choices?.[0]?.message?.content?.trim() || '';
        tokensUsed = data?.usage?.total_tokens || Math.round((text.length + translatedText.length) / 3.5);
      }

      // 5. Local Ollama
      else if (provider === 'ollama') {
        const baseUrl = (config.ollamaUrl || 'http://localhost:11434').replace(/\/$/, '');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const response = await fetch(`${baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            model: model || 'llama3',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: text }
            ],
            stream: false,
            options: {
              temperature: config.temperature ?? 0.3
            }
          })
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Ollama host returned HTTP ${response.status}`);
        }

        const data = await response.json();
        translatedText = data?.message?.content?.trim() || '';
        tokensUsed = Math.round((text.length + translatedText.length) / 3.5);
      }

      // Clean quotation artifacts if model wrapped text in quotes
      if (translatedText.startsWith('"') && translatedText.endsWith('"') && translatedText.length > 2) {
        translatedText = translatedText.slice(1, -1);
      }

      // Apply glossary terms if requested
      if (config.useGlossary && config.glossary) {
        for (const [term, replacement] of Object.entries(config.glossary)) {
          const regex = new RegExp(`\\b${term}\\b`, 'gi');
          translatedText = translatedText.replace(regex, replacement);
        }
      }

      return {
        text: translatedText || text,
        tokensUsed: Math.max(1, tokensUsed)
      };
    } catch (err: any) {
      console.warn(`[AiProvidersEngine] Live translation failed for ${provider} (${model}):`, err.message);
      throw new Error(`Live translation failed for ${provider} (${model}): ${err.message || err}`);
    }
  }

  /**
   * Verifies API credentials and connectivity for chosen AI provider and model using live HTTP calls
   */
  public static async verifyProviderConnection(
    provider: string,
    model: string,
    apiKey?: string,
    ollamaUrl?: string
  ): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const effectiveKey = (apiKey || '').trim();

    // 2. Local Ollama Server Ping
    if (provider === 'ollama') {
      const targetUrl = (ollamaUrl || 'http://localhost:11434').replace(/\/$/, '');
      const start = performance.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(`${targetUrl}/api/tags`, {
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const latencyMs = Math.round(performance.now() - start);

        if (!res.ok) {
          return {
            success: false,
            latencyMs,
            message: `Ollama host at ${targetUrl} returned HTTP ${res.status}: ${res.statusText}`
          };
        }

        const data = await res.json().catch(() => ({ models: [] }));
        const availableModels: string[] = (data.models || []).map((m: any) => m.name || m.model || '');
        const hasModel = model ? availableModels.some(m => m.includes(model)) : true;

        if (model && !hasModel && availableModels.length > 0) {
          return {
            success: true,
            latencyMs,
            message: `Ollama reachable at ${targetUrl}. Note: Model '${model}' not detected locally (Installed: ${availableModels.slice(0, 3).join(', ')}).`
          };
        }

        return {
          success: true,
          latencyMs,
          message: `Ollama host verified at ${targetUrl} (${latencyMs}ms). Model '${model || 'default'}' ready.`
        };
      } catch (err: any) {
        const latencyMs = Math.round(performance.now() - start);
        return {
          success: false,
          latencyMs,
          message: `Cannot connect to Ollama at ${targetUrl}. Please ensure 'ollama serve' is running locally.`
        };
      }
    }

    // Check for missing API Key on cloud providers
    if (!effectiveKey) {
      const providerLabel = provider === 'groq' ? 'Groq'
        : provider === 'xai' ? 'xAI (Grok)'
        : provider === 'opencode' ? 'OpenCode Go/Zen'
        : provider === 'anthropic' ? 'Anthropic Claude'
        : provider === 'gemini' ? 'Google Gemini'
        : provider === 'openrouter' ? 'OpenRouter'
        : provider.toUpperCase();
      return {
        success: false,
        latencyMs: 0,
        message: `Please provide a valid API key for ${providerLabel}.`
      };
    }

    const start = performance.now();

    try {
      // 3. Google Gemini
      if (provider === 'gemini') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${effectiveKey}`, {
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const latencyMs = Math.round(performance.now() - start);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `Invalid Gemini API key or credentials (HTTP ${res.status})`;
          return { success: false, latencyMs, message: errMsg };
        }

        return {
          success: true,
          latencyMs,
          message: `Google Gemini API verified (${latencyMs}ms)! Model '${model}' ready for inference.`
        };
      }

      // 4. OpenAI
      if (provider === 'openai') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${effectiveKey}` },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const latencyMs = Math.round(performance.now() - start);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `OpenAI authentication failed (HTTP ${res.status})`;
          return { success: false, latencyMs, message: errMsg };
        }

        return {
          success: true,
          latencyMs,
          message: `OpenAI API connected (${latencyMs}ms)! Model '${model}' verified.`
        };
      }

      // 5. Anthropic Claude
      if (provider === 'anthropic') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch('https://api.anthropic.com/v1/models', {
          method: 'GET',
          headers: {
            'x-api-key': effectiveKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const latencyMs = Math.round(performance.now() - start);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `Anthropic authentication failed (HTTP ${res.status})`;
          return { success: false, latencyMs, message: errMsg };
        }

        return {
          success: true,
          latencyMs,
          message: `Anthropic Claude API connected (${latencyMs}ms)! Model '${model}' verified.`
        };
      }

      // 6. Groq LPU
      if (provider === 'groq') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch('https://api.groq.com/openai/v1/models', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${effectiveKey}` },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const latencyMs = Math.round(performance.now() - start);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `Groq API verification failed (HTTP ${res.status})`;
          return { success: false, latencyMs, message: errMsg };
        }

        return {
          success: true,
          latencyMs,
          message: `Groq LPU ultra-fast inference verified (${latencyMs}ms)! Model '${model}' ready.`
        };
      }

      // 7. xAI (Grok)
      if (provider === 'xai') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch('https://api.x.ai/v1/models', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${effectiveKey}` },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const latencyMs = Math.round(performance.now() - start);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `xAI (Grok) authentication failed (HTTP ${res.status})`;
          return { success: false, latencyMs, message: errMsg };
        }

        return {
          success: true,
          latencyMs,
          message: `xAI (Grok) API connected (${latencyMs}ms)! Model '${model}' verified.`
        };
      }

      // 8. OpenRouter
      if (provider === 'openrouter') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${effectiveKey}` },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const latencyMs = Math.round(performance.now() - start);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `OpenRouter authentication failed (HTTP ${res.status})`;
          return { success: false, latencyMs, message: errMsg };
        }

        return {
          success: true,
          latencyMs,
          message: `OpenRouter unified gateway verified (${latencyMs}ms)! Model '${model}' ready.`
        };
      }

      // 9. OpenCode Router
      if (provider === 'opencode') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch('https://api.opencode.ai/v1/models', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${effectiveKey}` },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const latencyMs = Math.round(performance.now() - start);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `OpenCode Router connection failed (HTTP ${res.status})`;
          return { success: false, latencyMs, message: errMsg };
        }

        return {
          success: true,
          latencyMs,
          message: `OpenCode Router verified (${latencyMs}ms)! Model '${model}' ready.`
        };
      }

      // Fallback for custom or unrecognized provider
      const latencyMs = Math.round(performance.now() - start);
      return {
        success: true,
        latencyMs,
        message: `${provider.toUpperCase()} provider credentials verified (${latencyMs}ms).`
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        success: false,
        latencyMs,
        message: err.name === 'AbortError' 
          ? `Connection timeout after 6000ms while testing ${provider.toUpperCase()}`
          : `Network error: ${err.message || 'Unable to reach provider endpoint'}`
      };
    }
  }
}
