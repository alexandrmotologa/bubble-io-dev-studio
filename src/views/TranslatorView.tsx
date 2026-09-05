import React, { useState, useEffect, useMemo } from 'react';
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
  FileCode,
  ShieldCheck,
  Zap,
  RefreshCw,
  Copy,
  Check,
  Sliders,
  Share2
} from 'lucide-react';
import { CostEstimate, ProjectProfile, TranslationItem, TranslationJobConfig, TranslationMemoryStats, TranslationProviderType } from '../types';
import { TranslatorEngine } from '../core/translator/translatorEngine';
import { BUBBLE_LANGUAGES, DEFAULT_TARGET_LANGUAGE, DEFAULT_SOURCE_LANGUAGE, getLanguageDisplayName } from '../core/translator/bubbleLanguages';
import { SearchableLanguageSelect } from '../components/SearchableLanguageSelect';
import { AI_PROVIDERS, PROVIDER_MODELS, getProviderForModel, getCustomModelPlaceholder, getDefaultModelForProvider } from '../core/ai/aiProviders';
import { toast } from '../core/toast/toastManager';
import { PseudoLocalizerEngine } from '../core/translator/pseudoLocalizer';
import { AiProvidersEngine } from '../core/translator/aiProviders';
import { APP_VERSION } from '../version';

