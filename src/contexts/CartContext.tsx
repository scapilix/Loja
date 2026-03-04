import React, { createContext, useContext, useState } from 'react';

interface CartItem {
  ref: string;
  nome_artigo: string;
  pvp_cica: number;
  base_price?: number;
  lucro_meu_faturado?: number;
  image_url?: string;
  quantidade: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (ref: string) => void;
  updateQuantity: (ref: string, delta: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: any) => {
    setItems(prev => {
      const existing = prev.find(item => item.ref === product.ref);
      if (existing) {
        return prev.map(item => 
          item.ref === product.ref 
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantidade: 1 }];
    });
  };

  const removeFromCart = (ref: string) => {
    setItems(prev => prev.filter(item => item.ref !== ref));
  };

  const updateQuantity = (ref: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.ref === ref) {
        const newQty = Math.max(1, item.quantidade + delta);
        return { ...item, quantidade: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, item) => sum + (item.pvp_cica * item.quantidade), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantidade, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
