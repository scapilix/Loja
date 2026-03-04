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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-950 shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <h2 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tighter">O SEU CARRINHO</h2>
                  <p className="text-[10px] font-black text-[#827b14] uppercase tracking-[0.2em]">{itemCount} ARTIGOS SELECIONADOS</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-full transition-colors group"
              >
                <X className="w-5 h-5 text-slate-400 group-hover:text-black dark:group-hover:text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-[#F9F9F9] dark:bg-white/5 flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-slate-400 font-bold uppercase tracking-[0.1em] text-[10px]">O SEU CARRINHO ESTÁ VAZIO</p>
                    <button 
                      onClick={onClose}
                      className="text-black dark:text-white font-black text-xs uppercase tracking-widest hover:underline underline-offset-4"
                    >
                      Continuar a comprar
                    </button>
                  </div>
                </div>
              ) : (
                items.map((item: any) => (
                  <div key={item.ref} className="flex gap-6 group">
                    <div className="w-24 h-32 bg-[#F9F9F9] dark:bg-white/5 overflow-hidden shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.nome_artigo} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-300 font-black tracking-widest uppercase">IMAGEM</div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-950 dark:text-white text-xs uppercase tracking-tight">{item.nome_artigo}</h4>
                          <button 
                            onClick={() => removeFromCart(item.ref)}
                            className="p-1 text-slate-300 hover:text-[#827b14] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[9px] font-black text-[#827b14] uppercase tracking-widest">{item.ref}</p>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-4 border border-slate-100 dark:border-white/10 px-3 py-1.5">
                          <button 
                            onClick={() => updateQuantity(item.ref, -1)}
                            className="text-slate-400 hover:text-black dark:hover:text-white transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-black text-[11px] text-slate-950 dark:text-white w-4 text-center">{item.quantidade}</span>
                          <button 
                            onClick={() => updateQuantity(item.ref, 1)}
                            className="text-slate-400 hover:text-black dark:hover:text-white transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-black text-xs text-slate-950 dark:text-white tracking-tight">
                          {formatCurrency(item.pvp_cica * item.quantidade)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-8 space-y-6 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-slate-950">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Estimado</span>
                  <span className="text-2xl font-black text-slate-950 dark:text-white tracking-tighter">{formatCurrency(total)}</span>
                </div>
                
                <div className="space-y-3">
                  <button 
                    onClick={onCheckout}
                    className="w-full py-5 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-[0.25em] text-[10px] shadow-2xl hover:bg-[#827b14] dark:hover:bg-[#827b14] dark:hover:text-white transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    PROSSEGUIR
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-center text-[8px] text-[#827b14] font-black uppercase tracking-[0.2em]">O seu pedido será processado de imediato</p>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
