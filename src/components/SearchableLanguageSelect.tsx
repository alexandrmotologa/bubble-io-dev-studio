import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Check, Globe, ChevronDown, CheckSquare, Square, Sparkles } from 'lucide-react';
import { BUBBLE_LANGUAGES, BubbleLanguage } from '../core/translator/bubbleLanguages';

interface SearchableLanguageSelectProps {
  selectedLanguages: string[];
  onChange: (languages: string[]) => void;
  isMultiSelect?: boolean;
}

export const SearchableLanguageSelect: React.FC<SearchableLanguageSelectProps> = ({
  selectedLanguages,
  onChange,
  isMultiSelect = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredLanguages = BUBBLE_LANGUAGES.filter(lang => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      lang.name.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q) ||
      (lang.region && lang.region.toLowerCase().includes(q));

    const matchesRegion = selectedRegion === 'All' || (lang.region && lang.region.includes(selectedRegion));
    return matchesSearch && matchesRegion;
  });

  const handleToggleLanguage = (code: string) => {
    if (isMultiSelect) {
      if (selectedLanguages.includes(code)) {
        if (selectedLanguages.length > 1) {
          onChange(selectedLanguages.filter(c => c !== code));
        }
      } else {
        onChange([...selectedLanguages, code]);
      }
    } else {
      onChange([code]);
      setIsOpen(false);
    }
  };

  const handleRemoveChip = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    if (selectedLanguages.length > 1) {
      onChange(selectedLanguages.filter(c => c !== code));
    }
  };

  const handleSelectPresets = (preset: 'europe' | 'top6' | 'all' | 'clear') => {
    if (preset === 'europe') {
      const euroCodes = ['ro_ro', 'fr_fr', 'es_es', 'de_de', 'it_it', 'pt_pt', 'nl_nl', 'pl_pl', 'uk_ua', 'sv_se', 'da_dk', 'fi_fi', 'el_gr', 'cs_cz', 'hu_hu'];
      onChange(euroCodes);
    } else if (preset === 'top6') {
      onChange(['en_us', 'es_es', 'fr_fr', 'de_de', 'zh_cn', 'ja_jp']);
    } else if (preset === 'all') {
      onChange(BUBBLE_LANGUAGES.map(l => l.code));
    } else if (preset === 'clear') {
      onChange(['en_us']);
    }
  };

  const selectedObjects = BUBBLE_LANGUAGES.filter(l => selectedLanguages.includes(l.code));

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger / Summary Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          minHeight: '40px',
          padding: '6px 12px',
          background: 'var(--bg-input)',
          border: isOpen ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', flex: 1 }}>
          <Globe size={15} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
          
          {selectedObjects.length === 0 ? (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select Target Languages...</span>
          ) : isMultiSelect && selectedObjects.length > 3 ? (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              {selectedObjects.slice(0, 3).map(l => (
                <span
                  key={l.code}
                  className="badge badge-cyan"
                  style={{ fontSize: '0.725rem', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>{l.name}</span>
                  <X size={10} style={{ cursor: 'pointer' }} onClick={(e) => handleRemoveChip(e, l.code)} />
                </span>
              ))}
              <span className="badge badge-indigo" style={{ fontSize: '0.725rem', padding: '2px 6px' }}>
                +{selectedObjects.length - 3} more ({selectedObjects.length} Total)
              </span>
            </div>
          ) : (
            selectedObjects.map(l => (
              <span
                key={l.code}
                className="badge badge-cyan"
                style={{ fontSize: '0.725rem', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>{l.name}</span>
                {selectedLanguages.length > 1 && (
                  <X size={10} style={{ cursor: 'pointer' }} onClick={(e) => handleRemoveChip(e, l.code)} />
                )}
              </span>
            ))
          )}
        </div>

        <ChevronDown size={14} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-active)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {/* Search Bar Input */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              autoFocus
              placeholder="Search 77+ Bubble languages (e.g. Romanian, fr_fr, Japanese)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ paddingLeft: '32px', paddingRight: '28px', height: '34px', fontSize: '0.825rem' }}
            />
            {searchQuery && (
              <X
                size={12}
                style={{ position: 'absolute', right: '10px', top: '11px', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setSearchQuery('')}
              />
            )}
          </div>

          {/* Quick Presets & Region Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {['All', 'Europe', 'Americas', 'Asia', 'Middle East'].map(region => (
                <button
                  key={region}
                  type="button"
                  onClick={() => setSelectedRegion(region)}
                  className={`btn btn-sm ${selectedRegion === region ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.675rem', padding: '2px 8px', height: '24px', border: 'none' }}
                >
                  {region}
                </button>
              ))}
            </div>

            {isMultiSelect && (
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => handleSelectPresets('europe')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.675rem', padding: '2px 6px', height: '24px' }}
                >
                  Top Europe (15)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPresets('top6')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.675rem', padding: '2px 6px', height: '24px' }}
                >
                  Global Top 6
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPresets('clear')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.675rem', padding: '2px 6px', height: '24px', color: 'var(--text-muted)' }}
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Scrollable Language List */}
          <div
            style={{
              maxHeight: '260px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              paddingRight: '4px'
            }}
          >
            {filteredLanguages.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No languages found matching "{searchQuery}"
              </div>
            ) : (
              filteredLanguages.map(lang => {
                const isSelected = selectedLanguages.includes(lang.code);
                return (
                  <div
                    key={lang.code}
                    onClick={() => handleToggleLanguage(lang.code)}
                    style={{
                      padding: '7px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-input)',
                      border: isSelected ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      transition: 'background 0.1s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isMultiSelect ? (
                        isSelected ? (
                          <CheckSquare size={15} color="var(--accent-cyan)" />
                        ) : (
                          <Square size={15} color="var(--text-muted)" />
                        )
                      ) : (
                        isSelected && <Check size={14} color="var(--accent-emerald)" />
                      )}
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{lang.name}</span>
                        <span style={{ color: 'var(--text-secondary)', marginLeft: '6px', fontSize: '0.75rem' }}>({lang.nativeName})</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {lang.region && (
                        <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>{lang.region}</span>
                      )}
                      <code style={{ fontSize: '0.7rem', padding: '2px 4px', background: 'rgba(0,0,0,0.3)', borderRadius: '3px' }}>
                        {lang.code}
                      </code>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Selection Count */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '8px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)'
          }}>
            <span>
              <strong>{selectedLanguages.length}</strong> target {selectedLanguages.length === 1 ? 'language' : 'languages'} selected
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.725rem', padding: '3px 10px', height: '26px' }}
            >
              Apply Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
