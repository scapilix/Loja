import React, { useState, useMemo } from 'react';
import { Package, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { DataTable } from './DataTable';
import { KpiCard } from './KpiCard';
import { useStockData } from '../hooks/useStockData';

export const StockAnalysis: React.FC = () => {
  const { 
    totalStockValue, 
    totalItems, 
    lowStockCount, 
    outOfStockCount, 
    topValueItem, 
    stockItems 
  } = useStockData();

  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredItems = useMemo(() => {
    if (filterStatus === 'all') return stockItems;
    if (filterStatus === 'low') return stockItems.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock');
    return stockItems;
  }, [stockItems, filterStatus]);

  const formatCurrency = (val: number) => 
    val?.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' }) || '0,00 €';

  const columns = [
    { header: 'Referência / Produto', accessor: 'ref', render: (val: string) => <span className="font-bold text-slate-700 dark:text-slate-200">{val}</span> },
    { header: 'Categoria', accessor: 'category', render: (val: string) => <span className="text-xs uppercase tracking-wider font-bold text-slate-400 border border-slate-200 dark:border-white/10 px-2 py-1 rounded-lg">{val}</span> },
    { header: 'Stock Atual', accessor: 'currentStock', render: (val: number) => <span className="font-black text-slate-900 dark:text-white text-lg">{val}</span> },
    { header: 'Status', accessor: 'status', render: (val: string) => {
      let colorClass = 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400';
      if (val === 'Low Stock') colorClass = 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400';
      if (val === 'Out of Stock') colorClass = 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400';
      if (val === 'Overstock') colorClass = 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400';
      
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${colorClass}`}>
          {val}
        </span>
      );
    }},
    { header: 'Valor Unit. (Médio)', accessor: 'avgPrice', render: (val: number) => <span className="text-slate-500 dark:text-slate-400 font-medium">{formatCurrency(val)}</span> },
    { header: 'Valor Total', accessor: 'totalValue', render: (val: number) => <span className="font-black text-slate-800 dark:text-slate-100">{formatCurrency(val)}</span> },
  ];

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-12"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-100/90 dark:bg-slate-900/90 p-8 rounded-[2.5rem] border border-white/50 dark:border-white/10 shadow-xl backdrop-blur-3xl">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Análise de Inventário</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Monitorização de stock e valorização de ativos</p>
        </div>
        
        {/* Quick Filter Actions */}
        <div className="flex gap-3 bg-white/50 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-white/20 backdrop-blur-md">
            <button 
                onClick={() => setFilterStatus('all')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${filterStatus === 'all' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg shadow-slate-200/50 dark:shadow-none' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
                Todos
            </button>
            <button 
                onClick={() => setFilterStatus('low')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${filterStatus === 'low' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 shadow-lg shadow-amber-500/10' : 'text-slate-500 hover:text-amber-600'}`}
            >
                <AlertTriangle className="w-4 h-4" />
                Alertas ({lowStockCount + outOfStockCount})
            </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          label="Valor Total em Stock"
          value={formatCurrency(totalStockValue)}
          icon={DollarSign}
          trend="Calculado (Estimado)"
          color="emerald"
        />
        <KpiCard
          label="Total de Itens"
          value={totalItems}
          icon={Package}
          trend={`${stockItems.length} Referências Únicas`}
          color="blue"
        />
        <KpiCard
          label="Stock Crítico"
          value={lowStockCount + outOfStockCount}
          icon={AlertTriangle}
          trend={`${outOfStockCount} Esgotados`}
          color="rose"
        />
        <KpiCard
          label="Produto Mais Valioso"
          value={topValueItem ? formatCurrency(topValueItem.totalValue) : '-'}
          icon={TrendingUp}
          trend={topValueItem?.ref || '-'}
          color="purple"
        />
      </div>

      {/* Main Table Content */}
      <div className="h-[800px]">
        <DataTable
          columns={columns}
          data={filteredItems}
          title={filterStatus === 'low' ? 'Stock Crítico / Esgotado' : 'Inventário Geral'}
        />
      </div>
    </motion.div>
  );
};
