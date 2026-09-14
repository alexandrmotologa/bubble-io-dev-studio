import React from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { TranslationItem } from '../../types';
import { PseudoLocalizerEngine } from '../../core/translator/pseudoLocalizer';

interface PseudoLocalizeTabProps {
  items: TranslationItem[];
  pseudoExpansionPercent: number;
  setPseudoExpansionPercent: (pct: number) => void;
  pseudoCustomInput: string;
  setPseudoCustomInput: (input: string) => void;
  handleRunPseudoLocalization: () => void;
}

export const PseudoLocalizeTab: React.FC<PseudoLocalizeTabProps> = ({
  items,
  pseudoExpansionPercent,
  setPseudoExpansionPercent,
  pseudoCustomInput,
  setPseudoCustomInput,
  handleRunPseudoLocalization
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}>
      {/* Interactive Tester Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <FileText size={18} color="var(--accent-cyan)" />
              <span>Interactive Pseudo-Localization Testing Engine</span>
            </div>
            <div className="card-subtitle">
              Simulates 20%–50% German/Russian text expansion with accented glyphs to test Bubble UI overflow without real translations
            </div>
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
            <div 
              key={item.id} 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '10px 14px', 
                background: 'var(--bg-input)', 
                borderRadius: 'var(--radius-sm)', 
                fontSize: '0.825rem' 
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>{item.sourceText}</span>
              <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {item.translatedText || PseudoLocalizerEngine.localize(item.sourceText, pseudoExpansionPercent)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
