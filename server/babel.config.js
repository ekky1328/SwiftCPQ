/**
 * Babel config used by Jest to transpile pure-ESM packages to CommonJS.
 * Only applied to .js files — TypeScript files are still handled by ts-jest.
 *
 * @babel/preset-env with targets.node:'current' generates the minimal CJS
 * output needed by the running Node version without over-transpiling.
 */
module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
};
