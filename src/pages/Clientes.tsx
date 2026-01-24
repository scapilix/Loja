import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Users, TrendingUp, Award, MapPin, Filter, X } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useFilters } from '../contexts/FilterContext';
import { KpiCard } from '../components/KpiCard';
import { TopClientes } from '../components/TopClientes';
import { ProdutosPorLocalidade } from '../components/ProdutosPorLocalidade';
import { SmartDateFilter } from '../components/SmartDateFilter';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

function Clientes() {
  const { filters, setFilters } = useFilters();

  const {
    totalRevenue,
    orderCount,
    topCustomers,
    customerSalesCount,
    salesByLocation,
    isFiltered,
    availableFilters,
    filterCounts
  } = useDashboardData(filters);

  const formatCurrency = (val: number) =>
    val?.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' }) || '0,00 €';

  // Customer analytics calculations
  const totalCustomers = Object.keys(customerSalesCount).length;
  const repeatCustomers = Object.values(customerSalesCount).filter(count => count > 1).length;
  const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
  const avgCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  // Customer segmentation by purchase frequency
  const customerSegmentation = useMemo(() => {
    const segments = {
      'Uma vez': 0,
      'Ocasional (2-3)': 0,
      'Frequente (4-5)': 0,
      'VIP (6+)': 0
    };

    Object.values(customerSalesCount).forEach(count => {
      if (count === 1) segments['Uma vez']++;
      else if (count <= 3) segments['Ocasional (2-3)']++;
      else if (count <= 5) segments['Frequente (4-5)']++;
      else segments['VIP (6+)']++;
    });

    return Object.entries(segments).map(([name, value]) => ({
      name,
      value,
      percentage: totalCustomers > 0 ? (value / totalCustomers) * 100 : 0
    }));
  }, [customerSalesCount, totalCustomers]);

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
            <span className="text-xs font-black text-purple-900 dark:text-purple-300 uppercase tracking-wider">Smart Filters</span>
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

      {/* Customer KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <KpiCard
          label="Total de Clientes"
          value={totalCustomers}
          icon={Users}
          trend={`${orderCount} compras`}
          color="purple"
        />
        <KpiCard
          label="Taxa de Retorno"
          value={`${repeatRate.toFixed(1)}%`}
          icon={TrendingUp}
          trend={`${repeatCustomers} clientes recorrentes`}
          color="green"
        />
        <KpiCard
          label="Valor Médio/Cliente"
          value={formatCurrency(avgCustomerValue)}
          icon={Award}
          trend="Customer Lifetime Value"
          color="purple"
        />
        <KpiCard
          label="Localidades"
          value={salesByLocation.length}
          icon={MapPin}
          trend="Áreas de atuação"
          color="orange"
        />
      </div>

      {/* Customer Segmentation */}
      <div className="glass p-10 rounded-[2rem] border-purple-100 dark:border-purple-800/20">
        <div className="mb-8">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">Segmentação de Clientes</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Distribuição por frequência de compra</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {customerSegmentation.map((segment, index) => (
            <div key={segment.name} className="relative">
              <div className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                index === 0 ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700' :
                index === 1 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                index === 2 ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' :
                'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
              }`}>
                <div className="text-center">
                  <div className="text-4xl font-black font-mono mb-2">{segment.value}</div>
                  <div className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">{segment.name}</div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-500">{segment.percentage.toFixed(1)}%</div>
                </div>
                <div className="mt-4 h-2 bg-white dark:bg-slate-900/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      index === 0 ? 'bg-slate-400' :
                      index === 1 ? 'bg-blue-500' :
                      index === 2 ? 'bg-purple-500' :
                      'bg-amber-500'
                    }`}
                    style={{ width: `${segment.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Customers Leaderboard */}
      <div className="glass p-10 rounded-[2rem] border-purple-100 dark:border-purple-800/20">
        <div className="mb-8">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">Top Clientes</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Clientes mais valiosos por número de compras</p>
        </div>
        <TopClientes customers={topCustomers} />
      </div>

      {/* Geographic Distribution */}
      <ProdutosPorLocalidade locations={salesByLocation} />
    </motion.div>
  );
}

export default Clientes;
