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
  ExternalLink,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { PluginGeneratedSdk, PluginParameterDef, PluginSdkActionConfig } from '../types';
import { PluginSdkEngine } from '../core/plugin-studio/pluginSdkEngine';
import { toast } from '../core/toast/toastManager';

interface PluginSdkGeneratorProps {
  onLog: (module: 'api-studio', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const PluginSdkGenerator: React.FC<PluginSdkGeneratorProps> = ({ onLog }) => {
  const [actionName, setActionName] = useState('process_payment_intent');
  const [actionType, setActionType] = useState<'server_side' | 'client_side'>('server_side');
  const [description, setDescription] = useState('Creates a payment intent with external provider');
  const [apiUrl, setApiUrl] = useState('https://api.stripe.com/v1/payment_intents');
  const [httpMethod, setHttpMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('POST');
  const [parameters, setParameters] = useState<PluginParameterDef[]>([
    { name: 'amount', type: 'number', required: true, description: 'Amount in smallest currency unit (e.g. cents)' },
    { name: 'currency', type: 'text', required: true, description: 'Three-letter ISO currency code' },
    { name: 'customer_id', type: 'text', required: false, description: 'Optional ID of existing customer' }
  ]);
  const [returnsValue, setReturnsValue] = useState(true);
  const [returnFields, setReturnFields] = useState<PluginParameterDef[]>([
    { name: 'client_secret', type: 'text', required: true },
    { name: 'status', type: 'text', required: true }
  ]);

  const [activeOutputTab, setActiveOutputTab] = useState<'ssa' | 'csa' | 'types' | 'package'>('ssa');
  const [copied, setCopied] = useState(false);

  const config: PluginSdkActionConfig = {
    actionName,
    actionType,
    description,
    apiUrl,
    httpMethod,
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

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Bubble Plugin SDK code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
    onLog('api-studio', 'Copied Bubble Plugin SDK code to clipboard.', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="responsive-split" style={{ alignItems: 'start' }}>
        {/* Left Column: Action Config & Parameters Builder */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Code2 size={16} color="var(--primary)" />
                <span>Plugin Action Definition</span>
              </div>
              <div className="card-subtitle">Configure Bubble Plugin Editor action inputs & outputs</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label className="input-label">Action Name</label>
              <input
                type="text"
                value={actionName}
                onChange={(e) => setActionName(e.target.value)}
                className="input"
                placeholder="e.g. process_payment"
              />
            </div>

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

            {/* Parameters Table */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="input-label" style={{ margin: 0 }}>Input Parameters ({parameters.length})</label>
                <button onClick={handleAddParam} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', height: '24px', fontSize: '0.7rem' }}>
                  <Plus size={11} />
                  <span>Add Field</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {parameters.map((param, pIdx) => (
                  <div key={pIdx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <input
                      type="text"
                      value={param.name}
                      onChange={(e) => handleUpdateParam(pIdx, { name: e.target.value })}
                      placeholder="field_name"
                      className="input"
                      style={{ height: '26px', fontSize: '0.75rem', padding: '2px 6px', flex: 1 }}
                    />
                    <select
                      value={param.type}
                      onChange={(e: any) => handleUpdateParam(pIdx, { type: e.target.value })}
                      className="select"
                      style={{ height: '26px', fontSize: '0.75rem', padding: '2px 6px', width: '90px' }}
                    >
                      <option value="text">text</option>
                      <option value="number">number</option>
                      <option value="boolean">boolean</option>
                      <option value="object">object</option>
                      <option value="list_text">list(text)</option>
                    </select>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.7rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={param.required}
                        onChange={(e) => handleUpdateParam(pIdx, { required: e.target.checked })}
                      />
                      Req
                    </label>
                    <button
                      onClick={() => handleRemoveParam(pIdx)}
                      style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', opacity: 0.6 }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Code Generator Output */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Sparkles size={16} color="var(--accent-emerald)" />
                <span>Generated Plugin Action SDK</span>
              </div>
              <div className="card-subtitle">Ready-to-paste JavaScript/TypeScript for Bubble Plugin Builder</div>
            </div>

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

          {/* Subtabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '2px', borderRadius: 'var(--radius-sm)', marginBottom: '12px' }}>
            <button
              onClick={() => setActiveOutputTab('ssa')}
              className={`btn btn-sm ${activeOutputTab === 'ssa' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '4px 8px', fontSize: '0.75rem' }}
            >
              Server Action (SSA)
            </button>
            <button
              onClick={() => setActiveOutputTab('csa')}
              className={`btn btn-sm ${activeOutputTab === 'csa' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '4px 8px', fontSize: '0.75rem' }}
            >
              Client Action (CSA)
            </button>
            <button
              onClick={() => setActiveOutputTab('types')}
              className={`btn btn-sm ${activeOutputTab === 'types' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '4px 8px', fontSize: '0.75rem' }}
            >
              TypeScript Types
            </button>
            <button
              onClick={() => setActiveOutputTab('package')}
              className={`btn btn-sm ${activeOutputTab === 'package' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '4px 8px', fontSize: '0.75rem' }}
            >
              package.json
            </button>
          </div>

          <pre style={{
            background: 'var(--bg-input)',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            maxHeight: '440px',
            overflowY: 'auto',
            lineHeight: 1.45
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
