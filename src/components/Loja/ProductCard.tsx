import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Plus } from 'lucide-react';

interface Product {
  ref: string;
  nome_artigo: string;
  pvp_cica: number;
  image_url?: string;
  description?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const formatCurrency = (val: number) =>
    val?.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500"
    >
      <div className="aspect-[4/5] overflow-hidden relative">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.nome_artigo}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
        
        <button
          onClick={() => onAddToCart(product)}
          className="absolute bottom-6 right-6 w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 hover:bg-purple-700 active:scale-90"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="p-8 space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight uppercase tracking-tight group-hover:text-purple-600 transition-colors">
              {product.nome_artigo}
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.ref}</p>
          </div>
          <p className="font-black text-purple-600 dark:text-purple-400 text-xl whitespace-nowrap">
            {formatCurrency(product.pvp_cica)}
          </p>
        </div>
        
        {product.description && (
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium line-clamp-2">
            {product.description}
          </p>
        )}

        <button
          onClick={() => onAddToCart(product)}
          className="w-full py-4 mt-2 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-purple-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 border border-slate-100 dark:border-white/5"
        >
          <ShoppingCart className="w-4 h-4" />
          Adicionar ao Carrinho
        </button>
      </div>
    </motion.div>
  );
};
