
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelFile = path.resolve(__dirname, '../Excel Loja.xlsm');
const outputDir = path.resolve(__dirname, '../.tmp');
const outputFile = path.join(outputDir, 'data_transformed.json');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

function cleanHeader(header) {
    if (!header) return null;
    return header.toString()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^\w\s]/gi, '')
        .trim();
}

function transformSheet(workbook, sheetName) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return null;

    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (rawData.length < 2) return null;

    // Find first non-empty row for headers
    let headerRowIndex = 0;
    while (headerRowIndex < rawData.length && (!rawData[headerRowIndex] || rawData[headerRowIndex].length < 3)) {
        headerRowIndex++;
    }

    const headers = rawData[headerRowIndex].map(cleanHeader);
    const rows = rawData.slice(headerRowIndex + 1)
        .filter(row => row.length > 0 && row.some(cell => cell !== null && cell !== ''));

    if (sheetName === 'Encomendas') {
        const groupedOrders = [];
        let currentItems = [];

        rows.forEach((row) => {
            const obj = {};
            headers.forEach((header, index) => {
                if (header) obj[header] = row[index];
            });

            // Check if this is a TOTAL row (marked as REF = TOTAL in previous analysis)
            const isTotalRow = obj.ref && obj.ref.toString().toUpperCase() === 'TOTAL';

            if (isTotalRow) {
                // This row marks the end of a sale
                groupedOrders.push({
                    ...obj,
                    items: [...currentItems],
                    item_count: currentItems.length
                });
                currentItems = [];
            } else {
                // This is an item
                if (obj.ref) currentItems.push(obj);
            }
        });
        return groupedOrders;
    }

    if (sheetName === 'VALORES ORIGINAL (4)') {
        // Skip header row (Row 0)
        return rows.map(row => {
            const ref = row[1]; // Col B
            if (!ref) return null;
            
            const refString = String(ref).trim();
            const hasSSuffix = refString.toUpperCase().endsWith('S');
            
            // PVP Logic: If ends with S -> Col H (index 7), else Col G (index 6)
            let pvp = hasSSuffix ? row[7] : row[6];
            
            // Fallback: If selected PVP is empty/0, try the other one just in case, or keep 0
            if (!pvp && hasSSuffix) pvp = row[6]; 
            if (!pvp && !hasSSuffix) pvp = row[7];
            
            return {
                ref: refString,
                nome_artigo: row[2], // Col C
                category: row[3], // Col D
                stock: row[4], // Col E
                pvp_cica: typeof pvp === 'number' ? pvp : parseFloat(String(pvp || 0).replace(/[^0-9.-]+/g, "")),
                iva: row[11], // Col L
                lucro_meu_faturado: row[13], // Col N
                base_price: row[10], // Col K (BASE)
                fornecedor: row[16] // Col Q
            };
        }).filter(item => item !== null && item.ref !== 'REF'); // Filter out empty or header repetition
    }

    // Default transform for other sheets
    return rows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            if (header) obj[header] = row[index];
        });
        return obj;
    });
}

try {
    console.log(`Reading Excel: ${excelFile}...`);
    const workbook = XLSX.readFile(excelFile, { cellDates: true });
    
    const transformedData = {
        customers: transformSheet(workbook, 'BD Clientes'),
        orders: transformSheet(workbook, 'Encomendas'),
        stock: transformSheet(workbook, 'STOCK MASTER'),
        products_catalog: transformSheet(workbook, 'VALORES ORIGINAL (4)'),
        stats: transformSheet(workbook, 'Estatisticas'),
        timestamp: new Date().toISOString()
    };

    fs.writeFileSync(outputFile, JSON.stringify(transformedData, null, 2));
    console.log(`Transformation complete! Saved to ${outputFile}`);
    
    // Also save to src/data for development
    const srcDataDir = path.resolve(__dirname, '../src/data');
    if (!fs.existsSync(srcDataDir)) fs.mkdirSync(srcDataDir, { recursive: true });
    fs.writeFileSync(path.join(srcDataDir, 'data.json'), JSON.stringify(transformedData, null, 2));
    console.log(`Data copied to src/data/data.json`);

} catch (error) {
    console.error(`Error during transformation:`, error.message);
    process.exit(1);
}
