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
      { id: 'llama3.2:3b', name: 'Llama 3.2 3B (Fast Edge)' },
      { id: 'mistral', name: 'Mistral 7B (Local Offline)' },
      { id: 'qwen2.5-coder:7b', name: 'Qwen 2.5 Coder 7B' },
      { id: 'deepseek-r1:8b', name: 'DeepSeek R1 8B (Local Distill)' },
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
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Cloud Fast & Recommended)', isRecommended: true },
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite (Cost Efficient)' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Standard)' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep Context)' },
      { id: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro Experimental' }
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
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Ultra Cost-Efficient)' },
      { id: 'o3-mini', name: 'o3-mini (High-Reasoning)' },
      { id: 'o1', name: 'o1 (Full Reasoning Flagship)' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo (Legacy)' }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    displayName: 'Anthropic (Claude 3.7 / 3.5 Sonnet & Haiku)',
    description: 'Nuanced multilingual translation and code architecture analysis',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    keyPlaceholder: 'sk-ant-...',
    models: [
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet (Hybrid Reasoning Flagship)', isRecommended: true },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet v2 (State-of-the-Art)' },
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
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Universal / Free Tier Accessible ✓)', isRecommended: true },
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Groq LPU Flagship)' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B' },
      { id: 'deepseek-r1-distill-qwen-32b', name: 'DeepSeek R1 Distill Qwen 32B' },
      { id: 'qwen-2.5-32b', name: 'Qwen 2.5 32B' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32k Context)' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT' }
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    displayName: 'DeepSeek (V3 Chat / R1 Reasoner)',
    description: 'Ultra-low cost frontier models for reasoning, translation, and code analysis',
    docsUrl: 'https://platform.deepseek.com/api_keys',
    keyPlaceholder: 'sk-...',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3 (Chat & Fast Localization)', isRecommended: true },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Deep Chain-of-Thought)' }
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
      { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet (OpenRouter)' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (OpenRouter)' },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Meta Llama 3.3 70B' },
      { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash (OpenRouter)' },
      { id: 'openai/gpt-4o-mini', name: 'OpenAI GPT-4o Mini (OpenRouter)' }
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

export const getCustomModelPlaceholder = (provider: string): string => {
  switch (provider) {
    case 'groq': return 'e.g. llama-3.1-8b-instant, qwen-2.5-32b, llama-3.3-70b-versatile';
    case 'openai': return 'e.g. gpt-4o, gpt-4o-mini, o3-mini, o1';
    case 'anthropic': return 'e.g. claude-3-7-sonnet-20250219, claude-3-5-haiku-20241022';
    case 'gemini': return 'e.g. gemini-2.0-flash, gemini-2.0-flash-lite, gemini-1.5-pro';
    case 'deepseek': return 'e.g. deepseek-chat, deepseek-reasoner';
    case 'xai': return 'e.g. grok-2-latest, grok-beta';
    case 'openrouter': return 'e.g. meta-llama/llama-3.3-70b-instruct, anthropic/claude-3.7-sonnet';
    case 'opencode': return 'e.g. opencode-go-pro, opencode-zen-deepseek-r1';
    case 'ollama': return 'e.g. llama3:8b, mistral:instruct, deepseek-r1:8b';
    default: return 'e.g. custom-model-id';
  }
};
