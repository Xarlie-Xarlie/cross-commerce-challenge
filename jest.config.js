module.exports = {
  bail: true,
  resetMocks: true,
  clearMocks: true,
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],

  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  preset: 'ts-jest',
  testEnvironment: 'node',

  extensionsToTreatAsEsm: ['.ts'],
};
