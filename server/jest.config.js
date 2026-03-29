/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

// openid-client v6+ and its peer oauth4webapi are pure-ESM packages.
// Jest must transform them instead of leaving them as-is.
const ESM_PACKAGES = ['openid-client', 'oauth4webapi'];
const transformIgnorePatterns = [
  `/node_modules/(?!(${ESM_PACKAGES.join('|')})/)`,
];

module.exports = {
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/test/unit/**/*.test.ts'],
      modulePathIgnorePatterns: ['<rootDir>/dist/'],
      transformIgnorePatterns,
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/test/integration/**/*.test.ts'],
      modulePathIgnorePatterns: ['<rootDir>/dist/'],
      globalSetup: '<rootDir>/test/integration/helpers/setup.ts',
      globalTeardown: '<rootDir>/test/integration/helpers/teardown.ts',
      setupFiles: ['<rootDir>/test/integration/helpers/env.ts'],
      transformIgnorePatterns,
    },
  ],
};
