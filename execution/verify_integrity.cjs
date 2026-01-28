
const fs = require('fs');
const path = require('path');

const tmpPath = path.resolve(__dirname, '../.tmp/data_transformed.json');
const srcPath = path.resolve(__dirname, '../src/data/data.json');

function analyze(filePath, label) {
    if (!fs.existsSync(filePath)) {
        console.log(`[${label}] File not found: ${filePath}`);
        return;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    console.log(`[${label}] Orders: ${data.orders.length}`);
    
    const joanas = data.orders.filter(o => 
        (o.nome_cliente && o.nome_cliente.toUpperCase().includes('JOANA')) ||
        (o.instagram && o.instagram.toUpperCase().includes('JOANA'))
    );
    console.log(`[${label}] Joana Orders: ${joanas.length}`);
    joanas.forEach(j => {
        console.log(`   - ${j.data_venda} | ${j.instagram} | ${j.nome_cliente} | PVP: ${j.pvp}`);
    });

    // Check for identical order objects
    const seen = new Set();
    let dups = 0;
    data.orders.forEach(o => {
        const key = JSON.stringify(o);
        if (seen.has(key)) dups++;
        seen.add(key);
    });
    console.log(`[${label}] Exact Duplicates: ${dups}`);
}

analyze(tmpPath, 'TMP');
analyze(srcPath, 'SRC');
