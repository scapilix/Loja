import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ChevronRight, 
  ChevronDown,
  Filter,
  X,
  Package
} from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useFilters } from '../contexts/FilterContext';
import { SmartDateFilter } from '../components/SmartDateFilter';

const FilterDropdown = ({ 
  label, 
  value, 
  options, 
  onChange, 
  icon: Icon 
}: { 
  label: string; 
  value: string; 
  options: string[]; 
  onChange: (val: string) => void;
  icon?: any;
}) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-1.5 px-2">
      {Icon && <Icon className="w-2.5 h-2.5 text-slate-400" />}
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all min-w-[120px] appearance-none cursor-pointer hover:border-purple-300 dark:hover:border-purple-700"
    >
      <option value="">TODOS</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const SortHeader = ({ 
  label, 
  sortKey, 
  currentSort, 
  onRequestSort, 
  align = 'left' 
}: { 
  label: string; 
  sortKey: string; 
  currentSort: { key: string; direction: 'asc' | 'desc' } | null;
  onRequestSort: (key: string) => void;
  align?: 'left' | 'right';
}) => {
  const isActive = currentSort?.key === sortKey;
  return (
    <th 
      className={`px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group ${align === 'right' ? 'text-right' : ''}`}
      onClick={() => onRequestSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        <span>{label}</span>
        <div className={`flex flex-col -space-y-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
          <ChevronDown className={`w-2.5 h-2.5 transition-transform ${isActive && currentSort.direction === 'desc' ? 'rotate-180' : ''}`} />
        </div>
      </div>
    </th>
  );
};

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export default function Encomendas() {
  const { filters, setFilters } = useFilters();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  const {
    filteredOrders,
    isFiltered,
    availableFilters,
    filterCounts
  } = useDashboardData(filters);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('pt-PT');
  };

  const formatMonthYear = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const formatted = date.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const formatWeekday = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const formatted = date.toLocaleDateString('pt-PT', { weekday: 'long' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const filteredItems = useMemo(() => {
    return filteredOrders.filter(order => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = (
        String(order.nome_cliente || '').toLowerCase().includes(search) ||
        String(order.id_venda || '').toLowerCase().includes(search) ||
        String(order.localidade || '').toLowerCase().includes(search) ||
        (order.items && order.items.some((i: any) => String(i.ref || '').toLowerCase().includes(search)))
      );

      const matchesPayment = !filters.payment || order.forma_de_pagamento === filters.payment;
      const matchesWeekday = !filters.weekday || formatWeekday(order.data_venda) === filters.weekday;
      const matchesMonthYear = !filters.monthYear || formatMonthYear(order.data_venda) === filters.monthYear;
      const matchesInstagram = !filters.instagram || order.instagram === filters.instagram;
      const matchesCanal = !filters.canal || (order.site_kyte || 'KYTE') === filters.canal;
      const matchesEnvio = !filters.envio || (order.loja_ctt || 'CTT') === filters.envio;

      return matchesSearch && matchesPayment && matchesWeekday && matchesMonthYear && matchesInstagram && matchesCanal && matchesEnvio;
    });
  }, [filteredOrders, searchTerm, filters, formatWeekday, formatMonthYear]);

  const sortedItems = useMemo(() => {
    let sortableItems = [...filteredItems];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any = a[sortConfig.key];
        let bValue: any = b[sortConfig.key];

        // Derived values handling
        if (sortConfig.key === 'mesano') {
          aValue = new Date(a.data_venda).getTime();
          bValue = new Date(b.data_venda).getTime();
        } else if (sortConfig.key === 'dia_da_semana') {
          const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
          aValue = days.indexOf(formatWeekday(a.data_venda));
          bValue = days.indexOf(formatWeekday(b.data_venda));
        } else if (sortConfig.key === 'canal') {
          aValue = a.site_kyte || 'KYTE';
          bValue = b.site_kyte || 'KYTE';
        } else if (sortConfig.key === 'envio') {
          aValue = a.loja_ctt || 'CTT';
          bValue = b.loja_ctt || 'CTT';
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredItems, sortConfig, formatWeekday]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const uniqueOptions = useMemo(() => {
    const payments = new Set<string>();
    const weekdays = new Set<string>();
    const monthYears = new Set<string>();
    const instagrams = new Set<string>();
    const canals = new Set<string>();
    const envios = new Set<string>();

    filteredOrders.forEach(o => {
      if (o.forma_de_pagamento) payments.add(o.forma_de_pagamento);
      weekdays.add(formatWeekday(o.data_venda));
      monthYears.add(formatMonthYear(o.data_venda));
      if (o.instagram) instagrams.add(o.instagram);
      canals.add(o.site_kyte || 'KYTE');
      envios.add(o.loja_ctt || 'CTT');
    });

    return {
      payments: Array.from(payments).sort(),
      weekdays: Array.from(weekdays).sort(),
      monthYears: Array.from(monthYears).sort(),
      instagrams: Array.from(instagrams).sort(),
      canals: Array.from(canals).sort(),
      envios: Array.from(envios).sort()
    };
  }, [filteredOrders, formatWeekday, formatMonthYear]);

  const toggleOrder = (index: number) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(index)) newExpanded.delete(index);
    else newExpanded.add(index);
    setExpandedOrders(newExpanded);
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Encomendas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-bold uppercase tracking-wider">
            Histórico completo de vendas e envios ({filteredItems.length})
          </p>
        </div>

        <div className="flex-1 w-full md:w-auto max-w-md relative">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <Search className="h-4 w-4 text-slate-400" />
           </div>
           <input
             type="text"
             className="block w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold text-xs"
             placeholder="Buscar por cliente, ID, ref..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

       {/* Filter Bar */}
       <div className="relative z-40 flex flex-wrap items-center gap-4 bg-white/50 dark:bg-slate-800/40 p-2 rounded-2xl border border-purple-100 dark:border-purple-800/20 backdrop-blur-xl">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-white/10 rounded-xl border border-purple-200 dark:border-white/5">
          <Filter className="w-3 h-3 text-purple-800 dark:text-purple-300" />
          <span className="text-[10px] font-black text-purple-950 dark:text-purple-100 uppercase tracking-wider">Filtros</span>
        </div>
        
        <div className="scale-90 origin-left">
            <SmartDateFilter 
            filters={filters} 
            setFilters={setFilters as any} 
            availableFilters={availableFilters as any} 
            counts={filterCounts}
            itemLabel="Encomendas"
            />
        </div>

        <div className="h-8 w-[1px] bg-slate-200 dark:bg-white/10 mx-2 hidden lg:block" />

        <div className="flex flex-wrap items-center gap-4">
          <FilterDropdown 
            label="Pagamento" 
            value={filters.payment} 
            options={uniqueOptions.payments} 
            onChange={(val) => setFilters(prev => ({ ...prev, payment: val }))} 
          />
          <FilterDropdown 
            label="Dia Semana" 
            value={filters.weekday} 
            options={uniqueOptions.weekdays} 
            onChange={(val) => setFilters(prev => ({ ...prev, weekday: val }))} 
          />
          <FilterDropdown 
            label="Mês / Ano" 
            value={filters.monthYear} 
            options={uniqueOptions.monthYears} 
            onChange={(val) => setFilters(prev => ({ ...prev, monthYear: val }))} 
          />
          <FilterDropdown 
            label="Canal" 
            value={filters.canal} 
            options={uniqueOptions.canals} 
            onChange={(val) => setFilters(prev => ({ ...prev, canal: val }))} 
          />
          <FilterDropdown 
            label="Envio" 
            value={filters.envio} 
            options={uniqueOptions.envios} 
            onChange={(val) => setFilters(prev => ({ ...prev, envio: val }))} 
          />
           <FilterDropdown 
            label="Instagram" 
            value={filters.instagram} 
            options={uniqueOptions.instagrams} 
            onChange={(val) => setFilters(prev => ({ ...prev, instagram: val }))} 
          />
        </div>

        {isFiltered && (
          <button 
            onClick={() => setFilters({ 
              year: '', 
              month: '', 
              days: [],
              payment: '',
              weekday: '',
              monthYear: '',
              instagram: '',
              canal: '',
              envio: ''
            })}
            className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300"
          >
            <X className="w-3 h-3" />
            Limpar
          </button>
        )}
      </div>

      <div className="glass overflow-hidden rounded-[2.5rem] border-purple-100 dark:border-purple-800/20">
        <div className="overflow-x-auto max-h-[700px] overflow-y-auto custom-scrollbar">
          <table className="min-w-full text-left text-xs whitespace-nowrap">
            <thead className="sticky top-0 z-10 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-[10px] text-slate-500 dark:text-slate-400 font-black">
              <tr>
                <th className="px-6 py-4 w-10"></th>
                <SortHeader label="Data Venda" sortKey="data_venda" currentSort={sortConfig} onRequestSort={requestSort} />
                <SortHeader label="ID Venda" sortKey="id_venda" currentSort={sortConfig} onRequestSort={requestSort} />
                <SortHeader label="Cliente" sortKey="nome_cliente" currentSort={sortConfig} onRequestSort={requestSort} />
                <SortHeader label="Portes" sortKey="portes" currentSort={sortConfig} onRequestSort={requestSort} align="right" />
                <SortHeader label="Descontos" sortKey="descontos" currentSort={sortConfig} onRequestSort={requestSort} align="right" />
                <SortHeader label="PVP Total" sortKey="pvp" currentSort={sortConfig} onRequestSort={requestSort} align="right" />
                <SortHeader label="Lucro" sortKey="lucro" currentSort={sortConfig} onRequestSort={requestSort} align="right" />
                <SortHeader label="Instagram" sortKey="instagram" currentSort={sortConfig} onRequestSort={requestSort} />
                <SortHeader label="Canal" sortKey="canal" currentSort={sortConfig} onRequestSort={requestSort} />
                <SortHeader label="Envio" sortKey="envio" currentSort={sortConfig} onRequestSort={requestSort} />
                <SortHeader label="Pagamento" sortKey="forma_de_pagamento" currentSort={sortConfig} onRequestSort={requestSort} />
                <SortHeader label="MêsAno" sortKey="mesano" currentSort={sortConfig} onRequestSort={requestSort} />
                <SortHeader label="Dia da Semana" sortKey="dia_da_semana" currentSort={sortConfig} onRequestSort={requestSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedItems.map((order, index) => (
                <React.Fragment key={index}>
                  <tr 
                    onClick={() => toggleOrder(index)}
                    className={`hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer ${expandedOrders.has(index) ? 'bg-purple-50/50 dark:bg-purple-500/5' : ''}`}
                  >
                    <td className="px-6 py-4">
                      {expandedOrders.has(index) ? <ChevronDown className="w-4 h-4 text-purple-500" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                      {formatDate(order.data_venda)}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-400">
                      {order.id_venda || '#N/A'}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900 dark:text-white">
                      {order.nome_cliente || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-600">
                      {formatCurrency(Number(order.portes || 0))}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-rose-500">
                      {formatCurrency(Number(order.descontos || 0))}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-slate-900 dark:text-white font-black text-sm">
                        {formatCurrency(Number(order.pvp))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-emerald-600 dark:text-emerald-400 font-black">
                        {formatCurrency(Number(order.lucro))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-pink-500 dark:text-pink-400 font-bold">
                      {order.instagram || '-'}
                    </td>
                    <td className="px-6 py-4 font-black text-purple-600">
                      {order.site_kyte || 'KYTE'}
                    </td>
                    <td className="px-6 py-4 font-black text-indigo-500">
                      {order.loja_ctt || 'CTT'}
                    </td>
                    <td className="px-6 py-4 font-black text-blue-500">
                      {order.forma_de_pagamento || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-400">
                      {formatMonthYear(order.data_venda)}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-400">
                      {formatWeekday(order.data_venda)}
                    </td>
                  </tr>
                  
                  {/* Expanded Items Row */}
                  {/* Expanded Items as Sub-Rows (Perfect Alignment) */}
                  <AnimatePresence>
                    {expandedOrders.has(index) && (
                      <>
                        {/* Sub-header row */}
                        <tr className="bg-slate-50/50 dark:bg-slate-900/40 divide-y-0">
                          <td className="px-6 py-2"></td>
                          <td colSpan={13} className="px-6 py-2">
                             <div className="flex items-center gap-2">
                                <Package className="w-3.5 h-3.5 text-purple-400" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Produtos desta encomenda</span>
                             </div>
                          </td>
                        </tr>
                        
                        {/* Item rows */}
                        {order.items?.map((item: any, i: number) => (
                          <motion.tr
                            key={`item-${index}-${i}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-slate-50/30 dark:bg-slate-900/20 border-l-2 border-l-purple-500/30 hover:bg-purple-500/5 transition-colors"
                          >
                            <td className="px-6 py-3"></td>
                            <td className="px-6 py-3 text-[10px] font-black text-slate-400">ITEM {i + 1}</td>
                            <td className="px-6 py-3">
                               <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 flex items-center justify-center font-bold text-slate-400 text-[10px] border border-slate-100 dark:border-white/5">
                                  {item.ref}
                               </div>
                            </td>
                            <td className="px-6 py-3 min-w-[200px]">
                               <div className="flex flex-col">
                                  <span className="font-black text-slate-900 dark:text-white text-[11px]">{item.designacao || 'Unknown'}</span>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase">Quantidade: {item.quantidade || 1}</span>
                               </div>
                            </td>
                            <td className="px-6 py-3"></td> {/* Portes space */}
                            <td className="px-6 py-3"></td> {/* Descontos space */}
                            <td className="px-6 py-3 text-right">
                               <div className="flex flex-col justify-end">
                                  <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-0.5">Preço Un.</span>
                                  <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">{formatCurrency(Number(item.pvp))}</span>
                               </div>
                            </td>
                            <td className="px-6 py-3 text-right">
                               <div className="flex flex-col justify-end">
                                  <span className="text-[8px] font-black text-emerald-400 uppercase leading-none mb-0.5 whitespace-nowrap">Lucro Item</span>
                                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-[11px]">{formatCurrency(Number(item.lucro))}</span>
                               </div>
                            </td>
                            <td colSpan={6} className="px-6 py-3"></td> {/* Remaining columns */}
                          </motion.tr>
                        ))}
                        
                        {/* Spacing bottom row */}
                        <tr className="h-4 bg-transparent"><td colSpan={14}></td></tr>
                      </>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
          
          {filteredItems.length === 0 && (
            <div className="p-20 text-center space-y-4">
               <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
                 <Search className="w-8 h-8 text-slate-400" />
               </div>
               <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Nenhuma encomenda encontrada</p>
            </div>
          )}
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-3 text-[10px] text-slate-500 font-black uppercase tracking-widest text-center border-t border-slate-100 dark:border-slate-800">
           Exibindo {filteredItems.length} encomendas
        </div>
      </div>
    </motion.div>
  );
}
