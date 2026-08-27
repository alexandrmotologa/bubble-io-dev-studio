import { TranslationMemoryStats } from '../../types';

export class TranslationMemoryEngine {
  private static CACHE_KEY = 'bubble_devstudio_translation_memory';
  private static GLOSSARY_KEY = 'bubble_devstudio_translation_glossary';

  /**
   * Retrieves translation cache map: key = `${lang}_${sourceText}` -> translatedText
   */
  public static getCache(): Record<string, string> {
    try {
      const data = localStorage.getItem(this.CACHE_KEY);
      return data ? JSON.parse(data) : this.getDefaultCache();
    } catch {
      return this.getDefaultCache();
    }
  }

  public static setCacheEntry(targetLang: string, sourceText: string, translatedText: string): void {
    const cache = this.getCache();
    const key = `${targetLang.toLowerCase()}_${sourceText}`;
    cache[key] = translatedText;
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch {
      // ignore
    }
  }

  public static getStats(): TranslationMemoryStats {
    const cache = this.getCache();
    const entries = Object.entries(cache);
    const languages = Array.from(new Set(entries.map(([k]) => k.split('_')[0])));
    const totalChars = entries.reduce((acc, [, v]) => acc + v.length, 0);

    return {
      totalCachedEntries: entries.length,
      languages,
      totalCharsSaved: totalChars,
      estimatedSavingsUsd: Math.round((totalChars / 4 / 1000) * 0.015 * 100) / 100
    };
  }

  public static clearCache(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch {
      // ignore
    }
  }

  /**
   * Protected Glossary Management
   */
  public static getGlossary(): Record<string, string> {
    try {
      const data = localStorage.getItem(this.GLOSSARY_KEY);
      return data ? JSON.parse(data) : {
        'Bubble': 'Bubble',
        'Bubble.io': 'Bubble.io',
        'Stripe': 'Stripe',
        'Pro': 'Pro',
        'OAuth': 'OAuth',
        'Webhook': 'Webhook',
        'API': 'API'
      };
    } catch {
      return { 'Bubble': 'Bubble', 'Pro': 'Pro' };
    }
  }

  public static saveGlossary(glossary: Record<string, string>): void {
    try {
      localStorage.setItem(this.GLOSSARY_KEY, JSON.stringify(glossary));
    } catch {
      // ignore
    }
  }

  private static getDefaultCache(): Record<string, string> {
    return {
      'ro_Welcome back to your workspace overview': 'Bine ai revenit în panoul de control al spațiului tău de lucru',
      'fr_Welcome back to your workspace overview': 'Bienvenue dans votre aperçu d\'espace de travail',
      'es_Welcome back to your workspace overview': 'Bienvenido de nuevo a la vista general de su espacio de trabajo',
      'de_Welcome back to your workspace overview': 'Willkommen zurück in Ihrer Arbeitsbereichsübersicht'
    };
  }
}
