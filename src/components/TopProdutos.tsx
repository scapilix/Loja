import React from 'react';
import { Package, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopProdutosProps {
  products: { ref: string; quantity: number; revenue: number; avgPrice: number }[];
}

export const TopProdutos: React.FC<TopProdutosProps> = ({ products }) => {
  if (!products || products.length === 0) {
    return (
      <div className="glass p-8 rounded-[2rem]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-500/10 rounded-xl">
            <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Top Produtos</h3>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum dado disponível</p>
      </div>
    );
  }

  const maxQuantity = Math.max(...products.map(p => p.quantity));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-8 rounded-[2rem]"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-100 dark:bg-blue-500/10 rounded-xl">
          <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Top Produtos</h3>
      </div>

      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={product.ref} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2.5">
                <span className={`
                  text-xs font-bold px-2.5 py-1 rounded-lg
                  ${index < 3 ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400'}
                `}>
                  #{index + 1}
                </span>
                <p className="text-slate-900 dark:text-white font-semibold text-sm truncate max-w-[120px]">
                  {product.ref}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-900 dark:text-white font-bold text-sm">
                  {product.quantity}x
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  {product.revenue.toLocaleString('pt-PT', { 
                    style: 'currency', 
                    currency: 'EUR',
                    minimumFractionDigits: 0
                  })}
                </p>
              </div>
            </div>
            
            {/* Quantity bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(product.quantity / maxQuantity) * 100}%` }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
              />
            </div>
          </div>
        ))}
      </div>

      {products.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span>
              Mais vendido: <span className="text-slate-900 dark:text-white font-bold">{products[0].ref}</span> ({products[0].quantity} unidades)
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};
