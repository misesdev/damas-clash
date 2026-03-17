import {Platform} from 'react-native';
import {request} from './client';

/**
 * Registers (or upserts) the device FCM token for the authenticated player.
 * Called once after login and again whenever the FCM token is rotated.
 */
export function registerFCMToken(fcmToken: string, authToken: string): Promise<void> {
  return request('/api/notifications/fcm-token', {
    method: 'POST',
    headers: {Authorization: `Bearer ${authToken}`},
    body: JSON.stringify({token: fcmToken, platform: Platform.OS}),
  });
}

/**
 * Removes all FCM tokens for the authenticated player.
 * Called on logout so the player stops receiving push notifications.
 */
export function unregisterFCMToken(authToken: string): Promise<void> {
  return request('/api/notifications/fcm-token', {
    method: 'DELETE',
    headers: {Authorization: `Bearer ${authToken}`},
  });
}
