import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'react-native-localize';

import en from './locales/en.json';
import pt from './locales/pt.json';

const resources = {
  en: { translation: en },
  pt: { translation: pt },
};

// Manual language detector
const languageDetector = {
  type: 'languageDetector' as const,
  detect: () => {
    const locales = Localization.getLocales();
    return locales[0]?.languageCode || 'en';
  },
  init: () => {},
  cacheUserLanguage: () => {},
};

// Initialize i18next
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en', // default language
    interpolation: { escapeValue: false },
  });

export default i18n;
