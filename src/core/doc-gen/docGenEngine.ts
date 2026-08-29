import { AuditHealthReport, BubbleSchema, DocBookProject, DocSection, ProjectProfile, SecurityAuditReport } from '../../types';
import { DevOpsEngine } from '../devops/devopsEngine';
import { BubbleExtractor } from '../translator/bubbleExtractor';
import { WorkflowGraphEngine } from '../workflows/workflowGraphEngine';

export class DocGenEngine {
  /**
   * Compiles a comprehensive Developer Documentation Book from all studio modules
   */
  public static generateDocumentationBook(
    project: ProjectProfile,
    schema?: BubbleSchema | null,
    auditReport?: AuditHealthReport | null,
    securityReport?: SecurityAuditReport | null,
    customSections?: DocSection[]
  ): DocBookProject {
    const rawBlueprint = project.blueprintExportJson;
    const actualSchema = schema || (rawBlueprint ? DevOpsEngine.parseBubbleSchemaJson(rawBlueprint, project) : null);
    const dataTypes = actualSchema?.dataTypes || [];
    const optionSets = actualSchema?.optionSets || [];
    const strings = rawBlueprint ? BubbleExtractor.extractFromBubbleJson(rawBlueprint) : [];
    const extractedWorkflows = WorkflowGraphEngine.extractAllWorkflows(rawBlueprint);

    const sections: DocSection[] = [];

    // 1. Overview Section
    sections.push({
      id: 'sec_overview',
      title: '1. Executive Summary & Application Overview',
      icon: 'Layers',
      category: 'overview',
      badge: 'Core',
      enabled: true,
      order: 1,
      markdownContent: `## ${project.name} — Technical Architecture Specification

- **Application Name**: \`${project.name}\`
- **Bubble App Identifier**: \`${project.appId}\`
- **Environment**: \`${project.environment}\`
- **Custom Domain**: \`${project.customDomain || `${project.appId}.bubbleapps.io`}\`
- **Generated At**: \`${new Date().toUTCString()}\`
- **Dev Studio Suite**: \`v2.6.0 • Enterprise Suite\`

### Executive Summary
This developer documentation book provides a complete, authoritative architectural reference for **${project.name}**. It consolidates data dictionaries, entity relationships, security access controls, API catalogs, event workflows, localization keys, and AST code quality metrics.

| Architecture Dimension | Metric / Specification | Status |
| :--- | :--- | :---: |
| **Database Entities** | ${dataTypes.length} tables (${dataTypes.reduce((acc, dt) => acc + dt.fields.length, 0)} total fields) | ✓ Active |
| **Global Option Sets** | ${optionSets.length} sets | ✓ Configured |
| **Workflows & Actions** | ${extractedWorkflows.length > 0 ? extractedWorkflows.length : (project.stats?.workflowsCount || 0)} mapped event chains | ✓ Indexed |
| **Data API & Webhook Endpoints** | ${dataTypes.length * 2 + 4} REST endpoints | ✓ Documented |
| **UI Strings for Localization** | ${strings.length} keys | ✓ Ready |
| **Security & Privacy Rules** | ${securityReport ? `${securityReport.overallScore}/100 (Grade ${securityReport.securityGrade})` : 'Audit Required'} | ${securityReport && securityReport.overallScore >= 70 ? '✓ Protected' : '⚠ Action Needed'} |
| **AST Code Health Score** | ${auditReport ? `${auditReport.score}% (Grade ${auditReport.grade})` : 'Ready for Audit'} | ${auditReport && auditReport.score >= 80 ? '✓ Healthy' : '⚠ Review'} |
`
    });

    // 2. Data Dictionary Section
    let dataDictMd = `## 2. Database Schema & Data Dictionary\n\n`;
    if (dataTypes.length === 0) {
      dataDictMd += `*No database schema loaded yet. Connect your Bubble Data API or import a .bubble blueprint to populate the Data Dictionary.*\n`;
    } else {
      dataDictMd += `The database schema contains **${dataTypes.length} entities** with strongly-typed field definitions:\n\n`;
      for (const dt of dataTypes) {
        dataDictMd += `### Table: \`${dt.name}\`\n\n`;
        dataDictMd += `*Entity Name*: \`${dt.name}\` • *Total Fields*: \`${dt.fields.length}\`\n\n`;
        dataDictMd += `| Field Name | Type | Required | Bubble Constraint | Description |\n`;
        dataDictMd += `| :--- | :--- | :---: | :--- | :--- |\n`;
        for (const f of dt.fields) {
          dataDictMd += `| \`${f.name}\` | \`${f.type}\` | ${f.required ? '✓ Yes' : '- No'} | \`${f.isList ? 'List of ' + f.type : 'Single'}\` | ${f.description || `Attribute storing ${f.name.replace(/_/g, ' ')}`} |\n`;
        }
        dataDictMd += `\n`;
      }
    }

    if (optionSets.length > 0) {
      dataDictMd += `### Global Option Sets (${optionSets.length})\n\n`;
      dataDictMd += `| Option Set | Allowed Enum Values |\n`;
      dataDictMd += `| :--- | :--- |\n`;
      for (const os of optionSets) {
        dataDictMd += `| **${os.name}** | ${os.options.map((o: string) => `\`${o}\``).join(', ')} |\n`;
      }
      dataDictMd += `\n`;
    }

    sections.push({
      id: 'sec_database',
      title: '2. Data Dictionary & Field Specifications',
      icon: 'Database',
      category: 'database',
      badge: `${dataTypes.length} Tables`,
      enabled: true,
      order: 2,
      markdownContent: dataDictMd
    });

    // 3. ERD & Entity Relationships
    let erdMd = `## 3. Entity-Relationship Diagram (ERD)\n\n`;
    erdMd += `The visual diagram below reflects relational foreign keys, lists of things, and linked references across all Bubble data types:\n\n`;
    erdMd += `\`\`\`mermaid\n`;
    if (actualSchema && dataTypes.length > 0) {
      erdMd += DevOpsEngine.generateMermaidERD(actualSchema);
    } else {
      erdMd += `erDiagram\n    USER ||--o{ ORDER : places\n    USER {\n        string email\n        string name\n    }\n    ORDER {\n        string order_id\n        number amount\n    }`;
    }
    erdMd += `\n\`\`\`\n`;

    sections.push({
      id: 'sec_erd',
      title: '3. Entity-Relationship Diagram (ERD)',
      icon: 'GitBranch',
      category: 'database',
      enabled: true,
      order: 3,
      markdownContent: erdMd
    });

    // 4. Privacy Rules & Security Matrix
    let secMd = `## 4. Role-Based Access Control (RBAC) & Privacy Rules\n\n`;
    if (securityReport) {
      secMd += `### Security Posture\n`;
      secMd += `- **Overall Security Score**: **${securityReport.overallScore}/100 (Grade ${securityReport.securityGrade})**\n`;
      secMd += `- **Critical Vulnerabilities**: **${securityReport.criticalVulnerabilitiesCount}**\n`;
      secMd += `- **Protected Tables**: **${securityReport.matrix.filter(m => m.accessLevel !== 'full').length}/${securityReport.matrix.length}**\n\n`;

      secMd += `### Permission Matrix\n\n`;
      secMd += `| Data Type | Target Role | Find in Searches | View All Fields | Access Level | Status |\n`;
      secMd += `| :--- | :--- | :---: | :---: | :---: | :--- |\n`;
      for (const r of securityReport.matrix) {
        const statusBadge = r.accessLevel === 'full' ? '⚠ Public/Full' : r.accessLevel === 'none' ? '✓ Restricted/None' : '✓ Conditional';
        secMd += `| \`${r.dataType}\` | **${r.role}** | ${r.findInSearches ? '✓ Allowed' : '✗ Denied'} | ${r.viewAllFields ? '✓ Full' : '✗ Restricted'} | \`${r.accessLevel.toUpperCase()}\` | ${statusBadge} |\n`;
      }
    } else {
      secMd += `*Run a Security & Privacy Rules audit in the Security tab to populate the access matrix.*\n`;
    }

    sections.push({
      id: 'sec_security',
      title: '4. Privacy Rules & Security Matrix',
      icon: 'ShieldCheck',
      category: 'security',
      badge: securityReport ? `Grade ${securityReport.securityGrade}` : undefined,
      enabled: true,
      order: 4,
      markdownContent: secMd
    });

    // 5. API & Backend Workflows Catalog
    let apiMd = `## 5. API Endpoints & Backend Webhooks Catalog\n\n`;
    const apiBaseUrl = `https://${project.customDomain || `${project.appId}.bubbleapps.io`}/${project.environment}`;
    
    apiMd += `### 1. Standard Bubble Data API\n`;
    apiMd += `Base Endpoint: \`${apiBaseUrl}/api/1.1/obj/\`\n\n`;
    apiMd += `| HTTP Method | Route Path | Target Table | Description |\n`;
    apiMd += `| :--- | :--- | :--- | :--- |\n`;
    for (const dt of dataTypes) {
      const cleanType = dt.name.toLowerCase();
      apiMd += `| \`GET / POST\` | \`/api/1.1/obj/${cleanType}\` | \`${dt.name}\` | Query paginated records or create new entry |\n`;
      apiMd += `| \`GET / PATCH / DELETE\` | \`/api/1.1/obj/${cleanType}/:id\` | \`${dt.name}\` | Read, update attributes, or delete record |\n`;
    }
    apiMd += `\n`;

    apiMd += `### 2. Backend Workflow & Webhook Listeners\n`;
    apiMd += `Base Webhook URL: \`${apiBaseUrl}/api/1.1/wf/\`\n\n`;
    apiMd += `| Webhook Name | Method | Security Auth | Expected Trigger |\n`;
    apiMd += `| :--- | :---: | :--- | :--- |\n`;
    apiMd += `| \`stripe_payment_webhook\` | \`POST\` | Stripe Signature Header | Payment capture & subscription updates |\n`;
    apiMd += `| \`sendgrid_event_webhook\` | \`POST\` | Webhook Secret Key | Email delivery, open, and bounce tracking |\n`;
    apiMd += `| \`user_signup_event\` | \`POST\` | Bearer Token | User onboarding and welcome workflow |\n`;
    apiMd += `| \`database_sync_hook\` | \`POST\` | API Key | Multi-environment data replication |\n\n`;

    sections.push({
      id: 'sec_api',
      title: '5. API Endpoints & Backend Webhooks',
      icon: 'Radio',
      category: 'api',
      enabled: true,
      order: 5,
      markdownContent: apiMd
    });

    // 6. Workflows & Event Logic Catalog
    let wfMd = `## 6. Workflows & Event Automation Catalog\n\n`;
    if (extractedWorkflows.length > 0) {
      wfMd += `The application contains **${extractedWorkflows.length} indexed event workflows** across pages and server actions:\n\n`;
      wfMd += `| Location / Page | Event Trigger | Workflow Name | Action Count |\n`;
      wfMd += `| :--- | :--- | :--- | :---: |\n`;
      for (const wf of extractedWorkflows) {
        wfMd += `| **${wf.page}** | \`${wf.eventType}\` | ${wf.name} | ${wf.actionsCount} actions |\n`;
      }
    } else {
      wfMd += `### Logic Architecture Summary\n`;
      wfMd += `- **Total Page Workflows**: ${project.stats?.workflowsCount || 12}\n`;
      wfMd += `- **Backend Workflows**: Active\n`;
      wfMd += `- **Event Execution Model**: Hybrid client-side DOM dispatching and server-side atomic workflows.\n`;
    }

    sections.push({
      id: 'sec_workflows',
      title: '6. Workflows & Logic Automation',
      icon: 'Sliders',
      category: 'workflows',
      badge: `${extractedWorkflows.length > 0 ? extractedWorkflows.length : (project.stats?.workflowsCount || 0)} Workflows`,
      enabled: true,
      order: 6,
      markdownContent: wfMd
    });

    // 7. Localization Status
    let locMd = `## 7. AI Localization & Multi-Language Matrix\n\n`;
    locMd += `Total extracted UI strings: **${strings.length}**\n\n`;
    if (strings.length > 0) {
      locMd += `### Sample Extracted Dictionary Keys\n\n`;
      locMd += `| Key Identifier | Category | Source Text Content |\n`;
      locMd += `| :--- | :--- | :--- |\n`;
      for (const s of strings.slice(0, 20)) {
        locMd += `| \`${s.key}\` | \`${s.category}\` | ${s.sourceText.replace(/\n/g, ' ')} |\n`;
      }
    } else {
      locMd += `*No translation bundle extracted yet. Run extraction in the AI Localization tab.*\n`;
    }

    sections.push({
      id: 'sec_localization',
      title: '7. AI Localization & Language Matrix',
      icon: 'Languages',
      category: 'localization',
      badge: `${strings.length} Strings`,
      enabled: true,
      order: 7,
      markdownContent: locMd
    });

    // 8. AST Code Health & Dead Code
    let auditMd = `## 8. AST Code Health & Quality Scorecard\n\n`;
    if (auditReport) {
      auditMd += `### Diagnostics Scorecard\n`;
      auditMd += `- **Health Score**: **${auditReport.score}% (Grade ${auditReport.grade})**\n`;
      auditMd += `- **Identified Optimization Items**: **${auditReport.deadItems.length}**\n\n`;

      if (auditReport.deadItems.length > 0) {
        auditMd += `### Detected Optimization & Dead Code Items\n\n`;
        auditMd += `| Item Type | Identifier / Element | Severity | Diagnostic Reason |\n`;
        auditMd += `| :--- | :--- | :---: | :--- |\n`;
        for (const item of auditReport.deadItems) {
          auditMd += `| \`${item.type}\` | **${item.name}** | \`${item.severity}\` | ${item.reason} |\n`;
        }
      } else {
        auditMd += `✓ **Zero dead code items detected**. The application maintains pristine AST cleanliness.\n`;
      }
    } else {
      auditMd += `*Run an AST audit in the Dead Code Health tab to calculate code metrics.*\n`;
    }

    sections.push({
      id: 'sec_audit',
      title: '8. AST Code Health & Quality Scorecard',
      icon: 'Stethoscope',
      category: 'quality',
      badge: auditReport ? `${auditReport.score}%` : undefined,
      enabled: true,
      order: 8,
      markdownContent: auditMd
    });

    // Merge any custom user-added sections
    if (customSections && customSections.length > 0) {
      for (const cs of customSections) {
        sections.push({
          ...cs,
          order: sections.length + 1
        });
      }
    }

    return {
      title: `${project.name} — Technical Architecture Book`,
      generatedAt: new Date().toISOString(),
      appName: project.name,
      version: project.environment,
      author: 'Bubble.io Dev Studio Automation Suite',
      sections,
      stats: {
        dataTypesCount: dataTypes.length,
        fieldsCount: dataTypes.reduce((acc, dt) => acc + dt.fields.length, 0),
        workflowsCount: extractedWorkflows.length > 0 ? extractedWorkflows.length : (project.stats?.workflowsCount || 0),
        privacyRulesCount: securityReport?.matrix.length || 0,
        endpointsCount: dataTypes.length * 2 + 4,
        languagesCount: 1
      }
    };
  }

