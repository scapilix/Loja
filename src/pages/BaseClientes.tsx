import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Search, Instagram, Mail, Phone, MapPin, ShoppingBag, Clock, Calendar, ChevronsRight } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useFilters } from '../contexts/FilterContext';
import { SmartDateFilter } from '../components/SmartDateFilter';
import { useState } from 'react';
import { createPortal } from 'react-dom';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export default function BaseClientes() {
  const { filters, setFilters } = useFilters();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const {
    allCustomers,
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

  // Filter based on search term
  const displayedCustomers = allCustomers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    customer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.instagram.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Base de Clientes
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            Gestão completa de base de dados ({allCustomers.length} clientes)
          </p>
        </div>

        <div className="flex-1 w-full md:w-auto max-w-md relative">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <Search className="h-4 w-4 text-slate-400" />
           </div>
           <input
             type="text"
             className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition duration-150 ease-in-out text-xs"
             placeholder="Buscar por nome, instagram, email..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="relative z-40 flex flex-wrap items-center gap-4 bg-white/50 dark:bg-slate-800/40 p-2 rounded-2xl border border-purple-100 dark:border-purple-800/20 backdrop-blur-xl">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-white/5 rounded-xl">
          <Filter className="w-3 h-3 text-purple-600 dark:text-purple-400" />
          <span className="text-[10px] font-black text-purple-900 dark:text-purple-300 uppercase tracking-wider">Filtros</span>
        </div>
        
        <div className="scale-90 origin-left">
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
            className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300"
          >
            <X className="w-3 h-3" />
            Limpar
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="glass overflow-hidden rounded-2xl border-purple-100 dark:border-purple-800/20">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
          <table className="min-w-full text-left text-xs whitespace-nowrap">
            <thead className="sticky top-0 z-10 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold shadow-sm">
              <tr>
                <th scope="col" className="px-4 py-3">Cliente</th>
                <th scope="col" className="px-4 py-3">Instagram</th>
                <th scope="col" className="px-4 py-3">Morada</th>
                <th scope="col" className="px-4 py-3">Contactos</th>
                <th scope="col" className="px-4 py-3 text-right">Vendas</th>
                <th scope="col" className="px-4 py-3 text-right">Total</th>
                <th scope="col" className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {displayedCustomers.map((customer, index) => (
                <tr 
                  key={index} 
                  onClick={() => setSelectedCustomer(customer)}
                  className="hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors duration-150 cursor-pointer group"
                  >
                  <td className="px-4 py-2 relative">
                    <div className="flex items-center gap-2">
                        {/* Status Indicator */}
                       <div className={`w-1 h-8 absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full transition-all duration-300 ${
                           customer.orders > 5 ? 'bg-purple-500 h-10' : 
                           customer.orders > 2 ? 'bg-blue-400 h-6' : 
                           'bg-slate-300 h-4'
                       } opacity-0 group-hover:opacity-100`} />
                       
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                        {customer.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]" title={customer.name}>
                        {customer.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                        {customer.instagram !== 'N/A' ? (
                            <>
                                <Instagram className="w-3 h-3 text-pink-500" />
                                <span className="truncate max-w-[120px]">{customer.instagram}</span>
                            </>
                        ) : (
                            <span className="text-slate-400 text-[10px] italic">--</span>
                        )}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 max-w-[200px] truncate" title={customer.address}>
                        <MapPin className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                        <span>{customer.address}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                     <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400" title={customer.email}>
                           <Mail className="w-3 h-3 flex-shrink-0" />
                           <span className="truncate max-w-[150px]">{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                           <Phone className="w-3 h-3 flex-shrink-0" />
                           <span>{customer.phone}</span>
                        </div>
                     </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                        <ShoppingBag className="w-3 h-3" />
                        {customer.orders}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-slate-900 dark:text-white">
                    {formatCurrency(customer.revenue)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button className="text-xs font-semibold text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors">
                        Ver <ChevronsRight className="w-3 h-3 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {displayedCustomers.length === 0 && (
             <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                Nenhum cliente encontrado.
             </div>
          )}
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 text-[10px] text-slate-500 text-center border-t border-slate-200 dark:border-slate-700">
            Mostrando {displayedCustomers.length} de {allCustomers.length} clientes
        </div>
      </div>

      {/* Customer Details Modal (Drawer) - Rendered via Portal */}
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
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{selectedCustomer.name}</h2>
                                <p className="text-slate-500 text-sm">Histórico de Relacionamento</p>
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
                                <div className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(selectedCustomer.revenue)}</div>
                            </div>
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/20">
                                <div className="text-blue-600 dark:text-blue-400 font-bold text-xs uppercase mb-1">Compras</div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">{selectedCustomer.orders}</div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="space-y-6">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Histórico de Pedidos
                            </h3>
                            
                            <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-8 pl-6 pb-2">
                                {selectedCustomer.history.map((order: any, i: number) => (
                                    <div key={i} className="relative">
                                        <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 bg-purple-500" />
                                        
                                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(order.data_venda)}
                                                </span>
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(Number(order.pvp))}
                                                </span>
                                            </div>
                                            
                                            <div className="text-xs text-slate-500 mb-2 font-mono">
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
