const fs = require('fs');
const path = require('path');

const textPath = path.join(__dirname, 'pdf_text.txt');

try {
  const text = fs.readFileSync(textPath, 'utf8');
  
  // Find "3.1.1" or "3.1.2"
  const idx1 = text.indexOf('VITP Pvt Ltd');
  if (idx1 !== -1) {
    console.log('VITP section context:');
    console.log(text.substring(idx1 - 100, idx1 + 1000));
  }
  
  const idx2 = text.indexOf('3.1.2.');
  if (idx2 !== -1) {
    console.log('3.1.2 section context:');
    console.log(text.substring(idx2 - 100, idx2 + 1000));
  }
} catch (error) {
  console.error(error);
}
