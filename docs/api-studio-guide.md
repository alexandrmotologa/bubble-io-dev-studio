# 🌐 Webhooks & API Studio Guide

The **Webhooks & API Studio** simplifies external integrations, cURL importing, and Bubble Plugin Builder action development.

---

## 1. Live Webhook Inspector & Dispatcher

* **Endpoint Listener URL**:
  ```text
  https://[your-app].bubbleapps.io/[version]/api/1.1/wf/[endpoint_name]
  ```
* **Send Test Webhook**: Dispatch simulated HTTP POST requests to test backend workflow triggers.
* **Payload Inspector**: Inspect headers, request JSON, query parameters, status codes, and execution durations in real-time.

---

## 2. cURL ➔ Bubble API Connector Parser

Paste any standard cURL command from API documentation (Stripe, Twilio, SendGrid, OpenAI, etc.):

```bash
curl -X POST https://api.stripe.com/v1/payment_intents \
  -H "Authorization: Bearer sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{"amount": 2000, "currency": "usd"}'
```

Click **"Parse cURL to Bubble Connector"** to convert the command into Bubble-compatible URL parameters, headers, and JSON body keys.

---

## 3. Bubble Plugin Action SDK Builder

Generate production-grade code for custom Bubble plugins:

1. Enter your **Action Name** (e.g. `process_payment_intent`).
2. Add typed **Input Parameters** (`text`, `number`, `boolean`, `object`, `list_text`).
3. Set your target **REST API Endpoint**.
4. The generator creates:
   - ⚡ **Server-Side Action (SSA)** with async `fetch`, error handling, and parameter validation.
   - 🖥️ **Client-Side Action (CSA)** with browser custom event dispatchers.
   - 📝 **TypeScript Interfaces** for full type-safety.
   - 📦 **`package.json`** snippet with recommended dependencies.
