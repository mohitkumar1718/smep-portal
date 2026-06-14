const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

try {
  const filePath = path.join(__dirname, '..', 'Surplus Material Final.xlsx');
  const workbook = XLSX.readFile(filePath);
  
  console.log('Total Sheets:', workbook.SheetNames.length);
  console.log('Sheets List:', workbook.SheetNames);
  
  const projectsSummary = [];
  let totalOverallValueCr = 0;
  let totalOverallItems = 0;

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    // Convert to JSON with header rows
    const rows = XLSX.utils.sheet_to_json(sheet);
    
    // Let's analyze rows
    let projectCode = sheetName;
    let projectName = '';
    let sheetSumCr = 0;
    let validItemsCount = 0;
    
    // We can iterate over rows to find the project details and sum amounts
    rows.forEach((row, idx) => {
      // Find project name from row keys
      const pNameKey = Object.keys(row).find(k => k.toLowerCase().includes('project name'));
      if (pNameKey && row[pNameKey] && !projectName) {
        projectName = String(row[pNameKey]).trim();
      }
      
      const pCodeKey = Object.keys(row).find(k => k.toLowerCase().includes('project code'));
      if (pCodeKey && row[pCodeKey]) {
        projectCode = String(row[pCodeKey]).trim();
      }

      // Find amount key
      const amtKey = Object.keys(row).find(k => k.toLowerCase() === 'amount');
      if (amtKey && row[amtKey] !== undefined) {
        const val = parseFloat(row[amtKey]);
        if (!isNaN(val)) {
          sheetSumCr += val;
          validItemsCount++;
        }
      }
    });

    totalOverallValueCr += sheetSumCr;
    totalOverallItems += validItemsCount;
    
    projectsSummary.push({
      sheetName,
      projectCode,
      projectName: projectName || sheetName,
      totalItems: validItemsCount,
      totalValueCr: parseFloat(sheetSumCr.toFixed(4))
    });
  });

  console.log(`\nAggregated Total Value (Cr): ${totalOverallValueCr.toFixed(2)}`);
  console.log(`Total Materials Count: ${totalOverallItems}`);
  
  fs.writeFileSync(
    path.join(__dirname, 'projects_summary.json'),
    JSON.stringify({
      totalOverallValueCr: parseFloat(totalOverallValueCr.toFixed(4)),
      totalOverallItems,
      projects: projectsSummary
    }, null, 2)
  );
  console.log('Saved summary to inspect/projects_summary.json');
} catch (error) {
  console.error('Error generating summary:', error);
}
