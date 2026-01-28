
const fs = require('fs');
const path = require('path');

const dataPath = path.resolve(__dirname, '../.tmp/data_transformed.json');

try {
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);
    
    console.log(`Total Orders: ${data.orders.length}`);
    
    const targetName = 'JOANA PACHECO';
    const orders = data.orders.filter(o => 
        (o.nome_cliente && o.nome_cliente.toUpperCase().includes(targetName)) ||
        (o.instagram && o.instagram.toUpperCase().includes('JOANA')) ||
        (o.instagram && o.instagram.toUpperCase().includes('JOIART'))
    );
    
    console.log(`Found ${orders.length} orders for ${targetName} / JOIART`);
    
    orders.forEach((o, i) => {
        console.log(`[${i+1}] Date: ${o.data_venda} | ID: ${o.id_venda} | Name: ${o.nome_cliente} | Insta: ${o.instagram} | PVP: ${o.pvp}`);
    });

    // Also check customers list
    console.log('\n--- Customers in DB ---');
    const customers = data.customers.filter(c => 
        (c.nome_cliente && c.nome_cliente.toUpperCase().includes(targetName)) ||
        (c.instagram && c.instagram.toUpperCase().includes('JOANA')) ||
        (c.instagram && c.instagram.toUpperCase().includes('JOIART'))
    );
    customers.forEach((c, i) => {
        console.log(`[${i+1}] Name: ${c.nome_cliente} | Insta: ${c.instagram}`);
    });

} catch (e) {
    console.error(e);
}
