// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
const path = require('path')

config.resolver.alias = {
    '@': __dirname,
    "@context": path.resolve(__dirname, "src/context"),
    "@components": path.resolve(__dirname, "src/components"),
    "@screens": path.resolve(__dirname, "src/screens"),
    "@utils": path.resolve(__dirname, "src/utils"),
    "@assets": path.resolve(__dirname, "src/assets"),
    "@constants": path.resolve(__dirname, "src/constants"),
    "@hooks": path.resolve(__dirname, "src/hooks"),
    "@theme": path.resolve(__dirname, "src/theme"),
    "@helpers": path.resolve(__dirname, "src/helpers"),
    "@test-utils": path.resolve(__dirname, "src/test-utils"),
    "@common": path.resolve(__dirname, "src/common"),
  };

module.exports = config;
