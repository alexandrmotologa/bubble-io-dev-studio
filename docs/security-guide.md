# 🛡️ Security & Privacy Rules Auditor Guide

The **Security & Privacy Rules Auditor** protects Bubble applications against data leaks, exposed user records, and unauthenticated API backend endpoints.

---

## 1. Role-Based Access Control (RBAC) Matrix

Bubble uses Privacy Rules to enforce database security. The auditor automatically evaluates role permissions across 3 standard actor tiers for every table:

| Actor Role | Find in Searches | View All Fields | Access Level | Best Practice Rule |
| :--- | :---: | :---: | :---: | :--- |
| **Admin** | ✅ Yes | ✅ Yes | `FULL` | `Current User's Role is "Admin"` |
| **Authenticated User** | ✅ Yes | ⚠️ Conditional | `CONDITIONAL` | `This Thing's Created By is Current User` |
| **Guest / Everyone Else** | ❌ No | ❌ No | `HIDDEN` | Public users must only see unclassified, non-sensitive data |

---

## 2. Sensitive Data (PII) Scanner

The auditor scans all fields across your tables using regex patterns to identify unprotected sensitive data:

* 📧 **Email Addresses**: `email`, `contact_email`, `user_email`
* 📱 **Phone & SMS**: `phone`, `mobile`, `tel`
* 🔑 **Tokens & Secrets**: `token`, `secret`, `api_key`, `access_token`
* 💳 **Financial / Stripe**: `stripe_customer_id`, `card_id`, `balance`, `wallet_address`
* 🆔 **Identity & SSN**: `ssn`, `tax_id`, `passport_number`

> [!WARNING]
> If any sensitive field is accessible by **Everyone Else**, the security engine flags a **CRITICAL VULNERABILITY**.

---

## 3. Insecure Backend API Endpoints

Backend Workflows (`/api/1.1/wf/[name]`) are checked for 2 common misconfigurations:

1. **"Run without authentication" Enabled**:
   - Allows public internet clients to trigger backend actions without an API key or session cookie.
2. **"Ignore Privacy Rules" Enabled**:
   - Bypasses all row-level security checks when reading or modifying data.

---

## 4. Security Score & Audit Report Export

* **Scorecard**: Scores your app from 0 to 100 with letter grades (`A+`, `A`, `B`, `C`, `D`, `F`).
* **Markdown Export**: Generates an audit report detailing findings, severity levels, and remediation steps.
