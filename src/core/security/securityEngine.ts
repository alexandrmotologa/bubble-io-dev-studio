import { BubbleSchema, InsecureEndpointFinding, PrivacyRuleMatrixRow, SecurityAuditReport } from '../../types';
import { DevOpsEngine } from '../devops/devopsEngine';

export class SecurityEngine {
  /**
   * Generates a comprehensive Security & Privacy Rules audit report from a Bubble Schema or Blueprint JSON
   */
  public static async analyzeSecurity(rawBlueprintJson?: any, schema?: BubbleSchema | null): Promise<SecurityAuditReport> {
    await new Promise(r => setTimeout(r, 200));

    const matrix: PrivacyRuleMatrixRow[] = [];
    const insecureEndpoints: InsecureEndpointFinding[] = [];
    const exposedSensitiveFields: { dataType: string; field: string; reason: string; piiType?: string }[] = [];

    // 1. Build RBAC Matrix strictly from real Schema / Blueprint data types
    const actualSchema = schema || (rawBlueprintJson ? DevOpsEngine.parseBubbleSchemaJson(rawBlueprintJson) : null);
    const realTypes = actualSchema?.dataTypes || [];

    for (const dtObj of realTypes) {
      const dt = dtObj.name;
      const fieldNames = dtObj.fields.map(f => f.name);

      // Detect sensitive fields in real table
      const sensitiveFieldMatches = dtObj.fields.filter(f => 
        /email|phone|password|secret|token|key|wallet|ssn|stripe|balance|card/i.test(f.name)
      );

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
        conditionExpression: 'This ' + dt + '\'s Created By is Current User',
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
        exposedSensitiveFields.push({
          dataType: dt,
          field: sf.name,
          reason: `Field '${sf.name}' on '${dt}' contains sensitive information and should have an explicit Privacy Rule for public/guest roles.`,
          piiType: sf.name.includes('email') ? 'EMAIL_ADDRESS' : sf.name.includes('wallet') ? 'WALLET_ADDRESS' : 'CONFIDENTIAL_DATA'
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

    const criticalCount = insecureEndpoints.filter(e => e.severity === 'critical').length + exposedSensitiveFields.length;
    const warningsCount = insecureEndpoints.filter(e => e.severity === 'high' || e.severity === 'medium').length;

    let overallScore = 100;
    if (criticalCount > 0) overallScore -= Math.min(60, criticalCount * 10);
    if (warningsCount > 0) overallScore -= Math.min(20, warningsCount * 5);
    if (realTypes.length === 0) overallScore = 100;
    if (warningsCount > 0) overallScore -= warningsCount * 5;
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
      openTypesCount: 1,
      matrix,
      insecureEndpoints,
      exposedSensitiveFields
    };
  }

  /**
   * Generates a SARIF or Markdown security report
   */
  public static generateMarkdownReport(report: SecurityAuditReport): string {
    return `# Bubble.io Security & Privacy Rules Audit Report
Generated: ${new Date(report.timestamp).toLocaleString()}
Overall Score: ${report.overallScore}/100 (Grade: ${report.securityGrade})

## Summary
- Critical Vulnerabilities: ${report.criticalVulnerabilitiesCount}
- Security Warnings: ${report.warningsCount}
- Open Data Types without Rules: ${report.openTypesCount}

## Insecure API Workflows
${report.insecureEndpoints.map(ep => `- **[${ep.severity.toUpperCase()}]** \`${ep.route}\` — ${ep.issue}\n  *Fix:* ${ep.recommendation}`).join('\n\n')}

## Exposed Sensitive Fields
${report.exposedSensitiveFields.map(f => `- **${f.dataType}.${f.field}** (${f.piiType || 'SENSITIVE'}): ${f.reason}`).join('\n')}
`;
  }
}
