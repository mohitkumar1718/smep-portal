const XLSX = require('xlsx');
const path = require('path');

try {
  const filePath = path.join(__dirname, '..', 'Surplus Material Final.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['Value Estimation - ref'];
  const rows = XLSX.utils.sheet_to_json(sheet);
  
  const projectsSeen = new Set();
  
  rows.forEach((row, idx) => {
    const code = String(row['Project Code'] || '').trim();
    if (!code || code.toLowerCase() === 'total') return;
    
    if (!projectsSeen.has(code)) {
      projectsSeen.add(code);
      console.log(`\nProject: ${code} (${row['Project Name']})`);
      console.log('Keys:', Object.keys(row));
      console.log('Sample Row:', row);
    }
  });
} catch (error) {
  console.error(error);
}
