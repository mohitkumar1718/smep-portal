const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

try {
  const filePath = path.join(__dirname, '..', 'Surplus Material Final.xlsx');
  const workbook = XLSX.readFile(filePath);
  
  const refSheet = workbook.Sheets['Value Estimation - ref'];
  const refRows = XLSX.utils.sheet_to_json(refSheet);
  
  const valSheet = workbook.Sheets['Value Estimation'];
  const valRows = XLSX.utils.sheet_to_json(valSheet);
  
  console.log('Total rows in Value Estimation - ref:', refRows.length);
  console.log('Total rows in Value Estimation:', valRows.length);
  
  const materials = [];
  
  // Helper to convert Excel date to JS Date ISO string (YYYY-MM-DD)
  function parseExcelDate(val) {
    if (!val) return '2026-05-01';
    
    // If it's a number
    const num = parseFloat(val);
    if (!isNaN(num)) {
      try {
        const date = new Date(Math.round((num - 25569) * 86400 * 1000));
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        // ignore and fallback
      }
    }
    
    // If it's a string, try parsing it
    const str = String(val).trim();
    if (str) {
      // Check for formats like DD-MM-YYYY or YYYY-MM-DD
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    return '2026-05-01';
  }
  
  // Helper to clean make/brand names
  function cleanMake(makeVal) {
    if (!makeVal) return '-';
    const s = String(makeVal).trim();
    if (s === '-' || s === '' || s.toLowerCase() === 'nan' || s.toLowerCase() === 'null') {
      return '-';
    }
    return s;
  }
  
  // Helper to clean UoM
  function cleanUom(uomVal, code) {
    if (!uomVal) return 'Nos';
    const s = String(uomVal).trim();
    if (!isNaN(parseFloat(s))) {
      if (code === 'G28-42008') return 'M';
      return 'Nos';
    }
    return s;
  }

  // 1. Process Value Estimation - ref
  refRows.forEach((row, idx) => {
    const projectCode = String(row['Project Code'] || '').trim();
    if (!projectCode || projectCode.toLowerCase() === 'total') return;
    
    const description = String(row['Material Description'] || '').trim();
    if (!description) return;
    
    let qty = 0;
    let uom = 'Nos';
    let spec = String(row['Spec'] || '').trim();
    let make = cleanMake(row['Make '] || row['Make']);
    
    if (projectCode === 'G20-36003') {
      qty = parseFloat(row['Spec']);
      uom = cleanUom(row['Qty'], projectCode);
      spec = '';
      make = '-';
    } else {
      qty = parseFloat(row['Qty']);
      uom = cleanUom(row['UoM'], projectCode);
    }
    
    if (isNaN(qty) || qty <= 0) return;
    
    const group = String(row['Material Group'] || row['Material Group '] || 'Misc').trim();
    
    // Let's see if we can find declareDate from this row
    // Wait, in Value Estimation - ref, does it have 'Declare Date'?
    // If not, we can lookup in valRows or use default
    let declareDateStr = '2026-05-01';
    
    materials.push({
      projectCode,
      projectName: String(row['Project Name'] || '').trim(),
      materialGroup: group,
      description,
      specification: spec,
      quantity: qty,
      uom,
      make,
      unitRate: parseFloat(row['U/R']) || 0,
      amountCr: parseFloat(row['Amount']) || 0,
      declareDate: declareDateStr
    });
  });
  
  // Now we need to populate declareDate in ref materials by matching with valRows
  materials.forEach(m => {
    // Find matching row in valRows by projectCode and description
    const match = valRows.find(v => 
      String(v['Project Code'] || '').trim() === m.projectCode &&
      String(v['Material Description'] || '').trim() === m.description
    );
    if (match && (match['Declare Date'] || match['Declare Date '])) {
      m.declareDate = parseExcelDate(match['Declare Date'] || match['Declare Date ']);
    } else {
      m.declareDate = '2026-05-01';
    }
  });
  
  // 2. Process G10-44027 (Kukatpally) from Value Estimation
  const kukatpallyRows = valRows.filter(r => String(r['Project Code'] || '').trim() === 'G10-44027');
  
  kukatpallyRows.forEach(row => {
    const qty = parseFloat(row['Qty']);
    if (isNaN(qty) || qty <= 0) return;
    
    const group = String(row['Material Group '] || row['Material Group'] || 'Misc').trim();
    const description = String(row['Material Description'] || '').trim();
    if (!description) return;
    
    materials.push({
      projectCode: 'G10-44027',
      projectName: 'Kukatpally Developers Private Limited',
      materialGroup: group,
      description,
      specification: String(row['Spec'] || '').trim(),
      quantity: qty,
      uom: cleanUom(row['UoM'], 'G10-44027'),
      make: cleanMake(row['Make '] || row['Make']),
      unitRate: parseFloat(row['U/R']) || 0,
      amountCr: parseFloat(row['Amount']) || 0,
      declareDate: parseExcelDate(row['Declare Date'] || row['Declare Date '])
    });
  });
  
  console.log('Total processed materials:', materials.length);
  
  fs.writeFileSync(
    path.join(__dirname, 'materials_clean.json'),
    JSON.stringify(materials, null, 2)
  );
  console.log('Saved to inspect/materials_clean.json');
  
} catch (error) {
  console.error(error);
}
