const XLSX = require('xlsx');
const path = require('path');

const projectCodes = [
  'G10-44040', 'G10-44039', 'G10-10030', 'G10-42020', 'G10-34010',
  'G10-46003', 'G10-46009', 'G10-46012', 'G10-46010', 'C10-46030',
  'G10-24005', 'G10-44027', 'G10-30013', 'G28-44006', 'G28-28003',
  'G28-44003', 'G79-36001', 'G79-36002', 'G28-28001', 'G28-42008',
  'G20-36003'
];

try {
  const filePath = path.join(__dirname, '..', 'Surplus Material Final.xlsx');
  const workbook = XLSX.readFile(filePath);
  
  console.log('Project Code | Sheet Exists | Rows Count | Amount Sum (Cr)');
  console.log('------------------------------------------------------------');
  
  projectCodes.forEach(code => {
    const sheet = workbook.Sheets[code];
    if (!sheet) {
      console.log(`${code.padEnd(12)} | No           | -          | -`);
      return;
    }
    const rows = XLSX.utils.sheet_to_json(sheet);
    let sumCr = 0;
    rows.forEach(row => {
      const amtKey = Object.keys(row).find(k => k.toLowerCase() === 'amount');
      if (amtKey && row[amtKey] !== undefined) {
        const val = parseFloat(row[amtKey]);
        if (!isNaN(val)) {
          sumCr += val;
        }
      }
    });
    console.log(`${code.padEnd(12)} | Yes          | ${String(rows.length).padStart(10)} | ${sumCr.toFixed(4)}`);
  });
} catch (error) {
  console.error(error);
}
