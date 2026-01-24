
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelFile = 'Excel Loja.xlsm';
const sheetName = 'Encomendas';

try {
    const workbook = XLSX.readFile(excelFile);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Look for a specific range where we expect items and totals
    const sample = data.slice(0, 100).map((row, i) => ({
        index: i + 1,
        id_venda: row[1],
        nome_cliente: row[2],
        ref: row[4],
        pvp: row[5],
        lucro: row[7],
        msano: row[20]
    }));

    fs.writeFileSync('.tmp/encomendas_sample.json', JSON.stringify(sample, null, 2));
    console.log("Sample saved to .tmp/encomendas_sample.json");

} catch (e) {
    console.error(`Error: ${e.message}`);
}
