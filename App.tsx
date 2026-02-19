import 'react-native-get-random-values';
import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {StatusBar} from 'react-native';
import {PaperProvider} from 'react-native-paper';
import RootNavigator from './src/navigation/RootNavigator';
import {SessionProvider} from './src/context/SessionContext';
import {LanguageProvider} from './src/context/LanguageContext';
import {navigationTheme, paperTheme} from './src/theme/paperTheme';
import {initI18n} from './src/i18n';
import LoadingScreen from './src/screens/LoadingScreen';

export default function App() {
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);

  useEffect(() => {
    const initializeI18n = async () => {
      try {
        await initI18n();
      } catch (error) {
        console.error('Failed to initialize i18n:', error);
      } finally {
        setIsI18nInitialized(true);
      }
    };

    initializeI18n();
  }, []);

  if (!isI18nInitialized) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <StatusBar barStyle="dark-content" />
          <LoadingScreen />
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <StatusBar barStyle="dark-content" />
        <LanguageProvider>
          <SessionProvider>
            <NavigationContainer theme={navigationTheme}>
              <RootNavigator />
            </NavigationContainer>
          </SessionProvider>
        </LanguageProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
