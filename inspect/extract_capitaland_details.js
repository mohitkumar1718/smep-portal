const fs = require('fs');
const path = require('path');

const textPath = path.join(__dirname, 'pdf_text.txt');

try {
  const text = fs.readFileSync(textPath, 'utf8');
  
  // Find "3.1.1" or "G28-44006"
  const idx = text.indexOf('3.1.1.');
  if (idx !== -1) {
    console.log('3.1.1 section context:');
    console.log(text.substring(idx - 100, idx + 1000));
  } else {
    // If 3.1.1 is not found, search for G28-44006
    const idx2 = text.indexOf('G28-44006');
    if (idx2 !== -1) {
      console.log('G28-44006 context:');
      console.log(text.substring(idx2 - 100, idx2 + 1000));
    }
  }
} catch (error) {
  console.error(error);
}
