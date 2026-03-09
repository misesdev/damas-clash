import pt from '../src/i18n/locales/pt';

function getNestedValue(obj: any, key: string): string | undefined {
  return key.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object') {return acc[part];}
    return undefined;
  }, obj);
}

function interpolate(str: string, options?: Record<string, any>): string {
  if (!options) {return str;}
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) =>
    options[k] !== undefined ? String(options[k]) : `{{${k}}}`,
  );
}

function t(key: string, options?: Record<string, any>): string {
  const val = getNestedValue(pt, key);
  if (typeof val === 'string') {return interpolate(val, options);}
  return key;
}

export function useTranslation() {
  return {t, i18n: {language: 'pt', changeLanguage: jest.fn()}};
}

export const initReactI18next = {type: '3rdParty', init: jest.fn()};
export const Trans = ({children}: {children: React.ReactNode}) => children;
