import { ApiConnectorCallConfig, OpenApiImportResult, WebhookLogEntry } from '../../types';

export class ApiStudioEngine {
  /**
   * Parses a raw cURL command into Bubble API Connector structure
   */
  public static parseCurl(curlText: string): ApiConnectorCallConfig {
    const lines = curlText.trim().replace(/\\\n/g, ' ').split(/\s+/);
    
    let method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET';
    let url = 'https://api.example.com/v1/resource';
    const headers: { key: string; value: string; isPrivate?: boolean }[] = [];
    const parameters: { key: string; value: string; isClientSafe?: boolean }[] = [];
    let bodyPayload: string | undefined = undefined;

    for (let i = 0; i < lines.length; i++) {
      const token = lines[i];

      if (token === '-X' || token === '--request') {
        const next = lines[++i];
        if (next && ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(next.toUpperCase())) {
          method = next.toUpperCase() as any;
        }
      } else if (token === '-H' || token === '--header') {
        const headerStr = lines[++i]?.replace(/^['"]|['"]$/g, '') || '';
        const colonIdx = headerStr.indexOf(':');
        if (colonIdx > 0) {
          const key = headerStr.slice(0, colonIdx).trim();
          const value = headerStr.slice(colonIdx + 1).trim();
          const isPrivate = key.toLowerCase().includes('auth') || key.toLowerCase().includes('key') || key.toLowerCase().includes('bearer');
          headers.push({ key, value, isPrivate });
        }
      } else if (token === '-d' || token === '--data' || token === '--data-raw') {
        method = method === 'GET' ? 'POST' : method;
        bodyPayload = lines.slice(i + 1).join(' ').replace(/^['"]|['"]$/g, '');
        break;
      } else if (token.startsWith('http://') || token.startsWith('https://') || (token.startsWith('"http') || token.startsWith('\'http'))) {
        url = token.replace(/^['"]|['"]$/g, '');
      }
    }

    // Extract query parameters from URL if any
    try {
      const parsedUrl = new URL(url);
      parsedUrl.searchParams.forEach((value, key) => {
        parameters.push({ key, value, isClientSafe: true });
      });
      url = `${parsedUrl.origin}${parsedUrl.pathname}`;
    } catch {
      // Keep raw url if unparseable
    }

    return {
      id: 'curl_' + Date.now(),
      name: 'Imported API Call',
      url,
      method,
      useAs: method === 'GET' ? 'data' : 'action',
      dataCategory: 'json',
      headers: headers.length > 0 ? headers : [{ key: 'Content-Type', value: 'application/json' }],
      parameters,
      bodyType: bodyPayload ? 'json' : 'raw',
      bodyPayload
    };
  }

  /**
   * Parses OpenAPI / Swagger JSON definitions
   */
  public static parseOpenApi(openApiJson: any): OpenApiImportResult {
    const calls: ApiConnectorCallConfig[] = [];
    const title = openApiJson?.info?.title || 'OpenAPI Specification';
    const version = openApiJson?.info?.version || '1.0.0';
    const baseUrl = openApiJson?.servers?.[0]?.url || 'https://api.example.com';

    const paths = openApiJson?.paths || {};
    for (const [route, methods] of Object.entries<any>(paths)) {
      for (const [httpMethod, def] of Object.entries<any>(methods)) {
        if (!['get', 'post', 'put', 'delete', 'patch'].includes(httpMethod.toLowerCase())) continue;

        const method = httpMethod.toUpperCase() as any;
        const callName = def.summary || def.operationId || `${method} ${route}`;
        const headers: { key: string; value: string }[] = [{ key: 'Content-Type', value: 'application/json' }];
        const parameters: { key: string; value: string }[] = [];

        if (Array.isArray(def.parameters)) {
          for (const param of def.parameters) {
            if (param.in === 'query') {
              parameters.push({ key: param.name, value: param.example || `<${param.name}>` });
            } else if (param.in === 'header') {
              headers.push({ key: param.name, value: param.example || `<${param.name}>` });
            }
          }
        }

        calls.push({
          id: `call_${calls.length + 1}`,
          name: callName,
          url: `${baseUrl.replace(/\/$/, '')}${route}`,
          method,
          useAs: method === 'GET' ? 'data' : 'action',
          dataCategory: 'json',
          headers,
          parameters,
          bodyType: 'json',
          bodyPayload: method !== 'GET' ? '{\n  "key": "value"\n}' : undefined
        });
      }
    }

    return {
      apiTitle: title,
      version,
      callsCount: calls.length,
      calls
    };
  }

  /**
   * Generates sample webhook log entries for testing
   */
  public static getSampleWebhooks(): WebhookLogEntry[] {
    return [
      {
        id: 'wh_1',
        timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
        method: 'POST',
        endpoint: '/api/1.1/wf/stripe_webhook',
        status: 200,
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 't=1724749200,v1=9a8b7c6d5e4f3a2b1c'
        },
        bodyJson: {
          id: 'evt_1PzXyZ2eZvKYlo2C9h8g7f6e',
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_live_a1b2c3d4e5',
              amount_total: 4900,
              currency: 'usd',
              customer_email: 'alexander@example.com'
            }
          }
        },
        responseBody: { status: 'success', message: 'Order created' },
        durationMs: 142
      },
      {
        id: 'wh_2',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        method: 'POST',
        endpoint: '/api/1.1/wf/sendgrid_inbound_parse',
        status: 200,
        headers: {
          'content-type': 'application/json',
          'user-agent': 'SendGrid-Webhook/1.0'
        },
        bodyJson: {
          from: 'client@company.com',
          subject: 'Support Ticket #4821',
          text: 'Hello, please help with invoice 2026-08.'
        },
        responseBody: { status: 'success', ticketId: 'tick_984' },
        durationMs: 88
      }
    ];
  }
}
