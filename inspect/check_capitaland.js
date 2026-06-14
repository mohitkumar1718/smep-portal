const fs = require('fs');
const path = require('path');

const textPath = path.join(__dirname, 'pdf_text.txt');

try {
  const text = fs.readFileSync(textPath, 'utf8');
  // Search for CapitaLand or VITP
  const index = text.indexOf('CapitaLand');
  if (index !== -1) {
    console.log('Found CapitaLand at index:', index);
    console.log(text.substring(index - 200, index + 1500));
  } else {
    console.log('CapitaLand not found.');
  }
} catch (error) {
  console.error(error);
}
