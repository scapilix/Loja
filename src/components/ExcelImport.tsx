import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

interface ExcelImportProps {
  onDataImported: (data: { orders: any[]; customers: any[] }) => void;
  variant?: 'floating' | 'sidebar' | 'sidebar-collapsed';
}

// Function to sync stock data to Supabase
const syncStockToSupabase = async (stockData: any[]) => {
  try {
    for (const item of stockData) {
      // Map Excel columns to our database fields
      const productName = item.nome_artigo || item.nome || item.produto;
      const quantity = parseInt(item.stock || item.quantidade || 0);
      const pvpNormal = parseFloat(item.pvp_normal || item.preco || 0);
      
      if (!productName) continue;

      // Check if product exists
      const { data: existing } = await supabase
        .from('loja_stock')
        .select('*')
        .eq('produto_nome', productName)
        .single();

      if (existing) {
        // Update existing
        await supabase
          .from('loja_stock')
          .update({
            quantidade_atual: quantity,
            preco_custo: pvpNormal || existing.preco_custo,
            ultima_atualizacao: new Date().toISOString()
          })
          .eq('produto_nome', productName);
      } else {
        // Create new
        await supabase
          .from('loja_stock')
          .insert([{
            produto_nome: productName,
            quantidade_atual: quantity,
            stock_minimo: 10,
            preco_custo: pvpNormal
          }]);
      }
    }
    console.log(`✓ ${stockData.length} produtos sincronizados com o stock`);
  } catch (error) {
    console.error('Error syncing stock to Supabase:', error);
  }
};

export function ExcelImport({ onDataImported, variant = 'floating' }: ExcelImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatus('idle');
    setMessage('Processando arquivo...');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { cellDates: true });

      // Helper function to clean headers
      const cleanHeader = (header: any): string | null => {
        if (!header) return null;
        return header.toString()
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^\w\s]/gi, '')
          .trim();
      };

      // Transform a single sheet
      const transformSheet = (sheetName: string): any[] | null => {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) return null;

        const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (rawData.length < 2) return null;

        // Find first non-empty row for headers
        let headerRowIndex = 0;
        while (headerRowIndex < rawData.length && (!rawData[headerRowIndex] || rawData[headerRowIndex].length < 3)) {
          headerRowIndex++;
        }

        const headers = rawData[headerRowIndex].map(cleanHeader);
        const rows = rawData.slice(headerRowIndex + 1)
          .filter(row => row.length > 0 && row.some((cell: any) => cell !== null && cell !== ''));

        // Special handling for Encomendas sheet (grouping by TOTAL rows)
        if (sheetName === 'Encomendas') {
          const groupedOrders: any[] = [];
          let currentItems: any[] = [];

          rows.forEach((row: any[]) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              if (header) obj[header] = row[index];
            });

            // Check if this is a TOTAL row
            const isTotalRow = obj.ref && obj.ref.toString().toUpperCase() === 'TOTAL';

            if (isTotalRow) {
              // This row marks the end of a sale
              groupedOrders.push({
                ...obj,
                items: [...currentItems],
                item_count: currentItems.length
              });
              currentItems = [];
            } else {
              // This is an item
              if (obj.ref) currentItems.push(obj);
            }
          });

          return groupedOrders;
        }

        // Default transform for other sheets
        return rows.map((row: any[]) => {
          const obj: any = {};
          headers.forEach((header, index) => {
            if (header) obj[header] = row[index];
          });
          return obj;
        });
      };

      // Transform all relevant sheets
      const transformedData = {
        customers: transformSheet('BD Clientes') || [],
        orders: transformSheet('Encomendas') || [],
        stock: transformSheet('VALORES ORIGINAL (4)') || transformSheet('VALORES ORIGINAL') || transformSheet('STOCK MASTER') || [],
        stats: transformSheet('Estatisticas') || [],
        timestamp: new Date().toISOString()
      };

      // Sync stock data to Supabase if available
      if (transformedData.stock && transformedData.stock.length > 0) {
        await syncStockToSupabase(transformedData.stock);
      }

      // Call the callback with processed data
      onDataImported(transformedData);

      const orderCount = transformedData.orders.length;
      const customerCount = transformedData.customers.length;
      const stockCount = transformedData.stock?.length || 0;

      setStatus('success');
      setMessage(`✓ Importado! ${orderCount} encomendas, ${customerCount} clientes${stockCount > 0 ? `, ${stockCount} produtos em stock` : ''}`);
      
      // Auto-close after 2.5 seconds
      setTimeout(() => {
        setIsOpen(false);
        setStatus('idle');
      }, 2500);

    } catch (error) {
      console.error('Error processing Excel:', error);
      setStatus('error');
      setMessage('❌ Erro ao processar arquivo. Verifique o formato.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const renderTrigger = () => {
    if (variant === 'sidebar-collapsed') {
      return (
        <motion.button
          onClick={() => setIsOpen(true)}
          className="w-10 h-10 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center transition-all border border-purple-500/20"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title="Importar Excel"
        >
          <Upload className="w-5 h-5" />
        </motion.button>
      );
    }

    // Default to sidebar long button if not explicitly collapsed
    return (
      <motion.button
        onClick={() => setIsOpen(true)}
        className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-purple-500/20"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Upload className="w-4 h-4" />
        <span className="text-sm font-black uppercase tracking-wider">Importar Dados</span>
      </motion.button>
    );
  };

  return (
    <>
      {renderTrigger()}

      {/* Import Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => !isProcessing && setIsOpen(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="glass p-8 rounded-[2rem] border-purple-200 dark:border-purple-800/30 shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">Importar Excel</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Atualize os dados da aplicação</p>
                    </div>
                  </div>
                  {!isProcessing && (
                    <button
                      onClick={() => setIsOpen(false)}
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.xlsm"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="excel-upload"
                />

                {/* Upload Area */}
                <label
                  htmlFor="excel-upload"
                  className={`block border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${
                    isProcessing
                      ? 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 cursor-not-allowed'
                      : 'border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10'
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    {status === 'idle' && !isProcessing && (
                      <>
                        <Upload className="w-12 h-12 text-slate-400" />
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-300">Clique para selecionar</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Arquivo Excel (.xlsx, .xls, .xlsm)</p>
                        </div>
                      </>
                    )}

                    {isProcessing && (
                      <>
                        <div className="w-12 h-12 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin" />
                        <p className="font-bold text-purple-600 dark:text-purple-400">{message}</p>
                      </>
                    )}

                    {status === 'success' && !isProcessing && (
                      <>
                        <CheckCircle className="w-12 h-12 text-emerald-500" />
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">{message}</p>
                      </>
                    )}

                    {status === 'error' && !isProcessing && (
                      <>
                        <AlertCircle className="w-12 h-12 text-rose-500" />
                        <p className="font-bold text-rose-600 dark:text-rose-400">{message}</p>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setStatus('idle');
                            setMessage('');
                          }}
                          className="mt-2 px-4 py-2 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-bold hover:bg-rose-200 dark:hover:bg-rose-500/30 transition-colors"
                        >
                          Tentar Novamente
                        </button>
                      </>
                    )}
                  </div>
                </label>

                {/* Instructions */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/30">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2">📋 Formato esperado:</p>
                  <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• Planilha "Encomendas" com dados de vendas (agrupamento automático por linhas TOTAL)</li>
                    <li>• Planilha "BD Clientes" com dados de clientes</li>
                    <li>• Planilha "VALORES ORIGINAL" ou "STOCK MASTER" com inventário (sincronização automática)</li>
                    <li>• Planilha "Estatisticas" (opcional) com estatísticas</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
