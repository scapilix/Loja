const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('Excel Loja.xlsm');
    const sheetsToCheck = ['VALORES ORIGINAL (4)', 'VALORES ORIGINAL (3)'];
    
    sheetsToCheck.forEach(sheetName => {
        console.log(`\n--- Inspecting contents of "${sheetName}" ---`);
        if (!workbook.Sheets[sheetName]) {
            console.log(`Sheet "${sheetName}" not found.`);
            return;
        }
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, {header: 1});
        
        console.log(`Rows: ${data.length}`);
        if(data.length > 0) {
            const row0 = data[0];
            const row1 = data[1] || [];
            console.log("Header Candidate Row 0:");
            row0.forEach((cell, i) => console.log(` [${i}|${String.fromCharCode(65+i)}]: ${cell}`));
            console.log("Row 1:");
            row1.forEach((cell, i) => console.log(` [${i}|${String.fromCharCode(65+i)}]: ${cell}`));
        }
    });

} catch (e) {
    console.error("Error:", e);
}
