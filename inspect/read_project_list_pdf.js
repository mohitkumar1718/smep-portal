const fs = require('fs');
const path = require('path');

const textPath = path.join(__dirname, 'pdf_text.txt');

try {
  const text = fs.readFileSync(textPath, 'utf8');
  const index = text.indexOf('VerticalProjectJob Value');
  if (index !== -1) {
    console.log('Found table header at index:', index);
    console.log(text.substring(index, index + 2500));
  } else {
    console.log('Table header not found.');
  }
} catch (error) {
  console.error(error);
}
