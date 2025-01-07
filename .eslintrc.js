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
  plugins: ['import', "jest"],
  
};