interface TranslatorViewProps {
  onLog: (module: 'translator', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
  activeProject?: ProjectProfile;
  defaultAiModel?: string;
  geminiApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  openrouterApiKey?: string;
  groqApiKey?: string;
  deepseekApiKey?: string;
  xaiApiKey?: string;
  opencodeApiKey?: string;
  ollamaUrl?: string;
}

type TranslatorSubTab = 'studio' | 'glossary' | 'cache' | 'pseudo' | 'cost';

export const TranslatorView: React.FC<TranslatorViewProps> = ({ 
  onLog,
  activeProject,
  defaultAiModel,
  geminiApiKey,
  openaiApiKey,
  anthropicApiKey,
  openrouterApiKey,
  groqApiKey,
  deepseekApiKey,
  xaiApiKey,
  opencodeApiKey,
  ollamaUrl
}) => {
  const [subTab, setSubTab] = useState<TranslatorSubTab>('studio');

  const storagePrefix = activeProject?.id ? `bubble_translator_${activeProject.id}` : 'bubble_translator_global';

  const [items, setItems] = useState<TranslationItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_items`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to restore translator items from storage', e);
    }
    return [];
  });

  const [sourceLang, setSourceLang] = useState<string>(() => {
    return localStorage.getItem(`${storagePrefix}_source_lang`) || DEFAULT_SOURCE_LANGUAGE;
  });

  const [selectedTargetLangs, setSelectedTargetLangs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_target_langs`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to restore target langs from storage', e);
    }
    return [DEFAULT_TARGET_LANGUAGE];
  });

  const [activeDisplayLang, setActiveDisplayLang] = useState<string>(() => {
    const saved = localStorage.getItem(`${storagePrefix}_active_display_lang`);
    if (saved) return saved;
    try {
      const savedLangs = localStorage.getItem(`${storagePrefix}_target_langs`);
      if (savedLangs) {
        const parsed = JSON.parse(savedLangs);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      }
    } catch {}
    return DEFAULT_TARGET_LANGUAGE;
  });

  const [viewMode, setViewMode] = useState<'single' | 'matrix'>(() => {
    return (localStorage.getItem(`${storagePrefix}_view_mode`) as 'single' | 'matrix') || 'single';
  });

  const [customPromptInstructions, setCustomPromptInstructions] = useState<string>(() => {
    return localStorage.getItem('bubble_dev_studio_custom_prompt_instructions') || '';
  });

  const [promptInspectorTab, setPromptInspectorTab] = useState<'editor' | 'preview'>('editor');
  const [inspectorTargetLang, setInspectorTargetLang] = useState<string>('');

  const [provider, setProvider] = useState<TranslationProviderType>(
    (activeProject?.aiProvider as TranslationProviderType) || 
    (defaultAiModel ? (getProviderForModel(defaultAiModel) as TranslationProviderType) : 'gemini')
  );
  const [model, setModel] = useState<string>(
    activeProject?.aiModel || 
    defaultAiModel || 
    'gemini-2.0-flash'
  );
  const [isCustomModel, setIsCustomModel] = useState<boolean>(() => {
    const m = activeProject?.aiModel || defaultAiModel;
    if (!m) return false;
    const p = (activeProject?.aiProvider as TranslationProviderType) || (defaultAiModel ? getProviderForModel(defaultAiModel) : 'gemini');
    return !PROVIDER_MODELS[p]?.some(item => item.id === m);
  });
  const [customModelInput, setCustomModelInput] = useState<string>(() => {
    const m = activeProject?.aiModel || defaultAiModel || '';
    const p = (activeProject?.aiProvider as TranslationProviderType) || (defaultAiModel ? getProviderForModel(defaultAiModel) : 'gemini');
    const isKnown = PROVIDER_MODELS[p]?.some(item => item.id === m);
    return isKnown ? '' : m;
  });
  const [tone, setTone] = useState<'professional' | 'casual' | 'formal' | 'concise' | 'marketing'>('professional');
  const [useGlossary, setUseGlossary] = useState(true);
  const [useCache, setUseCache] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'translated'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Glossary State
  const [glossary, setGlossary] = useState<Record<string, string>>(TranslatorEngine.getGlossary());
  const [newGlossaryTerm, setNewGlossaryTerm] = useState('');
  const [newGlossaryRepl, setNewGlossaryRepl] = useState('');
  const [glossarySearch, setGlossarySearch] = useState('');

  // Cache Memory State
  const [memoryStats, setMemoryStats] = useState<TranslationMemoryStats>(TranslatorEngine.getMemoryStats());

  // Pseudo-localization Interactive State
  const [pseudoCustomInput, setPseudoCustomInput] = useState('Save changes and proceed to dashboard');
  const [pseudoExpansionPercent, setPseudoExpansionPercent] = useState<number>(30);

  // Add Item State
  const [newSourceText, setNewSourceText] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newCategory, setNewCategory] = useState<'ui' | 'error' | 'notification' | 'email' | 'db_value' | 'option_set'>('ui');

  // Progress State
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

  // Persist items, target languages, active display language, and custom prompt
  useEffect(() => {
    try {
      if (items && items.length > 0) {
        localStorage.setItem(`${storagePrefix}_items`, JSON.stringify(items));
      }
    } catch (e) {
      console.warn('Failed to persist translator items', e);
    }
  }, [items, storagePrefix]);

  useEffect(() => {
    try {
      localStorage.setItem(`${storagePrefix}_target_langs`, JSON.stringify(selectedTargetLangs));
    } catch {}
  }, [selectedTargetLangs, storagePrefix]);

  useEffect(() => {
    try {
      localStorage.setItem(`${storagePrefix}_active_display_lang`, activeDisplayLang);
    } catch {}
  }, [activeDisplayLang, storagePrefix]);

  useEffect(() => {
    try {
      localStorage.setItem(`${storagePrefix}_source_lang`, sourceLang);
    } catch {}
  }, [sourceLang, storagePrefix]);

  useEffect(() => {
    try {
      localStorage.setItem(`${storagePrefix}_view_mode`, viewMode);
    } catch {}
  }, [viewMode, storagePrefix]);

  useEffect(() => {
    try {
      localStorage.setItem('bubble_dev_studio_custom_prompt_instructions', customPromptInstructions);
    } catch {}
  }, [customPromptInstructions]);

  // Sync Provider & Model from active project or default settings
  useEffect(() => {
    if (activeProject?.aiProvider) {
      setProvider(activeProject.aiProvider as TranslationProviderType);
      if (activeProject.aiModel) {
        setModel(activeProject.aiModel);
      }
    } else if (defaultAiModel) {
      const p = getProviderForModel(defaultAiModel);
      setProvider(p as TranslationProviderType);
      setModel(defaultAiModel);
    }
  }, [activeProject?.id, activeProject?.aiProvider, activeProject?.aiModel, defaultAiModel]);

  // Auto-load strings from active project's attached .bubble blueprint (without overwriting restored translations)
  useEffect(() => {
    if (activeProject?.blueprintExportJson) {
      setItems(prev => {
        if (prev && prev.length > 0) return prev;
        const extracted = TranslatorEngine.extractFromBlueprint(activeProject.blueprintExportJson);
        if (extracted && extracted.length > 0) {
          onLog('translator', `Extracted ${extracted.length} real application strings from ${activeProject.name}'s blueprint (${activeProject.blueprintFileName || 'export.bubble'})`, 'success');
          return extracted;
        }
        return prev;
      });
    }
  }, [activeProject?.id, activeProject?.blueprintFileName, activeProject?.blueprintExportJson]);

  // Cost estimates
  const costEstimates = useMemo(() => {
    return TranslatorEngine.estimateCosts(items);
  }, [items]);

  useEffect(() => {
    setMemoryStats(TranslatorEngine.getMemoryStats());
  }, [items]);

  // Keep activeDisplayLang in sync with selectedTargetLangs
  const handleTargetLanguagesChange = (newLangs: string[]) => {
    setSelectedTargetLangs(newLangs);
    if (newLangs.length > 0) {
      if (!newLangs.includes(activeDisplayLang) || newLangs.length === 1) {
        setActiveDisplayLang(newLangs[0]);
      } else {
        const newlyAdded = newLangs.find(l => !selectedTargetLangs.includes(l));
        if (newlyAdded) {
          setActiveDisplayLang(newlyAdded);
        }
      }
    }
  };

  useEffect(() => {
    if (selectedTargetLangs.length > 0 && !selectedTargetLangs.includes(activeDisplayLang)) {
      setActiveDisplayLang(selectedTargetLangs[0]);
    }
  }, [selectedTargetLangs, activeDisplayLang]);

  const handleProviderChange = (newProvider: TranslationProviderType) => {
    setProvider(newProvider);
    setIsCustomModel(false);
    setCustomModelInput('');
    const availableModels = PROVIDER_MODELS[newProvider];
    if (availableModels && availableModels.length > 0) {
      const recommended = (availableModels as any[]).find(m => m.isRecommended) || availableModels[0];
      setModel(recommended.id);
    }
  };

  const getEffectiveApiKey = (prov: TranslationProviderType): string | undefined => {
    if (activeProject?.aiProvider === prov && activeProject.aiApiKey) {
      return activeProject.aiApiKey;
    }
    switch (prov) {
      case 'gemini': return geminiApiKey;
      case 'openai': return openaiApiKey;
      case 'anthropic': return anthropicApiKey;
      case 'groq': return groqApiKey;
      case 'deepseek': return deepseekApiKey;
      case 'xai': return xaiApiKey;
      case 'openrouter': return openrouterApiKey;
      case 'opencode': return opencodeApiKey;
      default: return undefined;
    }
  };

  const handleRunTranslation = async () => {
    if (isTranslating || items.length === 0 || selectedTargetLangs.length === 0) return;
    setIsTranslating(true);
    const totalOps = selectedTargetLangs.length * items.length;
    setProgress({ current: 0, total: totalOps });

    onLog('translator', `Starting AI translation across ${selectedTargetLangs.length} language(s) [${selectedTargetLangs.join(', ')}] using ${provider.toUpperCase()} (${model})...`);
    toast.info(`Translating ${items.length} strings across ${selectedTargetLangs.length} languages...`);

    const effectiveModel = isCustomModel ? customModelInput.trim() : model;
    const baseConfig: Omit<TranslationJobConfig, 'targetLang'> = {
      sourceLang,
      provider,
      model: effectiveModel,
      temperature: 0.3,
      tone,
      useGlossary,
      useCache,
      glossary,
      apiKey: getEffectiveApiKey(provider),
      ollamaUrl: ollamaUrl || 'http://localhost:11434',
      customPromptInstructions: customPromptInstructions.trim() || undefined
    };

    try {
      const multiResult = await TranslatorEngine.runMultiLanguageTranslation(
        items,
        selectedTargetLangs,
        baseConfig,
        (langIdx, totalLangs, itemIdx, totalItems, currentLang) => {
          setMultiProgress({ currentLang, langIndex: langIdx, totalLangs, itemIndex: itemIdx, totalItems });
          setProgress({ current: (langIdx - 1) * totalItems + itemIdx, total: totalLangs * totalItems });
        }
      );

      setItems(multiResult.items);
      setMemoryStats(TranslatorEngine.getMemoryStats());
      toast.success(`Translation completed! ${items.length} strings translated across ${selectedTargetLangs.length} languages.`);
      onLog('translator', `Multi-language translation completed! Processed ${items.length} strings across ${selectedTargetLangs.length} languages (${multiResult.tokensUsed} tokens used).`, 'success');
    } catch (e: any) {
      toast.error(`Translation error: ${e.message}`);
      onLog('translator', `Translation error: ${e.message}`, 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranslateSingleItem = async (itemId: string, targetLang: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    toast.info(`Translating '${item.key}' to ${targetLang.toUpperCase()}...`);
    const effectiveModel = isCustomModel ? customModelInput.trim() : model;
    const config: TranslationJobConfig = {
      sourceLang,
      targetLang,
      provider,
      model: effectiveModel,
      temperature: 0.3,
      tone,
      useGlossary,
      useCache,
      glossary,
      apiKey: getEffectiveApiKey(provider),
      ollamaUrl: ollamaUrl || 'http://localhost:11434',
      customPromptInstructions: customPromptInstructions.trim() || undefined
    };

    try {
      const res = await TranslatorEngine.runTranslation([item], config);
      if (res.items[0]) {
        const translatedText = res.items[0].translatedText || '';
        setItems(prev => prev.map(it => {
          if (it.id === itemId) {
            const updatedTrans = { ...(it.translations || {}), [targetLang]: translatedText };
            return {
              ...it,
              translations: updatedTrans,
              translatedText: targetLang === activeDisplayLang ? translatedText : it.translatedText,
              status: 'translated'
            };
          }
          return it;
        }));
        toast.success(`Translated '${item.key}' to ${targetLang.toUpperCase()}`);
      }
    } catch (e: any) {
      toast.error(`Failed to translate: ${e.message}`);
    }
  };

  const handleRunPseudoLocalization = () => {
    const pseudoItems = items.map(item => ({
      ...item,
      translatedText: PseudoLocalizerEngine.localize(item.sourceText, pseudoExpansionPercent),
      status: 'translated' as const
    }));
    setItems(pseudoItems);
    toast.success(`Applied pseudo-localization (${pseudoExpansionPercent}% expansion) to ${items.length} strings`);
    onLog('translator', `Generated pseudo-localization for ${items.length} strings with ${pseudoExpansionPercent}% expansion padding for UI layout testing.`, 'success');
  };

  const handleExportSingleCsv = (lang: string) => {
    if (items.length === 0) return;
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
    URL.revokeObjectURL(url);
    toast.success(`Exported Bubble CSV for ${lang.toUpperCase()}`);
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
    URL.revokeObjectURL(url);
    toast.success(`Exported Consolidated JSON for ${selectedTargetLangs.length} languages`);
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
        setItems(prev => {
          if (!prev || prev.length === 0) return parsed;
          const existingMap = new Map(prev.map(it => [it.key, it]));
          const combined = [...prev];
          let newCount = 0;
          for (const item of parsed) {
            if (!existingMap.has(item.key)) {
              combined.push(item);
              newCount++;
            } else {
              const existing = existingMap.get(item.key)!;
              if (item.translatedText && !existing.translatedText) {
                existing.translatedText = item.translatedText;
              }
              existing.translations = { ...(existing.translations || {}), ...(item.translations || {}) };
            }
          }
          toast.success(`Imported ${parsed.length} strings (${newCount} new added, ${prev.length} existing preserved)`);
          return combined;
        });
        onLog('translator', `Imported ${parsed.length} strings from Bubble CSV: ${file.name}`, 'success');
      } else {
        try {
          const json = JSON.parse(content);
          const extracted = TranslatorEngine.extractFromBubbleJson(json);
          setItems(extracted);
          toast.success(`Extracted ${extracted.length} strings from ${file.name}`);
          onLog('translator', `Extracted ${extracted.length} strings & Option Sets from ${file.name}`, 'success');
        } catch {
          toast.error(`Failed to parse ${file.name}`);
          onLog('translator', `Failed to parse ${file.name}`, 'error');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleStrings = () => {
    const samples = TranslatorEngine.getSampleItems();
    setItems(samples);
    toast.info(`Loaded ${samples.length} sample application texts`);
    onLog('translator', `Loaded ${samples.length} sample application texts for testing.`, 'info');
  };

  const handleAddGlossaryTerm = () => {
    if (!newGlossaryTerm.trim()) {
      toast.warn('Please enter a protected term');
      return;
    }
    const updated = { ...glossary, [newGlossaryTerm.trim()]: newGlossaryRepl.trim() || newGlossaryTerm.trim() };
    setGlossary(updated);
    TranslatorEngine.saveGlossary(updated);
    setNewGlossaryTerm('');
    setNewGlossaryRepl('');
    toast.success(`Added protected term: "${newGlossaryTerm.trim()}"`);
    onLog('translator', `Added protected glossary term: "${newGlossaryTerm}"`);
  };

  const handleInjectStandardGlossary = () => {
    const bubblePresets = {
      'Bubble': 'Bubble',
      'Bubble.io': 'Bubble.io',
      'Stripe': 'Stripe',
      'OAuth': 'OAuth',
      'Webhook': 'Webhook',
      'API': 'API',
      '[Current User]': '[Current User]',
      "[Current User's email]": "[Current User's email]",
      "[Parent group's Thing]": "[Parent group's Thing]",
      '[Result of step 1]': '[Result of step 1]'
    };
    const merged = { ...glossary, ...bubblePresets };
    setGlossary(merged);
    TranslatorEngine.saveGlossary(merged);
    toast.success('Injected Bubble Standard Token Presets into Glossary');
  };

  const handleRemoveGlossaryTerm = (term: string) => {
    const updated = { ...glossary };
    delete updated[term];
    setGlossary(updated);
    TranslatorEngine.saveGlossary(updated);
    toast.info(`Removed term: "${term}"`);
    onLog('translator', `Removed glossary term: "${term}"`);
  };

  const handleClearCache = () => {
    TranslatorEngine.clearMemoryCache();
    setMemoryStats(TranslatorEngine.getMemoryStats());
    toast.warn('Cleared translation memory cache');
    onLog('translator', 'Translation memory cache cleared.', 'warn');
  };

  const handleAddItem = () => {
    if (!newSourceText.trim()) {
      toast.warn('Please enter source text to add');
      return;
    }
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
    toast.success(`Added new text: ${newItem.key}`);
    onLog('translator', `Added new text entry: '${newItem.key}'`);
  };

  const handleUpdateTranslation = (id: string, text: string, lang: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedTrans = { ...(item.translations || {}), [lang]: text };
        return {
          ...item,
          translations: updatedTrans,
          translatedText: lang === activeDisplayLang ? text : item.translatedText,
          status: text.trim() ? 'reviewed' : 'pending'
        };
      }
      return item;
    }));
  };

  const handleTranslateMatrixRow = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item || selectedTargetLangs.length === 0) return;

    toast.info(`Translating '${item.key}' into ${selectedTargetLangs.length} languages simultaneously with AI...`);
    const effectiveModel = isCustomModel ? customModelInput.trim() : model;
    const baseConfig: Omit<TranslationJobConfig, 'targetLang'> = {
      sourceLang,
      provider,
      model: effectiveModel,
      temperature: 0.3,
      tone,
      useGlossary,
      useCache,
      glossary,
      apiKey: getEffectiveApiKey(provider),
      ollamaUrl: ollamaUrl || 'http://localhost:11434',
      customPromptInstructions: customPromptInstructions.trim() || undefined
    };

    try {
      const res = await TranslatorEngine.translateSingleItemMultiLanguage(
        item,
        selectedTargetLangs,
        baseConfig
      );

      setItems(prev => prev.map(it => (it.id === itemId ? res.item : it)));
      setMemoryStats(TranslatorEngine.getMemoryStats());
      toast.success(`Translated '${item.key}' into all ${selectedTargetLangs.length} languages!`);
      onLog('translator', `Translated row '${item.key}' into [${selectedTargetLangs.join(', ')}] simultaneously with AI (${res.tokensUsed} tokens).`, 'success');
    } catch (e: any) {
      toast.error(`Matrix row translation failed: ${e.message}`);
      onLog('translator', `Matrix row translation failed: ${e.message}`, 'error');
    }
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        item.key.toLowerCase().includes(q) || 
        item.sourceText.toLowerCase().includes(q) ||
        (item.translations?.[activeDisplayLang] || item.translatedText || '').toLowerCase().includes(q);
      
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      
      const currentTranslation = item.translations?.[activeDisplayLang] || (activeDisplayLang === selectedTargetLangs[0] ? item.translatedText : '');
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'translated' && Boolean(currentTranslation)) ||
        (statusFilter === 'pending' && !currentTranslation);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, searchTerm, categoryFilter, statusFilter, activeDisplayLang, selectedTargetLangs]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    for (const it of items) {
      counts[it.category] = (counts[it.category] || 0) + 1;
    }
    return counts;
  }, [items]);

  // Glossary filtered entries
  const filteredGlossary = useMemo(() => {
    return Object.entries(glossary).filter(([term, repl]) => {
      const q = glossarySearch.toLowerCase();
      return !glossarySearch || term.toLowerCase().includes(q) || repl.toLowerCase().includes(q);
    });
  }, [glossary, glossarySearch]);

  return (
    <div className="view-container">
      {/* Header Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)', border: '1px solid var(--border-active)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 8px 20px -4px rgba(6, 182, 212, 0.4)'
            }}>
              <Languages size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  AI Localization & Translation Studio
                </h1>
                <span className="badge badge-cyan">v{APP_VERSION}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Multi-Provider AI localization, 77+ languages, brand glossary protection & 1-click Bubble CSV sync for <strong>{activeProject?.name || 'Workspace'}</strong>
              </div>
            </div>
          </div>

          {/* Top Actions */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {activeProject?.blueprintExportJson && (
              <button
                type="button"
                onClick={() => {
                  const extracted = TranslatorEngine.extractFromBlueprint(activeProject.blueprintExportJson);
                  setItems(extracted);
                  toast.success(`Restored ${extracted.length} strings from attached .bubble blueprint`);
                  onLog('translator', `Reloaded ${extracted.length} strings from ${activeProject.name}'s blueprint (${activeProject.blueprintFileName || 'export.bubble'})`, 'info');
                }}
                className="btn btn-secondary btn-sm"
                title={`Reload Option Sets and strings from attached ${activeProject.blueprintFileName || '.bubble blueprint'}`}
              >
                <RefreshCw size={13} />
                <span>Sync .bubble</span>
              </button>
            )}

            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
              <Upload size={13} />
              <span>Import CSV / .bubble</span>
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
              <button 
                onClick={() => handleExportSingleCsv(selectedTargetLangs[0] || 'en_us')} 
                disabled={items.length === 0} 
                className="btn btn-primary btn-sm"
              >
                <Download size={13} />
                <span>Export Bubble CSV ({selectedTargetLangs[0]?.toUpperCase()})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div style={{
        display: 'flex',
        gap: '6px',
        background: 'var(--bg-input)',
        padding: '4px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setSubTab('studio')}
          className={`btn btn-sm ${subTab === 'studio' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: 'none', whiteSpace: 'nowrap' }}
        >
          <Languages size={13} />
          <span>Localization Studio ({items.length})</span>
        </button>
        <button
          onClick={() => setSubTab('glossary')}
          className={`btn btn-sm ${subTab === 'glossary' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: 'none', whiteSpace: 'nowrap' }}
        >
          <BookOpen size={13} />
          <span>Brand Glossary ({Object.keys(glossary).length})</span>
        </button>
        <button
          onClick={() => setSubTab('cache')}
          className={`btn btn-sm ${subTab === 'cache' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: 'none', whiteSpace: 'nowrap' }}
        >
          <Database size={13} />
          <span>Translation Memory ({memoryStats.totalCachedEntries})</span>
        </button>
        <button
          onClick={() => setSubTab('pseudo')}
          className={`btn btn-sm ${subTab === 'pseudo' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: 'none', whiteSpace: 'nowrap' }}
        >
          <FileText size={13} />
          <span>Pseudo-Localization Testing</span>
        </button>
        <button
          onClick={() => setSubTab('cost')}
          className={`btn btn-sm ${subTab === 'cost' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: 'none', whiteSpace: 'nowrap' }}
        >
          <DollarSign size={13} />
          <span>Token & Cost Estimator</span>
        </button>
      </div>

      {/* Hero Configuration Toolbar */}
      <div className="card" style={{ position: 'relative', zIndex: 40 }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              <Zap size={18} color="var(--accent-cyan)" />
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
        <div className="grid-4" style={{ marginTop: '12px', alignItems: 'flex-start', gap: '14px', position: 'relative', zIndex: 50 }}>
          {/* 1. Target Languages Multi-select */}
          <div style={{ gridColumn: 'span 2', position: 'relative', zIndex: 60 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', height: '18px' }}>
              <label className="input-label" style={{ margin: 0 }}>
                Target Languages ({selectedTargetLangs.length} Selected of {BUBBLE_LANGUAGES.length})
              </label>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
                Search & Multi-Select enabled
              </span>
            </div>
            <SearchableLanguageSelect
              selectedLanguages={selectedTargetLangs}
              onChange={handleTargetLanguagesChange}
              isMultiSelect={true}
            />
          </div>

          {/* 2. Provider Selector */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', height: '18px' }}>
              <label className="input-label" style={{ margin: 0 }}>AI Provider</label>
            </div>
            <select
              value={provider}
              onChange={e => handleProviderChange(e.target.value as any)}
              className="select select-premium"
              style={{
                height: '42px',
                minHeight: '42px',
                fontSize: '0.85rem',
                padding: '0 32px 0 14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="gemini">Google Gemini (Gemini 2.0 / 1.5)</option>
              <option value="openai">OpenAI (GPT-4o / GPT-4o-mini / o3-mini)</option>
              <option value="anthropic">Anthropic (Claude 3.7 / 3.5 Sonnet & Haiku)</option>
              <option value="groq">Groq (Ultra-Fast LPUs)</option>
              <option value="deepseek">DeepSeek (V3 / R1)</option>
              <option value="xai">xAI (Grok 2)</option>
              <option value="opencode">OpenCode (Go / Zen)</option>
              <option value="openrouter">OpenRouter (Multi-LLM)</option>
              <option value="ollama">Ollama (Local / Free Offline)</option>
            </select>
          </div>

          {/* 3. Model Selector & Custom Model Input */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', height: '18px' }}>
              <label className="input-label" style={{ margin: 0 }}>Model for {provider.toUpperCase()}</label>
              <button
                type="button"
                onClick={() => {
                  const next = !isCustomModel;
                  setIsCustomModel(next);
                  if (next) {
                    setCustomModelInput(model);
                  } else {
                    const fallback = PROVIDER_MODELS[provider]?.[0]?.id || '';
                    setModel(fallback);
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isCustomModel ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                {isCustomModel ? '← Pick from list' : '✏️ Custom Model...'}
              </button>
            </div>

            {!isCustomModel ? (
              <select
                value={PROVIDER_MODELS[provider]?.some(m => m.id === model) ? model : '__custom__'}
                onChange={e => {
                  if (e.target.value === '__custom__') {
                    setIsCustomModel(true);
                    setCustomModelInput(model);
                  } else {
                    setModel(e.target.value);
                  }
                }}
                className="select select-premium"
                style={{
                  height: '42px',
                  minHeight: '42px',
                  fontSize: '0.85rem',
                  padding: '0 32px 0 14px',
                  boxSizing: 'border-box'
                }}
              >
                {PROVIDER_MODELS[provider]?.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
                <option value="__custom__">➕ Custom Model ID (Write your own)...</option>
              </select>
            ) : (
              <div>
                <input
                  type="text"
                  value={customModelInput}
                  placeholder={getCustomModelPlaceholder(provider)}
                  onChange={e => {
                    const val = e.target.value;
                    setCustomModelInput(val);
                    setModel(val.trim());
                  }}
                  className="input"
                  style={{
                    height: '42px',
                    minHeight: '42px',
                    borderColor: 'var(--accent-cyan)',
                    fontSize: '0.85rem',
                    padding: '0 14px',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                  Enter any exact model ID supported by your {provider.toUpperCase()} API key
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Second Row: Tone & Flags */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tone of Voice:</span>
              <select
                value={tone}
                onChange={e => setTone(e.target.value as any)}
                className="select select-premium"
                style={{ width: 'auto', padding: '4px 10px', height: '30px', fontSize: '0.8rem' }}
              >
                <option value="professional">Professional (Default)</option>
                <option value="casual">Casual & Friendly</option>
                <option value="formal">Formal</option>
                <option value="concise">Concise (Short UI Buttons)</option>
                <option value="marketing">Marketing & Engaging</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowPromptPreview(!showPromptPreview)}
              className={`btn btn-sm ${showPromptPreview ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.725rem', padding: '3px 10px', height: '28px', gap: '5px' }}
              title="Inspect and customize the AI system prompt and translation guidelines"
            >
              <FileCode size={13} />
              <span>{showPromptPreview ? 'Hide Prompt & Rules' : '⚙️ AI Prompt & Rules'}</span>
            </button>
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

        {/* Live System Prompt Preview & Custom Guidelines Inspector */}
        {showPromptPreview && (() => {
          const isMatrixPrompt = inspectorTargetLang === '__matrix_all__' || (viewMode === 'matrix' && !inspectorTargetLang && selectedTargetLangs.length > 1);
          const activePromptTarget = (inspectorTargetLang && inspectorTargetLang !== '__matrix_all__' && selectedTargetLangs.includes(inspectorTargetLang))
            ? inspectorTargetLang
            : ((activeDisplayLang && selectedTargetLangs.includes(activeDisplayLang))
              ? activeDisplayLang
              : (selectedTargetLangs[0] || 'es_es'));

          return (
            <div style={{
              marginTop: '12px',
              padding: '14px 18px',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-active)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} color="var(--accent-emerald)" />
                    <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      AI Localization System Prompt & Custom Rules
                    </span>
                  </div>
                  <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                    🛡️ Guardrailed (Translation Scope Only)
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target:</span>
                    {selectedTargetLangs.length > 1 ? (
                      <select
                        value={inspectorTargetLang || (viewMode === 'matrix' ? '__matrix_all__' : activePromptTarget)}
                        onChange={e => setInspectorTargetLang(e.target.value)}
                        className="select select-sm select-premium"
                        style={{ fontSize: '0.75rem', padding: '2px 8px', height: '26px' }}
                      >
                        <option value="__matrix_all__">⚡ Matrix Simultaneous Prompt ({selectedTargetLangs.length} languages)</option>
                        <optgroup label="Individual Target Prompts">
                          {selectedTargetLangs.map(code => (
                            <option key={code} value={code}>
                              {getLanguageDisplayName(code)}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    ) : (
                      <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                        {getLanguageDisplayName(activePromptTarget)}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Tab Switcher */}
                  <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <button
                      type="button"
                      onClick={() => setPromptInspectorTab('editor')}
                      className={`btn btn-sm ${promptInspectorTab === 'editor' ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ fontSize: '0.7rem', padding: '2px 8px', height: '24px' }}
                    >
                      ✏️ Custom Guidelines
                    </button>
                    <button
                      type="button"
                      onClick={() => setPromptInspectorTab('preview')}
                      className={`btn btn-sm ${promptInspectorTab === 'preview' ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ fontSize: '0.7rem', padding: '2px 8px', height: '24px' }}
                    >
                      👁️ Full English Prompt
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const effectiveModel = isCustomModel ? customModelInput.trim() : model;
                      const baseConfig = {
                        provider,
                        model: effectiveModel,
                        temperature: 0.3,
                        sourceLang: sourceLang,
                        tone,
                        useGlossary,
                        glossary,
                        useCache,
                        customPromptInstructions: customPromptInstructions.trim() || undefined
                      };
                      const compiled = isMatrixPrompt
                        ? AiProvidersEngine.buildMultiLanguagePrompt(selectedTargetLangs, baseConfig)
                        : AiProvidersEngine.buildSystemPrompt({ ...baseConfig, targetLang: activePromptTarget });
                      navigator.clipboard.writeText(compiled);
                      toast.success('Prompt copied to clipboard');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.7rem', padding: '2px 8px', height: '26px', gap: '4px' }}
                    title="Copy full compiled English prompt"
                  >
                    <Copy size={11} />
                    <span>Copy Prompt</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: EDIT CUSTOM GUIDELINES */}
              {promptInspectorTab === 'editor' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Add specific translation instructions, audience guidelines, or terminology rules for your Bubble app.
                    <span style={{ color: 'var(--accent-cyan)' }}> Instructions are written in English or your language, and are strictly locked into translation scope by AI guardrails.</span>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <textarea
                      rows={3}
                      maxLength={500}
                      value={customPromptInstructions}
                      onChange={e => setCustomPromptInstructions(e.target.value.slice(0, 500))}
                      placeholder="e.g. For Romanian, use friendly informal 'tu' for buttons and call-to-actions, use 'Coș' for cart, keep 'Workspace' in English, prioritize compact verbs..."
                      className="input"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.775rem',
                        lineHeight: 1.5,
                        padding: '10px 12px',
                        resize: 'vertical',
                        minHeight: '80px',
                        width: '100%'
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '12px',
                      fontSize: '0.65rem',
                      color: customPromptInstructions.length > 450 ? 'var(--accent-amber)' : 'var(--text-muted)'
                    }}>
                      {customPromptInstructions.length} / 500
                    </span>
                  </div>

                  {/* Quick Presets & Reset */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const snippet = "Use polite/formal address (e.g., 'dumneavoastră', 'vous', 'Sie', 'usted') across all UI text.";
                          setCustomPromptInstructions(prev => prev ? `${prev}\n${snippet}`.slice(0, 500) : snippet);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.675rem', padding: '2px 6px', height: '22px' }}
                      >
                        + Formal Tone (T-V)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const snippet = "Use friendly, modern informal address (e.g., 'tu', 'du', 'tú') for buttons and navigation.";
                          setCustomPromptInstructions(prev => prev ? `${prev}\n${snippet}`.slice(0, 500) : snippet);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.675rem', padding: '2px 6px', height: '22px' }}
                      >
                        + Informal / Modern SaaS
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const snippet = "Prioritize standard software and developer terminology over literal translations.";
                          setCustomPromptInstructions(prev => prev ? `${prev}\n${snippet}`.slice(0, 500) : snippet);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.675rem', padding: '2px 6px', height: '22px' }}
                      >
                        + Tech Precision
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const snippet = "Keep button and badge microcopy as concise as possible to avoid UI layout overflow.";
                          setCustomPromptInstructions(prev => prev ? `${prev}\n${snippet}`.slice(0, 500) : snippet);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.675rem', padding: '2px 6px', height: '22px' }}
                      >
                        + Concise UI Microcopy
                      </button>
                    </div>

                    {customPromptInstructions && (
                      <button
                        type="button"
                        onClick={() => setCustomPromptInstructions('')}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.675rem', padding: '2px 6px', height: '22px', color: 'var(--accent-amber)' }}
                      >
                        Reset to Standard
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: COMPILED ENGLISH SYSTEM PROMPT PREVIEW */}
              {promptInspectorTab === 'preview' && (
                <div>
                  {isMatrixPrompt ? (
                    <div>
                      <div style={{ marginBottom: '6px', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        This English prompt simultaneously translates UI strings into all <strong style={{ color: 'var(--accent-cyan)' }}>{selectedTargetLangs.length} matrix languages</strong> in one AI call:
                      </div>
                      <pre style={{
                        margin: 0,
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '260px',
                        overflowY: 'auto',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        lineHeight: 1.5
                      }}>
                        {AiProvidersEngine.buildMultiLanguagePrompt(selectedTargetLangs, {
                          provider,
                          model: isCustomModel ? customModelInput.trim() : model,
                          temperature: 0.3,
                          sourceLang: sourceLang,
                          tone,
                          useGlossary,
                          glossary,
                          useCache,
                          customPromptInstructions: customPromptInstructions.trim() || undefined
                        })}
                      </pre>
                    </div>
                  ) : (
                    <div>
                      <div style={{ marginBottom: '6px', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        This English prompt is sent directly to the AI model ({provider.toUpperCase()}: {isCustomModel ? customModelInput : model}). Target language is configured as <strong style={{ color: 'var(--accent-cyan)' }}>{getLanguageDisplayName(activePromptTarget)}</strong>:
                      </div>
                      <pre style={{
                        margin: 0,
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '260px',
                        overflowY: 'auto',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        lineHeight: 1.5
                      }}>
                        {AiProvidersEngine.buildSystemPrompt({
                          provider,
                          model: isCustomModel ? customModelInput.trim() : model,
                          temperature: 0.3,
                          sourceLang: sourceLang,
                          targetLang: activePromptTarget,
                          tone,
                          useGlossary,
                          glossary,
                          useCache,
                          customPromptInstructions: customPromptInstructions.trim() || undefined
                        })}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

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

      {/* =====================================================================
          SUBTAB 1: LOCALIZATION STUDIO & MATRIX
          ===================================================================== */}
      {subTab === 'studio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}>
          {/* Add String Row */}
          <div className="card" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ width: '180px' }}>
                <label className="input-label" style={{ marginBottom: '6px' }}>App Text Key</label>
                <input type="text" placeholder="e.g. btn_submit" value={newKey} onChange={e => setNewKey(e.target.value)} className="input" style={{ height: '42px', minHeight: '42px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ width: '140px' }}>
                <label className="input-label" style={{ marginBottom: '6px' }}>Category</label>
                <select value={newCategory} onChange={e => setNewCategory(e.target.value as any)} className="select select-premium" style={{ height: '42px', minHeight: '42px', fontSize: '0.85rem', boxSizing: 'border-box' }}>
                  <option value="ui">UI Label</option>
                  <option value="error">Error Message</option>
                  <option value="notification">Notification</option>
                  <option value="email">Email Body</option>
                  <option value="option_set">Option Set</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <label className="input-label" style={{ marginBottom: '6px' }}>English / Source Text</label>
                <input type="text" placeholder="Type text to translate..." value={newSourceText} onChange={e => setNewSourceText(e.target.value)} className="input" style={{ height: '42px', minHeight: '42px', boxSizing: 'border-box' }} onKeyDown={e => e.key === 'Enter' && handleAddItem()} />
              </div>
              <button onClick={handleAddItem} className="btn btn-secondary btn-sm" style={{ height: '42px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={14} />
                <span>Add Text</span>
              </button>
            </div>
          </div>

          {/* Filtering Controls Bar */}
          <div className="card" style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              {/* Category Pills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Category:</span>
                {(['all', 'ui', 'error', 'notification', 'email', 'option_set'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`btn btn-sm ${categoryFilter === cat ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.725rem', padding: '3px 9px', height: '26px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>{cat === 'option_set' ? 'OPTION SET' : cat.toUpperCase()}</span>
                    {categoryCounts[cat] !== undefined && (
                      <span style={{ opacity: 0.75, fontSize: '0.68rem' }}>({categoryCounts[cat]})</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Status Filter & Search */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="select select-premium"
                  style={{ width: 'auto', height: '32px', fontSize: '0.75rem', padding: '0 8px' }}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Only</option>
                  <option value="translated">Ready / Translated</option>
                </select>

                <div className="search-wrapper-premium" style={{ width: '220px' }}>
                  <Search size={13} className="search-icon-premium" />
                  <input
                    type="text"
                    placeholder="Search strings..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="search-input-premium"
                  />
                </div>

                {/* View Mode Toggle */}
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
                      <span>Matrix ({selectedTargetLangs.length})</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Target Language Switcher Chips for Single View */}
            {viewMode === 'single' && selectedTargetLangs.length > 1 && (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Target Language:</span>
                {selectedTargetLangs.map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveDisplayLang(lang)}
                    className={`btn btn-sm ${activeDisplayLang === lang ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.725rem', padding: '3px 8px', height: '26px' }}
                  >
                    <span>{lang.toUpperCase()}</span>
                    <span style={{ opacity: 0.65, fontSize: '0.65rem' }}>({getLanguageDisplayName(lang)})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* EMPTY STATE */}
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
                {activeProject?.blueprintExportJson && (
                  <button
                    onClick={() => {
                      const extracted = TranslatorEngine.extractFromBlueprint(activeProject.blueprintExportJson);
                      setItems(extracted);
                      toast.success(`Extracted ${extracted.length} strings from ${activeProject.name}`);
                      onLog('translator', `Extracted ${extracted.length} real strings from ${activeProject.name}'s blueprint`, 'success');
                    }}
                    className="btn btn-primary"
                    style={{ padding: '10px 20px', background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))' }}
                  >
                    <Sparkles size={16} />
                    <span>Extract All Strings from Attached .bubble Blueprint</span>
                  </button>
                )}

                <label className="btn btn-secondary" style={{ cursor: 'pointer', padding: '10px 20px' }}>
                  <Upload size={16} />
                  <span>Import Bubble CSV / .bubble File</span>
                  <input type="file" accept=".csv,.json,.bubble" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>

                <button onClick={handleLoadSampleStrings} className="btn btn-secondary" style={{ padding: '10px 20px' }}>
                  <FileCode size={16} />
                  <span>Load Sample Application Texts</span>
                </button>
              </div>
            </div>
          ) : viewMode === 'single' ? (
            /* Single Language Card List */
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
                        gridTemplateColumns: 'minmax(280px, 320px) 1.2fr 1.2fr 160px',
                        gap: '16px',
                        alignItems: 'center',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            fontWeight: 600, 
                            fontSize: '0.8rem', 
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={item.key}
                        >
                          {item.key}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center', flexWrap: 'nowrap', overflow: 'hidden' }}>
                          <span 
                            className="badge badge-indigo" 
                            style={{ 
                              fontSize: '0.65rem',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}
                          >
                            {item.category.replace('_', ' ')}
                          </span>
                          {item.context && (
                            <span 
                              className="badge badge-cyan" 
                              style={{ 
                                fontSize: '0.65rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '170px',
                                display: 'inline-block'
                              }}
                              title={item.context}
                            >
                              {item.context}
                            </span>
                          )}
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

                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => handleTranslateSingleItem(item.id, activeDisplayLang)}
                          className="btn btn-secondary btn-sm"
                          title="Translate this string with AI"
                          style={{ padding: '3px 8px', height: '26px' }}
                        >
                          <Sparkles size={11} color="var(--accent-cyan)" />
                          <span style={{ fontSize: '0.7rem' }}>AI</span>
                        </button>

                        {isTranslated ? (
                          <span className="badge badge-emerald"><CheckCircle2 size={11} /> Ready</span>
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
              <div className="data-grid-scroll-container">
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
                      <th style={{ padding: '10px 12px', minWidth: '120px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }} title={item.key}>{item.key}</div>
                          <div style={{ display: 'flex', gap: '4px', marginTop: '3px', alignItems: 'center', flexWrap: 'nowrap' }}>
                            <span className="badge badge-indigo" style={{ fontSize: '0.625rem', whiteSpace: 'nowrap' }}>{item.category.replace('_', ' ')}</span>
                            {item.context && (
                              <span 
                                className="badge badge-cyan" 
                                style={{ 
                                  fontSize: '0.625rem', 
                                  whiteSpace: 'nowrap', 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  maxWidth: '120px', 
                                  display: 'inline-block' 
                                }} 
                                title={item.context}
                              >
                                {item.context}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', verticalAlign: 'top' }}>
                          {item.sourceText}
                        </td>
                        {selectedTargetLangs.map(lang => {
                          const val = item.translations?.[lang] || (lang === selectedTargetLangs[0] ? item.translatedText : '') || '';
                          return (
                            <td key={lang} style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                  type="text"
                                  value={val}
                                  placeholder="Pending..."
                                  onChange={e => handleUpdateTranslation(item.id, e.target.value, lang)}
                                  className="input"
                                  style={{
                                    fontSize: '0.8rem',
                                    padding: '4px 28px 4px 8px',
                                    height: '30px',
                                    borderColor: val ? 'var(--border-subtle)' : 'var(--accent-amber)',
                                    width: '100%'
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleTranslateSingleItem(item.id, lang)}
                                  className="btn btn-ghost btn-xs"
                                  style={{
                                    position: 'absolute',
                                    right: '3px',
                                    padding: '2px',
                                    height: '24px',
                                    width: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: val ? 'var(--text-muted)' : 'var(--accent-cyan)'
                                  }}
                                  title={`Translate '${item.key}' into ${lang.toUpperCase()} with AI`}
                                >
                                  <Sparkles size={11} />
                                </button>
                              </div>
                            </td>
                          );
                        })}
                        <td style={{ padding: '8px 10px', verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            onClick={() => handleTranslateMatrixRow(item.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 9px', height: '28px', gap: '5px', fontSize: '0.725rem' }}
                            title={`Translate this row into all ${selectedTargetLangs.length} languages simultaneously with AI`}
                          >
                            <Sparkles size={12} color="var(--accent-cyan)" />
                            <span>Row AI</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          SUBTAB 2: BRAND GLOSSARY & TOKEN PRESERVATION
          ===================================================================== */}
      {subTab === 'glossary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <BookOpen size={18} color="var(--accent-cyan)" />
                  <span>Brand Glossary & Dynamic Token Protection</span>
                </div>
                <div className="card-subtitle">Terms in this dictionary and dynamic Bubble expressions are preserved verbatim and will never be mistranslated</div>
              </div>

              <button
                onClick={handleInjectStandardGlossary}
                className="btn btn-secondary btn-sm"
                title="Inject standard Bubble dynamic tokens into glossary"
              >
                <Sparkles size={13} color="var(--accent-cyan)" />
                <span>Inject Bubble Token Presets</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <label className="input-label" style={{ marginBottom: '6px' }}>Protected Source Word / Token</label>
                <input type="text" placeholder="e.g. Bubble or [Current User's Name]" value={newGlossaryTerm} onChange={e => setNewGlossaryTerm(e.target.value)} className="input" style={{ height: '42px', minHeight: '42px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <label className="input-label" style={{ marginBottom: '6px' }}>Replacement in Target (Optional)</label>
                <input type="text" placeholder="Leave empty to keep exact" value={newGlossaryRepl} onChange={e => setNewGlossaryRepl(e.target.value)} className="input" style={{ height: '42px', minHeight: '42px', boxSizing: 'border-box' }} />
              </div>
              <button onClick={handleAddGlossaryTerm} className="btn btn-primary btn-sm" style={{ height: '42px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={13} />
                <span>Add Protected Rule</span>
              </button>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div className="card-title" style={{ margin: 0 }}>
                <span>Protected Brand Terms ({filteredGlossary.length})</span>
              </div>
              <div className="search-wrapper-premium" style={{ width: '220px' }}>
                <Search size={13} className="search-icon-premium" />
                <input
                  type="text"
                  placeholder="Filter glossary..."
                  value={glossarySearch}
                  onChange={e => setGlossarySearch(e.target.value)}
                  className="search-input-premium"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
              {filteredGlossary.map(([term, repl]) => (
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

      {/* =====================================================================
          SUBTAB 3: TRANSLATION MEMORY (CACHE)
          ===================================================================== */}
      {subTab === 'cache' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div className="grid-3" style={{ gap: '12px' }}>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL CACHED STRINGS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{memoryStats.totalCachedEntries}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Instant 0ms lookup across builds</div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CHARACTERS SAVED</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{memoryStats.totalCharsSaved.toLocaleString()}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Zero duplicate token usage</div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ESTIMATED API SAVINGS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>${memoryStats.estimatedSavingsUsd}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Cumulative lifetime savings</div>
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

      {/* =====================================================================
          SUBTAB 4: PSEUDO-LOCALIZATION
          ===================================================================== */}
      {subTab === 'pseudo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}>
          {/* Interactive Tester Card */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <FileText size={18} color="var(--accent-cyan)" />
                  <span>Interactive Pseudo-Localization Testing Engine</span>
                </div>
                <div className="card-subtitle">Simulates 20%–50% German/Russian text expansion with accented glyphs to test Bubble UI overflow without real translations</div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Expansion:</span>
                {[20, 30, 40, 50].map(pct => (
                  <button
                    key={pct}
                    onClick={() => setPseudoExpansionPercent(pct)}
                    className={`btn btn-sm ${pseudoExpansionPercent === pct ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.725rem', padding: '3px 8px', height: '26px' }}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="input-label" style={{ marginBottom: '6px' }}>Test Input Text</label>
                <input
                  type="text"
                  value={pseudoCustomInput}
                  onChange={e => setPseudoCustomInput(e.target.value)}
                  className="input"
                  style={{ height: '42px', minHeight: '42px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ padding: '14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Generated Pseudo-Localized String ({pseudoExpansionPercent}% expansion, +{Math.round(pseudoCustomInput.length * pseudoExpansionPercent / 100)} chars):
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--accent-cyan)' }}>
                  {PseudoLocalizerEngine.localize(pseudoCustomInput, pseudoExpansionPercent)}
                </div>
              </div>

              <button
                onClick={handleRunPseudoLocalization}
                disabled={items.length === 0}
                className="btn btn-primary btn-sm"
                style={{ alignSelf: 'flex-start' }}
              >
                <Sparkles size={13} />
                <span>Apply Pseudo-Localization to All Loaded Strings ({items.length})</span>
              </button>
            </div>
          </div>

          {/* Preview of Loaded Items */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '12px' }}>
              <span>Preview of First 10 Application Strings</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.slice(0, 10).map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.sourceText}</span>
                  <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                    {item.translatedText || PseudoLocalizerEngine.localize(item.sourceText, pseudoExpansionPercent)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBTAB 5: REAL-TIME COST ESTIMATOR
          ===================================================================== */}
      {subTab === 'cost' && (
        <div className="card" style={{ position: 'relative', zIndex: 1 }}>
          <div className="card-header">
            <div>
              <div className="card-title">
                <DollarSign size={18} color="var(--accent-emerald)" />
                <span>Real-Time Multi-LLM Cost Estimator</span>
              </div>
              <div className="card-subtitle">Calculated for {items.length} application strings across {selectedTargetLangs.length} target language(s)</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {costEstimates.map(est => {
              const multiCost = Math.round(est.estimatedCostUsd * selectedTargetLangs.length * 1000) / 1000;
              return (
                <div key={est.provider + est.model} style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{est.provider}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{est.model}</div>
                  </div>
                  
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: est.isFree ? 'var(--accent-emerald)' : 'var(--primary)' }}>
                      {est.isFree ? 'FREE (0.00$)' : `$${multiCost.toFixed(4)}`}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {est.estimatedInputTokens * selectedTargetLangs.length} In / {est.estimatedOutputTokens * selectedTargetLangs.length} Out Tokens
                    </div>
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
