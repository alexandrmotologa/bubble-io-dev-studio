import React, { useState } from 'react';
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
  Play
} from 'lucide-react';
import { TranslationItem, TranslationJobConfig } from '../types';
import { TranslatorEngine } from '../core/translator/translatorEngine';

interface TranslatorViewProps {
  onLog: (module: 'translator', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const TranslatorView: React.FC<TranslatorViewProps> = ({ onLog }) => {
  const [items, setItems] = useState<TranslationItem[]>(TranslatorEngine.getSampleItems());
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('ro');
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'gemini' | 'mock'>('openai');
  const [model, setModel] = useState('gpt-4o');
  const [tone, setTone] = useState<'professional' | 'casual' | 'formal' | 'concise'>('professional');
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [glossary, setGlossary] = useState<Record<string, string>>({
    'Pro': 'Pro',
    'Bubble': 'Bubble'
  });
  const [newSourceText, setNewSourceText] = useState('');
  const [newKey, setNewKey] = useState('');

  const handleRunTranslation = async () => {
    if (isTranslating || items.length === 0) return;
    setIsTranslating(true);
    setProgress({ current: 0, total: items.length });
    onLog('translator', `Starting AI batch translation to ${targetLang.toUpperCase()} using ${provider.toUpperCase()} (${model})...`);

    const config: TranslationJobConfig = {
      sourceLang,
      targetLang,
      provider,
      model,
      temperature: 0.3,
      tone,
      useGlossary: true,
      glossary
    };

    try {
      const result = await TranslatorEngine.runTranslation(items, config, (cur, tot) => {
        setProgress({ current: cur, total: tot });
        onLog('translator', `Translated item ${cur}/${tot}...`);
      });

      setItems(result.items);
      onLog('translator', `Translation job completed! ${result.successCount} items translated (${result.tokensUsed} tokens used).`, 'success');
    } catch (e: any) {
      onLog('translator', `Translation failed: ${e.message}`, 'error');
    } finally {
      setIsTranslating(false);
    }
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

  return (
    <div className="view-container">
      {/* Top Configuration Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Languages size={20} color="var(--accent-cyan)" />
              <span>AI Localization Studio & Engine</span>
            </div>
            <div className="card-subtitle">
              Batch translate all Bubble.io app texts with context-aware AI models & glossaries
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
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
            </select>
          </div>

          <div>
            <label className="input-label">AI Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as any)}
              className="select"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic Claude</option>
              <option value="gemini">Google Gemini</option>
              <option value="mock">Offline / Local Engine</option>
            </select>
          </div>

          <div>
            <label className="input-label">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="select"
            >
              <option value="gpt-4o">GPT-4o (Multilingual)</option>
              <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            </select>
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
            <div className="card-title">
              <span>App Texts & Live Translations ({items.length})</span>
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
