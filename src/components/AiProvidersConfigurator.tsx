import React, { useState } from 'react';
import { 
  Key, 
  Zap, 
  Server, 
  Compass, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  ExternalLink,
  Bot,
  Brain,
  Globe,
  Sliders,
  Plus
} from 'lucide-react';
import { GlobalSettings } from '../types';

export interface ProviderDefinition {
  id: string;
  name: string;
  badge: string;
  badgeColor: 'emerald' | 'cyan' | 'amber' | 'indigo' | 'rose';
  icon: any;
  keyName: keyof GlobalSettings;
  endpointKeyName?: keyof GlobalSettings;
  defaultEndpoint?: string;
  placeholderKey: string;
  docUrl: string;
  models: {
    id: string;
    name: string;
    description: string;
    tag: string;
    tagColor: string;
    contextWindow: string;
  }[];
}

export const AI_PROVIDERS_CATALOG: ProviderDefinition[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Gemini 3.7 & 2.0 Series',
    badgeColor: 'cyan',
    icon: Sparkles,
    keyName: 'geminiApiKey',
    placeholderKey: 'AIzaSy...',
    docUrl: 'https://aistudio.google.com/app/apikey',
    models: [
      {
        id: 'gemini-3.7-flash',
        name: 'Gemini 3.7 Flash',
        description: 'Next-gen hybrid reasoning & high-speed multilingual intelligence',
        tag: 'Flagship 2026',
        tagColor: 'var(--accent-cyan)',
        contextWindow: '1M tokens'
      },
      {
        id: 'gemini-3.5-flash',
        name: 'Gemini 3.5 Flash',
        description: 'Ultra-fast inference with exceptional context awareness',
        tag: 'Fast & Smart',
        tagColor: 'var(--accent-emerald)',
        contextWindow: '1M tokens'
      },
      {
        id: 'gemini-3.1-pro',
        name: 'Gemini 3.1 Pro',
        description: 'Advanced reasoning and deep structural analysis for complex UI trees',
        tag: 'Deep Reasoning',
        tagColor: 'var(--primary)',
        contextWindow: '2M tokens'
      },
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        description: 'Low-latency real-time response model with multimodal fluency',
        tag: 'Real-Time',
        tagColor: 'var(--accent-amber)',
        contextWindow: '1M tokens'
      },
      {
        id: 'gemini-2.0-flash-thinking-exp',
        name: 'Gemini 2.0 Flash (Thinking)',
        description: 'Explicit reasoning process before producing translation output',
        tag: 'Thinking Mode',
        tagColor: 'var(--accent-purple)',
        contextWindow: '1M tokens'
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Massive 2M token context for translating entire Bubble applications at once',
        tag: '2M Context',
        tagColor: 'var(--accent-emerald)',
        contextWindow: '2M tokens'
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Cost-effective high-volume batch string translator',
        tag: 'Lightweight',
        tagColor: 'var(--text-muted)',
        contextWindow: '1M tokens'
      }
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI',
    badge: 'GPT-4.5, o3-mini & GPT-4o',
    badgeColor: 'emerald',
    icon: Bot,
    keyName: 'openaiApiKey',
    placeholderKey: 'sk-proj-...',
    docUrl: 'https://platform.openai.com/api-keys',
    models: [
      {
        id: 'gpt-4.5-preview',
        name: 'GPT-4.5 (Orion / Flagship)',
        description: 'Next-generation frontier model with broad world knowledge and tone nuance',
        tag: 'State-of-the-Art',
        tagColor: 'var(--accent-emerald)',
        contextWindow: '128k tokens'
      },
      {
        id: 'o3-mini',
        name: 'OpenAI o3-mini',
        description: 'High-speed reasoning model tailored for technical strings, code, and logic',
        tag: 'Reasoning Fast',
        tagColor: 'var(--primary)',
        contextWindow: '200k tokens'
      },
      {
        id: 'o1',
        name: 'OpenAI o1',
        description: 'Full-scale reasoning model for difficult translations and domain terminology',
        tag: 'Deep Reasoning',
        tagColor: 'var(--accent-purple)',
        contextWindow: '200k tokens'
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o (Omni)',
        description: 'Flagship multilingual model with high nuance & style preservation',
        tag: 'Recommended',
        tagColor: 'var(--accent-emerald)',
        contextWindow: '128k tokens'
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'High speed and low cost for massive translation batches',
        tag: 'Fast & Cheap',
        tagColor: 'var(--accent-cyan)',
        contextWindow: '128k tokens'
      },
      {
        id: 'chatgpt-4o-latest',
        name: 'ChatGPT-4o (Latest Snapshot)',
        description: 'Dynamically updated continuously evolving model checkpoint',
        tag: 'Latest',
        tagColor: 'var(--accent-amber)',
        contextWindow: '128k tokens'
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: 'Reliable workhorse model for production deployments',
        tag: 'Stable',
        tagColor: 'var(--text-muted)',
        contextWindow: '128k tokens'
      }
    ]
  },
  {
    id: 'groq',
    name: 'Groq Cloud',
    badge: 'Ultra-Fast Inference (750+ t/s)',
    badgeColor: 'amber',
    icon: Zap,
    keyName: 'groqApiKey',
    placeholderKey: 'gsk_...',
    docUrl: 'https://console.groq.com/keys',
    models: [
      {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B Versatile',
        description: 'State-of-the-art multilingual translation & general intelligence',
        tag: 'Recommended',
        tagColor: 'var(--accent-emerald)',
        contextWindow: '128k tokens'
      },
      {
        id: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B Instant',
        description: 'Blazing speed (750+ tokens/sec) for large batch strings',
        tag: 'Fastest',
        tagColor: 'var(--accent-amber)',
        contextWindow: '128k tokens'
      },
      {
        id: 'deepseek-r1-distill-llama-70b',
        name: 'DeepSeek R1 Distill 70B',
        description: 'Deep reasoning model on Groq hardware',
        tag: 'Reasoning',
        tagColor: 'var(--primary)',
        contextWindow: '128k tokens'
      },
      {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B MoE',
        description: 'High quality European multilingual support',
        tag: 'Multilingual',
        tagColor: 'var(--accent-cyan)',
        contextWindow: '32k tokens'
      },
      {
        id: 'gemma2-9b-it',
        name: 'Google Gemma 2 9B',
        description: 'Compact Google architecture optimized on Groq',
        tag: 'Google',
        tagColor: 'var(--accent-purple)',
        contextWindow: '8k tokens'
      }
    ]
  },
  {
    id: 'opencode',
    name: 'OpenCode Zen / Go',
    badge: 'DeepSeek & Qwen Gateway',
    badgeColor: 'indigo',
    icon: Compass,
    keyName: 'opencodeApiKey',
    endpointKeyName: 'opencodeEndpoint',
    defaultEndpoint: 'https://api.opencode.ai/v1',
    placeholderKey: 'opencode-...',
    docUrl: 'https://opencode.ai',
    models: [
      {
        id: 'deepseek-v3',
        name: 'DeepSeek V3 (671B)',
        description: 'Top-tier open weights model with exceptional translation accuracy',
        tag: 'Flagship',
        tagColor: 'var(--primary)',
        contextWindow: '64k tokens'
      },
      {
        id: 'deepseek-r1',
        name: 'DeepSeek R1',
        description: 'Advanced reasoning and linguistic context analysis',
        tag: 'Reasoning',
        tagColor: 'var(--accent-emerald)',
        contextWindow: '64k tokens'
      },
      {
        id: 'qwen-2.5-72b',
        name: 'Qwen 2.5 72B',
        description: 'High performance across Asian and European languages',
        tag: 'Multilingual',
        tagColor: 'var(--accent-cyan)',
        contextWindow: '128k tokens'
      },
      {
        id: 'qwen-2.5-coder-32b',
        name: 'Qwen 2.5 Coder 32B',
        description: 'Ideal for technical terms, variable placeholders & Bubble code',
        tag: 'Code & Tokens',
        tagColor: 'var(--accent-amber)',
        contextWindow: '128k tokens'
      },
      {
        id: 'llama-3.3-70b',
        name: 'Meta Llama 3.3 70B',
        description: 'Reliable translation and tone adherence',
        tag: 'Meta',
        tagColor: 'var(--accent-purple)',
        contextWindow: '128k tokens'
      }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    badge: 'Claude 3.5 Series',
    badgeColor: 'indigo',
    icon: Brain,
    keyName: 'anthropicApiKey',
    placeholderKey: 'sk-ant-...',
    docUrl: 'https://console.anthropic.com/settings/keys',
    models: [
      {
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet (Latest)',
        description: 'Top-tier writing style, natural fluency, and precise formatting',
        tag: 'Best Quality',
        tagColor: 'var(--primary)',
        contextWindow: '200k tokens'
      },
      {
        id: 'claude-3-5-haiku',
        name: 'Claude 3.5 Haiku',
        description: 'Ultra-fast and cost efficient with near Sonnet-level translation',
        tag: 'Fast & Smart',
        tagColor: 'var(--accent-amber)',
        contextWindow: '200k tokens'
      },
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        description: 'Deep contextual analysis for complex terminology',
        tag: 'Deep Context',
        tagColor: 'var(--accent-purple)',
        contextWindow: '200k tokens'
      }
    ]
  },
  {
    id: 'ollama',
    name: 'Local Llama (Ollama / LM Studio)',
    badge: '100% Offline & Free',
    badgeColor: 'cyan',
    icon: Server,
    keyName: 'ollamaModel' as any,
    endpointKeyName: 'ollamaEndpoint',
    defaultEndpoint: 'http://localhost:11434/v1',
    placeholderKey: 'No API key needed (Local Server)',
    docUrl: 'https://ollama.ai',
    models: [
      {
        id: 'llama3.3:70b',
        name: 'Llama 3.3 70B Local',
        description: 'Full-power local model for high-end GPUs',
        tag: 'High End',
        tagColor: 'var(--primary)',
        contextWindow: '128k tokens'
      },
      {
        id: 'llama3.2',
        name: 'Llama 3.2 (3B / 1B)',
        description: 'Lightweight local model, runs smoothly on CPU/Mac',
        tag: 'Lightweight',
        tagColor: 'var(--accent-cyan)',
        contextWindow: '128k tokens'
      },
      {
        id: 'llama3.1:8b',
        name: 'Llama 3.1 8B',
        description: 'Great balance of local speed and translation fidelity',
        tag: 'Local Standard',
        tagColor: 'var(--accent-emerald)',
        contextWindow: '128k tokens'
      },
      {
        id: 'deepseek-r1:8b',
        name: 'DeepSeek R1 8B Local',
        description: 'Reasoning model distilled for local execution',
        tag: 'Reasoning',
        tagColor: 'var(--accent-purple)',
        contextWindow: '64k tokens'
      },
      {
        id: 'qwen2.5:7b',
        name: 'Qwen 2.5 7B',
        description: 'Superior local multilingual vocabulary',
        tag: 'Multilingual',
        tagColor: 'var(--accent-amber)',
        contextWindow: '32k tokens'
      },
      {
        id: 'mistral:7b',
        name: 'Mistral 7B Instruct',
        description: 'Classic open-source multilingual model',
        tag: 'Mistral',
        tagColor: 'var(--accent-rose)',
        contextWindow: '32k tokens'
      }
    ]
  }
];

