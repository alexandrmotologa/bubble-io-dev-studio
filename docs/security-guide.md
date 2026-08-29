# 🛡️ Security & Privacy Rules Auditor Guide

The **Security & Privacy Rules Auditor** is an enterprise security and compliance suite that protects Bubble applications against data leaks, unauthenticated public API scraping, and exposed sensitive records.

---

## 🌟 Core Security Capabilities

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              Security & RBAC Suite                                     │
├────────────────────┬────────────────────┬────────────────────┬─────────────────────────┤
│ 🔒 RBAC Matrix     │ 🎛️ Role Simulator  │ 🚨 "Everyone Else" │ 💡 Privacy Generator    │
│   • Admin Policy   │   • Guest Persona  │   • Public Scrape  │   • Step-by-Step Guide  │
│   • User Condition │   • Creator Match  │   • CRITICAL Risks │   • Bubble Expression   │
│   • Restricted View│   • Live Field Mock│   • UNPROTECTED    │   • 1-Click Copy        │
├────────────────────┼────────────────────┼────────────────────┼─────────────────────────┤
│ ⚖️ Compliance Gate │ 🛡️ API Endpoints   │ 🔍 Exposed PII     │ 📄 Multi-Format Export  │
│   • GDPR (Art. 5)  │   • No-Auth Alerts │   • Credentials    │   • Executive Markdown  │
│   • SOC 2 Type II  │   • Privacy Bypass │   • Stripe Keys    │   • SARIF 2.1.0 JSON    │
│   • PCI-DSS / HIPAA│   • Route Audit    │   • Wallet Address │   • GitHub CodeQL CI    │
└────────────────────┴────────────────────┴────────────────────┴─────────────────────────┘
```

---

## 1. 🔒 Role-Based Access Control (RBAC) Matrix

Bubble uses Privacy Rules to enforce row-level and column-level database security. The auditor automatically evaluates role permissions across 3 standard actor tiers for every data type:

| Actor Role | Find in Searches | View All Fields | Access Level | Evaluated Bubble Rule |
| :--- | :---: | :---: | :---: | :--- |
| **Admin** | ✅ Yes | ✅ Yes | `FULL` | `Current User's Role is "Admin"` |
| **Authenticated User** | ✅ Yes | ⚠️ Conditional | `CONDITIONAL` | `This Thing's Created By is Current User` |
| **Guest / Everyone Else** | ❌ No | ❌ No | `RESTRICTED` | Public visitors can only view non-sensitive catalog fields |

### 🔍 Field Permissions Inspector
Click on any **Restricted (N hidden)** link or **Inspect** button to open a detailed modal showing exact field lists that are restricted and the evaluated expression.

---

## 2. 🎛️ Role Access Simulator & Security Sandbox

Test how real Bubble API requests and search queries evaluate for different user personas in real-time:

* **Simulated User Personas**:
  1. `Guest (Public / Unauthenticated Visitor)`
  2. `Other Authenticated User (Logged-in non-creator)`
  3. `Record Owner (Creator matching Created By is Current User)`
  4. `System Administrator (Full access bypass)`
* **Visual Record Payload Simulation**:
  - 🟢 **VISIBLE**: Field is readable by the selected persona.
  - 🟡 **MASKED**: Field is partially restricted / audited.
  - 🔴 **REDACTED / HIDDEN**: Confidential PII / credential field hidden from API response.
* **API Search Evaluation**: Shows if `GET /api/1.1/obj/TableName` is permitted for the active persona.

---

## 3. 🚨 "Everyone Else" Public Scraping Risk Scanner

Over 90% of Bubble security vulnerabilities originate from the default **"Everyone Else"** rule allowing public search and field access.

* 🔴 **CRITICAL RISK**: Table contains sensitive fields (emails, wallet keys, tokens) and has public search or view permissions enabled.
* 🟡 **UNPROTECTED**: Table has no Privacy Rules defined and inherits default Bubble public exposure.
* 🟢 **HARDENED**: Table has strict privacy rules or contains strictly public catalog data.

Each finding includes a 1-click **Copy Expression** button to immediately secure the table in the Bubble editor.

---

## 4. 💡 Privacy Rules Generator & Remediation Scaffolder

Provides declarative step-by-step remediation recipes ready to copy directly into **Bubble Editor ➔ Data ➔ Privacy**:

```text
Rule Name: App Owner & Creator Access
When: This App's Created By is Current User
View all fields: [x] Yes
Allow searches: [x] Yes
Protected Fields: email_text, api_token, wallet_address
```

---

## 5. ⚖️ Regulatory Compliance Posture (GDPR, SOC 2, PCI-DSS, HIPAA)

Real-time compliance audit scorecards evaluated against international standards:

1. 🇪🇺 **GDPR (Articles 5 & 32)**: Verifies that personal data (emails, phones, addresses, IPs) cannot be harvested in search results.
2. 🛡️ **SOC 2 Type II**: Enforces Principle of Least Privilege (PoLP) and role separation.
3. 💳 **PCI-DSS**: Ensures payment tokens and Stripe Customer IDs are restricted from public clients.
4. 🏥 **HIPAA**: Flags protected health information requiring enterprise dedicated encryption.

---

## 6. 🛡️ Insecure Backend API Endpoints

Backend Workflows (`/api/1.1/wf/[name]`) are inspected for dangerous flags:

1. **"Run without authentication" Enabled**: Flags publicly callable backend routes.
2. **"Ignore Privacy Rules" Enabled**: Flags workflows that bypass database row-level security.

---

## 7. 📄 Multi-Format Audit Reports

* **Executive Markdown (`.md`)**: Complete summary with scorecards, compliance tables, and step-by-step remediation recipes.
* **SARIF 2.1.0 JSON (`.sarif.json`)**: Industry standard format for direct ingestion into **GitHub CodeQL**, GitLab Security Dashboard, and CI/CD security pipelines.
