import React from 'react';
import { 
  Plus, 
  Search, 
  Grid, 
  Languages, 
  Upload, 
  FileCode, 
  Sparkles, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { ProjectProfile, TranslationItem } from '../../types';
import { TranslatorEngine } from '../../core/translator/translatorEngine';
import { getLanguageDisplayName } from '../../core/translator/bubbleLanguages';
import { toast } from '../../core/toast/toastManager';

interface TranslationStudioTabProps {
  items: TranslationItem[];
  setItems: React.Dispatch<React.SetStateAction<TranslationItem[]>>;
  filteredItems: TranslationItem[];
  newKey: string;
  setNewKey: (val: string) => void;
  newCategory: TranslationItem['category'];
  setNewCategory: (val: TranslationItem['category']) => void;
  newSourceText: string;
  setNewSourceText: (val: string) => void;
  handleAddItem: () => void;
  categoryFilter: string;
  setCategoryFilter: (val: any) => void;
  categoryCounts: Record<string, number>;
  statusFilter: string;
  setStatusFilter: (val: any) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedTargetLangs: string[];
  viewMode: 'single' | 'matrix';
  setViewMode: (mode: 'single' | 'matrix') => void;
  activeDisplayLang: string;
  setActiveDisplayLang: (lang: string) => void;
  activeProject?: ProjectProfile;
  onLog: (module: 'translator', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLoadSampleStrings: () => void;
  handleUpdateTranslation: (itemId: string, text: string, lang: string) => void;
  handleTranslateSingleItem: (itemId: string, targetLang: string) => void;
  handleTranslateMatrixRow: (itemId: string) => void;
}

export const TranslationStudioTab: React.FC<TranslationStudioTabProps> = ({
  items,
  setItems,
  filteredItems,
  newKey,
  setNewKey,
  newCategory,
  setNewCategory,
  newSourceText,
  setNewSourceText,
  handleAddItem,
  categoryFilter,
  setCategoryFilter,
  categoryCounts,
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm,
  selectedTargetLangs,
  viewMode,
  setViewMode,
  activeDisplayLang,
  setActiveDisplayLang,
  activeProject,
  onLog,
  handleFileUpload,
  handleLoadSampleStrings,
  handleUpdateTranslation,
  handleTranslateSingleItem,
  handleTranslateMatrixRow
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}>
      {/* Add String Row */}
      <div className="card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ width: '180px' }}>
            <label className="input-label" style={{ marginBottom: '6px' }}>App Text Key</label>
            <input 
              type="text" 
              placeholder="e.g. btn_submit" 
              value={newKey} 
              onChange={e => setNewKey(e.target.value)} 
              className="input" 
              style={{ height: '42px', minHeight: '42px', boxSizing: 'border-box' }} 
            />
          </div>
          <div style={{ width: '140px' }}>
            <label className="input-label" style={{ marginBottom: '6px' }}>Category</label>
            <select 
              value={newCategory} 
              onChange={e => setNewCategory(e.target.value as any)} 
              className="select select-premium" 
              style={{ height: '42px', minHeight: '42px', fontSize: '0.85rem', boxSizing: 'border-box' }}
            >
              <option value="ui">UI Label</option>
              <option value="error">Error Message</option>
              <option value="notification">Notification</option>
              <option value="email">Email Body</option>
              <option value="option_set">Option Set</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <label className="input-label" style={{ marginBottom: '6px' }}>English / Source Text</label>
            <input 
              type="text" 
              placeholder="Type text to translate..." 
              value={newSourceText} 
              onChange={e => setNewSourceText(e.target.value)} 
              className="input" 
              style={{ height: '42px', minHeight: '42px', boxSizing: 'border-box' }} 
              onKeyDown={e => e.key === 'Enter' && handleAddItem()} 
            />
          </div>
          <button 
            onClick={handleAddItem} 
            className="btn btn-secondary btn-sm" 
            style={{ height: '42px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
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

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
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

            {!activeProject?.blueprintExportJson ? (
              <button onClick={handleLoadSampleStrings} className="btn btn-secondary" style={{ padding: '10px 20px' }}>
                <FileCode size={16} />
                <span>Load Sample Application Texts</span>
              </button>
            ) : (
              <div style={{ width: '100%', marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Want to test with mock data instead?{' '}
                <button
                  onClick={handleLoadSampleStrings}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-cyan)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    padding: 0
                  }}
                >
                  Load sample mock strings
                </button>
              </div>
            )}
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
  );
};
