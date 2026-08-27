import { TranslationMemoryStats } from '../../types';
import { IndexedDbStore } from '../storage/indexedDbStore';

export class TranslationMemoryEngine {
  private static CACHE_KEY = 'bubble_devstudio_translation_memory';
  private static GLOSSARY_KEY = 'bubble_devstudio_translation_glossary';
  private static inMemoryCache: Record<string, string> | null = null;
  private static inMemoryGlossary: Record<string, string> | null = null;

  /**
   * Retrieves translation cache map: key = `${lang}_${sourceText}` -> translatedText
   */
  public static getCache(): Record<string, string> {
    if (this.inMemoryCache) {
      return this.inMemoryCache;
    }

    try {
      const data = localStorage.getItem(this.CACHE_KEY);
      this.inMemoryCache = data ? JSON.parse(data) : this.getDefaultCache();
    } catch {
      this.inMemoryCache = this.getDefaultCache();
    }

    // Hydrate from IndexedDB in background
    IndexedDbStore.getTranslationCache().then(dbCache => {
      if (dbCache) {
        this.inMemoryCache = { ...this.inMemoryCache, ...dbCache };
      }
    }).catch(() => {});

    return this.inMemoryCache || this.getDefaultCache();
  }

  public static setCacheEntry(targetLang: string, sourceText: string, translatedText: string): void {
    const cache = this.getCache();
    const key = `${targetLang.toLowerCase()}_${sourceText}`;
    cache[key] = translatedText;
    this.inMemoryCache = cache;

    // Save to IndexedDB (unlimited)
    IndexedDbStore.setTranslationCache(cache).catch(() => {});

    // Try localStorage if size permits
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch {
      // Gracefully ignore quota limit in localStorage since IndexedDB has it saved
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
    this.inMemoryCache = {};
    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch {}
    IndexedDbStore.setTranslationCache({}).catch(() => {});
  }

  /**
   * Protected Glossary Management
   */
  public static getGlossary(): Record<string, string> {
    if (this.inMemoryGlossary) {
      return this.inMemoryGlossary;
    }

    const defaultGlossary = {
      'Bubble': 'Bubble',
      'Bubble.io': 'Bubble.io',
      'Stripe': 'Stripe',
      'Pro': 'Pro',
      'OAuth': 'OAuth',
      'Webhook': 'Webhook',
      'API': 'API'
    };

    try {
      const data = localStorage.getItem(this.GLOSSARY_KEY);
      this.inMemoryGlossary = data ? JSON.parse(data) : defaultGlossary;
    } catch {
      this.inMemoryGlossary = defaultGlossary;
    }

    IndexedDbStore.getGlossary().then(dbGlossary => {
      if (dbGlossary) {
        this.inMemoryGlossary = { ...this.inMemoryGlossary, ...dbGlossary };
      }
    }).catch(() => {});

    return this.inMemoryGlossary || defaultGlossary;
  }

  public static saveGlossary(glossary: Record<string, string>): void {
    this.inMemoryGlossary = glossary;
    try {
      localStorage.setItem(this.GLOSSARY_KEY, JSON.stringify(glossary));
    } catch {}
    IndexedDbStore.setGlossary(glossary).catch(() => {});
  }

  private static getDefaultCache(): Record<string, string> {
    return {
      'ro_Welcome back to your workspace overview': 'Welcome back to your workspace overview',
      'fr_Welcome back to your workspace overview': 'Bienvenue dans votre apercu',
      'es_Welcome back to your workspace overview': 'Bienvenido de nuevo',
      'de_Welcome back to your workspace overview': 'Willkommen zuruck'
    };
  }
}
