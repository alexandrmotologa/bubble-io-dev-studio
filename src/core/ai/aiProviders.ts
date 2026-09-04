export interface AiModelDefinition {
  id: string;
  name: string;
  description?: string;
  isRecommended?: boolean;
}

export interface AiProviderDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  docsUrl: string;
  keyPlaceholder: string;
  isLocal?: boolean;
  models: AiModelDefinition[];
}

export const AI_PROVIDERS: AiProviderDefinition[] = [
  {
    id: 'ollama',
    name: 'Ollama (Local / Free)',
    displayName: 'Ollama (Local Offline / 0 Cloud Cost)',
    description: 'Self-hosted local AI inference running directly on your machine with 0 cloud cost & zero latency',
    docsUrl: 'https://ollama.com/',
    keyPlaceholder: 'http://127.0.0.1:11434',
    isLocal: true,
    models: [
      { id: 'llama3:8b', name: 'Llama 3 8B (Recommended Local)', isRecommended: true },
      { id: 'llama3', name: 'Llama 3 (Default)' },
      { id: 'llama3.1:8b', name: 'Llama 3.1 8B' },
      { id: 'mistral', name: 'Mistral 7B (Local Offline)' },
      { id: 'qwen2.5-coder:7b', name: 'Qwen 2.5 Coder 7B' },
      { id: 'deepseek-coder:6.7b', name: 'DeepSeek Coder 6.7B' },
      { id: 'codellama:7b', name: 'CodeLlama 7B' },
      { id: 'phi3', name: 'Phi-3 Mini' },
      { id: 'gemma2:9b', name: 'Gemma 2 9B' }
    ]
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    displayName: 'Google Gemini (Gemini 2.0 Flash / Pro)',
    description: 'Fast multimodal reasoning, massive context window & cloud intelligence',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    keyPlaceholder: 'AIzaSy...',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Cloud Fast)', isRecommended: true },
      { id: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro Experimental' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI',
    displayName: 'OpenAI (GPT-4o / GPT-4o-mini / o3-mini)',
    description: 'Industry benchmark models for natural language and reasoning',
    docsUrl: 'https://platform.openai.com/api-keys',
    keyPlaceholder: 'sk-proj-...',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o (Omni Flagship)', isRecommended: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Cost-Efficient)' },
      { id: 'o3-mini', name: 'o3-mini (High-Reasoning)' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    displayName: 'Anthropic (Claude 3.5 Sonnet / Haiku)',
    description: 'Nuanced multilingual translation and code architecture analysis',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    keyPlaceholder: 'sk-ant-...',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (State-of-the-Art)', isRecommended: true },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Ultra Fast)' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' }
    ]
  },
  {
    id: 'groq',
    name: 'Groq',
    displayName: 'Groq (LPU Ultra-Fast Inference)',
    description: 'Sub-second translation speed powered by Groq LPU hardware',
    docsUrl: 'https://console.groq.com/keys',
    keyPlaceholder: 'gsk_...',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Groq LPU)', isRecommended: true },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Sub-Second)' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32k Context)' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT' }
    ]
  },
  {
    id: 'xai',
    name: 'xAI',
    displayName: 'xAI (Grok 2 / Grok Beta)',
    description: 'High-speed reasoning and real-time contextual adaptation',
    docsUrl: 'https://console.x.ai/',
    keyPlaceholder: 'xai-...',
    models: [
      { id: 'grok-2-latest', name: 'Grok 2 (xAI State-of-the-Art)', isRecommended: true },
      { id: 'grok-2-vision-1212', name: 'Grok 2 Vision' },
      { id: 'grok-beta', name: 'Grok Beta' }
    ]
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    displayName: 'OpenCode (Go / Zen Router)',
    description: 'Intelligent multi-model routing with automated fallback',
    docsUrl: 'https://opencode.ai/',
    keyPlaceholder: 'oc-...',
    models: [
      { id: 'opencode-go-pro', name: 'OpenCode Go Pro (Fast Routing)', isRecommended: true },
      { id: 'opencode-zen-deepseek-r1', name: 'OpenCode Zen (DeepSeek R1)' },
      { id: 'opencode-zen-claude-3-5', name: 'OpenCode Zen (Claude 3.5 Sonnet)' },
      { id: 'opencode-zen-gpt-4o', name: 'OpenCode Zen (GPT-4o)' }
    ]
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    displayName: 'OpenRouter (Global Multi-LLM)',
    description: 'Universal unified gateway for 200+ open and proprietary AI models',
    docsUrl: 'https://openrouter.ai/keys',
    keyPlaceholder: 'sk-or-v1-...',
    models: [
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (OpenRouter)', isRecommended: true },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (OpenRouter)' },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Meta Llama 3.3 70B' },
      { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash (OpenRouter)' }
    ]
  }
];

export const PROVIDER_MODELS: Record<string, Array<{ id: string; name: string }>> = AI_PROVIDERS.reduce((acc, p) => {
  acc[p.id] = p.models;
  return acc;
}, {} as Record<string, Array<{ id: string; name: string }>>);

export const getProviderForModel = (modelId: string): string => {
  for (const p of AI_PROVIDERS) {
    if (p.models.some(m => m.id === modelId)) {
      return p.id;
    }
  }
  return 'ollama';
};

export const getDefaultModelForProvider = (providerId: string): string => {
  const prov = AI_PROVIDERS.find(p => p.id === providerId);
  if (prov && prov.models.length > 0) {
    const rec = prov.models.find(m => m.isRecommended);
    return rec ? rec.id : prov.models[0].id;
  }
  return 'llama3:8b';
};

export const getModelDisplayName = (modelId: string): string => {
  for (const p of AI_PROVIDERS) {
    const found = p.models.find(m => m.id === modelId);
    if (found) return found.name;
  }
  return modelId;
};

export const getProviderDisplayName = (providerId: string): string => {
  const p = AI_PROVIDERS.find(prov => prov.id === providerId);
  return p ? p.name : providerId;
};
