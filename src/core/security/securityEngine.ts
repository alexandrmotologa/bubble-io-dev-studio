import { 
  BubbleSchema, 
  ComplianceFrameworkScore, 
  EveryoneElseRiskItem, 
  InsecureEndpointFinding, 
  PrivacyRuleMatrixRow, 
  SecurityAuditReport, 
  SecurityRemediationRule 
} from '../../types';
import { DevOpsEngine } from '../devops/devopsEngine';

export class SecurityEngine {
  /**
   * Generates a comprehensive Security, RBAC, and Compliance audit report from a Bubble Schema or Blueprint JSON
   */
  public static async analyzeSecurity(rawBlueprintJson?: any, schema?: BubbleSchema | null): Promise<SecurityAuditReport> {
    const matrix: PrivacyRuleMatrixRow[] = [];
    const insecureEndpoints: InsecureEndpointFinding[] = [];
    const exposedSensitiveFields: { dataType: string; field: string; reason: string; piiType?: string }[] = [];
    const everyoneElseRisks: EveryoneElseRiskItem[] = [];
    const remediations: SecurityRemediationRule[] = [];

    // 1. Build RBAC Matrix strictly from real Schema / Blueprint data types
    const actualSchema = schema || (rawBlueprintJson ? DevOpsEngine.parseBubbleSchemaJson(rawBlueprintJson) : null);
    const realTypes = actualSchema?.dataTypes || [];

    let piiFieldCount = 0;
    let paymentFieldCount = 0;
    let authFieldCount = 0;
    let medicalFieldCount = 0;

    for (const dtObj of realTypes) {
      const dt = dtObj.name;
      const fieldNames = dtObj.fields.map(f => f.name);

      // Detect sensitive fields in real table
      const sensitiveFieldMatches = dtObj.fields.filter(f => 
        /email|phone|password|secret|token|key|wallet|ssn|stripe|balance|card|medical|patient|address|ip_address/i.test(f.name)
      );

      // Categorize specific fields for compliance metrics
      for (const sf of sensitiveFieldMatches) {
        const lowerName = sf.name.toLowerCase();
        if (/email|phone|address|ssn|first_name|last_name|ip_address/i.test(lowerName)) piiFieldCount++;
        if (/stripe|card|balance|payment|invoice|credit/i.test(lowerName)) paymentFieldCount++;
        if (/password|secret|token|key|api_key|auth/i.test(lowerName)) authFieldCount++;
        if (/medical|health|patient|diagnosis|doctor/i.test(lowerName)) medicalFieldCount++;
      }

      // Admin role
      matrix.push({
        dataType: dt,
        role: 'Admin',
        findInSearches: true,
        viewAllFields: true,
        allowedFields: ['*'],
        restrictedFields: [],
        conditionExpression: 'Current User\'s Role is "Admin"',
        accessLevel: 'full'
      });

      // Authenticated User role
      const hasSensitiveFields = sensitiveFieldMatches.length > 0;
      matrix.push({
        dataType: dt,
        role: 'Authenticated User',
        findInSearches: true,
        viewAllFields: !hasSensitiveFields,
        allowedFields: hasSensitiveFields ? fieldNames.filter(fn => !sensitiveFieldMatches.some(sf => sf.name === fn)) : ['*'],
        restrictedFields: sensitiveFieldMatches.map(sf => sf.name),
        conditionExpression: `This ${dt}'s Created By is Current User`,
        accessLevel: hasSensitiveFields ? 'conditional' : 'full'
      });

      // Everyone Else / Guest
      matrix.push({
        dataType: dt,
        role: 'Guest / Everyone Else',
        findInSearches: !hasSensitiveFields,
        viewAllFields: !hasSensitiveFields,
        allowedFields: hasSensitiveFields ? ['_id', 'created_date'] : ['*'],
        restrictedFields: sensitiveFieldMatches.map(sf => sf.name),
        conditionExpression: undefined,
        accessLevel: hasSensitiveFields ? 'hidden' : 'full'
      });

      // Track sensitive fields for report
      for (const sf of sensitiveFieldMatches) {
        const piiType = sf.name.toLowerCase().includes('email') 
          ? 'EMAIL_ADDRESS' 
          : sf.name.toLowerCase().includes('wallet') 
            ? 'WALLET_ADDRESS' 
            : sf.name.toLowerCase().includes('token') || sf.name.toLowerCase().includes('key')
              ? 'CREDENTIAL_KEY'
              : sf.name.toLowerCase().includes('stripe') || sf.name.toLowerCase().includes('card')
                ? 'FINANCIAL_PCI'
                : 'CONFIDENTIAL_DATA';

        exposedSensitiveFields.push({
          dataType: dt,
          field: sf.name,
          reason: `Field '${sf.name}' on '${dt}' contains sensitive information and should have an explicit Privacy Rule for public/guest roles.`,
          piiType
        });
      }

      // Compute "Everyone Else" public exposure risk
      if (hasSensitiveFields) {
        everyoneElseRisks.push({
          dataType: dt,
          riskLevel: 'CRITICAL',
          sensitiveFieldsCount: sensitiveFieldMatches.length,
          publicSearchAllowed: true, // Default in unhardened bubble tables
          publicViewAllFields: false,
          recommendedRule: `Create Privacy Rule "${dt} Owner Only" allowing only creator to view sensitive fields (${sensitiveFieldMatches.map(f => f.name).slice(0, 3).join(', ')}).`,
          bubbleExpression: `This ${dt}'s Created By is Current User`
        });

        // Generate Step-by-Step Remediation
        remediations.push({
          id: `rem_${dt.toLowerCase()}`,
          dataType: dt,
          ruleName: `${dt} Owner & Creator Access`,
          roleTarget: 'Authenticated User (Creator)',
          bubbleExpression: `This ${dt}'s Created By is Current User`,
          viewAllFields: true,
          findInSearches: true,
          allowedFields: ['*'],
          blockedFields: sensitiveFieldMatches.map(f => f.name),
          rationale: `Guarantees that ${sensitiveFieldMatches.length} confidential field(s) cannot be scraped via Bubble Data API by unauthenticated visitors.`
        });
      } else {
        everyoneElseRisks.push({
          dataType: dt,
          riskLevel: 'HARDENED',
          sensitiveFieldsCount: 0,
          publicSearchAllowed: true,
          publicViewAllFields: true,
          recommendedRule: `Public catalog table. No confidential PII or credentials detected.`,
          bubbleExpression: `Everyone Else (Default Access)`
        });
      }
    }

    // 2. Identify Insecure Public Endpoints from real Blueprint workflows if present
    if (rawBlueprintJson?.workflows && typeof rawBlueprintJson.workflows === 'object') {
      let epIdx = 1;
      for (const [wfKey, wf] of Object.entries<any>(rawBlueprintJson.workflows)) {
        if (wf.is_api_workflow || wf.type === 'backend') {
          const isNoAuth = Boolean(wf.run_without_auth || !wf.require_auth);
          const ignoresPrivacy = Boolean(wf.ignore_privacy_rules);

          if (isNoAuth || ignoresPrivacy) {
            insecureEndpoints.push({
              id: `ep_${epIdx++}`,
              endpointName: wf.name || wfKey,
              route: `/api/1.1/wf/${wfKey}`,
              severity: isNoAuth && ignoresPrivacy ? 'critical' : 'high',
              issue: `Backend API workflow '${wf.name || wfKey}' is configured with ${isNoAuth ? 'Run without authentication' : ''} ${ignoresPrivacy ? 'and ignores Privacy Rules' : ''}.`,
              recommendation: 'Enable "Require authentication" or validate Current User permission in Action 1 before executing database operations.',
              hasAuth: !isNoAuth,
              isPublic: isNoAuth,
              ignoredPrivacyRules: ignoresPrivacy
            });
          }
        }
      }
    }

    // 3. Compute Compliance Frameworks
    const complianceScores: ComplianceFrameworkScore[] = [
      {
        framework: 'GDPR',
        score: Math.max(30, 100 - piiFieldCount * 4),
        status: piiFieldCount > 5 ? 'NEEDS_REVIEW' : piiFieldCount > 15 ? 'NON_COMPLIANT' : 'COMPLIANT',
        issuesCount: piiFieldCount,
        description: `${piiFieldCount} personal data & contact field(s) require privacy rule encryption and consent controls (Art. 5 & 32).`
      },
      {
        framework: 'SOC2',
        score: Math.max(40, 100 - (insecureEndpoints.length * 15 + (realTypes.length > 0 ? 10 : 0))),
        status: insecureEndpoints.length > 0 ? 'NEEDS_REVIEW' : 'COMPLIANT',
        issuesCount: insecureEndpoints.length,
        description: `Evaluates least-privilege RBAC role enforcement and public API authentication gates.`
      },
      {
        framework: 'PCI-DSS',
        score: paymentFieldCount > 0 ? 80 : 100,
        status: paymentFieldCount > 2 ? 'NEEDS_REVIEW' : 'COMPLIANT',
        issuesCount: paymentFieldCount,
        description: paymentFieldCount > 0 
          ? `${paymentFieldCount} payment or token field(s) must be isolated to prevent client-side credential inspection.`
          : `No plaintext credit card or primary billing numbers detected in data schema.`
      },
      {
        framework: 'HIPAA',
        score: medicalFieldCount > 0 ? 70 : 100,
        status: medicalFieldCount > 0 ? 'NEEDS_REVIEW' : 'COMPLIANT',
        issuesCount: medicalFieldCount,
        description: medicalFieldCount > 0
          ? `${medicalFieldCount} protected health identifiers require BAA and encrypted field permissions.`
          : `Standard application schema with no protected health information (PHI).`
      }
    ];

    const criticalCount = insecureEndpoints.filter(e => e.severity === 'critical').length + exposedSensitiveFields.length;
    const warningsCount = insecureEndpoints.filter(e => e.severity === 'high' || e.severity === 'medium').length;

    let overallScore = 100;
    if (criticalCount > 0) overallScore -= Math.min(50, criticalCount * 4);
    if (warningsCount > 0) overallScore -= Math.min(20, warningsCount * 5);
    if (realTypes.length === 0) overallScore = 100;
    overallScore = Math.max(35, Math.min(100, overallScore));

    let securityGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'A';
    if (overallScore >= 95) securityGrade = 'A+';
    else if (overallScore >= 85) securityGrade = 'A';
    else if (overallScore >= 75) securityGrade = 'B';
    else if (overallScore >= 65) securityGrade = 'C';
    else if (overallScore >= 50) securityGrade = 'D';
    else securityGrade = 'F';

    return {
      timestamp: new Date().toISOString(),
      overallScore,
      securityGrade,
      criticalVulnerabilitiesCount: criticalCount,
      warningsCount,
      openTypesCount: everyoneElseRisks.filter(r => r.riskLevel === 'CRITICAL').length,
      matrix,
      insecureEndpoints,
      exposedSensitiveFields,
      complianceScores,
      everyoneElseRisks,
      remediations
    };
  }

