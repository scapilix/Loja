import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Search, 
  TrendingUp,
  AlertTriangle,
  History,
  RefreshCw,
  X,
  ArrowUpCircle,
  ArrowDownCircle,
  Edit3
} from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { supabase } from '../lib/supabase';
import { useData } from '../contexts/DataContext';

interface StockItem {
  id?: number;
  ref?: string;
  produto_nome: string;
  quantidade_atual: number;
  data_compra?: string;
  stock_minimo: number;
  preco_custo: number | null;
  preco_venda?: number | null;
  ultima_atualizacao: string;
  created_at?: string;
}

interface StockMovement {
  id?: number;
  produto_nome: string;
  tipo_movimento: 'ENTRADA' | 'SAIDA' | 'VENDA' | 'AJUSTE';
  quantidade: number;
  quantidade_anterior: number;
  quantidade_nova: number;
  motivo: string;
  data_movimento: string;
  referencia: string | null;
  created_at?: string;
}

const MOVEMENT_TYPES = [
  { value: 'ENTRADA', label: 'Entrada (Compra)', icon: ArrowUpCircle, color: 'emerald' },
  { value: 'SAIDA', label: 'Saída Manual', icon: ArrowDownCircle, color: 'rose' },
  { value: 'AJUSTE', label: 'Ajuste', icon: Edit3, color: 'blue' }
];

