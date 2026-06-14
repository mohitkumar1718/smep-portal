const XLSX = require('xlsx');
const path = require('path');

try {
  const filePath = path.join(__dirname, '..', 'Surplus Material Final.xlsx');
  const workbook = XLSX.readFile(filePath);
  
  ['Final', 'Final Final', 'Value Estimation - ref'].forEach(name => {
    const sheet = workbook.Sheets[name];
    if (!sheet) {
      console.log(`Sheet "${name}" not found.`);
      return;
    }
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`\n--- Sheet: ${name} ---`);
    console.log(`Total Rows: ${data.length}`);
    if (data.length > 0) {
      console.log('Headers:', data[0]);
      console.log('Sample Rows (first 5):');
      for (let i = 1; i < Math.min(data.length, 6); i++) {
        console.log(`Row ${i}:`, data[i]);
      }
    }
  });
} catch (error) {
  console.error('Error reading excel sheet:', error);
}
