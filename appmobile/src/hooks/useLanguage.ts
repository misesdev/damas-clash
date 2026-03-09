import {useTranslation} from 'react-i18next';
import i18n, {type Language} from '../i18n';
import {saveLanguage} from '../storage/language';

export function useLanguage() {
  const {t} = useTranslation();
  const currentLanguage = (i18n.language ?? 'pt') as Language;

  const setLanguage = async (lang: Language) => {
    await i18n.changeLanguage(lang);
    await saveLanguage(lang);
  };

  return {
    currentLanguage,
    setLanguage,
    languageLabel: t('language.label'),
    options: [
      {value: 'pt' as Language, label: t('language.portuguese')},
      {value: 'en' as Language, label: t('language.english')},
    ],
  };
}
