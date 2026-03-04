import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export const Cart: React.FC<CartProps> = ({ isOpen, onClose, onCheckout }) => {
  const { items, removeFromCart, updateQuantity, total, itemCount } = useCart();

  const formatCurrency = (val: number) =>
    val?.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-[101] flex flex-col"
          >
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">O Seu Carrinho</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{itemCount} itens selecionados</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 flex items-center justify-center">
                    <ShoppingCart className="w-10 h-10 text-slate-200 dark:text-slate-700" />
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">O seu carrinho está vazio</p>
                  <button 
                    onClick={onClose}
                    className="text-purple-600 font-black text-sm hover:underline"
                  >
                    Continuar a comprar
                  </button>
                </div>
              ) : (
                items.map((item: any) => (
                  <div key={item.ref} className="flex gap-4 group">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.nome_artigo} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold">NO IMG</div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase leading-tight">{item.nome_artigo}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.ref}</p>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.ref)}
                          className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 p-1 rounded-xl border border-slate-100 dark:border-white/5">
                          <button 
                            onClick={() => updateQuantity(item.ref, -1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all text-slate-500"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-black text-xs text-slate-900 dark:text-white w-4 text-center">{item.quantidade}</span>
                          <button 
                            onClick={() => updateQuantity(item.ref, 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all text-slate-500"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-black text-sm text-purple-600 dark:text-purple-400">{formatCurrency(item.pvp_cica * item.quantidade)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-8 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Total do Pedido</span>
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(total)}</span>
                </div>
                <button 
                  onClick={onCheckout}
                  className="w-full py-5 bg-purple-600 hover:bg-purple-700 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  Finalizar Compra
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-center text-[10px] text-slate-400 font-medium uppercase tracking-widest pt-2">Venda será registada automaticamente no sistema</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
