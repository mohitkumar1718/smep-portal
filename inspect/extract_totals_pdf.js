const fs = require('fs');
const path = require('path');

const textPath = path.join(__dirname, 'pdf_text.txt');

try {
  const text = fs.readFileSync(textPath, 'utf8');
  
  // Find all matches of "Total (In Rs. Cr.)"
  const regex = /Total\s*\(In\s*Rs\.\s*Cr\.\)/gi;
  let match;
  let count = 0;
  
  while ((match = regex.exec(text)) !== null) {
    count++;
    const idx = match.index;
    console.log(`\n=== Match ${count} (Index ${idx}) ===`);
    // Print the preceding 250 characters
    const start = Math.max(0, idx - 250);
    console.log(text.substring(start, idx + 30).trim());
  }
} catch (error) {
  console.error(error);
}
