import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Sparkles, 
  FileCode, 
  Package, 
  Layers, 
  Download, 
  Settings2,
  RefreshCw,
  Clock,
  Key,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { PluginGeneratedSdk, PluginParameterDef, PluginSdkActionConfig } from '../types';
import { PluginSdkEngine } from '../core/plugin-studio/pluginSdkEngine';
import { toast } from '../core/toast/toastManager';

interface PluginSdkGeneratorProps {
  onLog: (module: 'api-studio', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

interface ActionPreset {
  id: string;
  name: string;
  actionName: string;
  actionType: 'server_side' | 'client_side';
  description: string;
  apiUrl: string;
  httpMethod: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  useBubbleContextKeys: boolean;
  bubbleApiKeyName: string;
  enableRetry: boolean;
  maxRetries: number;
  timeoutMs: number;
  parameters: PluginParameterDef[];
  returnsValue: boolean;
  returnFields: PluginParameterDef[];
}

const PRESETS: ActionPreset[] = [
  {
    id: 'stripe_payment',
    name: 'Stripe Payment Intent',
    actionName: 'create_payment_intent',
    actionType: 'server_side',
    description: 'Creates a Stripe payment intent and returns client_secret for checkout elements',
    apiUrl: 'https://api.stripe.com/v1/payment_intents',
    httpMethod: 'POST',
    useBubbleContextKeys: true,
    bubbleApiKeyName: 'stripe_secret_key',
    enableRetry: true,
    maxRetries: 3,
    timeoutMs: 15000,
    parameters: [
      { name: 'amount', type: 'number', required: true, description: 'Amount in cents (e.g. 2000 for $20)' },
      { name: 'currency', type: 'text', required: true, description: 'Three-letter ISO currency code (usd, eur)' },
      { name: 'customer_id', type: 'text', required: false, description: 'Optional Stripe Customer ID' },
      { name: 'description', type: 'text', required: false, description: 'Order or transaction description' }
    ],
    returnsValue: true,
    returnFields: [
      { name: 'client_secret', type: 'text', required: true },
      { name: 'id', type: 'text', required: true },
      { name: 'status', type: 'text', required: true }
    ]
  },
  {
    id: 'openai_chat',
    name: 'OpenAI Chat Completion',
    actionName: 'generate_chat_completion',
    actionType: 'server_side',
    description: 'Invokes OpenAI GPT model with structured system and user prompts',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    httpMethod: 'POST',
    useBubbleContextKeys: true,
    bubbleApiKeyName: 'openai_api_key',
    enableRetry: true,
    maxRetries: 2,
    timeoutMs: 30000,
    parameters: [
      { name: 'model', type: 'text', required: true, description: 'Model ID (e.g. gpt-4o-mini)' },
      { name: 'prompt', type: 'text', required: true, description: 'User input message' },
      { name: 'system_instruction', type: 'text', required: false, description: 'System role context' },
      { name: 'temperature', type: 'number', required: false, description: 'Sampling temperature (0.0 - 1.0)' }
    ],
    returnsValue: true,
    returnFields: [
      { name: 'response_text', type: 'text', required: true },
      { name: 'tokens_used', type: 'number', required: false }
    ]
  },
  {
    id: 'sendgrid_email',
    name: 'SendGrid Transactional Email',
    actionName: 'send_transactional_email',
    actionType: 'server_side',
    description: 'Sends dynamic HTML transactional email via SendGrid V3 Mail Send API',
    apiUrl: 'https://api.sendgrid.com/v3/mail/send',
    httpMethod: 'POST',
    useBubbleContextKeys: true,
    bubbleApiKeyName: 'sendgrid_api_key',
    enableRetry: true,
    maxRetries: 3,
    timeoutMs: 10000,
    parameters: [
      { name: 'to_email', type: 'text', required: true, description: 'Recipient email address' },
      { name: 'subject', type: 'text', required: true, description: 'Email subject line' },
      { name: 'html_content', type: 'text', required: true, description: 'HTML body of the message' },
      { name: 'from_email', type: 'text', required: false, description: 'Sender verified email' }
    ],
    returnsValue: true,
    returnFields: [
      { name: 'status_code', type: 'number', required: true },
      { name: 'message_id', type: 'text', required: false }
    ]
  },
  {
    id: 'client_event_dispatcher',
    name: 'Client-Side Event Dispatcher',
    actionName: 'trigger_browser_analytics',
    actionType: 'client_side',
    description: 'Fires client-side CustomEvent in browser window for analytics & tracking',
    apiUrl: '',
    httpMethod: 'POST',
    useBubbleContextKeys: false,
    bubbleApiKeyName: '',
    enableRetry: false,
    maxRetries: 1,
    timeoutMs: 5000,
    parameters: [
      { name: 'event_name', type: 'text', required: true, description: 'Telemetry or tracking event name' },
      { name: 'user_id', type: 'text', required: false, description: 'Current logged-in user identifier' },
      { name: 'metadata', type: 'object', required: false, description: 'Arbitrary JSON metadata object' }
    ],
    returnsValue: false,
    returnFields: []
  }
];

export const PluginSdkGenerator: React.FC<PluginSdkGeneratorProps> = ({ onLog }) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('stripe_payment');
  const [actionName, setActionName] = useState('create_payment_intent');
  const [actionType, setActionType] = useState<'server_side' | 'client_side'>('server_side');
  const [description, setDescription] = useState('Creates a payment intent with external provider');
  const [apiUrl, setApiUrl] = useState('https://api.stripe.com/v1/payment_intents');
  const [httpMethod, setHttpMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('POST');
  const [useBubbleContextKeys, setUseBubbleContextKeys] = useState(true);
  const [bubbleApiKeyName, setBubbleApiKeyName] = useState('stripe_secret_key');
  const [enableRetry, setEnableRetry] = useState(true);
  const [maxRetries, setMaxRetries] = useState(3);
  const [timeoutMs, setTimeoutMs] = useState(15000);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [parameters, setParameters] = useState<PluginParameterDef[]>([
    { name: 'amount', type: 'number', required: true, description: 'Amount in cents (e.g. 2000 for $20)' },
    { name: 'currency', type: 'text', required: true, description: 'Three-letter ISO currency code' },
    { name: 'customer_id', type: 'text', required: false, description: 'Optional customer ID' }
  ]);
  const [returnsValue, setReturnsValue] = useState(true);
  const [returnFields, setReturnFields] = useState<PluginParameterDef[]>([
    { name: 'client_secret', type: 'text', required: true },
    { name: 'status', type: 'text', required: true }
  ]);

  const [activeOutputTab, setActiveOutputTab] = useState<'ssa' | 'csa' | 'types' | 'package'>('ssa');
  const [copied, setCopied] = useState(false);

  const handleApplyPreset = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setSelectedPreset(presetId);
    setActionName(preset.actionName);
    setActionType(preset.actionType);
    setDescription(preset.description);
    setApiUrl(preset.apiUrl);
    setHttpMethod(preset.httpMethod);
    setUseBubbleContextKeys(preset.useBubbleContextKeys);
    setBubbleApiKeyName(preset.bubbleApiKeyName);
    setEnableRetry(preset.enableRetry);
    setMaxRetries(preset.maxRetries);
    setTimeoutMs(preset.timeoutMs);
    setParameters([...preset.parameters]);
    setReturnsValue(preset.returnsValue);
    setReturnFields([...preset.returnFields]);
    setActiveOutputTab(preset.actionType === 'client_side' ? 'csa' : 'ssa');
    toast.info(`Applied template: ${preset.name}`);
    onLog('api-studio', `Loaded Plugin Action template '${preset.name}'`, 'info');
  };

  const config: PluginSdkActionConfig = {
    actionName,
    actionType,
    description,
    apiUrl: apiUrl || undefined,
    httpMethod,
    useBubbleContextKeys,
    bubbleApiKeyName,
    enableRetry,
    maxRetries,
    timeoutMs,
    parameters,
    returnsValue,
    returnFields
  };

  const sdk: PluginGeneratedSdk = PluginSdkEngine.generatePluginSdk(config);

  const handleAddParam = () => {
    setParameters([
      ...parameters,
      { name: `param_${parameters.length + 1}`, type: 'text', required: false, description: 'Custom parameter' }
    ]);
  };

  const handleRemoveParam = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleUpdateParam = (index: number, updates: Partial<PluginParameterDef>) => {
    setParameters(parameters.map((p, i) => i === index ? { ...p, ...updates } : p));
  };

  const handleAddReturnField = () => {
    setReturnFields([
      ...returnFields,
      { name: `output_${returnFields.length + 1}`, type: 'text', required: true }
    ]);
  };

  const handleRemoveReturnField = (index: number) => {
    setReturnFields(returnFields.filter((_, i) => i !== index));
  };

  const handleUpdateReturnField = (index: number, updates: Partial<PluginParameterDef>) => {
    setReturnFields(returnFields.map((p, i) => i === index ? { ...p, ...updates } : p));
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Bubble Plugin SDK code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
    onLog('api-studio', `Copied Bubble Plugin ${activeOutputTab.toUpperCase()} code to clipboard.`, 'success');
  };

  const handleDownloadCode = () => {
    const activeText = activeOutputTab === 'ssa' ? sdk.serverSideCode : activeOutputTab === 'csa' ? sdk.clientSideCode : activeOutputTab === 'types' ? sdk.typeScriptInterfaces : sdk.packageJsonSnippet;
    const extension = activeOutputTab === 'package' ? 'json' : activeOutputTab === 'types' ? 'ts' : 'js';
    const filename = `${actionName}_${activeOutputTab}.${extension}`;
    
    const blob = new Blob([activeText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Banner with Quick Presets */}
      <div className="card" style={{ padding: '14px 18px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent-emerald) 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Zap size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Plugin Action Scaffolder & SDK Engine
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Select a production-ready template or build a custom Server-Side (SSA) / Client-Side (CSA) action
              </div>
            </div>
          </div>

          {/* Preset Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Template:</span>
            <div className="select-wrapper-premium">
              <select
                value={selectedPreset}
                onChange={(e) => handleApplyPreset(e.target.value)}
                className="select-premium"
                style={{ fontSize: '0.75rem', padding: '5px 28px 5px 10px' }}
              >
                {PRESETS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="responsive-split" style={{ alignItems: 'start' }}>
        {/* Left Column: Action Config & Parameters Builder */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: '14px' }}>
            <div>
              <div className="card-title">
                <Code2 size={16} color="var(--primary)" />
                <span>Action Specification</span>
              </div>
              <div className="card-subtitle">Configure Bubble Plugin Editor inputs, outputs & error policies</div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  setActionType('server_side');
                  setActiveOutputTab('ssa');
                }}
                className={`btn btn-sm ${actionType === 'server_side' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '3px 8px' }}
              >
                Server Action (SSA)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActionType('client_side');
                  setActiveOutputTab('csa');
                }}
                className={`btn btn-sm ${actionType === 'client_side' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '3px 8px' }}
              >
                Client Action (CSA)
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="grid-2" style={{ gap: '10px' }}>
              <div>
                <label className="input-label">Action Name</label>
                <input
                  type="text"
                  value={actionName}
                  onChange={(e) => setActionName(e.target.value.replace(/[^a-zA-Z0-9_]/g, '_'))}
                  className="input"
                  placeholder="e.g. process_payment"
                />
              </div>

              <div>
                <label className="input-label">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input"
                  placeholder="Action summary in plugin builder"
                />
              </div>
            </div>

            {actionType === 'server_side' && (
              <div>
                <label className="input-label">Target REST API Endpoint (Optional)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={httpMethod}
                    onChange={(e: any) => setHttpMethod(e.target.value)}
                    className="select"
                    style={{ width: '90px' }}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="input"
                    placeholder="https://api.service.com/v1/action"
                  />
                </div>
              </div>
            )}

            {/* Advanced Settings Toggle */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', width: '100%', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Settings2 size={13} />
                  <span>Advanced Settings (Auth, Retries, Timeout)</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{showAdvanced ? '▲ Hide' : '▼ Expand'}</span>
              </button>

              {showAdvanced && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.775rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={useBubbleContextKeys}
                        onChange={e => setUseBubbleContextKeys(e.target.checked)}
                      />
                      <span>Inject Bubble Private API Key (<code>context.keys</code>)</span>
                    </label>
                    {useBubbleContextKeys && (
                      <input
                        type="text"
                        value={bubbleApiKeyName}
                        onChange={e => setBubbleApiKeyName(e.target.value)}
                        placeholder="api_key_name"
                        className="input"
                        style={{ width: '140px', height: '26px', fontSize: '0.75rem', padding: '2px 6px' }}
                      />
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.775rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={enableRetry}
                        onChange={e => setEnableRetry(e.target.checked)}
                      />
                      <span>Auto-retry on failure with backoff</span>
                    </label>
                    {enableRetry && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Max retries:</span>
                        <select
                          value={maxRetries}
                          onChange={e => setMaxRetries(Number(e.target.value))}
                          className="select"
                          style={{ width: '60px', height: '26px', fontSize: '0.75rem', padding: '2px' }}
                        >
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={5}>5</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.775rem', color: 'var(--text-primary)' }}>Execution Timeout (ms):</span>
                    <select
                      value={timeoutMs}
                      onChange={e => setTimeoutMs(Number(e.target.value))}
                      className="select"
                      style={{ width: '110px', height: '26px', fontSize: '0.75rem', padding: '2px 6px' }}
                    >
                      <option value={5000}>5,000 ms (5s)</option>
                      <option value={10000}>10,000 ms (10s)</option>
                      <option value={15000}>15,000 ms (15s)</option>
                      <option value={30000}>30,000 ms (30s)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Input Parameters Builder */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="input-label" style={{ margin: 0 }}>Input Parameters ({parameters.length})</label>
                <button onClick={handleAddParam} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', height: '24px', fontSize: '0.7rem' }}>
                  <Plus size={11} />
                  <span>Add Input</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
                {parameters.map((param, pIdx) => (
                  <div key={pIdx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <input
                      type="text"
                      value={param.name}
                      onChange={(e) => handleUpdateParam(pIdx, { name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '_') })}
                      placeholder="field_name"
                      className="input"
                      style={{ height: '26px', fontSize: '0.75rem', padding: '2px 6px', flex: 1.2 }}
                    />
                    <select
                      value={param.type}
                      onChange={(e: any) => handleUpdateParam(pIdx, { type: e.target.value })}
                      className="select"
                      style={{ height: '26px', fontSize: '0.75rem', padding: '2px 4px', width: '100px' }}
                    >
                      <option value="text">text</option>
                      <option value="number">number</option>
                      <option value="boolean">boolean</option>
                      <option value="date">date</option>
                      <option value="object">object</option>
                      <option value="list_text">list(text)</option>
                      <option value="list_number">list(num)</option>
                      <option value="file">file</option>
                    </select>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.7rem', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input
                        type="checkbox"
                        checked={param.required}
                        onChange={(e) => handleUpdateParam(pIdx, { required: e.target.checked })}
                      />
                      Req
                    </label>
                    <button
                      onClick={() => handleRemoveParam(pIdx)}
                      style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', opacity: 0.7, padding: '2px' }}
                      title="Remove field"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Output Return Fields Builder (SSA) */}
            {actionType === 'server_side' && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={returnsValue}
                      onChange={e => setReturnsValue(e.target.checked)}
                    />
                    <span>Return Output Values ({returnFields.length})</span>
                  </label>
                  {returnsValue && (
                    <button onClick={handleAddReturnField} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', height: '24px', fontSize: '0.7rem' }}>
                      <Plus size={11} />
                      <span>Add Output</span>
                    </button>
                  )}
                </div>

                {returnsValue && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                    {returnFields.map((rf, rIdx) => (
                      <div key={rIdx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <input
                          type="text"
                          value={rf.name}
                          onChange={(e) => handleUpdateReturnField(rIdx, { name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '_') })}
                          placeholder="return_field_name"
                          className="input"
                          style={{ height: '26px', fontSize: '0.75rem', padding: '2px 6px', flex: 1.2 }}
                        />
                        <select
                          value={rf.type}
                          onChange={(e: any) => handleUpdateReturnField(rIdx, { type: e.target.value })}
                          className="select"
                          style={{ height: '26px', fontSize: '0.75rem', padding: '2px 4px', width: '100px' }}
                        >
                          <option value="text">text</option>
                          <option value="number">number</option>
                          <option value="boolean">boolean</option>
                          <option value="date">date</option>
                          <option value="object">object</option>
                          <option value="list_text">list(text)</option>
                        </select>
                        <button
                          onClick={() => handleRemoveReturnField(rIdx)}
                          style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', opacity: 0.7, padding: '2px' }}
                          title="Remove return field"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Code Generator Output */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: '12px' }}>
            <div>
              <div className="card-title">
                <Sparkles size={16} color="var(--accent-emerald)" />
                <span>Generated Plugin Action SDK</span>
              </div>
              <div className="card-subtitle">Ready-to-paste JavaScript/TypeScript for Bubble Plugin Builder</div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={handleDownloadCode} className="btn btn-secondary btn-sm" title="Download File">
                <Download size={13} />
                <span>Export</span>
              </button>
              <button
                onClick={() => {
                  const textToCopy = activeOutputTab === 'ssa' ? sdk.serverSideCode : activeOutputTab === 'csa' ? sdk.clientSideCode : activeOutputTab === 'types' ? sdk.typeScriptInterfaces : sdk.packageJsonSnippet;
                  handleCopyCode(textToCopy);
                }}
                className="btn btn-primary btn-sm"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          {/* Subtabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '3px', borderRadius: 'var(--radius-sm)', marginBottom: '12px', overflowX: 'auto' }}>
            <button
              onClick={() => setActiveOutputTab('ssa')}
              className={`btn btn-sm ${activeOutputTab === 'ssa' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '4px 10px', fontSize: '0.75rem' }}
            >
              <FileCode size={12} />
              <span>Server Action (SSA)</span>
            </button>
            <button
              onClick={() => setActiveOutputTab('csa')}
              className={`btn btn-sm ${activeOutputTab === 'csa' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '4px 10px', fontSize: '0.75rem' }}
            >
              <Layers size={12} />
              <span>Client Action (CSA)</span>
            </button>
            <button
              onClick={() => setActiveOutputTab('types')}
              className={`btn btn-sm ${activeOutputTab === 'types' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '4px 10px', fontSize: '0.75rem' }}
            >
              <Code2 size={12} />
              <span>TypeScript Types</span>
            </button>
            <button
              onClick={() => setActiveOutputTab('package')}
              className={`btn btn-sm ${activeOutputTab === 'package' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '4px 10px', fontSize: '0.75rem' }}
            >
              <Package size={12} />
              <span>package.json</span>
            </button>
          </div>

          <pre style={{
            background: 'var(--bg-input)',
            padding: '14px',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.775rem',
            color: 'var(--text-secondary)',
            maxHeight: '480px',
            overflowY: 'auto',
            lineHeight: 1.45,
            border: '1px solid var(--border-subtle)'
          }}>
            {activeOutputTab === 'ssa' && sdk.serverSideCode}
            {activeOutputTab === 'csa' && sdk.clientSideCode}
            {activeOutputTab === 'types' && sdk.typeScriptInterfaces}
            {activeOutputTab === 'package' && sdk.packageJsonSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
};
