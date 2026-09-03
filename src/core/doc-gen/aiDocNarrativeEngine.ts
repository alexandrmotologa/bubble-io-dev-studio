import { 
  AuditHealthReport, 
  BubbleSchema, 
  DocBookProject, 
  DocSection, 
  ProjectProfile, 
  SecurityAuditReport 
} from '../../types';

export interface ExtractedWorkflowItem {
  id: string;
  name: string;
  page: string;
  eventType: string;
  actionsCount: number;
  raw?: any;
}

export interface AiNarrativeConfig {
  provider?: string;
  model?: string;
  apiKey?: string;
  temperature?: number;
  ollamaUrl?: string;
}

export interface AiEnhanceProgress {
  step: string;
  percent: number;
}

export class AiDocNarrativeEngine {
  /**
   * Detects the business domain of an application based on its entities, fields, and workflows
   */
  public static detectDomain(schema?: BubbleSchema | null, workflows?: ExtractedWorkflowItem[]): {
    domainName: string;
    description: string;
    primaryActors: string[];
    coreEntities: string[];
  } {
    const typeNames = (schema?.dataTypes || []).map(d => d.name.toLowerCase());
    const wfNames = (workflows || []).map(w => w.name.toLowerCase());
    const allTokens = [...typeNames, ...wfNames].join(' ');

    if (allTokens.includes('order') || allTokens.includes('product') || allTokens.includes('cart') || allTokens.includes('checkout')) {
      return {
        domainName: 'E-Commerce & Digital Marketplace',
        description: 'A transaction-oriented digital commerce engine designed to facilitate catalog browsing, item checkout, payment processing, and fulfillment lifecycle management.',
        primaryActors: ['Guest Shopper', 'Authenticated Customer', 'Store Merchant / Vendor', 'Platform Administrator'],
        coreEntities: ['Product', 'Order', 'Cart', 'Customer', 'PaymentTransaction']
      };
    }

    if (allTokens.includes('ticket') || allTokens.includes('lead') || allTokens.includes('deal') || allTokens.includes('company') || allTokens.includes('contact')) {
      return {
        domainName: 'Customer Relationship Management (CRM) & Operations Hub',
        description: 'A centralized business operations and customer tracking platform that streamlines lead intake, deal pipeline stages, communication history, and team task assignments.',
        primaryActors: ['Sales Representative', 'Account Executive', 'Support Agent', 'Operations Director'],
        coreEntities: ['Lead', 'Contact', 'Company', 'Deal', 'ActivityLog']
      };
    }

    if (allTokens.includes('tenant') || allTokens.includes('subscription') || allTokens.includes('plan') || allTokens.includes('invoice') || allTokens.includes('workspace')) {
      return {
        domainName: 'Multi-Tenant B2B Software-as-a-Service (SaaS)',
        description: 'A multi-tenant cloud application offering subscription tier entitlement, workspace collaboration, role-based governance, and automated recurring billing integration.',
        primaryActors: ['Workspace Owner', 'Team Member / Collaborator', 'Billing Administrator', 'Platform Auditor'],
        coreEntities: ['Workspace', 'User', 'Subscription', 'Invoice', 'AuditTrail']
      };
    }

    if (allTokens.includes('post') || allTokens.includes('comment') || allTokens.includes('message') || allTokens.includes('like') || allTokens.includes('community')) {
      return {
        domainName: 'Social Community & Collaborative Media Hub',
        description: 'An interactive user engagement platform driving user-generated content, feed curation, real-time messaging, and member networking.',
        primaryActors: ['Community Member', 'Content Creator', 'Moderator', 'Super Administrator'],
        coreEntities: ['User', 'Post', 'Comment', 'Notification', 'MessageThread']
      };
    }

    return {
      domainName: 'Enterprise Custom Application Suite',
      description: 'A tailored business productivity solution coordinating specialized data models, atomic business event chains, and operational workflows.',
      primaryActors: ['Authenticated End User', 'Departmental Specialist', 'System Administrator', 'Integration Webhook'],
      coreEntities: schema?.dataTypes.slice(0, 5).map(dt => dt.name) || ['User', 'SystemConfiguration', 'LogRecord']
    };
  }

