# 🌐 Webhooks & API Studio Guide (v2.8.0-beta)

The **Webhooks & API Studio** simplifies external integrations, cURL importing, OpenAPI 3.0 specification mapping, Bubble API Connector scaffolding, and Bubble Plugin Builder action development.

---

## 1. Live Webhook Inspector, Simulator & Replay

* **Endpoint Listener URL**:
  ```text
  https://[your-app].bubbleapps.io/[version]/api/1.1/wf/[endpoint_name]
  ```
* **Send Test Webhook**: Dispatch simulated HTTP requests (`POST`, `GET`, `PUT`, `PATCH`, `DELETE`) to test backend workflow triggers.
* **Enterprise Presets**: Instant mock payloads for:
  - **Stripe**: `payment_intent.succeeded`, `customer.subscription.created`, `invoice.payment_failed`, `charge.refunded`
  - **SendGrid**: `email.delivered`, `email.opened`, `email.bounced`, `email.spamreport`
  - **Shopify**: `orders/create`, `orders/paid`, `orders/fulfilled`, `customers/create`
  - **GitHub**: `push`, `pull_request`, `issues`, `workflow_run`
  - **Generic REST**: `user.signup`, `data.sync`, `billing.alert`
* **Custom Status Codes & Latency**: Simulate `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`, and view real-time latency (ms).
* **Instant Replay**: Re-dispatch recorded events with single-click replay or live payload modification.
* **Search & Export**: Filter webhook history and export logs as formatted JSON.

---

## 2. cURL ➔ Bubble API Connector Parser

Paste any standard or complex cURL command from external API documentation (Stripe, Twilio, SendGrid, OpenAI, etc.):

```bash
curl -X POST https://api.stripe.com/v1/payment_intents \
  -H "Authorization: Bearer sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{"amount": 2000, "currency": "usd", "customer": "cus_991823"}'
```

* **Multi-Format Support**: Automatically parses headers, query parameters, basic authentication (`-u user:pass`), bearer tokens, multipart/form-data (`-F`), `--data-urlencode`, and JSON body payloads.
* **Interactive Flag Editors**: Configure `Private`, `Optional`, and `Send in Querystring` toggles for each header and parameter.
* **One-Click Export**: Copy Bubble API Connector JSON configuration or reverse-engineer executable cURL syntax.

---

## 3. Swagger / OpenAPI 3.0 Importer

* **Multi-Format Input**: Upload `.json`, `.yaml`, or `.yml` files, fetch via URL, or paste raw specification text.
* **Tag-Based Explorer**: Interactive breakdown of all endpoints grouped by OpenAPI Tags or Paths.
* **Selective Batch Export**: Select specific endpoints or entire categories with checkboxes and batch-export directly to Bubble API Connector schema format.
* **Seamless Scaffolding**: Send any selected OpenAPI operation directly to the API Connector Scaffolder with one click.

---

## 4. API Connector Schema & Query Scaffolder

* **Visual Configurator**: Design API calls with URL parameters, headers, and dynamic body structures.
* **JSON Schema Validator**: Validate JSON response payloads against expected types, detecting missing fields and schema discrepancies.
* **Multi-Target Code Snippets**:
  - 🖥️ **Bubble Client-Side**: JavaScript Toolbox / HTML element fetch dispatcher.
  - ⚡ **Bubble Server-Side (SSA)**: Node.js async backend execution.
  - 📡 **cURL Command**: Reverse-engineered command line syntax.
  - 📦 **API Connector JSON**: Ready for direct import into Bubble.io settings.

---

## 5. Bubble Plugin Action SDK Builder

Generate production-grade code for custom Bubble plugins (Server-Side Actions & Client-Side Actions):

1. **Choose Template / Action Name**: Stripe Payment, OpenAI Chat, SendGrid Mailer, or Custom REST.
2. **Input & Return Parameters**: Strongly typed fields (`text`, `number`, `boolean`, `date`, `object`, `list_text`, `list_number`, `file`).
3. **Advanced Security & Reliability**:
   - 🔑 Inject Bubble Private API Keys (`context.keys`).
   - 🔄 Automatic retry policy with exponential backoff.
   - ⏱️ Configurable execution timeout with `AbortController`.
4. **Export Artifacts**:
   - ⚡ **Server-Side Action (SSA)** with async fetch and input validation.
   - 🖥️ **Client-Side Action (CSA)** with browser custom event dispatchers.
   - 📝 **TypeScript Interfaces** for full type-safety.
   - 📦 **`package.json`** snippet with recommended dependencies (`axios`, `zod`, `p-retry`).
