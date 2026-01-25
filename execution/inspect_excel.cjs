const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('Excel Loja.xlsm');
    const sheetName = 'Valores Original';
    
    if (!workbook.Sheets[sheetName]) {
        console.log(`Sheet "${sheetName}" not found. Available sheets:`, workbook.SheetNames);
    } else {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, {header: 1}); // Array of arrays
        
        console.log("Headers (Row 1):", data[0]);
        console.log("First 5 rows:");
        data.slice(0, 5).forEach((row, i) => console.log(`Row ${i}:`, row));
    }
} catch (e) {
    console.error("Error:", e);
}
