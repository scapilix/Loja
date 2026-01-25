import { useMemo } from 'react';
import { useData } from '../contexts/DataContext';

export interface StockStatus {
  ref: string;
  name: string;
  total_purchased: number;
  total_sold: number;
  current_stock: number;
  status: 'ok' | 'low' | 'critical' | 'out';
  base_price?: number;
  pvp?: number;
  profit?: number;
  supplier?: string;
  last_purchase_date?: string;
}

export function useStockLogic() {
  const { data } = useData();
  
  const stockInventory = useMemo(() => {
    const calculationStart = performance.now();
    
    // 1. Map Manual Purchases (Inflows)
    // Purchases come from Supabase (loaded into data.purchases via DataContext)
    const purchaseMap = new Map<string, { qty: number; lastDate: string }>();
    
    const purchases = data.purchases || []; // We need to add this to DataContext
    
    purchases.forEach((p: any) => {
      const ref = String(p.ref).trim().toUpperCase();
      const current = purchaseMap.get(ref) || { qty: 0, lastDate: '' };
      
      purchaseMap.set(ref, {
        qty: current.qty + Number(p.quantidade),
        lastDate: p.data_compra > current.lastDate ? p.data_compra : current.lastDate
      });
    });

    // 2. Map Sales (Outflows) from Excel Orders
    const salesMap = new Map<string, number>();
    const orders = data.orders || [];

    orders.forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (item.ref) {
            const ref = String(item.ref).trim().toUpperCase();
            // Ignore shipping refs or special non-stock items if necessary
            if (ref === 'CONTINENTAL' || ref === 'ILHAS' || ref === 'PORTES') return;
            
            const qty = Number(item.quantidade) || 1;
            const current = salesMap.get(ref) || 0;
            salesMap.set(ref, current + qty);
          }
        });
      }
    });

    // 3. Combine into Master Stock List (based on Base Items + anything with activity)
    const masterRefs = new Set<string>();
    
    // Add all from Base Items Catalog
    (data.products_catalog || []).forEach(p => masterRefs.add(String(p.ref).trim().toUpperCase()));
    
    // Add all from Purchases (in case we bought something not in catalog yet)
    purchaseMap.forEach((_, key) => masterRefs.add(key));
    
    // Add all from Sales (in case we sold something legacy)
    salesMap.forEach((_, key) => masterRefs.add(key));

    const inventory: StockStatus[] = [];

    masterRefs.forEach(ref => {
      const purchaseData = purchaseMap.get(ref) || { qty: 0, lastDate: undefined };
      const totalPurchased = purchaseData.qty;
      const totalSold = salesMap.get(ref) || 0;
      const currentStock = totalPurchased - totalSold;
      
      // Get Details from Catalog
      const catalogItem = data.products_catalog?.find(p => String(p.ref).trim().toUpperCase() === ref);
      const name = catalogItem && catalogItem.nome_artigo ? catalogItem.nome_artigo : 'Item Desconhecido';
      const basePrice = catalogItem ? catalogItem.base_price : undefined;
      const pvp = catalogItem ? catalogItem.pvp_cica : undefined;
      const profit = catalogItem ? catalogItem.lucro_meu_faturado : undefined;
      const supplier = catalogItem ? catalogItem.fornecedor : undefined;

      // Determine Status
      let status: StockStatus['status'] = 'ok';
      if (currentStock <= 0) status = 'out';
      else if (currentStock <= 3) status = 'critical';
      else if (currentStock <= 10) status = 'low';

      inventory.push({
        ref,
        name,
        total_purchased: totalPurchased,
        total_sold: totalSold,
        current_stock: currentStock,
        status,
        base_price: basePrice,
        pvp,
        profit,
        supplier,
        last_purchase_date: purchaseData.lastDate
      });
    });

    console.log(`Stock calculation took ${performance.now() - calculationStart}ms for ${inventory.length} items`);
    
    return inventory.sort((a, b) => a.current_stock - b.current_stock); // Sort by lowest stock first
  }, [data.orders, data.purchases, data.products_catalog]);

  return stockInventory;
}
