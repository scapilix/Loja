
const fs = require('fs');
const path = require('path');

const srcPath = path.resolve(__dirname, '../src/data/data.json');
const rawData = JSON.parse(fs.readFileSync(srcPath, 'utf8'));

// MOCK LOGIC FROM useDashboardData.ts
// -----------------------------------

    let orders = rawData.orders || [];

    // Prepare customer lookup maps from database
    const customerDbMap = new Map(); // Key: Instagram
    const customerNameMap = new Map(); // Key: Name (for fallback lookup)

    if (rawData.customers && Array.isArray(rawData.customers)) {
        rawData.customers.forEach((c) => {
            const name = c.nome_cliente ? c.nome_cliente.trim().toUpperCase() : '';
            if (name) {
                customerNameMap.set(name, c);
            }

            if (c.instagram && c.instagram !== 'N/A' && c.instagram !== '-') {
                const cleanInsta = c.instagram.trim().toUpperCase().replace('@', '');
                customerDbMap.set(cleanInsta, c);
            }
        });
    }

    const customerMap = {}; 

    orders.forEach((order) => {
      const pvp = parseFloat(String(order.pvp)) || 0;
      const customer = order.nome_cliente || 'Cliente Desconhecido';
      const instagram = order.instagram || 'N/A';
      
      const rawInsta = (instagram || '').trim();
      const hasInsta = rawInsta && rawInsta !== 'N/A' && rawInsta !== '-';
      const cleanInsta = hasInsta ? rawInsta.toUpperCase().replace('@', '') : '';
      const cleanName = customer.trim().toUpperCase();

      let customerKey = '';
      let resolvedInsta = hasInsta ? cleanInsta : '';
      let dbCustomer = null;

      if (resolvedInsta) {
          customerKey = resolvedInsta;
          dbCustomer = customerDbMap.get(resolvedInsta);
      } else {
          // STRICT RULE
          customerKey = `NAME:${cleanName}`;
      }
      
      if (!customerMap[customerKey]) {
        customerMap[customerKey] = { 
          revenue: 0, 
          orders: 0,
          instagram: resolvedInsta ? (dbCustomer?.instagram || instagram) : 'N/A',
          address: dbCustomer?.morada || '',
          history: []
        };
      }
      
      customerMap[customerKey].revenue += pvp;
      customerMap[customerKey].orders += 1;
      customerMap[customerKey].history.push(order);
      
      if (customerMap[customerKey].instagram === 'N/A' && hasInsta) {
         customerMap[customerKey].instagram = instagram;
      }
    });

    // 1. Convert Sales Map to List
    const activeCustomers = Object.entries(customerMap).map(([key, data]) => {
      let dbC = null;
      if (key.startsWith('NAME:')) {
          const namePart = key.replace('NAME:', '');
          dbC = customerNameMap.get(namePart);
      } else {
          dbC = customerDbMap.get(key); // key is instagram
      }

      const displayName = dbC?.nome_cliente || data.history[0]?.nome_cliente || 'Sem Nome';
      
      return {
        name: displayName,
        revenue: data.revenue,
        orders: data.orders,
        instagram: dbC?.instagram || data.instagram || '-',
        _key: key
      };
    });

    // 2. Add customers from DB that had NO sales
    const processedKeys = new Set(activeCustomers.map(c => c._key));
    
    (rawData.customers || []).forEach((dbC) => {
        let key = '';
        if (dbC.instagram && dbC.instagram !== 'N/A' && dbC.instagram !== '-') {
            key = dbC.instagram.trim().toUpperCase().replace('@', '');
        } else if (dbC.nome_cliente) {
            key = `NAME:${dbC.nome_cliente.trim().toUpperCase()}`;
        }

        if (key && !processedKeys.has(key)) {
            // Add inactive customer
            activeCustomers.push({
                name: dbC.nome_cliente || 'Sem Nome',
                revenue: 0,
                orders: 0,
                instagram: dbC.instagram || '-',
                _key: key
            });
            processedKeys.add(key);
        }
    });

    const allCustomers = activeCustomers.sort((a, b) => b.revenue - a.revenue);

// OUTPUT ANALYSIS
// ---------------
console.log('--- ANALYSIS RESULTS ---');
const joanas = allCustomers.filter(c => c.name.toUpperCase().includes('JOANA') || c.instagram.toUpperCase().includes('JOANA') || c.instagram.toUpperCase().includes('JOIART'));

joanas.forEach(c => {
    console.log(`Customer: ${c.name} | Insta: ${c.instagram} | Revenue: ${c.revenue} | Orders: ${c.orders}`);
});

