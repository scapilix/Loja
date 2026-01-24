const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'src/data/data.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const data = JSON.parse(rawData);

if (data.orders && data.orders.length > 0) {
    const keys = new Set();
    data.orders.forEach(order => {
        Object.keys(order).forEach(k => keys.add(k));
    });
    
    console.log("--- Available Keys in Orders ---");
    console.log(Array.from(keys).sort());

    console.log("\n--- Sample Order Data (First 3 with most keys) ---");
    const sample = data.orders
        .sort((a, b) => Object.keys(b).length - Object.keys(a).length)
        .slice(0, 3);
    console.log(JSON.stringify(sample, null, 2));
} else {
    console.log("No orders found.");
}
