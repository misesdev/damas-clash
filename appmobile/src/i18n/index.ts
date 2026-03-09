import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import {NativeModules, Platform} from 'react-native';
import pt from './locales/pt';
import en from './locales/en';

export type Language = 'pt' | 'en';
export const SUPPORTED_LANGUAGES: Language[] = ['pt', 'en'];

function getDeviceLanguage(): Language {
  try {
    const locale: string =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ?? 'en'
        : NativeModules.I18nManager?.localeIdentifier ?? 'en';
    const lang = locale.split(/[-_]/)[0].toLowerCase();
    return SUPPORTED_LANGUAGES.includes(lang as Language)
      ? (lang as Language)
      : 'en';
  } catch {
    return 'en';
  }
}

i18n.use(initReactI18next).init({
  resources: {
    pt: {translation: pt},
    en: {translation: en},
  },
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: {escapeValue: false},
  compatibilityJSON: 'v4',
});

export default i18n;
