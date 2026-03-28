/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/test/unit/**/*.test.ts'],
      modulePathIgnorePatterns: ['<rootDir>/dist/'],
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
    },
  ],
};
