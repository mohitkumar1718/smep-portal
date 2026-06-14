const fs = require('fs');
const path = require('path');

const textPath = path.join(__dirname, 'pdf_text.txt');

try {
  const text = fs.readFileSync(textPath, 'utf8');
  const index = text.indexOf('G10-44027 Kukatpally Developers Private Limited');
  if (index !== -1) {
    // Find the next occurrence of "Total (In Rs. Cr.)" after the start of Kukatpally section
    const nextTotalIndex = text.indexOf('Total (In Rs. Cr.)', index);
    if (nextTotalIndex !== -1) {
      console.log('Found next total index:', nextTotalIndex);
      // Print context of about 200 characters before the total
      console.log(text.substring(nextTotalIndex - 150, nextTotalIndex + 50));
    }
  }
} catch (error) {
  console.error(error);
}
