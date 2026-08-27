import React, { useState } from 'react';
import { 
  Bot, 
  X, 
  Sparkles, 
  Search, 
  Code2, 
  Copy, 
  Check, 
  ArrowRight, 
  Play, 
  Layers, 
  FileCode,
  Sliders
} from 'lucide-react';
import { CopilotEngine } from '../core/copilot/copilotEngine';
import { CopilotQueryResponse, CopilotRegexResponse } from '../types';

interface AiCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyQueryToRepl?: (dataType: string, constraints: any[]) => void;
  availableDataTypes?: string[];
  geminiApiKey?: string;
  openaiApiKey?: string;
  groqApiKey?: string;
  xaiApiKey?: string;
}

type CopilotMode = 'query' | 'regex';

export const AiCopilotModal: React.FC<AiCopilotModalProps> = ({
  isOpen,
  onClose,
  onApplyQueryToRepl,
  availableDataTypes = ['User', 'Product', 'Order', 'PaymentRecord'],
  geminiApiKey,
  openaiApiKey,
  groqApiKey,
  xaiApiKey
}) => {
  const [mode, setMode] = useState<CopilotMode>('query');
  const [targetDataType, setTargetDataType] = useState(availableDataTypes[0] || 'User');
  const [queryPrompt, setQueryPrompt] = useState('Find all active users with role Admin who registered this month');
  const [isGenerating, setIsGenerating] = useState(false);
  const [queryResult, setQueryResult] = useState<CopilotQueryResponse | null>(null);

  // Regex mode state
  const [regexDesc, setRegexDesc] = useState('Extract email address from user comment text');
  const [sampleText, setSampleText] = useState('Please contact support at john.doe@example.com for order #1234');
  const [regexResult, setRegexResult] = useState<CopilotRegexResponse | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerateQuery = async () => {
    if (!queryPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await CopilotEngine.generateQueryConstraints(
        {
          naturalLanguagePrompt: queryPrompt,
          targetDataType,
          provider: 'groq'
        },
        { geminiApiKey, openaiApiKey, groqApiKey, xaiApiKey }
      );
      setQueryResult(res);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateRegex = async () => {
    if (!regexDesc.trim()) return;
    setIsGenerating(true);
    try {
      const res = await CopilotEngine.generateRegex({
        description: regexDesc,
        sampleInput: sampleText
      });
      setRegexResult(res);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '750px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(99, 102, 241, 0.2)',
          border: '1px solid var(--border-active)',
          overflow: 'hidden',
          padding: 0
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Bot size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Bubble AI Copilot & Expression Studio</span>
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Ctrl+I</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Natural language query synthesis & dynamic regex builder
              </div>
            </div>
          </div>

          <button onClick={onClose} className="btn-icon" style={{ border: 'none', background: 'transparent' }}>
            <X size={18} />
          </button>
        </div>

        {/* Sub-mode selector */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-input)' }}>
          <button
            onClick={() => setMode('query')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: mode === 'query' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'query' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              borderBottom: mode === 'query' ? '2px solid var(--primary)' : 'none'
            }}
          >
            <Search size={14} />
            <span>Text-to-Data API Query</span>
          </button>
          <button
            onClick={() => setMode('regex')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: mode === 'regex' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'regex' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              borderBottom: mode === 'regex' ? '2px solid var(--primary)' : 'none'
            }}
          >
            <Code2 size={14} />
            <span>Bubble Regex & Formula Builder</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {mode === 'query' ? (
            <>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ width: '160px' }}>
                  <label className="input-label">Target Data Type</label>
                  <select value={targetDataType} onChange={e => setTargetDataType(e.target.value)} className="select">
                    {availableDataTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <label className="input-label">Natural Language Filter Prompt</label>
                  <input
                    type="text"
                    value={queryPrompt}
                    onChange={e => setQueryPrompt(e.target.value)}
                    placeholder="e.g. Find all active users with role Admin..."
                    className="input"
                    onKeyDown={e => e.key === 'Enter' && handleGenerateQuery()}
                  />
                </div>
                <button onClick={handleGenerateQuery} disabled={isGenerating} className="btn btn-primary" style={{ height: '40px' }}>
                  <Sparkles size={14} className={isGenerating ? 'spin' : ''} />
                  <span>{isGenerating ? 'Synthesizing...' : 'Generate Query'}</span>
                </button>
              </div>

              {/* Sample Prompts */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Try:</span>
                {[
                  'Active admins with orders > 100',
                  'Users with verified email address',
                  'Orders with status Completed created this year'
                ].map(p => (
                  <button
                    key={p}
                    onClick={() => setQueryPrompt(p)}
                    className="badge badge-indigo"
                    style={{ cursor: 'pointer', border: 'none', background: 'var(--bg-input)' }}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Output */}
              {queryResult && (
                <div className="card" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-emerald)' }}>
                      ✓ {queryResult.interpretedQuery}
                    </div>
                    <button onClick={() => handleCopy(JSON.stringify(queryResult.bubbleConstraints, null, 2))} className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '0.7rem' }}>
                      {copied ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                      <span>{copied ? 'Copied' : 'Copy Constraints'}</span>
                    </button>
                  </div>

                  <pre style={{
                    background: '#090d16',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: '#93c5fd',
                    overflowX: 'auto',
                    margin: 0
                  }}>
                    {JSON.stringify(queryResult.bubbleConstraints, null, 2)}
                  </pre>

                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    {onApplyQueryToRepl && (
                      <button
                        onClick={() => {
                          onApplyQueryToRepl(targetDataType, queryResult.bubbleConstraints);
                          onClose();
                        }}
                        className="btn btn-primary btn-sm"
                      >
                        <Play size={13} />
                        <span>Apply & Execute in Data REPL</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Regex Builder Mode */
            <>
              <div>
                <label className="input-label">What text pattern do you want to match / extract?</label>
                <input
                  type="text"
                  value={regexDesc}
                  onChange={e => setRegexDesc(e.target.value)}
                  placeholder="e.g. Extract email address, phone number, currency amount..."
                  className="input"
                  onKeyDown={e => e.key === 'Enter' && handleGenerateRegex()}
                />
              </div>

              <div>
                <label className="input-label">Sample Input Text for Live Validation</label>
                <textarea
                  value={sampleText}
                  onChange={e => setSampleText(e.target.value)}
                  placeholder="Paste sample string from Bubble input or API response..."
                  className="input"
                  style={{ height: '70px', resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                />
              </div>

              <button onClick={handleGenerateRegex} disabled={isGenerating} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                <Sparkles size={14} className={isGenerating ? 'spin' : ''} />
                <span>{isGenerating ? 'Compiling Regex...' : 'Compile Bubble Regex'}</span>
              </button>

              {regexResult && (
                <div className="card" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{regexResult.explanation}</div>
                    <button onClick={() => handleCopy(regexResult.regexPattern)} className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '0.7rem' }}>
                      {copied ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                      <span>{copied ? 'Copied' : 'Copy Pattern'}</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                    <code style={{ flex: 1, padding: '8px 12px', background: '#090d16', borderRadius: 'var(--radius-sm)', color: '#f472b6', fontSize: '0.85rem' }}>
                      /{regexResult.regexPattern}/{regexResult.regexFlags}
                    </code>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Test Result:</span>
                    {regexResult.matchesSample ? (
                      <span className="badge badge-emerald">
                        ✓ MATCH FOUND: {regexResult.matchedValues.join(', ')}
                      </span>
                    ) : (
                      <span className="badge badge-rose">✕ No match on sample input</span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
