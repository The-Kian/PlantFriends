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
          "@context": "./src/context",
          "@navigation": "./src/components/navigation",
          "@components": "./src/components",
          "@screens": "./src/screens",
          "@utils": "./src/utils",
          "@types": "./src/types",
          "@assets": "./assets",
          "@constants": "./src/constants",
          "@hooks": "./src/hooks",
          "@theme": "./src/theme",
          "@helpers": "./src/helpers",
          "@test-utils": "./src/test-utils",
          "@common": "./src/common",
          "@store": "./src/store",
          "@mocks": "./__mocks__",
        },
      },
    ],
    "react-native-reanimated/plugin",
  ].filter(Boolean),
};
