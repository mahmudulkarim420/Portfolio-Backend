/**
 * ESLint 9.x flat configuration.
 *
 * Migrated from the legacy `.eslintrc.json` to the new flat config format
 * required by ESLint v9.0.0+.
 */
const js = require('@eslint/js');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const globals = require('globals');

module.exports = [
  // --- Global ignores (replaces ignorePatterns) ---
  {
    ignores: ['dist/**', 'node_modules/**', 'prisma/migrations/**', '*.js'],
  },

  // --- Base recommended rules (replaces extends: ['eslint:recommended']) ---
  js.configs.recommended,

  // --- TypeScript files ---
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        ...globals.node,
        ...globals.es2020,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Apply the TypeScript recommended ruleset
      ...tsPlugin.configs.recommended.rules,
      // Project-specific rule overrides (from .eslintrc.json)
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-unused-vars': 'off',
      // `no-undef` does not understand TypeScript types (e.g. `Express.Multer.File`),
      // so it is disabled for TS files. TypeScript's own compiler already
      // guarantees that referenced identifiers exist.
      'no-undef': 'off',
      'prefer-const': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // --- Entry-point scripts: console.log is intentional here ---
  {
    files: ['src/server.ts', 'prisma/seed.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];
