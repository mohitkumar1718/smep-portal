const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const pdfPath = path.join(__dirname, '..', 'Surplus Material Report for the month of May 2026.pdf');
const textOutputPath = path.join(__dirname, 'pdf_text.txt');

try {
  const dataBuffer = fs.readFileSync(pdfPath);
  pdf(dataBuffer).then(function(data) {
    console.log('PDF parsed successfully.');
    console.log('Total pages:', data.numpages);
    fs.writeFileSync(textOutputPath, data.text);
    console.log('Saved PDF text to:', textOutputPath);
    
    // Check if 'Kukatpally' exists in text
    const index = data.text.toLowerCase().indexOf('kukatpally');
    if (index !== -1) {
      console.log('Found "Kukatpally" at index:', index);
      console.log('Context:', data.text.substring(Math.max(0, index - 200), Math.min(data.text.length, index + 200)));
    } else {
      console.log('"Kukatpally" not found in PDF.');
    }
  });
} catch (error) {
  console.error('Error parsing PDF:', error);
}
