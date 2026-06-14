const XLSX = require('xlsx');
const path = require('path');

try {
  const filePath = path.join(__dirname, '..', 'Surplus Material Final.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['Value Estimation - ref'];
  const rows = XLSX.utils.sheet_to_json(sheet);
  
  const fRows = rows.filter(r => String(r['Project Code'] || '').trim() === 'G20-36003');
  console.log('Total rows for G20-36003 in ref:', fRows.length);
  if (fRows.length > 0) {
    console.log('Sample row:', fRows[0]);
  }
} catch (error) {
  console.error(error);
}
