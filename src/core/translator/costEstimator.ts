import { CostEstimate, TranslationItem } from '../../types';

export class CostEstimatorEngine {
  private static rates: Record<string, { name: string; inputPerMillion: number; outputPerMillion: number; isFree?: boolean }> = {
    'gemini-2.0-flash': { name: 'Google Gemini 2.0 Flash', inputPerMillion: 0.10, outputPerMillion: 0.40 },
    'gemini-1.5-pro': { name: 'Google Gemini 1.5 Pro', inputPerMillion: 1.25, outputPerMillion: 5.00 },
    'gpt-4o-mini': { name: 'OpenAI GPT-4o Mini', inputPerMillion: 0.15, outputPerMillion: 0.60 },
    'gpt-4o': { name: 'OpenAI GPT-4o (Omni)', inputPerMillion: 2.50, outputPerMillion: 10.00 },
    'claude-3-5-haiku': { name: 'Anthropic Claude 3.5 Haiku', inputPerMillion: 0.80, outputPerMillion: 4.00 },
    'claude-3-5-sonnet': { name: 'Anthropic Claude 3.5 Sonnet', inputPerMillion: 3.00, outputPerMillion: 15.00 },
    'ollama-local': { name: 'Ollama (Local / Offline)', inputPerMillion: 0, outputPerMillion: 0, isFree: true }
  };

  /**
   * Estimates tokens and projected cost across popular AI localization models
   */
  public static estimate(items: TranslationItem[]): CostEstimate[] {
    const totalChars = items.reduce((sum, item) => sum + item.sourceText.length, 0);
    // Standard rule of thumb: ~4 characters per token + prompt overhead
    const baseTokens = Math.max(10, Math.round(totalChars / 3.5));
    const promptOverhead = items.length * 35; // system prompt + glossary injection tokens
    const estimatedInputTokens = baseTokens + promptOverhead;
    const estimatedOutputTokens = Math.round(baseTokens * 1.15); // Translation output

    const estimates: CostEstimate[] = [];

    for (const [modelKey, rate] of Object.entries(this.rates)) {
      const inputCost = (estimatedInputTokens / 1_000_000) * rate.inputPerMillion;
      const outputCost = (estimatedOutputTokens / 1_000_000) * rate.outputPerMillion;
      const totalCostUsd = Math.round((inputCost + outputCost) * 10000) / 10000;

      estimates.push({
        provider: rate.name,
        model: modelKey,
        estimatedInputTokens,
        estimatedOutputTokens,
        estimatedCostUsd: totalCostUsd,
        isFree: Boolean(rate.isFree)
      });
    }

    return estimates;
  }
}
