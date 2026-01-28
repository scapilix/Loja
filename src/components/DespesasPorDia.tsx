import React from 'react';
import { CalendarDays, TrendingDown, Info } from 'lucide-react';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';

interface DespesasPorDiaProps {
  dailyExpenses: { date: string; count: number; total: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass p-4 rounded-2xl border-white/20 dark:border-white/10 shadow-2xl backdrop-blur-xl">
        <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
          {new Date(label).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-8">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Registos:</span>
            <span className="text-sm font-black text-purple-600 dark:text-purple-400">{payload[0].value}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Total:</span>
            <span className="text-sm font-black text-rose-500">
              {payload[1].value.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const DespesasPorDia: React.FC<DespesasPorDiaProps> = ({ dailyExpenses }) => {

  if (!dailyExpenses || dailyExpenses.length === 0) {
    return (
      <div className="glass p-10 rounded-[2.5rem] border-white/20 dark:border-white/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
            <CalendarDays className="w-6 h-6 text-purple-500" />
          </div>
          <h3 className="text-2xl font-black text-gradient">Fluxo de Despesas Diário</h3>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum dado disponível para o período selecionado.</p>
      </div>
    );
  }

  const highestDay = dailyExpenses.reduce((max, day) => day.total > max.total ? day : max, dailyExpenses[0]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-10 lg:p-12 rounded-[2.5rem] border-white/20 dark:border-white/5 relative overflow-hidden group"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-gradient-to-br from-rose-500/20 to-orange-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20 glow-primary">
            <TrendingDown className="w-7 h-7 text-rose-500" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-gradient leading-tight">Análise Temporal de Despesas</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium tracking-tight">Variação de custos e pagamentos por dia</p>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 py-4 bg-slate-900/5 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 backdrop-blur-md">
            <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Maior Despesa</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                    {new Date(highestDay.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })} • {highestDay.total.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <TrendingDown className="w-5 h-5 text-rose-500" />
            </div>
        </div>
      </div>

      <div className="h-[450px] w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={dailyExpenses} 
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            barGap={2}
          >
            <defs>
              <linearGradient id="colorCountExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9333ea" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#9333ea" stopOpacity={0.3}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" strokeOpacity={0.3} vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
              tickFormatter={(str) => new Date(str).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
              minTickGap={30}
              dy={10}
            />
            {/* Left Axis: Count (Bar) */}
            <YAxis 
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9333ea', fontSize: 10, fontWeight: 700 }}
              orientation="left"
              label={{ value: 'Registos', angle: -90, position: 'insideLeft', fill: '#9333ea', fontSize: 10 }}
            />
            {/* Right Axis: Total (Line) */}
            <YAxis 
              yAxisId="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#f43f5e', fontSize: 10, fontWeight: 700 }}
              orientation="right"
              tickFormatter={(val) => `€${val/1000}k`}
            />
            <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ fill: '#f1f5f9', opacity: 0.1 }}
            />
            <Bar 
              yAxisId="left"
              dataKey="count" 
              name="Registos"
              fill="url(#colorCountExpenses)" 
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
              maxBarSize={50}
            />
            <Line 
              yAxisId="right"
              type="monotone"
              dataKey="total" 
              name="Valor Total"
              stroke="#f43f5e"
              strokeWidth={3}
              dot={{ r: 3, fill: '#f43f5e', strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={1500}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-8 pt-8 border-t border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-10">
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Média Diária</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                    {(dailyExpenses.reduce((a, b) => a + b.total, 0) / dailyExpenses.length).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                </span>
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total no Período</span>
                <span className="text-xl font-black text-rose-500">
                    {dailyExpenses.reduce((a, b) => a + b.total, 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                </span>
            </div>
        </div>

        <div className="flex items-center gap-3 px-5 py-3 bg-purple-500/5 rounded-2xl border border-purple-500/10">
            <Info className="w-4 h-4 text-purple-500" />
            <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-[0.2em]">A visualizar {dailyExpenses.length} dias</p>
        </div>
      </div>
      
    </motion.div>
  );
};
