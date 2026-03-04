import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Tag, 
  Pencil, 
  X, 
  Camera, 
  CheckCircle2, 
  Loader2,
  Trash2,
  Plus,
  Database,
  Expand
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { uploadToSupabase } from '../lib/upload';
import { ImageZoomModal } from '../components/Loja/ImageZoomModal';
import { supabase } from '../lib/supabase';

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
  categoria?: string;
}

export default function BaseItems() {
  const { data, isLoading, updateProduct, addProduct, deleteProduct, setData } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<ProductCatalogItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [zoomedProduct, setZoomedProduct] = useState<any>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  const [newItem, setNewItem] = useState<ProductCatalogItem>({
    ref: '',
    nome_artigo: '',
    pvp_cica: 0,
    base_price: 0,
    iva: 0.23,
    lucro_meu_faturado: 0,
    fornecedor: '',
    image_url: '',
    description: '',
    categoria: ''
  });
  
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

  const handleDelete = async (ref: string) => {
    if (!window.confirm(`Tem a certeza que deseja eliminar o item ${ref}?`)) return;
    
    try {
      await deleteProduct(ref);
    } catch (err) {
      alert('Erro ao eliminar produto');
    }
  };

  const handleMigrate = async () => {
    if (!window.confirm('Isto irá mover todos os itens do Excel para a base de dados centralizada. Continuar?')) return;
    
    setIsMigrating(true);
    try {
      const excelProducts = data.products_catalog || [];
      const currentManual = data.manual_products_catalog || [];
      
      // Merge Excel into Manual
      const merged = [...currentManual];
      excelProducts.forEach(ep => {
        if (!merged.find(mp => mp.ref === ep.ref)) {
          merged.push(ep);
        }
      });
      
      const { error } = await supabase
        .from('loja_app_state')
        .upsert({ key: 'manual_products_catalog', value: merged });

      if (error) throw error;
      
      setData(prev => ({ ...prev, manual_products_catalog: merged }));
      alert('Migração concluída com sucesso!');
    } catch (err) {
      console.error('Migration error:', err);
      alert('Erro durante a migração');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'edit' | 'new') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadToSupabase(file, 'loja_artigos');
      if (url) {
        if (target === 'edit') {
           setEditingItem(prev => prev ? ({ ...prev, image_url: url }) : null);
        } else {
           setNewItem(prev => ({ ...prev, image_url: url }));
        }
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.ref) return;

    try {
      setIsSubmitting(true);
      await addProduct(newItem);
      setIsAddingNew(false);
      setNewItem({
        ref: '',
        nome_artigo: '',
        pvp_cica: 0,
        base_price: 0,
        iva: 0.23,
        lucro_meu_faturado: 0,
        fornecedor: '',
        image_url: '',
        description: ''
      });
    } catch (err: any) {
      alert(err.message || 'Erro ao adicionar produto');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 pb-24"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-slate-950 dark:text-white tracking-tighter uppercase leading-none">Gestão de Itens</h1>
          <p className="text-[#827b14] font-black uppercase tracking-[0.3em] text-[10px]">Catálogo Centralizado ({products.length} ARTIGOS)</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#827b14] transition-colors" />
                <input 
                    type="text"
                    placeholder="PESQUISAR..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-6 py-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-none w-64 lg:w-80 focus:ring-0 outline-none text-[11px] font-black uppercase tracking-widest shadow-sm transition-all focus:border-[#827b14]"
                />
            </div>
            
            {(data.products_catalog?.length || 0) > 0 && (
              <button 
                onClick={handleMigrate}
                disabled={isMigrating}
                className="px-6 py-4 bg-[#827b14]/10 text-[#827b14] font-black uppercase tracking-widest text-[9px] hover:bg-[#827b14] hover:text-white transition-all flex items-center gap-2 border border-[#827b14]/20"
              >
                {isMigrating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                MIGRAR EXCEL
              </button>
            )}

            <button 
                onClick={() => setIsAddingNew(true)}
                className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[9px] hover:bg-[#827b14] dark:hover:bg-[#827b14] dark:hover:text-white transition-all flex items-center gap-2 shadow-2xl shadow-black/10"
            >
                <Plus className="w-4 h-4" /> NOVO ARTIGO
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F9F9F9] dark:bg-white/5 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100 dark:border-white/5">
              <tr>
                <th className="px-10 py-6">Informação do Artigo</th>
                <th className="px-6 py-6 text-right">Preço de Venda</th>
                <th className="px-6 py-6 text-right">Custo Base</th>
                <th className="px-6 py-6 text-right">Margem</th>
                <th className="px-6 py-6 text-right">IVA</th>
                <th className="px-10 py-6 text-right">Categoria</th>
                <th className="px-10 py-6 text-right">Fornecedor</th>
                <th className="px-10 py-6 text-center">Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {filteredProducts.slice(0, 100).map((product, index) => (
                <tr key={`${product.ref}-${index}`} className="group hover:bg-[#F9F9F9] dark:hover:bg-white/5 transition-colors">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-20 bg-slate-50 dark:bg-white/5 overflow-hidden border border-slate-100 dark:border-white/10 shrink-0 relative group/img">
                            {product.image_url ? (
                              <>
                                <img src={product.image_url} alt={product.nome_artigo} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" />
                                <button 
                                  onClick={() => setZoomedProduct(product)}
                                  className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white"
                                >
                                  <Expand className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-slate-300 uppercase tracking-tighter">NO IMG</div>
                            )}
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="font-black text-xs text-slate-950 dark:text-white uppercase tracking-tighter">{product.nome_artigo || '-'}</span>
                          <span className="font-black text-[9px] text-[#827b14] uppercase tracking-[0.2em]">
                            REF: {product.ref}
                          </span>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <span className="font-black text-sm text-slate-950 dark:text-white tracking-tighter">
                        {formatCurrency(product.pvp_cica)}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <span className="font-bold text-[11px] text-slate-400 uppercase tracking-widest">
                        {formatCurrency(product.base_price || 0)}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex flex-col items-end">
                        <span className="font-black text-xs text-[#827b14] tracking-tighter">
                            {formatCurrency(product.lucro_meu_faturado)}
                        </span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                     <span className="font-black text-[10px] text-slate-300">
                        {formatPercentage(product.iva)}
                     </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                     <span className="font-black text-[9px] uppercase tracking-widest text-[#827b14] bg-[#827b14]/5 px-2 py-1 rounded-sm">
                        {product.categoria || 'N/A'}
                     </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                     <span className="font-black text-[10px] uppercase tracking-[0.1em] text-slate-400">
                        {product.fornecedor || '-'}
                     </span>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => handleEdit(product)}
                          className="p-3 text-slate-400 hover:text-black dark:hover:text-white transition-all scale-90 group-hover:scale-100 group-hover:bg-white dark:group-hover:bg-white/10 shadow-xl"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.ref)}
                          className="p-3 text-slate-300 hover:text-rose-500 transition-all scale-90 group-hover:scale-100 group-hover:bg-white dark:group-hover:bg-white/10 shadow-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredProducts.length === 0 && (
           <div className="py-32 text-center space-y-4">
              <div className="w-20 h-20 bg-[#F9F9F9] dark:bg-white/5 flex items-center justify-center mx-auto">
                 <Tag className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Nenhum artigo encontrado no catálogo</p>
           </div>
        )}
      </div>

      {/* Modals Container */}
      <AnimatePresence>
        {(editingItem || isAddingNew) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="bg-white dark:bg-slate-950 w-full max-w-2xl shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden flex flex-col"
            >
              <div className="p-10 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                 <div className="flex flex-col">
                    <h2 className="text-3xl font-black text-slate-950 dark:text-white tracking-tighter uppercase leading-none">
                      {isAddingNew ? 'NOVO ARTIGO' : 'EDITAR ARTIGO'}
                    </h2>
                    <p className="text-[9px] font-black text-[#827b14] uppercase tracking-[0.35em] mt-3">
                      {isAddingNew ? 'INTRODUZA OS DADOS DO PRODUTO' : `REF: ${editingItem?.ref}`}
                    </p>
                 </div>
                 <button onClick={() => { setEditingItem(null); setIsAddingNew(false); }} className="p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-full transition-colors">
                    <X className="w-6 h-6 text-slate-300" />
                 </button>
              </div>
              
              <form onSubmit={isAddingNew ? handleAdd : handleUpdate} className="p-10 space-y-10 overflow-y-auto max-h-[75vh] custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Image Section */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">IMAGEM DO PRODUTO</label>
                        <div className="relative aspect-[3/4] bg-[#F9F9F9] dark:bg-white/5 border-2 border-dashed border-slate-100 dark:border-white/10 group cursor-pointer overflow-hidden">
                           {(isAddingNew ? newItem.image_url : editingItem?.image_url) ? (
                             <>
                               <img src={isAddingNew ? newItem.image_url : editingItem?.image_url} alt="Preview" className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" />
                               <button 
                                 type="button"
                                 onClick={() => isAddingNew ? setNewItem({...newItem, image_url: ''}) : setEditingItem(prev => prev ? ({ ...prev, image_url: '' }) : null)}
                                 className="absolute top-4 right-4 p-3 bg-black text-white shadow-2xl opacity-0 group-hover:opacity-100 transition-all"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </>
                           ) : (
                             <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                                {isUploading ? <Loader2 className="w-8 h-8 text-[#827b14] animate-spin" /> : <Camera className="w-6 h-6 text-slate-200" />}
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isUploading ? 'A CARREGAR...' : 'SELECIONAR FOTO'}</span>
                             </div>
                           )}
                           <input 
                             type="file" 
                             accept="image/*" 
                             onChange={(e) => handleFileUpload(e, isAddingNew ? 'new' : 'edit')}
                             disabled={isUploading}
                             className="absolute inset-0 opacity-0 cursor-pointer" 
                           />
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">REFERÊNCIA</label>
                            <input 
                              required
                              disabled={!isAddingNew}
                              type="text" 
                              value={isAddingNew ? newItem.ref : editingItem?.ref} 
                              onChange={(e) => isAddingNew ? setNewItem({ ...newItem, ref: e.target.value.toUpperCase() }) : null} 
                              className="w-full px-0 py-3 bg-transparent border-b-2 border-slate-100 dark:border-white/10 focus:border-[#827b14] outline-none transition-all font-black text-lg uppercase tracking-tight disabled:opacity-30" 
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">NOME DO ARTIGO</label>
                            <input 
                              required
                              type="text" 
                              value={isAddingNew ? newItem.nome_artigo : editingItem?.nome_artigo} 
                              onChange={(e) => isAddingNew ? setNewItem({ ...newItem, nome_artigo: e.target.value }) : setEditingItem(prev => prev ? ({ ...prev, nome_artigo: e.target.value }) : null)} 
                              className="w-full px-0 py-3 bg-transparent border-b-2 border-slate-100 dark:border-white/10 focus:border-[#827b14] outline-none transition-all font-black text-lg uppercase tracking-tight" 
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">PREÇO VENDA (EUR)</label>
                            <input 
                              required
                              type="number" 
                              step="0.01"
                              value={isAddingNew ? newItem.pvp_cica : editingItem?.pvp_cica} 
                              onChange={(e) => isAddingNew ? setNewItem({ ...newItem, pvp_cica: parseFloat(e.target.value) }) : setEditingItem(prev => prev ? ({ ...prev, pvp_cica: parseFloat(e.target.value) }) : null)} 
                              className="w-full px-0 py-3 bg-transparent border-b-2 border-slate-100 dark:border-white/10 focus:border-[#827b14] outline-none transition-all font-black text-lg uppercase tracking-tight" 
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">CATEGORIA</label>
                            <input 
                              type="text" 
                              placeholder="ex: Vestidos, Calças..."
                              value={isAddingNew ? newItem.categoria : editingItem?.categoria} 
                              onChange={(e) => isAddingNew ? setNewItem({ ...newItem, categoria: e.target.value }) : setEditingItem(prev => prev ? ({ ...prev, categoria: e.target.value }) : null)} 
                              className="w-full px-0 py-3 bg-transparent border-b-2 border-slate-100 dark:border-white/10 focus:border-[#827b14] outline-none transition-all font-black text-lg uppercase tracking-tight" 
                            />
                        </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">CUSTO BASE</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={isAddingNew ? newItem.base_price : editingItem?.base_price} 
                          onChange={(e) => isAddingNew ? setNewItem({ ...newItem, base_price: parseFloat(e.target.value) }) : setEditingItem(prev => prev ? ({ ...prev, base_price: parseFloat(e.target.value) }) : null)} 
                          className="w-full px-0 py-3 bg-transparent border-b-2 border-slate-100 dark:border-white/10 focus:border-[#827b14] outline-none transition-all font-bold text-base" 
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">LUCRO ESTIMADO</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={isAddingNew ? newItem.lucro_meu_faturado : editingItem?.lucro_meu_faturado} 
                          onChange={(e) => isAddingNew ? setNewItem({ ...newItem, lucro_meu_faturado: parseFloat(e.target.value) }) : setEditingItem(prev => prev ? ({ ...prev, lucro_meu_faturado: parseFloat(e.target.value) }) : null)} 
                          className="w-full px-0 py-3 bg-transparent border-b-2 border-slate-100 dark:border-white/10 focus:border-[#827b14] outline-none transition-all font-bold text-base text-[#827b14]" 
                        />
                    </div>
                 </div>

                 <div className="pt-6 flex gap-4">
                    <button 
                      type="button"
                      onClick={() => { setEditingItem(null); setIsAddingNew(false); }}
                      className="flex-1 py-5 bg-[#F9F9F9] dark:bg-white/5 text-slate-400 font-black uppercase tracking-[0.25em] text-[10px] hover:bg-slate-100 transition-all"
                    >
                      CANCELAR
                    </button>
                    <button 
                      disabled={isSubmitting || isUploading}
                      type="submit"
                      className="flex-[2] py-5 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:bg-[#827b14] dark:hover:bg-[#827b14] dark:hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {isSubmitting ? 'A GUARDAR...' : 'CONFIRMAR'}
                    </button>
                 </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ImageZoomModal 
        isOpen={!!zoomedProduct}
        onClose={() => setZoomedProduct(null)}
        imageUrl={zoomedProduct?.image_url || ''}
        productName={zoomedProduct?.nome_artigo || ''}
      />
    </motion.div>
  );
}
