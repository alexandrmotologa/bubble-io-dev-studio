import React from 'react';
import { BookOpen, Sparkles, Plus, Search, Trash2 } from 'lucide-react';

interface GlossaryTabProps {
  filteredGlossary: [string, string][];
  glossarySearch: string;
  setGlossarySearch: (search: string) => void;
  newGlossaryTerm: string;
  setNewGlossaryTerm: (term: string) => void;
  newGlossaryRepl: string;
  setNewGlossaryRepl: (repl: string) => void;
  handleInjectStandardGlossary: () => void;
  handleAddGlossaryTerm: () => void;
  handleRemoveGlossaryTerm: (term: string) => void;
}

export const GlossaryTab: React.FC<GlossaryTabProps> = ({
  filteredGlossary,
  glossarySearch,
  setGlossarySearch,
  newGlossaryTerm,
  setNewGlossaryTerm,
  newGlossaryRepl,
  setNewGlossaryRepl,
  handleInjectStandardGlossary,
  handleAddGlossaryTerm,
  handleRemoveGlossaryTerm
}) => {
  return (
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
            <input 
              type="text" 
              placeholder="e.g. Bubble or [Current User's Name]" 
              value={newGlossaryTerm} 
              onChange={e => setNewGlossaryTerm(e.target.value)} 
              className="input" 
              style={{ height: '42px', minHeight: '42px', boxSizing: 'border-box' }} 
            />
          </div>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label className="input-label" style={{ marginBottom: '6px' }}>Replacement in Target (Optional)</label>
            <input 
              type="text" 
              placeholder="Leave empty to keep exact" 
              value={newGlossaryRepl} 
              onChange={e => setNewGlossaryRepl(e.target.value)} 
              className="input" 
              style={{ height: '42px', minHeight: '42px', boxSizing: 'border-box' }} 
            />
          </div>
          <button 
            onClick={handleAddGlossaryTerm} 
            className="btn btn-primary btn-sm" 
            style={{ height: '42px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
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
  );
};
