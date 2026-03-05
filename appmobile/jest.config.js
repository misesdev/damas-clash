module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '^@env$': '<rootDir>/__mocks__/@env.ts',
    '^react-native-keychain$': '<rootDir>/__mocks__/react-native-keychain.ts',
    '^react-native-image-picker$': '<rootDir>/__mocks__/react-native-image-picker.ts',
  },
};
