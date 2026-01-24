import React from 'react';
import { TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopClientesProps {
  customers: { name: string; revenue: number; orders: number; percentage: number }[];
}

export const TopClientes: React.FC<TopClientesProps> = ({ customers }) => {
  if (!customers || customers.length === 0) {
    return (
      <div className="glass p-8 rounded-[2rem]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-100 dark:bg-purple-500/10 rounded-xl">
            <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Top Clientes</h3>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-8 rounded-[2rem]"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-purple-100 dark:bg-purple-500/10 rounded-xl">
          <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Top Clientes</h3>
      </div>

      <div className="space-y-5">
        {customers.map((customer, index) => (
          <div key={customer.name} className="group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`
                  flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm
                  ${index === 0 ? 'bg-amber-100 text-amber-700 dark:bg-yellow-500/20 dark:text-yellow-400' : ''}
                  ${index === 1 ? 'bg-slate-200 text-slate-600 dark:bg-slate-600/50 dark:text-slate-300' : ''}
                  ${index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' : ''}
                  ${index > 2 ? 'bg-slate-100 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400' : ''}
                `}>
                  {index + 1}
                </div>
                <div>
                  <p className="text-slate-900 dark:text-white font-semibold text-sm truncate max-w-[180px]">
                    {customer.name}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    {customer.orders} {customer.orders === 1 ? 'compra' : 'compras'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-900 dark:text-white font-bold">
                  {customer.revenue.toLocaleString('pt-PT', { 
                    style: 'currency', 
                    currency: 'EUR',
                    minimumFractionDigits: 2
                  })}
                </p>
                <p className="text-purple-600 dark:text-purple-400 text-xs font-bold">
                  {customer.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${customer.percentage}%` }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`h-full rounded-full ${
                  index === 0 ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                  index === 1 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                  'bg-gradient-to-r from-slate-400 to-slate-300 dark:from-slate-500 dark:to-slate-400'
                }`}
              />
            </div>
          </div>
        ))}
      </div>

      {customers.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <span>
              Melhor cliente: <span className="text-slate-900 dark:text-white font-bold">{customers[0].name}</span>
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};
