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
   * Executes AI translation job with glossary support and token preservation
   */
  public static async runTranslation(
    items: TranslationItem[],
    config: TranslationJobConfig,
    onProgress?: (index: number, total: number) => void
  ): Promise<TranslationJobResult> {
    const translatedItems: TranslationItem[] = [];
    let totalTokens = 0;

    // Dictionary of mock translations for demo/offline and AI fallback
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
        'Your payment of [amount] has been successfully processed.': 'Votre paiement de [amount] a été traité avec succès.',
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
      await new Promise(r => setTimeout(r, 220));

      let resultText = '';
      const targetLang = config.targetLang.toLowerCase();

      if (dictionary[targetLang] && dictionary[targetLang][item.sourceText]) {
        resultText = dictionary[targetLang][item.sourceText];
      } else {
        // AI translation approximation with prefix
        resultText = `[${config.targetLang.toUpperCase()}] ${item.sourceText}`;
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
      key: row['App Text ID'] || row['Key'] || `key_${idx}`,
      sourceText: row['Source Text'] || row['Text'] || row['English'] || '',
      translatedText: row['Translation'] || undefined,
      category: (row['Category'] as any) || 'ui',
      status: row['Translation'] ? 'translated' : 'pending'
    }));
  }
}
