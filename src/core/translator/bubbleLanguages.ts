export interface BubbleLanguage {
  code: string;
  name: string;
  nativeName: string;
  region?: string;
}

/**
 * Full official Bubble.io language definitions and locales
 * Compatible with Bubble App Editor Settings > Languages and App Text export
 */
export const BUBBLE_LANGUAGES: BubbleLanguage[] = [
  // English (Default Target & Source)
  { code: 'en_us', name: 'English (US)', nativeName: 'English (United States)', region: 'Americas' },
  { code: 'en_gb', name: 'English (UK)', nativeName: 'English (United Kingdom)', region: 'Europe' },
  { code: 'en_ca', name: 'English (Canada)', nativeName: 'English (Canada)', region: 'Americas' },
  { code: 'en_au', name: 'English (Australia)', nativeName: 'English (Australia)', region: 'Oceania' },

  // European Languages
  { code: 'ro_ro', name: 'Romanian', nativeName: 'Română', region: 'Europe' },
  { code: 'fr_fr', name: 'French (France)', nativeName: 'Français (France)', region: 'Europe' },
  { code: 'fr_ca', name: 'French (Canada)', nativeName: 'Français (Canada)', region: 'Americas' },
  { code: 'es_es', name: 'Spanish (Spain)', nativeName: 'Español (España)', region: 'Europe' },
  { code: 'es_419', name: 'Spanish (Latin America)', nativeName: 'Español (Latinoamérica)', region: 'Americas' },
  { code: 'es_mx', name: 'Spanish (Mexico)', nativeName: 'Español (México)', region: 'Americas' },
  { code: 'de_de', name: 'German (Germany)', nativeName: 'Deutsch (Deutschland)', region: 'Europe' },
  { code: 'de_at', name: 'German (Austria)', nativeName: 'Deutsch (Österreich)', region: 'Europe' },
  { code: 'de_ch', name: 'German (Switzerland)', nativeName: 'Deutsch (Schweiz)', region: 'Europe' },
  { code: 'it_it', name: 'Italian', nativeName: 'Italiano', region: 'Europe' },
  { code: 'pt_br', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', region: 'Americas' },
  { code: 'pt_pt', name: 'Portuguese (Portugal)', nativeName: 'Português (Portugal)', region: 'Europe' },
  { code: 'nl_nl', name: 'Dutch (Netherlands)', nativeName: 'Nederlands (Nederland)', region: 'Europe' },
  { code: 'nl_be', name: 'Dutch (Belgium)', nativeName: 'Nederlands (België)', region: 'Europe' },
  { code: 'pl_pl', name: 'Polish', nativeName: 'Polski', region: 'Europe' },
  { code: 'uk_ua', name: 'Ukrainian', nativeName: 'Українська', region: 'Europe' },
  { code: 'ru_ru', name: 'Russian', nativeName: 'Русский', region: 'Europe / Asia' },
  { code: 'sv_se', name: 'Swedish', nativeName: 'Svenska', region: 'Europe' },
  { code: 'no_no', name: 'Norwegian', nativeName: 'Norsk', region: 'Europe' },
  { code: 'da_dk', name: 'Danish', nativeName: 'Dansk', region: 'Europe' },
  { code: 'fi_fi', name: 'Finnish', nativeName: 'Suomi', region: 'Europe' },
  { code: 'el_gr', name: 'Greek', nativeName: 'Ελληνικά', region: 'Europe' },
  { code: 'cs_cz', name: 'Czech', nativeName: 'Čeština', region: 'Europe' },
  { code: 'hu_hu', name: 'Hungarian', nativeName: 'Magyar', region: 'Europe' },
  { code: 'sk_sk', name: 'Slovak', nativeName: 'Slovenčina', region: 'Europe' },
  { code: 'bg_bg', name: 'Bulgarian', nativeName: 'Български', region: 'Europe' },
  { code: 'hr_hr', name: 'Croatian', nativeName: 'Hrvatski', region: 'Europe' },
  { code: 'sr_rs', name: 'Serbian', nativeName: 'Српски', region: 'Europe' },
  { code: 'sl_si', name: 'Slovenian', nativeName: 'Slovenščina', region: 'Europe' },
  { code: 'et_ee', name: 'Estonian', nativeName: 'Eesti', region: 'Europe' },
  { code: 'lv_lv', name: 'Latvian', nativeName: 'Latviešu', region: 'Europe' },
  { code: 'lt_lt', name: 'Lithuanian', nativeName: 'Lietuvių', region: 'Europe' },
  { code: 'ca_es', name: 'Catalan', nativeName: 'Català', region: 'Europe' },
  { code: 'eu_es', name: 'Basque', nativeName: 'Euskara', region: 'Europe' },
  { code: 'gl_es', name: 'Galician', nativeName: 'Galego', region: 'Europe' },
  { code: 'is_is', name: 'Icelandic', nativeName: 'Íslenska', region: 'Europe' },
  { code: 'sq_al', name: 'Albanian', nativeName: 'Shqip', region: 'Europe' },
  { code: 'mk_mk', name: 'Macedonian', nativeName: 'Македонски', region: 'Europe' },
  { code: 'hy_am', name: 'Armenian', nativeName: 'Հայերեն', region: 'Europe / Asia' },
  { code: 'ka_ge', name: 'Georgian', nativeName: 'ქართული', region: 'Europe / Asia' },

  // Asian Languages
  { code: 'ja_jp', name: 'Japanese', nativeName: '日本語', region: 'Asia' },
  { code: 'zh_cn', name: 'Chinese (Simplified)', nativeName: '简体中文', region: 'Asia' },
  { code: 'zh_tw', name: 'Chinese (Traditional - Taiwan)', nativeName: '繁體中文 (台灣)', region: 'Asia' },
  { code: 'zh_hk', name: 'Chinese (Traditional - Hong Kong)', nativeName: '繁體中文 (香港)', region: 'Asia' },
  { code: 'ko_kr', name: 'Korean', nativeName: '한국어', region: 'Asia' },
  { code: 'hi_in', name: 'Hindi', nativeName: 'हिन्दी', region: 'Asia' },
  { code: 'bn_bd', name: 'Bengali', nativeName: 'বাংলা', region: 'Asia' },
  { code: 'vi_vn', name: 'Vietnamese', nativeName: 'Tiếng Việt', region: 'Asia' },
  { code: 'th_th', name: 'Thai', nativeName: 'ไทย', region: 'Asia' },
  { code: 'id_id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', region: 'Asia' },
  { code: 'ms_my', name: 'Malay', nativeName: 'Bahasa Melayu', region: 'Asia' },
  { code: 'fil_ph', name: 'Filipino (Tagalog)', nativeName: 'Wikang Filipino', region: 'Asia' },
  { code: 'gu_in', name: 'Gujarati', nativeName: 'ગુજરાતી', region: 'Asia' },
  { code: 'kn_in', name: 'Kannada', nativeName: 'ಕನ್ನಡ', region: 'Asia' },
  { code: 'ml_in', name: 'Malayalam', nativeName: 'മലയാളം', region: 'Asia' },
  { code: 'mr_in', name: 'Marathi', nativeName: 'मराठी', region: 'Asia' },
  { code: 'ne_np', name: 'Nepali', nativeName: 'नेपाली', region: 'Asia' },
  { code: 'pa_in', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', region: 'Asia' },
  { code: 'ta_in', name: 'Tamil', nativeName: 'தமிழ்', region: 'Asia' },
  { code: 'te_in', name: 'Telugu', nativeName: 'తెలుగు', region: 'Asia' },
  { code: 'ur_pk', name: 'Urdu', nativeName: 'اردو', region: 'Asia' },
  { code: 'kk_kz', name: 'Kazakh', nativeName: 'Қазақша', region: 'Asia' },
  { code: 'uz_uz', name: 'Uzbek', nativeName: 'Oʻzbekcha', region: 'Asia' },
  { code: 'mn_mn', name: 'Mongolian', nativeName: 'Монгол', region: 'Asia' },

  // Middle Eastern & African Languages
  { code: 'ar_sa', name: 'Arabic (Saudi Arabia)', nativeName: 'العربية (السعودية)', region: 'Middle East' },
  { code: 'ar_ae', name: 'Arabic (UAE)', nativeName: 'العربية (الإمارات)', region: 'Middle East' },
  { code: 'ar_eg', name: 'Arabic (Egypt)', nativeName: 'العربية (مصر)', region: 'Middle East / Africa' },
  { code: 'he_il', name: 'Hebrew', nativeName: 'עברית', region: 'Middle East' },
  { code: 'tr_tr', name: 'Turkish', nativeName: 'Türkçe', region: 'Middle East / Europe' },
  { code: 'fa_ir', name: 'Persian (Farsi)', nativeName: 'فارسی', region: 'Middle East' },
  { code: 'az_az', name: 'Azerbaijani', nativeName: 'Azərbaycan', region: 'Middle East / Asia' },
  { code: 'sw_ke', name: 'Swahili', nativeName: 'Kiswahili', region: 'Africa' },
  { code: 'af_za', name: 'Afrikaans', nativeName: 'Afrikaans', region: 'Africa' }
];

export const DEFAULT_TARGET_LANGUAGE = 'en_us';
export const DEFAULT_SOURCE_LANGUAGE = 'en_us';

/**
 * Returns human-readable display string for language code
 */
export function getLanguageDisplayName(code: string): string {
  const cleanCode = code.toLowerCase().trim();
  const found = BUBBLE_LANGUAGES.find(l => l.code === cleanCode || l.code.split('_')[0] === cleanCode);
  if (found) {
    return `${found.name} (${found.nativeName}) - ${found.code}`;
  }
  return code.toUpperCase();
}

/**
 * Resolves short or full code to Bubble standard locale code
 */
export function resolveBubbleLocale(code: string): string {
  const cleanCode = code.toLowerCase().trim();
  const match = BUBBLE_LANGUAGES.find(l => l.code === cleanCode || l.code.split('_')[0] === cleanCode);
  return match ? match.code : cleanCode;
}
