import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/auth/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { flushPendingCheckIns, startOfflineQueueSync } from './src/data/offlineQueue';

export default function App() {
  useEffect(() => {
    void flushPendingCheckIns();
    return startOfflineQueueSync();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
