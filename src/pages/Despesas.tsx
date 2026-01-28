  /* ---------------------- IMPORTS ---------------------- */
  import { useState, useEffect, useMemo } from 'react';
  import { motion, AnimatePresence } from 'framer-motion';
  import { 
    Wallet, 
    Plus, 
    Search, 
    TrendingDown,
    Target,
    AlertCircle,
    Trash2,
    X,
    Home,
    Store,
    Users
  } from 'lucide-react';
  import { KpiCard } from '../components/KpiCard';
  import { supabase } from '../lib/supabase';
  import { SmartDateFilter } from '../components/SmartDateFilter';
  import { DespesasPorDia } from '../components/DespesasPorDia';
  
  /* ---------------------- TYPE DEFINITIONS ---------------------- */
  interface Despesa {
    id?: number;
    data: string;
    categoria: 'Casa Fixa' | 'Casa Variável' | 'Loja Fixa' | 'Loja Variável' | 'Pessoal Fixa' | 'Pessoal Variável';
    forma_pagamento: string;
    banco: string;
    valor_projetado: number | null;
    valor_real: number;
    descricao: string;
    created_at?: string;
  }
  
  interface FilterState {
    year: string;
    month: string;
    days: string[];
  }
  
  const CATEGORIES = [
    { value: 'Casa Fixa', label: 'Casa Fixa', icon: Home, color: 'blue' },
    { value: 'Casa Variável', label: 'Casa Variável', icon: Home, color: 'indigo' },
    { value: 'Loja Fixa', label: 'Loja Fixa', icon: Store, color: 'purple' },
    { value: 'Loja Variável', label: 'Loja Variável', icon: Store, color: 'violet' },
    { value: 'Pessoal Fixa', label: 'Pessoal Fixa', icon: Users, color: 'emerald' },
    { value: 'Pessoal Variável', label: 'Pessoal Variável', icon: Users, color: 'teal' }
  ];
  
  export default function Despesas() {
    const [despesas, setDespesas] = useState<Despesa[]>([]);
    const [, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
    
    // Date Filters
    const [filters, setFilters] = useState<FilterState>({
      year: '',
      month: '',
      days: []
    });
    
    const [formData, setFormData] = useState<Despesa>({
      data: new Date().toISOString().split('T')[0],
      categoria: 'Casa Fixa',
      forma_pagamento: '',
      banco: '',
      valor_projetado: null,
      valor_real: 0,
      descricao: ''
    });
  
    const [isSubmitting, setIsSubmitting] = useState(false);
  
    useEffect(() => {
      fetchDespesas();
    }, []);
  
    const fetchDespesas = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('loja_despesas')
          .select('*')
          .order('data', { ascending: false });
  
        if (data && !error) {
          setDespesas(data);
        }
      } catch (err) {
        console.error('Error fetching despesas:', err);
      } finally {
        setIsLoading(false);
      }
    };
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (formData.valor_real <= 0) return;
  
      try {
        setIsSubmitting(true);
        const dataToInsert = {
          ...formData,
          valor_projetado: formData.categoria.includes('Fixa') ? formData.valor_projetado : null
        };
  
        const { error } = await supabase
          .from('loja_despesas')
          .insert([dataToInsert]);
  
        if (!error) {
          setIsFormOpen(false);
          setFormData({
            data: new Date().toISOString().split('T')[0],
            categoria: 'Casa Fixa',
            forma_pagamento: '',
            banco: '',
            valor_projetado: null,
            valor_real: 0,
            descricao: ''
          });
          fetchDespesas();
        }
      } catch (err) {
        console.error('Error adding despesa:', err);
      } finally {
        setIsSubmitting(false);
      }
    };
  
    const deleteDespesa = async (id: number) => {
      if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
      try {
          const { error } = await supabase
              .from('loja_despesas')
              .delete()
              .eq('id', id);
          if (!error) fetchDespesas();
      } catch (err) {
          console.error('Error deleting despesa:', err);
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
      despesas.forEach(d => {
        const date = new Date(d.data);
        const y = date.getFullYear().toString();
        allYears.add(y);
        yearCounts[y] = (yearCounts[y] || 0) + 1;
      });
  
      // Second pass: Calculate months based on SELECTED YEAR
      if (filters.year) {
        despesas.forEach(d => {
            const date = new Date(d.data);
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
        despesas.forEach(d => {
            const date = new Date(d.data);
            const y = date.getFullYear().toString();
            const m = (date.getMonth() + 1).toString().padStart(2, '0');
            if (y === filters.year && m === filters.month) {
                const day = date.getDate().toString().padStart(2, '0');
                dayCounts[day] = (dayCounts[day] || 0) + 1;
            }
        });
      }
  
      // Apply Date Filter to produce filtered list
      let filtered = despesas;
      if (filters.year) {
        filtered = filtered.filter(d => d.data.startsWith(filters.year));
      }
      if (filters.year && filters.month) {
        filtered = filtered.filter(d => {
            const [, m] = d.data.split('-'); // Format YYYY-MM-DD
            return m === filters.month;
        });
      }
      if (filters.year && filters.month && filters.days.length > 0) {
        filtered = filtered.filter(d => {
            const [, , day] = d.data.split('-');
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
    }, [despesas, filters]);
  
    // Chain filters: Date -> Category -> Search
    const filteredByCategory = selectedCategory === 'Todas' 
      ? dateMetrics.filteredDate
      : dateMetrics.filteredDate.filter(d => d.categoria === selectedCategory);
  
    const filteredDespesas = filteredByCategory.filter(d => 
      d.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.forma_pagamento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.banco?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    // ---------------------- CHART DATA ----------------------
    const dailyExpenses = useMemo(() => {
        const map: Record<string, { count: number; total: number }> = {};
        
        filteredDespesas.forEach(d => {
            if (!map[d.data]) map[d.data] = { count: 0, total: 0 };
            map[d.data].count += 1;
            map[d.data].total += Number(d.valor_real);
        });
  
        return Object.entries(map)
            .map(([date, val]) => ({ date, ...val }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [filteredDespesas]);
    
    // KPI Calculations
    const totalReal = filteredByCategory.reduce((acc, d) => acc + Number(d.valor_real), 0);
    const totalProjetado = filteredByCategory
      .filter(d => d.valor_projetado !== null)
      .reduce((acc, d) => acc + Number(d.valor_projetado), 0);
    
    const fixedExpenses = filteredByCategory.filter(d => d.categoria.includes('Fixa'));
    const variableExpenses = filteredByCategory.filter(d => d.categoria.includes('Variável'));
    
    const totalFixedReal = fixedExpenses.reduce((acc, d) => acc + Number(d.valor_real), 0);
    const totalVariableReal = variableExpenses.reduce((acc, d) => acc + Number(d.valor_real), 0);
    
    const budgetAdherence = totalProjetado > 0 
      ? ((totalProjetado - totalReal) / totalProjetado * 100).toFixed(1)
      : '0';
  
    const formatCurrency = (val: number) =>
      new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val);
  
    const isFixedCategory = formData.categoria.includes('Fixa');
    const isFiltered = !!(filters.year || filters.month || filters.days.length > 0);
  
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter">Sistema de Despesas</h1>
            <p className="text-slate-700 dark:text-slate-200 font-bold">Controlo de despesas fixas e variáveis</p>
          </div>
  
          <div className="flex items-center gap-3">
              {/* DATE FILTER */}
              <div className="flex items-center gap-2 mr-2">
                <SmartDateFilter 
                    filters={filters}
                    setFilters={setFilters}
                    availableFilters={dateMetrics.availableFilters as any}
                    counts={dateMetrics.counts}
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
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Todas">Todas Categorias</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                  <input 
                      type="text"
                      placeholder="Procurar despesa..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-32 md:w-48 lg:w-64 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold shadow-sm transition-all"
                  />
              </div>
              <button 
                  onClick={() => setIsFormOpen(true)}
                  className="flex items-center gap-3 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-purple-500/20 active:scale-95"
              >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Nova Despesa</span>
              </button>
          </div>
        </div>
  
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            label="Total Despesas"
            value={formatCurrency(totalReal)}
            icon={Wallet}
            trend={`${filteredByCategory.length} registos`}
            color="purple"
          />
          <KpiCard
            label="Despesas Fixas"
            value={formatCurrency(totalFixedReal)}
            icon={Target}
            trend={`${fixedExpenses.length} itens`}
            color="blue"
          />
          <KpiCard
            label="Despesas Variáveis"
            value={formatCurrency(totalVariableReal)}
            icon={TrendingDown}
            trend={`${variableExpenses.length} itens`}
            color="emerald"
          />
          <KpiCard
            label="Aderência Orçamento"
            value={`${budgetAdherence}%`}
            icon={AlertCircle}
            trend={totalProjetado > 0 ? `Projetado: ${formatCurrency(totalProjetado)}` : 'Sem orçamento'}
            color="orange"
          />
        </div>
  
        {/* CHART SECTION */}
        <div className="w-full">
            <DespesasPorDia dailyExpenses={dailyExpenses} />
        </div>
  
        <div className="glass rounded-[2.5rem] overflow-hidden border-slate-100 dark:border-white/5 shadow-xl">
           <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-950 dark:text-white">Registos Recentes</h3>
              <div className="px-4 py-1.5 bg-slate-100 dark:bg-white/5 rounded-full text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
                {filteredDespesas.length} encontrados
              </div>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Data</th>
                    <th className="px-4 py-4">Categoria</th>
                    <th className="px-4 py-4">Descrição</th>
                    <th className="px-4 py-4">Pagamento</th>
                    <th className="px-4 py-4 text-right">Projetado</th>
                    <th className="px-4 py-4 text-right">Real</th>
                    <th className="px-8 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                  {filteredDespesas.map((despesa: Despesa) => {
                    const cat = CATEGORIES.find(c => c.value === despesa.categoria);
                    const Icon = cat?.icon || Wallet;
                    
                    return (
                      <tr key={despesa.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-8 py-5 text-sm font-bold text-slate-600 dark:text-slate-400">
                          {new Date(despesa.data).toLocaleDateString('pt-PT')}
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-tight">
                              {despesa.categoria}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-5 max-w-xs">
                           <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{despesa.descricao || '-'}</p>
                        </td>
                        <td className="px-4 py-5">
                           <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-950 dark:text-white">{despesa.forma_pagamento || '-'}</span>
                              <span className="text-[10px] text-slate-400">{despesa.banco || '-'}</span>
                           </div>
                        </td>
                        <td className="px-4 py-5 text-right font-bold text-slate-600 dark:text-slate-400">
                          {despesa.valor_projetado ? formatCurrency(Number(despesa.valor_projetado)) : '-'}
                        </td>
                        <td className="px-4 py-5 text-right font-black text-slate-950 dark:text-white">
                          {formatCurrency(Number(despesa.valor_real))}
                        </td>
                        <td className="px-8 py-5 text-center">
                          <button 
                            onClick={() => deleteDespesa(despesa.id!)}
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
                          <Wallet className="text-white w-6 h-6" />
                      </div>
                      <div>
                          <h2 className="text-2xl font-black text-slate-950 dark:text-white tracking-tighter">Registar Despesa</h2>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Preencha os dados da despesa</p>
                      </div>
                   </div>
                   <button onClick={() => setIsFormOpen(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-colors">
                      <X className="w-6 h-6 text-slate-400" />
                   </button>
                </div>
  
                <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                          <input 
                            type="date" 
                            required 
                            value={formData.data} 
                            onChange={(e) => setFormData({...formData, data: e.target.value})} 
                            className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold" 
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                          <select 
                            value={formData.categoria} 
                            onChange={(e) => setFormData({...formData, categoria: e.target.value as any})} 
                            className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold"
                          >
                            {CATEGORIES.map(cat => (
                              <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                          </select>
                      </div>
                   </div>
  
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Forma de Pagamento</label>
                          <input 
                            type="text" 
                            value={formData.forma_pagamento} 
                            onChange={(e) => setFormData({...formData, forma_pagamento: e.target.value})} 
                            className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold" 
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Banco</label>
                          <input 
                            type="text" 
                            value={formData.banco} 
                            onChange={(e) => setFormData({...formData, banco: e.target.value})} 
                            className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold" 
                          />
                      </div>
                   </div>
  
                   <div className={`grid ${isFixedCategory ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
                      {isFixedCategory && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor Projetado</label>
                            <input 
                              type="number" 
                              step="0.01"
                              value={formData.valor_projetado || ''}
                              onChange={(e) => setFormData({...formData, valor_projetado: e.target.value ? Number(e.target.value) : null})} 
                              className="w-full px-4 py-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-black" 
                            />
                        </div>
                      )}
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor Real</label>
                          <input 
                            type="number" 
                            required 
                            step="0.01"
                            value={formData.valor_real || ''}
                            onChange={(e) => setFormData({...formData, valor_real: Number(e.target.value)})} 
                            className="w-full px-4 py-4 bg-white dark:bg-slate-900 border-2 border-purple-500/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-black" 
                          />
                      </div>
                   </div>
  
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição Detalhada</label>
                      <textarea 
                        rows={3}
                        value={formData.descricao} 
                        onChange={(e) => setFormData({...formData, descricao: e.target.value})} 
                        className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold resize-none" 
                      />
                   </div>
  
                   <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest disabled:opacity-50">
                      {isSubmitting ? 'A Processar...' : 'Registar Despesa'}
                   </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

