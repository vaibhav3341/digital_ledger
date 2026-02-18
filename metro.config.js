const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const projectRoot = __dirname;
const escapedProjectRoot = projectRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Metro uses "exclusionList" internally. RN exposes it via "blockList".
const config = {
  resolver: {
    blockList: [
      // Android build/cache noise
      /android\/\.gradle\/.*/,
      /android\/build\/.*/,
      /android\/app\/build\/.*/,

      // iOS build/cache noise
      /ios\/build\/.*/,
      /ios\/Pods\/.*/,

      // Git + IDE
      /.*\/\.git\/.*/,
      /.*\/\.idea\/.*/,
      /.*\/\.vscode\/.*/,

      // Ruby / misc large folders in this project only
      new RegExp(`^${escapedProjectRoot}\\/vendor\\/.*`),
      new RegExp(`^${escapedProjectRoot}\\/watchman\\/.*`),

      // Common project output folders (avoid blocking node_modules/*/dist)
      new RegExp(`^${escapedProjectRoot}\\/dist\\/.*`),
      new RegExp(`^${escapedProjectRoot}\\/coverage\\/.*`),
      new RegExp(`^${escapedProjectRoot}\\/tmp\\/.*`),
    ],
  },

  // Keep watch scope minimal (only your project root)
  watchFolders: [projectRoot],
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
