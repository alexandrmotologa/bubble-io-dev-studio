# 🌐 Webhooks & API Studio Guide (v3.3.9)

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
curl -X POST https://api.stripe.com/v1/customers \
  -u sk_test_...: \
  -d "email=jenny.rosen@example.com"
```

The parser automatically decomposes the snippet into Bubble API Connector fields:
* **Method & URL**: `POST` to `https://api.stripe.com/v1/customers`
* **Headers**: `Authorization: Basic ...`
* **Parameters / Body**: Form-encoded body parameters mapped to key-value rows.
* **1-Click Copy**: Formatted configuration ready to paste into Bubble Plugin or API Connector.

---

## 3. Bubble Plugin Builder SDK Scaffolder

Generate complete code templates for custom Bubble plugins:
* **Server-Side Actions (SSA)**: Node.js 18+ asynchronous handlers with typing and error boundaries.
* **Client-Side Actions (CSA)**: Browser JavaScript functions with element access.
* **Parameter Manifest**: JSON definition for parameters, return values, and input types.
* **TypeScript Quickstart**: 1-click download of `.ts` boilerplate and `package.json`.
