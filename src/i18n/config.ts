import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import pt from './locales/pt.json';

const resources = {
  en: { translation: en },
  pt: { translation: pt },
};

const languageDetector = {
  type: 'languageDetector' as const,
  detect: () => {
    const languageCode = (Localization as any).locale?.split('-')[0] || 'en';
    return languageCode;
  },
  init: () => {},
  cacheUserLanguage: () => {},
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;