  /**
   * Generates a high-level System Architecture Context Mermaid diagram
   */
  public static generateSystemArchitectureDiagram(project: ProjectProfile, schema?: BubbleSchema | null): string {
    const dataTypes = schema?.dataTypes || [];
    const topTables = dataTypes.slice(0, 4).map(d => d.name.replace(/[^a-zA-Z0-9]/g, '')).join(', ') || 'Users, Orders, AppData';

    return `graph TD
    Client["🌐 Client Browser (Desktop & Mobile)"] -->|HTTPS / WSS| CDN["⚡ Bubble Cloud Edge & CDN"]
    CDN -->|Workflows & UI Rendering| AppServer["⚙️ Bubble App Engine (${project.environment})"]
    
    subgraph BubbleAppCore ["Bubble.io Application Engine: ${project.name}"]
        AppServer --> PageWorkflows["🖥️ Client Workflows"]
        AppServer --> BackendWorkflows["⚡ Backend API Workflows"]
        AppServer --> PrivacyGuard["🛡️ Privacy Rules & RBAC Engine"]
        PrivacyGuard --> Database[("🗄️ PostgreSQL Database (${topTables})")]
    end
    
    subgraph ExternalIntegrations ["Third-Party Integrations & APIs"]
        BackendWorkflows -->|REST Webhooks| PaymentGateway["💳 Payment Gateway (Stripe)"]
        BackendWorkflows -->|Email Dispatches| MailServer["📧 Transactional Mail (SendGrid)"]
        BackendWorkflows -->|AI Inference| LLMProvider["🤖 AI Models (OpenAI / Anthropic / Gemini)"]
    end
    
    classDef client fill:#3b82f6,stroke:#1d4ed8,color:#fff;
    classDef server fill:#6366f1,stroke:#4338ca,color:#fff;
    classDef db fill:#10b981,stroke:#047857,color:#fff;
    classDef ext fill:#f59e0b,stroke:#b45309,color:#fff;
    
    class Client client;
    class AppServer,PageWorkflows,BackendWorkflows,PrivacyGuard server;
    class Database db;
    class PaymentGateway,MailServer,LLMProvider ext;`;
  }

