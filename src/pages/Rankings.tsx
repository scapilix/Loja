import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, Award, Crown, Filter, X, ShoppingBag, Calendar, Clock } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useFilters } from '../contexts/FilterContext';
import { SmartDateFilter } from '../components/SmartDateFilter';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

function Rankings() {
  const { filters, setFilters } = useFilters();

  const {
    topCustomers,
    topProducts,
    isFiltered,
    availableFilters,
    filterCounts,
    filteredOrders
  } = useDashboardData(filters);

  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  const customerOrders = selectedCustomer && filteredOrders
    ? filteredOrders.filter((o: any) => o.nome_cliente?.trim().toUpperCase() === selectedCustomer)
        .sort((a: any, b: any) => new Date(b.data_venda).getTime() - new Date(a.data_venda).getTime())
    : [];

  const formatCurrency = (val: number) =>
    val?.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' }) || '0,00 €';

  const getMedalIcon = (position: number) => {
    if (position === 0) return <Crown className="w-6 h-6 text-amber-500" />;
    if (position === 1) return <Trophy className="w-6 h-6 text-slate-400" />;
    if (position === 2) return <Award className="w-6 h-6 text-orange-600" />;
    return null;
  };

  const getMedalBg = (position: number) => {
    if (position === 0) return 'bg-gradient-to-br from-amber-400 to-yellow-600';
    if (position === 1) return 'bg-gradient-to-br from-slate-300 to-slate-500';
    if (position === 2) return 'bg-gradient-to-br from-orange-400 to-orange-600';
    return 'bg-gradient-to-br from-purple-500 to-indigo-600';
  };

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
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-white/10 rounded-2xl border border-purple-200 dark:border-white/5">
            <Filter className="w-4 h-4 text-purple-800 dark:text-purple-300" />
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

      {/* Page Header */}
      <div className="glass p-8 rounded-[2rem] border-purple-100 dark:border-purple-800/20">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-950 dark:text-white">Rankings</h2>
            <p className="text-slate-900 dark:text-slate-100 text-sm mt-1 font-black italic tracking-tight">Melhores clientes e produtos em destaque</p>
          </div>
        </div>
      </div>

      {/* Dual Leaderboard Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Top Customers Leaderboard */}
        <div className="glass p-10 rounded-[2rem] border-purple-100 dark:border-purple-800/20">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Melhores Clientes</h3>
          </div>

          <div className="space-y-4">
            {topCustomers.map((customer, index) => (
              <motion.div
                key={customer.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedCustomer(customer.name)}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] cursor-pointer group ${
                  index < 3
                    ? 'bg-gradient-to-br from-white to-purple-50 dark:from-slate-800/50 dark:to-purple-900/20 border-purple-200 dark:border-purple-700/50'
                    : 'bg-white/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Position & Medal */}
                  <div className="flex-shrink-0">
                    <div className={`w-14 h-14 rounded-xl ${getMedalBg(index)} flex items-center justify-center text-white font-black text-xl shadow-lg relative`}>
                      {index < 3 ? (
                        <div className="absolute -top-2 -right-2">
                          {getMedalIcon(index)}
                        </div>
                      ) : null}
                      {index + 1}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white truncate">{customer.name}</h4>
                    {customer.instagram && customer.instagram !== 'N/A' && (
                        <p className="text-xs text-purple-500 font-medium truncate">@{customer.instagram.replace('@', '')}</p>
                    )}
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-slate-950 dark:text-white font-black">
                        <span className="font-black text-purple-700 dark:text-purple-400">{customer.orders}</span> compras
                      </span>
                      <span className="text-sm font-mono font-black text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(customer.revenue)}
                      </span>
                    </div>
                  </div>

                  {/* Percentage */}
                  <div className="flex-shrink-0 text-right">
                    <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
                      {customer.percentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">do total</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 h-2 bg-slate-100 dark:bg-slate-900/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${customer.percentage}%` }}
                    transition={{ delay: index * 0.1 + 0.2, duration: 0.8 }}
                    className={`h-full ${
                      index === 0 ? 'bg-gradient-to-r from-amber-400 to-yellow-600' :
                      index === 1 ? 'bg-gradient-to-r from-slate-400 to-slate-600' :
                      index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                      'bg-gradient-to-r from-purple-500 to-indigo-600'
                    }`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Top Products Leaderboard */}
        <div className="glass p-10 rounded-[2rem] border-purple-100 dark:border-purple-800/20">
          <div className="flex items-center gap-3 mb-8">
            <Trophy className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Melhores Produtos</h3>
          </div>

          <div className="space-y-4">
            {topProducts.slice(0, 10).map((product, index) => {
              const maxQty = topProducts[0]?.quantity || 1;
              const percentage = (product.quantity / maxQty) * 100;

              return (
                <motion.div
                  key={product.ref}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] ${
                    index < 3
                      ? 'bg-gradient-to-br from-white to-emerald-50 dark:from-slate-800/50 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-700/50'
                      : 'bg-white/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Position & Medal */}
                    <div className="flex-shrink-0">
                      <div className={`w-14 h-14 rounded-xl ${getMedalBg(index)} flex items-center justify-center text-white font-black text-xl shadow-lg relative`}>
                        {index < 3 ? (
                          <div className="absolute -top-2 -right-2">
                            {getMedalIcon(index)}
                          </div>
                        ) : null}
                        {index + 1}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-lg text-slate-900 dark:text-white truncate">{product.ref}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-slate-950 dark:text-white font-black">
                          <span className="font-black text-emerald-700 dark:text-emerald-400">{product.quantity}</span> unidades
                        </span>
                        <span className="text-sm font-mono font-black text-emerald-700 dark:text-emerald-400">
                          {formatCurrency(product.revenue)}
                        </span>
                      </div>
                    </div>

                    {/* Average Price */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(product.avgPrice)}
                      </div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">preço médio</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 h-2 bg-slate-100 dark:bg-slate-900/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: index * 0.1 + 0.2, duration: 0.8 }}
                      className={`h-full ${
                        index === 0 ? 'bg-gradient-to-r from-amber-400 to-yellow-600' :
                        index === 1 ? 'bg-gradient-to-r from-slate-400 to-slate-600' :
                        index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                        'bg-gradient-to-r from-emerald-500 to-teal-600'
                      }`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Customer Detail Drawer - Side Panel (matching BaseClientes) */}
      <AnimatePresence>
        {selectedCustomer && (
          <>
            {createPortal(
              <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedCustomer(null)}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
                />
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="relative h-full w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto border-l border-slate-200 dark:border-slate-700 pointer-events-auto"
                >
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{selectedCustomer}</h2>
                                <p className="text-slate-800 dark:text-slate-200 text-sm font-black">Histórico de Relacionamento</p>
                            </div>
                            <button 
                                onClick={() => setSelectedCustomer(null)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-800/20">
                                <div className="text-purple-600 dark:text-purple-400 font-bold text-xs uppercase mb-1">Total Gasto</div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(customerOrders.reduce((acc: number, curr: any) => acc + Number(curr.pvp), 0))}</div>
                            </div>
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/20">
                                <div className="text-blue-600 dark:text-blue-400 font-bold text-xs uppercase mb-1">Compras</div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">{customerOrders.length}</div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="space-y-6">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Histórico de Pedidos
                            </h3>
                            
                            {customerOrders.length > 0 ? (
                                <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-8 pl-6 pb-2">
                                    {customerOrders.map((order: any, i: number) => (
                                        <div key={i} className="relative">
                                            <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 bg-purple-500" />
                                            
                                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(order.data_venda).toLocaleDateString('pt-PT')}
                                                    </span>
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                        {formatCurrency(Number(order.pvp))}
                                                    </span>
                                                </div>
                                                
                                                <div className="text-xs text-slate-800 dark:text-slate-300 mb-2 font-mono font-bold">
                                                    {order.id_venda || '#N/A'} • {order.forma_de_pagamento}
                                                </div>

                                                <div className="space-y-1">
                                                    {order.items?.map((item: any, k: number) => (
                                                        <div key={k} className="flex justify-between items-center text-xs border-b border-dashed border-slate-200 dark:border-slate-700/50 last:border-0 pb-1 last:pb-0">
                                                            <span className="text-slate-700 dark:text-slate-300">{item.designacao || item.ref}</span>
                                                            <span className="text-slate-500">x{item.quantidade || 1}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                                    <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                                    <p>Nenhuma compra encontrada no histórico filtrado.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
              </div>,
              document.body
            )}
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Rankings;
