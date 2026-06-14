const XLSX = require('xlsx');
const path = require('path');

try {
  const filePath = path.join(__dirname, '..', 'Surplus Material Final.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['Value Estimation'];
  const rows = XLSX.utils.sheet_to_json(sheet);
  
  const summary = {};
  
  rows.forEach((row, idx) => {
    const code = row['Project Code'];
    const name = row['Project Name'];
    const amt = parseFloat(row['Amount']);
    const group = row['Material Group '] || row['Material Group'] || '';
    
    if (!code) return;
    
    if (!summary[code]) {
      summary[code] = {
        name: name,
        itemsCount: 0,
        totalAmount: 0
      };
    }
    
    summary[code].itemsCount++;
    if (!isNaN(amt)) {
      summary[code].totalAmount += amt;
    }
  });
  
  console.log('--- Grouped by Project Code in Value Estimation ---');
  let grandTotal = 0;
  Object.keys(summary).forEach(code => {
    const p = summary[code];
    console.log(`${code} | ${p.name.padEnd(50)} | Items: ${String(p.itemsCount).padStart(3)} | Value (Cr): ${p.totalAmount.toFixed(4)}`);
    grandTotal += p.totalAmount;
  });
  console.log(`Grand Total (Cr): ${grandTotal.toFixed(4)}`);
  
} catch (error) {
  console.error('Error grouping sheet data:', error);
}
