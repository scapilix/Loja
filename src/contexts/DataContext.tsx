import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ExcelData {
  orders: any[];
  customers: any[];
  stats?: any[];
  timestamp?: string;
}

interface DataContextType {
  data: ExcelData;
  setData: React.Dispatch<React.SetStateAction<ExcelData>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY = 'antigravity_data_v1';

export function DataProvider({ children, initialData }: { children: ReactNode; initialData: ExcelData }) {
  // Always start with initialData from the JSON file to ensure fresh data after a push
  // Still keep a way to manually update via context
  const [data, setData] = useState<ExcelData>(initialData);
  
  const [isLoading, setIsLoading] = useState(false);

  // Sync state with initialData if it changes (e.g. after a rebuild)
  useEffect(() => {
    setData(initialData);
  }, [initialData]);
  
  // Optional: Save to localStorage as a secondary backup only
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
    }
  }, [data]);

  return (
    <DataContext.Provider value={{ data, setData, isLoading, setIsLoading }}>
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
