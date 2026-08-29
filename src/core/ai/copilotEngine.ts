import { BubbleSchema } from '../../types';

export interface RegexGenerationResult {
  pattern: string;
  flags: string;
  bubbleFormula: string;
  explanation: string;
  sampleMatches: string[];
  sampleNonMatches: string[];
}

export interface SearchQueryConstraint {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'is_empty' | 'is_not_empty';
  value: string;
  isDynamic: boolean;
}

export interface SearchQueryGenerationResult {
  targetType: string;
  constraints: SearchQueryConstraint[];
  sortField: string;
  sortDescending: boolean;
  bubbleExpression: string;
  apiConnectorQuery: string;
  wuCostImpact: 'low' | 'medium' | 'high';
  optimizationTips: string[];
}

export interface PrivacyRuleExplanationResult {
  roleName: string;
  plainEnglishSummary: string;
  canViewFields: string[];
  canSearchTable: boolean;
  canModifyFields: string[];
  potentialSecurityRisks: string[];
  recommendedFixes: string[];
}

export class CopilotEngine {
  /**
   * Generates a regular expression and Bubble formula from natural language prompt
   */
  public static async generateRegex(prompt: string): Promise<RegexGenerationResult> {
    await new Promise(r => setTimeout(r, 400));
    const p = prompt.toLowerCase();

    if (p.includes('email')) {
      return {
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        flags: 'i',
        bubbleFormula: `Input Email's value :extract with Regex (^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$):first item is not empty`,
        explanation: 'Matches standard RFC 5322 email addresses with alphanumeric usernames, domain names, and a top-level domain of 2+ characters.',
        sampleMatches: ['user@company.com', 'alex.dev@bubble-studio.io', 'support+tag@app.co'],
        sampleNonMatches: ['invalid-email', '@domain.com', 'user@domain']
      };
    }

    if (p.includes('phone') || p.includes('telefon') || p.includes('mobil')) {
      return {
        pattern: '^\\+?[1-9]\\d{1,14}$',
        flags: 'g',
        bubbleFormula: `Input Phone's value :extract with Regex (^\\+?[1-9]\\d{1,14}$):first item is not empty`,
        explanation: 'Matches international E.164 phone numbers with optional leading + and 2 to 15 digits.',
        sampleMatches: ['+14155552671', '+40722123456', '447911123456'],
        sampleNonMatches: ['000', '123-abc', '+01234567890123456']
      };
    }

    if (p.includes('slug') || p.includes('url') || p.includes('link') || p.includes('domain')) {
      return {
        pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
        flags: 'i',
        bubbleFormula: `Input Slug's value :extract with Regex (^[a-z0-9]+(?:-[a-z0-9]+)*$):first item is not empty`,
        explanation: 'Matches URL-friendly kebab-case slugs containing lowercase alphanumeric characters separated by single hyphens.',
        sampleMatches: ['product-v2-launch', 'bubble-dev-studio', 'blog-post-101'],
        sampleNonMatches: ['Product Slug', 'invalid--slug--', 'slug_with_underscores']
      };
    }

    if (p.includes('strong password') || p.includes('parola') || p.includes('password')) {
      return {
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
        flags: '',
        bubbleFormula: `Input Password's value :extract with Regex (^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$):first item is not empty`,
        explanation: 'Enforces minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&).',
        sampleMatches: ['P@ssw0rd2026!', 'BubblePro#99', 'Secure$Pass123'],
        sampleNonMatches: ['password', '12345678', 'NoSpecialChar1']
      };
    }

    // Generic pattern generator
    return {
      pattern: '^[A-Za-z0-9_ -]{3,64}$',
      flags: 'i',
      bubbleFormula: `Input's value :extract with Regex (^[A-Za-z0-9_ -]{3,64}$):first item is not empty`,
      explanation: `Generated custom pattern for '${prompt}' matching alphanumeric tokens with safe delimiters.`,
      sampleMatches: ['Valid_Input_123', 'Sample 456', 'CustomToken'],
      sampleNonMatches: ['##Invalid$$', 'x', '<script>alert(1)</script>']
    };
  }

