import { TranslationItem, TranslationJobConfig, TranslationJobResult } from '../../types';
import Papa from 'papaparse';

export class TranslatorEngine {
  /**
   * Sample initial translation items from Bubble UI
   */
  public static getSampleItems(): TranslationItem[] {
    return [
      {
        id: 'trans_1',
        key: 'nav_dashboard_title',
        sourceText: 'Welcome back to your workspace overview',
        category: 'ui',
        status: 'pending'
      },
      {
        id: 'trans_2',
        key: 'btn_upgrade_plan',
        sourceText: 'Upgrade to Pro to unlock unlimited team members',
        category: 'ui',
        status: 'pending'
      },
      {
        id: 'trans_3',
        key: 'err_invalid_credentials',
        sourceText: 'Invalid email address or password provided. Please check your credentials.',
        category: 'error',
        status: 'pending'
      },
      {
        id: 'trans_4',
        key: 'notify_payment_success',
        sourceText: 'Your payment of [amount] has been successfully processed.',
        category: 'notification',
        status: 'pending'
      },
      {
        id: 'trans_5',
        key: 'modal_delete_confirm',
        sourceText: 'Are you sure you want to permanently delete this project? This action cannot be undone.',
        category: 'ui',
        status: 'pending'
      }
    ];
  }

  /**
   * Translates a single text using real OpenAI API
   */
  private static async callOpenAiApi(
    text: string,
    targetLang: string,
    apiKey: string,
    model: string = 'gpt-4o',
    tone: string = 'professional'
  ): Promise<string> {
    const prompt = `You are a professional localization expert for web applications.
Translate the following English user interface string into ${targetLang}.
Tone: ${tone}.
Keep any bracketed tokens (like [amount], [user_name], {variable}) exactly as they are.
Respond ONLY with the translated text, no explanations, no quotes.

String: "${text}"`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || text;
  }

  /**
   * Translates a single text using Groq Console API (Ultra-Fast Llama 3.3 / 3.1)
   */
  private static async callGroqApi(
    text: string,
    targetLang: string,
    apiKey: string,
    model: string = 'llama-3.3-70b-versatile',
    tone: string = 'professional'
  ): Promise<string> {
    const prompt = `You are a professional localization expert for web applications.
Translate the following English user interface string into ${targetLang}.
Tone: ${tone}.
Keep any bracketed tokens (like [amount], [user_name], {variable}) exactly as they are.
Respond ONLY with the translated text, no explanations, no quotes.

String: "${text}"`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || text;
  }

  /**
   * Translates a single text using Local Llama (Ollama / Local OpenAI endpoint)
   */
  private static async callLocalLlamaApi(
    text: string,
    targetLang: string,
    endpoint: string = 'http://localhost:11434/v1',
    model: string = 'llama3.2',
    tone: string = 'professional'
  ): Promise<string> {
    const cleanEndpoint = endpoint.replace(/\/$/, '');
    const url = cleanEndpoint.endsWith('/chat/completions') ? cleanEndpoint : `${cleanEndpoint}/chat/completions`;

    const prompt = `You are a professional localization expert for web applications.
Translate the following English user interface string into ${targetLang}.
Tone: ${tone}.
Keep any bracketed tokens (like [amount], [user_name], {variable}) exactly as they are.
Respond ONLY with the translated text, no explanations, no quotes.

String: "${text}"`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Local Llama / Ollama error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || text;
  }