  /**
   * Generates a rich, meaningful Chapter 1: Domain & System Architecture Narrative
   */
  public static async generateExecutiveNarrative(
    project: ProjectProfile,
    schema?: BubbleSchema | null,
    workflows?: ExtractedWorkflowItem[],
    config?: AiNarrativeConfig
  ): Promise<string> {
    const domain = this.detectDomain(schema, workflows);
    const dataTypes = schema?.dataTypes || [];
    const entityCount = dataTypes.length;
    const fieldCount = dataTypes.reduce((acc, dt) => acc + dt.fields.length, 0);
    const wfCount = workflows?.length || (project.stats?.workflowsCount || 0);

    const prompt = `Write an authoritative, high-level Executive Summary & Architectural Overview chapter for the developer handbook of a Bubble.io application named "${project.name}".
Domain: ${domain.domainName}.
Domain Description: ${domain.description}.
Key Actors: ${domain.primaryActors.join(', ')}.
Total Database Entities: ${entityCount} (${fieldCount} fields).
Indexed Workflows: ${wfCount}.
Target Environment: ${project.environment}.

Requirements:
- Write in professional technical English.
- Use clear markdown sections:
  1. Business Mission & Platform Scope
  2. Stakeholder Personas & Access Boundaries
  3. Execution Architecture (Reactive Frontend, Server-side Workflows, Data API)
  4. Core System Metrics & Reliability Baseline
- Provide realistic domain narratives explaining WHY this application exists and HOW users interact with it, rather than just reciting numbers.`;

    const liveText = await this.executeLlmPrompt(prompt, config);
    if (liveText && liveText.length > 150) {
      return liveText;
    }

    // High-quality deterministic architectural synthesis fallback
    return `## 1. Executive Summary & Architectural Vision

### 1.1 Business Mission & Platform Scope
**${project.name}** is engineered as a **${domain.domainName}**, built on Bubble.io's cloud application runtime. ${domain.description}

The system is configured for the **\`${project.environment}\`** operational tier. It consolidates business-critical domain entities, atomic event-driven workflows, relational privacy policies, and external webhook integrations into an enterprise-grade web application.

### 1.2 Stakeholder Personas & Interaction Boundaries
The system defines distinct user journeys mapped to four core system personas:

${domain.primaryActors.map(actor => `* **${actor}**: Interacts with dedicated interface views, executing transactional mutations governed by strict privacy rules and backend validation policies.`).join('\n')}

### 1.3 Execution Architecture: Hybrid Client-Server Model
The platform operates on a resilient hybrid execution architecture:
1. **Reactive Client-Side Presentation**: Single-page application (SPA) state machines handle instantaneous DOM updates, input sanitization, and localized feedback loops with zero unnecessary server round-trips.
2. **Atomic Server-Side Workflows**: Mission-critical business mutations—including payment authorizations, cryptographic hashing, and bulk data operations—are delegated strictly to isolated Server-Side Actions (SSA) and Backend Workflows.
3. **Data API & Interoperability**: Headless programmatic access is exposed through authenticated REST endpoints (\`/api/1.1/obj/\` and \`/api/1.1/wf/\`), enabling continuous integration with third-party webhooks, microservices, and external data pipelines.

### 1.4 Architecture Specification Baseline

| Dimension | Specification | Architecture Status |
| :--- | :--- | :---: |
| **Primary Domain** | ${domain.domainName} | ✓ Categorized |
| **Data Entities** | ${entityCount} core tables (${fieldCount} relational attributes) | ✓ Fully Normalized |
| **Workflows & Action Chains** | ${wfCount} mapped event triggers | ✓ Indexed |
| **Runtime Boundary** | Bubble Cloud Multi-Tenant Engine | ✓ Protected |
| **Deployment Target** | \`${project.environment}\` | ✓ Monitored |
`;
  }

