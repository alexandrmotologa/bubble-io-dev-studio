import React, { useState, useEffect } from 'react';
import { 
  Languages, 
  Sparkles, 
  Download, 
  Upload, 
  Plus, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  ArrowRight, 
  Play, 
  DollarSign, 
  Database, 
  FileText, 
  Trash2, 
  SlidersHorizontal,
  Search,
  Layers,
  Globe,
  Grid,
  FileCode
} from 'lucide-react';
import { CostEstimate, TranslationItem, TranslationJobConfig, TranslationMemoryStats, TranslationProviderType } from '../types';
import { TranslatorEngine } from '../core/translator/translatorEngine';
import { BUBBLE_LANGUAGES, DEFAULT_TARGET_LANGUAGE, DEFAULT_SOURCE_LANGUAGE, getLanguageDisplayName } from '../core/translator/bubbleLanguages';
import { SearchableLanguageSelect } from '../components/SearchableLanguageSelect';

interface TranslatorViewProps {
  settings?: GlobalSettings;
  onLog: (module: 'translator', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
  geminiApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  openrouterApiKey?: string;
  groqApiKey?: string;
  xaiApiKey?: string;
  opencodeApiKey?: string;
  ollamaUrl?: string;
}

type TranslatorSubTab = 'studio' | 'glossary' | 'cache' | 'pseudo' | 'cost';

const PROVIDER_MODELS: Record<TranslationProviderType, { id: string; name: string }[]> = {
  gemini: [
    { id: 'gemini-2.0-flash', name: 'Google Gemini 2.0 Flash (Fast & Recommended)' },
    { id: 'gemini-2.0-pro-exp-02-05', name: 'Google Gemini 2.0 Pro (Experimental)' },
    { id: 'gemini-1.5-pro', name: 'Google Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', name: 'Google Gemini 1.5 Flash' }
  ],
  openai: [
    { id: 'gpt-4o', name: 'OpenAI GPT-4o (Omni Multi-modal)' },
    { id: 'gpt-4o-mini', name: 'OpenAI GPT-4o Mini (Cost-efficient)' },
    { id: 'o3-mini', name: 'OpenAI o3-mini' },
    { id: 'gpt-4-turbo', name: 'OpenAI GPT-4 Turbo' }
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Fast)' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' }
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Groq LPU)' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Ultra-Fast)' },
    { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32k Context)' },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT' }
  ],
  xai: [
    { id: 'grok-2-latest', name: 'Grok 2 (xAI State-of-the-Art)' },
    { id: 'grok-2-vision-1212', name: 'Grok 2 Vision' },
    { id: 'grok-beta', name: 'Grok Beta' }
  ],
  opencode: [
    { id: 'opencode-go-pro', name: 'OpenCode Go Pro (Fast Routing)' },
    { id: 'opencode-zen-deepseek-r1', name: 'OpenCode Zen (DeepSeek R1)' },
    { id: 'opencode-zen-claude-3-5', name: 'OpenCode Zen (Claude 3.5 Sonnet)' },
    { id: 'opencode-zen-gpt-4o', name: 'OpenCode Zen (GPT-4o)' }
  ],
  openrouter: [
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (OpenRouter)' },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Meta Llama 3.3 70B' },
    { id: 'google/gemini-2.0-flash-001', name: 'Google Gemini 2.0 Flash (OpenRouter)' }
  ],
  ollama: [
    { id: 'llama3', name: 'Ollama Llama 3 (Local)' },
    { id: 'mistral', name: 'Ollama Mistral 7B (Local)' },
    { id: 'qwen2.5', name: 'Ollama Qwen 2.5 (Local)' },
    { id: 'phi3', name: 'Ollama Phi-3 Mini (Local)' }
  ],
  mock: [
    { id: 'mock-offline-translator', name: 'Built-in Offline Studio Engine' }
  ]
};