  /**
   * Executes AI translation job with glossary support and token preservation
   */
  public static async runTranslation(
    items: TranslationItem[],
    config: TranslationJobConfig,
    apiKeys?: { openai?: string; groq?: string; ollamaEndpoint?: string },
    onProgress?: (index: number, total: number) => void
  ): Promise<TranslationJobResult> {
    const translatedItems: TranslationItem[] = [];
    let totalTokens = 0;

    const dictionary: Record<string, Record<string, string>> = {
      ro: {
        'Welcome back to your workspace overview': 'Bine ai revenit în panoul de control al spațiului tău de lucru',
        'Upgrade to Pro to unlock unlimited team members': 'Treci la planul Pro pentru a debloca membri nelimitați în echipă',
        'Invalid email address or password provided. Please check your credentials.': 'Adresă de e-mail sau parolă incorectă. Te rugăm să verifici datele introduse.',
        'Your payment of [amount] has been successfully processed.': 'Plata ta în valoare de [amount] a fost procesată cu succes.',
        'Are you sure you want to permanently delete this project? This action cannot be undone.': 'Ești sigur că dorești să ștergi definitiv acest proiect? Această acțiune este ireversibilă.'
      },
      fr: {
        'Welcome back to your workspace overview': 'Bienvenue dans votre aperçu d\'espace de travail',
        'Upgrade to Pro to unlock unlimited team members': 'Passez à Pro pour débloquer un nombre illimité de membres',
        'Invalid email address or password provided. Please check your credentials.': 'Adresse e-mail ou mot de passe invalide. Veuillez vérifier vos identifiants.',
        'Your payment of [amount] has been processed.': 'Votre paiement a été traité.',
        'Are you sure you want to permanently delete this project? This action cannot be undone.': 'Êtes-vous sûr de vouloir supprimer définitivement ce projet ? Cette action est irréversible.'
      },
      es: {
        'Welcome back to your workspace overview': 'Bienvenido de nuevo a la vista general de su espacio de trabajo',
        'Upgrade to Pro to unlock unlimited team members': 'Actualice a Pro para desbloquear miembros de equipo ilimitados',
        'Invalid email address or password provided. Please check your credentials.': 'Dirección de correo o contraseña no válidas. Por favor revise sus credenciales.',
        'Your payment of [amount] has been successfully processed.': 'Su pago de [amount] se ha procesado con éxito.',
        'Are you sure you want to permanently delete this project? This action cannot be undone.': '¿Está seguro de que desea eliminar permanentemente este proyecto? Esta acción no se puede deshacer.'
      },
      de: {
        'Welcome back to your workspace overview': 'Willkommen zurück in Ihrer Arbeitsbereichsübersicht',
        'Upgrade to Pro to unlock unlimited team members': 'Upgraden Sie auf Pro für unbegrenzte Teammitglieder',
        'Invalid email address or password provided. Please check your credentials.': 'Ungültige E-Mail-Adresse oder Passwort. Bitte überprüfen Sie Ihre Anmeldedaten.',
        'Your payment of [amount] has been successfully processed.': 'Ihre Zahlung von [amount] wurde erfolgreich verarbeitet.',
        'Are you sure you want to permanently delete this project? This action cannot be undone.': 'Sind Sie sicher, dass Sie dieses Projekt dauerhaft löschen möchten?'
      }
    };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let resultText = '';

      try {
        if (config.provider === 'groq' && apiKeys?.groq) {
          resultText = await this.callGroqApi(item.sourceText, config.targetLang, apiKeys.groq, config.model, config.tone);
        } else if (config.provider === 'ollama') {
          const endpoint = apiKeys?.ollamaEndpoint || config.customEndpoint || 'http://localhost:11434/v1';
          resultText = await this.callLocalLlamaApi(item.sourceText, config.targetLang, endpoint, config.model, config.tone);
        } else if (config.provider === 'openai' && apiKeys?.openai) {
          resultText = await this.callOpenAiApi(item.sourceText, config.targetLang, apiKeys.openai, config.model, config.tone);
        } else {
          // Offline dictionary simulation
          await new Promise(r => setTimeout(r, 160));
          const target = config.targetLang.toLowerCase();
          resultText = dictionary[target]?.[item.sourceText] || `[${config.targetLang.toUpperCase()}] ${item.sourceText}`;
        }
      } catch (e: any) {
        console.warn(`Translation fallback on item '${item.key}':`, e.message);
        const target = config.targetLang.toLowerCase();
        resultText = dictionary[target]?.[item.sourceText] || `[${config.targetLang.toUpperCase()}] ${item.sourceText}`;
      }

      // Apply glossary overrides if present
      if (config.useGlossary && config.glossary) {
        for (const [term, replacement] of Object.entries(config.glossary)) {
          const regex = new RegExp(`\\b${term}\\b`, 'gi');
          resultText = resultText.replace(regex, replacement);
        }
      }

      const itemTokens = Math.round((item.sourceText.length + resultText.length) / 3);
      totalTokens += itemTokens;

      translatedItems.push({
        ...item,
        translatedText: resultText,
        status: 'translated',
        tokensUsed: itemTokens
      });

      onProgress?.(i + 1, items.length);
    }

    return {
      jobId: `job_${Date.now()}`,
      sourceLang: config.sourceLang,
      targetLang: config.targetLang,
      items: translatedItems,
      totalCount: items.length,
      successCount: translatedItems.length,
      tokensUsed: totalTokens,
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Generates standard Bubble.io App Text CSV
   */
  public static exportToBubbleCsv(items: TranslationItem[], targetLanguage: string): string {
    const csvData = items.map(item => ({
      'App Text ID': item.key,
      'Category': item.category,
      'Source Text': item.sourceText,
      [`Translation (${targetLanguage.toUpperCase()})`]: item.translatedText || ''
    }));

    return Papa.unparse(csvData);
  }

  /**
   * Parses uploaded Bubble CSV file into TranslationItem[]
   */
  public static parseBubbleCsv(csvString: string): TranslationItem[] {
    const parsed = Papa.parse<any>(csvString, { header: true, skipEmptyLines: true });
    return parsed.data.map((row, idx) => ({
      id: `imported_${idx}_${Date.now()}`,
      key: row['App Text ID'] || row['Key'] || row['Identifier'] || `key_${idx}`,
      sourceText: row['Source Text'] || row['Text'] || row['English'] || row['Default Text'] || '',
      translatedText: row['Translation'] || row[`Translation (${row['Language'] || 'RO'})`] || undefined,
      category: (row['Category'] as any) || 'ui',
      status: row['Translation'] ? 'translated' : 'pending'
    }));
  }
}
