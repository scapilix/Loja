const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('Excel Loja.xlsm');
    const sheetName = 'Valores Original';
    
    if (!workbook.Sheets[sheetName]) {
        console.log(`Sheet "${sheetName}" not found. Available sheets:`, workbook.SheetNames);
    } else {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, {header: 1}); // Array of arrays
        
        console.log("First 3 rows with indexes:");
        data.slice(0, 3).forEach((row, rowIndex) => {
            console.log(`\nRow ${rowIndex}:`);
            row.forEach((cell, colIndex) => {
                // Convert 0-based index to Excel Column Letter (A=0, B=1, etc.)
                const colLetter = String.fromCharCode(65 + colIndex);
                // Handle double letters if needed (simplified for A-Z)
                console.log(`  [${colIndex} | ${colLetter}]: ${cell}`);
            });
        });
    }
} catch (e) {
    console.error("Error:", e);
}
