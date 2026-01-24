import React from 'react';
import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProdutosPorLocalidadeProps {
  locations: { location: string; revenue: number; orders: number }[];
}

export const ProdutosPorLocalidade: React.FC<ProdutosPorLocalidadeProps> = ({ locations }) => {
  if (!locations || locations.length === 0) {
    return (
      <div className="glass p-8 rounded-[2rem]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-100 dark:bg-green-500/10 rounded-xl">
            <MapPin className="w-5 h-5 text-emerald-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Vendas por Localidade</h3>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum dado disponível</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...locations.map(l => l.revenue));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-8 rounded-[2rem]"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-emerald-100 dark:bg-green-500/10 rounded-xl">
          <MapPin className="w-6 h-6 text-emerald-600 dark:text-green-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Vendas por Localidade</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Top {locations.length} regiões por faturamento</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {locations.map((location, index) => {
          const percentage = (location.revenue / maxRevenue) * 100;
          
          return (
            <div key={location.location} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <MapPin className={`
                    w-4 h-4 flex-shrink-0
                    ${index < 3 ? 'text-emerald-500' : 'text-slate-400'}
                  `} />
                  <p className="text-slate-900 dark:text-white font-semibold text-sm truncate">
                    {location.location}
                  </p>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <p className="text-slate-900 dark:text-white font-bold text-sm">
                    {location.revenue.toLocaleString('pt-PT', { 
                      style: 'currency', 
                      currency: 'EUR',
                      minimumFractionDigits: 0
                    })}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    {location.orders} {location.orders === 1 ? 'venda' : 'vendas'}
                  </p>
                </div>
              </div>
              
              {/* Revenue bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  className={`h-full rounded-full ${
                    index === 0 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                    index === 1 ? 'bg-gradient-to-r from-green-500/80 to-emerald-500/80' :
                    index === 2 ? 'bg-gradient-to-r from-green-500/60 to-emerald-500/60' :
                    'bg-gradient-to-r from-slate-400 to-slate-300 dark:from-slate-500 dark:to-slate-400'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {locations.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/5 grid grid-cols-3 gap-4">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1">Top Região</p>
            <p className="text-slate-900 dark:text-white font-bold text-sm truncate">{locations[0].location}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1">Faturamento</p>
            <p className="text-emerald-600 dark:text-green-400 font-bold text-sm">
              {locations[0].revenue.toLocaleString('pt-PT', { 
                style: 'currency', 
                currency: 'EUR',
                minimumFractionDigits: 0
              })}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1">Total Vendas</p>
            <p className="text-slate-900 dark:text-white font-bold text-sm">{locations[0].orders}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};
