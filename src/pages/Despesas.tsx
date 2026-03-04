/* ---------------------- IMPORTS ---------------------- */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Plus,
  Check,
  Search,
  TrendingDown,
  Target,
  AlertCircle,
  Trash2,
  X,
  Home,
  Store,
  Users,
  EyeOff,
  Settings,
  FileImage,
  FileText,
  Upload,
  Loader2,
  Pencil
} from "lucide-react";
import { KpiCard } from "../components/KpiCard";
import { supabase } from "../lib/supabase";
import { SmartDateFilter } from "../components/SmartDateFilter";
import { DespesasPorDia } from "../components/DespesasPorDia";
import { uploadToSupabase } from "../lib/upload";


/* ---------------------- TYPE DEFINITIONS ---------------------- */
interface Despesa {
  id?: number;
  data: string;
  categoria:
    | "Casa Fixa"
    | "Casa Variável"
    | "Loja Fixa"
    | "Loja Variável"
    | "Pessoal Fixa"
    | "Pessoal Variável";
  tipo?: string;
  forma_pagamento: string;
  banco: string;
  valor_projetado: number | null;
  valor_real: number;
  descricao: string;
  estado?: 'Pendente' | 'Pago';
  data_pagamento?: string | null;
  fatura_url?: string | null;
  comprovativo_url?: string | null;
  created_at?: string;
}

const EXPENSE_TYPES: Record<string, string[]> = {
  "Casa Fixa": [
    "Renda",
    "Eletricidade",
    "Água",
    "Gás",
    "Internet/TV",
    "Condomínio",
    "Empregada",
    "Alarme",
  ],
  "Casa Variável": [
    "Supermercado",
    "Farmácia",
    "Manutenção",
    "Decoração",
    "Outros",
  ],
  "Loja Fixa": [
    "Renda Loja",
    "Eletricidade Loja",
    "Água Loja",
    "Software",
    "Contabilidade",
    "Seguros",
    "Salários",
    "Internet Loja",
  ],
  "Loja Variável": [
    "Mercadoria",
    "Manutenção",
    "Marketing",
    "Material Escritório",
    "Limpeza",
    "Outros",
  ],
  "Pessoal Fixa": [
    "Ginásio",
    "Subscrições",
    "Propinas",
    "Seguros Pessoais",
    "Créditos",
  ],
  "Pessoal Variável": [
    "Restaurantes",
    "Viagens",
    "Vestuário",
    "Presentes",
    "Lazer",
    "Saúde",
    "Outros",
  ],
};

interface FilterState {
  year: string;
  month: string;
  days: string[];
}

const CATEGORIES = [
  { value: "Casa Fixa", label: "Casa Fixa", icon: Home, color: "blue" },
  {
    value: "Casa Variável",
    label: "Casa Variável",
    icon: Home,
    color: "indigo",
  },
  { value: "Loja Fixa", label: "Loja Fixa", icon: Store, color: "purple" },
  {
    value: "Loja Variável",
    label: "Loja Variável",
    icon: Store,
    color: "violet",
  },
  {
    value: "Pessoal Fixa",
    label: "Pessoal Fixa",
    icon: Users,
    color: "emerald",
  },
  {
    value: "Pessoal Variável",
    label: "Pessoal Variável",
    icon: Users,
    color: "teal",
  },
];