export default function Stock() {
  const { data } = useData();
  const orders = data?.orders || [];
  const productsFromData = data?.stock || [];
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  // const [editQuantity, setEditQuantity] = useState<number>(0); // Removed unused
  
  const [formData, setFormData] = useState({
    produto_nome: '',
    tipo_movimento: 'ENTRADA' as 'ENTRADA' | 'SAIDA' | 'AJUSTE',
    quantidade: 0,
    data_compra: new Date().toISOString().split('T')[0],  // Purchase date for ENTRADA
    motivo: '',
    data_movimento: new Date().toISOString().split('T')[0],
    referencia: '',
    preco_custo: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStock();
    fetchMovements();
    loadLastSyncDate();
  }, []);

  const loadLastSyncDate = () => {
    const lastSync = localStorage.getItem('stock_last_sync');
    if (lastSync) {
      setLastSyncDate(lastSync);
    }
  };

  const fetchStock = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('loja_stock')
        .select('*')
        .order('produto_nome');

      if (data && !error) {
        setStockItems(data);
      }
    } catch (err) {
      console.error('Error fetching stock:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('loja_stock_movimentos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (data && !error) {
        setMovements(data);
      }
    } catch (err) {
      console.error('Error fetching movements:', err);
    }
  };

  const syncWithSales = async () => {
    if (!orders || orders.length === 0) {
      alert('Nenhuma encomenda encontrada para sincronizar');
      return;
    }

    setIsSyncing(true);
    try {
      let syncedCount = 0;
      let skippedCount = 0;
      
      // Group sales by product and date
      const salesByProduct = new Map<string, Map<string, number>>();
      
      orders.forEach((order: any) => {
        const orderDate = order.data_encomenda;
        const productName = order.produto;
        
        if (!salesByProduct.has(productName)) {
          salesByProduct.set(productName, new Map());
        }
        const productSales = salesByProduct.get(productName)!;
        const currentQty = productSales.get(orderDate) || 0;
        productSales.set(orderDate, currentQty + order.quantidade);
      });

      // Process each product's sales
      for (const [productName, salesByDate] of salesByProduct.entries()) {
        // Sort dates chronologically
        const sortedDates = Array.from(salesByDate.keys()).sort();
        
        for (const saleDate of sortedDates) {
          const qtySold = salesByDate.get(saleDate)!;
          
          // Check if movement already exists
          const { data: existingMovement } = await supabase
            .from('loja_stock_movimentos')
            .select('*')
            .eq('produto_nome', productName)
            .eq('data_movimento', saleDate)
            .eq('tipo_movimento', 'VENDA')
            .single();

          if (existingMovement) continue; // Already synced

          // Get available stock PURCHASED BEFORE OR ON sale date (temporal logic)
          const { data: availableStock } = await supabase
            .from('loja_stock')
            .select('*')
            .eq('produto_nome', productName)
            .lte('data_compra', saleDate)  // ⭐ KEY: Purchase date <= Sale date
            .gt('quantidade_atual', 0)
            .order('data_compra', { ascending: true });  // FIFO

          if (!availableStock || availableStock.length === 0) {
            console.log(`⚠️ Venda ${saleDate}: Sem stock disponível para ${productName} (comprado antes)`);
            skippedCount++;
            continue;  // No stock purchased before this sale
          }

          let qtyRemaining = qtySold;
          let totalDeducted = 0;

          // Deduct from stock lots in FIFO order
          for (const lot of availableStock) {
            if (qtyRemaining <= 0) break;

            const qtyToDeduct = Math.min(lot.quantidade_atual, qtyRemaining);
            const newQty = lot.quantidade_atual - qtyToDeduct;

            // Update stock lot
            await supabase
              .from('loja_stock')
              .update({
                quantidade_atual: newQty,
                ultima_atualizacao: new Date().toISOString()
              })
              .eq('id', lot.id);

            qtyRemaining -= qtyToDeduct;
            totalDeducted += qtyToDeduct;
          }

          // Create movement record
          if (totalDeducted > 0) {
            await supabase
              .from('loja_stock_movimentos')
              .insert([{
                produto_nome: productName,
                tipo_movimento: 'VENDA',
                quantidade: totalDeducted,
                quantidade_anterior: 0,  // Will be updated in next version
                quantidade_nova: 0,      // Will be updated in next version
                motivo: `Venda automática via sincronização (${totalDeducted} de ${qtySold})`,
                data_movimento: saleDate,
                referencia: `AUTO_SYNC_${saleDate}`
              }]);

            syncedCount++;
          }

          if (qtyRemaining > 0) {
            console.log(`⚠️ Venda ${saleDate}: ${qtyRemaining} unidades de ${productName} não tinham stock`);
          }
        }
      }

      const syncTimestamp = new Date().toISOString();
      localStorage.setItem('stock_last_sync', syncTimestamp);
      setLastSyncDate(syncTimestamp);
      
      alert(`Sincronização concluída!\n✅ ${syncedCount} vendas processadas\n⚠️ ${skippedCount} vendas ignoradas (sem stock comprado antes)`);
      fetchStock();
      fetchMovements();
    } catch (err) {
      console.error('Error syncing sales:', err);
      alert('Erro ao sincronizar vendas');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.produto_nome || formData.quantidade <= 0) return;

    try {
      setIsSubmitting(true);
      
      // Get or create stock item
      let { data: stockData } = await supabase
        .from('loja_stock')
        .select('*')
        .eq('produto_nome', formData.produto_nome)
        .single();

      const quantityBefore = stockData?.quantidade_atual || 0;
      let quantityAfter = quantityBefore;

      if (formData.tipo_movimento === 'ENTRADA') {
        quantityAfter = quantityBefore + formData.quantidade;
      } else if (formData.tipo_movimento === 'SAIDA') {
        quantityAfter = Math.max(0, quantityBefore - formData.quantidade);
      } else if (formData.tipo_movimento === 'AJUSTE') {
        quantityAfter = formData.quantidade;
      }

      if (!stockData) {
        // Create new stock item with purchase date
        await supabase
          .from('loja_stock')
          .insert([{
            produto_nome: formData.produto_nome,
            quantidade_atual: quantityAfter,
            stock_minimo: 10,
            preco_custo: formData.preco_custo || null,
            data_compra: formData.tipo_movimento === 'ENTRADA' ? formData.data_compra : new Date().toISOString().split('T')[0]
          }]);
      } else {
        // Update existing - only update data_compra if ENTRADA
        const updateData: any = { 
          quantidade_atual: quantityAfter,
          preco_custo: formData.preco_custo || stockData.preco_custo,
          ultima_atualizacao: new Date().toISOString()
        };
        
        if (formData.tipo_movimento === 'ENTRADA') {
          updateData.data_compra = formData.data_compra;
        }
        
        await supabase
          .from('loja_stock')
          .update(updateData)
          .eq('produto_nome', formData.produto_nome);
      }

      // Create movement
      await supabase
        .from('loja_stock_movimentos')
        .insert([{
          produto_nome: formData.produto_nome,
          tipo_movimento: formData.tipo_movimento,
          quantidade: formData.quantidade,
          quantidade_anterior: quantityBefore,
          quantidade_nova: quantityAfter,
          motivo: formData.motivo,
          data_movimento: formData.data_movimento,
          referencia: formData.referencia || null
        }]);

      setIsFormOpen(false);
      setFormData({
        produto_nome: '',
        tipo_movimento: 'ENTRADA',
        quantidade: 0,
        data_compra: new Date().toISOString().split('T')[0],
        motivo: '',
        data_movimento: new Date().toISOString().split('T')[0],
        referencia: '',
        preco_custo: 0
      });
      fetchStock();
      fetchMovements();
    } catch (err) {
      console.error('Error adding movement:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickEdit = async (item: StockItem, newQuantity: number) => {
    try {
      const quantityBefore = item.quantidade_atual;
      const quantityAfter = newQuantity;

      // Update stock
      await supabase
        .from('loja_stock')
        .update({ 
          quantidade_atual: quantityAfter,
          ultima_atualizacao: new Date().toISOString()
        })
        .eq('id', item.id);

      // Create movement
      await supabase
        .from('loja_stock_movimentos')
        .insert([{
          produto_nome: item.produto_nome,
          tipo_movimento: 'AJUSTE',
          quantidade: quantityAfter,
          quantidade_anterior: quantityBefore,
          quantidade_nova: quantityAfter,
          motivo: 'Ajuste rápido via tabela',
          data_movimento: new Date().toISOString().split('T')[0],
          referencia: null
        }]);

      setEditingId(null);
      fetchStock();
      fetchMovements();
    } catch (err) {
      console.error('Error updating stock:', err);
    }
  };

  const resetDatabase = async () => {
    if (!confirm('ATENÇÃO: Isto irá APAGAR TODO O STOCK e MOVIMENTOS da base de dados e reiniciar com zero quantidades baseadas no Excel. Tem a certeza?')) {
        return;
    }

    const password = prompt('Para confirmar, digite "DELETAR"');
    if (password !== 'DELETAR') {
        alert('Cancelado.');
        return;
    }

    setIsLoading(true);
    try {
        // 1. Delete all movements
        const { error: errorMovements } = await supabase
            .from('loja_stock_movimentos')
            .delete()
            .neq('id', 0); // Hack to delete all

        if (errorMovements) throw errorMovements;

        // 2. Delete all stock
        const { error: errorStock } = await supabase
            .from('loja_stock')
            .delete()
            .neq('id', 0); // Hack to delete all
        
        if (errorStock) throw errorStock;

        // 3. Populate from orders
        const uniqueProducts = new Map<string, { ref: string, name: string, price: number }>();
        
        orders.forEach((order: any) => {
            const productName = order.produto;
            // Try to find a ref if available in raw data, otherwise empty
            // In the provided excel structure, we often just have product name
            // We will use the product name as the unique key
            if (!uniqueProducts.has(productName)) {
                uniqueProducts.set(productName, {
                    ref: order.ref || '',
                    name: productName,
                    price: order.pvp || 0 // Assuming pvp might be in order, or we default to 0
                });
            }
        });

        // Prepare insert data
        const initialStock = Array.from(uniqueProducts.values()).map(p => ({
            produto_nome: p.name,
            ref: p.ref,
            quantidade_atual: 0,
            stock_minimo: 5,
            preco_custo: 0,
            preco_venda: p.price,
            ultima_atualizacao: new Date().toISOString(),
            data_compra: new Date().toISOString().split('T')[0]
        }));

        // Batch insert (supabase might reject large batches, doing chunks of 100 if needed, but for now try all)
        if (initialStock.length > 0) {
            const { error: insertError } = await supabase
                .from('loja_stock')
                .insert(initialStock);
            
            if (insertError) throw insertError;
        }

        alert('Base de dados reiniciada com sucesso!');
        fetchStock();
        fetchMovements();

    } catch (err) {
        console.error('CRITICAL ERROR RESETTING DB:', err);
        alert('Erro ao reiniciar base de dados. Verifique a consola.');
    } finally {
        setIsLoading(false);
    }
  };

  const filteredStock = stockItems.filter(item => 
    item.produto_nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSKUs = stockItems.length;
  const totalValue = stockItems.reduce((acc, item) => 
    acc + (item.quantidade_atual * (item.preco_custo || 0)), 0
  );
  const lowStockItems = stockItems.filter(item => item.quantidade_atual < item.stock_minimo).length;
  const recentMovements = movements.slice(0, 5).length;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val);

  const getStockStatus = (item: StockItem) => {
    if (item.quantidade_atual === 0) return { label: 'ESGOTADO', color: 'rose' };
    if (item.quantidade_atual < item.stock_minimo) return { label: 'BAIXO', color: 'orange' };
    return { label: 'OK', color: 'emerald' };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter">Gestão de Stock</h1>
          <p className="text-slate-700 dark:text-slate-200 font-bold">Controlo de inventário e movimentos</p>
        </div>

        <div className="flex items-center gap-3">
            <button
              onClick={syncWithSales}
              disabled={isSyncing}
              className="flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'A Sincronizar...' : 'Sincronizar Vendas'}
            </button>
            <button 
                onClick={() => setIsHistoryOpen(true)}
                className="flex items-center gap-3 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-slate-500/20 active:scale-95"
            >
                <History className="w-4 h-4" />
                Histórico
            </button>
            <button 
                onClick={() => setIsFormOpen(true)}
                className="flex items-center gap-3 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-purple-500/20 active:scale-95"
            >
                <Plus className="w-4 h-4" />
                Movimento
            </button>
            <button 
                onClick={resetDatabase}
                className="flex items-center gap-3 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-red-500/20 active:scale-95"
            >
                <AlertTriangle className="w-4 h-4" />
                RESET DB
            </button>
        </div>
      </div>

      {lastSyncDate && (
        <div className="glass p-4 rounded-2xl border-slate-100 dark:border-white/5">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <strong>Última sincronização:</strong> {new Date(lastSyncDate).toLocaleString('pt-PT')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          label="Total SKUs"
          value={totalSKUs}
          icon={Package}
          trend={`${filteredStock.length} ativos`}
          color="purple"
        />
        <KpiCard
          label="Valor em Stock"
          value={formatCurrency(totalValue)}
          icon={TrendingUp}
          trend="Custo total"
          color="emerald"
        />
        <KpiCard
          label="Stock Baixo"
          value={lowStockItems}
          icon={AlertTriangle}
          trend="Abaixo do mínimo"
          color="orange"
        />
        <KpiCard
          label="Movimentos Recentes"
          value={recentMovements}
          icon={History}
          trend="Últimos 5"
          color="blue"
        />
      </div>

      <div className="glass rounded-[2.5rem] overflow-hidden border-slate-100 dark:border-white/5 shadow-xl">
         <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-950 dark:text-white">Inventário Atual</h3>
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                <input 
                    type="text"
                    placeholder="Procurar produto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-64 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold shadow-sm transition-all"
                />
            </div>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <tr>
                  <th className="px-8 py-4">Produto (REF)</th>
                  <th className="px-4 py-4 text-center">Quantidade</th>
                  <th className="px-4 py-4 text-center">Data Compra</th>
                  <th className="px-4 py-4 text-center">Stock Mínimo</th>
                  <th className="px-4 py-4 text-center">Status</th>
                  <th className="px-4 py-4 text-right">Preço Custo</th>
                  <th className="px-4 py-4 text-right">PVP (Venda)</th>
                  <th className="px-4 py-4 text-right">Valor Total</th>
                  <th className="px-8 py-4">Última Atualização</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {filteredStock.map((item: StockItem) => {
                  const status = getStockStatus(item);
                  const isEditing = editingId === item.id;
                  return (
                    <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">
                            {item.ref || 'SEM REF'}
                          </span>
                          <span className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-tight">
                            {item.produto_nome}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-center">
                        {isEditing ? (
                          <input 
                            type="number"
                            autoFocus
                            min="0"
                            defaultValue={item.quantidade_atual}
                            onBlur={(e) => {
                              const newQty = Number(e.target.value);
                              if (newQty !== item.quantidade_atual) {
                                handleQuickEdit(item, newQty);
                              } else {
                                setEditingId(null);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              } else if (e.key === 'Escape') {
                                setEditingId(null);
                              }
                            }}
                            className="w-20 px-2 py-1 text-center border-2 border-purple-500 rounded-lg font-black text-lg"
                          />
                        ) : (
                          <span 
                            onClick={() => {
                              setEditingId(item.id!);
                              // setEditQuantity(item.quantidade_atual);
                            }}
                            className="text-2xl font-black text-slate-950 dark:text-white cursor-pointer hover:text-purple-600 transition-colors"
                          >
                            {item.quantidade_atual}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-5 text-center text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {item.data_compra ? new Date(item.data_compra).toLocaleDateString('pt-PT') : '-'}
                      </td>
                      <td className="px-4 py-5 text-center text-sm text-slate-600 dark:text-slate-400 font-bold">
                        {item.stock_minimo}
                      </td>
                      <td className="px-4 py-5 text-center">
                        <span className={`px-3 py-1 bg-${status.color}-50 dark:bg-${status.color}-900/30 text-${status.color}-600 dark:text-${status.color}-400 text-[9px] font-black uppercase tracking-tighter rounded-full`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-5 text-right text-sm font-bold text-slate-600 dark:text-slate-400">
                        {item.preco_custo ? formatCurrency(item.preco_custo) : '-'}
                      </td>
                      <td className="px-4 py-5 text-right text-sm font-bold text-blue-600 dark:text-blue-400">
                        {item.preco_venda ? formatCurrency(item.preco_venda) : '-'}
                      </td>
                      <td className="px-4 py-5 text-right font-black text-slate-950 dark:text-white">
                        {item.preco_custo ? formatCurrency(item.quantidade_atual * item.preco_custo) : '-'}
                      </td>
                      <td className="px-8 py-5 text-sm text-slate-600 dark:text-slate-400">
                        {new Date(item.ultima_atualizacao).toLocaleDateString('pt-PT')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
         </div>
      </div>

      {/* Movement Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
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
                        <Package className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-950 dark:text-white tracking-tighter">Registar Movimento</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Entrada, Saída ou Ajuste</p>
                    </div>
                 </div>
                 <button onClick={() => setIsFormOpen(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-colors">
                    <X className="w-6 h-6 text-slate-400" />
                 </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Movimento</label>
                        <select 
                          value={formData.tipo_movimento} 
                          onChange={(e) => setFormData({...formData, tipo_movimento: e.target.value as any})} 
                          className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold"
                        >
                          {MOVEMENT_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                        <input 
                          type="date" 
                          required 
                          value={formData.data_movimento} 
                          onChange={(e) => setFormData({...formData, data_movimento: e.target.value})} 
                          className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold" 
                        />
                    </div>
                 </div>

                 {/* Data de Compra - only for ENTRADA */}
                 {formData.tipo_movimento === 'ENTRADA' && (
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data da Compra ⭐</label>
                     <input 
                       type="date" 
                       required 
                       value={formData.data_compra} 
                       onChange={(e) => setFormData({...formData, data_compra: e.target.value})} 
                       className="w-full px-4 py-4 bg-white dark:bg-slate-900 border-2 border-purple-500/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-black" 
                     />
                     <p className="text-xs text-slate-500 italic ml-1">Data em que compraste este stock</p>
                   </div>
                 )}

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Produto (REF ou Nome)</label>
                    <input 
                      required
                      type="text"
                      list="products-list"
                      value={formData.produto_nome} 
                      onChange={async (e) => {
                        const selectedName = e.target.value;
                        setFormData({...formData, produto_nome: selectedName});
                        
                        // Auto-fill PVP when product selected
                        if (selectedName) {
                          const { data: product } = await supabase
                            .from('loja_stock')
                            .select('preco_venda')
                            .eq('produto_nome', selectedName)
                            .single();
                          
                          if (product && product.preco_venda && !formData.preco_custo) {
                            setFormData(prev => ({...prev, preco_custo: product.preco_venda}));
                          }
                        }
                      }} 
                      placeholder="Digite a REF ou nome do produto..."
                      className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold"
                    />
                    <datalist id="products-list">
                      {(productsFromData || []).map((product: any, idx: number) => {
                        const ref = product.ref || '';
                        const nome = product.nome_artigo || product.nome || '';
                        const displayText = ref ? `${ref} - ${nome}` : nome;
                        return (
                          <option key={idx} value={nome}>
                            {displayText}
                          </option>
                        );
                      })}
                      {stockItems.map(item => (
                        <option key={item.id} value={item.produto_nome}>
                          {item.ref ? `${item.ref} - ${item.produto_nome}` : item.produto_nome}
                        </option>
                      ))}
                    </datalist>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          {formData.tipo_movimento === 'AJUSTE' ? 'Quantidade Final' : 'Quantidade'}
                        </label>
                        <input 
                          type="number" 
                          required 
                          min="0"
                          value={formData.quantidade || ''}
                          onChange={(e) => setFormData({...formData, quantidade: Number(e.target.value)})} 
                          className="w-full px-4 py-4 bg-white dark:bg-slate-900 border-2 border-purple-500/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-black" 
                        />
                    </div>
                    {formData.tipo_movimento === 'ENTRADA' && (
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço Custo (€)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            value={formData.preco_custo || ''}
                            onChange={(e) => setFormData({...formData, preco_custo: Number(e.target.value)})} 
                            className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold" 
                          />
                      </div>
                    )}
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo</label>
                    <textarea 
                      required
                      rows={3}
                      value={formData.motivo} 
                      onChange={(e) => setFormData({...formData, motivo: e.target.value})} 
                      className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold resize-none" 
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Referência (Opcional)</label>
                    <input 
                      type="text" 
                      value={formData.referencia} 
                      onChange={(e) => setFormData({...formData, referencia: e.target.value})} 
                      className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold" 
                    />
                 </div>

                 <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest disabled:opacity-50">
                    {isSubmitting ? 'A Processar...' : 'Registar Movimento'}
                 </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-950 w-full max-w-6xl rounded-[3rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-600 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-500/40">
                        <History className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-950 dark:text-white tracking-tighter">Histórico de Movimentos</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Últimas 100 operações</p>
                    </div>
                 </div>
                 <button onClick={() => setIsHistoryOpen(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-colors">
                    <X className="w-6 h-6 text-slate-400" />
                 </button>
              </div>

              <div className="overflow-auto p-8">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase text-slate-400 tracking-widest sticky top-0">
                    <tr>
                      <th className="px-4 py-4">Data</th>
                      <th className="px-4 py-4">Produto</th>
                      <th className="px-4 py-4">Tipo</th>
                      <th className="px-4 py-4 text-center">Qtd</th>
                      <th className="px-4 py-4 text-center">Antes</th>
                      <th className="px-4 py-4 text-center">Depois</th>
                      <th className="px-4 py-4">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                    {movements.map((mov: StockMovement) => (
                      <tr key={mov.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-4 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">
                          {new Date(mov.data_movimento).toLocaleDateString('pt-PT')}
                        </td>
                        <td className="px-4 py-4 text-sm font-black text-slate-950 dark:text-white">
                          {mov.produto_nome}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 text-[9px] font-black uppercase rounded-full ${
                            mov.tipo_movimento === 'ENTRADA' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                            mov.tipo_movimento === 'SAIDA' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' :
                            mov.tipo_movimento === 'VENDA' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                            'bg-slate-50 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400'
                          }`}>
                            {mov.tipo_movimento}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center font-black text-slate-950 dark:text-white">
                          {mov.quantidade}
                        </td>
                        <td className="px-4 py-4 text-center text-sm text-slate-600 dark:text-slate-400">
                          {mov.quantidade_anterior}
                        </td>
                        <td className="px-4 py-4 text-center text-sm font-bold text-slate-950 dark:text-white">
                          {mov.quantidade_nova}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {mov.motivo}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
