import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en.json';
import hi from './locales/hi.json';

const LANGUAGE_KEY = '@app_language';

export const resources = {
  en: {translation: en},
  hi: {translation: hi},
};

export const availableLanguages = [
  {code: 'en', name: 'English', nativeName: 'English'},
  {code: 'hi', name: 'Hindi', nativeName: 'हिन्दी'},
];

export const getStoredLanguage = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LANGUAGE_KEY);
  } catch (error) {
    console.error('Error reading language preference:', error);
    return null;
  }
};

export const setStoredLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
};

export const changeLanguage = async (language: string): Promise<void> => {
  await i18n.changeLanguage(language);
  await setStoredLanguage(language);
};

export const initI18n = async (): Promise<void> => {
  const storedLanguage = await getStoredLanguage();

  await i18n.use(initReactI18next).init({
    resources,
    lng: storedLanguage || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
};

export default i18n;
