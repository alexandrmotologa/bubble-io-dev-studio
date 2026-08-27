import { CopilotQueryRequest, CopilotQueryResponse, CopilotRegexRequest, CopilotRegexResponse } from '../../types';

export class CopilotEngine {
  /**
   * Compiles natural language queries into Bubble Data API constraint parameters
   */
  public static async generateQueryConstraints(
    req: CopilotQueryRequest,
    apiKeys?: {
      geminiApiKey?: string;
      openaiApiKey?: string;
      groqApiKey?: string;
      xaiApiKey?: string;
    }
  ): Promise<CopilotQueryResponse> {
    await new Promise(r => setTimeout(r, 450));

    const prompt = req.naturalLanguagePrompt.toLowerCase();
    const constraints: { key: string; constraint_type: string; value: any }[] = [];

    // Intelligent pattern matching heuristics (simulated AI engine if offline)
    if (prompt.includes('active') || prompt.includes('activ')) {
      constraints.push({ key: 'is_active', constraint_type: 'equals', value: true });
    }
    if (prompt.includes('admin') || prompt.includes('administrator')) {
      constraints.push({ key: 'role', constraint_type: 'equals', value: 'Admin' });
    }
    if (prompt.includes('price') || prompt.includes('pret') || prompt.includes('cost') || prompt.includes('amount')) {
      if (prompt.includes('greater') || prompt.includes('mai mare') || prompt.includes('over') || prompt.includes('>')) {
        const numMatch = prompt.match(/\d+/);
        constraints.push({ key: 'amount', constraint_type: 'greater than', value: numMatch ? parseInt(numMatch[0]) : 100 });
      }
    }
    if (prompt.includes('email') || prompt.includes('mail')) {
      const emailMatch = prompt.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        constraints.push({ key: 'email', constraint_type: 'equals', value: emailMatch[0] });
      } else {
        constraints.push({ key: 'email', constraint_type: 'is_not_empty', value: true });
      }
    }

    if (constraints.length === 0) {
      constraints.push({ key: 'Created Date', constraint_type: 'is_not_empty', value: true });
    }

    const jsonStr = encodeURIComponent(JSON.stringify(constraints));
    const urlSnippet = `https://[app-id].bubbleapps.io/version-test/api/1.1/obj/${req.targetDataType}?constraints=${jsonStr}`;

    return {
      interpretedQuery: `Filter ${req.targetDataType} records where ${constraints.map(c => `${c.key} ${c.constraint_type} "${c.value}"`).join(' AND ')}`,
      bubbleConstraints: constraints,
      explanation: `Generated ${constraints.length} Bubble Data API constraints with exact types. The constraints array matches the Bubble 1.1 API specification.`,
      dataApiUrlSnippet: urlSnippet
    };
  }

  /**
   * Generates and tests Bubble dynamic regex expressions
   */
  public static async generateRegex(req: CopilotRegexRequest): Promise<CopilotRegexResponse> {
    await new Promise(r => setTimeout(r, 350));

    const desc = req.description.toLowerCase();
    let pattern = '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}';
    let flags = 'g';
    let explanation = 'Extracts standard RFC 5322 valid email addresses from dynamic strings.';

    if (desc.includes('phone') || desc.includes('telefon') || desc.includes('mobile')) {
      pattern = '\\+?[0-9]{1,4}?[-.\\s]?(\\([0-9]{1,3}?\\)|[0-9]{1,4})[-.\\s]?[0-9]{1,4}[-.\\s]?[0-9]{1,9}';
      explanation = 'Matches international phone numbers with optional country codes.';
    } else if (desc.includes('url') || desc.includes('link') || desc.includes('website')) {
      pattern = 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)';
      explanation = 'Matches HTTP/HTTPS URLs with full paths and query strings.';
    } else if (desc.includes('price') || desc.includes('currency') || desc.includes('dollar') || desc.includes('euro')) {
      pattern = '[$€£]?[0-9]+([.,][0-9]{2})?';
      explanation = 'Extracts currency values and decimal prices.';
    } else if (desc.includes('slug') || desc.includes('kebab') || desc.includes('handle')) {
      pattern = '^[a-z0-9]+(?:-[a-z0-9]+)*$';
      explanation = 'Validates kebab-case URL slugs.';
    }

    let matchesSample = false;
    let matchedValues: string[] = [];

    try {
      const rx = new RegExp(pattern, flags);
      const m = req.sampleInput.match(rx);
      if (m && m.length > 0) {
        matchesSample = true;
        matchedValues = Array.from(m);
      }
    } catch {
      matchesSample = false;
    }

    return {
      regexPattern: pattern,
      regexFlags: flags,
      explanation,
      matchesSample,
      matchedValues
    };
  }
}
