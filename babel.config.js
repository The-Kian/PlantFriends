const isTest = process.env.NODE_ENV === "test";

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Only inject dotenv in non-test environments
      !isTest && [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: ".env",
          safe: false,
          allowUndefined: true,
        },
      ],
      "react-native-reanimated/plugin",
    ].filter(Boolean),
  };
};