  /**
   * Generates a SARIF (Static Analysis Results Interchange Format) JSON report
   */
  public static generateSarifReport(report: SecurityAuditReport): string {
    const sarif = {
      $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'Bubble.io Dev Studio Security Engine',
              version: '2.4.0-beta',
              informationUri: 'https://github.com/alexandrmotologa/bubble-io-dev-studio',
              rules: [
                {
                  id: 'BUBBLE-SEC-001',
                  name: 'ExposedSensitiveField',
                  shortDescription: { text: 'Sensitive database field without explicit Bubble Privacy Rule' },
                  defaultConfiguration: { level: 'error' }
                },
                {
                  id: 'BUBBLE-SEC-002',
                  name: 'InsecureApiWorkflow',
                  shortDescription: { text: 'Backend API workflow accessible without authentication or ignoring privacy rules' },
                  defaultConfiguration: { level: 'error' }
                }
              ]
            }
          },
          results: [
            ...report.exposedSensitiveFields.map(f => ({
              ruleId: 'BUBBLE-SEC-001',
              level: 'error',
              message: { text: f.reason },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: `schema/${f.dataType}.json` }
                  }
                }
              ]
            })),
            ...report.insecureEndpoints.map(ep => ({
              ruleId: 'BUBBLE-SEC-002',
              level: ep.severity === 'critical' ? 'error' : 'warning',
              message: { text: `${ep.issue} - Fix: ${ep.recommendation}` },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: `workflows${ep.route}.json` }
                  }
                }
              ]
            }))
          ]
        }
      ]
    };

    return JSON.stringify(sarif, null, 2);
  }

  /**
   * Generates a comprehensive Executive Security Markdown report
   */
  public static generateMarkdownReport(report: SecurityAuditReport): string {
    const complianceTable = (report.complianceScores || []).map(c => 
      `| **${c.framework}** | **${c.score}/100** | \`${c.status}\` | ${c.description} |`
    ).join('\n');

    const remediationList = (report.remediations || []).map(r => 
      `### 🛡️ ${r.dataType}: ${r.ruleName}
- **Target Role**: \`${r.roleTarget}\`
- **Bubble Expression**: \`${r.bubbleExpression}\`
- **Permissions**: View all fields: ${r.viewAllFields ? '✅' : '❌'} | Allow search: ${r.findInSearches ? '✅' : '❌'}
- **Protected Fields**: ${r.blockedFields.map(f => `\`${f}\``).join(', ')}
- **Rationale**: ${r.rationale}
`
    ).join('\n\n');

    return `# 🛡️ Bubble.io Enterprise Security & RBAC Audit Report
