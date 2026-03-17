// Mock for @react-native-firebase/messaging

const mockOnMessage = jest.fn(() => jest.fn()); // returns unsubscribe fn
const mockOnTokenRefresh = jest.fn(() => jest.fn());
const mockOnNotificationOpenedApp = jest.fn(() => jest.fn()); // returns unsubscribe fn
const mockGetInitialNotification = jest.fn(() => Promise.resolve(null));
const mockRequestPermission = jest.fn(() => Promise.resolve(1)); // AUTHORIZED
const mockGetToken = jest.fn(() => Promise.resolve('mock-fcm-token-abc123'));
const mockRegisterDeviceForRemoteMessages = jest.fn(() => Promise.resolve());
const mockSetBackgroundMessageHandler = jest.fn();

const messagingInstance = {
  onMessage: mockOnMessage,
  onTokenRefresh: mockOnTokenRefresh,
  onNotificationOpenedApp: mockOnNotificationOpenedApp,
  getInitialNotification: mockGetInitialNotification,
  requestPermission: mockRequestPermission,
  getToken: mockGetToken,
  registerDeviceForRemoteMessages: mockRegisterDeviceForRemoteMessages,
  setBackgroundMessageHandler: mockSetBackgroundMessageHandler,
  isDeviceRegisteredForRemoteMessages: true,
};

const messaging = jest.fn(() => messagingInstance);

// Static enum values used in pushNotifications.ts
(messaging as any).AuthorizationStatus = {
  NOT_DETERMINED: -1,
  DENIED: 0,
  AUTHORIZED: 1,
  PROVISIONAL: 2,
};

export default messaging;
