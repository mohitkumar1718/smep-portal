const XLSX = require('xlsx');
const path = require('path');

try {
  const filePath = path.join(__dirname, '..', 'Surplus Material Final.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['G10-44027'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log('Total rows:', data.length);
  console.log('Last 5 rows:');
  for (let i = Math.max(0, data.length - 5); i < data.length; i++) {
    console.log(`Row ${i}:`, data[i]);
  }
} catch (error) {
  console.error(error);
}