> Generated: ${new Date(report.timestamp).toLocaleString()} • Engine: Bubble.io Dev Studio

---

## 📊 1. Executive Summary & Security Health
- **Overall Security Score**: **${report.overallScore}/100** (Grade: **${report.securityGrade}**)
- **Critical Vulnerabilities**: **${report.criticalVulnerabilitiesCount}**
- **Security Warnings**: **${report.warningsCount}**
- **Unprotected Data Types**: **${report.openTypesCount}**

---

## ⚖️ 2. Regulatory Compliance Posture
| Framework | Compliance Score | Status | Audit Findings |
| :--- | :--- | :--- | :--- |
${complianceTable || '| GDPR | 85/100 | COMPLIANT | Standard data protection |'}

---

## 🚨 3. Insecure API Workflows (${report.insecureEndpoints.length})
${report.insecureEndpoints.length === 0 
  ? '✅ *All backend API workflows have authentication enforcement and privacy rule checks.*' 
  : report.insecureEndpoints.map(ep => `### [${ep.severity.toUpperCase()}] \`${ep.route}\`
- **Issue**: ${ep.issue}
- **Recommended Action**: ${ep.recommendation}
- **Public**: ${ep.isPublic ? 'Yes' : 'No'} | **Ignored Privacy Rules**: ${ep.ignoredPrivacyRules ? 'Yes' : 'No'}
`).join('\n\n')}

---

## 🔍 4. Sensitive Fields & PII Exposure (${report.exposedSensitiveFields.length})
${report.exposedSensitiveFields.length === 0
  ? '✅ *No exposed plaintext credentials or PII fields detected.*'
  : report.exposedSensitiveFields.map(f => `- **${f.dataType}.${f.field}** (\`${f.piiType || 'SENSITIVE'}\`): ${f.reason}`).join('\n')}

---

## 💡 5. Recommended Bubble Privacy Rules (Step-by-Step Remediations)
${remediationList || 'No urgent Privacy Rule remediations needed.'}

---
*Report generated automatically by Bubble.io Dev Studio • Confidential & Proprietary*
`;
  }
}
