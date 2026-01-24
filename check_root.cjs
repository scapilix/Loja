const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'src/data/data.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const data = JSON.parse(rawData);

console.log("--- Top Level Keys ---");
console.log(Object.keys(data).sort());

if (data.bdd_clientes || data.clientes || data.base_clientes) {
    const clients = data.bdd_clientes || data.clientes || data.base_clientes;
    console.log("\n--- Client Data Found ---");
    console.log("Count:", clients.length);
    if (clients.length > 0) {
        console.log("Keys:", Object.keys(clients[0]));
    }
}
