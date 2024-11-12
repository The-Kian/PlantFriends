// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  ignorePatterns: ['**/node_modules/**', 'android/**', 'ios/**', 'metro.config.js'],
  overrides: [
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      extends: ['plugin:testing-library/react'],
    },
  ],
  plugins: ['import'],
  rules: {
    // Enforce a convention in module import order
    'import/order': [
      'error',
      {
        groups: [
          ['builtin', 'external'], // Node built-ins and external packages
          ['internal'], // Internal aliases, if you use paths like "@app/"
          ['parent', 'sibling', 'index'], // Parent imports, sibling imports, and index files
        ],
        pathGroups: [
          {
            pattern: '@**/**',
            group: 'internal',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc', // Order imports alphabetically
          caseInsensitive: true, // Ignore case when ordering
        },
      },
    ],
  },
};
