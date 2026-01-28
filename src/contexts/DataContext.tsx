import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ProductCatalogItem {
  ref: string;
  nome_artigo: string;
  pvp_cica: number;
  base_price?: number;
  iva: number;
  lucro_meu_faturado: number;
  fornecedor: string;
}

interface ExcelData {
  orders: any[];
  customers: any[];
  products_catalog?: ProductCatalogItem[];
  stats?: any[];
  manual_products_catalog?: ProductCatalogItem[]; // Items added manually via UI
  timestamp?: string;
}

import { supabase } from '../lib/supabase';

interface Purchase {
  id: number;
  ref: string;
  data_compra: string;
  quantidade: number;
  preco_custo?: number;
  fornecedor?: string;
  notas?: string;
  created_at?: string;
}

interface ExcelData {
  orders: any[];
  customers: any[];
  products_catalog?: ProductCatalogItem[];
  purchases?: Purchase[];
  stats?: any[];
  manual_products_catalog?: ProductCatalogItem[]; // Items added manually via UI
  timestamp?: string;
}

interface DataContextType {
  data: ExcelData;
  setData: React.Dispatch<React.SetStateAction<ExcelData>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  addPurchase: (purchase: Omit<Purchase, 'id' | 'created_at'>) => Promise<void>;
  addProduct: (product: ProductCatalogItem) => Promise<void>;
  refreshPurchases: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children, initialData }: { children: ReactNode; initialData: ExcelData }) {
  const [data, setData] = useState<ExcelData>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  // Sync state with initialData if it changes
  useEffect(() => {
    setData((prev) => ({ ...prev, ...initialData }));
  }, [initialData]);

  // Fetch Purchases and Imported State from Supabase on Mount
  useEffect(() => {
    const initData = async () => {
        setIsLoading(true);
        await Promise.all([fetchPurchases(), fetchImportedState()]);
        setIsLoading(false);
    };
    initData();
  }, []);

  const fetchImportedState = async () => {
    try {
        const { data: stateData, error } = await supabase
            .from('loja_app_state')
            .select('key, value')
            .in('key', ['import_orders', 'import_customers', 'import_stats', 'manual_products_catalog']);
        
        if (stateData && !error) {
            const updates: Partial<ExcelData> = {};
            stateData.forEach(item => {
                if (item.key === 'import_orders') updates.orders = item.value;
                if (item.key === 'import_customers') updates.customers = item.value;
                if (item.key === 'import_stats') updates.stats = item.value;
                if (item.key === 'manual_products_catalog') updates.manual_products_catalog = item.value;
            });
            
            if (Object.keys(updates).length > 0) {
                setData(prev => ({ ...prev, ...updates }));
            }
        }
    } catch (err) {
        console.error('Error fetching imported state:', err);
    }
  };

  const fetchPurchases = async () => {
    try {
      const { data: purchases, error } = await supabase
        .from('loja_compras')
        .select('*')
        .order('data_compra', { ascending: false });
      
      if (error) throw error;

      if (purchases) {
        setData(prev => ({ ...prev, purchases }));
      }
    } catch (err) {
      console.error('Error fetching purchases:', err);
    }
  };

  const addProduct = async (product: ProductCatalogItem) => {
    try {
      const currentManual = data.manual_products_catalog || [];
      // Check if exists
      if (currentManual.find(p => p.ref === product.ref)) return;

      const newManual = [...currentManual, product];
      
      // Persist to Supabase State
      const { error } = await supabase
        .from('loja_app_state')
        .upsert({ key: 'manual_products_catalog', value: newManual });

      if (error) throw error;
      
      // Update local state
      setData(prev => ({ ...prev, manual_products_catalog: newManual }));
    } catch (err) {
      console.error('Error adding product:', err);
      throw err;
    }
  };

  const addPurchase = async (purchase: Omit<Purchase, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase.from('loja_compras').insert([purchase]);
      if (error) throw error;
      await fetchPurchases(); // Refresh local state
    } catch (err) {
      console.error('Error adding purchase:', err);
      throw err;
    }
  };

  const refreshPurchases = fetchPurchases;

  return (
    <DataContext.Provider value={{ data, setData, isLoading, setIsLoading, addPurchase, addProduct, refreshPurchases }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
