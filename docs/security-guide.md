# Security & Privacy Rules Auditor Guide

The Security & Privacy Rules Auditor analyzes Bubble applications for data exposure risks, unauthenticated public endpoints, and misconfigured Privacy Rules.

---

## Suite Overview

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              Security & RBAC Suite                                     │
├────────────────────┬────────────────────┬────────────────────┬─────────────────────────┤
│ RBAC Matrix        │ Role Simulator     │ Public Risk Check  │ Privacy Generator       │
│   • Admin Policy   │   • Guest Persona  │   • Public Scrape  │   • Step-by-Step Guide  │
│   • User Condition │   • Creator Match  │   • Critical Risks │   • Bubble Expression   │
│   • Restricted View│   • Field Mocking  │   • Unprotected    │   • Copy Expression     │
├────────────────────┼────────────────────┼────────────────────┼─────────────────────────┤
│ Compliance Checks  │ API Endpoints      │ Exposed Fields     │ Multi-Format Export     │
│   • GDPR (Art. 5)  │   • No-Auth Alerts │   • Credentials    │   • Markdown Summary    │
│   • SOC 2 Type II  │   • Privacy Bypass │   • Stripe Keys    │   • SARIF 2.1.0 JSON    │
│   • PCI-DSS / HIPAA│   • Route Audit    │   • Wallet Address │   • GitHub CodeQL CI    │
└────────────────────┴────────────────────┴────────────────────┴─────────────────────────┘
```

---

## 1. Role-Based Access Control (RBAC) Matrix

Bubble uses Privacy Rules to enforce row-level and column-level database security. The auditor evaluates role permissions across three standard user tiers for each data type:

| Actor Role | Find in Searches | View All Fields | Access Level | Example Evaluated Rule |
| :--- | :---: | :---: | :---: | :--- |
| **Admin** | Yes | Yes | Full | `Current User's Role is "Admin"` |
| **Authenticated User** | Yes | Conditional | Conditional | `This Thing's Created By is Current User` |
| **Guest / Public** | No | No | Restricted | Public visitors can only view non-sensitive catalog fields |

### Field Permissions Inspector
Click any **Restricted** link or **Inspect** button to open a modal listing restricted fields and their underlying expressions.

---

## 2. Role Access Simulator

Test how API requests and searches evaluate for different user personas:

* **Supported Personas**:
  1. `Guest` (unauthenticated visitor)
  2. `Other Authenticated User` (logged-in user who does not own the record)
  3. `Record Owner` (user matching `Created By is Current User`)
  4. `System Administrator` (admin role)
* **Field State Indicators**:
  - **Visible**: Field is returned to the selected persona.
  - **Masked**: Field is partially restricted.
  - **Redacted**: Field is hidden from the API response.
* **Search Check**: Displays whether `GET /api/1.1/obj/TableName` is permitted for the active persona.

---

## 3. Public Exposure Scanner

By default, Bubble data types without explicit Privacy Rules can be queried publicly through the Data API. The scanner categorizes tables by risk level:

* **Critical Risk**: The table contains sensitive fields (such as emails, tokens, or payment IDs) and has public search or view permissions enabled.
* **Unprotected**: The table has no Privacy Rules defined, inheriting default public access.
* **Hardened**: The table has strict Privacy Rules configured or contains only non-sensitive catalog data.

Each finding includes a **Copy Expression** action to copy remediation rules directly into the Bubble editor.

---

## 4. Privacy Rules Generator

Provides step-by-step remediation recipes formatted for **Bubble Editor > Data > Privacy**:

```text
Rule Name: App Owner & Creator Access
When: This App's Created By is Current User
View all fields: [x] Yes
Allow searches: [x] Yes
Protected Fields: email_text, api_token, wallet_address
```

---

## 5. Regulatory Compliance Checks

Evaluates your application's privacy setup against common compliance standards:

1. **GDPR (Articles 5 & 32)**: Verifies that personal data (emails, phone numbers, addresses, IP addresses) cannot be harvested through public searches.
2. **SOC 2 Type II**: Checks for least-privilege access and role separation.
3. **PCI-DSS**: Checks that payment tokens and customer reference IDs are protected from client access.
4. **HIPAA**: Flags health-related records requiring dedicated database encryption.

---

## 6. Backend API Workflow Checks

Inspects backend workflows (`/api/1.1/wf/[name]`) for risky configuration flags:

1. **Run without authentication enabled**: Flags backend endpoints that anyone can trigger without an API token.
2. **Ignore Privacy Rules enabled**: Flags workflows that bypass database row-level security.

---

## 7. Export Formats

* **Markdown (`.md`)**: Summary report with risk matrices, compliance tables, and remediation steps.
* **SARIF 2.1.0 JSON (`.sarif.json`)**: Structured security format for integration with **GitHub CodeQL**, GitLab Security Dashboards, and CI/CD pipelines.

---

## 8. Data Privacy in Cloud Sync

When using Cloud Direct Sync:

1. **Application Structure Only**: The sync service only accesses editor definition endpoints (`/appeditor/export/...`). It reads UI elements, workflows, action properties, schemas, and Option Sets. It never accesses, reads, or downloads user records from your database.
2. **Isolated Server Credentials**: The bot session cookie is kept in a private `.env` file on the server and is never committed to Git or sent to client apps.
3. **Rate Limiting**: Sync endpoints enforce an IP rate limit of 30 requests per 15 minutes.
4. **Local Execution**: Dead code scans, ERD rendering, and local audits run on your local computer. API bearer tokens are encrypted on disk using OS keyrings (`safeStorage`).
