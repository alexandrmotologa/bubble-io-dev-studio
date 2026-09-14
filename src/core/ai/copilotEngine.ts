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

export interface CopilotApiKeys {
  geminiApiKey?: string;
  openaiApiKey?: string;
  groqApiKey?: string;
  xaiApiKey?: string;
  anthropicApiKey?: string;
  ollamaUrl?: string;
}

export class CopilotEngine {
  /**
   * Generates a regular expression and Bubble formula using Live AI or rule-based heuristics
   */
  public static async generateRegex(prompt: string, keys?: CopilotApiKeys): Promise<RegexGenerationResult> {
    const effectiveKey = keys?.geminiApiKey || keys?.openaiApiKey || keys?.groqApiKey;

    // 1. If live Gemini API key is available, execute real LLM generation
    if (keys?.geminiApiKey) {
      try {
        const sysPrompt = `You are a Regex & Bubble.io Expression Expert. Return ONLY a valid JSON object with:
{
  "pattern": "regex pattern without enclosing slashes",
  "flags": "i or g or empty",
  "bubbleFormula": "Input's value :extract with Regex (...):first item is not empty",
  "explanation": "brief plain text explanation",
  "sampleMatches": ["match1", "match2"],
  "sampleNonMatches": ["nonmatch1", "nonmatch2"]
}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${keys.geminiApiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${sysPrompt}\n\nTask: Generate a regex pattern for: "${prompt}"` }]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json'
            }
          })
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            if (parsed.pattern) {
              return {
                pattern: parsed.pattern,
                flags: parsed.flags || '',
                bubbleFormula: parsed.bubbleFormula || `Input's value :extract with Regex (${parsed.pattern}):first item is not empty`,
                explanation: parsed.explanation || `Matches patterns for: ${prompt}`,
                sampleMatches: Array.isArray(parsed.sampleMatches) ? parsed.sampleMatches : [],
                sampleNonMatches: Array.isArray(parsed.sampleNonMatches) ? parsed.sampleNonMatches : []
              };
            }
          }
        }
      } catch (err) {
        console.warn('[CopilotEngine] Live Gemini regex generation failed, applying heuristic fallback:', err);
      }
    } else if (keys?.groqApiKey || keys?.openaiApiKey) {
      const isGroq = Boolean(keys?.groqApiKey);
      const endpoint = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
      const key = keys?.groqApiKey || keys?.openaiApiKey;
      const model = isGroq ? 'qwen/qwen3.8-27b' : 'gpt-4o-mini';

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          signal: controller.signal,
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: `You are a Regex & Bubble.io Expression Expert. Return ONLY a valid JSON object with:
{
  "pattern": "regex pattern without enclosing slashes",
  "flags": "i or g or empty",
  "bubbleFormula": "Input's value :extract with Regex (...):first item is not empty",
  "explanation": "brief plain text explanation",
  "sampleMatches": ["match1", "match2"],
  "sampleNonMatches": ["nonmatch1", "nonmatch2"]
}`
              },
              { role: 'user', content: `Task: Generate a regex pattern for: "${prompt}"` }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
          })
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const content = data?.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            if (parsed.pattern) {
              return {
                pattern: parsed.pattern,
                flags: parsed.flags || '',
                bubbleFormula: parsed.bubbleFormula || `Input's value :extract with Regex (${parsed.pattern}):first item is not empty`,
                explanation: parsed.explanation || `Matches patterns for: ${prompt}`,
                sampleMatches: Array.isArray(parsed.sampleMatches) ? parsed.sampleMatches : [],
                sampleNonMatches: Array.isArray(parsed.sampleNonMatches) ? parsed.sampleNonMatches : []
              };
            }
          }
        }
      } catch (err) {
        console.warn('[CopilotEngine] Live LLM regex generation failed, applying heuristic fallback:', err);
      }
    }

    // 2. Heuristic rule-based pattern matching (Fast offline mode)
    const p = prompt.toLowerCase();

    if (p.includes('email') || p.includes('mail')) {
      return {
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        flags: 'i',
        bubbleFormula: `Input Email's value :extract with Regex (^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$):first item is not empty`,
        explanation: 'Matches standard RFC 5322 email addresses with alphanumeric usernames, domain names, and a top-level domain of 2+ characters.',
        sampleMatches: ['user@company.com', 'alex.dev@bubble-studio.io', 'support+tag@app.co'],
        sampleNonMatches: ['invalid-email', '@domain.com', 'user@domain']
      };
    }

    if (p.includes('phone') || p.includes('telefon') || p.includes('mobil') || p.includes('tel')) {
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

    if (p.includes('price') || p.includes('currency') || p.includes('cost') || p.includes('dollar') || p.includes('euro')) {
      return {
        pattern: '^[$€£]?\\d+(?:[.,]\\d{1,2})?$',
        flags: '',
        bubbleFormula: `Input Price's value :extract with Regex (^[$€£]?\\d+(?:[.,]\\d{1,2})?$):first item is not empty`,
        explanation: 'Matches monetary amounts with optional currency symbol ($ € £) and up to 2 decimal places.',
        sampleMatches: ['$99.99', '49.00', '€1200', '15.5'],
        sampleNonMatches: ['free', '$12.345', 'abc']
      };
    }

    return {
      pattern: '^[A-Za-z0-9_ -]{3,64}$',
      flags: 'i',
      bubbleFormula: `Input's value :extract with Regex (^[A-Za-z0-9_ -]{3,64}$):first item is not empty`,
      explanation: `Generated pattern matching alphanumeric tokens with safe delimiters for '${prompt}'.`,
      sampleMatches: ['Valid_Input_123', 'Sample 456', 'CustomToken'],
      sampleNonMatches: ['##Invalid$$', 'x', '<script>alert(1)</script>']
    };
  }

  /**
   * Generates a structured Bubble "Do a search for" query from natural language
   */
  public static async generateSearchQuery(
    prompt: string,
    schema?: BubbleSchema | null,
    keys?: CopilotApiKeys
  ): Promise<SearchQueryGenerationResult> {
    const availableTypes = schema?.dataTypes.map(dt => dt.name) || ['User', 'Order', 'Product', 'Transaction', 'Invoice'];
    const p = prompt.toLowerCase();
    let targetType = availableTypes.find(t => p.includes(t.toLowerCase())) || availableTypes[0] || 'Order';

    // 1. If live Gemini API key is available, execute LLM with real schema context
    if (keys?.geminiApiKey) {
      try {
        const schemaContext = schema ? `Available Tables and Fields:\n` + schema.dataTypes.map(dt => 
          `- ${dt.name} (fields: ${dt.fields.map(f => `${f.name}:${f.type}`).join(', ')})`
        ).join('\n') : `Common Tables: User, Order, Product, Transaction`;

        const sysPrompt = `You are a Bubble.io Database & Search Query Expert.
${schemaContext}

User Prompt: "${prompt}"
Return ONLY a valid JSON object matching this exact schema:
{
  "targetType": "Exact table name",
  "constraints": [
    { "field": "fieldName", "operator": "equals|not_equals|greater_than|less_than|contains|in|is_empty|is_not_empty", "value": "valueString", "isDynamic": false }
  ],
  "sortField": "Created Date",
  "sortDescending": true,
  "bubbleExpression": "Do a search for ...",
  "apiConnectorQuery": "GET /api/1.1/obj/...",
  "wuCostImpact": "low|medium|high",
  "optimizationTips": ["tip1", "tip2"]
}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${keys.geminiApiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: sysPrompt }] }],
            generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
          })
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            if (parsed.targetType && Array.isArray(parsed.constraints)) {
              return {
                targetType: parsed.targetType,
                constraints: parsed.constraints,
                sortField: parsed.sortField || 'Created Date',
                sortDescending: typeof parsed.sortDescending === 'boolean' ? parsed.sortDescending : true,
                bubbleExpression: parsed.bubbleExpression || `Do a search for ${parsed.targetType}s`,
                apiConnectorQuery: parsed.apiConnectorQuery || `GET /api/1.1/obj/${parsed.targetType.toLowerCase()}`,
                wuCostImpact: parsed.wuCostImpact || 'low',
                optimizationTips: Array.isArray(parsed.optimizationTips) ? parsed.optimizationTips : ['✓ AI-synthesized optimal constraint schema']
              };
            }
          }
        }
      } catch (err) {
        console.warn('[CopilotEngine] Live Gemini query synthesis failed, falling back to schema heuristic:', err);
      }
    }

    // 2. Schema-aware heuristic fallback
    const matchedDt = schema?.dataTypes.find(dt => dt.name.toLowerCase() === targetType.toLowerCase());
    const constraints: SearchQueryConstraint[] = [];
    let sortField = 'Created Date';
    let sortDescending = true;
    let wuCostImpact: 'low' | 'medium' | 'high' = 'low';
    const tips: string[] = [];

    // Find schema fields matching common keywords
    if (matchedDt) {
      const fieldNames = matchedDt.fields.map(f => f.name);
      const statusField = fieldNames.find(f => f.toLowerCase().includes('status') || f.toLowerCase().includes('state'));
      const activeField = fieldNames.find(f => f.toLowerCase().includes('active') || f.toLowerCase().includes('enabled'));
      const totalField = fieldNames.find(f => f.toLowerCase().includes('total') || f.toLowerCase().includes('amount') || f.toLowerCase().includes('price'));
      const dateField = fieldNames.find(f => f.toLowerCase().includes('date') || f.toLowerCase() === 'created date');

      if (activeField && (p.includes('active') || p.includes('enabled'))) {
        constraints.push({ field: activeField, operator: 'equals', value: 'yes', isDynamic: false });
      } else if (statusField) {
        const val = p.includes('complete') ? '"completed"' : p.includes('pending') ? '"pending"' : '"active"';
        constraints.push({ field: statusField, operator: 'equals', value: val, isDynamic: false });
      }

      if (totalField && (p.includes('>') || p.includes('greater') || p.includes('more than') || p.includes('100'))) {
        constraints.push({ field: totalField, operator: 'greater_than', value: '100', isDynamic: false });
      }

      if (dateField && (p.includes('recent') || p.includes('last') || p.includes('month') || p.includes('week') || p.includes('day'))) {
        constraints.push({ field: dateField, operator: 'greater_than', value: 'Current date/time +(days: -30)', isDynamic: true });
        wuCostImpact = 'medium';
      }

      if (dateField) sortField = dateField;
    } else {
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
    }

    if (constraints.length === 0) {
      wuCostImpact = 'high';
      tips.push('⚠️ Unconstrained Search Warning: Always specify at least one indexed filter to reduce Workload Units.');
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
  public static async explainPrivacyRule(ruleDescription: string, _keys?: CopilotApiKeys): Promise<PrivacyRuleExplanationResult> {
    const d = ruleDescription.toLowerCase();

    if (d.includes('current user') || d.includes('logged in') || d.includes('owner') || d.includes('creator')) {
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
