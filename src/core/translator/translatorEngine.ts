import { TranslationItem, TranslationJobConfig, TranslationJobResult } from '../../types';
import { BubbleCsvParser } from './bubbleCsvParser';
import { BubbleExtractor } from './bubbleExtractor';
import { TranslationMemoryEngine } from './translationMemory';
import { PseudoLocalizerEngine } from './pseudoLocalizer';
import { CostEstimatorEngine } from './costEstimator';
import { AiProvidersEngine } from './aiProviders';

export class TranslatorEngine {
  /**
   * Sample initial translation items from Bubble UI
   */
  public static getSampleItems(): TranslationItem[] {
    return BubbleExtractor.getSampleBubbleTexts();
  }

  /**
   * Executes AI translation job with cache memory and glossary support
   */
  public static async runTranslation(
    items: TranslationItem[],
    config: TranslationJobConfig,
    apiKeys?: { openai?: string; groq?: string; opencode?: string; ollamaEndpoint?: string },
    onProgress?: (index: number, total: number) => void
  ): Promise<TranslationJobResult> {
    const translatedItems: TranslationItem[] = [];
    let totalTokens = 0;
    let cacheHitCount = 0;

    const cache = config.useCache ? TranslationMemoryEngine.getCache() : {};

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await new Promise(r => setTimeout(r, 180));

      const cacheKey = `${config.targetLang.toLowerCase()}_${item.sourceText}`;
      let resultText = '';
      let tokens = 0;

      if (config.useCache && cache[cacheKey]) {
        resultText = cache[cacheKey];
        cacheHitCount++;
      } else {
        const res = await AiProvidersEngine.translateText(item.sourceText, config);
        resultText = res.text;
        tokens = res.tokensUsed;
        totalTokens += tokens;

        if (config.useCache) {
          TranslationMemoryEngine.setCacheEntry(config.targetLang, item.sourceText, resultText);
        }
      }

      translatedItems.push({
        ...item,
        translatedText: resultText,
        status: 'translated',
        tokensUsed: tokens
      });

      onProgress?.(i + 1, items.length);
    }

    const estimatedCostUsd = Math.round((totalTokens / 1_000_000) * 2.5 * 1000) / 1000;

    return {
      jobId: `job_${Date.now()}`,
      sourceLang: config.sourceLang,
      targetLang: config.targetLang,
      items: translatedItems,
      totalCount: items.length,
      successCount: translatedItems.length,
      cacheHitCount,
      tokensUsed: totalTokens,
      estimatedCostUsd,
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Executes AI translation job across MULTIPLE target languages concurrently
   */
  public static async runMultiLanguageTranslation(
    items: TranslationItem[],
    targetLanguages: string[],
    config: Omit<TranslationJobConfig, 'targetLang'>,
    onProgress?: (langIndex: number, totalLangs: number, itemIndex: number, totalItems: number, currentLang: string) => void
  ): Promise<{
    items: TranslationItem[];
    tokensUsed: number;
    resultsByLang: Record<string, TranslationJobResult>;
  }> {
    let totalTokens = 0;
    const resultsByLang: Record<string, TranslationJobResult> = {};
    const itemTranslationsMap: Record<string, Record<string, string>> = {};

    for (const item of items) {
      itemTranslationsMap[item.id] = { ...(item.translations || {}) };
      if (item.translatedText && config.sourceLang) {
        // preserve existing translation if present
      }
    }

    for (let l = 0; l < targetLanguages.length; l++) {
      const targetLang = targetLanguages[l];
      const langConfig: TranslationJobConfig = {
        ...config,
        targetLang
      };

      const langResult = await this.runTranslation(
        items,
        langConfig,
        (curr, tot) => {
          onProgress?.(l + 1, targetLanguages.length, curr, tot, targetLang);
        }
      );

      resultsByLang[targetLang] = langResult;
      totalTokens += langResult.tokensUsed;

      for (const tItem of langResult.items) {
        if (tItem.translatedText) {
          itemTranslationsMap[tItem.id][targetLang] = tItem.translatedText;
        }
      }
    }

    const primaryTarget = targetLanguages[0] || 'en_us';
    const finalItems: TranslationItem[] = items.map(item => {
      const translations = itemTranslationsMap[item.id] || {};
      return {
        ...item,
        translations,
        translatedText: translations[primaryTarget] || item.translatedText,
        status: Object.keys(translations).length > 0 ? 'translated' : item.status
      };
    });

    return {
      items: finalItems,
      tokensUsed: totalTokens,
      resultsByLang
    };
  }

  /**
   * Generates pseudo-localized strings for UI stress testing
   */
  public static generatePseudoLocalization(items: TranslationItem[]): TranslationItem[] {
    return items.map(item => ({
      ...item,
      translatedText: PseudoLocalizerEngine.localize(item.sourceText),
      status: 'translated'
    }));
  }

  public static exportToBubbleCsv(items: TranslationItem[], targetLanguage: string): string {
    return BubbleCsvParser.exportToBubbleCsv(items, targetLanguage);
  }

  public static parseBubbleCsv(csvString: string): TranslationItem[] {
    return BubbleCsvParser.parseCsv(csvString);
  }

  public static extractFromBubbleJson(rawJson: any): TranslationItem[] {
    return BubbleExtractor.extractFromBubbleJson(rawJson);
  }

  public static estimateCosts(items: TranslationItem[]) {
    return CostEstimatorEngine.estimate(items);
  }

  public static getMemoryStats() {
    return TranslationMemoryEngine.getStats();
  }

  public static clearMemoryCache() {
    TranslationMemoryEngine.clearCache();
  }

  public static getGlossary() {
    return TranslationMemoryEngine.getGlossary();
  }

  public static saveGlossary(glossary: Record<string, string>) {
    TranslationMemoryEngine.saveGlossary(glossary);
  }

  public static async verifyProviderConnection(
    provider: string,
    model: string,
    apiKey?: string,
    ollamaUrl?: string
  ) {
    return AiProvidersEngine.verifyProviderConnection(provider, model, apiKey, ollamaUrl);
  }
}
