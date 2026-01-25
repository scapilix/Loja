import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Package, TrendingUp, BarChart3, DollarSign, Filter, X } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useFilters } from '../contexts/FilterContext';
import { KpiCard } from '../components/KpiCard';
import { TopProdutos } from '../components/TopProdutos';
import { SmartDateFilter } from '../components/SmartDateFilter';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

function Produtos() {
  const { filters, setFilters } = useFilters();

  const {
    totalRevenue,
    orderCount,
    topProducts,
    isFiltered,
    availableFilters,
    filterCounts
  } = useDashboardData(filters);

  const formatCurrency = (val: number) =>
    val?.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' }) || '0,00 €';

  // Product analytics calculations
  const totalProductsSold = useMemo(() => {
    return topProducts.reduce((sum, product) => sum + product.quantity, 0);
  }, [topProducts]);

  const avgProductPrice = useMemo(() => {
    const totalRevenue = topProducts.reduce((sum, product) => sum + product.revenue, 0);
    const totalQty = topProducts.reduce((sum, product) => sum + product.quantity, 0);
    return totalQty > 0 ? totalRevenue / totalQty : 0;
  }, [topProducts]);

  const bestSeller = useMemo(() => {
    if (topProducts.length === 0) return 'N/A';
    return topProducts[0].ref;
  }, [topProducts]);

  // Product performance matrix data
  const productMatrix = useMemo(() => {
    return topProducts.map(product => ({
      ref: product.ref,
      quantity: product.quantity,
      revenue: product.revenue,
      avgPrice: product.avgPrice
    }));
  }, [topProducts]);

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

      {/* Product KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <KpiCard
          label="Produtos Vendidos"
          value={totalProductsSold}
          icon={Package}
          trend={`${topProducts.length} SKUs ativos`}
          color="purple"
        />
        <KpiCard
          label="Faturamento Total"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          trend={`${orderCount} transações`}
          color="green"
        />
        <KpiCard
          label="Preço Médio"
          value={formatCurrency(avgProductPrice)}
          icon={BarChart3}
          trend="Ticket médio/produto"
          color="purple"
        />
        <KpiCard
          label="Best Seller"
          value={bestSeller}
          icon={TrendingUp}
          trend="Produto mais vendido"
          color="orange"
        />
      </div>

      {/* Product Performance Matrix */}
      <div className="glass p-10 rounded-[2rem] border-purple-100 dark:border-purple-800/20">
        <div className="mb-8">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">Performance dos Produtos</h3>
          <p className="text-slate-800 dark:text-slate-200 text-sm mt-1 font-black">Análise de quantidade vendida vs faturamento</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-purple-200 dark:border-purple-800/30">
                <th className="text-left pb-4 px-4 text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Referência</th>
                <th className="text-right pb-4 px-4 text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Quantidade</th>
                <th className="text-right pb-4 px-4 text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Faturamento</th>
                <th className="text-right pb-4 px-4 text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Preço Médio</th>
                <th className="text-center pb-4 px-4 text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Performance</th>
              </tr>
            </thead>
            <tbody>
              {productMatrix.map((product, index) => {
                const performanceScore = ((product.quantity / totalProductsSold) * 50) + ((product.revenue / totalRevenue) * 50);
                return (
                  <tr key={product.ref} className="border-b border-slate-100 dark:border-white/5 hover:bg-purple-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
                          index === 0 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                          index === 1 ? 'bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400' :
                          index === 2 ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400' :
                          'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">{product.ref}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{product.quantity}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(product.revenue)}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-mono text-slate-600 dark:text-slate-400">{formatCurrency(product.avgPrice)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex-1 max-w-[120px] h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                            style={{ width: `${Math.min(performanceScore, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 w-10 text-right">
                          {performanceScore.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Products */}
      <div className="glass p-10 rounded-[2rem] border-purple-100 dark:border-purple-800/20">
        <div className="mb-8">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">Top Produtos</h3>
          <p className="text-slate-800 dark:text-slate-200 text-sm mt-1 font-black">Produtos mais vendidos por quantidade</p>
        </div>
        <TopProdutos products={topProducts} />
      </div>


    </motion.div>
  );
}

export default Produtos;
