const fs = require('fs');
const path = require('path');

const textPath = path.join(__dirname, 'pdf_text.txt');

try {
  const text = fs.readFileSync(textPath, 'utf8');
  const index = text.indexOf('3.2.9. Kukatpally Developers Private Limited');
  if (index !== -1) {
    console.log('Found Kukatpally section at index:', index);
    console.log(text.substring(index, index + 6000));
  } else {
    console.log('Kukatpally section not found.');
  }
} catch (error) {
  console.error(error);
}
