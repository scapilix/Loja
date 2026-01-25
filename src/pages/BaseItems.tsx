import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Tag, TrendingUp, AlertCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export default function BaseItems() {
  const { data, isLoading } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Assuming products_catalog is available from transform_excel (Valores Original)
  const products = data.products_catalog || [];
  
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(p => 
      (p.nome_artigo && p.nome_artigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.ref && p.ref.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  const formatCurrency = (val: number) => {
    if (val === undefined || val === null) return '-';
    // Remove "€" and clean string if it comes as string
    const num = typeof val === 'string' ? parseFloat(String(val).replace(/[^0-9.-]+/g, "")) : val;
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(num);
  };

  const formatPercentage = (val: number) => {
    if (val === undefined || val === null) return '-';
     const num = typeof val === 'string' ? parseFloat(String(val).replace(/[^0-9.-]+/g, "")) : val;
    return new Intl.NumberFormat('pt-PT', { style: 'percent', minimumFractionDigits: 1 }).format(num);
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
                <th className="px-8 py-5">Referência</th>
                <th className="px-4 py-5">Nome do Artigo</th>
                <th className="px-4 py-5 text-right text-emerald-600 dark:text-emerald-400">PVP (c/ IVA)</th>
                <th className="px-4 py-5 text-right text-slate-600 dark:text-slate-400">Preço Base</th>
                <th className="px-4 py-5 text-right text-orange-600 dark:text-orange-400">Lucro</th>
                <th className="px-8 py-5 text-right">IVA</th>
                <th className="px-8 py-5 text-right">Fornecedor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {filteredProducts.slice(0, 200).map((product, index) => (
                <tr key={`${product.ref}-${index}`} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                            <Tag className="w-4 h-4 text-slate-400" />
                        </div>
                        <span className="font-black text-xs text-slate-900 dark:text-white uppercase">{product.ref}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                     <span className="font-bold text-sm text-slate-700 dark:text-slate-300 capitalize">
                        {product.nome_artigo ? product.nome_artigo.toLowerCase() : '-'}
                     </span>
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
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-8 py-12 text-center text-slate-400">
                        Nenhum item encontrado para "{searchTerm}"
                    </td>
                </tr>
              )}
            </tbody>
          </table>
          {filteredProducts.length > 200 && (
             <div className="p-4 text-center text-xs font-bold text-slate-400 border-t border-slate-100 dark:border-white/5">
                A mostrar os primeiros 200 resultados de {filteredProducts.length}
             </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
