import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  ArrowLeft,
  CheckCircle2,
  Package,
  Menu,
  User,
  Instagram,
  Facebook
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
    const excelCatalog = data.products_catalog || [];
    const manualCatalog = data.manual_products_catalog || [];
    
    // Manual overrides merge
    const productMap = new Map();
    excelCatalog.forEach(p => productMap.set(p.ref, p));
    manualCatalog.forEach(p => {
      productMap.set(p.ref, { ...productMap.get(p.ref), ...p });
    });
    
    const catalog = Array.from(productMap.values());
    
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
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full p-12 text-center space-y-8"
        >
          <div className="w-24 h-24 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center mx-auto shadow-2xl">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-slate-950 dark:text-white uppercase tracking-tighter">ENCOMENDA RECEBIDA</h1>
            <p className="text-[#827b14] font-black uppercase tracking-[0.2em] text-[10px]">Obrigado pela sua preferência. Em breve receberá os detalhes.</p>
          </div>
          <button 
            onClick={() => setCheckoutStep('browsing')}
            className="w-full py-5 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-[0.25em] text-[10px] hover:bg-[#827b14] dark:hover:bg-[#827b14] dark:hover:text-white transition-all shadow-xl"
          >
            VOLTAR AO CATÁLOGO
          </button>
        </motion.div>
      </div>
    );
  }

  if (checkoutStep === 'checkout') {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center py-24 px-6 md:px-12">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-24">
          <div className="space-y-12">
             <button 
              onClick={() => setCheckoutStep('browsing')}
              className="flex items-center gap-2 text-slate-400 hover:text-black dark:hover:text-white transition-colors uppercase font-black text-[10px] tracking-[0.2em]"
            >
              <ArrowLeft className="w-4 h-4" /> VOLTAR AO CATÁLOGO
            </button>

            <div className="space-y-8">
              <h1 className="text-5xl font-black text-slate-950 dark:text-white tracking-tighter uppercase leading-none">CHECKOUT</h1>
              <p className="text-[#827b14] font-black uppercase tracking-[0.2em] text-[10px]">INTRODUZA OS SEUS DADOS PARA ENTREGA</p>
            </div>

            <form onSubmit={handleCheckout} className="space-y-10">
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">NOME COMPLETO</label>
                  <input 
                    required
                    type="text" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-0 py-4 bg-transparent border-b-2 border-slate-100 dark:border-white/10 focus:border-[#827b14] outline-none transition-all font-bold text-xl uppercase tracking-tight text-slate-950 dark:text-white placeholder:text-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">INSTAGRAM (@...)</label>
                  <input 
                    type="text" 
                    value={customerInsta}
                    onChange={(e) => setCustomerInsta(e.target.value)}
                    className="w-full px-0 py-4 bg-transparent border-b-2 border-slate-100 dark:border-white/10 focus:border-[#827b14] outline-none transition-all font-bold text-xl uppercase tracking-tight text-slate-950 dark:text-white placeholder:text-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">MORADA / CIDADE</label>
                  <input 
                    required
                    type="text" 
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full px-0 py-4 bg-transparent border-b-2 border-slate-100 dark:border-white/10 focus:border-[#827b14] outline-none transition-all font-bold text-xl uppercase tracking-tight text-slate-950 dark:text-white placeholder:text-slate-200"
                  />
                </div>
              </div>

              <button 
                disabled={loading}
                type="submit"
                className="w-full py-6 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-[0.3em] text-[11px] hover:bg-[#827b14] dark:hover:bg-[#827b14] dark:hover:text-white transition-all disabled:opacity-50"
              >
                {loading ? 'A PROCESSAR...' : 'FINALIZAR PEDIDO'}
              </button>
            </form>
          </div>

          <div className="space-y-12 bg-[#F9F9F9] dark:bg-white/5 p-12">
            <h3 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-widest">RESUMO DO PEDIDO</h3>
            <div className="space-y-6">
              {items.map(item => (
                <div key={item.ref} className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-white/10 pb-4">
                  <span className="text-slate-600 dark:text-slate-300">{item.quantidade}X {item.nome_artigo} <span className="text-[#827b14] ml-2">[{item.ref}]</span></span>
                  <span className="text-black dark:text-white">{(item.pvp_cica * item.quantidade).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</span>
                </div>
              ))}
              <div className="pt-6 flex justify-between items-end">
                <span className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">TOTAL FINAL</span>
                <span className="text-4xl font-black text-black dark:text-white tracking-tighter">{total.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-950 dark:text-white transition-colors flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-[90] bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-100 dark:border-white/5">
        <div className="max-w-[1600px] mx-auto px-10 h-24 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <button className="p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-full transition-colors lg:hidden">
              <Menu className="w-5 h-5 text-black dark:text-white" />
            </button>
            <div className="flex flex-col">
               <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">O4U BRAND</h1>
               <p className="text-[8px] font-black text-[#827b14] uppercase tracking-[0.5em] mt-1.5 ml-0.5">EST. 2024</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
             <a href="#" className="hover:text-black dark:hover:text-white transition-colors border-b-2 border-transparent hover:border-[#827b14] pb-1">Novidades</a>
             <a href="#" className="hover:text-black dark:hover:text-white transition-colors border-b-2 border-transparent hover:border-[#827b14] pb-1">Homem</a>
             <a href="#" className="hover:text-black dark:hover:text-white transition-colors border-b-2 border-transparent hover:border-[#827b14] pb-1">Mulher</a>
             <a href="#" className="hover:text-black dark:hover:text-white transition-colors border-b-2 border-transparent hover:border-[#827b14] pb-1">Acessórios</a>
          </nav>

          <div className="flex items-center gap-8">
            <button className="p-2 hover:text-[#827b14] transition-colors hidden md:block">
              <Search className="w-4 h-4" />
            </button>
            <button className="p-2 hover:text-[#827b14] transition-colors">
              <User className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:text-[#827b14] transition-colors flex items-center gap-3"
            >
              <ShoppingBag className="w-4 h-4" />
              {itemCount > 0 && (
                <span className="text-[10px] font-black uppercase tracking-widest bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 rounded-full">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative h-[85vh] overflow-hidden group">
           <img 
            src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=2600" 
            alt="Hero" 
            className="w-full h-full object-cover transition-transform duration-[15s] ease-out group-hover:scale-105"
           />
           <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/20" />
           <div className="absolute inset-0 p-24 flex flex-col justify-center items-center text-center space-y-8">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="space-y-6 max-w-4xl"
              >
                 <span className="text-white text-[12px] font-black uppercase tracking-[0.5em] mb-4 drop-shadow-lg inline-block border-b border-white/30 pb-2">SS24 COLLECTION</span>
                 <h2 className="text-7xl md:text-9xl font-black text-white tracking-tighter leading-[0.85] uppercase drop-shadow-2xl">
                    THE ART OF <br/> DRESSING
                 </h2>
                 <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.4em] max-w-lg mx-auto leading-relaxed">
                    Descubra a nossa coleção premium com materiais de alta qualidade e design contemporâneo.
                 </p>
                 <div className="pt-10 flex gap-6 justify-center">
                    <button className="px-12 py-5 bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] hover:bg-[#827b14] hover:text-white transition-all shadow-2xl active:scale-95">
                       SHOP NOW
                    </button>
                    <button className="px-12 py-5 bg-transparent border-2 border-white text-white font-black uppercase tracking-[0.3em] text-[10px] hover:bg-white hover:text-black transition-all active:scale-95">
                       COLLECTION
                    </button>
                 </div>
              </motion.div>
           </div>
        </section>

        {/* Filters & Grid Wrapper */}
        <div className="max-[1600px]:px-10 px-24 py-24 space-y-24">
           {/* Filters Bar */}
           <div className="flex flex-col md:flex-row gap-12 items-end justify-between border-b border-slate-100 dark:border-white/5 pb-10">
              <div className="space-y-4">
                 <h3 className="text-4xl font-black uppercase tracking-tighter">OS NOSSOS ESSENCIAIS</h3>
                 <p className="text-[10px] font-black text-[#827b14] uppercase tracking-[0.3em]">PEÇAS SELECIONADAS PARA O SEU LOOK</p>
              </div>

              <div className="flex items-center gap-12 w-full md:w-auto">
                 <div className="relative group flex-1 md:w-64">
                    <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                      type="text" 
                      placeholder="PESQUISAR..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-transparent border-none py-3 pl-8 rounded-none text-xs font-black uppercase tracking-[0.2em] focus:ring-0 outline-none placeholder:text-slate-200"
                    />
                 </div>
                 <div className="flex items-center gap-3 shrink-0 cursor-pointer group">
                    <Filter className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#827b14] transition-colors" />
                    <select className="bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] text-black dark:text-white outline-none appearance-none cursor-pointer">
                       <option>FILTRAR POR</option>
                       <option>PREÇO: BAIXO-ALTO</option>
                       <option>PREÇO: ALTO-BAIXO</option>
                       <option>MAIS RECENTES</option>
                    </select>
                 </div>
              </div>
           </div>

           {/* Grid */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-20">
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.ref} 
                  product={product} 
                  onAddToCart={addToCart} 
                />
              ))}
           </div>

           {filteredProducts.length === 0 && (
             <div className="py-24 text-center space-y-8">
                <div className="w-24 h-24 bg-[#F9F9F9] dark:bg-white/5 flex items-center justify-center mx-auto">
                   <Package className="w-10 h-10 text-slate-200 dark:text-slate-800" />
                </div>
                <div className="space-y-2">
                   <p className="text-slate-900 dark:text-white font-black uppercase tracking-[0.1em] text-sm">NENHUM ARTIGO ENCONTRADO</p>
                   <p className="text-[#827b14] text-[9px] font-black uppercase tracking-[0.3em]">TENTE READEQUAR A SUA PESQUISA</p>
                </div>
                <button 
                  onClick={() => setSearchTerm('')}
                  className="px-12 py-4 bg-black text-white dark:bg-white dark:text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#827b14] transition-all"
                >
                  VER TUDO
                </button>
             </div>
           )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#F9F9F9] dark:bg-white/5 px-24 py-24 mt-24">
         <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-20">
            <div className="space-y-8">
               <h4 className="text-xl font-black uppercase tracking-tighter">O4U BRAND</h4>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-loose">
                  Elevando o seu estilo através de designs minimalistas e qualidade superior em cada detalhe.
               </p>
               <div className="flex gap-6">
                  <Instagram className="w-5 h-5 text-slate-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer" />
                  <Facebook className="w-5 h-5 text-slate-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer" />
               </div>
            </div>
            
            <div className="space-y-8">
               <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#827b14]">COLEÇÕES</h5>
               <nav className="flex flex-col gap-4 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                  <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Novidades</a>
                  <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Mais Vendidos</a>
                  <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Edições Limitadas</a>
               </nav>
            </div>

            <div className="space-y-8">
               <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#827b14]">APOIO AO CLIENTE</h5>
               <nav className="flex flex-col gap-4 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                  <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Encomendas</a>
                  <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Envios & Devoluções</a>
                  <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Contactos</a>
               </nav>
            </div>

            <div className="space-y-8">
               <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#827b14]">NEWSLETTER</h5>
               <div className="relative group">
                  <input 
                    type="email" 
                    placeholder="O SEU EMAIL..."
                    className="w-full bg-transparent border-b-2 border-slate-200 dark:border-white/10 py-4 font-black uppercase tracking-[0.2em] text-[10px] focus:border-[#827b14] outline-none transition-all"
                  />
                  <button className="absolute right-0 bottom-4 text-[10px] font-black uppercase tracking-[0.3em] hover:text-[#827b14] transition-colors">OK</button>
               </div>
            </div>
         </div>
         <div className="mt-24 pt-10 border-t border-slate-200 dark:border-white/10 text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.5em]">© 2024 O4U BRAND - ALL RIGHTS RESERVED</p>
         </div>
      </footer>

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
