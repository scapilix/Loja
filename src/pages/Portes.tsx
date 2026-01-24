import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Map, TrendingUp, DollarSign, Filter, X, Globe, Box, Calendar, Package } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useFilters } from '../contexts/FilterContext';
import { KpiCard } from '../components/KpiCard';
import { SmartDateFilter } from '../components/SmartDateFilter';
import { CustomTooltip } from '../components/CustomTooltip';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

export default function Portes() {
  const { filters, setFilters } = useFilters();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const {
    shippingMetrics,
    totalRevenue,
    isFiltered,
    availableFilters,
    filterCounts,
    filteredOrders
  } = useDashboardData(filters);

  // Safety fallback
  const safeOrders = filteredOrders || [];

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val);
    
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('pt-PT');
  };

  const shippingDistribution = [
    { name: 'Continental', value: shippingMetrics?.continentalRevenue || 0 },
    { name: 'Ilhas', value: shippingMetrics?.ilhasRevenue || 0 }
  ].filter(item => item.value > 0);

  const shippingCountDistribution = [
    { name: 'Continental', value: shippingMetrics?.continentalCount || 0 },
    { name: 'Ilhas', value: shippingMetrics?.ilhasCount || 0 }
  ].filter(item => item.value > 0);

  const monthlyShippingData = shippingMetrics?.monthlyShipping ? Object.entries(shippingMetrics.monthlyShipping).map(([name, value]) => ({
    name,
    value
  })) : [];

  const shippingPercentage = totalRevenue > 0 && shippingMetrics
    ? (shippingMetrics.totalShippingRevenue / totalRevenue) * 100 
    : 0;

  // Filter orders for the selected month to show in drill down
  const drillDownOrders = selectedMonth 
    ? safeOrders.filter(o => {
        if (!o || !o.data_venda) return false;
        const orderDate = new Date(o.data_venda);
        const monthKey = orderDate.toLocaleString('default', { month: 'short' });
        // Also check if order involves shipping
        const hasShipping = o.items && Array.isArray(o.items) && o.items.some((item: any) => {
             const ref = item?.ref ? item.ref.toString().toUpperCase() : '';
             return ref === 'CONTINENTAL' || ref === 'ILHAS' || ref === 'PORTES' || ref === 'ESTRANGEIRO';
        });
        return monthKey === selectedMonth && hasShipping;
    })
    : [];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4 }}
      className="space-y-12"
    >
      {/* Filter Bar */}
      <div className="relative z-50 flex flex-wrap items-center justify-between gap-4 bg-white/50 dark:bg-slate-800/40 p-3 rounded-3xl border border-purple-100 dark:border-purple-800/20 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-white/5 rounded-2xl">
            <Filter className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Smart Filters</span>
          </div>
          
          <SmartDateFilter 
            filters={filters} 
            setFilters={setFilters} 
            availableFilters={availableFilters as any} 
            counts={filterCounts}
          />
        </div>

        {isFiltered && (
          <button 
            onClick={() => setFilters({ year: '', month: '', days: [] })}
            className="flex items-center gap-2 px-5 py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 mr-2"
          >
            <X className="w-4 h-4" />
            Limpar
          </button>
        )}
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <KpiCard
          label="Total Portes"
          value={formatCurrency(shippingMetrics.totalShippingRevenue)}
          icon={Truck}
          trend={`${shippingPercentage.toFixed(1)}% da faturação`}
          color="purple"
        />
        <KpiCard
          label="Envios Continental"
          value={shippingMetrics.continentalCount}
          icon={Map}
          trend={formatCurrency(shippingMetrics.continentalRevenue)}
          color="blue"
        />
        <KpiCard
          label="Envios Ilhas"
          value={shippingMetrics.ilhasCount}
          icon={Globe}
          trend={formatCurrency(shippingMetrics.ilhasRevenue)}
          color="indigo"
        />
        <KpiCard
          label="Total Envios"
          value={shippingMetrics.shippingCount}
          icon={Box}
          trend="Volumes enviados"
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Distribution */}
        <div className="glass p-8 rounded-[2.5rem] border-purple-100 dark:border-purple-800/20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Valor de Portes</h3>
              <p className="text-sm text-slate-800 dark:text-slate-200 font-black">Distribuição financeira (Continental vs Ilhas)</p>
            </div>
          </div>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={shippingDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {shippingDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip formatter={(val: any) => formatCurrency(val)} />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volume Distribution */}
        <div className="glass p-8 rounded-[2.5rem] border-purple-100 dark:border-purple-800/20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Box className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Volume de Envios</h3>
              <p className="text-sm text-slate-800 dark:text-slate-200 font-black">Quantidade de envios (Continental vs Ilhas)</p>
            </div>
          </div>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={shippingCountDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#82ca9d"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {shippingCountDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index + 2 % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Evolution */}
      <div className="glass p-8 rounded-[2.5rem] border-purple-100 dark:border-purple-800/20 relative group">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Evolução Mensal</h3>
            <p className="text-sm text-slate-800 dark:text-slate-200 font-black">Gastos com portes ao longo do tempo (Clique para detalhes)</p>
          </div>
        </div>
        
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
                data={monthlyShippingData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                onClick={(data) => {
                    if (data && data.activeLabel) {
                        setSelectedMonth(data.activeLabel);
                    }
                }}
                className="cursor-pointer"
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748B', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748B', fontSize: 12 }} 
                tickFormatter={(value) => `${value}€`}
              />
              <Tooltip
                cursor={{ fill: '#F1F5F9', opacity: 0.1 }}
                content={<CustomTooltip formatter={(val: any) => formatCurrency(val)} />}
              />
              <Bar 
                dataKey="value" 
                fill="url(#barGradient)"
                radius={[8, 8, 0, 0]} 
                barSize={50}
                minPointSize={5}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="absolute top-8 right-8 text-xs text-purple-500 bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Clique na barra para ver detalhes
        </div>
      </div>

      {/* Drill-down Modal via Portal */}
      <AnimatePresence>
        {selectedMonth && (
           createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                 <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                    onClick={() => setSelectedMonth(null)} 
                 />
                 <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700"
                 >
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Envios em {selectedMonth}</h3>
                                <p className="text-sm text-slate-800 dark:text-slate-200 font-black">Detalhes dos portes cobrados</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedMonth(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <X className="w-6 h-6 text-slate-500" />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-0">
                        {drillDownOrders.length > 0 ? (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 font-bold">Data</th>
                                        <th className="px-6 py-3 font-bold">Cliente</th>
                                        <th className="px-6 py-3 font-bold">Destino</th>
                                        <th className="px-6 py-3 font-bold text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {drillDownOrders.map((order: any, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                                                {formatDate(order.data_venda)}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                                                {order.nome_cliente || 'Desconhecido'}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {order.items?.map((i: any) => i.ref).find((r: string) => ['CONTINENTAL', 'ILHAS'].includes(r)) || 'Portes'}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">
                                                {formatCurrency(Number(order.pvp))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                                <Package className="w-12 h-12 mb-4 opacity-50" />
                                <p>Nenhum envio registrado neste mês.</p>
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-center text-xs text-slate-400">
                        Total de {drillDownOrders.length} envios encontrados
                    </div>
                 </motion.div>
            </div>,
            document.body
           )
        )}
      </AnimatePresence>
    </motion.div>
  );
}
