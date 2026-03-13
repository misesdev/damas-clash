const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });

module.exports = createJestConfig({
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@noble/curves/(.*)$': '<rootDir>/__mocks__/noble-curves.ts',
    '^@noble/hashes/(.*)$': '<rootDir>/__mocks__/noble-hashes.ts',
    '^bech32$': '<rootDir>/__mocks__/bech32.ts',
  },
  testMatch: ['<rootDir>/__tests__/**/*.test.{ts,tsx}'],
});
