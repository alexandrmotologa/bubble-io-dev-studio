import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Play, 
  Square, 
  Copy, 
  Check, 
  Send, 
  RefreshCw, 
  Trash2, 
  Globe, 
  Clock, 
  ArrowRight,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { ProjectProfile } from '../types';
import { toast } from '../core/toast/toastManager';

export interface CapturedWebhook {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  path: string;
  headers: Record<string, any>;
  queryParams: Record<string, string>;
  rawBody: string;
  body: any;
  clientIp: string;
}

interface LocalWebhookServerPanelProps {
  activeProject?: ProjectProfile;
  onLog?: (module: 'api-studio', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const LocalWebhookServerPanel: React.FC<LocalWebhookServerPanelProps> = ({
  activeProject,
  onLog
}) => {
  const [port, setPort] = useState<number>(4040);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [capturedWebhooks, setCapturedWebhooks] = useState<CapturedWebhook[]>([]);
  const [selectedWebhook, setSelectedWebhook] = useState<CapturedWebhook | null>(null);
  const [forwardEndpoint, setForwardEndpoint] = useState<string>('stripe_webhook');
  const [isForwarding, setIsForwarding] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const electronAPI = typeof window !== 'undefined' ? (window as any).electronAPI : undefined;

  // Active project Bubble Backend Workflow URL
  const bubbleBackendBaseUrl = activeProject
    ? `https://${activeProject.customDomain || `${activeProject.appId}.bubbleapps.io`}/${activeProject.environment || 'version-test'}/api/1.1/wf/`
    : 'https://my-app.bubbleapps.io/version-test/api/1.1/wf/';

  // Check initial server status & subscribe to incoming events
  useEffect(() => {
    if (electronAPI?.getWebhookServerStatus) {
      electronAPI.getWebhookServerStatus().then((status: any) => {
        if (status?.isRunning) {
          setIsRunning(true);
          if (status.port) setPort(status.port);
        }
      }).catch(() => {});
    }

    if (electronAPI?.onWebhookReceived) {
      const unsubscribe = electronAPI.onWebhookReceived((payload: CapturedWebhook) => {
        setCapturedWebhooks(prev => [payload, ...prev.slice(0, 99)]);
        setSelectedWebhook(prev => prev ? prev : payload);
        toast.info(`Received ${payload.method} ${payload.path}`);
        onLog?.('api-studio', `[Local Webhook] Received ${payload.method} on ${payload.path} from ${payload.clientIp}`, 'success');
      });
      return unsubscribe;
    }
  }, [electronAPI]);

  const handleStartServer = async () => {
    if (electronAPI?.startWebhookServer) {
      try {
        const res = await electronAPI.startWebhookServer(port);
        if (res.success) {
          setIsRunning(true);
          toast.success(`Local Webhook server listening on port ${res.port || port}`);
          onLog?.('api-studio', `Started local HTTP webhook listener on http://localhost:${res.port || port}/webhook`, 'success');
        } else {
          toast.error(`Failed to start server: ${res.error}`);
          onLog?.('api-studio', `Failed to start server: ${res.error}`, 'error');
        }
      } catch (err: any) {
        toast.error(`Error: ${err.message}`);
      }
    } else {
      // Browser Mock Mode
      setIsRunning(true);
      toast.success(`Local Webhook simulator active on virtual port ${port}`);
      onLog?.('api-studio', `Web Browser Mode: Virtual Webhook listener simulated on port ${port}`, 'info');
    }
  };

  const handleStopServer = async () => {
    if (electronAPI?.stopWebhookServer) {
      try {
        await electronAPI.stopWebhookServer();
        setIsRunning(false);
        toast.info('Local Webhook server stopped');
        onLog?.('api-studio', 'Stopped local HTTP webhook listener.', 'info');
      } catch (err: any) {
        toast.error(`Error stopping server: ${err.message}`);
      }
    } else {
      setIsRunning(false);
      toast.info('Local Webhook simulator stopped');
    }
  };

  const handleCopy = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Generate Sample Webhook in local server or in-memory
  const handleSendMockWebhook = async (type: 'stripe' | 'sendgrid' | 'whatsapp' | 'shopify') => {
    const payloads = {
      stripe: {
        id: `evt_stripe_${Date.now()}`,
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_3MtwL2LkdIwHu7ix28a3tqPa',
            amount: 4900,
            currency: 'usd',
            customer: 'cus_N62463jK9d',
            status: 'succeeded'
          }
        }
      },
      sendgrid: [
        {
          email: 'customer@buyer.com',
          event: 'delivered',
          sg_message_id: 'sg_msg_98437298347.1',
          timestamp: Math.floor(Date.now() / 1000)
        }
      ],
      whatsapp: {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'WHATSAPP_BUS_ID',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              messages: [{
                from: '447123456789',
                id: `wamid_${Date.now()}`,
                text: { body: 'Hello! I would like to track my order #8492.' }
              }]
            }
          }]
        }]
      },
      shopify: {
        id: 820982911946154500,
        email: 'jon@doe.ca',
        total_price: '199.00',
        currency: 'USD',
        financial_status: 'paid',
        order_number: 1001
      }
    };

    const targetPayload = payloads[type];
    const path = `/${type}_webhook`;

    if (isRunning && typeof window !== 'undefined') {
      try {
        await fetch(`http://localhost:${port}${path}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': `${type.charAt(0).toUpperCase() + type.slice(1)}-Webhook-Dispatcher/1.0`
          },
          body: JSON.stringify(targetPayload)
        });
        toast.success(`Dispatched sample ${type} webhook to http://localhost:${port}${path}`);
      } catch {
        // Fallback simulate directly in state
        const simulated: CapturedWebhook = {
          id: `whk_${Date.now()}`,
          timestamp: new Date().toISOString(),
          method: 'POST',
          url: path,
          path,
          headers: {
            'content-type': 'application/json',
            'user-agent': `${type}-webhook-simulator/1.0`,
            'host': `localhost:${port}`
          },
          queryParams: {},
          rawBody: JSON.stringify(targetPayload, null, 2),
          body: targetPayload,
          clientIp: '127.0.0.1'
        };
        setCapturedWebhooks(prev => [simulated, ...prev]);
        setSelectedWebhook(simulated);
        toast.success(`Simulated ${type} webhook captured`);
      }
    } else {
      toast.warn('Please start the local server first to capture incoming webhooks.');
    }
  };

  // Re-dispatch / Forward to Bubble Backend Workflow
  const handleForwardToBubble = async () => {
    if (!selectedWebhook) return;
    setIsForwarding(true);
    const targetUrl = `${bubbleBackendBaseUrl}${forwardEndpoint.trim()}`;

    try {
      const response = await fetch(targetUrl, {
        method: selectedWebhook.method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: typeof selectedWebhook.body === 'object' ? JSON.stringify(selectedWebhook.body) : selectedWebhook.rawBody
      });

      if (response.ok) {
        toast.success(`Forwarded to Bubble: HTTP ${response.status} OK`);
        onLog?.('api-studio', `Forwarded captured webhook ${selectedWebhook.id} to ${targetUrl}`, 'success');
      } else {
        toast.warn(`Bubble response: HTTP ${response.status} ${response.statusText}`);
        onLog?.('api-studio', `Forward response from ${targetUrl}: HTTP ${response.status}`, 'warn');
      }
    } catch (err: any) {
      toast.error(`Forwarding failed: ${err.message}`);
      onLog?.('api-studio', `Forwarding error to ${targetUrl}: ${err.message}`, 'error');
    } finally {
      setIsForwarding(false);
    }
  };

  const curlCommand = `curl -X POST http://localhost:${port}/webhook \\\n  -H "Content-Type: application/json" \\\n  -d '{"event":"payment_intent.succeeded","amount":4900,"currency":"usd"}'`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Control Banner Card */}
      <div className="card" style={{
        background: isRunning 
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.06) 100%)' 
          : 'var(--bg-card)',
        border: isRunning ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: isRunning ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' : 'var(--bg-input)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isRunning ? '#ffffff' : 'var(--text-muted)'
            }}>
              <Server size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Local Webhook Mock Server & Payload Inspector
                </h2>
                <span className={`badge ${isRunning ? 'badge-emerald' : 'badge-indigo'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isRunning ? '#10b981' : '#64748b' }} />
                  {isRunning ? `LISTENING ON PORT ${port}` : 'SERVER STOPPED'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Receive live HTTP webhooks from Stripe, SendGrid, WhatsApp, or cURL without configuring external tunnels
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Port:</span>
              <input
                type="number"
                value={port}
                onChange={e => setPort(Number(e.target.value))}
                disabled={isRunning}
                className="input"
                style={{ width: '75px', height: '32px', fontSize: '0.8rem', padding: '2px 8px' }}
              />
            </div>

            {!isRunning ? (
              <button onClick={handleStartServer} className="btn btn-primary btn-sm" style={{ background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' }}>
                <Play size={14} />
                <span>Start Server</span>
              </button>
            ) : (
              <button onClick={handleStopServer} className="btn btn-secondary btn-sm" style={{ color: 'var(--accent-rose)' }}>
                <Square size={14} />
                <span>Stop Server</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Endpoint & cURL Snippet Bar */}
        {isRunning && (
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                <Globe size={14} color="var(--accent-cyan)" />
                <span style={{ color: 'var(--text-muted)' }}>Local Webhook URL:</span>
                <code style={{ background: 'var(--bg-input)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', color: 'var(--accent-cyan)' }}>
                  http://localhost:{port}/webhook
                </code>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleCopy(`http://localhost:${port}/webhook`, 'url', 'Webhook URL')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                >
                  {copiedIndex === 'url' ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                  <span>Copy URL</span>
                </button>
                <button
                  onClick={() => handleCopy(curlCommand, 'curl', 'cURL command')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                >
                  {copiedIndex === 'curl' ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                  <span>Copy cURL Test</span>
                </button>
              </div>
            </div>

            {/* 1-Click Mock Preset Triggers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={12} color="var(--primary)" /> 1-Click Test Payloads:
              </span>
              <button onClick={() => handleSendMockWebhook('stripe')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                💳 Stripe Payment
              </button>
              <button onClick={() => handleSendMockWebhook('sendgrid')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                📧 SendGrid Event
              </button>
              <button onClick={() => handleSendMockWebhook('whatsapp')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                💬 WhatsApp Inbound
              </button>
              <button onClick={() => handleSendMockWebhook('shopify')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                🛍️ Shopify Order
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Split View: Incoming Webhooks List & Live Inspector */}
      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        {/* Left Column: Received Webhook Stream */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Captured Inbound Requests ({capturedWebhooks.length})
            </div>
            {capturedWebhooks.length > 0 && (
              <button
                onClick={() => { setCapturedWebhooks([]); setSelectedWebhook(null); toast.info('Cleared webhook log'); }}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}
              >
                <Trash2 size={12} />
                <span>Clear All</span>
              </button>
            )}
          </div>

          <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
            {capturedWebhooks.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Clock size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Waiting for incoming webhooks...</div>
                <p style={{ fontSize: '0.75rem', margin: '4px 0 0', lineHeight: 1.5 }}>
                  {isRunning 
                    ? `Send a POST request to http://localhost:${port}/webhook or click one of the preset buttons above.` 
                    : 'Start the server above to begin listening.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {capturedWebhooks.map(whk => {
                  const isSelected = selectedWebhook?.id === whk.id;
                  return (
                    <div
                      key={whk.id}
                      onClick={() => setSelectedWebhook(whk)}
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: isSelected ? 'var(--bg-input)' : 'transparent',
                        borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="badge badge-indigo" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                            {whk.method}
                          </span>
                          <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                            {whk.path}
                          </strong>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(whk.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        <span>IP: {whk.clientIp}</span>
                        <span>Size: ~{Math.max(1, Math.round(whk.rawBody.length / 1024))} KB</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Payload & Headers Inspector */}
        <div className="card" style={{ padding: '16px' }}>
          {selectedWebhook ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Payload & Headers Inspector
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ID: <code>{selectedWebhook.id}</code> • {new Date(selectedWebhook.timestamp).toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(JSON.stringify(selectedWebhook.body || selectedWebhook.rawBody, null, 2), 'body', 'JSON Payload')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  {copiedIndex === 'body' ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                  <span>Copy Payload</span>
                </button>
              </div>

              {/* Forward to Bubble Bar */}
              <div style={{ padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  RE-DISPATCH TO BUBBLE BACKEND WORKFLOW:
                </span>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {bubbleBackendBaseUrl}
                  </span>
                  <input
                    type="text"
                    value={forwardEndpoint}
                    onChange={e => setForwardEndpoint(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                    placeholder="endpoint_name"
                    className="input"
                    style={{ height: '28px', fontSize: '0.75rem', width: '130px', padding: '2px 6px' }}
                  />
                  <button
                    onClick={handleForwardToBubble}
                    disabled={isForwarding}
                    className="btn btn-primary btn-sm"
                    style={{ height: '28px', padding: '0 10px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                  >
                    <Send size={11} />
                    <span>{isForwarding ? 'Forwarding...' : 'Forward'}</span>
                  </button>
                </div>
              </div>

              {/* Formatted JSON Body */}
              <div>
                <label className="input-label" style={{ marginBottom: '4px' }}>Parsed Request Body (JSON)</label>
                <pre style={{
                  background: 'var(--bg-input)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  color: '#67e8f9',
                  maxHeight: '260px',
                  overflowY: 'auto'
                }}>
                  {typeof selectedWebhook.body === 'object' 
                    ? JSON.stringify(selectedWebhook.body, null, 2) 
                    : selectedWebhook.rawBody || '(Empty body)'}
                </pre>
              </div>

              {/* Request Headers Viewer */}
              <div>
                <label className="input-label" style={{ marginBottom: '4px' }}>HTTP Request Headers</label>
                <div style={{
                  background: 'var(--bg-input)',
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  maxHeight: '140px',
                  overflowY: 'auto',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {Object.entries(selectedWebhook.headers).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: '8px', marginBottom: '3px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{k}:</span>
                      <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Globe size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>No Webhook Selected</div>
              <p style={{ fontSize: '0.8rem', margin: '4px 0 0' }}>
                Select an inbound request from the left list to inspect headers, JSON payload, and forward to Bubble.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
