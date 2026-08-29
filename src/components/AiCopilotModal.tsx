import React, { useState } from 'react';
import { 
  Bot, 
  X, 
  Sparkles, 
  Search, 
  Code2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Play, 
  Layers, 
  FileCode,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CopilotEngine, PrivacyRuleExplanationResult } from '../core/ai/copilotEngine';
import { toast } from '../core/toast/toastManager';

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

type CopilotMode = 'query' | 'regex' | 'privacy';

export const AiCopilotModal: React.FC<AiCopilotModalProps> = ({
  isOpen,
  onClose,
  onApplyQueryToRepl,
  availableDataTypes = ['User', 'Product', 'Order', 'PaymentRecord', 'Transaction']
}) => {
  const [mode, setMode] = useState<CopilotMode>('query');
  const [targetDataType, setTargetDataType] = useState(availableDataTypes[0] || 'User');
  const [queryPrompt, setQueryPrompt] = useState('Find all active orders with total > 100 created in the last 30 days');
  const [isGenerating, setIsGenerating] = useState(false);
  const [queryResult, setQueryResult] = useState<any | null>(null);

  // Regex mode state
  const [regexDesc, setRegexDesc] = useState('Validate standard RFC email address');
  const [regexResult, setRegexResult] = useState<any | null>(null);

  // Privacy mode state
  const [privacyPrompt, setPrivacyPrompt] = useState('Current User is Record Owner or Admin');
  const [privacyResult, setPrivacyResult] = useState<PrivacyRuleExplanationResult | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateQuery = async () => {
    if (!queryPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await CopilotEngine.generateSearchQuery(queryPrompt);
      setQueryResult(res);
      toast.success('Generated Bubble search query constraints');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateRegex = async () => {
    if (!regexDesc.trim()) return;
    setIsGenerating(true);
    try {
      const res = await CopilotEngine.generateRegex(regexDesc);
      setRegexResult(res);
      toast.success('Compiled Bubble Regex formula');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePrivacy = async () => {
    if (!privacyPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await CopilotEngine.explainPrivacyRule(privacyPrompt);
      setPrivacyResult(res);
      toast.success('Analyzed Privacy Rule access boundaries');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
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
          maxWidth: '820px',
          maxHeight: '88vh',
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
              width: '36px',
              height: '36px',
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
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Ctrl + I</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Natural language query synthesis, dynamic regex formulas & privacy rule explainers
              </div>
            </div>
          </div>

          <button onClick={onClose} className="btn-icon" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Sub-mode selector */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-input)', overflowX: 'auto' }}>
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
              borderBottom: mode === 'query' ? '2px solid var(--primary)' : 'none',
              whiteSpace: 'nowrap'
            }}
          >
            <Search size={14} />
            <span>Text-to-Search Query</span>
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
              borderBottom: mode === 'regex' ? '2px solid var(--primary)' : 'none',
              whiteSpace: 'nowrap'
            }}
          >
            <Code2 size={14} />
            <span>Regex & Formula Builder</span>
          </button>
          <button
            onClick={() => setMode('privacy')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: mode === 'privacy' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'privacy' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              borderBottom: mode === 'privacy' ? '2px solid var(--primary)' : 'none',
              whiteSpace: 'nowrap'
            }}
          >
            <ShieldCheck size={14} />
            <span>Privacy Rule Explainer</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Mode 1: Search Query */}
          {mode === 'query' && (
            <>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ width: '160px' }}>
                  <label className="input-label">Target Data Type</label>
                  <select value={targetDataType} onChange={e => setTargetDataType(e.target.value)} className="select select-premium">
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
                    placeholder="e.g. Find all active users registered last week..."
                    className="input"
                    onKeyDown={e => e.key === 'Enter' && handleGenerateQuery()}
                  />
                </div>
                <button onClick={handleGenerateQuery} disabled={isGenerating} className="btn btn-primary" style={{ height: '40px' }}>
                  <Sparkles size={14} className={isGenerating ? 'spin' : ''} />
                  <span>{isGenerating ? 'Synthesizing...' : 'Generate Query'}</span>
                </button>
              </div>

              {/* Output */}
              {queryResult && (
                <div className="card" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>BUBBLE "DO A SEARCH FOR" EXPRESSION</span>
                    <button onClick={() => handleCopy(queryResult.bubbleExpression, 'copy_search')} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                      {copiedKey === 'copy_search' ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                      <span>{copiedKey === 'copy_search' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <code style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{queryResult.bubbleExpression}</code>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>DATA API CONNECTOR QUERY</span>
                    <button onClick={() => handleCopy(queryResult.apiConnectorQuery, 'copy_api')} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                      {copiedKey === 'copy_api' ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                      <span>{copiedKey === 'copy_api' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <code style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{queryResult.apiConnectorQuery}</code>

                  {onApplyQueryToRepl && (
                    <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => {
                          onApplyQueryToRepl(targetDataType, queryResult.constraints);
                          onClose();
                        }}
                        className="btn btn-primary btn-sm"
                      >
                        <Play size={13} />
                        <span>Apply & Execute in Data REPL</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Mode 2: Regex & Formula */}
          {mode === 'regex' && (
            <>
              <div>
                <label className="input-label">What text pattern do you want to match / validate?</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={regexDesc}
                    onChange={e => setRegexDesc(e.target.value)}
                    placeholder="e.g. Validate email, international phone number, kebab-case slug..."
                    className="input"
                    style={{ flex: 1 }}
                    onKeyDown={e => e.key === 'Enter' && handleGenerateRegex()}
                  />
                  <button onClick={handleGenerateRegex} disabled={isGenerating} className="btn btn-primary">
                    <Sparkles size={14} className={isGenerating ? 'spin' : ''} />
                    <span>{isGenerating ? 'Compiling...' : 'Compile Regex'}</span>
                  </button>
                </div>
              </div>

              {regexResult && (
                <div className="card" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>REGULAR EXPRESSION PATTERN</span>
                    <button onClick={() => handleCopy(regexResult.pattern, 'copy_reg')} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                      {copiedKey === 'copy_reg' ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                      <span>{copiedKey === 'copy_reg' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <code style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)' }}>{regexResult.pattern}</code>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>BUBBLE FORMULA EXPRESSION</span>
                    <button onClick={() => handleCopy(regexResult.bubbleFormula, 'copy_formula')} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                      {copiedKey === 'copy_formula' ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                      <span>{copiedKey === 'copy_formula' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <code style={{ fontSize: '0.8rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{regexResult.bubbleFormula}</code>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <strong>Explanation:</strong> {regexResult.explanation}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Mode 3: Privacy Rule Explainer */}
          {mode === 'privacy' && (
            <>
              <div>
                <label className="input-label">Describe the Bubble Privacy Rule or Permission Condition</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={privacyPrompt}
                    onChange={e => setPrivacyPrompt(e.target.value)}
                    placeholder="e.g. Current User is User's Admin or Created By Current User..."
                    className="input"
                    style={{ flex: 1 }}
                    onKeyDown={e => e.key === 'Enter' && handleGeneratePrivacy()}
                  />
                  <button onClick={handleGeneratePrivacy} disabled={isGenerating} className="btn btn-primary">
                    <Sparkles size={14} className={isGenerating ? 'spin' : ''} />
                    <span>{isGenerating ? 'Analyzing...' : 'Explain Rule'}</span>
                  </button>
                </div>
              </div>

              {privacyResult && (
                <div className="card" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    RULE SCOPE: {privacyResult.roleName.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {privacyResult.plainEnglishSummary}
                  </div>

                  <div className="grid-2" style={{ gap: '10px', marginTop: '6px' }}>
                    <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                      <strong style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>Visible Fields:</strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {privacyResult.canViewFields.map((f, i) => <span key={i} className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>{f}</span>)}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <strong style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>Search & Write Access:</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                        Searchable: <strong>Yes</strong> • Modifiable: <code>{privacyResult.canModifyFields.join(', ')}</code>
                      </div>
                    </div>
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
