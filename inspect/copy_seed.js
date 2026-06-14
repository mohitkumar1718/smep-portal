const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'materials_clean.json');
const destDir = path.join(__dirname, '..', 'src', 'data');
const destPath = path.join(destDir, 'materials_clean.json');

try {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(srcPath, destPath);
  console.log('Successfully copied materials_clean.json to src/data/');
} catch (error) {
  console.error('Error copying file:', error);
}
