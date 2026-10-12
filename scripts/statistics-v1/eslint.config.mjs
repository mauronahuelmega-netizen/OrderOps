// Standalone lint for owned Phase 01 scripts; does not alter the shared Next config.
export default [{
  files: ['scripts/statistics-v1/*.mjs'],
  languageOptions: {
    ecmaVersion: 'latest', sourceType: 'module',
    globals: { process: 'readonly', console: 'readonly', Buffer: 'readonly', URL: 'readonly', fetch: 'readonly', structuredClone: 'readonly', setTimeout: 'readonly' },
  },
  rules: { 'no-unused-vars': ['error', { caughtErrors: 'none' }], 'no-undef': 'error' },
}];
