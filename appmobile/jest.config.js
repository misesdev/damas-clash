module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '^@env$': '<rootDir>/__mocks__/@env.ts',
    '^react-native-keychain$': '<rootDir>/__mocks__/react-native-keychain.ts',
    '^react-native-image-picker$': '<rootDir>/__mocks__/react-native-image-picker.ts',
    '^react-native-vector-icons/(.*)$': '<rootDir>/__mocks__/react-native-vector-icons.ts',
    '^@react-native-google-signin/google-signin$': '<rootDir>/__mocks__/@react-native-google-signin/google-signin.ts',
    '^react-native-svg$': '<rootDir>/__mocks__/react-native-svg.ts',
    '^react-native-qrcode-svg$': '<rootDir>/__mocks__/react-native-qrcode-svg.ts',
    '^react-native-get-random-values$': '<rootDir>/__mocks__/react-native-get-random-values.ts',
    // Intercept before any ESM-only library (nostr-fetch, @noble/*) is loaded
    '^.+/utils/nostr$': '<rootDir>/src/utils/__mocks__/nostr.ts',
  },
};
