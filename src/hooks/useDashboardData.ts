import { useMemo } from 'react';
import { useData } from '../contexts/DataContext';

export interface DashboardMetrics {
  totalRevenue: number;
  totalProfit: number;
  orderCount: number;
  avgTicket: number;
  revenueByMonth: { month: string; value: number }[];
  regionalData: { name: string; value: number }[];
  topCustomers: { name: string; revenue: number; orders: number; instagram: string; percentage: number }[];
  allCustomers: { 
    name: string; 
    instagram: string; 
    address: string; 
    email: string; 
    phone: string; 
    orders: number; 
    revenue: number;
    history: Order[]; 
  }[];
  topProducts: { ref: string; quantity: number; revenue: number; avgPrice: number; name?: string }[];

  salesByLocation: { location: string; revenue: number; orders: number }[];
  salesByDayOfWeek: { day: string; revenue: number; orders: number; percentage: number }[];
  shippingMetrics: {
    totalShippingRevenue: number;
    shippingCount: number;
    continentalCount: number;
    ilhasCount: number;
    continentalRevenue: number;
    ilhasRevenue: number;
    monthlyShipping: Record<string, number>;
  };
  customerSalesCount: Record<string, number>;
  salesByDate: { date: string; count: number; revenue: number }[];
  paymentMethodData: { method: string; count: number; revenue: number; percentage: number }[];
  // Prediction and Filter fields
  isFiltered: boolean;
  availableFilters: {
    years: string[];
    months: string[];
    days: string[];
  };
  filterCounts: {
    years: Record<string, number>;
    months: Record<string, number>;
    days: Record<string, number>;
  };
  filteredOrders: any[];
}

export interface DashboardFilters {
  year?: string;
  month?: string;
  days?: string[]; // Changed from day to days for multi-selection
}

interface OrderItem {
  ref: string | number;
  pvp: number;
  base: number;
  lucro: number;
  quantidade?: number;
  designacao?: string;
}

interface Order {
  pvp: number;
  lucro: number;
  localidade?: string;
  msano?: string;
  dia_da_semana?: string;
  nome_cliente?: string;
  instagram?: string;
  data_venda?: string;
  forma_de_pagamento?: string;
  items?: OrderItem[];
}

