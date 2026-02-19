import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {changeLanguage, getStoredLanguage, availableLanguages} from '../i18n';

interface LanguageContextValue {
  currentLanguage: string;
  availableLanguages: typeof availableLanguages;
  changeLanguage: (language: string) => Promise<void>;
  isLanguageLoaded: boolean;
}

export const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({children}: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);

  useEffect(() => {
    const loadStoredLanguage = async () => {
      try {
        const storedLanguage = await getStoredLanguage();
        if (storedLanguage) {
          setCurrentLanguage(storedLanguage);
        }
      } catch (error) {
        console.error('Failed to load stored language:', error);
      } finally {
        setIsLanguageLoaded(true);
      }
    };

    loadStoredLanguage();
  }, []);

  const handleChangeLanguage = useCallback(async (language: string) => {
    try {
      await changeLanguage(language);
      setCurrentLanguage(language);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }, []);

  const value = useMemo(
    () => ({
      currentLanguage,
      availableLanguages,
      changeLanguage: handleChangeLanguage,
      isLanguageLoaded,
    }),
    [currentLanguage, handleChangeLanguage, isLanguageLoaded],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
