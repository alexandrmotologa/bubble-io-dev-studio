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
* **SARIF 2.1.0 JSON (`.sarif.json`)**: Structured security format for integration with GitHub CodeQL, GitLab Security Dashboards, and CI/CD pipelines.

---

## 8. Plugin Security, Deprecation & Secret Leak Scanner

The scanner inspects installed marketplace and custom plugins extracted from the `.bubble` AST blueprint:

1. **Unmaintained Plugins (>2 Years Old)**: Calculates the time since the plugin author published the last update (`last_updated` or `release_date`). Plugins without updates for over 730 days receive a warning because unmaintained plugins are more likely to break on new Bubble engine releases or harbor unpatched vulnerabilities.
2. **Deprecated Bubble Plugin APIs**: Identifies plugins built on Bubble Plugin API v1 and v2. Bubble has scheduled older plugin runtimes for deprecation, recommending migration to API v4.
3. **Secret Token Leaks**: Inspects client-accessible parameters and header scripts for exposed credentials:
   - Stripe Live Secret Keys (`sk_live_...`) and Test Secret Keys (`sk_test_...`)
   - AWS Root and IAM Access Keys (`AKIA...`)
   - GitHub Personal Access Tokens (`ghp_...`, `github_pat_...`)
   - Slack API Bot Tokens (`xoxb-...`, `xoxp-...`)
   - Embedded JWT Tokens containing private claims
4. **Mixed Content and Render-Blocking Scripts**: Flags external script dependencies that load over unencrypted `http://`, as modern browsers block mixed content. It also calculates page load latency for heavy synchronous scripts injected into `<head>`, which delay First Contentful Paint.
5. **Scorecard and Remediation**: Assigns an overall plugin security score (0 to 100) and letter grade (A+ to F), with instructions for rotating leaked keys and moving calls to server-side backend workflows.

---

## 9. Data Privacy in Cloud Sync

When using Cloud Direct Sync:

1. **Application Structure Only**: The sync service only accesses editor definition endpoints (`/appeditor/export/...`). It reads UI elements, workflows, action properties, schemas, and Option Sets. It never accesses, reads, or downloads user records from your database.
2. **Isolated Server Credentials**: The bot session cookie is kept in a private `.env` file on the server and is never committed to Git or sent to client apps.
3. **Rate Limiting**: Sync endpoints enforce an IP rate limit of 30 requests per 15 minutes.
4. **Local Execution**: Dead code scans, ERD rendering, and local audits run on your local computer. API bearer tokens are encrypted on disk using OS keyrings (`safeStorage`).
