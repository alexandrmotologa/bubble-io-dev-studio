import React, { useState, useRef, useEffect } from 'react';
import { 
  Languages, 
  Sparkles, 
  Download, 
  Upload, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Zap,
  Server,
  FileSpreadsheet,
  Key,
  Compass
} from 'lucide-react';
import { GlobalSettings, TranslationItem, TranslationJobConfig } from '../types';
import { TranslatorEngine } from '../core/translator/translatorEngine';
import { GuideBanner } from '../components/GuideBanner';

interface TranslatorViewProps {
  settings?: GlobalSettings;
  onLog: (module: 'translator', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const TranslatorView: React.FC<TranslatorViewProps> = ({ settings, onLog }) => {
  const [items, setItems] = useState<TranslationItem[]>(TranslatorEngine.getSampleItems());
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('ro');
  const [provider, setProvider] = useState<'openai' | 'groq' | 'opencode' | 'ollama' | 'anthropic' | 'gemini' | 'mock'>('groq');
  const [model, setModel] = useState('llama-3.3-70b-versatile');
  const [tone, setTone] = useState<'professional' | 'casual' | 'formal' | 'concise'>('professional');
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [glossary, setGlossary] = useState<Record<string, string>>({
    'Pro': 'Pro',
    'Bubble': 'Bubble'
  });
  const [newSourceText, setNewSourceText] = useState('');
  const [newKey, setNewKey] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update default model when provider changes
  useEffect(() => {
    if (provider === 'groq') {
      setModel('llama-3.3-70b-versatile');
    } else if (provider === 'opencode') {
      setModel('deepseek-v3');
    } else if (provider === 'ollama') {
      setModel(settings?.ollamaModel || 'llama3.2');
    } else if (provider === 'openai') {
      setModel('gpt-4o');
    } else if (provider === 'anthropic') {
      setModel('claude-3-5-sonnet');
    } else if (provider === 'gemini') {
      setModel('gemini-1.5-pro');
    }
  }, [provider, settings]);

  const hasGroqKey = Boolean(settings?.groqApiKey);
  const hasOpenCodeKey = Boolean(settings?.opencodeApiKey);
  const hasOpenAiKey = Boolean(settings?.openaiApiKey);

  const handleRunTranslation = async () => {
    if (isTranslating || items.length === 0) return;
    setIsTranslating(true);
    setProgress({ current: 0, total: items.length });

    onLog('translator', `Starting AI batch translation to ${targetLang.toUpperCase()} via ${provider.toUpperCase()} (${model})...`);

    const config: TranslationJobConfig = {
      sourceLang,
      targetLang,
      provider,
      model,
      temperature: 0.2,
      tone,
      useGlossary: true,
      glossary,
      customEndpoint: provider === 'opencode' ? settings?.opencodeEndpoint : settings?.ollamaEndpoint
    };

    try {
      const result = await TranslatorEngine.runTranslation(
        items,
        config,
        {
          openai: settings?.openaiApiKey,
          groq: settings?.groqApiKey,
          opencode: settings?.opencodeApiKey,
          ollamaEndpoint: settings?.ollamaEndpoint
        },
        (cur, tot) => {
          setProgress({ current: cur, total: tot });
          onLog('translator', `Translated item ${cur}/${tot}...`);
        }
      );

      setItems(result.items);
      onLog('translator', `Translation job completed! ${result.successCount} items translated (${result.tokensUsed} tokens used).`, 'success');
    } catch (e: any) {
      onLog('translator', `Translation failed: ${e.message}`, 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = TranslatorEngine.parseBubbleCsv(text);
        if (parsed.length > 0) {
          setItems(parsed);
          setUploadedFileName(file.name);
          onLog('translator', `Successfully imported ${parsed.length} strings from ${file.name}.`, 'success');
        } else {
          alert('Could not parse any strings from CSV. Please check formatting.');
        }
      } catch (err: any) {
        onLog('translator', `CSV parse error: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleExportCsv = () => {
    const csv = TranslatorEngine.exportToBubbleCsv(items, targetLang);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bubble_translations_${targetLang}_${Date.now()}.csv`;
    a.click();
    onLog('translator', `Exported Bubble App Text CSV for ${targetLang.toUpperCase()}.`, 'success');
  };

  const handleAddItem = () => {
    if (!newSourceText.trim()) return;
    const newItem: TranslationItem = {
      id: `custom_${Date.now()}`,
      key: newKey.trim() || `app_text_${items.length + 1}`,
      sourceText: newSourceText.trim(),
      category: 'ui',
      status: 'pending'
    };
    setItems([newItem, ...items]);
    setNewSourceText('');
    setNewKey('');
    onLog('translator', `Added new text entry: '${newItem.key}'`);
  };

  const handleUpdateTranslation = (id: string, text: string) => {
    setItems(items.map(item => item.id === id ? { ...item, translatedText: text, status: 'reviewed' } : item));
  };

  const guideSteps = [
    {
      title: 'Export CSV from Bubble',
      desc: 'In Bubble Editor, go to Settings > Languages and click "Export application text as CSV".',
      bubbleLocation: 'Bubble Editor > Settings > Languages'
    },
    {
      title: 'Choose AI Provider',
      desc: 'Select Groq (Ultra-Fast), OpenCode Zen/Go (DeepSeek/Qwen), Local Llama, or OpenAI.',
      bubbleLocation: 'Studio > AI Provider > Translate with AI'
    },
    {
      title: 'Import back to Bubble',
      desc: 'Export the translated CSV and import it into Bubble Languages to instantly localize your entire app.',
      bubbleLocation: 'Bubble Editor > Settings > Languages > Import'
    }
  ];

  return (
    <div className="view-container">
      {/* Interactive In-App Guide Banner */}
      <GuideBanner
        moduleName="AI Localization Studio"
        summary="Translate your Bubble.io app with Groq (Llama 3.3), OpenCode Zen/Go (DeepSeek/Qwen), Local Llama (Ollama), or OpenAI."
        steps={guideSteps}
        bubbleDocUrl="https://manual.bubble.io/help-guides/design/multi-language"
      />

      {/* Top Configuration Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="card-title">
                <Languages size={20} color="var(--accent-cyan)" />
                <span>AI Localization Multi-Engine</span>
              </div>

              {provider === 'groq' && (
                hasGroqKey ? (
                  <span className="badge badge-emerald">
                    <Zap size={11} /> Groq Cloud (Llama 3.3) Live
                  </span>
                ) : (
                  <span className="badge badge-amber">
                    <Key size={11} /> Groq Sandbox Mode
                  </span>
                )
              )}

              {provider === 'opencode' && (
                hasOpenCodeKey ? (
                  <span className="badge badge-emerald">
                    <Compass size={11} /> OpenCode Zen / Go Live
                  </span>
                ) : (
                  <span className="badge badge-amber">
                    <Key size={11} /> OpenCode Sandbox
                  </span>
                )
              )}

              {provider === 'ollama' && (
                <span className="badge badge-cyan">
                  <Server size={11} /> Local Llama (Ollama / Offline)
                </span>
              )}

              {provider === 'openai' && (
                hasOpenAiKey ? (
                  <span className="badge badge-emerald">
                    <CheckCircle2 size={11} /> OpenAI API Live
                  </span>
                ) : (
                  <span className="badge badge-amber">
                    <Key size={11} /> OpenAI Sandbox
                  </span>
                )
              )}
            </div>
            <div className="card-subtitle">
              Batch translate all Bubble.io app texts with Groq, OpenCode Zen/Go, Local Llama, or OpenAI
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleCsvUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary btn-sm"
              title="Upload your Bubble.io App Text CSV export"
            >
              <Upload size={14} />
              <span>Upload Bubble CSV</span>
            </button>

            <button onClick={handleExportCsv} className="btn btn-secondary btn-sm">
              <Download size={14} />
              <span>Export Bubble CSV</span>
            </button>

            <button 
              onClick={handleRunTranslation} 
              disabled={isTranslating} 
              className="btn btn-primary btn-sm"
            >
              <Sparkles size={14} />
              <span>{isTranslating ? `Translating (${progress.current}/${progress.total})...` : 'Translate with AI'}</span>
            </button>
          </div>
        </div>

        {/* Translation Settings Grid */}
        <div className="grid-4" style={{ marginTop: '12px' }}>
          <div>
            <label className="input-label">Target Language</label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="select"
            >
              <option value="ro">Romanian (Română)</option>
              <option value="fr">French (Français)</option>
              <option value="es">Spanish (Español)</option>
              <option value="de">German (Deutsch)</option>
              <option value="it">Italian (Italiano)</option>
              <option value="pt">Portuguese (Português)</option>
              <option value="uk">Ukrainian (Українська)</option>
            </select>
          </div>

          <div>
            <label className="input-label">AI Engine / Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as any)}
              className="select"
            >
              <option value="groq">⚡ Groq Console (Llama 3.3 - Fast)</option>
              <option value="opencode">🧭 OpenCode Zen / Go (DeepSeek / Qwen)</option>
              <option value="ollama">🖥️ Local Llama (Ollama / Offline)</option>
              <option value="openai">🤖 OpenAI (GPT-4o)</option>
              <option value="anthropic">🧠 Anthropic Claude</option>
              <option value="gemini">✨ Google Gemini</option>
              <option value="mock">📦 Local Sandbox Engine</option>
            </select>
          </div>

          <div>
            <label className="input-label">AI Model</label>
            {provider === 'groq' ? (
              <select value={model} onChange={(e) => setModel(e.target.value)} className="select">
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Recommended)</option>
                <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant (Ultra-Fast)</option>
                <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                <option value="gemma2-9b-it">Gemma 2 9B</option>
              </select>
            ) : provider === 'opencode' ? (
              <select value={model} onChange={(e) => setModel(e.target.value)} className="select">
                <option value="deepseek-v3">DeepSeek V3 (Recommended)</option>
                <option value="deepseek-r1">DeepSeek R1 (Reasoning)</option>
                <option value="qwen-2.5-72b">Qwen 2.5 72B</option>
                <option value="llama-3.3-70b">Llama 3.3 70B</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
              </select>
            ) : provider === 'ollama' ? (
              <select value={model} onChange={(e) => setModel(e.target.value)} className="select">
                <option value="llama3.2">llama3.2 (Default)</option>
                <option value="llama3.1:8b">llama3.1:8b</option>
                <option value="mistral">mistral:7b</option>
                <option value="qwen2.5">qwen2.5:7b</option>
              </select>
            ) : (
              <select value={model} onChange={(e) => setModel(e.target.value)} className="select">
                <option value="gpt-4o">GPT-4o (Multilingual)</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </select>
            )}
          </div>

          <div>
            <label className="input-label">Tone of Voice</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as any)}
              className="select"
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual & Friendly</option>
              <option value="formal">Formal</option>
              <option value="concise">Concise & Direct</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add New String Card */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ width: '220px' }}>
            <label className="input-label">Bubble App Text Key</label>
            <input
              type="text"
              placeholder="e.g. btn_confirm_order"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="input"
            />
          </div>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <label className="input-label">English / Source Text</label>
            <input
              type="text"
              placeholder="Type or paste UI text to translate..."
              value={newSourceText}
              onChange={(e) => setNewSourceText(e.target.value)}
              className="input"
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            />
          </div>
          <button onClick={handleAddItem} className="btn btn-secondary btn-sm" style={{ height: '38px' }}>
            <Plus size={15} />
            <span>Add Text</span>
          </button>
        </div>
      </div>

      {/* Translations Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="card-title">
                <span>App Texts & Live Translations ({items.length})</span>
              </div>
              {uploadedFileName && (
                <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                  <FileSpreadsheet size={11} /> {uploadedFileName}
                </span>
              )}
            </div>
            <div className="card-subtitle">
              Edit translations directly or batch update with the selected AI model
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map(item => (
            <div
              key={item.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '240px 1fr 1fr 110px',
                gap: '16px',
                alignItems: 'center',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div>
                <code style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>{item.key}</code>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {item.category} text
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {item.sourceText}
              </div>

              <div>
                <input
                  type="text"
                  value={item.translatedText || ''}
                  placeholder="Pending translation..."
                  onChange={(e) => handleUpdateTranslation(item.id, e.target.value)}
                  className="input"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div>
                {item.status === 'translated' || item.status === 'reviewed' ? (
                  <span className="badge badge-emerald">
                    <CheckCircle2 size={12} />
                    Ready
                  </span>
                ) : (
                  <span className="badge badge-amber">
                    <Clock size={12} />
                    Pending
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