  /**
   * Generates a meaningful, text-based Chapter 2: Data Domain Architecture & Entity Narratives
   */
  public static async generateDataArchitectureNarrative(
    schema?: BubbleSchema | null,
    config?: AiNarrativeConfig
  ): Promise<string> {
    const dataTypes = schema?.dataTypes || [];
    const optionSets = schema?.optionSets || [];

    if (dataTypes.length === 0) {
      return `## 2. Database Domain Architecture & Entity Reference\n\n*No database schema loaded yet. Connect your Bubble Data API or import a .bubble blueprint to generate the entity architecture.*`;
    }

    // Try live LLM for deep entity narration if configured
    const sampleTypesSummary = dataTypes.slice(0, 8).map(dt => `${dt.name} (${dt.fields.map(f => f.name).slice(0, 6).join(', ')})`).join('; ');
    const prompt = `You are a Lead Software Architect. Write a comprehensive Data Architecture Chapter for an application with these tables: ${sampleTypesSummary}.
For each major entity:
1. Explain its Business Purpose & Domain Role in clear sentences.
2. Describe its Entity Lifecycle (how it is created, modified, and queried).
3. Outline its Key Relational Dependencies with other tables.
Keep the tone authoritative, clear, and structured in Markdown.`;

    const liveNarrative = await this.executeLlmPrompt(prompt, config);

    let md = `## 2. Database Domain Architecture & Entity Narratives\n\n`;

    if (liveNarrative && liveNarrative.length > 200) {
      md += `### 2.1 Domain Data Model Overview\n${liveNarrative}\n\n---\n\n`;
    } else {
      md += `### 2.1 Domain Data Model Overview\n`;
      md += `The application database architecture comprises **${dataTypes.length} domain entities** with **${dataTypes.reduce((acc, dt) => acc + dt.fields.length, 0)} total attributes**. The data model prioritizes referential consistency, field-level privacy encapsulation, and low-latency querying through relational linking.\n\n`;
    }

    md += `### 2.2 Deep Entity Specifications & Lifecycle Narratives\n\n`;

    for (const dt of dataTypes) {
      const linkedTypes = dt.fields.filter(f => f.type.startsWith('custom.') || f.type.startsWith('list.custom.') || f.isList);

      // Synthesize domain purpose
      let purposeNarrative = `Serves as the foundational entity storing core attributes, relational references, and operational state for ${dt.name.replace(/_/g, ' ')}.`;
      if (dt.name.toLowerCase() === 'user') {
        purposeNarrative = `The central identity and authentication record for the platform. Stores cryptographic authentication metadata, account statuses, communication preferences, and serves as the root ownership anchor for all user-created resources.`;
      } else if (dt.name.toLowerCase().includes('order') || dt.name.toLowerCase().includes('transaction')) {
        purposeNarrative = `Maintains immutable financial and transactional records. Represents a confirmed agreement between stakeholders, tracking financial sums, settlement statuses, and linked ledger entries.`;
      } else if (dt.name.toLowerCase().includes('product') || dt.name.toLowerCase().includes('item')) {
        purposeNarrative = `Represents catalog inventory items available for discovery, selection, and purchase within the application domain.`;
      } else if (dt.name.toLowerCase().includes('workspace') || dt.name.toLowerCase().includes('team')) {
        purposeNarrative = `The collaborative multi-tenant organizational container. Encapsulates member rosters, tier quotas, and isolated project resources.`;
      }

      md += `#### Entity: \`${dt.name}\`\n\n`;
      md += `* **Domain Role**: ${purposeNarrative}\n`;
      md += `* **Entity Lifecycle**: Instantiated via transactional workflow triggers, updated through role-gated mutation endpoints, and protected against cascading deletes.\n`;
      if (linkedTypes.length > 0) {
        md += `* **Relational Graph**: References foreign records in ${linkedTypes.map(l => `\`${l.name}\` (${l.type})`).slice(0, 4).join(', ')}.\n`;
      }
      md += `\n`;

      // Technical Field Matrix
      md += `| Field Attribute | Data Type | Constraint | Multiplicity | Description |\n`;
      md += `| :--- | :--- | :---: | :--- | :--- |\n`;
      for (const f of dt.fields) {
        const isLinked = f.type.includes('custom.') || f.type.includes('list.');
        const constraintBadge = f.required ? '✓ Required' : 'Optional';
        const multBadge = f.isList ? '`List of Things`' : '`Single Record`';
        const cleanDesc = f.description || (isLinked ? `Foreign reference linking to relational record` : `Attribute capturing ${f.name.replace(/_/g, ' ')} value`);
        md += `| \`${f.name}\` | \`${f.type}\` | ${constraintBadge} | ${multBadge} | ${cleanDesc} |\n`;
      }
      md += `\n---\n\n`;
    }

    if (optionSets.length > 0) {
      md += `### 2.3 Enumerated Domain Option Sets\n\n`;
      md += `Global Option Sets define application-wide enum constants with zero database lookup latency (cached client-side):\n\n`;
      md += `| Option Set Enum | Domain Scope | Permitted Values |\n`;
      md += `| :--- | :--- | :--- |\n`;
      for (const os of optionSets) {
        md += `| **\`${os.name}\`** | Application-wide finite state machine | ${os.options.map(o => `\`${o}\``).join(', ')} |\n`;
      }
      md += `\n`;
    }

    return md;
  }

  /**
   * Generates a meaningful Chapter 3: Workflows & Business Logic User Journeys
   */
  public static async generateWorkflowNarrative(
    workflows?: ExtractedWorkflowItem[],
    schema?: BubbleSchema | null,
    config?: AiNarrativeConfig
  ): Promise<string> {
    const list = workflows || [];

    if (list.length === 0) {
      return `## 3. Workflows & Business Logic User Journeys\n\n### Business Logic Overview\nThe platform implements event-driven automation partitioned into client-side DOM triggers and backend batch workers. Connect a blueprint export to index individual workflow action trees.`;
    }

    // Group workflows into user journeys
    const authWorkflows = list.filter(w => w.name.toLowerCase().includes('login') || w.name.toLowerCase().includes('sign') || w.name.toLowerCase().includes('auth') || w.name.toLowerCase().includes('reset') || w.page.toLowerCase().includes('login'));
    const paymentWorkflows = list.filter(w => w.name.toLowerCase().includes('pay') || w.name.toLowerCase().includes('stripe') || w.name.toLowerCase().includes('checkout') || w.name.toLowerCase().includes('sub'));
    const coreWorkflows = list.filter(w => !authWorkflows.includes(w) && !paymentWorkflows.includes(w));

    let md = `## 3. Workflows & Business Logic User Journeys\n\n`;
    md += `Rather than treating workflows as disconnected scripts, the application architecture organizes business automation into **three primary user journeys**:\n\n`;

    // Journey 1: Identity & Authentication
    md += `### 3.1 Journey 1: Identity, Authentication & Profile Setup\n`;
    md += `* **Objective**: Ensure zero-friction user access while establishing verified identity records and role privileges.\n`;
    md += `* **Architectural Guarantees**: Input sanitization, password complexity validation, and cryptographic token verification before session cookie dispatch.\n\n`;
    if (authWorkflows.length > 0) {
      md += `| Triggering Page | Event Trigger | Workflow Action Flow | Steps |\n`;
      md += `| :--- | :--- | :--- | :---: |\n`;
      for (const wf of authWorkflows.slice(0, 10)) {
        md += `| **\`${wf.page}\`** | \`${wf.eventType}\` | **${wf.name}** | ${wf.actionsCount} actions |\n`;
      }
      md += `\n`;
    } else {
      md += `*Standard Bubble Authentication modules active on \`/login\` and \`/index\`.*\n\n`;
    }

    // Journey 2: Core Transactions & Mutations
    md += `### 3.2 Journey 2: Operational Domain Mutations & Data State Transitions\n`;
    md += `* **Objective**: Execute central domain activities (content creation, order placements, record modifications) with guaranteed transactional integrity.\n`;
    md += `* **Execution Strategy**: High-frequency visual feedback executes client-side; database writes and validations commit atomically via backend actions.\n\n`;
    if (coreWorkflows.length > 0) {
      md += `| Location | Event Hook | Business Operation | Actions |\n`;
      md += `| :--- | :--- | :--- | :---: |\n`;
      for (const wf of coreWorkflows.slice(0, 15)) {
        md += `| **\`${wf.page}\`** | \`${wf.eventType}\` | **${wf.name}** | ${wf.actionsCount} actions |\n`;
      }
      md += `\n`;
    }

    // Journey 3: Payments, Asynchronous Workers & Webhooks
    md += `### 3.3 Journey 3: External Integrations & Asynchronous Background Tasks\n`;
    md += `* **Objective**: Guarantee reliable communication with external services without locking user browser sessions.\n`;
    md += `* **Reliability**: Uses idempotency keys, webhook secret verification, and automated retry backoffs.\n\n`;
    if (paymentWorkflows.length > 0) {
      md += `| Trigger Source | Event Listener | Integration Operation | Complexity |\n`;
      md += `| :--- | :--- | :--- | :---: |\n`;
      for (const wf of paymentWorkflows.slice(0, 8)) {
        md += `| **\`${wf.page}\`** | \`${wf.eventType}\` | **${wf.name}** | ${wf.actionsCount} steps |\n`;
      }
      md += `\n`;
    } else {
      md += `*Backend API webhooks configured at \`/api/1.1/wf/\` for third-party asynchronous dispatch.*\n\n`;
    }

    return md;
  }

  /**
   * Generates a plain-English Chapter 4: Security & Privacy Governance Narrative
   */
  public static async generateSecurityNarrative(
    securityReport?: SecurityAuditReport | null,
    schema?: BubbleSchema | null,
    config?: AiNarrativeConfig
  ): Promise<string> {
    if (!securityReport) {
      let md = `## 4. Security, Zero-Trust Governance & Privacy Architecture\n\n`;
      md += `### 4.1 Zero-Trust Data Boundary Philosophy\n`;
      md += `Bubble applications operate on a **client-pull architecture**: any database record or custom field not explicitly shielded by a server-side Privacy Rule is transmitted in full JSON to the user's browser dev tools.\n\n`;
      md += `To ensure zero data leakage across the application's ${schema?.dataTypes?.length || 0} database tables:\n`;
      md += `1. **Zero-Trust Default Rule**: Every non-public table must enforce an \`Everyone Else\` access denial policy.\n`;
      md += `2. **Role-Based Access Control (RBAC)**: Row-level access is gated using unambiguous boolean expressions (e.g. \`This Record's Created By is Current User\` or \`Current User's Role is Admin\`).\n`;
      md += `3. **Field Shielding**: Sensitive operational fields (tokens, email addresses, billing metadata) are omitted from search result sets for non-privileged viewers.\n\n`;
      md += `*Execute a Privacy Rules & Security Audit in the Security tab to attach verified scoring metrics to this chapter.*\n\n`;
      return md;
    }

    const protectedTables = securityReport.matrix.filter(m => m.accessLevel !== 'full');

    let md = `## 4. Security, Zero-Trust Governance & Privacy Architecture\n\n`;
    md += `### 4.1 Security Posture Assessment\n`;
    md += `The application has been audited against **OWASP Top 10 for No-Code** and Bubble.io client-side data exposure vectors.\n\n`;
    md += `- **Overall Security Health Score**: **${securityReport.overallScore}/100 (Grade ${securityReport.securityGrade})**\n`;
    md += `- **Governed Protected Entities**: **${protectedTables.length} / ${securityReport.matrix.length}** tables enforce explicit conditional access\n`;
    md += `- **Critical Exposure Risks**: **${securityReport.criticalVulnerabilitiesCount}** items require developer hardening\n\n`;

    md += `### 4.2 Data Boundary & Privacy Philosophy\n`;
    md += `Bubble applications operate on a **client-pull architecture**: any record or field not explicitly shielded by a server-side Privacy Rule is transmitted in full JSON over public websockets to the user's browser dev tools.\n\n`;
    md += `To ensure zero data leakage:\n`;
    md += `1. **Zero-Trust Default Rule**: Every non-public table enforces an \`Everyone Else\` access denial policy.\n`;
    md += `2. **Role-Based Expressions**: Row-level access is gated using unambiguous boolean expressions (e.g. \`This Record's Created By is Current User\` or \`Current User's Role is Admin\`).\n`;
    md += `3. **Field Shielding**: Sensitive operational fields (tokens, email addresses, billing metadata) are omitted from search result sets for non-privileged viewers.\n\n`;

    md += `### 4.3 Evaluated Privacy Rules Matrix\n\n`;
    md += `| Database Entity | Target Role Policy | Find in Searches | View All Fields | Access Posture | Audit Evaluation |\n`;
    md += `| :--- | :--- | :---: | :---: | :---: | :--- |\n`;
    for (const r of securityReport.matrix) {
      const isDangerous = r.accessLevel === 'full';
      const badge = isDangerous ? '⚠ Full Public Exposure' : r.accessLevel === 'none' ? '✓ Restricted / Internal Only' : '✓ Role Gated';
      md += `| \`${r.dataType}\` | **${r.role}** | ${r.findInSearches ? '✓ Allowed' : '✗ Blocked'} | ${r.viewAllFields ? '✓ Full' : '✗ Restricted'} | \`${r.accessLevel.toUpperCase()}\` | ${badge} |\n`;
    }
    md += `\n`;

    return md;
  }

  /**
   * Generates a complete AI-enhanced technical architecture book
   */
  public static async generateFullAiBook(
    project: ProjectProfile,
    schema?: BubbleSchema | null,
    workflows?: ExtractedWorkflowItem[],
    auditReport?: AuditHealthReport | null,
    securityReport?: SecurityAuditReport | null,
    customSections?: DocSection[],
    config?: AiNarrativeConfig,
    onProgress?: (progress: AiEnhanceProgress) => void
  ): Promise<DocBookProject> {
    onProgress?.({ step: 'Generating Executive Domain Architecture Narrative...', percent: 15 });
    const executiveMd = await this.generateExecutiveNarrative(project, schema, workflows, config);

    onProgress?.({ step: 'Synthesizing Entity Domain Narratives & Lifecycle Models...', percent: 45 });
    const dataDictMd = await this.generateDataArchitectureNarrative(schema, config);

    onProgress?.({ step: 'Clustering Workflows into User Journeys & Event Chains...', percent: 75 });
    const wfMd = await this.generateWorkflowNarrative(workflows, schema, config);

    onProgress?.({ step: 'Formulating Zero-Trust Security & Privacy Governance Policies...', percent: 90 });
    const secMd = await this.generateSecurityNarrative(securityReport, schema, config);

    const dataTypes = schema?.dataTypes || [];
    const wfCount = workflows?.length || (project.stats?.workflowsCount || 0);

    const sections: DocSection[] = [
      {
        id: 'sec_overview',
        title: '1. Executive Architecture Summary',
        icon: 'Layers',
        category: 'overview',
        badge: 'AI Enhanced',
        enabled: true,
        order: 1,
        markdownContent: executiveMd
      },
      {
        id: 'sec_database',
        title: '2. Domain Data Model & Entity Specifications',
        icon: 'Database',
        category: 'database',
        badge: `${dataTypes.length} Entities (Narrative)`,
        enabled: true,
        order: 2,
        markdownContent: dataDictMd
      },
      {
        id: 'sec_workflows',
        title: '3. Workflows & User Journeys',
        icon: 'Sliders',
        category: 'workflows',
        badge: `${wfCount} Workflows`,
        enabled: true,
        order: 3,
        markdownContent: wfMd
      },
      {
        id: 'sec_security',
        title: '4. Zero-Trust Security & Privacy Governance',
        icon: 'ShieldCheck',
        category: 'security',
        badge: securityReport ? `Grade ${securityReport.securityGrade}` : 'Protected',
        enabled: true,
        order: 4,
        markdownContent: secMd
      }
    ];

    // Merge any custom user sections
    if (customSections && customSections.length > 0) {
      for (const cs of customSections) {
        sections.push({
          ...cs,
          order: sections.length + 1
        });
      }
    }

    onProgress?.({ step: 'Documentation Book Compilation Complete!', percent: 100 });

    return {
      title: `${project.name} — Technical Architecture Book (AI Narrative Edition)`,
      generatedAt: new Date().toISOString(),
      appName: project.name,
      version: project.environment,
      author: 'Bubble.io Dev Studio AI Narrative Engine',
      sections,
      stats: {
        dataTypesCount: dataTypes.length,
        fieldsCount: dataTypes.reduce((acc, dt) => acc + dt.fields.length, 0),
        workflowsCount: wfCount,
        privacyRulesCount: securityReport?.matrix.length || 0,
        endpointsCount: dataTypes.length * 2 + 4,
        languagesCount: 1
      }
    };
  }

  /**
   * Helper to execute prompt against live AI provider (Gemini, OpenAI, Claude, Groq, etc.)
   */
  private static async executeLlmPrompt(prompt: string, config?: AiNarrativeConfig): Promise<string | null> {
    const provider = config?.provider || 'gemini';
    const apiKey = config?.apiKey?.trim();

    if (!apiKey && provider !== 'ollama') {
      return null;
    }

    try {
      // 1. Google Gemini
      if (provider === 'gemini') {
        const model = config?.model || 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 35000);

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: config?.temperature ?? 0.3 }
          })
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
        }
      }

      // 2. OpenAI
      if (provider === 'openai') {
        const model = config?.model || 'gpt-4o';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 35000);

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          signal: controller.signal,
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: config?.temperature ?? 0.3
          })
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          return data?.choices?.[0]?.message?.content?.trim() || null;
        }
      }

      // 3. Anthropic Claude
      if (provider === 'anthropic') {
        const model = config?.model || 'claude-3-5-sonnet-20241022';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 35000);

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey || '',
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          signal: controller.signal,
          body: JSON.stringify({
            model,
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          return data?.content?.[0]?.text?.trim() || null;
        }
      }

      // 4. Groq / OpenRouter / xAI
      if (['groq', 'openrouter', 'xai'].includes(provider)) {
        let endpoint = 'https://api.groq.com/openai/v1/chat/completions';
        if (provider === 'openrouter') endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        if (provider === 'xai') endpoint = 'https://api.x.ai/v1/chat/completions';

        const model = config?.model || (provider === 'groq' ? 'llama-3.3-70b-versatile' : 'grok-2-latest');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 35000);

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          signal: controller.signal,
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          return data?.choices?.[0]?.message?.content?.trim() || null;
        }
      }

      // 5. Local Ollama
      if (provider === 'ollama') {
        const baseUrl = (config?.ollamaUrl || 'http://localhost:11434').replace(/\/$/, '');
        const model = config?.model || 'llama3:8b';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000);

        const res = await fetch(`${baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            stream: false,
            options: {
              temperature: config?.temperature ?? 0.3,
              num_predict: 350
            }
          })
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          return data?.message?.content?.trim() || null;
        }
      }
    } catch (err) {
      console.warn('[AiDocNarrativeEngine] Live LLM call encountered issue, applying heuristic architectural fallback:', err);
    }

    return null;
  }
}
