import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Save, 
  User, 
  Instagram, 
  MapPin, 
  Package, 
  Search,
  CheckCircle2,
  Calendar,
  Tag,
  ClipboardList,
  UserPlus,
  X as CloseIcon
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useDashboardData } from '../hooks/useDashboardData';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

interface SaleItem {
  id: string;
  ref: string;
  designacao: string;
  pvp: number;
  base: number;
  lucro: number;
  desconto: number;
  quantidade: number;
}

export default function CadastroVendas() {
  const { data, addSale, addCustomer, isLoading: isGlobalLoading } = useData();
  const { allCustomers } = useDashboardData();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // New Customer Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerInsta, setNewCustomerInsta] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  
  // Form State
  const [dataVenda, setDataVenda] = useState(new Date().toISOString().split('T')[0]);
  const [idVenda, setIdVenda] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  
  // Product Search State
  const [activeProductSearchId, setActiveProductSearchId] = useState<string | null>(null);
  
  const allProducts = useMemo(() => [
    ...(data.products_catalog || []),
    ...(data.manual_products_catalog || [])
  ], [data.products_catalog, data.manual_products_catalog]);

  const [items, setItems] = useState<SaleItem[]>([
    { id: Math.random().toString(36).substr(2, 9), ref: '', designacao: '', pvp: 0, base: 0, lucro: 0, desconto: 0, quantidade: 1 }
  ]);
  
  const [formaPagamento, setFormaPagamento] = useState('MB Way');
  const [siteKyte, setSiteKyte] = useState('KYTE');
  const [lojaCtt, setLojaCtt] = useState('CTT');
  const [localidade, setLocalidade] = useState('');

  // Dropdown filtering
  const filteredCustomers = useMemo(() => {
    if (!searchTerm || selectedCustomer) return [];
    const search = searchTerm.toLowerCase();
    return allCustomers.filter(c => 
      c.name.toLowerCase().includes(search) || 
      c.instagram.toLowerCase().includes(search)
    ).slice(0, 5);
  }, [searchTerm, allCustomers, selectedCustomer]);

  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setSearchTerm(customer.name);
    setLocalidade(customer.address || '');
    setIsCustomerDropdownOpen(false);
  };

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(36).substr(2, 9), ref: '', designacao: '', pvp: 0, base: 0, lucro: 0, desconto: 0, quantidade: 1 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof SaleItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        
        // Auto-fill product info if Ref changes
        if (field === 'ref' && value) {
          const cleanRef = String(value).trim().toUpperCase();
          const catalogItem = [
            ...(data.products_catalog || []),
            ...(data.manual_products_catalog || [])
          ].find(p => p.ref.toUpperCase() === cleanRef);
          
          if (catalogItem) {
            updated.designacao = catalogItem.nome_artigo;
            updated.pvp = catalogItem.pvp_cica;
            updated.base = catalogItem.base_price || (catalogItem.pvp_cica - catalogItem.lucro_meu_faturado);
            updated.lucro = Number((updated.pvp - updated.base).toFixed(2));
          }
        }

        // Auto-calculate profit if pvp, base, or discount changes
        if (field === 'pvp' || field === 'base' || field === 'desconto') {
          const p = field === 'pvp' ? Number(value) : item.pvp;
          const b = field === 'base' ? Number(value) : item.base;
          const d = field === 'desconto' ? Number(value) : item.desconto;
          // Lucro = PVP - Base - Desconto
          updated.lucro = Number((p - b - d).toFixed(2));
        }
        return updated;
      }
      return item;
    }));
  };

  const selectProduct = (id: string, product: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const pvp = product.pvp_cica || 0;
        const base = product.base_price || (product.pvp_cica - product.lucro_meu_faturado) || 0;
        const lucro = Number((pvp - base).toFixed(2));
        
        return {
          ...item,
          ref: product.ref,
          designacao: product.nome_artigo,
          pvp,
          base,
          lucro,
          desconto: 0
        };
      }
      return item;
    }));
    setActiveProductSearchId(null);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newCustomer = {
        nome_cliente: newCustomerName,
        instagram: newCustomerInsta || '-',
        morada: newCustomerAddress || '-',
        email_cliente: newCustomerEmail || '-',
        telefone_cliente: newCustomerPhone || '-',
        data_primeira_compra: new Date().toISOString().split('T')[0]
      };
      await addCustomer(newCustomer);
      const resolvedCustomer = { 
        name: newCustomerName, 
        instagram: newCustomerInsta, 
        address: newCustomerAddress,
        email: newCustomerEmail,
        phone: newCustomerPhone
      };
      handleSelectCustomer(resolvedCustomer);
      setIsCustomerModalOpen(false);
      setNewCustomerName('');
      setNewCustomerInsta('');
      setNewCustomerAddress('');
      setNewCustomerEmail('');
      setNewCustomerPhone('');
    } catch (err) {
      alert('Erro ao criar cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const totalPvpOriginal = items.reduce((acc, curr) => acc + (curr.pvp * curr.quantidade), 0);
      const totalDescontos = items.reduce((acc, curr) => acc + (curr.desconto * curr.quantidade), 0);
      const totalPvpFinal = totalPvpOriginal - totalDescontos;
      const totalBase = items.reduce((acc, curr) => acc + (curr.base * curr.quantidade), 0);
      
      // Calculate IFHERPAY Fee based on Order Total
      let paymentFee = 0;
      if (formaPagamento === 'Mbway S') {
        paymentFee = ((totalPvpFinal * 0.007) + 0.07) * 1.23;
      } else if (formaPagamento === 'Referência MB') {
        paymentFee = ((totalPvpFinal * 0.015) + 0.2) * 1.23;
      }
      
      const totalLucro = items.reduce((acc, curr) => acc + (curr.lucro * curr.quantidade), 0) - paymentFee;

      const dateObj = new Date(dataVenda);
      const meses = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
      const msano = `${meses[dateObj.getMonth()]}/${dateObj.getFullYear()}`;
      
      const diasSemana = ['DOMINGO', 'SEGUNDA-FEIRA', 'TERÇA-FEIRA', 'QUARTA-FEIRA', 'QUINTA-FEIRA', 'SEXTA-FEIRA', 'SÁBADO'];
      const diaDaSemana = diasSemana[dateObj.getDay()];

      const newSale = {
        data_venda: dataVenda,
        id_venda: idVenda || `#${Math.floor(Math.random() * 10000)}`,
        nome_cliente: selectedCustomer?.name || searchTerm,
        instagram: selectedCustomer?.instagram || 'N/A',
        pvp: totalPvpFinal,
        base: totalBase,
        lucro: totalLucro,
        iva: 0,
        forma_de_pagamento: formaPagamento,
        sitekyte: siteKyte,
        lojactt: lojaCtt,
        msano: msano,
        localidade: localidade || selectedCustomer?.address || 'N/A',
        dia_da_semana: diaDaSemana,
        ifherpay_fee: paymentFee,
        items: items.map(i => ({
          ref: i.ref,
          designacao: i.designacao,
          pvp: i.pvp,
          base: i.base,
          lucro: i.lucro,
          quantidade: i.quantidade
        }))
      };

      await addSale(newSale);
      setSuccess(true);
      
      // Reset form
      setTimeout(() => {
        setSuccess(false);
        setItems([{ id: Math.random().toString(36).substr(2, 9), ref: '', designacao: '', pvp: 0, base: 0, lucro: 0, desconto: 0, quantidade: 1 } as any]);
        setIdVenda('');
        setSearchTerm('');
        setSelectedCustomer(null);
      }, 3000);

    } catch (err) {
      console.error(err);
      alert('Erro ao salvar venda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Registar Venda
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-bold uppercase tracking-wider">
            Nova entrada no sistema de faturamento
          </p>
        </div>
        {success && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/20 font-bold text-sm"
          >
            <CheckCircle2 className="w-5 h-5" />
            Venda Registrada!
          </motion.div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info Geral */}
        <div className="glass p-8 rounded-[2.5rem] border-purple-100 dark:border-purple-800/20 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Informações da Venda</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Data da Venda
              </label>
              <input 
                type="date"
                required
                value={dataVenda}
                onChange={(e) => setDataVenda(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                <Tag className="w-3 h-3" /> ID da Venda (Opcional)
              </label>
              <input 
                type="text"
                placeholder="#0000"
                value={idVenda}
                onChange={(e) => setIdVenda(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold text-sm"
              />
            </div>

            <div className="space-y-2 relative">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                <User className="w-3 h-3" /> Cliente
              </label>
              <div className="relative">
                <input 
                  type="text"
                  required
                  placeholder="Nome ou Instagram..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (selectedCustomer) setSelectedCustomer(null);
                    setIsCustomerDropdownOpen(true);
                  }}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                  className="w-full px-4 py-3 pl-10 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold text-sm"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>

              {/* Customer Dropdown */}
              <AnimatePresence>
                {isCustomerDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 p-2 overflow-hidden"
                  >
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectCustomer(c)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold">
                            {c.instagram !== '-' ? <Instagram className="w-4 h-4 text-pink-500" /> : c.name.substring(0,2).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-900 dark:text-white">{c.name}</span>
                            <span className="text-[10px] text-slate-500 font-bold">{c.instagram}</span>
                          </div>
                        </button>
                      ))
                    ) : searchTerm.length > 2 && (
                       <button
                         type="button"
                         onClick={() => {
                           setNewCustomerName(searchTerm);
                           setIsCustomerModalOpen(true);
                           setIsCustomerDropdownOpen(false);
                         }}
                         className="w-full flex items-center gap-3 px-3 py-4 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 rounded-xl transition-colors text-left group"
                       >
                         <div className="w-8 h-8 rounded-full bg-purple-200 dark:bg-purple-900/40 flex items-center justify-center">
                           <UserPlus className="w-4 h-4 text-purple-600" />
                         </div>
                         <div className="flex flex-col">
                           <span className="text-xs font-black text-purple-700 dark:text-purple-300">Criar Novo Cliente</span>
                           <span className="text-[10px] text-purple-500 font-bold italic">"{searchTerm}" não encontrado</span>
                         </div>
                       </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Localidade
              </label>
              <input 
                type="text"
                required
                placeholder="Ex: AVEIRO, LISBOA..."
                value={localidade}
                onChange={(e) => setLocalidade(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold text-sm"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
               {/* Simplified select boxes using native select with premium styling */}
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Pagamento</label>
                  <select 
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value)}
                    className="w-full px-3 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold text-xs appearance-none"
                  >
                    <option>MB Way</option>
                    <option>Mbway S</option>
                    <option>Referência MB</option>
                    <option>Transferência</option>
                    <option>Numerário</option>
                    <option>Cartão</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Canal</label>
                  <select 
                    value={siteKyte}
                    onChange={(e) => setSiteKyte(e.target.value)}
                    className="w-full px-3 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold text-xs appearance-none"
                  >
                    <option>KYTE</option>
                    <option>SITE</option>
                    <option>INSTAGRAM</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Envio</label>
                  <select 
                    value={lojaCtt}
                    onChange={(e) => setLojaCtt(e.target.value)}
                    className="w-full px-3 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold text-xs appearance-none"
                  >
                    <option>CTT</option>
                    <option>LOJA</option>
                  </select>
               </div>
            </div>
          </div>
        </div>

        {/* Itens */}
        <div className="glass p-8 rounded-[2.5rem] border-purple-100 dark:border-purple-800/20 space-y-6">
           <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Package className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Itens do Pedido</h2>
              </div>
              <button 
                type="button" 
                onClick={addItem}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
           </div>

           <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-3 items-end bg-slate-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-slate-200 dark:border-white/5 relative">
                   <div className="col-span-2 space-y-1.5 relative">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Ref</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: T46"
                        value={item.ref}
                        onChange={(e) => {
                          updateItem(item.id, 'ref', e.target.value);
                          setActiveProductSearchId(item.id);
                        }}
                        onFocus={() => setActiveProductSearchId(item.id)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-xs"
                      />

                      {/* Product Autocomplete Dropdown */}
                      <AnimatePresence>
                        {activeProductSearchId === item.id && item.ref.length >= 2 && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setActiveProductSearchId(null)} 
                            />
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute top-full left-0 w-64 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-50 p-1 overflow-hidden"
                            >
                              <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                {allProducts
                                  .filter(p => {
                                    const refMatch = p.ref?.toUpperCase().includes(item.ref.toUpperCase());
                                    const nameMatch = p.nome_artigo?.toUpperCase().includes(item.ref.toUpperCase());
                                    return refMatch || nameMatch;
                                  })
                                  .slice(0, 10)
                                  .map((product, pIdx) => (
                                    <button
                                      key={pIdx}
                                      type="button"
                                      onClick={() => selectProduct(item.id, product)}
                                      className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors group"
                                    >
                                      <div className="text-[10px] font-black text-slate-900 dark:text-white truncate">
                                        {product.ref}
                                      </div>
                                      <div className="text-[8px] text-slate-500 truncate font-bold">
                                        {product.nome_artigo}
                                      </div>
                                    </button>
                                  ))}
                                {allProducts.filter(p => p.ref.toUpperCase().includes(item.ref.toUpperCase())).length === 0 && (
                                  <div className="px-3 py-4 text-center text-[10px] text-slate-400 font-bold italic">
                                    Nenhum produto encontrado
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                   </div>
                   <div className="col-span-3 space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Designação</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Nome do produto"
                        value={item.designacao}
                        onChange={(e) => updateItem(item.id, 'designacao', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-xs"
                      />
                   </div>
                   <div className="col-span-2 space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">PVP (€)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        value={item.pvp}
                        onChange={(e) => updateItem(item.id, 'pvp', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-xs"
                      />
                   </div>
                   <div className="col-span-2 space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Base (€)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        value={item.base}
                        onChange={(e) => updateItem(item.id, 'base', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-xs"
                      />
                   </div>
                   <div className="col-span-1 space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Qtd</label>
                      <input 
                        type="number" 
                        required
                        value={item.quantidade}
                        onChange={(e) => updateItem(item.id, 'quantidade', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-xs"
                      />
                   </div>
                    <div className="col-span-1 space-y-1.5">
                       <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Desc (€)</label>
                       <input 
                         type="number" 
                         step="0.01"
                         value={item.desconto}
                         onChange={(e) => updateItem(item.id, 'desconto', Number(e.target.value))}
                         className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all font-bold text-xs"
                       />
                    </div>
                    <div className="col-span-1 space-y-1.5 text-center">
                       <label className="text-[9px] font-black text-slate-400 uppercase">Lucro</label>
                       <div className="py-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                         {item.lucro.toFixed(2)}€
                       </div>
                    </div>
                   <div className="col-span-1 py-1 px-1">
                      <button 
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="w-full py-2 flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              ))}
           </div>

           {/* Total Summary Breakdown - Aligned with Columns */}
           <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/5 grid grid-cols-12 gap-3">
              {/* Spacer for Ref & Designacao (2+3=5) */}
              <div className="col-span-5 hidden md:block"></div>

              {/* PVP Column (col-span-2) */}
              <div className="col-span-3 md:col-span-2">
                <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 text-center h-full flex flex-col justify-center">
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-tight">Total Bruto</div>
                  <div className="text-[11px] font-black text-slate-900 dark:text-white">
                    {items.reduce((acc, curr) => acc + (curr.pvp * curr.quantidade), 0).toFixed(2)}€
                  </div>
                </div>
              </div>

              {/* Base Column (col-span-2) */}
              <div className="col-span-3 md:col-span-2">
                <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 text-center h-full flex flex-col justify-center">
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-tight">Total Base</div>
                  <div className="text-[11px] font-black text-slate-900 dark:text-white">
                    {items.reduce((acc, curr) => acc + (curr.base * curr.quantidade), 0).toFixed(2)}€
                  </div>
                </div>
              </div>

              {/* Qty Column (col-span-1) */}
              <div className="col-span-2 md:col-span-1">
                <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 text-center h-full flex flex-col justify-center">
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-tight">Qtd</div>
                  <div className="text-[11px] font-black text-slate-900 dark:text-white">
                    {items.reduce((acc, curr) => acc + curr.quantidade, 0)}
                  </div>
                </div>
              </div>

              {/* Desc Column (col-span-1) */}
              <div className="col-span-2 md:col-span-1">
                <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100 dark:border-rose-500/10 text-center h-full flex flex-col justify-center">
                  <div className="text-[8px] font-black text-rose-400 uppercase tracking-widest leading-tight">Desc</div>
                  <div className="text-[11px] font-black text-rose-600 dark:text-rose-400">
                    -{items.reduce((acc, curr) => acc + (curr.desconto * curr.quantidade), 0).toFixed(2)}€
                  </div>
                </div>
              </div>

              {/* Lucro & Total Pedido (col-span-1) */}
              <div className="col-span-2 md:col-span-1 space-y-1.5">
                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-100 dark:border-emerald-500/10 text-center">
                  <div className="text-[7px] font-black text-emerald-400 uppercase leading-none mb-0.5">Lucro</div>
                  <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                    {(() => {
                      const totalPvpFinal = items.reduce((acc, curr) => acc + (curr.pvp * curr.quantidade), 0) - items.reduce((acc, curr) => acc + (curr.desconto * curr.quantidade), 0);
                      let paymentFee = 0;
                      if (formaPagamento === 'Mbway S') {
                        paymentFee = ((totalPvpFinal * 0.007) + 0.07) * 1.23;
                      } else if (formaPagamento === 'Referência MB') {
                        paymentFee = ((totalPvpFinal * 0.015) + 0.2) * 1.23;
                      }
                      return (items.reduce((acc, curr) => acc + (curr.lucro * curr.quantidade), 0) - paymentFee).toFixed(2);
                    })()}€
                  </div>
                </div>
                <div className="p-1.5 bg-purple-600 rounded-lg text-center shadow-lg shadow-purple-500/20">
                  <div className="text-[7px] font-black text-purple-200 uppercase leading-none mb-0.5">Total</div>
                  <div className="text-[10px] font-black text-white">
                    {(items.reduce((acc, curr) => acc + (curr.pvp * curr.quantidade), 0) - items.reduce((acc, curr) => acc + (curr.desconto * curr.quantidade), 0)).toFixed(2)}€
                  </div>
                </div>
              </div>
           </div>

           {/* IFHERPAY Fee Display - Shown separately below column sums if applicable */}
           {(formaPagamento === 'Mbway S' || formaPagamento === 'Referência MB') && (
             <div className="mt-2 flex justify-end">
               <div className="px-4 py-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/10 flex items-center gap-3">
                 <div className="text-[9px] font-black text-amber-500 uppercase">Taxa IFHERPAY ({formaPagamento === 'Mbway S' ? 'MBWay' : 'Ref'})</div>
                 <div className="text-xs font-black text-amber-600 dark:text-amber-400">
                   {(() => {
                     const totalPvpFinal = items.reduce((acc, curr) => acc + (curr.pvp * curr.quantidade), 0) - items.reduce((acc, curr) => acc + (curr.desconto * curr.quantidade), 0);
                     let paymentFee = 0;
                     if (formaPagamento === 'Mbway S') {
                       paymentFee = ((totalPvpFinal * 0.007) + 0.07) * 1.23;
                     } else if (formaPagamento === 'Referência MB') {
                       paymentFee = ((totalPvpFinal * 0.015) + 0.2) * 1.23;
                     }
                     return `-${paymentFee.toFixed(2)}`;
                   })()}€
                 </div>
               </div>
             </div>
           )}
        </div>

        <button 
          type="submit"
          disabled={loading || isGlobalLoading}
          className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
        >
          {loading ? (
             <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <Save className="w-6 h-6" /> Guardar Venda
            </>
          )}
        </button>
      </form>

      {/* New Customer Modal */}
      <AnimatePresence>
        {isCustomerModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCustomerModalOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
             />
             <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
             >
                <div className="p-8 space-y-6">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <UserPlus className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Novo Cliente</h3>
                      </div>
                      <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <CloseIcon className="w-5 h-5" />
                      </button>
                   </div>

                   <form onSubmit={handleCreateCustomer} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome Completo</label>
                        <input 
                          type="text"
                          required
                          value={newCustomerName}
                          onChange={(e) => setNewCustomerName(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Instagram (@...)</label>
                        <input 
                          type="text"
                          required
                          value={newCustomerInsta}
                          onChange={(e) => setNewCustomerInsta(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Morada / Cidade</label>
                        <input 
                          type="text"
                          required
                          value={newCustomerAddress}
                          onChange={(e) => setNewCustomerAddress(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">E-mail</label>
                          <input 
                            type="email"
                            value={newCustomerEmail}
                            onChange={(e) => setNewCustomerEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Telefone</label>
                          <input 
                            type="tel"
                            value={newCustomerPhone}
                            onChange={(e) => setNewCustomerPhone(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold text-sm"
                          />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-purple-500/20 hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
                      >
                        {loading ? 'A processar...' : 'Criar Cliente'}
                      </button>
                   </form>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
