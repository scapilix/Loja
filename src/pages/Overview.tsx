import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, ShoppingCart, Briefcase, ChevronRight, Users, Package, Filter, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { KpiCard } from '../components/KpiCard';
import { TopClientes } from '../components/TopClientes';
import { TopProdutos } from '../components/TopProdutos';
import { VendasPorDia } from '../components/VendasPorDia';
import { MetodosPagamento } from '../components/MetodosPagamento';
import { DiasDaSemana } from '../components/DiasDaSemana';
import { SmartDateFilter } from '../components/SmartDateFilter';
import { useDashboardData } from '../hooks/useDashboardData';
import { useFilters } from '../contexts/FilterContext';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

function Overview() {
  const { filters, setFilters } = useFilters();

  const {
    totalRevenue,
    totalProfit,
    orderCount,
    avgTicket,
    topCustomers,
    topProducts,
    salesByDate,
    paymentMethodData,
    salesByDayOfWeek,
    isFiltered,
    availableFilters,
    filterCounts
  } = useDashboardData(filters);

  const formatCurrency = (val: number) =>
    val?.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' }) || '0,00 €';

  // Preview only top 3
  const topCustomersPreview = topCustomers.slice(0, 3);
  const topProductsPreview = topProducts.slice(0, 3);

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
            <Filter className="w-4 h-4 text-purple-700 dark:text-purple-400" />
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Smart Filters</span>
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
          label="Faturamento Total"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          trend="+12.5% vs mês anterior"
          color="purple"
        />
        <KpiCard
          label="Lucro Líquido"
          value={formatCurrency(totalProfit)}
          icon={TrendingUp}
          trend="+8.2% vs mês anterior"
          color="green"
        />
        <KpiCard
          label="Total de Compras"
          value={orderCount}
          icon={ShoppingCart}
          trend={`Vol: ${orderCount}`}
          color="purple"
        />
        <KpiCard
          label="Ticket Médio"
          value={formatCurrency(avgTicket)}
          icon={Briefcase}
          trend="Ideal: > 25€"
          color="orange"
        />
      </div>

      {/* Sales Trend Chart */}
      <div className="w-full">
        <VendasPorDia dailySales={salesByDate} />
      </div>

      {/* Quick Insights Grid - Top Customers & Products Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Top Customers Preview */}
        <div className="glass p-8 rounded-[2rem] border-purple-100 dark:border-purple-800/20">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-black text-slate-950 dark:text-white">Top Clientes</h3>
              <p className="text-slate-700 dark:text-slate-200 text-sm mt-1 font-black">Clientes mais valiosos</p>
            </div>
            <Link
              to="/clientes"
              className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/20 rounded-xl text-sm font-bold transition-all duration-300 group"
            >
              Ver Todos
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <TopClientes customers={topCustomersPreview} />
          <div className="mt-4 text-center">
            <Link
              to="/clientes"
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-semibold transition-colors"
            >
              + {topCustomers.length - 3} clientes
            </Link>
          </div>
        </div>

        {/* Top Products Preview */}
        <div className="glass p-8 rounded-[2rem] border-purple-100 dark:border-purple-800/20">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-black text-slate-950 dark:text-white">Top Produtos</h3>
              <p className="text-slate-700 dark:text-slate-200 text-sm mt-1 font-black">Produtos mais vendidos</p>
            </div>
            <Link
              to="/produtos"
              className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/20 rounded-xl text-sm font-bold transition-all duration-300 group"
            >
              Ver Todos
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <TopProdutos products={topProductsPreview} />
          <div className="mt-4 text-center">
            <Link
              to="/produtos"
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-semibold transition-colors"
            >
              + {topProducts.length - 3} produtos
            </Link>
          </div>
        </div>
      </div>

      {/* Payment Methods Distribution */}
      <div className="w-full">
        <MetodosPagamento paymentMethods={paymentMethodData} />
      </div>

      {/* Sales by Day of Week */}
      <DiasDaSemana days={salesByDayOfWeek} />

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/clientes" className="glass p-8 rounded-[2rem] group cursor-pointer hover:bg-white/60 dark:hover:bg-white/[0.05] transition-all duration-300 border border-purple-100/50 dark:border-white/[0.05] hover:border-purple-300 dark:hover:border-purple-500/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Análise de Clientes</h3>
          </div>
          <p className="text-slate-800 dark:text-slate-300 text-sm mb-4 font-bold">Explore segmentação, comportamento e valor de vida dos clientes</p>
          <div className="flex items-center text-purple-600 dark:text-purple-400 font-semibold text-sm group-hover:translate-x-2 transition-transform">
            Explorar <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </Link>

        <Link to="/produtos" className="glass p-8 rounded-[2rem] group cursor-pointer hover:bg-white/60 dark:hover:bg-white/[0.05] transition-all duration-300 border border-purple-100/50 dark:border-white/[0.05] hover:border-emerald-300 dark:hover:border-emerald-500/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Análise de Produtos</h3>
          </div>
          <p className="text-slate-800 dark:text-slate-300 text-sm mb-4 font-bold">Veja performance, inventário e tendências de produtos</p>
          <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold text-sm group-hover:translate-x-2 transition-transform">
            Explorar <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </Link>

        <Link to="/rankings" className="glass p-8 rounded-[2rem] group cursor-pointer hover:bg-white/60 dark:hover:bg-white/[0.05] transition-all duration-300 border border-purple-100/50 dark:border-white/[0.05] hover:border-amber-300 dark:hover:border-amber-500/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Rankings</h3>
          </div>
          <p className="text-slate-800 dark:text-slate-300 text-sm mb-4 font-bold">Veja os melhores clientes e produtos em destaque</p>
          <div className="flex items-center text-amber-600 dark:text-amber-400 font-semibold text-sm group-hover:translate-x-2 transition-transform">
            Explorar <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </Link>
      </div>
    </motion.div>
  );
}

export default Overview;
