/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

// openid-client v6+ and its peer oauth4webapi are pure-ESM packages.
// Jest must transform them instead of leaving them as-is.
const ESM_PACKAGES = ['openid-client', 'oauth4webapi'];
const transformIgnorePatterns = [
  `/node_modules/(?!(${ESM_PACKAGES.join('|')})/)`,
];

// The project tsconfig only covers .ts files; ts-jest needs allowJs:true
// to compile the .js ESM packages pulled in via transformIgnorePatterns.
// isolatedModules speeds up tests by skipping cross-file type analysis.
const tsJestConfig = {
  tsconfig: { allowJs: true },
  isolatedModules: true,
};

module.exports = {
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/test/unit/**/*.test.ts'],
      modulePathIgnorePatterns: ['<rootDir>/dist/'],
      transformIgnorePatterns,
      transform: { '^.+\\.[jt]sx?$': ['ts-jest', tsJestConfig] },
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
      transform: { '^.+\\.[jt]sx?$': ['ts-jest', tsJestConfig] },
    },
  ],
};
