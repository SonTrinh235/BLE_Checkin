import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'onboardingDone.v1';

export async function isOnboardingDone(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    // If storage is unavailable, don't trap the user behind the intro.
    return true;
  }
}

export async function markOnboardingDone(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, '1');
  } catch {
    // Worst case the intro shows again next launch.
  }
}
