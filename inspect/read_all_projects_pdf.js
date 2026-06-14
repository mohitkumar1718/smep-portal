const fs = require('fs');
const path = require('path');

const textPath = path.join(__dirname, 'pdf_text.txt');

try {
  const text = fs.readFileSync(textPath, 'utf8');
  
  // Find project section headings like '3.2.1', '3.1.2', etc.
  const regex = /(\d+\.\d+\.\d+\.\s+.*?)\r?\n/g;
  let match;
  console.log('--- Project Sections found in PDF text ---');
  while ((match = regex.exec(text)) !== null) {
    console.log(match[1].trim());
  }

  // Also print all occurrences of codes like G10-xxxx, C10-xxxx, etc.
  console.log('\n--- Project Codes in PDF ---');
  const codeRegex = /[CG]\d{2}-\d{5}/g;
  const codes = new Set(text.match(codeRegex));
  console.log(Array.from(codes));

} catch (error) {
  console.error('Error reading pdf_text.txt:', error);
}
