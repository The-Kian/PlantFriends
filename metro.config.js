// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
const path = require('path')

config.resolver.alias = {
    '@': __dirname,
    "@context": path.resolve(__dirname, "src/context"),
    "@navigation": path.resolve(__dirname, "src/components/navigation"),
    "@components": path.resolve(__dirname, "src/components"),
    "@screens": path.resolve(__dirname, "src/screens"),
    "@utils": path.resolve(__dirname, "src/utils"),
    "@types": path.resolve(__dirname, "src/types"),
    "@assets": path.resolve(__dirname, "assets"),
    "@constants": path.resolve(__dirname, "src/constants"),
    "@hooks": path.resolve(__dirname, "src/hooks"),
    "@theme": path.resolve(__dirname, "src/theme"),
    "@helpers": path.resolve(__dirname, "src/helpers"),
    "@test-utils": path.resolve(__dirname, "src/test-utils"),
    "@common": path.resolve(__dirname, "src/common"),
    "@store": path.resolve(__dirname, "src/store"),
    "@mocks": path.resolve(__dirname, "__mocks__"),
  };

module.exports = config;
