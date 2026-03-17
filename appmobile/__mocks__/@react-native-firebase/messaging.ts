// Mock for @react-native-firebase/messaging (modular API v22+)

const mockUnsubscribe = jest.fn();
const mockOnMessage = jest.fn(() => mockUnsubscribe);
const mockOnTokenRefresh = jest.fn(() => mockUnsubscribe);
const mockOnNotificationOpenedApp = jest.fn(() => mockUnsubscribe);
const mockGetInitialNotification = jest.fn(() => Promise.resolve(null));
const mockRequestPermission = jest.fn(() => Promise.resolve(1)); // AUTHORIZED
const mockGetToken = jest.fn(() => Promise.resolve('mock-fcm-token-abc123'));
const mockRegisterDeviceForRemoteMessages = jest.fn(() => Promise.resolve());
const mockSetBackgroundMessageHandler = jest.fn();
const mockIsDeviceRegisteredForRemoteMessages = jest.fn(() => true);

const mockMessagingInstance = {};

// Modular API — named exports used by the app code
export const getMessaging = jest.fn(() => mockMessagingInstance);
export const onMessage = mockOnMessage;
export const onTokenRefresh = mockOnTokenRefresh;
export const onNotificationOpenedApp = mockOnNotificationOpenedApp;
export const getInitialNotification = mockGetInitialNotification;
export const requestPermission = mockRequestPermission;
export const getToken = mockGetToken;
export const registerDeviceForRemoteMessages = mockRegisterDeviceForRemoteMessages;
export const setBackgroundMessageHandler = mockSetBackgroundMessageHandler;
export const isDeviceRegisteredForRemoteMessages = mockIsDeviceRegisteredForRemoteMessages;

export const AuthorizationStatus = {
  NOT_DETERMINED: -1,
  DENIED: 0,
  AUTHORIZED: 1,
  PROVISIONAL: 2,
};

// Default export kept for any code that still imports the namespace
const messaging = jest.fn(() => mockMessagingInstance);
(messaging as any).AuthorizationStatus = AuthorizationStatus;
export default messaging;