export const useDashboardData = (filters: DashboardFilters = {}): DashboardMetrics => {
  const { data: rawData } = useData();
  
  return useMemo(() => {
    // Type assertion for raw data
    let orders = rawData.orders || [];

    // Extract available filters before filtering
    const allYears = new Set<string>();
    const allMonths = new Set<string>();

    orders.forEach((o: any) => {
      if (o.data_venda) {
        const date = new Date(o.data_venda);
        allYears.add(date.getFullYear().toString());
        allMonths.add((date.getMonth() + 1).toString().padStart(2, '0'));
      }
    });

    // Apply filters
    const isFiltered = !!(filters.year || filters.month || (filters.days && filters.days.length > 0));
    if (isFiltered) {
      orders = orders.filter((o: any) => {
        if (!o.data_venda) return false;
        const date = new Date(o.data_venda);
        const y = date.getFullYear().toString();
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');

        if (filters.year && y !== filters.year) return false;
        if (filters.month && m !== filters.month) return false;
        if (filters.days && filters.days.length > 0 && !filters.days.includes(d)) return false;
        return true;
      });
    }
    
    // Calculate KPIs
    let totalRevenue = 0;
    let totalProfit = 0;
    const regionMap: Record<string, number> = {};
    const monthlyMap: Record<string, number> = {};
    // Prepare customer lookup map from database
    // Prepare customer lookup maps from database
    const customerDbMap = new Map(); // Key: Instagram
    const customerNameMap = new Map(); // Key: Name (for fallback lookup)

    if (rawData.customers && Array.isArray(rawData.customers)) {
        rawData.customers.forEach((c: any) => {
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

    const customerMap: Record<string, { 
      revenue: number; 
      orders: number;
      instagram: string;
      address: string;
      history: Order[];
    }> = {}; 

    const locationMap: Record<string, { revenue: number; orders: number }> = {};
    const dayOfWeekMap: Record<string, { revenue: number; orders: number }> = {};
    const customerSalesCount: Record<string, number> = {};
    const dateMap: Record<string, { count: number; revenue: number }> = {};
    const paymentMethodMap: Record<string, { count: number; revenue: number }> = {};

    // Product Performance Map (replacing old productMap)
    const productPerformance: Record<string, { 
      name: string; 
      revenue: number; 
      quantity: number; 
      ref: string;
    }> = {};

    // Shipping Metrics Initial State
    const shippingMetrics = {
      totalShippingRevenue: 0,
      shippingCount: 0,
      continentalCount: 0,
      ilhasCount: 0,
      continentalRevenue: 0,
      ilhasRevenue: 0,
      monthlyShipping: {} as Record<string, number>
    };
    orders.forEach((order: Order) => {
      // ... (existing variable extraction) ...
      const pvp = parseFloat(String(order.pvp)) || 0;
      const lucro = parseFloat(String(order.lucro)) || 0;
      const region = order.localidade || 'Outros';
      const month = order.msano || 'N/A';
      const dayOfWeek = order.dia_da_semana || 'N/A';
      const customer = order.nome_cliente || 'Cliente Desconhecido';
      const instagram = order.instagram || 'N/A';
      let paymentMethod = (order.forma_de_pagamento || 'N/A').trim();
      // Normalize MB Way
      const normalizedPM = paymentMethod.toUpperCase().replace(/\s/g, '');
      if (normalizedPM === 'MBWAY') paymentMethod = 'MB Way';
      const orderDateString = order.data_venda ? new Date(order.data_venda).toISOString().split('T')[0] : 'N/A';
      
      const orderDate = new Date(order.data_venda || '');
      const monthKey = orderDate.toLocaleString('default', { month: 'short' });

      totalRevenue += pvp;
      totalProfit += lucro;

      // Regional data
      regionMap[region] = (regionMap[region] || 0) + pvp;
      monthlyMap[month] = (monthlyMap[month] || 0) + pvp;

      // Customer data
      // Customer data
      const rawInsta = (instagram || '').trim();
      const hasInsta = rawInsta && rawInsta !== 'N/A' && rawInsta !== '-';
      const cleanInsta = hasInsta ? rawInsta.toUpperCase().replace('@', '') : '';
      const cleanName = customer.trim().toUpperCase();

      // Determine Unique Key
      // Priority 1: Instagram from Order
      // Priority 2: Instagram from DB (lookup by Name)
      // Priority 3: Name (Fallback)
      
      let customerKey = '';
      let resolvedInsta = hasInsta ? cleanInsta : '';
      let dbCustomer: any = null;

      if (resolvedInsta) {
          customerKey = resolvedInsta;
          dbCustomer = customerDbMap.get(resolvedInsta);
      } else {
          // STRICT RULE: Do not try to find instagram via name for ID generation.
          // This prevents merging "Joana (No Insta)" into "Joana A" or "Joana B" indiscriminately.
          // Orders with N/A instagram will separate into their own "NAME:..." group.
          customerKey = `NAME:${cleanName}`;
          
          // We can still try to find metadata for display purposes later, but the ID is strictly Name-based.
          // If we want to be helpful, we can check if this Name maps to a SINGLE unique Instagram in DB.
          // But user says "Names can be equal", so assuming identity by Name is dangerous.
      }
      
      if (!customerMap[customerKey]) {
        customerMap[customerKey] = { 
          revenue: 0, 
          orders: 0,
          instagram: resolvedInsta ? (dbCustomer?.instagram || instagram) : 'N/A', // Keep display format
          address: dbCustomer?.morada || region,
          history: []
        };
      }
      
      customerMap[customerKey].revenue += pvp;
      customerMap[customerKey].orders += 1;
      customerMap[customerKey].history.push(order);
      
      // Update info if it was missing and we found better info (e.g. from a subsequent order)
      if (customerMap[customerKey].instagram === 'N/A' && hasInsta) {
         customerMap[customerKey].instagram = instagram;
      }
      
      // Customer sales count using same key
      customerSalesCount[customerKey] = (customerSalesCount[customerKey] || 0) + 1;

      // Location data
      if (!locationMap[region]) {
        locationMap[region] = { revenue: 0, orders: 0 };
      }
      locationMap[region].revenue += pvp;
      locationMap[region].orders += 1;

      // Day of week data
      if (!dayOfWeekMap[dayOfWeek]) {
        dayOfWeekMap[dayOfWeek] = { revenue: 0, orders: 0 };
      }
      dayOfWeekMap[dayOfWeek].revenue += pvp;
      dayOfWeekMap[dayOfWeek].orders += 1;
      
      // Date data
      if (orderDateString !== 'N/A') {
        if (!dateMap[orderDateString]) {
          dateMap[orderDateString] = { count: 0, revenue: 0 };
        }
        dateMap[orderDateString].count += 1;
        dateMap[orderDateString].revenue += pvp;
      }
      
      // Payment method data
      if (paymentMethod !== 'N/A') {
        if (!paymentMethodMap[paymentMethod]) {
          paymentMethodMap[paymentMethod] = { count: 0, revenue: 0 };
        }
        paymentMethodMap[paymentMethod].count += 1;
        paymentMethodMap[paymentMethod].revenue += pvp;
      }

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: OrderItem) => {
          const ref = item.ref ? item.ref.toString().toUpperCase() : '';
          const isShipping = ref === 'CONTINENTAL' || ref === 'ILHAS' || ref === 'PORTES' || ref === 'ESTRANGEIRO';
          const revenue = Number(item.pvp) || 0;
          const quantity = Number(item.quantidade) || 1;

          if (isShipping) {
            // Shipping Analysis
            shippingMetrics.totalShippingRevenue += revenue;
            shippingMetrics.shippingCount += 1;
            
            // Monthly Shipping Tracking
            if (!shippingMetrics.monthlyShipping[monthKey]) {
              shippingMetrics.monthlyShipping[monthKey] = 0;
            }
            shippingMetrics.monthlyShipping[monthKey] += revenue;

            if (ref === 'CONTINENTAL') {
              shippingMetrics.continentalCount += 1;
              shippingMetrics.continentalRevenue += revenue;
            } else if (ref === 'ILHAS') {
              shippingMetrics.ilhasCount += 1;
              shippingMetrics.ilhasRevenue += revenue;
            }

          } else {
            // Product Analysis (Exclude Shipping)
            if (!item.ref) return;
            const itemRef = String(item.ref);

            if (!productPerformance[itemRef]) {
              productPerformance[itemRef] = {
                name: item.designacao || 'Unknown Product',
                revenue: 0,
                quantity: 0,
                ref: itemRef
              };
            }

            productPerformance[itemRef].revenue += revenue;
            productPerformance[itemRef].quantity += quantity;
          }
        });
      }
    });

    const orderCount = orders.length;
    const avgTicket = orderCount > 0 ? totalRevenue / orderCount : 0;

    // Format charts data
    const revenueByMonth = Object.entries(monthlyMap).map(([month, value]) => ({
      month,
      value
    })).sort((a, b) => a.month.localeCompare(b.month));

    const regionalData = Object.entries(regionMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // All Customers List (New Implementation)
    // We iterate the customerMap (Active Sales) + Filtered DB Customers
    
    // 1. Convert Sales Map to List
    const activeCustomers = Object.entries(customerMap).map(([key, data]) => {
      // Find the best display name
      // Try DB match first
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
        address: dbC?.morada || data.address || '-',
        email: dbC?.email_cliente || '-',
        phone: dbC?.telefone_cliente || '-',
        history: data.history,
        _key: key, // internal use for dedup logic
        _source: 'ACTIVE_ORDER'
      };
    });

    // 2. Add customers from DB that had NO sales
    const processedKeys = new Set(activeCustomers.map(c => c._key));
    
    (rawData.customers || []).forEach((dbC: any) => {
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
                address: dbC.morada || '-',
                email: dbC.email_cliente || '-',
                phone: dbC.telefone_cliente || '-',
                history: [],
                _key: key,
                _source: 'DB_INACTIVE'
            });
            processedKeys.add(key); // Prevent dual adding if DB has duplicates
        }
    });

    // Sort by revenue
    const allCustomers = activeCustomers.sort((a, b) => b.revenue - a.revenue);

    // Top customers (top 5)
    const topCustomers = allCustomers
      .map(c => ({
        name: c.name,
        revenue: c.revenue,
        orders: c.orders,
        instagram: c.instagram,
        percentage: totalRevenue > 0 ? (c.revenue / totalRevenue) * 100 : 0
      }))
      .slice(0, 5);

    // Top products (top 10)
    const topProducts = Object.values(productPerformance)
      .map((data) => ({
        ref: data.ref,
        quantity: data.quantity,
        revenue: data.revenue,
        avgPrice: data.quantity > 0 ? data.revenue / data.quantity : 0,
        name: data.name // Added name for display
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Sales by location (top 10)
    const salesByLocation = Object.entries(locationMap)
      .map(([location, data]) => ({
        location,
        revenue: data.revenue,
        orders: data.orders
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Sales by day of week (ordered chronologically)
    const dayOrder = ['SEGUNDA-FEIRA', 'TERÇA-FEIRA', 'QUARTA-FEIRA', 'QUINTA-FEIRA', 'SEXTA-FEIRA', 'SÁBADO', 'DOMINGO'];
    const salesByDayOfWeek = dayOrder
      .map(day => {
        const data = dayOfWeekMap[day] || { revenue: 0, orders: 0 };
        return {
          day,
          revenue: data.revenue,
          orders: data.orders,
          percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
        };
      })
      .filter(item => item.revenue > 0);
    
    // Sales by date (last 30 days or all available)
    const salesByDate = Object.entries(dateMap)
      .map(([date, data]) => ({
        date,
        count: data.count,
        revenue: data.revenue
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Payment method data
    const paymentMethodData = Object.entries(paymentMethodMap)
      .map(([method, data]) => ({
        method,
        count: data.count,
        revenue: data.revenue,
        percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);



      const allOrders = (rawData as any).orders || [];
      
      // Calculate context-aware counts for the filter UI
      
      // 1. Year Counts (Global)
      const yearCounts: Record<string, number> = {};
      allOrders.forEach((o: any) => {
        if (o.data_venda) {
          const y = new Date(o.data_venda).getFullYear().toString();
          yearCounts[y] = (yearCounts[y] || 0) + 1;
        }
      });

      // 2. Month Counts (Context: Selected Year)
      const monthCounts: Record<string, number> = {};
      if (filters.year) {
        allOrders.forEach((o: any) => {
          if (o.data_venda) {
            const date = new Date(o.data_venda);
            if (date.getFullYear().toString() === filters.year) {
              const m = (date.getMonth() + 1).toString().padStart(2, '0');
              monthCounts[m] = (monthCounts[m] || 0) + 1;
            }
          }
        });
      }

      // 3. Day Counts (Context: Selected Year + Month)
      const dayCounts: Record<string, number> = {};
      if (filters.year && filters.month) {
        allOrders.forEach((o: any) => {
          if (o.data_venda) {
            const date = new Date(o.data_venda);
            const y = date.getFullYear().toString();
            const m = (date.getMonth() + 1).toString().padStart(2, '0');
            
            if (y === filters.year && m === filters.month) {
              const d = date.getDate().toString().padStart(2, '0');
              dayCounts[d] = (dayCounts[d] || 0) + 1;
            }
          }
        });
      }

      return {
        totalRevenue,
        totalProfit,
        orderCount,
        avgTicket,
        revenueByMonth,
        regionalData,
        topCustomers,
        allCustomers, // Added allCustomers
        topProducts,
        salesByLocation,
        salesByDayOfWeek,
        customerSalesCount,
        salesByDate,
        paymentMethodData,
        shippingMetrics,
        isFiltered,
        availableFilters: {
          years: Array.from(allYears).sort().reverse(),
          months: Array.from(allMonths).sort(),
          days: Array.from(new Set(orders.map((o: any) => o.data_venda ? new Date(o.data_venda).getDate().toString().padStart(2, '0') : null).filter(Boolean) as string[])).sort()
        },
        filterCounts: {
          years: yearCounts,
          months: monthCounts,
          days: dayCounts
        },
        filteredOrders: orders
      };
    }, [filters, rawData]);
};
