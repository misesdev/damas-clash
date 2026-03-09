import AsyncStorage from '@react-native-async-storage/async-storage';
import type {Language} from '../i18n';

const KEY = 'app_language';

export async function saveLanguage(lang: Language): Promise<void> {
  await AsyncStorage.setItem(KEY, lang);
}

export async function loadLanguage(): Promise<Language | null> {
  const val = await AsyncStorage.getItem(KEY);
  if (val === 'pt' || val === 'en') {return val;}
  return null;
}
