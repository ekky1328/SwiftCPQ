/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

// openid-client v6+ and its dependency tree (jose, oauth4webapi) are
// pure-ESM packages. Jest must transform them rather than leaving them
// as raw ES modules. babel-jest (bundled with Jest) converts import/export
// to require/module.exports at test time; ts-jest handles TypeScript.
const ESM_PACKAGES = ['openid-client', 'oauth4webapi', 'jose'];
const transformIgnorePatterns = [
  `/node_modules/(?!(${ESM_PACKAGES.join('|')})/)`,
];

const transform = {
  '^.+\\.tsx?$': 'ts-jest',   // TypeScript files → ts-jest
  '^.+\\.js$':   'babel-jest', // ESM JavaScript files → babel-jest (see babel.config.js)
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
      transform,
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
      transform,
    },
  ],
};
