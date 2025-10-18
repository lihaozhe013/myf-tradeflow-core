const fs = require('fs-extra');
const path = require('path');

fs.removeSync(path.resolve(__dirname, '../../dist'));
fs.ensureDirSync(path.resolve(__dirname, '../../dist'));

let src = path.resolve(__dirname, '../../data/appConfig.json');
let destDir = path.resolve(__dirname, '../../frontend/src/config.json');
let dest = path.resolve(__dirname, '../../frontend/src/config/appConfig.json');
fs.ensureDirSync(destDir);
fs.copySync(src, dest);
console.log('appConfig.json copied successfully!');

src = path.resolve(__dirname, '../../data/logo.svg');
destDir = path.resolve(__dirname, '../../frontend/public');
dest = path.resolve(__dirname, '../../frontend/public/logo.svg');
fs.ensureDirSync(destDir);
fs.copySync(src, dest);
console.log('logo.svg copied successfully!');
