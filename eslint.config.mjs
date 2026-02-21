import js from '@eslint/js';
import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import testingLibrary from 'eslint-plugin-testing-library';
import vitest from '@vitest/eslint-plugin';

export default [
  // Global ignores
  { ignores: ['build/**', 'dist/**', 'node_modules/**', '*.config.*'] },

  // Base JS recommended
  js.configs.recommended,

  // TypeScript files
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 2021,
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
        NodeJS: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react': react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // TypeScript recommended (manually applied since we're not using tseslint.config())
      ...tseslint.configs['recommended'].rules,

      // React recommended
      ...react.configs.recommended.rules,

      // React hooks
      ...reactHooks.configs.recommended.rules,

      // Disable no-undef — TypeScript handles this via its own type checking
      'no-undef': 'off',

      // Must-have rules (keep these strict)
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',

      // Relaxed TypeScript rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',

      // Relaxed React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'off',

      // Additional relaxed rules
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],
    },
  },

  // Test files
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
    languageOptions: {
      globals: {
        // Vitest globals (describe, it, expect, vi, etc.)
        ...vitest.environments.env.globals,
      },
    },
    plugins: {
      'testing-library': testingLibrary,
      'vitest': vitest,
    },
    rules: {
      // Testing library
      ...testingLibrary.configs['flat/react'].rules,
      'testing-library/await-async-queries': 'off',
      'testing-library/no-await-sync-queries': 'off',
      'testing-library/no-node-access': 'off',
      'testing-library/no-wait-for-multiple-assertions': 'off',

      // Vitest
      ...vitest.configs.recommended.rules,
      'vitest/expect-expect': 'warn',
    },
  },
];
