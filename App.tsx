import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Buffer } from 'buffer';

import { PreferencesProvider, usePreferences } from '@/context/PreferencesContext';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationCenterProvider } from '@/context/NotificationCenterContext';
import RootNavigator from '@/navigation/RootNavigator';

if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

const AppProviders: React.FC<React.PropsWithChildren> = ({ children }) => (
  <AuthProvider>
    <PreferencesProvider>
      <NotificationCenterProvider>
        <SafeAreaProvider>{children}</SafeAreaProvider>
      </NotificationCenterProvider>
    </PreferencesProvider>
  </AuthProvider>
);

const AppContent = () => {
  const { navigationTheme, theme } = usePreferences();

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <RootNavigator />
      <Toast topOffset={60} />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
