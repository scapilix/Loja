import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Plus, Minus, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Column {
  header: string;
  accessor: string;
  render?: (val: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  title: string;
}

export const DataTable: React.FC<DataTableProps> = ({ columns, data, title }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const itemsPerPage = 8;

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const toggleRow = (idx: number) => {
    setExpandedRows(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const formatCurrency = (val: number) => 
    val?.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' }) || '0,00 €'

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-3xl border border-white/50 dark:border-white/10 shadow-2xl transition-all duration-500 flex flex-col h-full">
      <div className="p-8 border-b border-slate-200/60 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1.5">Registo em Tempo Real</p>
        </div>
        <div className="relative w-full sm:w-80 group">
          <div className="relative flex items-center bg-white/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden transition-all duration-300 focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500/30">
            <Search className="ml-4 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Pesquisar registos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent py-3 px-3 text-sm text-slate-900 dark:text-white focus:outline-none font-medium placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 dark:bg-white/[0.02] sticky top-0 z-10 backdrop-blur-md">
            <tr>
              <th className="w-12 px-8 py-6"></th>
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] border-b border-slate-200 dark:border-white/5">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {paginatedData.map((row, idx) => (
              <React.Fragment key={idx}>
                <tr 
                  className={`hover:bg-purple-500/5 transition-all duration-300 group cursor-pointer ${expandedRows[idx] ? 'bg-purple-500/[0.03]' : ''}`} 
                  onClick={() => toggleRow(idx)}
                >
                  <td className="px-8 py-6">
                    {row.items && row.items.length > 0 && (
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 ${expandedRows[idx] ? 'bg-purple-600 text-white glow-primary' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white border border-slate-200 dark:border-white/10 group-hover:border-purple-500/50 group-hover:text-purple-500'}`}>
                        {expandedRows[idx] ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </div>
                    )}
                  </td>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="px-6 py-6 text-sm text-slate-700 dark:text-slate-300 font-bold tracking-tight">
                      {col.render ? col.render(row[col.accessor]) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
                <AnimatePresence>
                  {expandedRows[idx] && row.items && (
                    <tr>
                      <td colSpan={columns.length + 1} className="p-0 bg-slate-50/[0.02] dark:bg-white/[0.01]">
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.5, ease: "circOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-24 py-12 space-y-8">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                <Package className="w-5 h-5 text-purple-500" />
                              </div>
                              <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Associated Line Items</h4>
                            </div>
                            <div className="grid grid-cols-4 gap-8">
                              {/* Item Headers */}
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Identification</div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Value</div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Profit</div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Execution Date</div>
                              
                              {row.items.map((item: any, iIdx: number) => (
                                <React.Fragment key={iIdx}>
                                  <div className="text-xs font-black text-slate-900 dark:text-white bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">{item.ref}</div>
                                  <div className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center tracking-tight">{formatCurrency(item.pvp)}</div>
                                  <div className="text-xs font-black text-emerald-500 flex items-center tracking-tight">{formatCurrency(item.lucro)}</div>
                                  <div className="text-xs font-medium text-slate-400 dark:text-slate-600 flex items-center italic">{item.localidade}</div>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 border-t border-slate-200/60 dark:border-white/5 flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          A ver <span className="text-slate-900 dark:text-white mx-1">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)}</span> de <span className="text-slate-900 dark:text-white">{filteredData.length}</span> Registos
        </span>
        <div className="flex gap-3">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-purple-600 hover:border-purple-500/30 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-purple-600 hover:border-purple-500/30 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
