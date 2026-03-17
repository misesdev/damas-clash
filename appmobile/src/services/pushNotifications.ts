import messaging from '@react-native-firebase/messaging';
import {Platform} from 'react-native';

export interface MentionNotificationData {
  senderUsername: string;
  messageText: string;
}

export interface GameCreatedNotificationData {
  gameId: string;
  creatorUsername: string;
}

export type NotificationPayload =
  | {type: 'chat_mention'; data: MentionNotificationData}
  | {type: 'game_created'; data: GameCreatedNotificationData};

/**
 * Requests push notification permission from the user.
 * On Android 13+ (API 33) this shows the system permission dialog.
 * Returns true if permission was granted (AUTHORIZED or PROVISIONAL).
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

/**
 * Retrieves the FCM registration token for this device.
 * On iOS, registers the device for remote messages first.
 * Returns null on any error so the caller can fail silently.
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'ios' && !messaging().isDeviceRegisteredForRemoteMessages) {
      await messaging().registerDeviceForRemoteMessages();
    }
    return await messaging().getToken();
  } catch {
    return null;
  }
}

/**
 * Parses a raw FCM data payload into a typed NotificationPayload.
 * Returns null for unknown or malformed payloads.
 */
function parsePayload(data?: Record<string, string>): NotificationPayload | null {
  if (!data?.type) {return null;}

  if (
    data.type === 'chat_mention' &&
    typeof data.senderUsername === 'string' &&
    typeof data.messageText === 'string'
  ) {
    return {
      type: 'chat_mention',
      data: {senderUsername: data.senderUsername, messageText: data.messageText},
    };
  }

  if (
    data.type === 'game_created' &&
    typeof data.gameId === 'string' &&
    typeof data.creatorUsername === 'string'
  ) {
    return {
      type: 'game_created',
      data: {gameId: data.gameId, creatorUsername: data.creatorUsername},
    };
  }

  return null;
}

/**
 * Subscribes to FCM messages received while the app is in the foreground.
 * Handles `chat_mention` and `game_created` typed data messages.
 * Returns an unsubscribe function to be used as a useEffect cleanup.
 */
export function setupForegroundHandler(
  onNotification: (payload: NotificationPayload) => void,
): () => void {
  return messaging().onMessage(async remoteMessage => {
    const payload = parsePayload(remoteMessage.data as Record<string, string> | undefined);
    if (payload) {
      onNotification(payload);
    }
  });
}

/**
 * Subscribes to notification taps when the app is in the background (but not killed).
 * Returns an unsubscribe function to be used as a useEffect cleanup.
 */
export function setupNotificationOpenedHandler(
  onOpen: (payload: NotificationPayload) => void,
): () => void {
  return messaging().onNotificationOpenedApp(remoteMessage => {
    const payload = parsePayload(remoteMessage.data as Record<string, string> | undefined);
    if (payload) {
      onOpen(payload);
    }
  });
}

/**
 * Returns the notification that launched the app from a killed state, or null.
 * Must be called once during app startup (before any navigation is set).
 */
export async function getInitialNotification(): Promise<NotificationPayload | null> {
  try {
    const remoteMessage = await messaging().getInitialNotification();
    return parsePayload(remoteMessage?.data as Record<string, string> | undefined);
  } catch {
    return null;
  }
}

/**
 * Subscribes to FCM token refresh events and calls back with the new token.
 * The caller is responsible for re-registering the updated token with the API.
 * Returns an unsubscribe function to be used as a useEffect cleanup.
 */
export function setupTokenRefreshHandler(
  onRefresh: (newToken: string) => void,
): () => void {
  return messaging().onTokenRefresh(onRefresh);
}
