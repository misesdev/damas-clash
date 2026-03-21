import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'notification_permission_prompted';

/** Returns true if the user has already seen the notification permission screen. */
export async function hasSeenNotificationPrompt(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEY);
  return val === 'true';
}

/** Marks the notification permission screen as seen (regardless of user's choice). */
export async function markNotificationPromptSeen(): Promise<void> {
  await AsyncStorage.setItem(KEY, 'true');
}
