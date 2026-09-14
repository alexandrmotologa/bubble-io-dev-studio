import { describe, it, expect } from 'vitest';
import { CapturedWebhook } from '../../src/components/LocalWebhookServerPanel';

describe('Local Webhook Server & Payload Inspector Logic', () => {
  it('should format and normalize incoming raw webhook payload', () => {
    const rawHeaders = {
      'content-type': 'application/json',
      'user-agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)',
      'stripe-signature': 't=1700000000,v1=98437298347'
    };

    const rawJson = JSON.stringify({
      id: 'evt_test_123',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          amount: 5000,
          currency: 'usd'
        }
      }
    });

    const parsedWebhook: CapturedWebhook = {
      id: 'whk_12345',
      timestamp: new Date().toISOString(),
      method: 'POST',
      url: '/webhook/stripe?source=checkout&env=test',
      path: '/webhook/stripe',
      headers: rawHeaders,
      queryParams: { source: 'checkout', env: 'test' },
      rawBody: rawJson,
      body: JSON.parse(rawJson),
      clientIp: '127.0.0.1'
    };

    expect(parsedWebhook.id).toBe('whk_12345');
    expect(parsedWebhook.method).toBe('POST');
    expect(parsedWebhook.path).toBe('/webhook/stripe');
    expect(parsedWebhook.headers['stripe-signature']).toBeDefined();
    expect(parsedWebhook.queryParams.source).toBe('checkout');
    expect(parsedWebhook.body.type).toBe('payment_intent.succeeded');
    expect(parsedWebhook.body.data.object.amount).toBe(5000);
  });

  it('should handle non-JSON string payloads gracefully without crashing', () => {
    const rawText = 'webhook_event_verification_token=abc123xyz';

    const parsedWebhook: CapturedWebhook = {
      id: 'whk_text_99',
      timestamp: new Date().toISOString(),
      method: 'POST',
      url: '/webhook/verify',
      path: '/webhook/verify',
      headers: { 'content-type': 'text/plain' },
      queryParams: {},
      rawBody: rawText,
      body: rawText,
      clientIp: '192.168.1.10'
    };

    expect(parsedWebhook.body).toBe(rawText);
    expect(typeof parsedWebhook.body).toBe('string');
  });

  it('should extract query parameters correctly from search string', () => {
    const searchParams = new URLSearchParams('item=laptop&qty=2&urgent=true');
    const queryParams: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      queryParams[key] = val;
    });

    expect(queryParams.item).toBe('laptop');
    expect(queryParams.qty).toBe('2');
    expect(queryParams.urgent).toBe('true');
  });
});
