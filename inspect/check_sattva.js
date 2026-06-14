const XLSX = require('xlsx');
const path = require('path');

try {
  const filePath = path.join(__dirname, '..', 'Surplus Material Final.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['G10-44040'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(data);
} catch (error) {
  console.error(error);
}
