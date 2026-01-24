import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

interface ChartProps {
  data: any[];
  title: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-md border border-purple-100 dark:border-slate-700 p-3 rounded-2xl shadow-2xl shadow-purple-200/50 dark:shadow-none">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-black text-purple-600 dark:text-purple-400">
          {payload[0].value.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
        </p>
      </div>
    );
  }
  return null;
};

export const RevenueChart: React.FC<ChartProps> = ({ data, title }) => (
  <div className="bg-white/70 dark:bg-purple-900/5 backdrop-blur-xl border border-purple-100 dark:border-purple-800/20 p-8 rounded-[2.5rem] h-[450px] flex flex-col shadow-2xl shadow-purple-100/50 dark:shadow-none h-full transition-all hover:border-purple-300">
    <div className="mb-8">
      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h3>
      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Tendência Mensal</p>
    </div>
    <div className="flex-1 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9333ea" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.5} />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}
            dy={10}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#9333ea" 
            strokeWidth={4}
            fillOpacity={1} 
            fill="url(#colorValue)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const RegionalBarChart: React.FC<ChartProps> = ({ data, title }) => (
  <div className="bg-white/70 dark:bg-purple-900/5 backdrop-blur-xl border border-purple-100 dark:border-purple-800/20 p-8 rounded-[2.5rem] h-[450px] flex flex-col shadow-2xl shadow-purple-100/50 dark:shadow-none h-full transition-all hover:border-purple-300">
    <div className="mb-8">
      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h3>
      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Distribuição Floral</p>
    </div>
    <div className="flex-1 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={index === 0 ? '#9333ea' : '#f3e8ff'} className="transition-colors duration-500 hover:fill-purple-400" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);
