module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "import", "jest"],
  extends: [
    "expo",
    "plugin:jest/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  ignorePatterns: [
    "**/node_modules/**",
    "android/**",
    "ios/**",
    "metro.config.js",
    "**/__mocks__/**",
  ],
  settings: {
    "import/resolver": {
      typescript: {},
    },
  },
  overrides: [
    {
      files: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
      extends: ["plugin:testing-library/react"],
      env: { jest: true },
    },
  ],
  rules: {
    "import/order": [
      "error",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          ["parent", "sibling", "index"],
        ],
        pathGroups: [
          // First ensure our internal module patterns all come before external ones
          {
            pattern:
              "@+(env|context|navigation|screens|components|utils|types|assets|hooks|common|constants|theme|helpers|store|test-utils|mocks)/**",
            group: "internal",
            position: "before",
          },
          // Explicitly set common problematic external modules
          {
            pattern: "react-native*",
            group: "external",
            position: "after",
          },
          {
            pattern: "@react-+(navigation|native)**",
            group: "external",
            position: "after",
          },
          {
            pattern: "@testing-library/**",
            group: "external",
            position: "after",
          },
        ],
        pathGroupsExcludedImportTypes: ["builtin", "react"],
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
      },
    ],
  },
};
