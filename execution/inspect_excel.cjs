const XLSX = require('xlsx');

const cleanHeader = (header) => {
    if (!header) return null;
    return header.toString()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w\s]/gi, '')
      .trim();
  };

try {
    const workbook = XLSX.readFile('Excel Loja.xlsm');
    const sheetName = 'Encomendas';

    
    if (!workbook.Sheets[sheetName]) {
        console.log(`Sheet "${sheetName}" not found. Available sheets:`, workbook.SheetNames);
    } else {
        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet, {header: 1});
        
        let headerRowIndex = 0;
        while (headerRowIndex < rawData.length && (!rawData[headerRowIndex] || rawData[headerRowIndex].filter(c => c !== null && c !== '').length < 3)) {
          headerRowIndex++;
        }

        const rawHeaders = rawData[headerRowIndex];
        console.log("RAW HEADERS:", JSON.stringify(rawHeaders));
        
        const cleanedHeaders = rawHeaders.map(cleanHeader);
        
        console.log("\nHEADER MAPPING:");
        rawHeaders.forEach((h, i) => {
            console.log(`  [${i}]: "${h}" -> "${cleanedHeaders[i]}"`);
        });

        console.log("\nSAMPLE DATA (ROW 1):");
        const firstDataRow = rawData[headerRowIndex + 1];
        cleanedHeaders.forEach((header, i) => {
            if (header) console.log(`  ${header}: ${firstDataRow[i]}`);
        });
    }
} catch (e) {
    console.error("Error:", e);
}


