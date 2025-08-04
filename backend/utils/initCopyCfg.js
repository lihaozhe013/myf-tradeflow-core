const fs = require('fs-extra');
const path = require('path');

/**
 * 复制 ../data/appConfig.json 到 ../frontend/src/config/ 目录下
 */
async function copyAppConfig() {
  const src = path.resolve(__dirname, '../../data/appConfig.json');
  const destDir = path.resolve(__dirname, '../../frontend/src/config');
  const dest = path.join(destDir, 'appConfig.json');
  try {
    await fs.ensureDir(destDir);
    await fs.copy(src, dest);
    console.log('appConfig.json copied successfully!');
  } catch (err) {
    console.error('Failed to copy appConfig.json:', err);
  }
}

module.exports = { copyAppConfig };

async function copyIcon() {
  const src = path.resolve(__dirname, '../../data/logo.svg');
  const destDir = path.resolve(__dirname, '../../frontend/public');
  const dest = path.join(destDir, 'logo.svg');
  try {
    await fs.ensureDir(destDir);
    await fs.copy(src, dest);
    console.log('logo.svg copied successfully!');
  } catch (err) {
    console.error('Failed to copy logo.svg:', err);
  }
}

module.exports = { copyAppConfig, copyIcon };
copyAppConfig();
copyIcon();