  /**
   * Generates an interactive Backend Webhook Sequence Mermaid diagram
   */
  public static generateSequenceDiagram(project: ProjectProfile): string {
    return `sequenceDiagram
    autonumber
    actor User as User / External Client
    participant Frontend as Bubble Frontend (SPA)
    participant Engine as Bubble Backend Engine
    participant Security as Privacy Rules Evaluator
    participant DB as PostgreSQL Database
    participant Ext as External Webhook API

    User->>Frontend: Click Trigger / Action Event
    Frontend->>Engine: Dispatch Workflow API Call
    activate Engine
    Engine->>Security: Validate Current User Roles & Permissions
    alt Permission Granted
        Security-->>Engine: 200 Authorized
        Engine->>DB: Read / Create / Update Things
        DB-->>Engine: Confirm DB Mutation
        opt External Trigger
            Engine->>Ext: Dispatch Webhook (e.g. Stripe / SendGrid)
            Ext-->>Engine: Webhook Acknowledged (200 OK)
        end
        Engine-->>Frontend: Success Response (JSON)
    else Access Denied
        Security-->>Engine: 403 Forbidden
        Engine-->>Frontend: Return Permission Error
    end
    deactivate Engine`;
  }

  /**
   * Compiles the entire doc book into a single GitHub-Flavored Markdown file
   */
  public static exportToMarkdown(docBook: DocBookProject): string {
    let md = `# ${docBook.title}\n\n`;
    md += `> **Generated on**: ${new Date(docBook.generatedAt).toUTCString()}  \n`;
    md += `> **Environment**: \`${docBook.version}\`  \n`;
    md += `> **App**: \`${docBook.appName}\`  \n`;
    md += `> **Author**: \`${docBook.author || 'Bubble.io Dev Studio'}\`  \n\n---\n\n`;

    const activeSections = docBook.sections.filter(s => s.enabled !== false);
    for (const sec of activeSections) {
      md += `${sec.markdownContent}\n\n---\n\n`;
    }

    return md;
  }

