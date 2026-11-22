import * as Haptics from 'expo-haptics';

// Fire-and-forget: a missing vibrator or a denied setting must never break a
// screen, so every call swallows its own errors.
const run = (fn: () => Promise<void>) => {
  fn().catch(() => undefined);
};

export const haptics = {
  light: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
