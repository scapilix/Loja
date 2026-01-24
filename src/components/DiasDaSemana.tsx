import React from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface DiasDaSemanaProps {
  days: { day: string; revenue: number; orders: number; percentage: number }[];
}

export const DiasDaSemana: React.FC<DiasDaSemanaProps> = ({ days }) => {
  if (!days || days.length === 0) {
    return (
      <div className="glass p-8 rounded-[2rem]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-orange-100 dark:bg-orange-500/10 rounded-xl">
            <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Vendas por Dia da Semana</h3>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum dado disponível</p>
      </div>
    );
  }

  const bestDay = days.reduce((max, day) => day.orders > max.orders ? day : max, days[0]);
  const maxOrders = Math.max(...days.map(d => d.orders));

  // Short day names for display
  const dayShortNames: Record<string, string> = {
    'SEGUNDA-FEIRA': 'SEG',
    'TERÇA-FEIRA': 'TER',
    'QUARTA-FEIRA': 'QUA',
    'QUINTA-FEIRA': 'QUI',
    'SEXTA-FEIRA': 'SEX',
    'SÁBADO': 'SÁB',
    'DOMINGO': 'DOM'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-8 rounded-[2rem] relative overflow-hidden group"
    >
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[60px] rounded-full pointer-events-none" />
      
      <div className="flex items-center gap-4 mb-10 relative z-10">
        <div className="p-3 bg-orange-100 dark:bg-orange-500/10 rounded-xl border border-orange-200 dark:border-orange-500/20">
          <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Vendas por Dia da Semana</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Análise de intensidade por frequência de pedidos</p>
        </div>
      </div>

      {/* Chart Canvas */}
      {/* Chart Canvas */}
      <div className="flex items-end justify-between gap-6 h-72 mb-10 relative z-10 w-full px-4">
        {days.map((dayData) => {
          const heightPercentage = (dayData.orders / maxOrders) * 100;
          const isBestDay = dayData.day === bestDay.day;
          
          return (
            <div 
              key={dayData.day} 
              className={`h-full flex flex-col justify-end items-center gap-3 transition-all duration-700 ease-in-out ${
                isBestDay ? 'flex-[2.5]' : 'flex-[1.5]'
              }`}
            >
              {/* Bar Container - Flex Column for Bottom Alignment */}
              <div className="w-full h-full flex flex-col justify-end items-center group/bar relative">
                
                {/* Metric Label - Stacks on top of bar automatically */}
                <div className={`
                  mb-3 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl transition-all duration-500 z-20
                  ${isBestDay ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-90 group-hover/bar:opacity-100 group-hover/bar:translate-y-0 group-hover/bar:scale-100'}
                `}>
                  <p className="text-[10px] font-black text-slate-700 dark:text-slate-100 whitespace-nowrap tracking-wide">
                    {dayData.orders} {dayData.orders === 1 ? 'PEDIDO' : 'PEDIDOS'}
                  </p>
                </div>

                {/* Main Column */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(heightPercentage, 2)}%` }}
                  transition={{ duration: 0.8, delay: 0.1, type: "spring", stiffness: 100 }}
                  className={`w-full rounded-t-2xl border-x border-t relative overflow-hidden shadow-2xl cursor-pointer ${
                    isBestDay 
                      ? 'bg-gradient-to-b from-orange-500 to-orange-600 border-orange-400/50' 
                      : 'bg-gradient-to-b from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 border-slate-300/50 dark:border-slate-600/50'
                  } hover:brightness-110`}
                  style={{ 
                    minHeight: '8px'
                  }}
                >
                  {/* Glossy Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                  
                  {/* Striped Texture */}
                  <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] pointer-events-none" />

                  {/* Interior Icon */}
                  {isBestDay && (
                    <div className="absolute top-2 w-full flex justify-center pointer-events-none">
                      <div className="w-8 h-1 bg-white/30 rounded-full" />
                    </div>
                  )}
                </motion.div>
                
                {/* Reflection/Grounding Shadow */}
                 <div className="absolute bottom-0 w-[80%] h-1 bg-white/20 blur-sm rounded-full" />
              </div>
              
              {/* Label Architecture */}
              <div className="text-center group-hover:scale-110 transition-transform duration-300">
                <p className={`text-[11px] font-bold uppercase tracking-tighter ${
                  isBestDay ? 'text-orange-600 dark:text-orange-400 text-sm' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {dayShortNames[dayData.day] || dayData.day.substring(0, 3)}
                </p>
                <div className={`h-1 w-1 rounded-full mx-auto mt-1 ${isBestDay ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-200 dark:border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Melhor Dia</p>
            <p className="text-slate-900 dark:text-white font-bold text-sm">{bestDay.day}</p>
          </div>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase mb-1">Faturamento</p>
          <p className="text-orange-600 dark:text-orange-400 font-bold text-sm">
            {bestDay.revenue.toLocaleString('pt-PT', { 
              style: 'currency', 
              currency: 'EUR',
              minimumFractionDigits: 2
            })}
          </p>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase mb-1">Total Vendas</p>
          <p className="text-slate-900 dark:text-white font-bold text-sm">
            {bestDay.orders} {bestDay.orders === 1 ? 'venda' : 'vendas'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
