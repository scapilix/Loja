import React from 'react';
import { motion } from 'framer-motion';
import { Expand } from 'lucide-react';

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
  onExpand?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onExpand }) => {
  const formatCurrency = (val: number) =>
    val?.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group flex flex-col space-y-5"
    >
      {/* Image Container */}
      <div className="aspect-[3/4] overflow-hidden relative bg-[#F9F9F9] dark:bg-slate-900 cursor-pointer">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.nome_artigo}
            className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal transition-transform duration-[1.5s] ease-out group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-slate-300 font-bold uppercase tracking-[0.2em] text-[10px]">Image Unavailable</span>
          </div>
        )}
        
        {/* Hover Overlays */}
        <div className="absolute inset-x-0 bottom-0 p-6 flex justify-between items-end translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="w-full py-4 bg-black text-white dark:bg-white dark:text-black font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:bg-[#827b14] dark:hover:bg-[#827b14] dark:hover:text-white transition-colors"
          >
            Adicionar +
          </button>
        </div>

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
           <span className="bg-white/80 dark:bg-black/80 backdrop-blur-md px-3 py-1 text-[8px] font-black uppercase tracking-widest text-[#827b14] border border-[#827b14]/20">
              New Collection
           </span>
        </div>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onExpand?.(product);
          }}
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
        >
           <div className="w-8 h-8 bg-white/90 dark:bg-black/90 backdrop-blur-md flex items-center justify-center text-black dark:text-white hover:bg-[#827b14] hover:text-white transition-colors">
              <Expand className="w-3 h-3" />
           </div>
        </button>
      </div>

      {/* Details */}
      <div className="flex flex-col space-y-1 items-center text-center">
        <p className="text-[10px] font-black text-[#827b14] uppercase tracking-[0.3em] mb-1">
          {product.ref}
        </p>
        <h3 className="font-bold text-slate-950 dark:text-white text-sm uppercase tracking-tight group-hover:underline decoration-1 underline-offset-4">
          {product.nome_artigo}
        </h3>
        <p className="font-black text-slate-900 dark:text-slate-400 text-sm tracking-tighter mt-2">
          {formatCurrency(product.pvp_cica)}
        </p>
      </div>
    </motion.div>
  );
};
