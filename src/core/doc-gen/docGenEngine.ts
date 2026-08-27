import { AuditHealthReport, BubbleSchema, DocBookProject, DocSection, ProjectProfile, SecurityAuditReport } from '../../types';
import { DevOpsEngine } from '../devops/devopsEngine';
import { BubbleExtractor } from '../translator/bubbleExtractor';

export class DocGenEngine {
  /**
   * Compiles a comprehensive Developer Documentation Book from all studio modules
   */
  public static generateDocumentationBook(
    project: ProjectProfile,
    schema?: BubbleSchema | null,
    auditReport?: AuditHealthReport | null,
    securityReport?: SecurityAuditReport | null
  ): DocBookProject {
    const rawBlueprint = project.blueprintExportJson;
    const actualSchema = schema || (rawBlueprint ? DevOpsEngine.parseBubbleSchemaJson(rawBlueprint, project) : null);
    const dataTypes = actualSchema?.dataTypes || [];
    const optionSets = actualSchema?.optionSets || [];
    const strings = rawBlueprint ? BubbleExtractor.extractFromBubbleJson(rawBlueprint) : [];

    const sections: DocSection[] = [];

    // 1. Overview Section
    sections.push({
      id: 'sec_overview',
      title: '1. Executive Summary & Application Overview',
      icon: 'Layers',
      category: 'overview',
      badge: 'Core',
      markdownContent: `## ${project.name} — Technical Architecture Specification

- **Application Name**: \`${project.name}\`
- **Bubble App Identifier**: \`${project.appId}\`
- **Environment**: \`${project.environment}\`
- **Custom Domain**: \`${project.customDomain || 'Default bubbleapps.io domain'}\`
- **Generated At**: \`${new Date().toUTCString()}\`

### Architectural Summary
This document serves as the authoritative source of truth for the database architecture, privacy rules, API contracts, workflow logic, and localization matrices for **${project.name}**.

| Metric | Specification Count |
| :--- | :--- |
| **Database Data Types** | ${dataTypes.length} tables |
| **Option Sets** | ${optionSets.length} sets |
| **Localized UI Strings** | ${strings.length} keys |
| **AST Health Score** | ${auditReport ? `${auditReport.score}% (Grade ${auditReport.grade})` : 'Audit Ready'} |
`
    });

    // 2. Data Dictionary Section
    let dataDictMd = `## 2. Database Schema & Data Dictionary\n\n`;
    if (dataTypes.length === 0) {
      dataDictMd += `*No database schema loaded yet. Connect your Bubble Data API or import a .bubble blueprint to populate the Data Dictionary.*\n`;
    } else {
      for (const dt of dataTypes) {
        dataDictMd += `### Table: \`${dt.name}\`\n\n`;
        dataDictMd += `| Field Name | Type | Required | Description |\n`;
        dataDictMd += `| :--- | :--- | :---: | :--- |\n`;
        for (const f of dt.fields) {
          dataDictMd += `| \`${f.name}\` | \`${f.type}\` | ${f.required ? '✓' : '-'} | ${f.description || '-'} |\n`;
        }
        dataDictMd += `\n`;
      }
    }

    if (optionSets.length > 0) {
      dataDictMd += `### Global Option Sets (${optionSets.length})\n\n`;
      for (const os of optionSets) {
        dataDictMd += `- **${os.name}**: ${os.options.map((o: string) => `\`${o}\``).join(', ')}\n`;
      }
    }

    sections.push({
      id: 'sec_database',
      title: '2. Data Dictionary & Field Specifications',
      icon: 'Database',
      category: 'database',
      badge: `${dataTypes.length} Tables`,
      markdownContent: dataDictMd
    });

    // 3. ERD & Entity Relationships
    let erdMd = `## 3. Entity-Relationship Diagram (ERD)\n\n\`\`\`mermaid\n`;
    if (actualSchema && dataTypes.length > 0) {
      erdMd += DevOpsEngine.generateMermaidERD(actualSchema);
    } else {
      erdMd += `erDiagram\n    %% Connect your project to generate Mermaid ERD`;
    }
    erdMd += `\n\`\`\`\n`;

    sections.push({
      id: 'sec_erd',
      title: '3. Entity-Relationship Diagram (ERD)',
      icon: 'GitBranch',
      category: 'database',
      markdownContent: erdMd
    });

    // 4. Privacy Rules & Security Matrix
    let secMd = `## 4. Role-Based Access Control (RBAC) & Privacy Rules\n\n`;
    if (securityReport) {
      secMd += `- **Overall Security Score**: **${securityReport.overallScore}/100 (Grade ${securityReport.securityGrade})**\n`;
      secMd += `- **Critical Vulnerabilities**: **${securityReport.criticalVulnerabilitiesCount}**\n\n`;

      secMd += `| Data Type | Role | Find in Searches | View All Fields | Access Level |\n`;
      secMd += `| :--- | :--- | :---: | :---: | :--- |\n`;
      for (const r of securityReport.matrix) {
        secMd += `| \`${r.dataType}\` | **${r.role}** | ${r.findInSearches ? '✓' : '✗'} | ${r.viewAllFields ? '✓' : '✗'} | \`${r.accessLevel.toUpperCase()}\` |\n`;
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
      markdownContent: secMd
    });

    // 5. API & Backend Workflows Catalog
    let apiMd = `## 5. API Endpoints & Backend Workflows Catalog\n\n`;
    apiMd += `### Standard Data API Endpoints\n`;
    apiMd += `Base URL: \`https://${project.customDomain || `${project.appId}.bubbleapps.io`}/${project.environment}/api/1.1/obj/\`\n\n`;
    for (const dt of dataTypes) {
      const cleanType = dt.name.toLowerCase();
      apiMd += `- **GET / POST** \`/api/1.1/obj/${cleanType}\` — Query or create \`${dt.name}\` records\n`;
      apiMd += `- **GET / PATCH / DELETE** \`/api/1.1/obj/${cleanType}/[id]\` — Read, update, or purge specific \`${dt.name}\`\n`;
    }

    sections.push({
      id: 'sec_api',
      title: '5. API Endpoints & Backend Workflows',
      icon: 'Radio',
      category: 'api',
      markdownContent: apiMd
    });

    // 6. Localization Status
    let locMd = `## 6. AI Localization & Multi-Language Status\n\n`;
    locMd += `Total extracted strings: **${strings.length}**\n\n`;
    locMd += `| Category | Key Sample | Source Text |\n`;
    locMd += `| :--- | :--- | :--- |\n`;
    for (const s of strings.slice(0, 15)) {
      locMd += `| \`${s.category}\` | \`${s.key}\` | ${s.sourceText} |\n`;
    }

    sections.push({
      id: 'sec_localization',
      title: '6. AI Localization & Language Matrix',
      icon: 'Languages',
      category: 'localization',
      badge: `${strings.length} Strings`,
      markdownContent: locMd
    });

    // 7. AST Code Health & Dead Code
    let auditMd = `## 7. AST Code Health & Dead Code Diagnostics\n\n`;
    if (auditReport) {
      auditMd += `- **Health Score**: **${auditReport.score}% (Grade ${auditReport.grade})**\n`;
      auditMd += `- **Detected Dead Code Items**: **${auditReport.deadItems.length}**\n\n`;

      if (auditReport.deadItems.length > 0) {
        auditMd += `| Type | Name | Severity | Detection Reason |\n`;
        auditMd += `| :--- | :--- | :---: | :--- |\n`;
        for (const item of auditReport.deadItems) {
          auditMd += `| \`${item.type}\` | **${item.name}** | \`${item.severity}\` | ${item.reason} |\n`;
        }
      }
    } else {
      auditMd += `*Run an AST audit in the Dead Code Health tab to calculate code metrics.*\n`;
    }

    sections.push({
      id: 'sec_audit',
      title: '7. AST Code Health & Quality Scorecard',
      icon: 'Stethoscope',
      category: 'quality',
      markdownContent: auditMd
    });

    return {
      title: `${project.name} — Technical Architecture Book`,
      generatedAt: new Date().toISOString(),
      appName: project.name,
      version: project.environment,
      author: 'Bubble.io Dev Studio Automation',
      sections,
      stats: {
        dataTypesCount: dataTypes.length,
        fieldsCount: dataTypes.reduce((acc, dt) => acc + dt.fields.length, 0),
        workflowsCount: project.stats?.workflowsCount || 0,
        privacyRulesCount: securityReport?.matrix.length || 0,
        endpointsCount: dataTypes.length * 2,
        languagesCount: 1
      }
    };
  }