  /**
   * Generates a structured Bubble "Do a search for" query from natural language
   */
  public static async generateSearchQuery(
    prompt: string,
    schema?: BubbleSchema | null
  ): Promise<SearchQueryGenerationResult> {
    await new Promise(r => setTimeout(r, 450));
    const p = prompt.toLowerCase();

    const availableTypes = schema?.dataTypes.map(dt => dt.name) || ['User', 'Order', 'Product', 'Transaction', 'Invoice'];
    let targetType = availableTypes.find(t => p.includes(t.toLowerCase())) || 'Order';

    const constraints: SearchQueryConstraint[] = [];
    let sortField = 'Created Date';
    let sortDescending = true;
    let wuCostImpact: 'low' | 'medium' | 'high' = 'low';
    const tips: string[] = [];

    if (p.includes('user') || targetType === 'User') {
      targetType = 'User';
      if (p.includes('active') || p.includes('paid')) {
        constraints.push({ field: 'is_active', operator: 'equals', value: 'yes', isDynamic: false });
      }
      if (p.includes('created') || p.includes('recent') || p.includes('last month') || p.includes('week')) {
        constraints.push({ field: 'Created Date', operator: 'greater_than', value: 'Current date/time +(days: -30)', isDynamic: true });
        wuCostImpact = 'medium';
      }
    } else if (p.includes('order') || p.includes('transaction') || p.includes('sales')) {
      targetType = 'Order';
      constraints.push({ field: 'status', operator: 'equals', value: '"completed"', isDynamic: false });
      constraints.push({ field: 'total_amount', operator: 'greater_than', value: '100', isDynamic: false });
      sortField = 'order_date';
      wuCostImpact = 'low';
    } else {
      constraints.push({ field: 'status', operator: 'equals', value: '"active"', isDynamic: false });
      constraints.push({ field: 'Created Date', operator: 'greater_than', value: 'Current date/time +(days: -7)', isDynamic: true });
    }

    if (constraints.length === 0) {
      wuCostImpact = 'high';
      tips.push('⚠️ Unconstrained Search Warning: Always specify at least one indexed filter (e.g. Created Date or Status) to reduce Workload Units.');
    } else {
      tips.push('✓ Server-side indexed constraints applied to minimize Bubble WU consumption.');
      tips.push('✓ Sorting on timestamp preserves database index performance.');
    }

    const constraintExpressions = constraints.map(c => `${c.field} ${c.operator === 'equals' ? '=' : '>'} ${c.value}`).join(', ');
    const bubbleExpression = `Do a search for ${targetType}s (${constraintExpressions || 'no constraints'}) :sorted by ${sortField} (descending = ${sortDescending ? 'yes' : 'no'})`;
    const apiConnectorQuery = `GET /api/1.1/obj/${targetType.toLowerCase()}?constraints=${encodeURIComponent(JSON.stringify(constraints.map(c => ({ key: c.field, constraint_type: c.operator, value: c.value }))))}&sort_field=${encodeURIComponent(sortField)}&descending=${sortDescending}`;

    return {
      targetType,
      constraints,
      sortField,
      sortDescending,
      bubbleExpression,
      apiConnectorQuery,
      wuCostImpact,
      optimizationTips: tips
    };
  }

  /**
   * Explains complex Bubble privacy rules in clear plain language
   */
  public static async explainPrivacyRule(ruleDescription: string): Promise<PrivacyRuleExplanationResult> {
    await new Promise(r => setTimeout(r, 400));
    const d = ruleDescription.toLowerCase();

    if (d.includes('current user') || d.includes('logged in') || d.includes('owner')) {
      return {
        roleName: 'Record Owner & Authenticated Users',
        plainEnglishSummary: 'Only the user whose ID matches the record\'s Created By field can search, view sensitive private fields, and execute write/update operations.',
        canViewFields: ['email', 'full_name', 'billing_address', 'stripe_customer_id', 'phone_number'],
        canSearchTable: true,
        canModifyFields: ['full_name', 'avatar_url', 'notification_preferences'],
        potentialSecurityRisks: ['Ensure "Find in searches" is disabled for "Everyone else" to prevent unauthorized user listing via Data API.'],
        recommendedFixes: ['Add an explicit "Everyone Else" rule with all checkboxes unchecked.']
      };
    }

    return {
      roleName: 'Custom RBAC Permission Rule',
      plainEnglishSummary: 'Users satisfying the rule condition are granted selective read access to non-sensitive fields and can find matching records in searches.',
      canViewFields: ['title', 'status', 'created_date', 'public_description'],
      canSearchTable: true,
      canModifyFields: ['status'],
      potentialSecurityRisks: ['Verify that administrative or billing fields are not exposed to standard members.'],
      recommendedFixes: ['Use Option Sets for User Roles (e.g. Current User\'s Role is Admin) instead of text strings for type-safe RBAC.']
    };
  }
}
