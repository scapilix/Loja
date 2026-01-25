import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Search, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2,
  X,
  History
} from 'lucide-react';
import { useStockLogic, StockStatus } from '../hooks/useStockLogic';
import { useData } from '../contexts/DataContext';

export default function StockManager() {
  const stockInventory = useStockLogic();
  const { addPurchase, data } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    ref: '',
    quantidade: 1,
    data_compra: new Date().toISOString().split('T')[0],
    fornecedor: '',
    preco_custo: ''
  });

  const filteredStock = stockInventory.filter(item => 
    item.ref.includes(searchTerm.toUpperCase()) || 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ref || formData.quantidade <= 0) return;

    try {
      setIsSubmitting(true);
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
        preco_custo: ''
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

      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-3xl border-slate-100 dark:border-white/5 flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Package className="w-6 h-6" />
             </div>
             <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Itens</p>
                <h3 className="text-2xl font-black text-slate-950 dark:text-white">{stockInventory.length}</h3>
             </div>
        </div>
        <div className="glass p-6 rounded-3xl border-slate-100 dark:border-white/5 flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-6 h-6" />
             </div>
             <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Sem Stock</p>
                <h3 className="text-2xl font-black text-slate-950 dark:text-white">
                    {stockInventory.filter(i => i.status === 'out').length}
                </h3>
             </div>
        </div>
        <div className="glass p-6 rounded-3xl border-slate-100 dark:border-white/5 flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <TrendingDown className="w-6 h-6" />
             </div>
             <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Critico</p>
                <h3 className="text-2xl font-black text-slate-950 dark:text-white">
                    {stockInventory.filter(i => i.status === 'critical').length}
                </h3>
             </div>
        </div>
        <div className="glass p-6 rounded-3xl border-slate-100 dark:border-white/5 flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <History className="w-6 h-6" />
             </div>
             <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Movimentos</p>
                <h3 className="text-2xl font-black text-slate-950 dark:text-white">
                    {data.purchases?.length || 0}
                </h3>
             </div>
        </div>
      </div>

      <div className="glass rounded-[2.5rem] overflow-hidden border-slate-100 dark:border-white/5 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <tr>
                <th className="px-8 py-5">Item</th>
                <th className="px-4 py-5 text-center">Estado</th>
                <th className="px-4 py-5 text-right text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/5">Comprado</th>
                <th className="px-4 py-5 text-right text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-900/5">Vendido</th>
                <th className="px-4 py-5 text-right font-black">Stock Atual</th>
                <th className="px-4 py-5 text-right">Última Compra</th>
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
                  <td className="px-4 py-4 text-right bg-emerald-50/30 dark:bg-emerald-900/5">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{item.total_purchased}</span>
                  </td>
                  <td className="px-4 py-4 text-right bg-rose-50/30 dark:bg-rose-900/5">
                    <span className="font-bold text-rose-600 dark:text-rose-400">{item.total_sold}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className={`text-lg font-black ${item.current_stock <= 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                        {item.current_stock}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-xs text-slate-500 font-bold">
                    {item.last_purchase_date ? new Date(item.last_purchase_date).toLocaleDateString() : '-'}
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
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Referência</label>
                    <input 
                        type="text" 
                        required 
                        value={formData.ref} 
                        onChange={(e) => setFormData({...formData, ref: e.target.value})} 
                        className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold uppercase"
                        placeholder="Ex: REF123"
                    />
                 </div>
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