  /**
   * Compiles the entire doc book into a single GitHub-Flavored Markdown file
   */
  public static exportToMarkdown(docBook: DocBookProject): string {
    let md = `# ${docBook.title}\n\n`;
    md += `> **Generated on**: ${new Date(docBook.generatedAt).toUTCString()}  \n`;
    md += `> **Environment**: \`${docBook.version}\`  \n`;
    md += `> **App**: \`${docBook.appName}\`  \n\n---\n\n`;

    for (const sec of docBook.sections) {
      md += `${sec.markdownContent}\n\n---\n\n`;
    }

    return md;
  }

  /**
   * Compiles the doc book into a standalone, styled, single-page HTML document
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
      --bg: #0b0f19;
      --card-bg: #111827;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --primary: #6366f1;
      --border: rgba(255, 255, 255, 0.1);
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 40px 20px;
      margin: 0;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: var(--card-bg);
      padding: 40px;
      border-radius: 16px;
      border: 1px solid var(--border);
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    h1, h2, h3, h4 { color: #fff; font-weight: 700; }
    h1 { border-bottom: 2px solid var(--primary); padding-bottom: 12px; }
    h2 { margin-top: 32px; border-bottom: 1px solid var(--border); padding-bottom: 8px; color: var(--primary); }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 0.9rem; }
    th, td { padding: 10px 14px; text-align: left; border: 1px solid var(--border); }
    th { background: rgba(99, 102, 241, 0.15); color: #fff; }
    code { background: rgba(99, 102, 241, 0.2); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.85em; color: #a5b4fc; }
    blockquote { border-left: 4px solid var(--primary); padding: 8px 16px; background: rgba(255,255,255,0.03); margin: 20px 0; }
    hr { border: 0; height: 1px; background: var(--border); margin: 30px 0; }
    @media print {
      body { background: #fff; color: #000; padding: 0; }
      .container { border: none; box-shadow: none; padding: 0; }
      th { background: #f0f0f0; color: #000; }
      code { color: #000; background: #eee; }
    }
  </style>
</head>
<body>
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
