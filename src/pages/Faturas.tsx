import { useState, useEffect, useMemo } from 'react';
import { SmartDateFilter } from '../components/SmartDateFilter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  Search, 
  TrendingUp, 
  DollarSign, 
  Tag, 
  CheckCircle2,
  Trash2,
  X
} from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { supabase } from '../lib/supabase';
import { CustomTooltip } from '../components/CustomTooltip';
import { 
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface Fatura {
  id?: number;
  data: string;
  entidade: string;
  nif: string;
  is_novo: boolean;
  numero_fatura: string;
  valor_total: number;
  valor_sem_iva: number;
  valor_iva: number;
  categoria: string;
  tipo_fatura: 'Compras' | 'Vendas' | 'Despesas';
  taxa_iva: number;
  fornecedor?: string;
  fatura_status?: 'C/F' | 'S/F';
  created_at?: string;
}

interface FilterState {
  year: string;
  month: string;
  days: string[];
}

const CATEGORIES = ['Despesa/Compras', 'Serviços', 'Outros'];
const INVOICE_TYPES = ['Compras', 'Vendas', 'Despesas'];
const IVA_RATES = [
  { label: '6%', value: 6 },
  { label: '13%', value: 13 },
  { label: '23%', value: 23 },
  { label: 'Personalizado', value: -1 }
];
const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'];

export default function Faturas() {
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('Todos');
  
  // Form State
  const [formData, setFormData] = useState<Fatura>({
    data: new Date().toISOString().split('T')[0],
    entidade: '',
    nif: '',
    is_novo: false,
    numero_fatura: '',
    valor_total: 0,
    valor_sem_iva: 0,
    valor_iva: 0,
    categoria: 'Despesa/Compras',
    tipo_fatura: 'Compras',
    taxa_iva: 23,
    fatura_status: 'C/F',
    fornecedor: ''
  });

  const [customIva, setCustomIva] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    year: '',
    month: '',
    days: []
  });

  useEffect(() => {
    fetchFaturas();
  }, []);

  const fetchFaturas = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('loja_faturas')
        .select('*')
        .order('data', { ascending: false });

      if (data && !error) {
        setFaturas(data);
      }
    } catch (err) {
      console.error('Error fetching faturas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateIva = (total: number, taxaIva: number) => {
    const semIva = total / (1 + taxaIva / 100);
    const iva = total - semIva;
    return {
      semIva: parseFloat(semIva.toFixed(2)),
      iva: parseFloat(iva.toFixed(2))
    };
  };

  const handleTotalChange = (val: number) => {
    const { semIva, iva } = calculateIva(val, formData.taxa_iva);
    setFormData((prev: Fatura) => ({
      ...prev,
      valor_total: val,
      valor_sem_iva: semIva,
      valor_iva: iva
    }));
  };

  const handleIvaChange = (rate: number) => {
    if (rate === -1) {
      setCustomIva(true);
    } else {
      setCustomIva(false);
      setFormData((prev: Fatura) => {
        const { semIva, iva } = calculateIva(prev.valor_total, rate);
        return {
          ...prev,
          taxa_iva: rate,
          valor_sem_iva: semIva,
          valor_iva: iva
        };
      });
    }
  };

  const handleCustomIvaChange = (rate: number) => {
    setFormData((prev: Fatura) => {
      const { semIva, iva } = calculateIva(prev.valor_total, rate);
      return {
        ...prev,
        taxa_iva: rate,
        valor_sem_iva: semIva,
        valor_iva: iva
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.entidade || formData.valor_total <= 0) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('loja_faturas')
        .insert([formData]);

      if (!error) {
        setIsFormOpen(false);
        setFormData({
            data: new Date().toISOString().split('T')[0],
            entidade: '',
            nif: '',
            is_novo: false,
            numero_fatura: '',
            valor_total: 0,
            valor_sem_iva: 0,
            valor_iva: 0,
            categoria: 'Despesa/Compras',
            tipo_fatura: 'Compras',
            taxa_iva: 23,
            fatura_status: 'C/F',
            fornecedor: ''
        });
        setCustomIva(false);
        fetchFaturas();
      }
    } catch (err) {
      console.error('Error adding fatura:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteFatura = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta fatura?')) return;
    try {
        const { error } = await supabase
            .from('loja_faturas')
            .delete()
            .eq('id', id);
        if (!error) fetchFaturas();
    } catch (err) {
        console.error('Error deleting fatura:', err);
    }
  };

  // ---------------------- FILTERING LOGIC ----------------------
  const dateMetrics = useMemo(() => {
    const allYears = new Set<string>();
    const allMonths = new Set<string>();
    
    const yearCounts: Record<string, number> = {};
    const monthCounts: Record<string, number> = {};
    const dayCounts: Record<string, number> = {};

    // First pass: Calculate available years based on ALL data
    faturas.forEach(f => {
      const date = new Date(f.data);
      const y = date.getFullYear().toString();
      allYears.add(y);
      yearCounts[y] = (yearCounts[y] || 0) + 1;
    });

    // Second pass: Calculate months based on SELECTED YEAR
    if (filters.year) {
      faturas.forEach(f => {
          const date = new Date(f.data);
          const y = date.getFullYear().toString();
          if (y === filters.year) {
              const m = (date.getMonth() + 1).toString().padStart(2, '0');
              allMonths.add(m);
              monthCounts[m] = (monthCounts[m] || 0) + 1;
          }
      });
    }

    // Third pass: Calculate days based on SELECTED MONTH + YEAR
    if (filters.year && filters.month) {
      faturas.forEach(f => {
          const date = new Date(f.data);
          const y = date.getFullYear().toString();
          const m = (date.getMonth() + 1).toString().padStart(2, '0');
          if (y === filters.year && m === filters.month) {
              const day = date.getDate().toString().padStart(2, '0');
              dayCounts[day] = (dayCounts[day] || 0) + 1;
          }
      });
    }

    // Apply Date Filter to produce filtered list
    let filtered = faturas;
    if (filters.year) {
      filtered = filtered.filter(f => f.data.startsWith(filters.year));
    }
    if (filters.year && filters.month) {
      filtered = filtered.filter(f => {
          const [, m] = f.data.split('-'); // Format YYYY-MM-DD
          return m === filters.month;
      });
    }
    if (filters.year && filters.month && filters.days.length > 0) {
      filtered = filtered.filter(f => {
          const [, , day] = f.data.split('-');
          return filters.days.includes(day);
      });
    }

    return {
      filteredDate: filtered,
      availableFilters: {
        years: Array.from(allYears).sort().reverse(),
        months: Array.from(allMonths).sort(),
        days: [] // Handled by UI mostly, or we could populate
      },
      counts: {
        years: yearCounts,
        months: monthCounts,
        days: dayCounts
      }
    };
  }, [faturas, filters]);

  const isFiltered = !!(filters.year || filters.month || filters.days.length > 0);

  const filteredByType = selectedType === 'Todos' 
    ? dateMetrics.filteredDate 
    : dateMetrics.filteredDate.filter(f => f.tipo_fatura === selectedType);

  const totalSpent = filteredByType.reduce((acc: number, f: Fatura) => acc + Number(f.valor_total), 0);
  const totalIva = filteredByType.reduce((acc: number, f: Fatura) => acc + Number(f.valor_iva), 0);
  const avgFatura = filteredByType.length > 0 ? totalSpent / filteredByType.length : 0;

  const categoryData = CATEGORIES.map(cat => ({
    name: cat,
    value: filteredByType.filter((f: Fatura) => f.categoria === cat).reduce((acc: number, f: Fatura) => acc + Number(f.valor_total), 0)
  })).filter(c => c.value > 0);

  const filteredFaturas = filteredByType.filter(f => 
    String(f.entidade || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(f.numero_fatura || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(f.nif || '').includes(searchTerm)
  );

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter">Gestão de Faturas</h1>
          <p className="text-slate-700 dark:text-slate-200 font-bold">Controlo de despesas e cadastro de compras</p>
        </div>

        <div className="flex items-center gap-3">
            {/* DATE FILTER */}
            <div className="flex items-center gap-2 mr-2">
              <SmartDateFilter 
                  filters={filters}
                  setFilters={setFilters}
                  availableFilters={dateMetrics.availableFilters as any}
                  counts={dateMetrics.counts}
                  itemLabel="Faturas"
              />
              
              {isFiltered && (
                <button 
                  onClick={() => setFilters({ year: '', month: '', days: [] })}
                  className="flex items-center gap-2 px-3 py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="Todos">Todos os Tipos</option>
              {INVOICE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                <input 
                    type="text"
                    placeholder="Procurar entidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-64 lg:w-80 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold shadow-sm transition-all"
                />
            </div>
            <button 
                onClick={() => setIsFormOpen(true)}
                className="flex items-center gap-3 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-purple-500/20 active:scale-95"
            >
                <Plus className="w-4 h-4" />
                Nova Fatura
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          label="Total Despesas"
          value={formatCurrency(totalSpent)}
          icon={DollarSign}
          trend={`${filteredByType.length} faturas`}
          color="purple"
        />
        <KpiCard
          label="IVA Recuperável"
          value={formatCurrency(totalIva)}
          icon={TrendingUp}
          trend="Total de IVA"
          color="blue"
        />
        <KpiCard
          label="Média por Fatura"
          value={formatCurrency(avgFatura)}
          icon={Tag}
          trend="Valor médio"
          color="emerald"
        />
        <KpiCard
          label="Faturas Novas"
          value={filteredByType.filter(f => f.is_novo).length}
          icon={CheckCircle2}
          trend="Entidades novas"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass rounded-[2.5rem] overflow-hidden border-slate-100 dark:border-white/5 shadow-xl">
           <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-950 dark:text-white">Registos Recentes</h3>
              <div className="px-4 py-1.5 bg-slate-100 dark:bg-white/5 rounded-full text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
                {filteredFaturas.length} encontrados
              </div>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Data</th>
                    <th className="px-4 py-4">Tipo</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Entidade / Fornecedor</th>
                    <th className="px-4 py-4">Categoria</th>
                    <th className="px-4 py-4 text-right">Valor Total</th>
                    <th className="px-8 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                  {filteredFaturas.map((fatura: Fatura) => (
                    <tr key={fatura.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-8 py-5 text-sm font-bold text-slate-600 dark:text-slate-400">
                        {new Date(fatura.data).toLocaleDateString('pt-PT')}
                      </td>
                      <td className="px-4 py-5">
                        <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-tighter rounded-full ${
                          fatura.tipo_fatura === 'Compras' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                          fatura.tipo_fatura === 'Vendas' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                          'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                        }`}>
                          {fatura.tipo_fatura}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                         <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-tighter rounded-full ${
                           fatura.fatura_status === 'C/F' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                           'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                         }`}>
                           {fatura.fatura_status || 'C/F'}
                         </span>
                      </td>
                      <td className="px-4 py-5">
                         <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-tight">
                              {fatura.entidade}
                              {fatura.fornecedor && (
                                <span className="ml-2 text-slate-400 font-bold text-xs">({fatura.fornecedor})</span>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{fatura.numero_fatura || 'S/ Nº'}</span>
                         </div>
                      </td>
                      <td className="px-4 py-5">
                         <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[9px] font-black uppercase tracking-tighter rounded-full">
                            {fatura.categoria}
                         </span>
                      </td>
                      <td className="px-4 py-5 text-right font-black text-slate-950 dark:text-white">
                        {formatCurrency(Number(fatura.valor_total))}
                      </td>
                      <td className="px-8 py-5 text-center">
                        <button 
                          onClick={() => deleteFatura(fatura.id!)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>

        <div className="space-y-8">
            <div className="glass p-8 rounded-[2.5rem] border-slate-100 dark:border-white/5 shadow-xl">
                 <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-slate-950 dark:text-white">Por Categoria</h4>
                        <p className="text-xs text-slate-500 font-bold">Distribuição de gastos</p>
                    </div>
                 </div>

                 <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {categoryData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip formatter={(v: any) => formatCurrency(v)} />} />
                        </PieChart>
                    </ResponsiveContainer>
                 </div>
            </div>
        </div>
      </div>

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
                        <FileText className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-950 dark:text-white tracking-tighter">Cadastrar Fatura</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Preencha os dados oficiais</p>
                    </div>
                 </div>
                 <button onClick={() => setIsFormOpen(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-colors">
                    <X className="w-6 h-6 text-slate-400" />
                 </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                 {/* Status Selector (C/F vs S/F) */}
                 <div className="flex items-center gap-4 bg-slate-100 dark:bg-white/5 p-2 rounded-3xl border border-slate-200 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, fatura_status: 'C/F'})}
                      className={`flex-1 py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                        formData.fatura_status === 'C/F' 
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' 
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      Com Fatura (C/F)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, fatura_status: 'S/F'})}
                      className={`flex-1 py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                        formData.fatura_status === 'S/F' 
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' 
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      Sem Fatura (S/F)
                    </button>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Fatura</label>
                        <select 
                          value={formData.tipo_fatura} 
                          onChange={(e) => setFormData({...formData, tipo_fatura: e.target.value as 'Compras' | 'Vendas' | 'Despesas'})} 
                          className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold"
                        >
                          {INVOICE_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                        <input type="date" required value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold" />
                    </div>
                 </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Entidade</label>
                        <input type="text" required value={formData.entidade} onChange={(e) => setFormData({...formData, entidade: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fornecedor (Opcional)</label>
                        <input type="text" value={formData.fornecedor} onChange={(e) => setFormData({...formData, fornecedor: e.target.value})} placeholder="Nome do Fornecedor" className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nº Fatura</label>
                        <input type="text" placeholder="FT 2026/001" value={formData.numero_fatura} onChange={(e) => setFormData({...formData, numero_fatura: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                        <select value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold">
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Taxa IVA</label>
                        <select 
                          onChange={(e) => handleIvaChange(Number(e.target.value))} 
                          className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold"
                        >
                          {IVA_RATES.map(rate => (
                            <option key={rate.label} value={rate.value}>{rate.label}</option>
                          ))}
                        </select>
                    </div>
                    {customIva && (
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">IVA Personalizado (%)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            value={formData.taxa_iva}
                            onChange={(e) => handleCustomIvaChange(Number(e.target.value))}
                            className="w-full px-4 py-4 bg-white dark:bg-slate-900 border-2 border-purple-500/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-black" 
                          />
                      </div>
                    )}
                  </div>

                 <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor C/ IVA</label>
                        <input type="number" required step="0.01" onChange={(e) => handleTotalChange(Number(e.target.value))} className="w-full px-4 py-4 bg-white dark:bg-slate-900 border-2 border-purple-500/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-black" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">S/ IVA</label>
                        <input type="number" readOnly value={formData.valor_sem_iva} className="w-full px-4 py-4 bg-slate-100 dark:bg-white/5 border rounded-2xl text-sm font-bold opacity-60" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">% IVA</label>
                        <input type="number" readOnly value={formData.valor_iva} className="w-full px-4 py-4 bg-slate-100 dark:bg-white/5 border rounded-2xl text-sm font-bold opacity-60" />
                    </div>
                 </div>

                 <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest disabled:opacity-50">
                    {isSubmitting ? 'A Processar...' : 'Cadastrar Fatura'}
                 </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
