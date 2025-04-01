// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Optimize asset loading
config.resolver.assetExts.push('mp3');

// Configure the Metro bundler for better performance with audio files
module.exports = config;
