const XLSX = require('xlsx');
const path = require('path');

try {
  const filePath = path.join(__dirname, '..', 'Surplus Material Final.xlsx');
  const workbook = XLSX.readFile(filePath);
  
  const sheetVal = workbook.Sheets['Value Estimation'];
  const rowsVal = XLSX.utils.sheet_to_json(sheetVal);
  const kVal = rowsVal.filter(r => r['Project Code'] === 'G10-44027');
  console.log(`Value Estimation rows for G10-44027: ${kVal.length}`);
  
  const sheetRef = workbook.Sheets['Value Estimation - ref'];
  const rowsRef = XLSX.utils.sheet_to_json(sheetRef);
  const kRef = rowsRef.filter(r => r['Project Code'] === 'G10-44027');
  console.log(`Value Estimation - ref rows for G10-44027: ${kRef.length}`);
  
  // Let's check if the sheet G10-44027 itself has rows
  const sheetSelf = workbook.Sheets['G10-44027'];
  if (sheetSelf) {
    const rowsSelf = XLSX.utils.sheet_to_json(sheetSelf);
    console.log(`Self sheet G10-44027 rows: ${rowsSelf.length}`);
  }
} catch (error) {
  console.error(error);
}
