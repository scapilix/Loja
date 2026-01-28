import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  TrendingDown, 
  TrendingUp,
  AlertTriangle, 
  CheckCircle2,
  X,
  Coins,
  Wallet,
  Banknote,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useStockLogic, StockStatus } from '../hooks/useStockLogic';
import { useData } from '../contexts/DataContext';

export default function StockManager() {
  const stockInventory = useStockLogic();
  const { addPurchase, addProduct } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Financial Calculations
  const stockFinancials = useMemo(() => {
    let totalStockValueBase = 0; // Total Cost of goods in stock
    let totalStockValuePVP = 0;  // Potential Revenue
    let totalPotentialProfit = 0; // Potential Profit

    stockInventory.forEach(item => {
      // Only count positive stock for valuation
      if (item.current_stock > 0) {
        totalStockValueBase += (item.base_price || 0) * item.current_stock;
        totalStockValuePVP += (item.pvp || 0) * item.current_stock;
        totalPotentialProfit += (item.profit || 0) * item.current_stock;
      }
    });

    return { totalStockValueBase, totalStockValuePVP, totalPotentialProfit };
  }, [stockInventory]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val);
  };

  const [formData, setFormData] = useState({
    ref: '',
    quantidade: 1,
    data_compra: new Date().toISOString().split('T')[0],
    fornecedor: '',
    preco_custo: '',
    nome_artigo: '',
    pvp: ''
  });

  const isNewItem = useMemo(() => {
    if (!formData.ref || formData.ref.length < 2) return false;
    // Check if ref exists in inventory
    const exists = stockInventory.find(item => item.ref === formData.ref);
    return !exists;
  }, [formData.ref, stockInventory]);

  const projectedProfit = useMemo(() => {
    if (!formData.pvp || !formData.preco_custo) return null;
    return Number(formData.pvp) - Number(formData.preco_custo);
  }, [formData.pvp, formData.preco_custo]);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: keyof StockStatus | 'profit_unit'; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: keyof StockStatus | 'profit_unit') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredStock = useMemo(() => {
    let result = stockInventory.filter(item => 
      (item.ref || '').includes(searchTerm.toUpperCase()) || 
      (item.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig) {
      result.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof StockStatus];
        let bValue: any = b[sortConfig.key as keyof StockStatus];
        
        // Handle undefined values
        if (aValue === undefined) aValue = -Infinity;
        if (bValue === undefined) bValue = -Infinity;
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [stockInventory, searchTerm, sortConfig]);

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ref || formData.quantidade <= 0) return;

    try {
      setIsSubmitting(true);
      
      // If new item, register it first
      if (isNewItem) {
        if (!formData.nome_artigo || !formData.pvp) {
          alert('Por favor preencha os dados do novo artigo (Nome e PVP).');
          setIsSubmitting(false);
          return;
        }

        await addProduct({
          ref: formData.ref,
          nome_artigo: formData.nome_artigo,
          pvp_cica: Number(formData.pvp),
          base_price: Number(formData.preco_custo),
          iva: 0.23, // Defaulting to 23% for now or 0
          lucro_meu_faturado: (Number(formData.pvp) - Number(formData.preco_custo)),
          fornecedor: formData.fornecedor || 'Desconhecido'
        });
      }
      
      await addPurchase({
        ref: formData.ref,
        quantidade: Number(formData.quantidade),
        data_compra: formData.data_compra,
        fornecedor: formData.fornecedor,
        preco_custo: formData.preco_custo ? Number(formData.preco_custo) : undefined
      });
      setIsAddModalOpen(false);
      setFormData({
        ref: '',
        quantidade: 1,
        data_compra: new Date().toISOString().split('T')[0],
        fornecedor: '',
        preco_custo: '',
        nome_artigo: '',
        pvp: ''
      });
    } catch (error) {
      alert('Erro ao registar compra. Verifique a consola.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to pre-fill form when clicking "Add Stock" on an item
  const openAddForRef = (ref: string, supplier?: string) => {
    setFormData(prev => ({ ...prev, ref, fornecedor: supplier || '' }));
    setIsAddModalOpen(true);
  };

  const getStatusColor = (status: StockStatus['status']) => {
    switch (status) {
      case 'out': return 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 border-rose-200 dark:border-rose-900';
      case 'critical': return 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-900';
      case 'low': return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-900';
      default: return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900';
    }
  };

  const getStatusIcon = (status: StockStatus['status']) => {
    switch (status) {
      case 'out': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <TrendingDown className="w-4 h-4" />;
      case 'low': return <TrendingDown className="w-4 h-4" />;
      default: return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter">Stock Inteligente</h1>
          <p className="text-slate-700 dark:text-slate-200 font-bold">Gestão dinâmica baseada em compras e vendas</p>
        </div>

        <div className="flex items-center gap-3">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                <input 
                    type="text"
                    placeholder="Procurar item..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-64 lg:w-80 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold shadow-sm transition-all"
                />
            </div>
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-3 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-purple-500/20 active:scale-95"
            >
                <Plus className="w-4 h-4" />
                Registar Compra
            </button>
        </div>
      </div>

      {/* Financial Summary & KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Stock Value (Cost) */}
        <div className="glass p-6 rounded-3xl border-slate-100 dark:border-white/5 flex items-center gap-4 relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 z-10">
                <Wallet className="w-6 h-6" />
             </div>
             <div className="z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor em Stock (Custo)</p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {formatCurrency(stockFinancials.totalStockValueBase)}
                </h3>
             </div>
        </div>

        {/* Potential Revenue */}
        <div className="glass p-6 rounded-3xl border-slate-100 dark:border-white/5 flex items-center gap-4 relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 z-10">
                <Banknote className="w-6 h-6" />
             </div>
             <div className="z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Potencial Venda</p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {formatCurrency(stockFinancials.totalStockValuePVP)}
                </h3>
             </div>
        </div>

        {/* Potential Profit */}
        <div className="glass p-6 rounded-3xl border-slate-100 dark:border-white/5 flex items-center gap-4 relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 z-10">
                <Coins className="w-6 h-6" />
             </div>
             <div className="z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lucro Previsto</p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {formatCurrency(stockFinancials.totalPotentialProfit)}
                </h3>
             </div>
        </div>

        {/* Stock Alerts (Combined) */}
        <div className="glass p-6 rounded-3xl border-slate-100 dark:border-white/5 flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atenção</p>
                <div className="flex gap-3 text-xs font-bold mt-1">
                    <span className="text-rose-500">{stockInventory.filter(i => i.status === 'out').length} Esgotados</span>
                    <span className="text-orange-500">{stockInventory.filter(i => i.status === 'critical').length} Críticos</span>
                </div>
             </div>
        </div>

      </div>

      <div className="glass rounded-[2.5rem] overflow-hidden border-slate-100 dark:border-white/5 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <tr>
                <th 
                  className="px-8 py-5 cursor-pointer hover:bg-white/5 transition-colors group"
                  onClick={() => handleSort('ref')}
                >
                  <div className="flex items-center gap-2">
                    Item
                    {sortConfig?.key === 'ref' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-purple-500" /> : <ArrowDown className="w-3 h-3 text-purple-500" />
                    ) : <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </div>
                </th>
                <th 
                    className="px-4 py-5 text-center cursor-pointer hover:bg-white/5 transition-colors group"
                    onClick={() => handleSort('status')}
                >
                    <div className="flex items-center justify-center gap-2">
                        Estado
                        {sortConfig?.key === 'status' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-purple-500" /> : <ArrowDown className="w-3 h-3 text-purple-500" />
                        ) : <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </div>
                </th>
                <th 
                    className="px-4 py-5 text-right font-black cursor-pointer hover:bg-white/5 transition-colors group"
                    onClick={() => handleSort('current_stock')}
                >
                    <div className="flex items-center justify-end gap-2">
                        Stock Atual
                        {sortConfig?.key === 'current_stock' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-purple-500" /> : <ArrowDown className="w-3 h-3 text-purple-500" />
                        ) : <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </div>
                </th>
                <th 
                    className="px-4 py-5 text-right text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-white/5 transition-colors group"
                    onClick={() => handleSort('base_price')}
                >
                    <div className="flex items-center justify-end gap-2">
                        Preço Base
                        {sortConfig?.key === 'base_price' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-purple-500" /> : <ArrowDown className="w-3 h-3 text-purple-500" />
                        ) : <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </div>
                </th>
                <th 
                    className="px-4 py-5 text-right text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-white/5 transition-colors group"
                    onClick={() => handleSort('pvp')}
                >
                    <div className="flex items-center justify-end gap-2">
                        PVP
                        {sortConfig?.key === 'pvp' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-purple-500" /> : <ArrowDown className="w-3 h-3 text-purple-500" />
                        ) : <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </div>
                </th>
                <th 
                    className="px-4 py-5 text-right text-purple-600 dark:text-purple-400 cursor-pointer hover:bg-white/5 transition-colors group"
                    onClick={() => handleSort('profit')}
                >
                    <div className="flex items-center justify-end gap-2">
                        Lucro Unit.
                        {sortConfig?.key === 'profit' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-purple-500" /> : <ArrowDown className="w-3 h-3 text-purple-500" />
                        ) : <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </div>
                </th>
                <th className="px-8 py-5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {filteredStock.slice(0, 50).map((item) => (
                <tr key={item.ref} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex flex-col">
                        <span className="font-black text-sm text-slate-900 dark:text-white">{item.ref}</span>
                        <span className="text-xs text-slate-500 font-medium truncate max-w-[200px]">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        <span className="text-[10px] font-black uppercase tracking-wider">
                            {item.status === 'out' ? 'Esgotado' : item.status === 'critical' ? 'Crítico' : item.status === 'low' ? 'Baixo' : 'OK'}
                        </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className={`text-lg font-black ${item.current_stock <= 0 ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        {item.current_stock}
                    </span>
                    {item.current_stock > 0 && item.total_purchased > 0 && (
                        <div className="text-[10px] text-slate-400 font-medium">
                            Comp: <span className="text-emerald-500">{item.total_purchased}</span> • Vend: <span className="text-rose-500">{item.total_sold}</span>
                        </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-medium text-sm text-slate-500 dark:text-slate-400">
                        {item.base_price ? formatCurrency(item.base_price) : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        {item.pvp ? formatCurrency(item.pvp) : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                        {item.profit && item.profit > 0 ? <TrendingUp className="w-3 h-3 text-purple-500" /> : null}
                        <span className="font-bold text-sm text-purple-600 dark:text-purple-400">
                            {item.profit ? formatCurrency(item.profit) : '-'}
                        </span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-center">
                    <button 
                        onClick={() => openAddForRef(item.ref, item.supplier)}
                        className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors"
                        title="Adicionar Stock"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

       {/* Add Purchase Modal */}
       <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-950 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex justify-between items-center">
                 <div>
                    <h2 className="text-xl font-black text-slate-950 dark:text-white tracking-tight">Registar Compra</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Entrada de material</p>
                 </div>
                 <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                 </button>
              </div>

              <form onSubmit={handleAddPurchase} className="p-8 space-y-6">
                 {/* Autocomplete for Reference */}
                 <div className="space-y-2 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Referência / Produto</label>
                    <input 
                        type="text" 
                        required 
                        value={formData.ref} 
                        onChange={(e) => setFormData({...formData, ref: e.target.value})} 
                        className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold uppercase transition-all"
                        placeholder="Comece a escrever para pesquisar..."
                        autoComplete="off"
                    />
                    
                    {/* Suggestions list */}
                    {formData.ref.length > 1 && !stockInventory.find(s => s.ref === formData.ref) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 z-50 max-h-60 overflow-y-auto">
                            {stockInventory
                                .filter(item => 
                                    item.ref.includes(formData.ref.toUpperCase()) || 
                                    (item.name || '').toLowerCase().includes(formData.ref.toLowerCase())
                                )
                                .slice(0, 5)
                                .map(suggestion => (
                                    <button
                                        key={suggestion.ref}
                                        type="button"
                                        onClick={() => setFormData({
                                            ...formData, 
                                            ref: suggestion.ref,
                                            fornecedor: suggestion.supplier || formData.fornecedor
                                        })}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 flex flex-col border-b border-slate-50 dark:border-white/5 last:border-0"
                                    >
                                        <span className="font-black text-xs text-slate-900 dark:text-white">{suggestion.ref}</span>
                                        <span className="text-[10px] text-slate-500 truncate">{suggestion.name}</span>
                                    </button>
                                ))
                            }
                        </div>
                    )}
                 </div>

                 <AnimatePresence>
                   {isNewItem && (
                     <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                     >
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-500/10">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white">
                                    <Plus className="w-3 h-3" />
                                </div>
                                <span className="font-black text-sm text-purple-700 dark:text-purple-300">Novo Artigo Detetado</span>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Artigo</label>
                                    <input 
                                        type="text" 
                                        required={isNewItem}
                                        value={formData.nome_artigo} 
                                        onChange={(e) => setFormData({...formData, nome_artigo: e.target.value})} 
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold"
                                        placeholder="Ex: Capa Silicone IPhone 15"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                   <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço Custo (€)</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            required={isNewItem}
                                            value={formData.preco_custo} 
                                            onChange={(e) => setFormData({...formData, preco_custo: e.target.value})} 
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold"
                                            placeholder="0.00"
                                        />
                                   </div>
                                   <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PVP Venda (€)</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            required={isNewItem}
                                            value={formData.pvp} 
                                            onChange={(e) => setFormData({...formData, pvp: e.target.value})} 
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold"
                                            placeholder="0.00"
                                        />
                                   </div>
                                </div>
                                
                                {projectedProfit !== null && (
                                    <div className="flex justify-between items-center px-3 py-2 bg-white/50 dark:bg-slate-900/50 rounded-xl">
                                        <span className="text-xs font-bold text-slate-500">Lucro Estimado:</span>
                                        <span className={`text-sm font-black ${projectedProfit > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {formatCurrency(projectedProfit)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                     </motion.div>
                   )}
                 </AnimatePresence>

                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantidade</label>
                        <input 
                            type="number" 
                            min="1"
                            required 
                            value={formData.quantidade} 
                            onChange={(e) => setFormData({...formData, quantidade: Number(e.target.value)})} 
                            className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                        <input 
                            type="date" 
                            required 
                            value={formData.data_compra} 
                            onChange={(e) => setFormData({...formData, data_compra: e.target.value})} 
                            className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold"
                        />
                     </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fornecedor (Opcional)</label>
                    <input 
                        type="text" 
                        value={formData.fornecedor} 
                        onChange={(e) => setFormData({...formData, fornecedor: e.target.value})} 
                        className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold"
                    />
                 </div>

                 <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
                 >
                    {isSubmitting ? 'A Guardar...' : 'Confirmar Entrada'}
                 </button>
              </form>
            </motion.div>
          </div>
        )}
       </AnimatePresence>
    </motion.div>
  );
}