export default function Despesas() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");

  // Date Filters
  const [filters, setFilters] = useState<FilterState>({
    year: "",
    month: "",
    days: [],
  });

  const [hiddenTypes, setHiddenTypes] = useState<string[]>(() => {
    const saved = localStorage.getItem("hiddenExpenseTypes");
    return saved ? JSON.parse(saved) : [];
  });

  const [budgetMap, setBudgetMap] = useState<Record<string, Record<string, number>>>({});
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [addingBudgetCategory, setAddingBudgetCategory] = useState<string | null>(null);
  const [newBudgetTypeName, setNewBudgetTypeName] = useState("");



  // Dynamic Expense Types: Merge defaults with existing data
  const availableTypes = useMemo(() => {
    const types = JSON.parse(JSON.stringify(EXPENSE_TYPES)); // Deep copy defaults
    
    despesas.forEach(d => {
        if (d.tipo && d.categoria && types[d.categoria]) {
            if (!types[d.categoria].includes(d.tipo) && !hiddenTypes.includes(d.tipo)) {
                types[d.categoria].push(d.tipo);
            }
        }
    });
    
    // Sort all lists & remove hidden defaults
    Object.keys(types).forEach(cat => {
        // Also include types from budgetMap if not present
        if (budgetMap[cat]) {
            Object.keys(budgetMap[cat]).forEach(type => {
                if (!types[cat].includes(type) && !hiddenTypes.includes(type)) {
                    types[cat].push(type);
                }
            });
        }
        types[cat] = types[cat].filter((t: string) => !hiddenTypes.includes(t));
        types[cat].sort();
    });

    return types;
  }, [despesas, hiddenTypes, budgetMap]);

  const toggleHideType = (typeToHide: string) => {
    if (confirm(`Ocultar "${typeToHide}" da lista de sugestões?`)) {
        const newHidden = [...hiddenTypes, typeToHide];
        setHiddenTypes(newHidden);
        localStorage.setItem("hiddenExpenseTypes", JSON.stringify(newHidden));
    }
  };



  const [formData, setFormData] = useState<Despesa>({
    data: new Date().toISOString().split("T")[0],
    categoria: "Casa Fixa",
    tipo: "",
    forma_pagamento: "",
    banco: "",
    valor_projetado: null,
    valor_real: 0,
    descricao: "",
    estado: "Pago",
    data_pagamento: new Date().toISOString().split("T")[0],
    fatura_url: null,
    comprovativo_url: null,
  });

  const [showTypeSuggestions, setShowTypeSuggestions] = useState(false);
  const [isAddingNewType, setIsAddingNewType] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFatura, setUploadingFatura] = useState(false);
  const [uploadingComprovativo, setUploadingComprovativo] = useState(false);


  useEffect(() => {
    fetchDespesas();
    fetchBudget();
  }, []);

  const fetchBudget = async () => {
    try {
        const { data, error } = await supabase.from('loja_orcamento').select('*');
        if (data && !error) {
            const newMap: Record<string, Record<string, number>> = {};
            data.forEach((item: any) => {
                if (!newMap[item.categoria]) newMap[item.categoria] = {};
                newMap[item.categoria][item.tipo] = Number(item.valor_projetado);
            });
            setBudgetMap(newMap);
        }
    } catch (error) {
        console.error("Error fetching budget:", error);
    }
  };

  // Auto-fill Projected Value
  useEffect(() => {
    if (formData.categoria && formData.tipo) {
        const budget = budgetMap[formData.categoria]?.[formData.tipo];
        if (budget !== undefined) {
             setFormData(prev => ({ ...prev, valor_projetado: budget }));
        }
    }
  }, [formData.categoria, formData.tipo, budgetMap]);

  const fetchDespesas = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("loja_despesas")
        .select("*")
        .order("data", { ascending: false });

      if (data && !error) {
        setDespesas(data);
      }
    } catch (err) {
      console.error("Error fetching despesas:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'fatura' | 'comprovativo'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (type === 'fatura') setUploadingFatura(true);
      else setUploadingComprovativo(true);

      const url = await uploadToSupabase(file, 'despesas');
      
      if (url) {
        setFormData(prev => ({
          ...prev,
          [type === 'fatura' ? 'fatura_url' : 'comprovativo_url']: url
        }));
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      alert(`Erro ao fazer carregamento do(a) ${type}. Tente novamente.`);
    } finally {
      if (type === 'fatura') setUploadingFatura(false);
      else setUploadingComprovativo(false);
    }
  };

  const handleEdit = (despesa: Despesa) => {
    setFormData({
      ...despesa,
      estado: despesa.estado || 'Pago',
      data_pagamento: despesa.data_pagamento || null,
      fatura_url: despesa.fatura_url || null,
      comprovativo_url: despesa.comprovativo_url || null
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.valor_real <= 0) return;

    try {
      setIsSubmitting(true);
      const dataToInsert = {
        ...formData,
        valor_projetado: formData.valor_projetado,
      };

      let error;
      if (formData.id) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("loja_despesas")
          .update(dataToInsert)
          .eq("id", formData.id);
        error = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from("loja_despesas")
          .insert([dataToInsert]);
        error = insertError;
      }

      if (!error) {
        setIsFormOpen(false);
        setFormData({
          data: new Date().toISOString().split("T")[0],
          categoria: "Casa Fixa",
          tipo: "",
          forma_pagamento: "",
          banco: "",
          valor_projetado: null,
          valor_real: 0,
          descricao: "",
          estado: "Pago",
          data_pagamento: new Date().toISOString().split("T")[0],
          fatura_url: null,
          comprovativo_url: null,
        });
        fetchDespesas();
      } else {
        console.error('Database error:', error);
        alert(`Erro ao guardar despesa: ${error.message}\n\nVerifique se as colunas 'fatura_url' e 'comprovativo_url' foram criadas na tabela 'loja_despesas'.`);
      }
    } catch (err: any) {
      console.error("Error adding despesa:", err);
      alert('Ocorreu um erro inesperado ao salvar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const markAsPaid = async (despesa: Despesa) => {
    if (!confirm("Marcar esta despesa como PAGA?")) return;
    try {
        const today = new Date().toISOString().split("T")[0];
        const { error } = await supabase
            .from('loja_despesas')
            .update({ 
                estado: 'Pago', 
                data_pagamento: today 
            })
            .eq('id', despesa.id);
        
        if (!error) fetchDespesas();
    } catch (err) {
        console.error("Error updating status:", err);
    }
  };

  const deleteDespesa = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta despesa?")) return;
    try {
      const { error } = await supabase
        .from("loja_despesas")
        .delete()
        .eq("id", id);
      if (!error) fetchDespesas();
    } catch (err) {
      console.error("Error deleting despesa:", err);
    }
  };

  const deleteBudgetType = async (cat: string, type: string) => {
    if (!confirm(`Remover "${type}" do orçamento de ${cat}?`)) return;
    try {
        // 1. Delete from Supabase
        const { error } = await supabase
            .from('loja_orcamento')
            .delete()
            .eq('categoria', cat)
            .eq('tipo', type);
        
        if (!error) {
            // 2. Update local state
            setBudgetMap(prev => {
                const newMap = { ...prev };
                if (newMap[cat]) {
                    delete newMap[cat][type];
                }
                return newMap;
            });

            // 3. Hide from suggestions (to prevent it from coming back if it's a default)
            const newHidden = [...hiddenTypes, type];
            setHiddenTypes(newHidden);
            localStorage.setItem("hiddenExpenseTypes", JSON.stringify(newHidden));
        }
    } catch (err) {
        console.error("Error deleting budget type:", err);
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
    despesas.forEach((d) => {
      const date = new Date(d.data);
      const y = date.getFullYear().toString();
      allYears.add(y);
      yearCounts[y] = (yearCounts[y] || 0) + 1;
    });

    // Second pass: Calculate months based on SELECTED YEAR
    if (filters.year) {
      despesas.forEach((d) => {
        const date = new Date(d.data);
        const y = date.getFullYear().toString();
        if (y === filters.year) {
          const m = (date.getMonth() + 1).toString().padStart(2, "0");
          allMonths.add(m);
          monthCounts[m] = (monthCounts[m] || 0) + 1;
        }
      });
    }

    // Third pass: Calculate days based on SELECTED MONTH + YEAR
    if (filters.year && filters.month) {
      despesas.forEach((d) => {
        const date = new Date(d.data);
        const y = date.getFullYear().toString();
        const m = (date.getMonth() + 1).toString().padStart(2, "0");
        if (y === filters.year && m === filters.month) {
          const day = date.getDate().toString().padStart(2, "0");
          dayCounts[day] = (dayCounts[day] || 0) + 1;
        }
      });
    }

    // Apply Date Filter to produce filtered list
    let filtered = despesas;
    if (filters.year) {
      filtered = filtered.filter((d) => d.data.startsWith(filters.year));
    }
    if (filters.year && filters.month) {
      filtered = filtered.filter((d) => {
        const [, m] = d.data.split("-"); // Format YYYY-MM-DD
        return m === filters.month;
      });
    }
    if (filters.year && filters.month && filters.days.length > 0) {
      filtered = filtered.filter((d) => {
        const [, , day] = d.data.split("-");
        return filters.days.includes(day);
      });
    }

    return {
      filteredDate: filtered,
      availableFilters: {
        years: Array.from(allYears).sort().reverse(),
        months: Array.from(allMonths).sort(),
        days: [], // Handled by UI mostly, or we could populate
      },
      counts: {
        years: yearCounts,
        months: monthCounts,
        days: dayCounts,
      },
    };
  }, [despesas, filters]);

  // Chain filters: Date -> Category -> Search
  const filteredByCategory =
    selectedCategory === "Todas"
      ? dateMetrics.filteredDate
      : dateMetrics.filteredDate.filter(
          (d) => d.categoria === selectedCategory,
        );

  const filteredDespesas = filteredByCategory.filter(
    (d) =>
      d.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.forma_pagamento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.banco?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ---------------------- CHART DATA ----------------------
  const dailyExpenses = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};

    filteredDespesas.forEach((d) => {
      if (!map[d.data]) map[d.data] = { count: 0, total: 0 };
      map[d.data].count += 1;
      map[d.data].total += Number(d.valor_real);
    });

    return Object.entries(map)
      .map(([date, val]) => ({ date, ...val }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredDespesas]);

  // KPI Calculations
  const totalReal = filteredByCategory.reduce(
    (acc, d) => acc + Number(d.valor_real),
    0,
  );
  const totalProjetado = filteredByCategory
    .filter((d) => d.valor_projetado !== null)
    .reduce((acc, d) => acc + Number(d.valor_projetado), 0);

  const fixedExpenses = filteredByCategory.filter((d) =>
    d.categoria.includes("Fixa"),
  );
  const variableExpenses = filteredByCategory.filter((d) =>
    d.categoria.includes("Variável"),
  );

  const totalFixedReal = fixedExpenses.reduce(
    (acc, d) => acc + Number(d.valor_real),
    0,
  );
  const totalVariableReal = variableExpenses.reduce(
    (acc, d) => acc + Number(d.valor_real),
    0,
  );

  const budgetAdherence =
    totalProjetado > 0
      ? (((totalProjetado - totalReal) / totalProjetado) * 100).toFixed(1)
      : "0";

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(val);

  const isFixedCategory = true; // Always show projected value field as requested
  const isFiltered = !!(
    filters.year ||
    filters.month ||
    filters.days.length > 0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter">
            Sistema de Despesas
          </h1>
          <p className="text-slate-700 dark:text-slate-200 font-bold">
            Controlo de despesas fixas e variáveis
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* DATE FILTER */}
          <div className="flex items-center gap-2 mr-2">
            <SmartDateFilter
              filters={filters}
              setFilters={setFilters}
              availableFilters={dateMetrics.availableFilters as any}
              counts={dateMetrics.counts}
              itemLabel="Despesas"
            />

            {isFiltered && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, year: "", month: "", days: [] }))}
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
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
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
             onClick={() => setIsBudgetModalOpen(true)}
             className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-200 rounded-2xl transition-all shadow-sm hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95"
             title="Definir Orçamento"
          >
            <Settings className="w-5 h-5" />
          </button>
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
          trend={
            totalProjetado > 0
              ? `Projetado: ${formatCurrency(totalProjetado)}`
              : "Sem orçamento"
          }
          color="orange"
        />
      </div>

      {/* CHART SECTION */}
      <div className="w-full">
        <DespesasPorDia dailyExpenses={dailyExpenses} />
      </div>

      <div className="glass rounded-[2.5rem] overflow-hidden border-slate-100 dark:border-white/5 shadow-xl">
        <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-950 dark:text-white">
            Registos Recentes
          </h3>
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
                <th className="px-4 py-4 text-center">Estado</th>
                <th className="px-4 py-4 text-center">Anexos</th>
                <th className="px-4 py-4 text-right">Projetado</th>
                <th className="px-4 py-4 text-right">Real</th>
                <th className="px-8 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {filteredDespesas.map((despesa: Despesa) => {
                const cat = CATEGORIES.find(
                  (c) => c.value === despesa.categoria,
                );
                const Icon = cat?.icon || Wallet;

                return (
                  <tr
                    key={despesa.id}
                    className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="px-8 py-5 text-sm font-bold text-slate-600 dark:text-slate-400">
                      {new Date(despesa.data).toLocaleDateString("pt-PT")}
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-tight">
                            {despesa.categoria}
                          </span>
                        </div>
                        {despesa.tipo && (
                          <span className="text-[10px] bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full w-fit font-bold uppercase tracking-wide ml-6">
                            {despesa.tipo}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-5 max-w-xs">
                      <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                        {despesa.descricao || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-950 dark:text-white">
                          {despesa.forma_pagamento || "-"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {despesa.banco || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            despesa.estado === 'Pendente' 
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' 
                                : 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                        }`}>
                            {despesa.estado || 'Pago'}
                        </span>
                    </td>
                    <td className="px-4 py-5 text-center">
                       <div className="flex items-center justify-center gap-2">
                          {despesa.fatura_url ? (
                             <a href={despesa.fatura_url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors" title="Ver Fatura">
                                <FileText className="w-4 h-4" />
                             </a>
                          ) : (
                             <span className="p-1.5 opacity-20"><FileText className="w-4 h-4" /></span>
                          )}
                          {despesa.comprovativo_url ? (
                             <a href={despesa.comprovativo_url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors" title="Ver Comprovativo">
                                <FileImage className="w-4 h-4" />
                             </a>
                          ) : (
                             <span className="p-1.5 opacity-20"><FileImage className="w-4 h-4" /></span>
                          )}
                       </div>
                    </td>
                    <td className="px-4 py-5 text-right font-bold text-slate-600 dark:text-slate-400">
                      {despesa.valor_projetado
                        ? formatCurrency(Number(despesa.valor_projetado))
                        : "-"}
                    </td>
                    <td className="px-4 py-5 text-right font-black text-slate-950 dark:text-white">
                      {formatCurrency(Number(despesa.valor_real))}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(despesa)}
                          className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteDespesa(despesa.id!)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {despesa.estado === 'Pendente' && (
                            <button
                              onClick={() => markAsPaid(despesa)}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-xl transition-all"
                              title="Marcar como Pago"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isBudgetModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white dark:bg-slate-950 w-full max-w-4xl rounded-[3rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh]"
                >
                    <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex justify-between items-center">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/40">
                                <Target className="text-white w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-950 dark:text-white tracking-tighter">Orçamento de Despesas</h2>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Defina os valores previstos para cada tipo</p>
                            </div>
                         </div>
                         <button onClick={() => setIsBudgetModalOpen(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-colors">
                            <X className="w-6 h-6 text-slate-400" />
                         </button>
                    </div>
                    
                    <div className="p-8 overflow-y-auto space-y-8">
                       {['Casa Fixa', 'Casa Variável', 'Loja Fixa', 'Loja Variável', 'Pessoal Fixa', 'Pessoal Variável'].map(cat => (
                           <div key={cat} className="space-y-4">
                               <div className="flex items-center gap-2 mb-4">
                                   <div className={`w-8 h-1 rounded-full ${cat.includes('Casa') ? 'bg-blue-500' : cat.includes('Loja') ? 'bg-purple-500' : 'bg-emerald-500'}`} />
                                   <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">{cat}</h3>
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                   {availableTypes[cat]?.map((type: string) => (
                                       <div key={type} className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 relative group">
                                            <div className="flex justify-between items-center pr-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{type}</label>
                                                <button 
                                                    onClick={() => deleteBudgetType(cat, type)}
                                                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    title="Eliminar categoria"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">€</span>
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    defaultValue={budgetMap[cat]?.[type] || ''}
                                                    onBlur={async (e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val)) {
                                                            // Optimistic update
                                                            setBudgetMap(prev => ({
                                                                ...prev,
                                                                [cat]: { ...(prev[cat] || {}), [type]: val }
                                                            }));
                                                            
                                                            // Persist to Supabase
                                                            await supabase.from('loja_orcamento').upsert({
                                                                categoria: cat,
                                                                tipo: type,
                                                                valor_projetado: val
                                                            }, { onConflict: 'categoria, tipo' });
                                                        }
                                                    }}
                                                    className="w-full pl-8 pr-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                />
                                            </div>
                                       </div>
                                   ))}
                                   
                                   {/* Add New Type Button */}
                                   <div className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-colors">
                                        {addingBudgetCategory === cat ? (
                                            <div className="flex flex-col gap-2 h-full justify-center">
                                                <input 
                                                    autoFocus
                                                    type="text"
                                                    placeholder="Nome do tipo..."
                                                    value={newBudgetTypeName}
                                                    onChange={(e) => setNewBudgetTypeName(e.target.value)}
                                                    onKeyDown={async (e) => {
                                                        if (e.key === 'Enter' && newBudgetTypeName.trim()) {
                                                            const typeName = newBudgetTypeName.trim();
                                                            // Optimistic update
                                                            setBudgetMap(prev => ({
                                                                ...prev,
                                                                [cat]: { ...(prev[cat] || {}), [typeName]: 0 }
                                                            }));
                                                            // Persist
                                                            await supabase.from('loja_orcamento').upsert({
                                                                categoria: cat,
                                                                tipo: typeName,
                                                                valor_projetado: 0
                                                            }, { onConflict: 'categoria, tipo' });
                                                            
                                                            setAddingBudgetCategory(null);
                                                            setNewBudgetTypeName("");
                                                        } else if (e.key === 'Escape') {
                                                            setAddingBudgetCategory(null);
                                                            setNewBudgetTypeName("");
                                                        }
                                                    }}
                                                    className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={async () => {
                                                            if (newBudgetTypeName.trim()) {
                                                                const typeName = newBudgetTypeName.trim();
                                                                setBudgetMap(prev => ({
                                                                    ...prev,
                                                                    [cat]: { ...(prev[cat] || {}), [typeName]: 0 }
                                                                }));
                                                                await supabase.from('loja_orcamento').upsert({
                                                                    categoria: cat,
                                                                    tipo: typeName,
                                                                    valor_projetado: 0
                                                                }, { onConflict: 'categoria, tipo' });
                                                                setAddingBudgetCategory(null);
                                                                setNewBudgetTypeName("");
                                                            }
                                                        }}
                                                        className="flex-1 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-bold"
                                                    >
                                                        Adicionar
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setAddingBudgetCategory(null);
                                                            setNewBudgetTypeName("");
                                                        }}
                                                        className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => setAddingBudgetCategory(cat)}
                                                className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors py-2"
                                            >
                                                <Plus className="w-6 h-6" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Adicionar</span>
                                            </button>
                                        )}
                                   </div>
                               </div>
                           </div>
                       ))}
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

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
                        <h2 className="text-2xl font-black text-slate-950 dark:text-white tracking-tighter">
                          {formData.id ? 'Editar Despesa' : 'Registar Despesa'}
                        </h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                          {formData.id ? 'Atualize os dados da despesa' : 'Controlo de gastos e pagamentos'}
                        </p>
                      </div>
                 </div>
                 <button onClick={() => setIsFormOpen(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-colors">
                    <X className="w-6 h-6 text-slate-400" />
                 </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="p-8 space-y-8 overflow-y-auto max-h-[70vh]"
              >
                {/* STATUS TOGGLE */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                    <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-950 dark:text-white">Estado do Pagamento</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                            {formData.estado === 'Pago' ? 'A despesa já foi paga' : 'Ainda não foi paga (Pendente)'}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                            ...prev,
                            estado: prev.estado === 'Pago' ? 'Pendente' : 'Pago',
                            data_pagamento: prev.estado === 'Pago' ? null : new Date().toISOString().split("T")[0]
                        }))}
                        className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                            formData.estado === 'Pago' ? 'bg-green-500' : 'bg-amber-400'
                        }`}
                    >
                        <motion.div
                            layout
                            className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                            animate={{ left: formData.estado === 'Pago' ? 28 : 4 }}
                        />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Data
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.data}
                      onChange={(e) =>
                        setFormData({ ...formData, data: e.target.value })
                      }
                      className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Categoria
                    </label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => {
                        const newCategory = e.target.value as any;
                        setFormData({
                          ...formData,
                          categoria: newCategory,
                          tipo: "", // Reset type when category changes
                        });
                      }}
                      className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 relative">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Tipo de Despesa
                      </label>
                      <div className="flex gap-2 relative">
                        {isAddingNewType ? (
                            <>
                                <input
                                    type="text"
                                    autoFocus
                                    value={formData.tipo || ""}
                                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                    placeholder="Nome do novo tipo..."
                                    className="flex-1 px-4 py-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-500/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold text-purple-700 dark:text-purple-300 placeholder-purple-300"
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsAddingNewType(false)}
                                    className="p-4 bg-green-100 hover:bg-green-200 dark:bg-green-500/20 dark:hover:bg-green-500/30 text-green-600 dark:text-green-400 rounded-2xl transition-colors"
                                    title="Confirmar"
                                >
                                    <Check className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddingNewType(false);
                                        setFormData({ ...formData, tipo: '' });
                                    }}
                                    className="p-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 rounded-2xl transition-colors"
                                    title="Cancelar"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={formData.tipo || ""}
                                    onChange={(e) => {
                                    setFormData({ ...formData, tipo: e.target.value });
                                    setShowTypeSuggestions(true);
                                    }}
                                    onFocus={() => setShowTypeSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowTypeSuggestions(false), 200)}
                                    placeholder="Ex: Renda, Eletricidade..."
                                    className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold"
                                />
                                {showTypeSuggestions && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto">
                                    {availableTypes[formData.categoria]
                                        ?.filter((t: string) =>
                                        t
                                            .toLowerCase()
                                            .includes((formData.tipo || "").toLowerCase()),
                                        )
                                        .map((type: string) => (
                                        <div key={type} className="flex items-center w-full hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group/item">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                setFormData({ ...formData, tipo: type });
                                                setShowTypeSuggestions(false);
                                                }}
                                                className="flex-1 text-left px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200"
                                            >
                                                {type}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleHideType(type);
                                                }}
                                                className="p-2 mr-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover/item:opacity-100 transition-all"
                                                title="Ocultar tipo"
                                            >
                                                <EyeOff className="w-3 h-3" />
                                            </button>
                                        </div>
                                        ))}
                                    </div>
                                )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddingNewType(true);
                                        setFormData({...formData, tipo: ''});
                                    }}
                                    className="px-4 py-4 bg-purple-100 hover:bg-purple-200 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 text-purple-600 dark:text-purple-400 rounded-2xl transition-colors flex items-center gap-2"
                                    title="Criar novo tipo"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">Adicionar</span>
                                </button>
                            </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Banco
                      </label>
                      <input
                        type="text"
                        value={formData.banco}
                        onChange={(e) =>
                          setFormData({ ...formData, banco: e.target.value })
                        }
                        className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold"
                      />
                    </div>
                  </div>

                <div
                  className={`grid ${isFixedCategory ? "grid-cols-2" : "grid-cols-1"} gap-6`}
                >
                  {isFixedCategory && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Valor Projetado
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.valor_projetado || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            valor_projetado: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        className="w-full px-4 py-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-black"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Valor Real
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.valor_real || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          valor_real: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-4 bg-white dark:bg-slate-900 border-2 border-purple-500/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-black"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Descrição Detalhada
                  </label>
                  <textarea
                    rows={2}
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao: e.target.value })
                    }
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                   <div className="flex flex-col gap-3">
                       <span className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                           <FileText className="w-4 h-4 text-blue-500" />
                           Fatura
                       </span>
                       <label className={`
                           flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer
                           ${formData.fatura_url ? 'border-blue-500/50 bg-blue-50/50' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'}
                           ${uploadingFatura ? 'opacity-50 pointer-events-none' : ''}
                       `}>
                           <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'fatura')} />
                           {uploadingFatura ? (
                               <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
                           ) : formData.fatura_url ? (
                               <Check className="w-6 h-6 text-blue-500 mb-2" />
                           ) : (
                               <Upload className="w-6 h-6 text-slate-400 mb-2" />
                           )}
                            <span className="text-xs font-bold text-slate-600 text-center">
                                {uploadingFatura ? 'A carregar...' : formData.fatura_url ? 'Fatura Anexada' : 'Clique para anexar Fatura'}
                            </span>
                        </label>
                        {formData.fatura_url && (
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, fatura_url: null }))}
                                className="flex items-center justify-center gap-2 py-2 text-rose-500 hover:text-rose-600 font-bold transition-all text-[10px] uppercase tracking-wider"
                            >
                                <Trash2 className="w-3 h-3" />
                                <span>Remover Fatura</span>
                            </button>
                        )}
                    </div>
                   
                   <div className="flex flex-col gap-3">
                       <span className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                           <FileImage className="w-4 h-4 text-emerald-500" />
                           Comprovativo
                       </span>
                       <label className={`
                           flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer
                           ${formData.comprovativo_url ? 'border-emerald-500/50 bg-emerald-50/50' : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50'}
                           ${uploadingComprovativo ? 'opacity-50 pointer-events-none' : ''}
                       `}>
                           <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'comprovativo')} />
                           {uploadingComprovativo ? (
                               <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
                           ) : formData.comprovativo_url ? (
                               <Check className="w-6 h-6 text-emerald-500 mb-2" />
                           ) : (
                               <Upload className="w-6 h-6 text-slate-400 mb-2" />
                           )}
                            <span className="text-xs font-bold text-slate-600 text-center">
                                {uploadingComprovativo ? 'A carregar...' : formData.comprovativo_url ? 'Comprovativo Anexado' : 'Clique para anexar Comprovativo'}
                            </span>
                        </label>
                        {formData.comprovativo_url && (
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, comprovativo_url: null }))}
                                className="flex items-center justify-center gap-2 py-2 text-rose-500 hover:text-rose-600 font-bold transition-all text-[10px] uppercase tracking-wider"
                            >
                                <Trash2 className="w-3 h-3" />
                                <span>Remover Comprovativo</span>
                            </button>
                        )}
                    </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest disabled:opacity-50"
                >
                  {isSubmitting ? "A Processar..." : "Registar Despesa"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
