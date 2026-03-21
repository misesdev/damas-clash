import {
  getMessaging,
  onMessage as fcmOnMessage,
  onNotificationOpenedApp as fcmOnNotificationOpenedApp,
  getInitialNotification as fcmGetInitialNotification,
  onTokenRefresh as fcmOnTokenRefresh,
  requestPermission as fcmRequestPermission,
  hasPermission as fcmHasPermission,
  getToken as fcmGetToken,
  isDeviceRegisteredForRemoteMessages,
  registerDeviceForRemoteMessages,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import {Linking, PermissionsAndroid, Platform} from 'react-native';

export interface MentionNotificationData {
  senderUsername: string;
  messageText: string;
}

export interface GameCreatedNotificationData {
  gameId: string;
  creatorUsername: string;
}

export interface PlayerJoinedNotificationData {
  gameId: string;
  joinerUsername: string;
}

export interface ReplyNotificationData {
  replierUsername: string;
  messageText: string;
}

export type NotificationPayload =
  | {type: 'chat_mention'; data: MentionNotificationData}
  | {type: 'chat_reply'; data: ReplyNotificationData}
  | {type: 'game_created'; data: GameCreatedNotificationData}
  | {type: 'player_joined'; data: PlayerJoinedNotificationData}
  | {type: 'new_user'; data: {username: string}};

/**
 * Returns true if push notification permission is already granted.
 * Does NOT show any system dialog.
 */
export async function hasNotificationPermission(): Promise<boolean> {
  try {
    const status = await fcmHasPermission(getMessaging());
    return (
      status === AuthorizationStatus.AUTHORIZED ||
      status === AuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

/**
 * Requests push notification permission from the user.
 *
 * On Android: Firebase's requestPermission always resolves immediately with
 * AUTHORIZED without showing any OS dialog. The real runtime permission
 * (POST_NOTIFICATIONS, added in API 33) must be requested via PermissionsAndroid.
 * On devices running Android < 13, notifications are always enabled at the OS
 * level, so we open the app settings page if they appear disabled.
 *
 * On iOS: delegates to Firebase which shows the native permission sheet.
 *
 * Returns true if permission is now granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    // Android 13+ (API 33): request the POST_NOTIFICATIONS runtime permission
    if ((Platform.Version as number) >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
    // Android < 13: notifications are auto-granted at OS level.
    // If hasPermission returns false it means the user disabled them in settings.
    // Open settings so they can re-enable manually.
    const already = await hasNotificationPermission();
    if (!already) {
      await Linking.openSettings();
    }
    return already;
  }

  // iOS: Firebase handles the native permission sheet
  const authStatus = await fcmRequestPermission(getMessaging());
  return (
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL
  );
}

/**
 * Retrieves the FCM registration token for this device.
 * On iOS, registers the device for remote messages first.
 * Returns null on any error so the caller can fail silently.
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    const m = getMessaging();
    if (Platform.OS === 'ios' && !isDeviceRegisteredForRemoteMessages(m)) {
      await registerDeviceForRemoteMessages(m);
    }
    return await fcmGetToken(m);
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

  if (
    data.type === 'chat_reply' &&
    typeof data.replierUsername === 'string' &&
    typeof data.messageText === 'string'
  ) {
    return {
      type: 'chat_reply',
      data: {replierUsername: data.replierUsername, messageText: data.messageText},
    };
  }

  if (
    data.type === 'player_joined' &&
    typeof data.gameId === 'string' &&
    typeof data.joinerUsername === 'string'
  ) {
    return {
      type: 'player_joined',
      data: {gameId: data.gameId, joinerUsername: data.joinerUsername},
    };
  }

  if (data.type === 'new_user' && typeof data.username === 'string') {
    return {type: 'new_user', data: {username: data.username}};
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
  return fcmOnMessage(getMessaging(), async remoteMessage => {
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
  return fcmOnNotificationOpenedApp(getMessaging(), remoteMessage => {
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
    const remoteMessage = await fcmGetInitialNotification(getMessaging());
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
  return fcmOnTokenRefresh(getMessaging(), onRefresh);
}
