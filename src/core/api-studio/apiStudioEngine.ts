import { ApiConnectorCallConfig, ApiConnectorHeader, ApiConnectorParameter, OpenApiEndpoint, OpenApiImportResult, WebhookLogEntry } from '../../types';

export interface WebhookPreset {
  id: string;
  name: string;
  category: 'Stripe' | 'SendGrid' | 'Shopify' | 'GitHub' | 'Generic REST';
  endpoint: string;
  method: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
  payload: any;
  response: any;
  defaultStatus: number;
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: string;
  inferredTypes?: Record<string, string>;
}

export class ApiStudioEngine {
  /**
   * Tokenizes a cURL command string respecting quotes and escaped characters
   */
  private static tokenizeCurl(curlText: string): string[] {
    const cleaned = curlText.replace(/\\\r?\n/g, ' ').trim();
    const tokens: string[] = [];
    let current = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let isEscaped = false;

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];

      if (isEscaped) {
        current += char;
        isEscaped = false;
        continue;
      }

      if (char === '\\' && !inSingleQuote) {
        isEscaped = true;
        continue;
      }

      if (char === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
        continue;
      }

      if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        continue;
      }

      if (/\s/.test(char) && !inSingleQuote && !inDoubleQuote) {
        if (current.length > 0) {
          tokens.push(current);
          current = '';
        }
        continue;
      }

      current += char;
    }

    if (current.length > 0) {
      tokens.push(current);
    }

    return tokens;
  }

  /**
   * Parses a raw cURL command into Bubble API Connector structure
   */
  public static parseCurl(curlText: string): ApiConnectorCallConfig {
    if (!curlText || !curlText.trim()) {
      throw new Error('Please provide a non-empty cURL command.');
    }

    const tokens = this.tokenizeCurl(curlText);
    
    let method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' = 'GET';
    let url = 'https://api.example.com/v1/resource';
    const headers: ApiConnectorHeader[] = [];
    const parameters: ApiConnectorParameter[] = [];
    let bodyPayload: string | undefined = undefined;
    let bodyType: 'json' | 'form-data' | 'raw' = 'json';
    let authType: 'none' | 'bearer' | 'basic' | 'custom_header' = 'none';
    let authConfig: { username?: string; password?: string; token?: string; headerKey?: string; headerValue?: string } | undefined = undefined;
    let explicitMethod = false;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token === 'curl') continue;

      // Method flags: -X, --request
      if (token === '-X' || token === '--request') {
        const next = tokens[++i];
        if (next) {
          const m = next.toUpperCase();
          if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(m)) {
            method = m as any;
            explicitMethod = true;
          }
        }
      } 
      // Header flags: -H, --header
      else if (token === '-H' || token === '--header') {
        const headerStr = tokens[++i] || '';
        const colonIdx = headerStr.indexOf(':');
        if (colonIdx > 0) {
          const key = headerStr.slice(0, colonIdx).trim();
          const value = headerStr.slice(colonIdx + 1).trim();
          const isPrivate = /auth|key|secret|token|bearer|signature|password/i.test(key);
          
          if (key.toLowerCase() === 'authorization') {
            if (value.toLowerCase().startsWith('bearer ')) {
              authType = 'bearer';
              authConfig = { token: value.substring(7).trim() };
            } else if (value.toLowerCase().startsWith('basic ')) {
              authType = 'basic';
            }
          }
          headers.push({ key, value, isPrivate });
        }
      } 
      // Basic Auth flags: -u, --user
      else if (token === '-u' || token === '--user') {
        const authStr = tokens[++i] || '';
        const colonIdx = authStr.indexOf(':');
        const username = colonIdx >= 0 ? authStr.slice(0, colonIdx) : authStr;
        const password = colonIdx >= 0 ? authStr.slice(colonIdx + 1) : '';
        authType = 'basic';
        authConfig = { username, password };
        const encoded = typeof btoa !== 'undefined' ? btoa(`${username}:${password}`) : Buffer.from(`${username}:${password}`).toString('base64');
        headers.push({
          key: 'Authorization',
          value: `Basic ${encoded}`,
          isPrivate: true
        });
      }
      // Bearer token flag: --oauth2-bearer
      else if (token === '--oauth2-bearer') {
        const tokenVal = tokens[++i] || '';
        authType = 'bearer';
        authConfig = { token: tokenVal };
        headers.push({
          key: 'Authorization',
          value: `Bearer ${tokenVal}`,
          isPrivate: true
        });
      }
      // Form data flags: -F, --form
      else if (token === '-F' || token === '--form') {
        if (!explicitMethod && method === 'GET') method = 'POST';
        bodyType = 'form-data';
        const formStr = tokens[++i] || '';
        const eqIdx = formStr.indexOf('=');
        if (eqIdx > 0) {
          const key = formStr.slice(0, eqIdx).trim();
          const value = formStr.slice(eqIdx + 1).trim();
          parameters.push({
            key,
            value,
            isPrivate: /secret|key|token|password/i.test(key),
            isOptional: false,
            isQuerystring: false,
            isClientSafe: true
          });
        }
      }
      // URL-encoded data flag: --data-urlencode
      else if (token === '--data-urlencode') {
        if (!explicitMethod && method === 'GET') method = 'POST';
        const dataStr = tokens[++i] || '';
        const eqIdx = dataStr.indexOf('=');
        if (eqIdx > 0) {
          const key = dataStr.slice(0, eqIdx).trim();
          const value = dataStr.slice(eqIdx + 1).trim();
          parameters.push({
            key,
            value,
            isPrivate: false,
            isOptional: false,
            isQuerystring: false,
            isClientSafe: true
          });
        } else {
          bodyPayload = (bodyPayload ? bodyPayload + '&' : '') + dataStr;
        }
      }
      // Data payload flags: -d, --data, --data-raw, --data-binary, --json
      else if (token === '-d' || token === '--data' || token === '--data-raw' || token === '--data-binary' || token === '--json') {
        if (!explicitMethod && method === 'GET') method = 'POST';
        const dataPayload = tokens[++i] || '';
        bodyPayload = dataPayload;
        
        if (token === '--json' && !headers.some(h => h.key.toLowerCase() === 'content-type')) {
          headers.push({ key: 'Content-Type', value: 'application/json' });
        }

        // Attempt to parse JSON keys as parameters if payload is valid JSON object
        try {
          const parsed = JSON.parse(dataPayload);
          if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            bodyType = 'json';
          }
        } catch {
          bodyType = token === '--json' ? 'json' : 'raw';
        }
      }
      // Query flag: -G, --get
      else if (token === '-G' || token === '--get') {
        method = 'GET';
      }
      // URL matching
      else if (
        token.startsWith('http://') || 
        token.startsWith('https://') || 
        token.startsWith('//') ||
        (/^https?:\/\//i.test(token.replace(/^['"]|['"]$/g, '')))
      ) {
        url = token.replace(/^['"]|['"]$/g, '');
      }
    }

    // Extract query parameters from URL
    try {
      const parsedUrl = new URL(url.startsWith('//') ? `https:${url}` : url);
      parsedUrl.searchParams.forEach((value, key) => {
        parameters.push({
          key,
          value,
          isPrivate: false,
          isOptional: true,
          isQuerystring: true,
          isClientSafe: true
        });
      });
      url = `${parsedUrl.origin}${parsedUrl.pathname}`;
    } catch {
      // Keep raw url if parsing fails
    }

    // Auto-add Content-Type header if missing and method has payload
    if (['POST', 'PUT', 'PATCH'].includes(method) && !headers.some(h => h.key.toLowerCase() === 'content-type')) {
      headers.unshift({
        key: 'Content-Type',
        value: bodyType === 'form-data' ? 'multipart/form-data' : 'application/json'
      });
    }

    // Detect dataCategory
    let dataCategory: 'json' | 'text' | 'image' | 'xml' = 'json';
    const acceptHeader = headers.find(h => h.key.toLowerCase() === 'accept')?.value || '';
    if (acceptHeader.includes('xml')) dataCategory = 'xml';
    else if (acceptHeader.includes('image')) dataCategory = 'image';
    else if (acceptHeader.includes('text')) dataCategory = 'text';

    // Format bodyPayload if valid JSON
    if (bodyPayload) {
      try {
        const parsed = JSON.parse(bodyPayload);
        bodyPayload = JSON.stringify(parsed, null, 2);
      } catch {
        // keep raw
      }
    }

    return {
      id: `call_curl_${Date.now()}`,
      name: `Imported ${method} ${url.split('/').filter(Boolean).pop() || 'Endpoint'}`,
      url,
      method,
      useAs: method === 'GET' ? 'data' : 'action',
      dataCategory,
      headers: headers.length > 0 ? headers : [{ key: 'Content-Type', value: 'application/json' }],
      parameters,
      bodyType,
      bodyPayload,
      authType,
      authConfig
    };
  }

  /**
   * Reverse generates an executable cURL command from an ApiConnectorCallConfig
   */
  public static generateCurl(call: ApiConnectorCallConfig): string {
    let curl = `curl -X ${call.method} "${call.url}"`;

    for (const h of call.headers) {
      curl += ` \\\n  -H "${h.key}: ${h.value}"`;
    }

    if (call.authType === 'basic' && call.authConfig?.username) {
      curl += ` \\\n  -u "${call.authConfig.username}:${call.authConfig.password || ''}"`;
    }

    const queryParams = call.parameters.filter(p => p.isQuerystring);
    if (queryParams.length > 0) {
      const qStr = queryParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
      curl = curl.replace(call.url, `${call.url}?${qStr}`);
    }

    if (['POST', 'PUT', 'PATCH'].includes(call.method)) {
      if (call.bodyType === 'form-data') {
        for (const p of call.parameters.filter(p => !p.isQuerystring)) {
          curl += ` \\\n  -F "${p.key}=${p.value}"`;
        }
      } else if (call.bodyPayload) {
        curl += ` \\\n  -d '${call.bodyPayload.replace(/'/g, "'\\''")}'`;
      }
    }

    return curl;
  }

  /**
   * Lightweight YAML to JSON converter for simple OpenAPI YAML documents
   */
  private static parseYamlOrJson(input: string | object): any {
    if (typeof input === 'object' && input !== null) {
      return input;
    }

    const trimmed = (input || '').trim();
    if (!trimmed) throw new Error('Empty specification provided.');

    // Try native JSON first
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return JSON.parse(trimmed);
      } catch (err: any) {
        throw new Error(`Invalid JSON in OpenAPI spec: ${err.message}`);
      }
    }

    // Fallback: Simple YAML parser for standard OpenAPI YAML structures
    try {
      const lines = trimmed.split('\n');
      const root: Record<string, any> = {};
      
      for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine || cleanLine.startsWith('#')) continue;
        
        const match = cleanLine.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
        if (match) {
          const key = match[1];
          let val = match[2].trim().replace(/^['"]|['"]$/g, '');
          if (val === 'true') val = true as any;
          else if (val === 'false') val = false as any;
          else if (!isNaN(Number(val)) && val !== '') val = Number(val) as any;
          root[key] = val;
        }
      }

      if (Object.keys(root).length > 0) {
        return {
          openapi: root.openapi || '3.0.0',
          info: {
            title: root.title || 'Parsed YAML API',
            version: root.version || '1.0.0',
            description: root.description || 'Imported from OpenAPI YAML'
          },
          servers: [{ url: root.url || root.host || 'https://api.example.com' }],
          paths: {}
        };
      }
    } catch {
      // ignore
    }

    throw new Error('Unable to parse specification. Please provide valid OpenAPI 3.0 / Swagger JSON or YAML.');
  }

  /**
   * Parses OpenAPI 3.0.x / Swagger 2.0 definitions
   */
  public static parseOpenApi(specInput: string | object): OpenApiImportResult {
    const openApiJson = this.parseYamlOrJson(specInput);

    const title = openApiJson?.info?.title || 'OpenAPI Specification';
    const version = openApiJson?.info?.version || '1.0.0';
    const description = openApiJson?.info?.description || 'Auto-imported API definitions';
    
    // Determine Base URL (OpenAPI 3 vs Swagger 2)
    let baseUrl = 'https://api.example.com';
    if (Array.isArray(openApiJson?.servers) && openApiJson.servers[0]?.url) {
      baseUrl = openApiJson.servers[0].url;
    } else if (openApiJson?.host) {
      const scheme = openApiJson.schemes?.[0] || 'https';
      const basePath = openApiJson.basePath || '';
      baseUrl = `${scheme}://${openApiJson.host}${basePath}`;
    }

    const endpoints: OpenApiEndpoint[] = [];
    const calls: ApiConnectorCallConfig[] = [];
    const tagSet = new Set<string>();

    const paths = openApiJson?.paths || {};

    for (const [route, methods] of Object.entries<any>(paths)) {
      if (typeof methods !== 'object' || methods === null) continue;

      for (const [httpMethod, def] of Object.entries<any>(methods)) {
        if (!['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(httpMethod.toLowerCase())) continue;
        if (typeof def !== 'object' || def === null) continue;

        const method = httpMethod.toUpperCase() as any;
        const callSummary = def.summary || def.operationId || `${method} ${route}`;
        const callDesc = def.description || '';
        const tags: string[] = Array.isArray(def.tags) && def.tags.length > 0 ? def.tags : ['General'];
        tags.forEach(t => tagSet.add(t));

        const headers: ApiConnectorHeader[] = [{ key: 'Content-Type', value: 'application/json' }];
        const parameters: ApiConnectorParameter[] = [];
        const openApiParams: OpenApiEndpoint['parameters'] = [];

        // Parse path & query & header parameters
        const rawParams = [...(openApiJson.paths[route]?.parameters || []), ...(def.parameters || [])];
        if (Array.isArray(rawParams)) {
          for (const param of rawParams) {
            if (!param || !param.name) continue;
            const paramName = param.name;
            const paramIn = param.in || 'query';
            const paramType = param.schema?.type || param.type || 'string';
            const exampleVal = param.example !== undefined ? String(param.example) : `<${paramName}>`;

            openApiParams.push({
              name: paramName,
              in: paramIn,
              required: !!param.required,
              type: paramType,
              description: param.description,
              example: exampleVal
            });

            if (paramIn === 'query') {
              parameters.push({
                key: paramName,
                value: exampleVal,
                isPrivate: false,
                isOptional: !param.required,
                isQuerystring: true,
                isClientSafe: true,
                description: param.description
              });
            } else if (paramIn === 'header') {
              headers.push({
                key: paramName,
                value: exampleVal,
                isPrivate: /auth|key|secret|token|bearer/i.test(paramName),
                description: param.description
              });
            }
          }
        }

        // Parse Request Body (OpenAPI 3)
        let bodyPayload: string | undefined = undefined;
        let requestBodySchema: any = undefined;
        if (def.requestBody?.content) {
          const jsonContent = def.requestBody.content['application/json'];
          if (jsonContent) {
            requestBodySchema = jsonContent.schema;
            if (jsonContent.example) {
              bodyPayload = JSON.stringify(jsonContent.example, null, 2);
            } else if (jsonContent.schema?.properties) {
              const mockBody: Record<string, any> = {};
              for (const [propKey, propVal] of Object.entries<any>(jsonContent.schema.properties)) {
                mockBody[propKey] = propVal.example !== undefined ? propVal.example : propVal.type === 'number' ? 0 : propVal.type === 'boolean' ? false : `<${propKey}>`;
              }
              bodyPayload = JSON.stringify(mockBody, null, 2);
            }
          }
        } else if (method !== 'GET') {
          bodyPayload = '{\n  "key": "value"\n}';
        }

        const endpointId = `ep_${endpoints.length + 1}_${method.toLowerCase()}_${route.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const sanitizedUrl = `${baseUrl.replace(/\/$/, '')}${route}`;

        const callConfig: ApiConnectorCallConfig = {
          id: `call_${endpointId}`,
          name: callSummary,
          url: sanitizedUrl,
          method,
          useAs: method === 'GET' ? 'data' : 'action',
          dataCategory: 'json',
          headers,
          parameters,
          bodyType: 'json',
          bodyPayload,
          tag: tags[0] || 'General',
          description: callDesc
        };

        endpoints.push({
          id: endpointId,
          path: route,
          method,
          summary: callSummary,
          description: callDesc,
          tags,
          parameters: openApiParams,
          requestBodySchema,
          responses: def.responses || {},
          selected: true,
          callConfig
        });

        calls.push(callConfig);
      }
    }

    return {
      apiTitle: title,
      version,
      description,
      baseUrl,
      callsCount: endpoints.length,
      tags: Array.from(tagSet),
      endpoints,
      calls
    };
  }

  /**
   * Generates a realistic mock webhook log entry
   */
  public static generateWebhookLog(
    endpoint: string, 
    payload: any, 
    responseBody: any = { status: 'success', received: true }, 
    status: number = 200, 
    durationMs: number = 36,
    origin: string = 'dev-studio',
    queryParams?: Record<string, string>,
    replayedFromId?: string
  ): WebhookLogEntry {
    const statusTextMap: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      422: 'Unprocessable Entity',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable'
    };

    return {
      id: `wh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      method: 'POST',
      endpoint: endpoint.startsWith('/') ? endpoint : `/${endpoint}`,
      status,
      statusText: statusTextMap[status] || 'OK',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'BubbleStudio-WebhookSimulator/2.6',
        'x-bubble-origin': origin,
        'x-delivery-attempt': '1'
      },
      queryParams,
      bodyJson: payload,
      responseBody,
      durationMs,
      origin,
      replayedFromId
    };
  }

  /**
   * Returns enterprise webhook mock presets
   */
  public static getWebhookPresets(): WebhookPreset[] {
    return [
      {
        id: 'stripe_payment_succeeded',
        name: 'Stripe: payment_intent.succeeded',
        category: 'Stripe',
        endpoint: 'stripe_payment_webhook',
        method: 'POST',
        payload: {
          id: `evt_stripe_${Date.now()}`,
          object: 'event',
          type: 'payment_intent.succeeded',
          created: Math.floor(Date.now() / 1000),
          data: {
            object: {
              id: 'pi_3MtwBwLkdIwHu7ix28a3tqPa',
              object: 'payment_intent',
              amount: 4900,
              currency: 'usd',
              status: 'succeeded',
              customer: 'cus_N638zWkQ2B0s',
              client_secret: 'pi_3MtwBwLkdIwHu7ix28a3tqPa_secret_test',
              metadata: {
                bubble_user_id: 'usr_1740801934',
                plan: 'pro_monthly'
              }
            }
          }
        },
        response: { received: true, status: 'processed' },
        defaultStatus: 200
      },
      {
        id: 'stripe_subscription_created',
        name: 'Stripe: customer.subscription.created',
        category: 'Stripe',
        endpoint: 'stripe_subscription_webhook',
        method: 'POST',
        payload: {
          id: `evt_sub_${Date.now()}`,
          type: 'customer.subscription.created',
          data: {
            object: {
              id: 'sub_1OaBCdLkdIwHu7ix',
              customer: 'cus_9981273921',
              status: 'active',
              current_period_start: Math.floor(Date.now() / 1000),
              current_period_end: Math.floor(Date.now() / 1000) + 2592000,
              items: {
                data: [{ id: 'si_123', price: { id: 'price_enterprise', unit_amount: 19900 } }]
              }
            }
          }
        },
        response: { success: true },
        defaultStatus: 200
      },
      {
        id: 'sendgrid_delivered',
        name: 'SendGrid: email.delivered',
        category: 'SendGrid',
        endpoint: 'sendgrid_event_webhook',
        method: 'POST',
        payload: [
          {
            email: 'user@example.com',
            timestamp: Math.floor(Date.now() / 1000),
            event: 'delivered',
            sg_message_id: 'sendgrid_msg_984372941.filter-123',
            response: '250 2.0.0 OK 1709123456 abc-smtp.gmail.com',
            bubble_campaign_id: 'cmp_onboarding_welcome'
          }
        ],
        response: { status: 'logged' },
        defaultStatus: 200
      },
      {
        id: 'sendgrid_bounced',
        name: 'SendGrid: email.bounced',
        category: 'SendGrid',
        endpoint: 'sendgrid_event_webhook',
        method: 'POST',
        payload: [
          {
            email: 'invalid-address@fake-domain-xyz.com',
            timestamp: Math.floor(Date.now() / 1000),
            event: 'bounce',
            reason: '550 5.1.1 User unknown',
            status: '5.1.1',
            type: 'blocked'
          }
        ],
        response: { status: 'suppressed' },
        defaultStatus: 200
      },
      {
        id: 'shopify_order_created',
        name: 'Shopify: orders/create',
        category: 'Shopify',
        endpoint: 'shopify_order_webhook',
        method: 'POST',
        payload: {
          id: 59384729103,
          email: 'customer@buyer.com',
          created_at: new Date().toISOString(),
          total_price: '149.99',
          currency: 'USD',
          financial_status: 'paid',
          line_items: [
            { id: 102938475, title: 'Bubble.io Developer License', quantity: 1, price: '149.99' }
          ],
          customer: {
            id: 884729103,
            first_name: 'Alex',
            last_name: 'Motologa',
            email: 'customer@buyer.com'
          }
        },
        response: { order_synced: true, bubble_thing_id: 'thing_order_77492' },
        defaultStatus: 200
      },
      {
        id: 'github_push',
        name: 'GitHub: push event',
        category: 'GitHub',
        endpoint: 'github_deploy_hook',
        method: 'POST',
        payload: {
          ref: 'refs/heads/main',
          before: '611485678a24f28ccf02bf',
          after: '01d4187ef1c0e35791217',
          repository: {
            name: 'bubble-io-dev-studio',
            full_name: 'alexandrmotologa/bubble-io-dev-studio',
            html_url: 'https://github.com/alexandrmotologa/bubble-io-dev-studio'
          },
          pusher: { name: 'alexandrmotologa', email: 'dev@mtlg.io' },
          commits: [
            {
              id: '01d4187ef1c0e35791217',
              message: 'feat(api-studio): upgrade live webhook simulator and curl parser',
              timestamp: new Date().toISOString()
            }
          ]
        },
        response: { status: 'pipeline_triggered', build_id: 'bld_99482' },
        defaultStatus: 200
      },
      {
        id: 'generic_user_signup',
        name: 'Generic REST: user.signup',
        category: 'Generic REST',
        endpoint: 'user_signup_event',
        method: 'POST',
        payload: {
          event: 'user.registered',
          userId: `usr_${Math.floor(Math.random() * 899999 + 100000)}`,
          email: 'developer@bubbleapp.io',
          role: 'Admin',
          plan: 'Team Suite',
          signedUpAt: new Date().toISOString(),
          ipAddress: '192.168.1.10'
        },
        response: { success: true, message: 'Workflow queued' },
        defaultStatus: 200
      }
    ];
  }

  /**
   * Validates a JSON payload and checks its schema compliance
   */
  public static validateJsonSchema(schemaInput: any, payloadInput: any): SchemaValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const inferredTypes: Record<string, string> = {};

    let parsedPayload: any = payloadInput;
    if (typeof payloadInput === 'string') {
      try {
        parsedPayload = JSON.parse(payloadInput);
      } catch (err: any) {
        return {
          valid: false,
          errors: [`Malformed JSON in payload: ${err.message}`],
          warnings: [],
          summary: 'Invalid JSON Syntax'
        };
      }
    }

    if (parsedPayload === null || typeof parsedPayload !== 'object') {
      return {
        valid: false,
        errors: ['Payload must be a valid JSON Object or Array.'],
        warnings: [],
        summary: 'Non-object Payload'
      };
    }

    // Infer schema types from payload
    if (Array.isArray(parsedPayload)) {
      inferredTypes['root'] = `Array<${parsedPayload.length > 0 ? typeof parsedPayload[0] : 'any'}> [${parsedPayload.length} items]`;
    } else {
      for (const [key, value] of Object.entries(parsedPayload)) {
        if (value === null) inferredTypes[key] = 'null';
        else if (Array.isArray(value)) inferredTypes[key] = `Array<${value.length > 0 ? typeof value[0] : 'any'}>`;
        else if (typeof value === 'object') inferredTypes[key] = 'Object (nested)';
        else inferredTypes[key] = typeof value;
      }
    }

    // If schema is provided, validate keys
    if (schemaInput) {
      let parsedSchema: any = schemaInput;
      if (typeof schemaInput === 'string') {
        try {
          parsedSchema = JSON.parse(schemaInput);
        } catch {
          warnings.push('Schema string is not valid JSON, skipped detailed schema matching.');
        }
      }

      if (parsedSchema && typeof parsedSchema === 'object') {
        const requiredFields: string[] = parsedSchema.required || [];
        for (const req of requiredFields) {
          if (parsedPayload[req] === undefined) {
            errors.push(`Missing required field: '${req}'`);
          }
        }

        if (parsedSchema.properties && typeof parsedSchema.properties === 'object') {
          for (const [propKey, propDef] of Object.entries<any>(parsedSchema.properties)) {
            const actualVal = parsedPayload[propKey];
            if (actualVal !== undefined) {
              const expectedType = propDef.type;
              const actualType = Array.isArray(actualVal) ? 'array' : typeof actualVal;
              if (expectedType && expectedType !== actualType) {
                warnings.push(`Field '${propKey}' expected type '${expectedType}', got '${actualType}'`);
              }
            }
          }
        }
      }
    }

    const isValid = errors.length === 0;
    const summary = isValid 
      ? `Valid Schema (${Object.keys(inferredTypes).length} fields inspected, 0 fatal errors)`
      : `Schema Validation Failed (${errors.length} error(s))`;

    return {
      valid: isValid,
      errors,
      warnings,
      summary,
      inferredTypes
    };
  }

  /**
   * Generates code snippets for Bubble Client-side, Server-side SSA, and cURL
   */
  public static generateBubbleCodeSnippets(call: ApiConnectorCallConfig): {
    clientSideJs: string;
    serverSideNode: string;
    curlCommand: string;
    bubbleJson: string;
  } {
    const curlCommand = this.generateCurl(call);
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(call.method);

    // 1. Client Side JavaScript (e.g. JavaScript Toolbox / HTML element)
    const clientSideJs = `/**
 * Bubble.io Client-Side API Dispatcher (Toolbox / HTML Element)
 * Call: ${call.name} [${call.method}]
 */
(async function triggerApiCall() {
  const url = "${call.url}";
  const headers = {
${call.headers.map(h => `    "${h.key}": "${h.value}"`).join(',\n')}
  };

  try {
    const response = await fetch(url, {
      method: "${call.method}",
      headers: headers,
${hasBody && call.bodyPayload ? `      body: JSON.stringify(${call.bodyPayload.replace(/\n/g, '\n      ')})` : ''}
    });

    if (!response.ok) {
      throw new Error(\`HTTP Error \${response.status}: \${response.statusText}\`);
    }

    const data = await response.json();
    console.log("[Bubble Client API] Received response:", data);
    if (typeof bubble_fn_onApiResponse === "function") {
      bubble_fn_onApiResponse(JSON.stringify(data));
    }
    return data;
  } catch (error) {
    console.error("[Bubble Client API] Execution error:", error);
    if (typeof bubble_fn_onApiError === "function") {
      bubble_fn_onApiError(error.message);
    }
  }
})();`;

    // 2. Server Side Node.js Action (SSA)
    const serverSideNode = `/**
 * Bubble.io Plugin Server-Side Action (SSA) / Backend Script
 * Action: ${call.name}
 */
async function(properties, context) {
  try {
    const endpoint = "${call.url}";
    const headers = {
${call.headers.map(h => `      "${h.key}": "${h.value}"`).join(',\n')}
    };

    ${hasBody && call.bodyPayload ? `const payload = ${call.bodyPayload.replace(/\n/g, '\n    ')};` : 'const payload = {};'}

    // Execute via standard fetch or context.request
    const response = await fetch(endpoint, {
      method: "${call.method}",
      headers: headers,
      ${hasBody ? 'body: JSON.stringify(payload),' : ''}
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(\`API returned status \${response.status}: \${errText}\`);
    }

    const result = await response.json();
    return {
      status_code: response.status,
      body: JSON.stringify(result),
      success: true
    };
  } catch (err) {
    console.error("[Bubble SSA] Execution failed:", err.message);
    return {
      status_code: 500,
      body: JSON.stringify({ error: err.message }),
      success: false
    };
  }
}`;

    // 3. Bubble API Connector JSON configuration
    const bubbleJson = JSON.stringify({
      human: call.name,
      url: call.url,
      method: call.method,
      use_as: call.useAs,
      data_type: call.dataCategory,
      headers: call.headers.map(h => ({
        key: h.key,
        value: h.value,
        private: !!h.isPrivate
      })),
      params: call.parameters.map(p => ({
        key: p.key,
        value: p.value,
        private: !!p.isPrivate,
        optional: !!p.isOptional,
        querystring: !!p.isQuerystring
      })),
      body_type: call.bodyType,
      body: call.bodyPayload || ''
    }, null, 2);

    return {
      clientSideJs,
      serverSideNode,
      curlCommand,
      bubbleJson
    };
  }
}
