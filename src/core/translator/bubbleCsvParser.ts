import Papa from 'papaparse';
import { TranslationItem } from '../../types';

export class BubbleCsvParser {
  /**
   * Parses official Bubble language_translation_data.csv
   * Columns typically: 'App Text ID', 'Text in English', 'Translation in [Language]' or custom headers
   */
  public static parseCsv(csvContent: string): TranslationItem[] {
    const parsed = Papa.parse<any>(csvContent, { header: true, skipEmptyLines: true });
    const items: TranslationItem[] = [];

    parsed.data.forEach((row, idx) => {
      // Look for standard Bubble CSV column variations
      const key = row['App Text ID'] || row['Key'] || row['ID'] || `key_${idx + 1}`;
      const sourceText = row['Text in English'] || row['English'] || row['Source Text'] || row['Text'] || '';
      
      // Find any translation column
      let translatedText: string | undefined = undefined;
      for (const colName of Object.keys(row)) {
        if (colName !== 'App Text ID' && colName !== 'Text in English' && colName !== 'English' && colName !== 'Key' && colName !== 'Category') {
          if (row[colName] && String(row[colName]).trim().length > 0) {
            translatedText = row[colName];
            break;
          }
        }
      }

      if (sourceText) {
        items.push({
          id: `trans_${idx}_${Date.now()}`,
          key,
          sourceText,
          translatedText,
          category: (row['Category'] as any) || 'ui',
          status: translatedText ? 'translated' : 'pending'
        });
      }
    });

    return items;
  }

  /**
   * Generates official Bubble language_translation_data.csv format
   */
  public static exportToBubbleCsv(items: TranslationItem[], targetLanguage: string): string {
    const langHeader = `Translation in ${targetLanguage.toUpperCase()}`;
    const csvData = items.map(item => ({
      'App Text ID': item.key,
      'Text in English': item.sourceText,
      [langHeader]: item.translatedText || ''
    }));

    return Papa.unparse(csvData);
  }
}
