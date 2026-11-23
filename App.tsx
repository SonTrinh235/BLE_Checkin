import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/auth/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import OfflineBanner from './src/components/OfflineBanner';
import { ThemeProvider, useTheme } from './src/theme/useTheme';
import { DialogProvider } from './src/components/Dialog';
import { ToastProvider } from './src/components/Toast';
import { flushPendingCheckIns, startOfflineQueueSync } from './src/data/offlineQueue';

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function App() {
  useEffect(() => {
    void flushPendingCheckIns();
    return startOfflineQueueSync();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedStatusBar />
        <DialogProvider>
          <ToastProvider>
            <AuthProvider>
              <RootNavigator />
              <OfflineBanner />
            </AuthProvider>
          </ToastProvider>
        </DialogProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
