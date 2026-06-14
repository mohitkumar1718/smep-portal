const XLSX = require('xlsx');
const path = require('path');

try {
  const filePath = path.join(__dirname, '..', 'Surplus Material Final.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['Value Estimation'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log('Total rows in Value Estimation:', data.length);
  console.log('Headers:', data[0]);
  console.log('Sample rows:');
  for (let i = 1; i < Math.min(data.length, 25); i++) {
    console.log(`Row ${i}:`, data[i]);
  }
} catch (error) {
  console.error('Error reading excel sheet:', error);
}
