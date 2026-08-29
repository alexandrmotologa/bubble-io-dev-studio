import React, { useState, useMemo, useEffect } from 'react';
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
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileJson,
  FileCode,
  Globe,
  Settings2,
  Tag,
  ArrowRight,
  Filter,
  Eye,
  CheckSquare,
  Square,
  FileUp,
  Sliders,
  Send
} from 'lucide-react';
import { ApiConnectorCallConfig, ApiConnectorHeader, ApiConnectorParameter, OpenApiEndpoint, OpenApiImportResult, ProjectProfile, WebhookLogEntry } from '../types';
import { ApiStudioEngine, WebhookPreset, SchemaValidationResult } from '../core/api-studio/apiStudioEngine';
import { PluginSdkGenerator } from '../components/PluginSdkGenerator';
import { toast } from '../core/toast/toastManager';

interface ApiStudioViewProps {
  activeProject?: ProjectProfile;
  onLog: (module: 'api-studio', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

type ApiStudioSubTab = 'webhooks' | 'curl_import' | 'openapi' | 'connector' | 'plugin_sdk';

// Sample OpenAPI 3.0 Specification Preset for rapid testing
const SAMPLE_OPENAPI_SPEC = {
  openapi: '3.0.3',
  info: {
    title: 'Bubble Workspace Integration API',
    version: '2.6.0',
    description: 'RESTful API for external webhook handling, user synchronization, and payment processing.'
  },
  servers: [{ url: 'https://api.bubbleapps.io/version-test' }],
  paths: {
    '/api/1.1/wf/stripe_webhook': {
      post: {
        tags: ['Payments & Webhooks'],
        summary: 'Handle Stripe Payment Webhook',
        description: 'Processes incoming Stripe payment_intent and customer subscription events.',
        parameters: [
          { name: 'Stripe-Signature', in: 'header', required: true, schema: { type: 'string' }, example: 't=1709123456,v1=9843729' }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id', 'type', 'data'],
                properties: {
                  id: { type: 'string', example: 'evt_stripe_12345' },
                  type: { type: 'string', example: 'payment_intent.succeeded' },
                  data: { type: 'object' }
                }
              },
              example: {
                id: 'evt_stripe_12345',
                type: 'payment_intent.succeeded',
                data: { object: { amount: 4900, currency: 'usd', status: 'succeeded' } }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Webhook acknowledged' }
        }
      }
    },
    '/api/1.1/obj/user': {
      get: {
        tags: ['Data API'],
        summary: 'Query Users List',
        description: 'Retrieves paginated user database entries from Bubble Data API.',
        parameters: [
          { name: 'cursor', in: 'query', required: false, schema: { type: 'number' }, example: '0' },
          { name: 'limit', in: 'query', required: false, schema: { type: 'number' }, example: '50' },
          { name: 'constraints', in: 'query', required: false, schema: { type: 'string' }, example: '[{"key":"status","constraint_type":"equals","value":"active"}]' }
        ],
        responses: {
          '200': { description: 'Paginated user results' }
        }
      },
      post: {
        tags: ['Data API'],
        summary: 'Create User Record',
        description: 'Creates a new user record in the Bubble Data API.',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'role'],
                properties: {
                  email: { type: 'string', example: 'alex@example.com' },
                  role: { type: 'string', example: 'Developer' },
                  name: { type: 'string', example: 'Alex Motologa' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'User created' }
        }
      }
    },
    '/api/1.1/wf/send_notification': {
      post: {
        tags: ['Workflows'],
        summary: 'Trigger Notification Workflow',
        description: 'Triggers backend email or push notification workflow.',
        parameters: [
          { name: 'channel', in: 'query', required: true, schema: { type: 'string' }, example: 'email' }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['recipient', 'subject', 'message'],
                properties: {
                  recipient: { type: 'string', example: 'team@bubbleapp.io' },
                  subject: { type: 'string', example: 'New Workspace Deployment' },
                  message: { type: 'string', example: 'Version v2.6.0-beta was deployed successfully.' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Notification queued' }
        }
      }
    }
  }
};

export const ApiStudioView: React.FC<ApiStudioViewProps> = ({ activeProject, onLog }) => {
  const [subTab, setSubTab] = useState<ApiStudioSubTab>('webhooks');
  const [copied, setCopied] = useState(false);

  // Active Workspace Listener URL
  const activeListenerUrl = useMemo(() => {
    if (activeProject) {
      const domain = activeProject.customDomain || `${activeProject.appId}.bubbleapps.io`;
      const env = activeProject.environment || 'version-test';
      return `https://${domain}/${env}/api/1.1/wf/`;
    }
    return 'https://your-app.bubbleapps.io/version-test/api/1.1/wf/';
  }, [activeProject]);

  // ==========================================================================
  // 1. WEBHOOKS STATE & LOGIC
  // ==========================================================================
  const webhookPresets = useMemo(() => ApiStudioEngine.getWebhookPresets(), []);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('stripe_payment_succeeded');
  const [testEndpoint, setTestEndpoint] = useState<string>('stripe_payment_webhook');
  const [testMethod, setTestMethod] = useState<'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE'>('POST');
  const [testPayload, setTestPayload] = useState<string>(() => {
    return JSON.stringify(webhookPresets[0]?.payload || { event: 'sample' }, null, 2);
  });
  const [testStatusCode, setTestStatusCode] = useState<number>(200);
  const [isSimulating, setIsSimulating] = useState(false);
  const [webhookSearch, setWebhookSearch] = useState('');
  const [webhooks, setWebhooks] = useState<WebhookLogEntry[]>(() => {
    const initialLog = ApiStudioEngine.generateWebhookLog(
      '/api/1.1/wf/stripe_payment_webhook',
      webhookPresets[0].payload,
      { received: true, status: 'processed', order_id: 'ord_998124' },
      200,
      42,
      'Stripe-WebhookListener'
    );
    return [initialLog];
  });
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookLogEntry | null>(() => webhooks[0] || null);

  const handleApplyWebhookPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const p = webhookPresets.find(item => item.id === presetId);
    if (!p) return;
    setTestEndpoint(p.endpoint);
    setTestMethod(p.method);
    setTestPayload(JSON.stringify(p.payload, null, 2));
    setTestStatusCode(p.defaultStatus);
    toast.info(`Loaded webhook preset: ${p.name}`);
  };

  const handleTriggerTestWebhook = async (overridePayload?: any, overrideEndpoint?: string, overrideStatus?: number) => {
    setIsSimulating(true);
    const endpointToUse = overrideEndpoint || testEndpoint;
    const statusToUse = overrideStatus !== undefined ? overrideStatus : testStatusCode;
    
    onLog('api-studio', `Dispatching test webhook [${testMethod}] to '/api/1.1/wf/${endpointToUse}' with expected status ${statusToUse}...`);
    
    // Simulate real network latency (between 18ms and 75ms)
    const simulatedLatency = Math.floor(Math.random() * 57) + 18;
    await new Promise(r => setTimeout(r, 150));

    try {
      let parsedBody = {};
      try {
        parsedBody = overridePayload || JSON.parse(testPayload);
      } catch {
        parsedBody = { raw: testPayload };
      }

      const responseBody = statusToUse >= 400 
        ? { error: statusToUse === 400 ? 'Bad Request' : statusToUse === 401 ? 'Unauthorized' : 'Internal Server Error', code: statusToUse }
        : { status: 'success', received: true, timestamp: Date.now() };

      const log = ApiStudioEngine.generateWebhookLog(
        `/api/1.1/wf/${endpointToUse}`,
        parsedBody,
        responseBody,
        statusToUse,
        simulatedLatency,
        activeProject?.name ? `${activeProject.name}-Client` : 'dev-studio'
      );

      setWebhooks(prev => [log, ...prev]);
      setSelectedWebhook(log);
      onLog('api-studio', `Recorded webhook event for '/api/1.1/wf/${endpointToUse}' (Status ${statusToUse} • ${simulatedLatency}ms)`, statusToUse >= 400 ? 'warn' : 'success');
      toast.success(`Webhook dispatched: Status ${statusToUse} (${simulatedLatency}ms)`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReplayWebhook = (wh: WebhookLogEntry) => {
    const cleanEp = wh.endpoint.replace(/^\/api\/1\.1\/wf\//, '').replace(/^\//, '');
    setTestEndpoint(cleanEp);
    setTestPayload(JSON.stringify(wh.bodyJson, null, 2));
    setTestStatusCode(wh.status);
    handleTriggerTestWebhook(wh.bodyJson, cleanEp, wh.status);
    onLog('api-studio', `Replayed webhook '${wh.id}' to endpoint '${wh.endpoint}'`, 'info');
  };

  const filteredWebhooks = useMemo(() => {
    if (!webhookSearch.trim()) return webhooks;
    const q = webhookSearch.toLowerCase();
    return webhooks.filter(wh => 
      wh.endpoint.toLowerCase().includes(q) ||
      wh.method.toLowerCase().includes(q) ||
      wh.status.toString().includes(q) ||
      JSON.stringify(wh.bodyJson).toLowerCase().includes(q)
    );
  }, [webhooks, webhookSearch]);

  const handleExportWebhooksJson = () => {
    const dataStr = JSON.stringify(webhooks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bubble_webhooks_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${webhooks.length} webhook events`);
  };

  // ==========================================================================
  // 2. cURL IMPORTER STATE & LOGIC
  // ==========================================================================
  const [curlInput, setCurlInput] = useState<string>(() => {
    if (activeProject) {
      const domain = activeProject.customDomain || `${activeProject.appId}.bubbleapps.io`;
      const env = activeProject.environment || 'version-test';
      return `curl -X POST https://${domain}/${env}/api/1.1/wf/trigger_event \\\n  -H "Authorization: Bearer ${activeProject.apiToken || 'YOUR_PRIVATE_TOKEN'}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"event": "workspace_event", "appId": "${activeProject.appId}"}'`;
    }
    return `curl -X POST https://api.stripe.com/v1/payment_intents \\\n  -H "Authorization: Bearer sk_test_51Mz..." \\\n  -H "Content-Type: application/json" \\\n  -d '{"amount": 2000, "currency": "usd", "customer": "cus_991823"}'`;
  });
  const [parsedCall, setParsedCall] = useState<ApiConnectorCallConfig | null>(() => {
    try {
      return ApiStudioEngine.parseCurl(curlInput);
    } catch {
      return null;
    }
  });

  const handleParseCurl = () => {
    try {
      const res = ApiStudioEngine.parseCurl(curlInput);
      setParsedCall(res);
      toast.success(`Parsed cURL: ${res.method} ${res.url}`);
      onLog('api-studio', `Successfully parsed cURL request to '${res.method} ${res.url}'`, 'success');
    } catch (e: any) {
      toast.error(e.message);
      onLog('api-studio', `Failed to parse cURL: ${e.message}`, 'error');
    }
  };

  const handleUpdateHeader = (idx: number, updates: Partial<ApiConnectorHeader>) => {
    if (!parsedCall) return;
    const newHeaders = parsedCall.headers.map((h, i) => i === idx ? { ...h, ...updates } : h);
    setParsedCall({ ...parsedCall, headers: newHeaders });
  };

  const handleAddHeader = () => {
    if (!parsedCall) return;
    setParsedCall({
      ...parsedCall,
      headers: [...parsedCall.headers, { key: 'X-Custom-Header', value: 'value', isPrivate: false }]
    });
  };

  const handleRemoveHeader = (idx: number) => {
    if (!parsedCall) return;
    setParsedCall({
      ...parsedCall,
      headers: parsedCall.headers.filter((_, i) => i !== idx)
    });
  };

  const handleUpdateParameter = (idx: number, updates: Partial<ApiConnectorParameter>) => {
    if (!parsedCall) return;
    const newParams = parsedCall.parameters.map((p, i) => i === idx ? { ...p, ...updates } : p);
    setParsedCall({ ...parsedCall, parameters: newParams });
  };

  const handleAddParameter = () => {
    if (!parsedCall) return;
    setParsedCall({
      ...parsedCall,
      parameters: [...parsedCall.parameters, { key: `param_${parsedCall.parameters.length + 1}`, value: 'val', isPrivate: false, isOptional: true, isQuerystring: true }]
    });
  };

  const handleRemoveParameter = (idx: number) => {
    if (!parsedCall) return;
    setParsedCall({
      ...parsedCall,
      parameters: parsedCall.parameters.filter((_, i) => i !== idx)
    });
  };

  // ==========================================================================
  // 3. OPENAPI 3.0 / SWAGGER STATE & LOGIC
  // ==========================================================================
  const [openApiSpecText, setOpenApiSpecText] = useState<string>(() => JSON.stringify(SAMPLE_OPENAPI_SPEC, null, 2));
  const [openApiResult, setOpenApiResult] = useState<OpenApiImportResult | null>(() => {
    try {
      return ApiStudioEngine.parseOpenApi(SAMPLE_OPENAPI_SPEC);
    } catch {
      return null;
    }
  });
  const [openApiSearch, setOpenApiSearch] = useState<string>('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('ALL');

  const handleParseOpenApiSpec = (rawSpec?: string) => {
    const textToParse = rawSpec || openApiSpecText;
    try {
      const res = ApiStudioEngine.parseOpenApi(textToParse);
      setOpenApiResult(res);
      toast.success(`Parsed OpenAPI: ${res.apiTitle} (${res.callsCount} calls)`);
      onLog('api-studio', `Parsed OpenAPI 3.0 specification: '${res.apiTitle}' with ${res.callsCount} endpoints.`, 'success');
    } catch (err: any) {
      toast.error(`OpenAPI Parse Error: ${err.message}`);
      onLog('api-studio', `OpenAPI Parsing error: ${err.message}`, 'error');
    }
  };

  const handleToggleEndpointSelect = (epId: string) => {
    if (!openApiResult) return;
    const updated = openApiResult.endpoints.map(ep => ep.id === epId ? { ...ep, selected: !ep.selected } : ep);
    setOpenApiResult({ ...openApiResult, endpoints: updated });
  };

  const handleSelectAllEndpoints = (select: boolean) => {
    if (!openApiResult) return;
    const updated = openApiResult.endpoints.map(ep => ({ ...ep, selected: select }));
    setOpenApiResult({ ...openApiResult, endpoints: updated });
  };

  const handleExportSelectedToConnector = () => {
    if (!openApiResult) return;
    const selected = openApiResult.endpoints.filter(ep => ep.selected);
    if (selected.length === 0) {
      toast.warn('No endpoints selected for export.');
      return;
    }

    const exportPayload = {
      apiTitle: openApiResult.apiTitle,
      version: openApiResult.version,
      baseUrl: openApiResult.baseUrl,
      callsCount: selected.length,
      calls: selected.map(ep => ep.callConfig)
    };

    const dataStr = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${openApiResult.apiTitle.replace(/[^a-zA-Z0-9_]/g, '_')}_BubbleConnector.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selected.length} calls to Bubble API Connector JSON`);
    onLog('api-studio', `Exported ${selected.length} API calls in Bubble Connector schema.`, 'success');
  };

  const handleSendToConnectorScaffolder = (call: ApiConnectorCallConfig) => {
    setParsedCall(call);
    setSubTab('connector');
    toast.info(`Loaded '${call.name}' into Connector Scaffolder`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setOpenApiSpecText(content);
      handleParseOpenApiSpec(content);
    };
    reader.readAsText(file);
  };

  const filteredEndpoints = useMemo(() => {
    if (!openApiResult) return [];
    let list = openApiResult.endpoints;
    if (selectedTagFilter !== 'ALL') {
      list = list.filter(ep => ep.tags.includes(selectedTagFilter));
    }
    if (openApiSearch.trim()) {
      const q = openApiSearch.toLowerCase();
      list = list.filter(ep => 
        ep.path.toLowerCase().includes(q) ||
        ep.summary.toLowerCase().includes(q) ||
        ep.method.toLowerCase().includes(q)
      );
    }
    return list;
  }, [openApiResult, selectedTagFilter, openApiSearch]);

  // ==========================================================================
  // 4. API CONNECTOR & JSON SCHEMA SCAFFOLDER STATE & LOGIC
  // ==========================================================================
  const [activeConnectorCall, setActiveConnectorCall] = useState<ApiConnectorCallConfig>(() => {
    return parsedCall || {
      id: 'call_default',
      name: 'Stripe Create Customer',
      url: 'https://api.stripe.com/v1/customers',
      method: 'POST',
      useAs: 'action',
      dataCategory: 'json',
      headers: [
        { key: 'Content-Type', value: 'application/json', isPrivate: false },
        { key: 'Authorization', value: 'Bearer sk_test_...', isPrivate: true }
      ],
      parameters: [
        { key: 'email', value: 'customer@buyer.com', isPrivate: false, isOptional: false, isQuerystring: false, isClientSafe: true },
        { key: 'name', value: 'Alex Motologa', isPrivate: false, isOptional: true, isQuerystring: false, isClientSafe: true }
      ],
      bodyType: 'json',
      bodyPayload: '{\n  "email": "customer@buyer.com",\n  "name": "Alex Motologa",\n  "balance": 0\n}'
    };
  });

  const [schemaPayloadInput, setSchemaPayloadInput] = useState<string>(activeConnectorCall.bodyPayload || '{\n  "status": "success",\n  "user_id": "usr_991823",\n  "active": true\n}');
  const [schemaValidation, setSchemaValidation] = useState<SchemaValidationResult>(() => {
    return ApiStudioEngine.validateJsonSchema(null, schemaPayloadInput);
  });
  const [codeOutputTab, setCodeOutputTab] = useState<'client' | 'server' | 'curl' | 'bubble_json'>('client');

  const generatedSnippets = useMemo(() => {
    return ApiStudioEngine.generateBubbleCodeSnippets(activeConnectorCall);
  }, [activeConnectorCall]);

  const handleValidateSchema = () => {
    const res = ApiStudioEngine.validateJsonSchema(null, schemaPayloadInput);
    setSchemaValidation(res);
    if (res.valid) {
      toast.success(res.summary);
      onLog('api-studio', `JSON Schema validation passed: ${res.summary}`, 'success');
    } else {
      toast.error(res.summary);
      onLog('api-studio', `JSON Schema validation failed: ${res.errors.join(', ')}`, 'error');
    }
  };

  const handleCopy = (text: string, label: string = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(label);
    setTimeout(() => setCopied(false), 2000);
  };

  // Sync parsedCall to activeConnectorCall when switching or parsing
  useEffect(() => {
    if (parsedCall) {
      setActiveConnectorCall(parsedCall);
      setSchemaPayloadInput(parsedCall.bodyPayload || '{\n  "status": "success"\n}');
    }
  }, [parsedCall]);

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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Webhooks & API Studio
                </h1>
                <span className="badge badge-indigo">v2.6.0-beta</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Inspect live webhook payloads, parse complex cURL commands, import OpenAPI 3.0 & Swagger specs, and scaffold Bubble Plugin Actions for <strong>{activeProject?.name || 'Active Workspace'}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="badge badge-cyan" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              <Server size={13} />
              <span>Target: <strong>{activeProject?.environment || 'version-test'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtab Navigation - 5 Full Subtabs */}
      <div style={{
        display: 'flex',
        gap: '6px',
        background: 'var(--bg-input)',
        padding: '4px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setSubTab('webhooks')}
          className={`btn btn-sm ${subTab === 'webhooks' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: 'none', whiteSpace: 'nowrap' }}
        >
          <Radio size={13} />
          <span>Live Webhooks & Replay ({webhooks.length})</span>
        </button>
        <button
          onClick={() => setSubTab('curl_import')}
          className={`btn btn-sm ${subTab === 'curl_import' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: 'none', whiteSpace: 'nowrap' }}
        >
          <Code2 size={13} />
          <span>cURL ➔ Bubble Connector</span>
        </button>
        <button
          onClick={() => setSubTab('openapi')}
          className={`btn btn-sm ${subTab === 'openapi' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: 'none', whiteSpace: 'nowrap' }}
        >
          <Globe size={13} />
          <span>Swagger / OpenAPI 3.0 Importer</span>
        </button>
        <button
          onClick={() => setSubTab('connector')}
          className={`btn btn-sm ${subTab === 'connector' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: 'none', whiteSpace: 'nowrap' }}
        >
          <Layers size={13} />
          <span>API Connector Scaffolder & Validator</span>
        </button>
        <button
          onClick={() => setSubTab('plugin_sdk')}
          className={`btn btn-sm ${subTab === 'plugin_sdk' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: 'none', whiteSpace: 'nowrap' }}
        >
          <Sparkles size={13} />
          <span>Plugin Action SDK Builder</span>
        </button>
      </div>

      {/* =====================================================================
          SUBTAB 1: LIVE WEBHOOKS, SIMULATOR & REPLAY
          ===================================================================== */}
      {subTab === 'webhooks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Dispatcher Control Card */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '12px' }}>
              <div>
                <div className="card-title">
                  <Play size={16} color="var(--accent-cyan)" />
                  <span>Webhook Dispatcher & Simulator</span>
                </div>
                <div className="card-subtitle">
                  Send simulated HTTP events to Bubble Backend Workflows with instant replay & custom status codes
                </div>
              </div>

              {/* Preset Loader */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Mock Preset:</span>
                <div className="select-wrapper-premium">
                  <select
                    value={selectedPresetId}
                    onChange={(e) => handleApplyWebhookPreset(e.target.value)}
                    className="select-premium"
                    style={{ fontSize: '0.75rem', padding: '5px 28px 5px 10px' }}
                  >
                    {webhookPresets.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Endpoint Target Bar */}
              <div className="webhook-dispatcher-bar">
                <select
                  value={testMethod}
                  onChange={(e: any) => setTestMethod(e.target.value)}
                  className="select"
                  style={{ width: '85px', height: '32px', fontSize: '0.75rem', padding: '2px 6px' }}
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>

                <div className="webhook-endpoint-input-wrapper">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {activeListenerUrl}
                  </span>
                  <input
                    type="text"
                    value={testEndpoint}
                    onChange={e => setTestEndpoint(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                    placeholder="endpoint_name"
                    className="input"
                    style={{ height: '32px', fontSize: '0.8rem', padding: '2px 8px', flex: 1, minWidth: '120px' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status:</span>
                  <select
                    value={testStatusCode}
                    onChange={e => setTestStatusCode(Number(e.target.value))}
                    className="select"
                    style={{ width: '130px', height: '32px', fontSize: '0.75rem', padding: '2px 6px' }}
                  >
                    <option value={200}>200 OK</option>
                    <option value={201}>201 Created</option>
                    <option value={204}>204 No Content</option>
                    <option value={400}>400 Bad Request</option>
                    <option value={401}>401 Unauthorized</option>
                    <option value={403}>403 Forbidden</option>
                    <option value={404}>404 Not Found</option>
                    <option value={422}>422 Unprocessable</option>
                    <option value={500}>500 Server Error</option>
                    <option value={503}>503 Unavailable</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => handleTriggerTestWebhook()}
                  disabled={isSimulating}
                  className="btn btn-primary btn-sm"
                  style={{ height: '32px', padding: '0 14px' }}
                >
                  <Send size={13} />
                  <span>{isSimulating ? 'Sending...' : 'Dispatch Webhook'}</span>
                </button>
              </div>

              {/* Payload Editor */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="input-label" style={{ margin: 0 }}>Request Body Payload (JSON)</label>
                  <button
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(testPayload);
                        setTestPayload(JSON.stringify(parsed, null, 2));
                        toast.info('Formatted JSON payload');
                      } catch {
                        toast.error('Invalid JSON');
                      }
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.7rem', padding: '2px 8px', height: '22px' }}
                  >
                    Format JSON
                  </button>
                </div>
                <textarea
                  value={testPayload}
                  onChange={e => setTestPayload(e.target.value)}
                  className="input"
                  style={{
                    height: '110px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.775rem',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Webhook History & Inspector Grid */}
          <div className="grid-2" style={{ alignItems: 'start' }}>
            {/* Stream Column */}
            <div className="card">
              <div className="card-header" style={{ marginBottom: '10px' }}>
                <div className="card-title">
                  <Clock size={16} color="var(--primary)" />
                  <span>Webhook Event Stream ({filteredWebhooks.length})</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={handleExportWebhooksJson} className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '0.7rem' }}>
                    <Download size={11} />
                    <span>Export JSON</span>
                  </button>
                  <button onClick={() => setWebhooks([])} className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '0.7rem' }}>
                    <Trash2 size={11} color="var(--accent-rose)" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="search-wrapper-premium" style={{ marginBottom: '10px' }}>
                <Search size={14} className="search-icon-premium" />
                <input
                  type="text"
                  value={webhookSearch}
                  onChange={e => setWebhookSearch(e.target.value)}
                  placeholder="Filter events by endpoint, status, or payload..."
                  className="search-input-premium"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                {filteredWebhooks.map(wh => {
                  const isSelected = selectedWebhook?.id === wh.id;
                  const isError = wh.status >= 400;

                  return (
                    <div
                      key={wh.id}
                      onClick={() => setSelectedWebhook(wh)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-input)',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                          <span className={`badge ${wh.method === 'POST' ? 'badge-indigo' : 'badge-cyan'}`} style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                            {wh.method}
                          </span>
                          <code style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {wh.endpoint}
                          </code>
                        </div>
                        <span className={`badge ${isError ? 'badge-rose' : 'badge-emerald'}`} style={{ fontSize: '0.7rem' }}>
                          {wh.status} {wh.statusText || 'OK'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        <span>{new Date(wh.timestamp).toLocaleTimeString()} • Origin: {wh.origin || 'client'}</span>
                        <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{wh.durationMs}ms</span>
                      </div>
                    </div>
                  );
                })}

                {filteredWebhooks.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    No webhook events match your filter criteria.
                  </div>
                )}
              </div>
            </div>

            {/* Selected Webhook Inspector & Replay Action */}
            {selectedWebhook ? (
              <div className="card">
                <div className="card-header" style={{ marginBottom: '12px' }}>
                  <div>
                    <div className="card-title">
                      <span>Event Inspector: <code>{selectedWebhook.endpoint}</code></span>
                    </div>
                    <div className="card-subtitle">
                      {new Date(selectedWebhook.timestamp).toLocaleString()} • Latency: <strong>{selectedWebhook.durationMs}ms</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleReplayWebhook(selectedWebhook)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '4px 10px' }}
                    >
                      <RefreshCw size={11} />
                      <span>Replay Event</span>
                    </button>
                    <button
                      onClick={() => handleCopy(JSON.stringify(selectedWebhook.bodyJson, null, 2), 'Copied webhook JSON')}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                    >
                      {copied ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Status & Headers */}
                  <div>
                    <div style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>REQUEST HEADERS</div>
                    <pre style={{ background: 'var(--bg-input)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.725rem', color: '#93c5fd', margin: 0, overflowX: 'auto' }}>
                      {JSON.stringify(selectedWebhook.headers, null, 2)}
                    </pre>
                  </div>

                  {/* Body Payload */}
                  <div>
                    <div style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>PAYLOAD BODY (JSON)</div>
                    <pre style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: '#86efac', margin: 0, maxHeight: '200px', overflowY: 'auto' }}>
                      {JSON.stringify(selectedWebhook.bodyJson, null, 2)}
                    </pre>
                  </div>

                  {/* Response Body */}
                  <div>
                    <div style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>SIMULATED BUBBLE WORKFLOW RESPONSE</div>
                    <pre style={{ background: 'var(--bg-input)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.725rem', color: '#fcd34d', margin: 0 }}>
                      {JSON.stringify(selectedWebhook.responseBody, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Select a webhook from the left stream to inspect headers, JSON payload, and replay the event.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBTAB 2: cURL TO BUBBLE CONNECTOR SCAFFOLDER
          ===================================================================== */}
      {subTab === 'curl_import' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div className="card-header" style={{ marginBottom: '10px' }}>
              <div>
                <div className="card-title">
                  <Code2 size={16} color="var(--primary)" />
                  <span>cURL Command to Bubble API Connector Parser</span>
                </div>
                <div className="card-subtitle">
                  Paste raw cURL commands from Stripe, Twilio, OpenAI, or any API documentation
                </div>
              </div>
              <button onClick={handleParseCurl} className="btn btn-primary btn-sm">
                <Code2 size={14} />
                <span>Parse cURL</span>
              </button>
            </div>

            <textarea
              value={curlInput}
              onChange={e => setCurlInput(e.target.value)}
              placeholder="curl -X POST https://api.service.com/v1/endpoint -H 'Authorization: Bearer key' -d 'param=value'"
              className="input"
              style={{ height: '110px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', resize: 'vertical' }}
            />
          </div>

          {parsedCall && (
            <div className="card" style={{ background: 'var(--bg-card)' }}>
              <div className="card-header" style={{ marginBottom: '14px' }}>
                <div>
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-indigo">{parsedCall.method}</span>
                    <span>{parsedCall.name}</span>
                  </div>
                  <div className="card-subtitle">Target URL: <code>{parsedCall.url}</code></div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => handleSendToConnectorScaffolder(parsedCall)} className="btn btn-primary btn-sm">
                    <Layers size={13} />
                    <span>Open in Scaffolder</span>
                  </button>
                  <button onClick={() => handleCopy(JSON.stringify(parsedCall, null, 2), 'Copied Bubble Connector JSON')} className="btn btn-secondary btn-sm">
                    {copied ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                    <span>Copy Connector JSON</span>
                  </button>
                </div>
              </div>

              {/* Call Settings Overview */}
              <div className="grid-3" style={{ marginBottom: '16px', gap: '10px' }}>
                <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>USE AS</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {parsedCall.useAs} (Action / Data)
                  </div>
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DATA TYPE</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                    {parsedCall.dataCategory}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BODY TYPE</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {parsedCall.bodyType}
                  </div>
                </div>
              </div>

              <div className="grid-2" style={{ alignItems: 'start' }}>
                {/* Headers Editor */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      HEADERS ({parsedCall.headers.length})
                    </span>
                    <button onClick={handleAddHeader} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                      <Plus size={11} />
                      <span>Add Header</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {parsedCall.headers.map((h, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                        <input
                          type="text"
                          value={h.key}
                          onChange={e => handleUpdateHeader(i, { key: e.target.value })}
                          className="input"
                          style={{ height: '26px', fontSize: '0.75rem', padding: '2px 6px', flex: 1 }}
                        />
                        <input
                          type="text"
                          value={h.value}
                          onChange={e => handleUpdateHeader(i, { value: e.target.value })}
                          className="input"
                          style={{ height: '26px', fontSize: '0.75rem', padding: '2px 6px', flex: 1.5 }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.7rem', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          <input
                            type="checkbox"
                            checked={h.isPrivate}
                            onChange={e => handleUpdateHeader(i, { isPrivate: e.target.checked })}
                          />
                          Private
                        </label>
                        <button onClick={() => handleRemoveHeader(i)} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Parameters & Body Editor */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      PARAMETERS ({parsedCall.parameters.length})
                    </span>
                    <button onClick={handleAddParameter} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                      <Plus size={11} />
                      <span>Add Param</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                    {parsedCall.parameters.map((p, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                        <input
                          type="text"
                          value={p.key}
                          onChange={e => handleUpdateParameter(i, { key: e.target.value })}
                          className="input"
                          style={{ height: '26px', fontSize: '0.75rem', padding: '2px 6px', flex: 1 }}
                        />
                        <input
                          type="text"
                          value={p.value}
                          onChange={e => handleUpdateParameter(i, { value: e.target.value })}
                          className="input"
                          style={{ height: '26px', fontSize: '0.75rem', padding: '2px 6px', flex: 1 }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.675rem', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          <input
                            type="checkbox"
                            checked={p.isPrivate}
                            onChange={e => handleUpdateParameter(i, { isPrivate: e.target.checked })}
                          />
                          Priv
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.675rem', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          <input
                            type="checkbox"
                            checked={p.isOptional}
                            onChange={e => handleUpdateParameter(i, { isOptional: e.target.checked })}
                          />
                          Opt
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.675rem', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          <input
                            type="checkbox"
                            checked={p.isQuerystring}
                            onChange={e => handleUpdateParameter(i, { isQuerystring: e.target.checked })}
                          />
                          Query
                        </label>
                        <button onClick={() => handleRemoveParameter(i)} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {parsedCall.bodyPayload && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>BODY PAYLOAD</div>
                      <pre style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: '#f472b6', margin: 0, maxHeight: '140px', overflowY: 'auto' }}>
                        {parsedCall.bodyPayload}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          SUBTAB 3: SWAGGER / OPENAPI 3.0 IMPORTER
          ===================================================================== */}
      {subTab === 'openapi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Spec Input Card */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '12px' }}>
              <div>
                <div className="card-title">
                  <Globe size={16} color="var(--accent-cyan)" />
                  <span>OpenAPI 3.0 & Swagger 2.0 Specification Importer</span>
                </div>
                <div className="card-subtitle">
                  Upload .json/.yaml files or paste raw API specifications to batch export into Bubble API Connector
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  <FileUp size={13} />
                  <span>Upload Spec File</span>
                  <input type="file" accept=".json,.yaml,.yml" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
                <button
                  type="button"
                  onClick={() => handleParseOpenApiSpec()}
                  className="btn btn-primary btn-sm"
                >
                  <Sparkles size={13} />
                  <span>Parse Specification</span>
                </button>
              </div>
            </div>

            <textarea
              value={openApiSpecText}
              onChange={e => setOpenApiSpecText(e.target.value)}
              placeholder="Paste OpenAPI 3.0 JSON or YAML..."
              className="input"
              style={{ height: '110px', fontFamily: 'var(--font-mono)', fontSize: '0.775rem', resize: 'vertical' }}
            />
          </div>

          {/* Parsed OpenAPI Endpoints Explorer */}
          {openApiResult && (
            <div className="card">
              <div className="card-header" style={{ marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{openApiResult.apiTitle}</span>
                    <span className="badge badge-indigo">v{openApiResult.version}</span>
                  </div>
                  <div className="card-subtitle">
                    Base Server URL: <code>{openApiResult.baseUrl}</code> • {openApiResult.callsCount} total endpoints
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => handleSelectAllEndpoints(true)} className="btn btn-secondary btn-sm" style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                    <CheckSquare size={12} />
                    <span>Select All</span>
                  </button>
                  <button onClick={() => handleSelectAllEndpoints(false)} className="btn btn-secondary btn-sm" style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                    <Square size={12} />
                    <span>Deselect All</span>
                  </button>
                  <button onClick={handleExportSelectedToConnector} className="btn btn-primary btn-sm">
                    <Download size={13} />
                    <span>Batch Export to Bubble</span>
                  </button>
                </div>
              </div>

              {/* Tag Filters & Search Bar */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                <div className="search-wrapper-premium" style={{ flex: 1, minWidth: '220px' }}>
                  <Search size={14} className="search-icon-premium" />
                  <input
                    type="text"
                    value={openApiSearch}
                    onChange={e => setOpenApiSearch(e.target.value)}
                    placeholder="Search endpoints by path, summary, or method..."
                    className="search-input-premium"
                  />
                </div>

                <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
                  <button
                    onClick={() => setSelectedTagFilter('ALL')}
                    className={`btn btn-sm ${selectedTagFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                  >
                    All Tags ({openApiResult.endpoints.length})
                  </button>
                  {openApiResult.tags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTagFilter(tag)}
                      className={`btn btn-sm ${selectedTagFilter === tag ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                    >
                      <Tag size={10} />
                      <span>{tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Endpoints Table / Cards */}
              <div className="data-grid-scroll-container" style={{ maxHeight: '460px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredEndpoints.map(ep => {
                    const methodColor = ep.method === 'GET' ? 'badge-indigo' : ep.method === 'POST' ? 'badge-emerald' : ep.method === 'DELETE' ? 'badge-rose' : 'badge-amber';

                    return (
                      <div
                        key={ep.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          background: ep.selected ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-input)',
                          border: ep.selected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                          <input
                            type="checkbox"
                            checked={ep.selected}
                            onChange={() => handleToggleEndpointSelect(ep.id)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span className={`badge ${methodColor}`} style={{ fontSize: '0.7rem', minWidth: '55px', justifyContent: 'center' }}>
                            {ep.method}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {ep.summary}
                            </div>
                            <code style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                              {ep.path}
                            </code>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                            {ep.tags[0] || 'General'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSendToConnectorScaffolder(ep.callConfig)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                          >
                            <ArrowRight size={11} />
                            <span>Scaffold</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {filteredEndpoints.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      No endpoints matched the search query.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          SUBTAB 4: API CONNECTOR SCAFFOLDER & JSON SCHEMA VALIDATOR
          ===================================================================== */}
      {subTab === 'connector' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="responsive-split" style={{ alignItems: 'start' }}>
            {/* Left Column: Call Editor & Schema Validator */}
            <div className="card">
              <div className="card-header" style={{ marginBottom: '12px' }}>
                <div>
                  <div className="card-title">
                    <Sliders size={16} color="var(--primary)" />
                    <span>API Call Configurator</span>
                  </div>
                  <div className="card-subtitle">Design Bubble API Connector parameters & payload structures</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="input-label">Call Name</label>
                  <input
                    type="text"
                    value={activeConnectorCall.name}
                    onChange={e => setActiveConnectorCall({ ...activeConnectorCall, name: e.target.value })}
                    className="input"
                    placeholder="e.g. Stripe Create Customer"
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={activeConnectorCall.method}
                    onChange={(e: any) => setActiveConnectorCall({ ...activeConnectorCall, method: e.target.value })}
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
                    value={activeConnectorCall.url}
                    onChange={e => setActiveConnectorCall({ ...activeConnectorCall, url: e.target.value })}
                    className="input"
                    placeholder="https://api.service.com/v1/endpoint"
                  />
                </div>

                {/* JSON Schema Validator Section */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="input-label" style={{ margin: 0 }}>JSON Schema & Response Inspector</label>
                    <button onClick={handleValidateSchema} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                      <CheckCircle2 size={11} color="var(--accent-emerald)" />
                      <span>Validate Schema</span>
                    </button>
                  </div>

                  <textarea
                    value={schemaPayloadInput}
                    onChange={e => {
                      setSchemaPayloadInput(e.target.value);
                      setActiveConnectorCall({ ...activeConnectorCall, bodyPayload: e.target.value });
                    }}
                    className="input"
                    style={{ height: '100px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', resize: 'vertical' }}
                    placeholder="Paste JSON response to inspect types and validate..."
                  />

                  {/* Schema Validation Status */}
                  <div style={{ marginTop: '8px' }}>
                    {schemaValidation.valid ? (
                      <div className="code-box-success" style={{ fontSize: '0.725rem', padding: '8px 10px' }}>
                        <div style={{ fontWeight: 700, marginBottom: '2px' }}>✓ {schemaValidation.summary}</div>
                        {schemaValidation.inferredTypes && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                            {Object.entries(schemaValidation.inferredTypes).map(([k, v]) => (
                              <span key={k} style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                                <code>{k}: {v}</code>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="code-box-danger" style={{ fontSize: '0.725rem', padding: '8px 10px' }}>
                        <div style={{ fontWeight: 700 }}>✕ {schemaValidation.summary}</div>
                        {schemaValidation.errors.map((err, i) => (
                          <div key={i}>• {err}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Code Snippets Generator */}
            <div className="card">
              <div className="card-header" style={{ marginBottom: '12px' }}>
                <div>
                  <div className="card-title">
                    <FileCode size={16} color="var(--accent-emerald)" />
                    <span>Bubble API Code Snippets</span>
                  </div>
                  <div className="card-subtitle">Ready-to-use client & server integration code</div>
                </div>

                <button
                  onClick={() => {
                    const text = codeOutputTab === 'client' ? generatedSnippets.clientSideJs : codeOutputTab === 'server' ? generatedSnippets.serverSideNode : codeOutputTab === 'curl' ? generatedSnippets.curlCommand : generatedSnippets.bubbleJson;
                    handleCopy(text, `Copied ${codeOutputTab.toUpperCase()} snippet`);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>

              {/* Snippet Tabs */}
              <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '3px', borderRadius: 'var(--radius-sm)', marginBottom: '12px', overflowX: 'auto' }}>
                <button
                  onClick={() => setCodeOutputTab('client')}
                  className={`btn btn-sm ${codeOutputTab === 'client' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ border: 'none', padding: '4px 8px', fontSize: '0.75rem' }}
                >
                  Client JS (Toolbox)
                </button>
                <button
                  onClick={() => setCodeOutputTab('server')}
                  className={`btn btn-sm ${codeOutputTab === 'server' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ border: 'none', padding: '4px 8px', fontSize: '0.75rem' }}
                >
                  Server SSA (Node)
                </button>
                <button
                  onClick={() => setCodeOutputTab('curl')}
                  className={`btn btn-sm ${codeOutputTab === 'curl' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ border: 'none', padding: '4px 8px', fontSize: '0.75rem' }}
                >
                  cURL
                </button>
                <button
                  onClick={() => setCodeOutputTab('bubble_json')}
                  className={`btn btn-sm ${codeOutputTab === 'bubble_json' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ border: 'none', padding: '4px 8px', fontSize: '0.75rem' }}
                >
                  API Connector JSON
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
                lineHeight: 1.45,
                border: '1px solid var(--border-subtle)'
              }}>
                {codeOutputTab === 'client' && generatedSnippets.clientSideJs}
                {codeOutputTab === 'server' && generatedSnippets.serverSideNode}
                {codeOutputTab === 'curl' && generatedSnippets.curlCommand}
                {codeOutputTab === 'bubble_json' && generatedSnippets.bubbleJson}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBTAB 5: PLUGIN ACTION SDK BUILDER
          ===================================================================== */}
      {subTab === 'plugin_sdk' && (
        <PluginSdkGenerator onLog={onLog} />
      )}
    </div>
  );
};
