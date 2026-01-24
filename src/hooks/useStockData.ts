import { useMemo } from 'react';
import rawData from '../data/data.json';

export interface StockItem {
  id: string;
  name: string;
  ref: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  avgPrice: number;
  totalValue: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Overstock';
  category: string;
  lastRestock: string;
}

export interface StockMetrics {
  totalStockValue: number;
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  topValueItem: StockItem | null;
  stockItems: StockItem[];
}

// Pseudo-random number generator for deterministic results based on seed
const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

export const useStockData = (): StockMetrics => {
  return useMemo(() => {
    const orders = (rawData as any).orders || [];
    const productMap = new Map<string, { priceSum: number; count: number; name: string }>();

    // 1. Extract unique products from orders to build our "catalog"
    orders.forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const ref = String(item.ref || 'UNKNOWN');
          // Try to get a clean name. Sometimes name is in the item, sometimes we infer it.
          // For this mock, we'll use the REF as the name if name is missing, or try to find a name mapping.
          // In the provided data, items often just have 'ref', 'pvp', 'lucro'. 
          // We will use 'ref' as the display name for now as it seems to be the product identifier.
          const name = ref; 
          const pvp = parseFloat(String(item.pvp)) || 0;

          if (!productMap.has(ref)) {
            productMap.set(ref, { priceSum: 0, count: 0, name });
          }
          
          const entry = productMap.get(ref)!;
          entry.priceSum += pvp;
          entry.count += 1;
        });
      }
    });

    const stockItems: StockItem[] = [];
    let totalStockValue = 0;
    let totalItems = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    
    // 2. Generate detailed mock stock data for each product
    Array.from(productMap.entries()).forEach(([ref, data], index) => {
      // Deterministic random generation based on Ref string char codes
      const seed = ref.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + index;
      const rand1 = seededRandom(seed);
      const rand2 = seededRandom(seed + 1);
      
      const avgPrice = data.priceSum / data.count;
      
      // Simulation logic:
      // High volume items (high count) might have higher stock but also higher turnover.
      // We'll assign a random category for filtering/visuals.
      const categories = ['Electronics', 'Home', 'Accessories', 'Parts', 'Gadgets'];
      const category = categories[Math.floor(rand1 * categories.length)];

      const minStock = Math.floor(rand2 * 10) + 5; // 5 to 15
      const maxStock = minStock * 4; // 20 to 60
      
      // Current stock: mostly healthy, some low, some 0
      let currentStock = Math.floor(seededRandom(seed + 2) * (maxStock + 10)); 
      
      // Force some low/out of stock scenarios for UI demonstration
      if (rand1 > 0.85) currentStock = Math.floor(rand1 * 5); // 0-4 items
      
      let status: StockItem['status'] = 'In Stock';
      if (currentStock === 0) status = 'Out of Stock';
      else if (currentStock <= minStock) status = 'Low Stock';
      else if (currentStock > maxStock) status = 'Overstock';

      // Last Restock Date (random date in last 3 months)
      const daysAgo = Math.floor(seededRandom(seed + 3) * 90);
      const lastRestock = new Date();
      lastRestock.setDate(lastRestock.getDate() - daysAgo);

      const item: StockItem = {
        id: `STK-${1000 + index}`,
        name: ref, // In a real app, we'd lookup the name. Using ref here.
        ref,
        currentStock,
        minStock,
        maxStock,
        avgPrice,
        totalValue: currentStock * avgPrice,
        status,
        category,
        lastRestock: lastRestock.toISOString(),
      };

      stockItems.push(item);

      // Metrics aggregation
      totalStockValue += item.totalValue;
      totalItems += currentStock;
      if (status === 'Low Stock') lowStockCount++;
      if (status === 'Out of Stock') outOfStockCount++;
    });

    // Sort by Total Value Descending by default for "Top Value Item"
    stockItems.sort((a, b) => b.totalValue - a.totalValue);
    const topValueItem = stockItems.length > 0 ? stockItems[0] : null;

    return {
      totalStockValue,
      totalItems,
      lowStockCount,
      outOfStockCount,
      topValueItem,
      stockItems,
    };
  }, []);
};
