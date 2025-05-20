// babel.config.js
const isTest = process.env.NODE_ENV === "test";

module.exports = {
  presets: ["babel-preset-expo"],
  plugins: [
    // only strip out `@env` imports in non-test builds
    !isTest && [
      "module:react-native-dotenv",
      {
        moduleName: "@env",
        path: ".env",
        safe: false,
        allowUndefined: true,
      },
    ],

    // your resolver + RNReanimated plugin
    [
      "module-resolver",
      {
        root: ["."],
        alias: {
          "^@/(.+)": "./\\1",
        },
      },
    ],
    "react-native-reanimated/plugin",
  ].filter(Boolean),
};
