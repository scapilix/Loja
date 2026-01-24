const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'src/data/data.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const data = JSON.parse(rawData);

if (data.customers && data.customers.length > 0) {
    console.log("--- Customer Keys ---");
    const keys = new Set();
    data.customers.slice(0, 10).forEach(c => Object.keys(c).forEach(k => keys.add(k)));
    console.log(Array.from(keys).sort());
    
    console.log("\n--- Sample Customer ---");
    console.log(JSON.stringify(data.customers[0], null, 2));
} else {
    console.log("Customers key found but empty.");
}