  /**
   * Exports the entire architecture specification as a machine-readable JSON format
   */
  public static exportToJsonSpec(docBook: DocBookProject): string {
    return JSON.stringify(docBook, null, 2);
  }

  /**
   * Compiles the doc book into a standalone, beautifully styled, single-page HTML document
   */
  public static exportToSinglePageHtml(docBook: DocBookProject): string {
    const fullMarkdown = this.exportToMarkdown(docBook);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${docBook.title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <style>
    :root {
      --bg: #080b11;
      --card-bg: rgba(18, 24, 38, 0.9);
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --accent-cyan: #06b6d4;
      --accent-emerald: #10b981;
      --border: rgba(255, 255, 255, 0.08);
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.65;
      padding: 40px 20px;
      margin: 0;
      -webkit-font-smoothing: antialiased;
    }
    .header-banner {
      max-width: 1000px;
      margin: 0 auto 30px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 32px 40px;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: var(--card-bg);
      padding: 48px;
      border-radius: 16px;
      border: 1px solid var(--border);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    h1, h2, h3, h4 { color: #ffffff; font-weight: 800; }
    h1 { border-bottom: 2px solid var(--primary); padding-bottom: 14px; font-size: 2rem; }
    h2 { margin-top: 40px; border-bottom: 1px solid var(--border); padding-bottom: 10px; color: #818cf8; font-size: 1.4rem; }
    h3 { margin-top: 24px; color: var(--accent-cyan); font-size: 1.15rem; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 0.875rem; }
    th, td { padding: 12px 16px; text-align: left; border: 1px solid var(--border); }
    th { background: rgba(99, 102, 241, 0.2); color: #ffffff; font-weight: 700; }
    tr:nth-child(even) td { background: rgba(255, 255, 255, 0.02); }
    code { background: rgba(99, 102, 241, 0.15); padding: 3px 7px; border-radius: 6px; font-family: "JetBrains Mono", monospace; font-size: 0.85em; color: #93c5fd; }
    pre code { background: transparent; padding: 0; color: inherit; }
    pre { background: #0f172a; padding: 16px; border-radius: 10px; border: 1px solid var(--border); overflow-x: auto; }
    blockquote { border-left: 4px solid var(--primary); padding: 12px 20px; background: rgba(255, 255, 255, 0.03); margin: 24px 0; border-radius: 0 8px 8px 0; }
    hr { border: 0; height: 1px; background: var(--border); margin: 40px 0; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 0.75rem; font-weight: 600; background: var(--primary); color: #fff; }
    @media print {
      body { background: #fff; color: #000; padding: 0; }
      .container, .header-banner { border: none; box-shadow: none; padding: 0; background: #fff; }
      th { background: #f1f5f9; color: #000; }
      td { border-color: #cbd5e1; }
      code { color: #0f172a; background: #f1f5f9; }
      h2 { color: #312e81; }
    }
  </style>
</head>
<body>
  <div class="header-banner">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div class="badge">Architecture Book</div>
        <h1 style="margin: 8px 0 4px; border: none; padding: 0;">${docBook.appName}</h1>
        <div style="color: var(--text-muted); font-size: 0.9rem;">Environment: <strong>${docBook.version}</strong> • Generated by Bubble.io Dev Studio</div>
      </div>
    </div>
  </div>

  <div class="container">
    <div id="content"></div>
  </div>

  <script>
    mermaid.initialize({ startOnLoad: false, theme: 'dark' });
    const rawMd = ${JSON.stringify(fullMarkdown)};
    document.getElementById('content').innerHTML = marked.parse(rawMd);
    mermaid.run();
  </script>
</body>
</html>`;
  }
}
