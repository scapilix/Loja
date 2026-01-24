import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ExcelData {
  orders: any[];
  customers: any[];
  stock?: any[];
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
  // Initialize state from localStorage if available, otherwise use initialData
  const [data, setData] = useState<ExcelData>(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      return savedData ? JSON.parse(savedData) : initialData;
    } catch (error) {
      console.warn('Failed to load data from localStorage:', error);
      return initialData;
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save data to localStorage (likely quota exceeded):', error);
      // Optional: Add UI notification here if save fails
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
