import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Banknote,
  Plus,
  Check,
  Search,
  TrendingUp,
  AlertCircle,
  Trash2,
  X,
  Calendar,
  User
} from "lucide-react";
import { KpiCard } from "../components/KpiCard";
import { supabase } from "../lib/supabase";

/* ---------------------- TYPE DEFINITIONS ---------------------- */
interface Emprestimo {
  id?: number;
  created_at?: string;
  pessoa: string;
  valor: number;
  data_pedido: string;
  data_pagamento?: string | null;
  estado: 'Pendente' | 'Pago';
  observacoes?: string;
}

export default function Emprestimos() {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Pendente' | 'Pago'>('Todos');

  const [formData, setFormData] = useState<Emprestimo>({
    pessoa: "",
    valor: 0,
    data_pedido: new Date().toISOString().split("T")[0],
    estado: 'Pendente',
    data_pagamento: null,
    observacoes: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEmprestimos();
  }, []);

  const fetchEmprestimos = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("loja_emprestimos")
        .select("*")
        .order("data_pedido", { ascending: false });

      if (data && !error) {
        setEmprestimos(data);
      }
    } catch (err) {
      console.error("Error fetching emprestimos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.valor <= 0 || !formData.pessoa) return;

    try {
      setIsSubmitting(true);
      
      // If marked as Paid immediately, set payment date to today if not provided
      const dataToInsert = {
        ...formData,
        data_pagamento: formData.estado === 'Pago' 
            ? (formData.data_pagamento || new Date().toISOString().split("T")[0]) 
            : null
      };

      const { error } = await supabase
        .from("loja_emprestimos")
        .insert([dataToInsert]);

      if (!error) {
        setIsFormOpen(false);
        setFormData({
            pessoa: "",
            valor: 0,
            data_pedido: new Date().toISOString().split("T")[0],
            estado: 'Pendente',
            data_pagamento: null,
            observacoes: ""
        });
        fetchEmprestimos();
      }
    } catch (err) {
      console.error("Error adding emprestimo:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteEmprestimo = async (id: number) => {
    if (!confirm("Tem certeza que deseja apagar este registo?")) return;
    try {
      const { error } = await supabase
        .from("loja_emprestimos")
        .delete()
        .eq("id", id);
      if (!error) fetchEmprestimos();
    } catch (err) {
      console.error("Error deleting emprestimo:", err);
    }
  };

  const markAsPaid = async (emprestimo: Emprestimo) => {
    if (!confirm(`Marcar empréstimo de ${emprestimo.pessoa} como PAGO?`)) return;
    try {
        const today = new Date().toISOString().split("T")[0];
        const { error } = await supabase
            .from('loja_emprestimos')
            .update({ 
                estado: 'Pago', 
                data_pagamento: today 
            })
            .eq('id', emprestimo.id);
        
        if (!error) fetchEmprestimos();
    } catch (err) {
        console.error("Error updating status:", err);
    }
  };

  // ---------------------- FILTERING LOGIC ----------------------
  const filteredEmprestimos = useMemo(() => {
      return emprestimos.filter(e => {
          const matchesSearch = e.pessoa.toLowerCase().includes(searchTerm.toLowerCase()) || 
                               (e.observacoes && e.observacoes.toLowerCase().includes(searchTerm.toLowerCase()));
          const matchesStatus = statusFilter === 'Todos' || e.estado === statusFilter;
          return matchesSearch && matchesStatus;
      });
  }, [emprestimos, searchTerm, statusFilter]);

  // KPI Calculations
  const totalEmprestado = emprestimos.reduce((acc, e) => acc + Number(e.valor), 0);
  const totalPago = emprestimos.filter(e => e.estado === 'Pago').reduce((acc, e) => acc + Number(e.valor), 0);
  const totalPendente = emprestimos.filter(e => e.estado === 'Pendente').reduce((acc, e) => acc + Number(e.valor), 0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(val);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter">
            Gestão de Empréstimos
          </h1>
          <p className="text-slate-700 dark:text-slate-200 font-bold">
            Controlo de dinheiro emprestado e pagamentos
          </p>
        </div>

        <div className="flex items-center gap-3">
            {/* Status Filter */}
            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
                {['Todos', 'Pendente', 'Pago'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status as any)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                            statusFilter === status 
                            ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-md' 
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
            <input
              type="text"
              placeholder="Procurar pessoa..."
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
            <span className="hidden sm:inline">Novo Empréstimo</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <KpiCard
          label="Total Emprestado"
          value={formatCurrency(totalEmprestado)}
          icon={Banknote}
          trend={`${emprestimos.length} registos`}
          color="blue"
        />
        <KpiCard
          label="Recebido (Pago)"
          value={formatCurrency(totalPago)}
          icon={TrendingUp}
          trend={`${((totalPago / totalEmprestado || 0) * 100).toFixed(1)}% recuperado`}
          color="emerald"
        />
        <KpiCard
          label="Pendente (A Receber)"
          value={formatCurrency(totalPendente)}
          icon={AlertCircle}
          trend={`${emprestimos.filter(e => e.estado === 'Pendente').length} por pagar`}
          color="amber"
        />
      </div>

      {/* TABLE */}
      <div className="glass rounded-[2.5rem] overflow-hidden border-slate-100 dark:border-white/5 shadow-xl">
        <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-950 dark:text-white">
            Histórico de Empréstimos
          </h3>
          <div className="px-4 py-1.5 bg-slate-100 dark:bg-white/5 rounded-full text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
            {filteredEmprestimos.length} registos
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <tr>
                <th className="px-8 py-4">Data Pedido</th>
                <th className="px-4 py-4">Pessoa</th>
                <th className="px-4 py-4">Valor</th>
                <th className="px-4 py-4 text-center">Estado</th>
                <th className="px-4 py-4">Data Pagamento</th>
                <th className="px-4 py-4">Observações</th>
                <th className="px-8 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {filteredEmprestimos.map((emp) => (
                  <tr
                    key={emp.id}
                    className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="px-8 py-5 text-sm font-bold text-slate-600 dark:text-slate-400">
                      {new Date(emp.data_pedido).toLocaleDateString("pt-PT")}
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs">
                            {emp.pessoa.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-black text-slate-950 dark:text-white">
                            {emp.pessoa}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-sm font-black text-slate-950 dark:text-white">
                      {formatCurrency(Number(emp.valor))}
                    </td>
                    <td className="px-4 py-5 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            emp.estado === 'Pendente' 
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' 
                                : 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                        }`}>
                            {emp.estado}
                        </span>
                    </td>
                    <td className="px-4 py-5 text-sm font-bold text-slate-500 dark:text-slate-400">
                        {emp.data_pagamento ? new Date(emp.data_pagamento).toLocaleDateString("pt-PT") : '-'}
                    </td>
                    <td className="px-4 py-5 text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
                        {emp.observacoes || '-'}
                    </td>
                    <td className="px-8 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                            {emp.estado === 'Pendente' && (
                                <button
                                    onClick={() => markAsPaid(emp)}
                                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-xl transition-all"
                                    title="Marcar como Pago"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                            )}
                            
                            <button
                                onClick={() => deleteEmprestimo(emp.id!)}
                                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                title="Apagar"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </td>
                  </tr>
              ))}
              {filteredEmprestimos.length === 0 && (
                  <tr>
                      <td colSpan={7} className="px-8 py-12 text-center text-slate-400 text-sm">
                          Nenhum empréstimo encontrado.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-950 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/40">
                    <Banknote className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-950 dark:text-white tracking-tighter">
                      Novo Empréstimo
                    </h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                      Registar saída de dinheiro
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
                <div className="space-y-4">
                    {/* Status Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-950 dark:text-white">Estado do Pagamento</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                                {formData.estado === 'Pago' ? 'Pago no momento' : 'Fica Pendente'}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({
                                ...prev,
                                estado: prev.estado === 'Pago' ? 'Pendente' : 'Pago'
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

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                Data Pedido
                            </label>
                            <div className="relative mt-1">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    required
                                    value={formData.data_pedido}
                                    onChange={(e) => setFormData({ ...formData, data_pedido: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all dark:text-white"
                                />
                            </div>
                        </div>
                        {formData.estado === 'Pago' && (
                             <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Data Pagamento
                                </label>
                                <div className="relative mt-1">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="date"
                                        value={formData.data_pagamento || ''}
                                        onChange={(e) => setFormData({ ...formData, data_pagamento: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all dark:text-white"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Pessoa
                        </label>
                        <div className="relative mt-1">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                required
                                placeholder="Nome da pessoa"
                                value={formData.pessoa}
                                onChange={(e) => setFormData({ ...formData, pessoa: e.target.value })}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Valor (€)
                        </label>
                        <div className="relative mt-1">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">€</span>
                            <input
                                type="number"
                                step="0.01"
                                required
                                placeholder="0.00"
                                value={formData.valor || ''}
                                onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) })}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Observações
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Notas adicionais..."
                            value={formData.observacoes || ''}
                            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                            className="w-full mt-1 px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all dark:text-white resize-none"
                        />
                    </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "A Guardar..." : "Guardar Empréstimo"}
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
