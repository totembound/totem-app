module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'react', 'react-hooks', 'testing-library'],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:react/recommended',
      'plugin:react-hooks/recommended',
      'plugin:testing-library/react',
      'plugin:vitest-globals/recommended'
    ],
    env: {
      browser: true,
      es2021: true,
      node: true
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      // Must-have rules (keep these strict)
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
      
      // Relaxed TypeScript rules
      '@typescript-eslint/no-explicit-any': 'warn', // Downgraded from error to warn
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn', // Downgraded from error
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn', // Downgraded from error
      '@typescript-eslint/ban-types': 'warn', // Downgraded from error
      
      // Relaxed React rules
      'react/react-in-jsx-scope': 'off', // Not needed in newer React
      'react/prop-types': 'off', // Using TypeScript instead
      'react/no-unescaped-entities': 'off', // Allow apostrophes in text
      
      // Testing rules - relaxed for common patterns
      'testing-library/await-async-queries': 'off',
      'testing-library/no-await-sync-queries': 'off',
      'testing-library/no-node-access': 'off',
      'testing-library/no-wait-for-multiple-assertions': 'off',

      // React display name not needed for arrow components
      'react/display-name': 'off',
      
      // Additional relaxed rules
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'ignoreRestSiblings': true
      }]
    }
  };