export const TranslatorView: React.FC<TranslatorViewProps> = ({ 
  onLog,
  geminiApiKey,
  openaiApiKey,
  anthropicApiKey,
  openrouterApiKey,
  ollamaUrl
}) => {
  const [subTab, setSubTab] = useState<TranslatorSubTab>('studio');
  const [items, setItems] = useState<TranslationItem[]>([]);
  const [sourceLang, setSourceLang] = useState(DEFAULT_SOURCE_LANGUAGE);
  const [selectedTargetLangs, setSelectedTargetLangs] = useState<string[]>([DEFAULT_TARGET_LANGUAGE]);
  const [activeDisplayLang, setActiveDisplayLang] = useState<string>(DEFAULT_TARGET_LANGUAGE);
  const [viewMode, setViewMode] = useState<'single' | 'matrix'>('single');

  const [provider, setProvider] = useState<TranslationProviderType>('gemini');
  const [model, setModel] = useState('gemini-2.0-flash');
  const [tone, setTone] = useState<'professional' | 'casual' | 'formal' | 'concise' | 'marketing'>('professional');
  const [useGlossary, setUseGlossary] = useState(true);
  const [useCache, setUseCache] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);

  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [multiProgress, setMultiProgress] = useState<{
    currentLang: string;
    langIndex: number;
    totalLangs: number;
    itemIndex: number;
    totalItems: number;
  }>({
    currentLang: '',
    langIndex: 0,
    totalLangs: 0,
    itemIndex: 0,
    totalItems: 0
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Glossary State
  const [glossary, setGlossary] = useState<Record<string, string>>(TranslatorEngine.getGlossary());
  const [newGlossaryTerm, setNewGlossaryTerm] = useState('');
  const [newGlossaryRepl, setNewGlossaryRepl] = useState('');

  // Cache Memory State
  const [memoryStats, setMemoryStats] = useState<TranslationMemoryStats>(TranslatorEngine.getMemoryStats());

  // Cost Estimates
  const [costEstimates, setCostEstimates] = useState<CostEstimate[]>([]);

  // Add Item State
  const [newSourceText, setNewSourceText] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newCategory, setNewCategory] = useState<'ui' | 'error' | 'notification' | 'email' | 'db_value' | 'option_set'>('ui');

  useEffect(() => {
    setCostEstimates(TranslatorEngine.estimateCosts(items));
    setMemoryStats(TranslatorEngine.getMemoryStats());
  }, [items]);

  // Keep activeDisplayLang in sync with selectedTargetLangs
  useEffect(() => {
    if (selectedTargetLangs.length > 0 && !selectedTargetLangs.includes(activeDisplayLang)) {
      setActiveDisplayLang(selectedTargetLangs[0]);
    }
  }, [selectedTargetLangs]);

  const handleProviderChange = (newProvider: TranslationProviderType) => {
    setProvider(newProvider);
    const availableModels = PROVIDER_MODELS[newProvider];
    if (availableModels && availableModels.length > 0) {
      setModel(availableModels[0].id);
    }
  };

  const handleRunTranslation = async () => {
    if (isTranslating || items.length === 0 || selectedTargetLangs.length === 0) return;
    setIsTranslating(true);
    const totalOps = selectedTargetLangs.length * items.length;
    setProgress({ current: 0, total: totalOps });

    onLog('translator', `Starting AI translation across ${selectedTargetLangs.length} language(s) [${selectedTargetLangs.join(', ')}] using ${provider.toUpperCase()} (${model})...`);

    const baseConfig: Omit<TranslationJobConfig, 'targetLang'> = {
      sourceLang,
      provider,
      model,
      temperature: 0.2,
      tone,
      useGlossary,
      useCache,
      glossary
    };

    try {
      const multiResult = await TranslatorEngine.runMultiLanguageTranslation(
        items,
        selectedTargetLangs,
        baseConfig,
        (langIdx, totalLangs, itemIdx, totalItems, currentLang) => {
          setMultiProgress({ currentLang, langIndex: langIdx, totalLangs, itemIndex: itemIdx, totalItems });
          setProgress({ current: (langIdx - 1) * totalItems + itemIdx, total: totalLangs * totalItems });
          onLog('translator', `[${currentLang.toUpperCase()}] Translated string ${itemIdx}/${totalItems} (Language ${langIdx}/${totalLangs})...`);
        }
      );

      setItems(multiResult.items);
      setMemoryStats(TranslatorEngine.getMemoryStats());
      onLog('translator', `Multi-language translation completed! Processed ${items.length} strings across ${selectedTargetLangs.length} languages (${multiResult.tokensUsed} tokens used).`, 'success');
    } catch (e: any) {
      onLog('translator', `Translation error: ${e.message}`, 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleRunPseudoLocalization = () => {
    const pseudoItems = TranslatorEngine.generatePseudoLocalization(items);
    setItems(pseudoItems);
    onLog('translator', `Generated pseudo-localization for ${items.length} strings with expansion padding for UI layout testing.`, 'success');
  };

  const handleExportSingleCsv = (lang: string) => {
    if (items.length === 0) return;
    // Map items for this specific language
    const langItems = items.map(item => ({
      ...item,
      translatedText: item.translations?.[lang] || item.translatedText || ''
    }));

    const csv = TranslatorEngine.exportToBubbleCsv(langItems, lang);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bubble_translations_${lang}_${Date.now()}.csv`;
    a.click();
    onLog('translator', `Exported Bubble App Text CSV for ${lang.toUpperCase()}.`, 'success');
  };

  const handleExportAllLanguages = () => {
    if (items.length === 0) return;
    selectedTargetLangs.forEach((lang, idx) => {
      setTimeout(() => {
        handleExportSingleCsv(lang);
      }, idx * 250);
    });
  };

  const handleExportJsonBundle = () => {
    if (items.length === 0) return;
    const bundle: Record<string, Record<string, string>> = {};

    selectedTargetLangs.forEach(lang => {
      bundle[lang] = {};
      items.forEach(item => {
        bundle[lang][item.key] = item.translations?.[lang] || item.translatedText || '';
      });
    });

    const jsonStr = JSON.stringify(bundle, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bubble_multi_language_bundle_${Date.now()}.json`;
    a.click();
    onLog('translator', `Exported Consolidated JSON for ${selectedTargetLangs.length} languages.`, 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.name.endsWith('.csv')) {
        const parsed = TranslatorEngine.parseBubbleCsv(content);
        setItems(parsed);
        onLog('translator', `Imported ${parsed.length} strings from Bubble CSV: ${file.name}`, 'success');
      } else {
        try {
          const json = JSON.parse(content);
          const extracted = TranslatorEngine.extractFromBubbleJson(json);
          setItems(extracted);
          onLog('translator', `Extracted ${extracted.length} strings & Option Sets from ${file.name}`, 'success');
        } catch {
          onLog('translator', `Failed to parse ${file.name}`, 'error');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleStrings = () => {
    const samples = TranslatorEngine.getSampleItems();
    setItems(samples);
    onLog('translator', `Loaded ${samples.length} sample application texts for testing.`, 'info');
  };

  const handleAddGlossaryTerm = () => {
    if (!newGlossaryTerm.trim()) return;
    const updated = { ...glossary, [newGlossaryTerm.trim()]: newGlossaryRepl.trim() || newGlossaryTerm.trim() };
    setGlossary(updated);
    TranslatorEngine.saveGlossary(updated);
    setNewGlossaryTerm('');
    setNewGlossaryRepl('');
    onLog('translator', `Added protected glossary term: "${newGlossaryTerm}"`);
  };

  const handleRemoveGlossaryTerm = (term: string) => {
    const updated = { ...glossary };
    delete updated[term];
    setGlossary(updated);
    TranslatorEngine.saveGlossary(updated);
    onLog('translator', `Removed glossary term: "${term}"`);
  };

  const handleClearCache = () => {
    TranslatorEngine.clearMemoryCache();
    setMemoryStats(TranslatorEngine.getMemoryStats());
    onLog('translator', 'Translation memory cache cleared.', 'warn');
  };

  const handleAddItem = () => {
    if (!newSourceText.trim()) return;
    const newItem: TranslationItem = {
      id: `custom_${Date.now()}`,
      key: newKey.trim() || `app_text_${items.length + 1}`,
      sourceText: newSourceText.trim(),
      category: newCategory,
      translations: {},
      status: 'pending'
    };
    setItems([newItem, ...items]);
    setNewSourceText('');
    setNewKey('');
    onLog('translator', `Added new text entry: '${newItem.key}'`);
  };

  const handleUpdateTranslation = (id: string, text: string, lang: string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedTrans = { ...(item.translations || {}), [lang]: text };
        return {
          ...item,
          translations: updatedTrans,
          translatedText: lang === activeDisplayLang ? text : item.translatedText,
          status: 'reviewed'
        };
      }
      return item;
    }));
  };

  const filteredItems = items.filter(item => {
    const q = searchTerm.toLowerCase();
    const matchesKey = item.key.toLowerCase().includes(q);
    const matchesSource = item.sourceText.toLowerCase().includes(q);
    const matchesCurrent = item.translations?.[activeDisplayLang]?.toLowerCase().includes(q) || item.translatedText?.toLowerCase().includes(q);
    return !searchTerm || matchesKey || matchesSource || matchesCurrent;
  });

  return (
    <div className="view-container">
      {/* Sub Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
          <button onClick={() => setSubTab('studio')} className={`btn btn-sm ${subTab === 'studio' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
            <Languages size={13} />
            <span>Localization Studio ({items.length})</span>
          </button>
          <button onClick={() => setSubTab('glossary')} className={`btn btn-sm ${subTab === 'glossary' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
            <BookOpen size={13} />
            <span>Protected Glossary ({Object.keys(glossary).length})</span>
          </button>
          <button onClick={() => setSubTab('cache')} className={`btn btn-sm ${subTab === 'cache' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
            <Database size={13} />
            <span>Translation Memory</span>
          </button>
          <button onClick={() => setSubTab('pseudo')} className={`btn btn-sm ${subTab === 'pseudo' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
            <FileText size={13} />
            <span>Pseudo-Localization</span>
          </button>
          <button onClick={() => setSubTab('cost')} className={`btn btn-sm ${subTab === 'cost' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
            <DollarSign size={13} />
            <span>Cost Estimator</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
            <Upload size={13} />
            <span>Import Bubble CSV / .bubble</span>
            <input type="file" accept=".csv,.json,.bubble" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          {selectedTargetLangs.length > 1 ? (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={handleExportAllLanguages}
                disabled={items.length === 0}
                className="btn btn-primary btn-sm"
                title="Export separate CSV files for all selected languages"
              >
                <Download size={13} />
                <span>Export {selectedTargetLangs.length} CSVs</span>
              </button>
              <button
                onClick={handleExportJsonBundle}
                disabled={items.length === 0}
                className="btn btn-secondary btn-sm"
                title="Export single consolidated JSON for all target languages"
              >
                <FileCode size={13} />
                <span>JSON Bundle</span>
              </button>
            </div>
          ) : (
            <button onClick={() => handleExportSingleCsv(selectedTargetLangs[0] || 'en_us')} disabled={items.length === 0} className="btn btn-primary btn-sm">
              <Download size={13} />
              <span>Export Bubble CSV ({selectedTargetLangs[0]?.toUpperCase()})</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Configuration Toolbar */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Languages size={20} color="var(--accent-cyan)" />
              <span>Multi-Provider AI Localization Engine</span>
            </div>
            <div className="card-subtitle">
              Batch translate Bubble.io application strings concurrently into single or multiple target languages
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handleRunTranslation}
              disabled={isTranslating || items.length === 0 || selectedTargetLangs.length === 0}
              className="btn btn-primary"
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
            >
              <Sparkles size={15} className={isTranslating ? 'spin' : ''} />
              <span>
                {isTranslating 
                  ? `Translating (${progress.current}/${progress.total})...` 
                  : selectedTargetLangs.length > 1
                    ? `Translate to ${selectedTargetLangs.length} Languages (${items.length * selectedTargetLangs.length} ops)`
                    : `Translate All Strings (${items.length})`
                }
              </span>
            </button>
          </div>
        </div>

        {/* Translation Configuration Grid */}
        <div className="grid-4" style={{ marginTop: '12px', alignItems: 'flex-start' }}>
          {/* 1. Searchable Target Languages Dropdown */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="input-label" style={{ margin: 0 }}>
                Target Languages ({selectedTargetLangs.length} Selected of {BUBBLE_LANGUAGES.length})
              </label>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
                Search & Multi-Select enabled
              </span>
            </div>
            <SearchableLanguageSelect
              selectedLanguages={selectedTargetLangs}
              onChange={setSelectedTargetLangs}
              isMultiSelect={true}
            />
          </div>

          {/* 2. Provider Selector */}
          <div>
            <label className="input-label">AI Provider</label>
            <select value={provider} onChange={e => handleProviderChange(e.target.value as any)} className="select">
              <option value="gemini">Google Gemini (Gemini 2.0 / 1.5)</option>
              <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
              <option value="anthropic">Anthropic (Claude 3.5 Sonnet / Haiku)</option>
              <option value="groq">Groq (Ultra-Fast LPUs)</option>
              <option value="xai">xAI (Grok)</option>
              <option value="opencode">OpenCode (Go / Zen)</option>
              <option value="openrouter">OpenRouter (Global Multi-LLM)</option>
              <option value="ollama">Ollama (Local / Free Offline)</option>
              <option value="mock">Built-in Studio Engine</option>
            </select>
          </div>

          {/* 3. Model Selector */}
          <div>
            <label className="input-label">Model for {provider.toUpperCase()}</label>
            <select value={model} onChange={e => setModel(e.target.value)} className="select">
              {PROVIDER_MODELS[provider]?.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Second Row: Tone & Flags */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tone of Voice:</span>
            <select
              value={tone}
              onChange={e => setTone(e.target.value as any)}
              className="select"
              style={{ width: 'auto', padding: '4px 10px', height: '30px', fontSize: '0.8rem' }}
            >
              <option value="professional">Professional (Default)</option>
              <option value="casual">Casual & Friendly</option>
              <option value="formal">Formal</option>
              <option value="concise">Concise (Short UI Buttons)</option>
              <option value="marketing">Marketing & Engaging</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '20px', fontSize: '0.825rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={useGlossary} onChange={e => setUseGlossary(e.target.checked)} />
              <span>Glossary Protection ({Object.keys(glossary).length} terms)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={useCache} onChange={e => setUseCache(e.target.checked)} />
              <span>Translation Memory ({memoryStats.totalCachedEntries} cached)</span>
            </label>
          </div>
        </div>

        {/* Live Multi-Language Progress Bar */}
        {isTranslating && (
          <div style={{ marginTop: '14px', padding: '12px 14px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-active)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.825rem' }}>
              <span>
                <strong>Translating to {multiProgress.currentLang.toUpperCase()}</strong> ({multiProgress.itemIndex}/{multiProgress.totalItems}) • Language {multiProgress.langIndex} of {multiProgress.totalLangs}
              </span>
              <span>{Math.round((progress.current / (progress.total || 1)) * 100)}%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.round((progress.current / (progress.total || 1)) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #06b6d4)', transition: 'width 0.2s ease' }} />
            </div>
          </div>
        )}
      </div>

      {/* SUBTAB 1: LOCALIZATION STUDIO */}
      {subTab === 'studio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Add String Row */}
          <div className="card" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ width: '180px' }}>
                <label className="input-label">App Text Key</label>
                <input type="text" placeholder="e.g. btn_submit" value={newKey} onChange={e => setNewKey(e.target.value)} className="input" />
              </div>
              <div style={{ width: '140px' }}>
                <label className="input-label">Category</label>
                <select value={newCategory} onChange={e => setNewCategory(e.target.value as any)} className="select">
                  <option value="ui">UI Label</option>
                  <option value="error">Error Message</option>
                  <option value="notification">Notification</option>
                  <option value="email">Email Body</option>
                  <option value="option_set">Option Set</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <label className="input-label">English / Source Text</label>
                <input type="text" placeholder="Type text to translate..." value={newSourceText} onChange={e => setNewSourceText(e.target.value)} className="input" onKeyDown={e => e.key === 'Enter' && handleAddItem()} />
              </div>
              <button onClick={handleAddItem} className="btn btn-secondary btn-sm" style={{ height: '38px' }}>
                <Plus size={14} />
                <span>Add Text</span>
              </button>
            </div>
          </div>

          {/* EMPTY STATE: No items */}
          {items.length === 0 ? (
            <div className="card" style={{
              textAlign: 'center',
              padding: '60px 24px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(99, 102, 241, 0.08) 100%)',
              border: '1px solid var(--border-active)'
            }}>
              <Languages size={44} color="var(--accent-cyan)" style={{ margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                No Application Strings Loaded
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                Import your official Bubble.io <code>language_translation_data.csv</code> file, extract strings from a <code>.bubble</code> export, or load sample texts to test multi-language AI translation.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <label className="btn btn-primary" style={{ cursor: 'pointer', padding: '10px 20px' }}>
                  <Upload size={16} />
                  <span>Import Bubble CSV / .bubble File</span>
                  <input type="file" accept=".csv,.json,.bubble" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
                <button onClick={handleLoadSampleStrings} className="btn btn-secondary" style={{ padding: '10px 20px' }}>
                  <Sparkles size={16} />
                  <span>Load Sample App Strings</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Language Switcher Tabs & View Mode Selector */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: '240px' }}>
                    <Search size={13} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="Filter strings..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input" style={{ paddingLeft: '30px', height: '34px', fontSize: '0.8rem' }} />
                  </div>

                  {/* Multi-language view switcher */}
                  {selectedTargetLangs.length > 1 && (
                    <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <button
                        onClick={() => setViewMode('single')}
                        className={`btn btn-sm ${viewMode === 'single' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ border: 'none', height: '28px', fontSize: '0.725rem', padding: '0 8px' }}
                      >
                        Single View
                      </button>
                      <button
                        onClick={() => setViewMode('matrix')}
                        className={`btn btn-sm ${viewMode === 'matrix' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ border: 'none', height: '28px', fontSize: '0.725rem', padding: '0 8px' }}
                      >
                        <Grid size={12} />
                        <span>Matrix View ({selectedTargetLangs.length} Langs)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Target Language Switcher Chips */}
                {viewMode === 'single' && selectedTargetLangs.length > 1 && (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Viewing:</span>
                    {selectedTargetLangs.map(lang => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setActiveDisplayLang(lang)}
                        className={`btn btn-sm ${activeDisplayLang === lang ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.725rem', padding: '3px 8px', height: '26px' }}
                      >
                        <span>{lang.toUpperCase()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Table rendering based on viewMode */}
              {viewMode === 'single' ? (
                <div className="card">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filteredItems.map(item => {
                      const currentTranslation = item.translations?.[activeDisplayLang] || (activeDisplayLang === selectedTargetLangs[0] ? item.translatedText : '') || '';
                      const isTranslated = Boolean(currentTranslation);

                      return (
                        <div
                          key={item.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '220px 1fr 1fr 140px',
                            gap: '14px',
                            alignItems: 'center',
                            padding: '12px 14px',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{item.key}</div>
                            <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
                              <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>{item.category}</span>
                              {item.context && <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>{item.context}</span>}
                            </div>
                          </div>

                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {item.sourceText}
                          </div>

                          <div>
                            <input
                              type="text"
                              value={currentTranslation}
                              placeholder={`Translate to ${activeDisplayLang.toUpperCase()}...`}
                              onChange={e => handleUpdateTranslation(item.id, e.target.value, activeDisplayLang)}
                              className="input"
                              style={{
                                fontSize: '0.85rem',
                                borderColor: isTranslated ? 'var(--border-subtle)' : 'var(--accent-amber)'
                              }}
                            />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
                            {isTranslated ? (
                              <span className="badge badge-emerald"><CheckCircle2 size={11} /> {activeDisplayLang.toUpperCase()} Ready</span>
                            ) : (
                              <span className="badge badge-amber"><Clock size={11} /> Pending</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Multi-Language Matrix View */
                <div className="card" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '10px 12px', width: '180px' }}>Key & Category</th>
                        <th style={{ padding: '10px 12px', minWidth: '200px' }}>Source (English)</th>
                        {selectedTargetLangs.map(lang => (
                          <th key={lang} style={{ padding: '10px 12px', minWidth: '220px' }}>
                            <span className="badge badge-cyan">{lang.toUpperCase()}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.key}</div>
                            <span className="badge badge-indigo" style={{ fontSize: '0.625rem', marginTop: '2px' }}>{item.category}</span>
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', verticalAlign: 'top' }}>
                            {item.sourceText}
                          </td>
                          {selectedTargetLangs.map(lang => {
                            const val = item.translations?.[lang] || (lang === selectedTargetLangs[0] ? item.translatedText : '') || '';
                            return (
                              <td key={lang} style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                                <input
                                  type="text"
                                  value={val}
                                  placeholder="Pending..."
                                  onChange={e => handleUpdateTranslation(item.id, e.target.value, lang)}
                                  className="input"
                                  style={{
                                    fontSize: '0.8rem',
                                    padding: '4px 8px',
                                    height: '30px',
                                    borderColor: val ? 'var(--border-subtle)' : 'var(--accent-amber)'
                                  }}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* SUBTAB 2: GLOSSARY */}
      {subTab === 'glossary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <BookOpen size={18} color="var(--accent-cyan)" />
                  <span>Brand Glossary & Protected Terms</span>
                </div>
                <div className="card-subtitle">Terms in this dictionary are preserved verbatim and will never be mistranslated by AI models</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <label className="input-label">Protected Source Word</label>
                <input type="text" placeholder="e.g. Bubble" value={newGlossaryTerm} onChange={e => setNewGlossaryTerm(e.target.value)} className="input" />
              </div>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <label className="input-label">Replacement in Target (Optional)</label>
                <input type="text" placeholder="e.g. Bubble (leave empty to keep exact)" value={newGlossaryRepl} onChange={e => setNewGlossaryRepl(e.target.value)} className="input" />
              </div>
              <button onClick={handleAddGlossaryTerm} className="btn btn-primary btn-sm" style={{ height: '38px' }}>
                <Plus size={13} />
                <span>Add Protected Term</span>
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: '12px' }}>
              <span>Protected Brand Terms ({Object.keys(glossary).length})</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
              {Object.entries(glossary).map(([term, repl]) => (
                <div key={term} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <strong>{term}</strong> → <span style={{ color: 'var(--accent-cyan)' }}>{repl}</span>
                  </div>
                  <button onClick={() => handleRemoveGlossaryTerm(term)} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: TRANSLATION MEMORY (CACHE) */}
      {subTab === 'cache' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="grid-3">
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL CACHED STRINGS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{memoryStats.totalCachedEntries}</div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CHARACTERS SAVED</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{memoryStats.totalCharsSaved.toLocaleString()}</div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ESTIMATED API SAVINGS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>${memoryStats.estimatedSavingsUsd}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <Database size={18} color="var(--primary)" />
                  <span>Translation Memory Cache Controller</span>
                </div>
                <div className="card-subtitle">Prevents paying twice for identical strings across Bubble releases and builds</div>
              </div>
              <button onClick={handleClearCache} className="btn btn-secondary btn-sm" style={{ color: '#f43f5e' }}>
                <Trash2 size={13} />
                <span>Clear Memory Cache</span>
              </button>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Cached languages: <strong>{memoryStats.languages.join(', ').toUpperCase() || 'None'}</strong>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: PSEUDO-LOCALIZATION */}
      {subTab === 'pseudo' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <FileText size={18} color="var(--accent-cyan)" />
                <span>Pseudo-Localization Testing Engine</span>
              </div>
              <div className="card-subtitle">Simulates 40% German/Russian text expansion with accented characters to test Bubble UI overflow without real translation</div>
            </div>
            <button onClick={handleRunPseudoLocalization} disabled={items.length === 0} className="btn btn-primary btn-sm">
              <Sparkles size={13} />
              <span>Apply Pseudo-Localization ({items.length})</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {items.slice(0, 5).map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem' }}>
                <span>{item.sourceText}</span>
                <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{item.translatedText || 'Click apply above to preview'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 5: COST ESTIMATOR */}
      {subTab === 'cost' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <DollarSign size={18} color="var(--accent-emerald)" />
                <span>Real-Time Multi-LLM Cost Estimator</span>
              </div>
              <div className="card-subtitle">Calculated for {items.length} application strings across {selectedTargetLangs.length} target language(s)</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {costEstimates.map(est => {
              const multiCost = Math.round(est.estimatedCostUsd * selectedTargetLangs.length * 1000) / 1000;
              return (
                <div key={est.provider + est.model} style={{ padding: '14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{est.provider}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{est.model}</div>
                  <div style={{ marginTop: '10px', fontSize: '1.2rem', fontWeight: 800, color: est.isFree ? 'var(--accent-emerald)' : 'var(--primary)' }}>
                    {est.isFree ? 'FREE (0.00$)' : `$${multiCost.toFixed(4)}`}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {est.estimatedInputTokens * selectedTargetLangs.length} In / {est.estimatedOutputTokens * selectedTargetLangs.length} Out Tokens
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
