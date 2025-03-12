// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  "root": true,
  extends: ['expo', "plugin:jest/recommended"],
  ignorePatterns: ['**/node_modules/**', 'android/**', 'ios/**', 'metro.config.js', '**/__mocks__/**'],
  overrides: [
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      extends: ['plugin:testing-library/react'],
      env: {
        jest: true
      }
    },
  ],
  plugins: ['import', "jest"],
  rules: {
    // Enforce a convention in module import order
    'import/order': [
      'error',
      {
        groups: [
          ['internal'], // Internal aliases, if you use paths like "@app/"
          ['builtin', 'external'], // Node built-ins and external packages
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
