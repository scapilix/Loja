import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Tag, 
  TrendingUp, 
  AlertCircle, 
  Pencil, 
  X, 
  Camera, 
  CheckCircle2, 
  Loader2,
  Trash2
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { uploadToSupabase } from '../lib/upload';

interface ProductCatalogItem {
  ref: string;
  nome_artigo: string;
  pvp_cica: number;
  base_price?: number;
  iva: number;
  lucro_meu_faturado: number;
  fornecedor: string;
  image_url?: string;
  description?: string;
}

export default function BaseItems() {
  const { data, isLoading, updateProduct } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<ProductCatalogItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Combine catalogs and handle overrides
  const products = useMemo(() => {
    const excelProducts = data.products_catalog || [];
    const manualProducts = data.manual_products_catalog || [];
    
    // Create a map by ref, manual takes precedence
    const productMap = new Map<string, ProductCatalogItem>();
    excelProducts.forEach(p => productMap.set(p.ref, p));
    manualProducts.forEach(p => productMap.set(p.ref, { ...productMap.get(p.ref), ...p }));
    
    return Array.from(productMap.values());
  }, [data.products_catalog, data.manual_products_catalog]);
  
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(p => 
      (p.nome_artigo && p.nome_artigo.toLowerCase().includes(term)) ||
      (p.ref && p.ref.toString().toLowerCase().includes(term))
    );
  }, [products, searchTerm]);

  const formatCurrency = (val: number) => {
    if (val === undefined || val === null) return '-';
    const num = typeof val === 'string' ? parseFloat(String(val).replace(/[^0-9.-]+/g, "")) : val;
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(num);
  };

  const formatPercentage = (val: number) => {
    if (val === undefined || val === null) return '-';
    const num = typeof val === 'string' ? parseFloat(String(val).replace(/[^0-9.-]+/g, "")) : val;
    return new Intl.NumberFormat('pt-PT', { style: 'percent', minimumFractionDigits: 1 }).format(num);
  };

  const handleEdit = (product: ProductCatalogItem) => {
    setEditingItem({ ...product });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;

    try {
      setIsUploading(true);
      const url = await uploadToSupabase(file, 'loja_artigos');
      if (url) {
        setEditingItem(prev => prev ? ({ ...prev, image_url: url }) : null);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erro ao carregar imagem');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setIsSubmitting(true);
      await updateProduct(editingItem.ref, editingItem);
      setEditingItem(null);
    } catch (err) {
      alert('Erro ao atualizar produto');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (products.length === 0) {
     return (
        <div className="flex flex-col items-center justify-center h-96 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-slate-400" />
            </div>
            <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Sem dados de catálogo</h3>
                <p className="text-slate-500 font-medium text-sm mt-1">
                    Verifique se a aba "Valores Original" existe no Excel e importe novamente.
                </p>
            </div>
        </div>
     );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter">Base de Itens</h1>
          <p className="text-slate-700 dark:text-slate-200 font-bold">Catálogo mestre de produtos ({products.length} itens)</p>
        </div>

        <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
            <input 
                type="text"
                placeholder="Procurar por nome, ref..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-64 lg:w-96 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold shadow-sm transition-all"
            />
        </div>
      </div>

      <div className="glass rounded-[2.5rem] overflow-hidden border-slate-100 dark:border-white/5 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <tr>
                <th className="px-8 py-5">Item</th>
                <th className="px-4 py-5 text-right text-emerald-600 dark:text-emerald-400">PVP (c/ IVA)</th>
                <th className="px-4 py-5 text-right text-slate-600 dark:text-slate-400">Preço Base</th>
                <th className="px-4 py-5 text-right text-orange-600 dark:text-orange-400">Lucro</th>
                <th className="px-8 py-5 text-right">IVA</th>
                <th className="px-8 py-5 text-right">Fornecedor</th>
                <th className="px-8 py-5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {filteredProducts.slice(0, 200).map((product, index) => (
                <tr key={`${product.ref}-${index}`} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-white/10">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.nome_artigo} className="w-full h-full object-cover" />
                            ) : (
                              <Tag className="w-5 h-5 text-slate-400" />
                            )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-tight">{product.ref}</span>
                          <span className="font-bold text-[11px] text-slate-500 capitalize line-clamp-1 max-w-[200px]">
                            {product.nome_artigo ? product.nome_artigo.toLowerCase() : '-'}
                          </span>
                        </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
                        {formatCurrency(product.pvp_cica)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-bold text-sm text-slate-500 dark:text-slate-400">
                        {formatCurrency(product.base_price || 0)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                        <TrendingUp className="w-3 h-3 text-orange-500" />
                        <span className="font-bold text-sm text-orange-600 dark:text-orange-400">
                            {formatCurrency(product.lucro_meu_faturado)}
                        </span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-right">
                     <span className="font-bold text-xs text-slate-500">
                        {formatPercentage(product.iva)}
                     </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                     <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
                        {product.fornecedor || '-'}
                     </span>
                  </td>
                  <td className="px-8 py-4 text-center">
                    <button 
                      onClick={() => handleEdit(product)}
                      className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/40">
                      <Tag className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-950 dark:text-white tracking-tighter uppercase">Editar Artigo</h2>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{editingItem.ref}</p>
                    </div>
                 </div>
                 <button onClick={() => setEditingItem(null)} className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-colors">
                    <X className="w-6 h-6 text-slate-400" />
                 </button>
              </div>
              
              <form onSubmit={handleUpdate} className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Image Section */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Foto do Artigo</label>
                        <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 group">
                           {editingItem.image_url ? (
                             <>
                               <img src={editingItem.image_url} alt="Preview" className="w-full h-full object-cover" />
                               <button 
                                 type="button"
                                 onClick={() => setEditingItem(prev => prev ? ({ ...prev, image_url: '' }) : null)}
                                 className="absolute top-4 right-4 p-2 bg-rose-500 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </>
                           ) : (
                             <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                {isUploading ? <Loader2 className="w-8 h-8 text-purple-600 animate-spin" /> : <Camera className="w-8 h-8 text-slate-400" />}
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{isUploading ? 'A Carregar...' : 'Carregar Foto'}</span>
                             </div>
                           )}
                           <input 
                             type="file" 
                             accept="image/*" 
                             onChange={handleFileUpload}
                             disabled={isUploading}
                             className="absolute inset-0 opacity-0 cursor-pointer" 
                           />
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Artigo</label>
                            <input 
                              required
                              type="text" 
                              value={editingItem.nome_artigo} 
                              onChange={(e) => setEditingItem({ ...editingItem, nome_artigo: e.target.value })} 
                              className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PVP (c/ IVA)</label>
                            <input 
                              required
                              type="number" 
                              step="0.01"
                              value={editingItem.pvp_cica} 
                              onChange={(e) => setEditingItem({ ...editingItem, pvp_cica: parseFloat(e.target.value) })} 
                              className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                            <textarea 
                              rows={3}
                              value={editingItem.description || ''} 
                              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} 
                              placeholder="Opcional..."
                              className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold resize-none" 
                            />
                        </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-white/10">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço Base</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={editingItem.base_price || 0} 
                          onChange={(e) => setEditingItem({ ...editingItem, base_price: parseFloat(e.target.value) })} 
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold opacity-70" 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lucro Meu</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={editingItem.lucro_meu_faturado || 0} 
                          onChange={(e) => setEditingItem({ ...editingItem, lucro_meu_faturado: parseFloat(e.target.value) })} 
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold opacity-70" 
                        />
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setEditingItem(null)}
                      className="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      disabled={isSubmitting || isUploading}
                      type="submit"
                      className="flex-[2] py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-purple-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      {isSubmitting ? 'A Guardar...' : 'Guardar Alterações'}
                    </button>
                 </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
