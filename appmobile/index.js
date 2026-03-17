/**
 * @format
 */

import 'react-native-get-random-values';
import {AppRegistry} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import {name as appName} from './app.json';

// Background / quit-state FCM handler.
// This runs in a headless JS context — keep it fast and side-effect free.
// For `chat_mention` data messages, no extra processing is needed because
// Firebase delivers the `notification` payload as a system notification
// automatically. Custom data-only messages would need manual display logic here.
messaging().setBackgroundMessageHandler(async _remoteMessage => {
  // System notification is shown automatically by Firebase for messages
  // that carry a `notification` object. Nothing extra required here.
});

AppRegistry.registerComponent(appName, () => App);
