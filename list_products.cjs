const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'src/data/data.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const data = JSON.parse(rawData);

const products = new Set();
const refs = new Set();

data.orders.forEach(order => {
    if (order.items) {
        order.items.forEach(item => {
            if (item.designacao) products.add(item.designacao);
            if (item.ref) refs.add(item.ref);
        });
    }
});

console.log("--- Unique Designations (First 100) ---");
console.log(Array.from(products).sort().slice(0, 100));

console.log("\n--- Unique Refs (First 100) ---");
console.log(Array.from(refs).sort().slice(0, 100));
