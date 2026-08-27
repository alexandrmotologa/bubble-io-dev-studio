import React, { useState } from 'react';
import { 
  Radio, 
  Code2, 
  Play, 
  Copy, 
  Check, 
  Upload, 
  Sparkles, 
  Download, 
  ExternalLink,
  Layers,
  Search,
  Server,
  Plus
} from 'lucide-react';
import { ApiConnectorCallConfig, OpenApiImportResult, ProjectProfile, WebhookLogEntry } from '../types';
import { ApiStudioEngine } from '../core/api-studio/apiStudioEngine';

interface ApiStudioViewProps {
  activeProject?: ProjectProfile;
  onLog: (module: 'api-studio', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

type ApiStudioSubTab = 'webhooks' | 'curl_import' | 'openapi' | 'connector';

export const ApiStudioView: React.FC<ApiStudioViewProps> = ({ activeProject, onLog }) => {
  const [subTab, setSubTab] = useState<ApiStudioSubTab>('webhooks');
  const [webhooks, setWebhooks] = useState<WebhookLogEntry[]>(ApiStudioEngine.getSampleWebhooks());
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookLogEntry | null>(webhooks[0] || null);

  // cURL import state
  const [curlInput, setCurlInput] = useState<string>(
    `curl -X POST https://api.stripe.com/v1/customers \\\n  -H "Authorization: Bearer sk_test_12345" \\\n  -H "Content-Type: application/x-www-form-urlencoded" \\\n  -d "email=customer@example.com&name=Alex+Doe"`
  );
  const [parsedCall, setParsedCall] = useState<ApiConnectorCallConfig | null>(null);
  const [copied, setCopied] = useState(false);

  // OpenAPI import state
  const [openApiResult, setOpenApiResult] = useState<OpenApiImportResult | null>(null);

  const handleParseCurl = () => {
    try {
      const res = ApiStudioEngine.parseCurl(curlInput);
      setParsedCall(res);
      onLog('api-studio', `Successfully parsed cURL request to '${res.method} ${res.url}'`, 'success');
    } catch (e: any) {
      onLog('api-studio', `Failed to parse cURL: ${e.message}`, 'error');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(99, 102, 241, 0.08) 100%)', border: '1px solid var(--border-active)' }}>
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
              <Radio size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Live Webhook & API Connector Studio
              </h1>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Inspect incoming Bubble webhook payloads, test endpoint responses, and import cURL / Swagger into API Connector
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <button onClick={() => setSubTab('webhooks')} className={`btn btn-sm ${subTab === 'webhooks' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
          <Radio size={13} />
          <span>Live Webhooks ({webhooks.length})</span>
        </button>
        <button onClick={() => setSubTab('curl_import')} className={`btn btn-sm ${subTab === 'curl_import' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
          <Code2 size={13} />
          <span>cURL ➔ Bubble Connector</span>
        </button>
      </div>

      {/* SUBTAB 1: LIVE WEBHOOKS */}
      {subTab === 'webhooks' && (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          {/* Webhook Stream */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '12px' }}>
              <span>Incoming Webhook Events Stream</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {webhooks.map(wh => (
                <div
                  key={wh.id}
                  onClick={() => setSelectedWebhook(wh)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: selectedWebhook?.id === wh.id ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-input)',
                    border: selectedWebhook?.id === wh.id ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="badge badge-indigo">{wh.method}</span>
                      <code style={{ fontSize: '0.8rem', fontWeight: 700 }}>{wh.endpoint}</code>
                    </div>
                    <span className="badge badge-emerald">{wh.status} OK</span>
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    {new Date(wh.timestamp).toLocaleTimeString()} • {wh.durationMs}ms latency
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Webhook Inspector */}
          {selectedWebhook && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <span>Event Payload Inspector: <code>{selectedWebhook.endpoint}</code></span>
                  </div>
                  <div className="card-subtitle">{new Date(selectedWebhook.timestamp).toLocaleString()}</div>
                </div>
                <button onClick={() => handleCopy(JSON.stringify(selectedWebhook.bodyJson, null, 2))} className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '0.7rem' }}>
                  {copied ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>REQUEST HEADERS</div>
                <pre style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: '#93c5fd', margin: 0 }}>
                  {JSON.stringify(selectedWebhook.headers, null, 2)}
                </pre>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>REQUEST BODY PAYLOAD</div>
                <pre style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: '#86efac', margin: 0, maxHeight: '240px', overflowY: 'auto' }}>
                  {JSON.stringify(selectedWebhook.bodyJson, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: cURL IMPORTER */}
      {subTab === 'curl_import' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: '10px' }}>
              <span>Paste cURL Command to Convert to Bubble API Connector</span>
            </div>
            <textarea
              value={curlInput}
              onChange={e => setCurlInput(e.target.value)}
              placeholder="curl -X POST https://api.service.com/v1/endpoint -H 'Authorization: Bearer key' -d 'param=value'"
              className="input"
              style={{ height: '110px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', resize: 'vertical' }}
            />
            <button onClick={handleParseCurl} className="btn btn-primary btn-sm" style={{ marginTop: '12px', alignSelf: 'flex-start' }}>
              <Code2 size={14} />
              <span>Parse & Generate Bubble Call</span>
            </button>
          </div>

          {parsedCall && (
            <div className="card" style={{ background: 'var(--bg-card)' }}>
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <span>Generated Bubble API Connector Call</span>
                  </div>
                  <div className="card-subtitle">Method: <strong>{parsedCall.method}</strong> • URL: <code>{parsedCall.url}</code></div>
                </div>
                <button onClick={() => handleCopy(JSON.stringify(parsedCall, null, 2))} className="btn btn-secondary btn-sm">
                  {copied ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy API Connector JSON'}</span>
                </button>
              </div>

              <div className="grid-2">
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>HEADERS ({parsedCall.headers.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {parsedCall.headers.map((h, i) => (
                      <div key={i} style={{ padding: '6px 10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                        <code>{h.key}: {h.isPrivate ? '••••••••' : h.value}</code>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>PARAMETERS / BODY</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {parsedCall.parameters.map((p, i) => (
                      <div key={i} style={{ padding: '6px 10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                        <code>{p.key} = {p.value}</code>
                      </div>
                    ))}
                    {parsedCall.bodyPayload && (
                      <pre style={{ background: 'var(--bg-input)', padding: '8px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: '#f472b6', margin: 0 }}>
                        {parsedCall.bodyPayload}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
