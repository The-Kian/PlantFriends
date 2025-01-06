// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: ['expo', "plugin:jest/recommended"],
  ignorePatterns: ['**/node_modules/**', 'android/**', 'ios/**', 'metro.config.js'],
  overrides: [
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      extends: ['plugin:testing-library/react'],
      env: {
        jest: true
      }
    },
  ],
  rules: {
    'import/order': [
      'error',
      {
        groups: [
          // Default groups: built-in, external, parent, sibling, index
          ['builtin', 'external'],
          ['internal'],
          ['parent', 'sibling', 'index'],
        ],
        // Add your custom pathGroups
        pathGroups: [
          {
            pattern: '@screens/**',
            group: 'internal', // or create a custom group name
            position: 'after', // or 'before' depending on your preference
          },
          // you can add more aliases here if you like
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        // The "newlines-between" enforces an empty line between groups
        'newlines-between': 'always',
        // Optional: let ESLint automatically fix incorrect import order
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
  },
};
