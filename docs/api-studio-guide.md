# Webhooks & API Studio Guide

Webhooks & API Studio provides tools to test webhook endpoints, convert cURL commands into Bubble API Connector calls, and generate boilerplate code for Bubble plugins.

---

## 1. Webhook Inspector, Simulator & Replay

* **Endpoint Listener URL**:
  ```text
  https://[your-app].bubbleapps.io/[version]/api/1.1/wf/[endpoint_name]
  ```
* **Send Test Requests**: Dispatch simulated HTTP requests (`POST`, `GET`, `PUT`, `PATCH`, `DELETE`) to test backend workflow triggers.
* **Pre-configured Payloads**: Mock data templates for:
  - **Stripe**: `payment_intent.succeeded`, `customer.subscription.created`, `invoice.payment_failed`, `charge.refunded`
  - **SendGrid**: `email.delivered`, `email.opened`, `email.bounced`, `email.spamreport`
  - **Shopify**: `orders/create`, `orders/paid`, `orders/fulfilled`, `customers/create`
  - **GitHub**: `push`, `pull_request`, `issues`, `workflow_run`
  - **Generic REST**: `user.signup`, `data.sync`, `billing.alert`
* **Status Codes & Latency**: Simulate responses (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`) and measure round-trip latency in milliseconds.
* **Replay**: Resend recorded events with optional payload edits.
* **Search & Export**: Filter event history and export request logs as JSON.

---

## 2. cURL to Bubble API Connector Parser

Paste a cURL command from any third-party API documentation:

```bash
curl -X POST https://api.stripe.com/v1/customers \
  -u sk_test_...: \
  -d "email=jenny.rosen@example.com"
```

The parser separates the command into Bubble API Connector fields:
* **Method & URL**: `POST` to `https://api.stripe.com/v1/customers`
* **Headers**: `Authorization: Basic ...`
* **Parameters / Body**: Form-encoded or JSON body parameters mapped to key-value rows.
* **Copy**: Copy formatted values directly into the Bubble Plugin editor or API Connector tab.

---

## 3. Bubble Plugin Builder SDK Scaffolder

Generates code templates for custom Bubble plugins:
* **Server-Side Actions (SSA)**: Node.js asynchronous handlers with error boundaries.
* **Client-Side Actions (CSA)**: Browser JavaScript functions with element access.
* **Parameter Manifest**: JSON definitions for action parameters, return values, and input types.
* **TypeScript Boilerplate**: Download ready-to-edit `.ts` source files and `package.json`.
