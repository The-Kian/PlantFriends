module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import', 'jest'],
  extends: [
    'expo',
    'plugin:jest/recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  ignorePatterns: [
    '**/node_modules/**', 
    'android/**', 
    'ios/**', 
    'metro.config.js', 
    '**/__mocks__/**'
  ],
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
  overrides: [
    {
      files: [
        '**/__tests__/**/*.[jt]s?(x)', 
        '**/?(*.)+(spec|test).[jt]s?(x)'
      ],
      extends: ['plugin:testing-library/react'],
      env: { jest: true },
    },
  ],
  rules: {
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling', 'index']
        ],
        pathGroups: [
          {
            pattern: '@context/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@navigation/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@screens/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@components/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@utils/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@types/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@assets/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@hooks/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@common/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@constants/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@theme/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@helpers/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@test-utils/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@mocks/**',
            group: 'internal',
            position: 'before',
          },
          // Ensure external packages like testing libraries remain in the external group
          {
            pattern: '@testing-library/**',
            group: 'external',
            position: 'after',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
  },
};
