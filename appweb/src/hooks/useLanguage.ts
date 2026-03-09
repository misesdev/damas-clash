'use client';

import { useTranslation } from 'react-i18next';
import i18n, { LANGUAGE_KEY } from '../i18n';

export type Language = 'en' | 'pt';

export function useLanguage() {
  const { i18n: i18nInstance } = useTranslation();
  const currentLanguage = i18nInstance.language as Language;

  const setLanguage = (lang: Language) => {
    i18n.changeLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_KEY, lang);
    }
  };

  return { currentLanguage, setLanguage };
}
