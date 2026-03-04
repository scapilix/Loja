import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  ArrowLeft,
  CheckCircle2,
  Package,
  ShoppingCart
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useCart, CartProvider } from '../contexts/CartContext';
import { ProductCard } from '../components/Loja/ProductCard';
import { Cart } from '../components/Loja/Cart';

function LojaContent() {
  const { data, addSale } = useData();
  const { items, total, itemCount, clearCart, addToCart } = useCart();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'browsing' | 'checkout' | 'success'>('browsing');
  const [loading, setLoading] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerInsta, setCustomerInsta] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  const allProducts = useMemo(() => {
    const catalog = [
      ...(data.products_catalog || []),
      ...(data.manual_products_catalog || [])
    ];
    
    // Add AI images to matching keywords in clothing store
    return catalog.map(p => {
      const name = p.nome_artigo?.toLowerCase() || '';
      let image_url = p.image_url;
      
      if (!image_url) {
        if (name.includes('hoodie') || name.includes('sweat') || name.includes('casaco')) image_url = 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800';
        else if (name.includes('dress') || name.includes('vestido')) image_url = 'https://images.unsplash.com/photo-1539008886428-44c520ef224c?auto=format&fit=crop&q=80&w=800';
        else if (name.includes('jeans') || name.includes('calça')) image_url = 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800';
        else if (name.includes('shirt') || name.includes('t-shirt') || name.includes('camisa')) image_url = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800';
        else image_url = 'https://images.unsplash.com/photo-1434389677634-91677891d98e?auto=format&fit=crop&q=80&w=800';
      }
      
      return { ...p, image_url };
    });
  }, [data.products_catalog, data.manual_products_catalog]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return allProducts;
    const term = searchTerm.toLowerCase();
    return allProducts.filter(p => 
      p.ref.toLowerCase().includes(term) || 
      (p.nome_artigo && p.nome_artigo.toLowerCase().includes(term))
    );
  }, [allProducts, searchTerm]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const dateObj = new Date();
      const meses = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
      const msano = `${meses[dateObj.getMonth()]}/${dateObj.getFullYear()}`;
      
      const diasSemana = ['DOMINGO', 'SEGUNDA-FEIRA', 'TERÇA-FEIRA', 'QUARTA-FEIRA', 'QUINTA-FEIRA', 'SEXTA-FEIRA', 'SÁBADO'];
      const diaDaSemana = diasSemana[dateObj.getDay()];

      const newSale = {
        data_venda: dateObj.toISOString().split('T')[0],
        id_venda: `#SITE-${Math.floor(Math.random() * 10000)}`,
        nome_cliente: customerName,
        instagram: customerInsta || 'N/A',
        pvp: total,
        base: items.reduce((acc, curr) => acc + (curr.base_price || 0) * curr.quantidade, 0),
        lucro: items.reduce((acc, curr) => acc + (curr.lucro_meu_faturado || 0) * curr.quantidade, 0),
        iva: 0,
        forma_de_pagamento: 'Site / Carrinho',
        sitekyte: 'SITE',
        lojactt: 'LOJA',
        msano: msano,
        localidade: customerAddress || 'N/A',
        dia_da_semana: diaDaSemana,
        items: items.map(i => ({
          ref: i.ref,
          designacao: i.nome_artigo,
          pvp: i.pvp_cica,
          base: i.base_price || 0,
          lucro: i.lucro_meu_faturado || 0,
          quantidade: i.quantidade
        }))
      };

      await addSale(newSale);
      setCheckoutStep('success');
      clearCart();
    } catch (err) {
      alert('Erro ao processar compra');
    } finally {
      setLoading(false);
    }
  };

  if (checkoutStep === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass p-12 rounded-[3rem] text-center space-y-8"
        >
          <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Encomenda Recebida!</h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Obrigado pela sua preferência</p>
          </div>
          <button 
            onClick={() => setCheckoutStep('browsing')}
            className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-xl"
          >
            Voltar à Loja
          </button>
        </motion.div>
      </div>
    );
  }

  if (checkoutStep === 'checkout') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12">
        <div className="max-w-4xl mx-auto space-y-12">
          <button 
            onClick={() => setCheckoutStep('browsing')}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors uppercase font-black text-[10px] tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Catálogo
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Finalizar Pedido</h1>
                <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Introduza os seus dados para entrega</p>
              </div>

              <form onSubmit={handleCheckout} className="space-y-6">
                <div className="glass p-8 rounded-[2.5rem] border-slate-100 dark:border-white/5 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                    <input 
                      required
                      type="text" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instagram (@...)</label>
                    <input 
                      type="text" 
                      value={customerInsta}
                      onChange={(e) => setCustomerInsta(e.target.value)}
                      className="w-full px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Morada / Cidade</label>
                    <input 
                      required
                      type="text" 
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full py-6 bg-purple-600 hover:bg-purple-700 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-purple-500/30 transition-all disabled:opacity-50"
                >
                  {loading ? 'A Processar...' : 'Confirmar Encomenda'}
                </button>
              </form>
            </div>

            <div className="space-y-8">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Resumo do Pedido</h3>
              <div className="glass p-8 rounded-[2.5rem] border-slate-100 dark:border-white/5 space-y-4">
                {items.map(item => (
                  <div key={item.ref} className="flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-900 dark:text-white">{item.quantidade}x {item.nome_artigo}</span>
                    <span className="text-slate-500">{(item.pvp_cica * item.quantidade).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                ))}
                <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                  <span className="text-slate-900 dark:text-white font-black text-lg">Total</span>
                  <span className="text-purple-600 font-black text-2xl">{total.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-[90] bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                <ShoppingBag className="w-6 h-6" />
             </div>
             <div>
                <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">Clothing Store</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Premium Collection</p>
             </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
               <a href="#" className="hover:text-purple-600 transition-colors">New Arrivals</a>
               <a href="#" className="hover:text-purple-600 transition-colors">Collection</a>
               <a href="#" className="hover:text-purple-600 transition-colors">Outlet</a>
            </div>

            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 hover:bg-white dark:hover:bg-slate-900 transition-all group"
            >
              <ShoppingCart className="w-5 h-5 text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950 shadow-lg">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
           <div className="relative w-full md:w-96 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Procurar peças..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 py-4 pl-14 pr-6 rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-purple-500 transition-all outline-none"
              />
           </div>

           <div className="flex items-center gap-3 shrink-0">
             <div className="px-6 py-4 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/5 flex items-center gap-3">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filtrar por</span>
                <select className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white outline-none">
                   <option>Todas as Peças</option>
                   <option>Homem</option>
                   <option>Mulher</option>
                   <option>Acessórios</option>
                </select>
             </div>
           </div>
        </div>

        {/* Hero Section Placeholder */}
        <section className="relative h-96 rounded-[3rem] overflow-hidden group">
           <img 
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=2000" 
            alt="Hero" 
            className="w-full h-full object-cover transition-transform duration-[20s] linear animate-slow-zoom"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-12 flex flex-col justify-end">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl space-y-4"
              >
                 <span className="bg-purple-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest italic shadow-lg shadow-purple-500/30">New Season 2024</span>
                 <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none uppercase">The Art of <br/> Modern Dressing</h2>
              </motion.div>
           </div>
        </section>

        {/* Product Grid */}
        <div className="space-y-8">
           <div className="flex items-baseline justify-between">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">O Nosso Catálogo</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{filteredProducts.length} Peças Disponíveis</p>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.ref} 
                  product={product} 
                  onAddToCart={addToCart} 
                />
              ))}
           </div>
           
           {filteredProducts.length === 0 && (
             <div className="py-24 text-center space-y-6">
                <div className="w-24 h-24 rounded-[3rem] bg-slate-50 dark:bg-white/5 flex items-center justify-center mx-auto">
                   <Package className="w-12 h-12 text-slate-200 dark:text-slate-800" />
                </div>
                <div className="space-y-1">
                   <p className="text-slate-900 dark:text-white font-black uppercase tracking-tight">Nenhum produto encontrado</p>
                   <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Tente outro termo de pesquisa</p>
                </div>
                <button 
                  onClick={() => setSearchTerm('')}
                  className="px-8 py-3 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest"
                >
                  Ver Tudo
                </button>
             </div>
           )}
        </div>
      </main>

      <Cart 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        onCheckout={() => {
          setIsCartOpen(false);
          setCheckoutStep('checkout');
        }}
      />
    </div>
  );
}

export default function Loja() {
  return (
    <CartProvider>
      <LojaContent />
    </CartProvider>
  );
}
