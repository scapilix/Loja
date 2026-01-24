import React from 'react';
import { CreditCard, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface MetodosPagamentoProps {
  paymentMethods: { method: string; count: number; revenue: number; percentage: number }[];
}

export const MetodosPagamento: React.FC<MetodosPagamentoProps> = ({ paymentMethods }) => {
  if (!paymentMethods || paymentMethods.length === 0) {
    return (
      <div className="glass p-8 rounded-[2rem]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-500/10 rounded-xl">
            <CreditCard className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Métodos de Pagamento</h3>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum dado disponível</p>
      </div>
    );
  }

  // Color palette for payment methods
  const colors = [
    { bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', light: 'bg-emerald-100 dark:bg-emerald-500/20' },
    { bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', light: 'bg-blue-100 dark:bg-blue-500/20' },
    { bg: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', light: 'bg-purple-100 dark:bg-purple-500/20' },
    { bg: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', light: 'bg-orange-100 dark:bg-orange-500/20' },
    { bg: 'bg-pink-500', text: 'text-pink-600 dark:text-pink-400', light: 'bg-pink-100 dark:bg-pink-500/20' },
    { bg: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', light: 'bg-cyan-100 dark:bg-cyan-500/20' },
  ];

  const topMethod = paymentMethods[0];

  const formatCurrency = (val: number) =>
    (val || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-8 rounded-[2rem] relative overflow-hidden group"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl">
          <CreditCard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Métodos de Pagamento</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Distribuição por forma de pagamento</p>
        </div>
      </div>

      {/* Payment methods list */}
      <div className="space-y-5">
        {paymentMethods.map((method, index) => {
          const color = colors[index % colors.length];
          
          return (
            <div 
              key={method.method} 
              className="group/item"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${color.light} rounded-lg`}>
                    <CreditCard className={`w-4 h-4 ${color.text}`} />
                  </div>
                  <div>
                    <p className="text-slate-900 dark:text-white font-semibold text-sm">
                      {method.method}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">
                      {method.count} {method.count === 1 ? 'transação' : 'transações'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-900 dark:text-white font-bold text-sm">
                    {formatCurrency(method.revenue)}
                  </p>
                  <p className={`${color.text} text-xs font-bold`}>
                    {method.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${method.percentage}%` }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`h-full ${color.bg} rounded-full`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {paymentMethods.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>
              Mais usado: <span className="text-slate-900 dark:text-white font-bold">{topMethod.method}</span> ({topMethod.percentage.toFixed(1)}%)
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};