interface AiProvidersConfiguratorProps {
  settings: GlobalSettings;
  onChange: (updates: Partial<GlobalSettings>) => void;
}

export const AiProvidersConfigurator: React.FC<AiProvidersConfiguratorProps> = ({
  settings,
  onChange
}) => {
  const [selectedProviderId, setSelectedProviderId] = useState<string>('gemini');
  const [customModelInput, setCustomModelInput] = useState<string>('');

  const currentProvider = AI_PROVIDERS_CATALOG.find(p => p.id === selectedProviderId) || AI_PROVIDERS_CATALOG[0];
  const currentKey = (settings[currentProvider.keyName] as string) || '';
  const currentEndpoint = currentProvider.endpointKeyName ? (settings[currentProvider.endpointKeyName] as string) : '';

  const handleSelectModel = (modelId: string) => {
    onChange({ defaultAiModel: modelId });
  };

  const handleApplyCustomModel = () => {
    if (customModelInput.trim()) {
      onChange({ defaultAiModel: customModelInput.trim() });
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px', alignItems: 'flex-start' }}>
      {/* Left Column: Provider Selection & API Key Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          SELECT AI PROVIDER ({AI_PROVIDERS_CATALOG.length} PROVIDERS)
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {AI_PROVIDERS_CATALOG.map(provider => {
            const isSelected = provider.id === selectedProviderId;
            const Icon = provider.icon;
            const hasKey = Boolean(settings[provider.keyName]) || provider.id === 'ollama';

            return (
              <div
                key={provider.id}
                onClick={() => setSelectedProviderId(provider.id)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-input)',
                  border: isSelected ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isSelected ? 'var(--primary-glow)' : 'rgba(255,255,255,0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isSelected ? 'var(--primary)' : 'var(--text-secondary)'
                  }}>
                    <Icon size={17} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {provider.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {provider.badge}
                    </div>
                  </div>
                </div>

                <div>
                  {hasKey ? (
                    <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                      <CheckCircle2 size={10} /> Active
                    </span>
                  ) : (
                    <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                      No Key
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Provider Credentials Input Box */}
        <div style={{
          marginTop: '10px',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-active)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {currentProvider.name} Credentials
            </span>
            <a
              href={currentProvider.docUrl}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '0.725rem', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
            >
              <span>Get API Key</span>
              <ExternalLink size={11} />
            </a>
          </div>

          {currentProvider.id !== 'ollama' ? (
            <div>
              <label className="input-label">API Key</label>
              <input
                type="password"
                placeholder={currentProvider.placeholderKey}
                value={currentKey}
                onChange={(e) => onChange({ [currentProvider.keyName]: e.target.value })}
                className="input"
              />
            </div>
          ) : (
            <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.08)', padding: '8px 10px', borderRadius: '6px' }}>
              ℹ️ Ollama runs locally on your PC. No API key needed!
            </div>
          )}

          {currentProvider.endpointKeyName && (
            <div>
              <label className="input-label">Custom Base Endpoint URL</label>
              <input
                type="text"
                placeholder={currentProvider.defaultEndpoint || 'http://localhost:...'}
                value={currentEndpoint}
                onChange={(e) => onChange({ [currentProvider.endpointKeyName!]: e.target.value })}
                className="input"
                style={{ fontSize: '0.8rem' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Available LLMs for this provider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              AVAILABLE LLMs FOR {currentProvider.name.toUpperCase()} ({currentProvider.models.length} MODELS)
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Click any model to set it as your default AI translation engine
            </div>
          </div>

          <span className="badge badge-indigo">
            Active Default: <strong>{settings.defaultAiModel}</strong>
          </span>
        </div>

        {/* Models Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {currentProvider.models.map(model => {
            const isDefault = settings.defaultAiModel === model.id;

            return (
              <div
                key={model.id}
                onClick={() => handleSelectModel(model.id)}
                style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: isDefault ? 'var(--bg-surface-elevated)' : 'var(--bg-input)',
                  border: isDefault ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                  boxShadow: isDefault ? 'var(--shadow-glow)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: isDefault ? 'var(--primary)' : 'var(--text-primary)' }}>
                      {model.name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '99px',
                        background: 'rgba(255,255,255,0.06)',
                        color: model.tagColor,
                        border: `1px solid ${model.tagColor}40`
                      }}
                    >
                      {model.tag}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {model.contextWindow}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {model.description}
                  </div>
                </div>

                <div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectModel(model.id);
                    }}
                    className={`btn btn-sm ${isDefault ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.75rem', padding: '6px 14px' }}
                  >
                    {isDefault ? (
                      <>
                        <Check size={13} />
                        <span>Selected Default</span>
                      </>
                    ) : (
                      <span>Select Model</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Model Input Option */}
        <div style={{
          marginTop: '6px',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-input)',
          border: '1px dashed var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ flex: 1 }}>
            <label className="input-label" style={{ marginBottom: '4px' }}>Want a custom / unlisted model?</label>
            <input
              type="text"
              placeholder={`e.g. ${currentProvider.id === 'gemini' ? 'gemini-3.7-flash-custom' : currentProvider.id === 'openai' ? 'gpt-4.5-custom' : 'custom-model-id'}`}
              value={customModelInput}
              onChange={(e) => setCustomModelInput(e.target.value)}
              className="input"
              style={{ fontSize: '0.825rem' }}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomModel()}
            />
          </div>
          <button
            onClick={handleApplyCustomModel}
            className="btn btn-secondary btn-sm"
            style={{ height: '38px', marginTop: '18px' }}
          >
            <Plus size={14} />
            <span>Use Custom Model</span>
          </button>
        </div>
      </div>
    </div>
  );
};
