
const XLSX = require('xlsx');
const fs = require('fs');

const excelFile = 'Excel Loja.xlsm';

try {
    const workbook = XLSX.readFile(excelFile);
    const sheetNames = workbook.SheetNames;
    console.log(`Sheet names: ${sheetNames}`);

    const summary = {};
    sheetNames.slice(0, 10).forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 0 }); // Read top rows
        
        if (data.length > 0) {
            summary[sheetName] = {
                columns: data[0],
                preview: data.slice(1, 4) // First 3 rows of data
            };
        }
    });

    fs.writeFileSync('excel_analysis.json', JSON.stringify(summary, null, 2));
    console.log("Analysis saved to excel_analysis.json");

} catch (e) {
    console.error(`Error: ${e.message}`);
}
