import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Lock, User, BarChart3, AlertCircle } from 'lucide-react';

export default function Login() {
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState(false);
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(passwordInput)) {
      window.location.hash = '#/'; // Go to dashboard
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#08040d] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Backgrounds */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[100px]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-slate-900/60 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/40 mb-6">
              <BarChart3 className="text-white w-9 h-9" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter">Antigravity</h1>
            <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Gestão de Loja</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1 shadow-black">Administradora</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  readOnly
                  value="Diana"
                  className="block w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black focus:outline-none cursor-default"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1 shadow-black">Palavra-Passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="password"
                  placeholder="••••"
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className={`block w-full pl-11 pr-4 py-4 bg-white/5 border ${error ? 'border-rose-500' : 'border-white/10'} rounded-2xl text-white font-black focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-slate-500`}
                />
              </div>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-rose-500 text-[10px] font-bold uppercase tracking-wider mt-2 ml-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  Palavra-passe incorreta
                </motion.div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
            >
              Entrar no sistema
            </button>
          </form>

          <p className="text-center text-slate-400 text-[10px] font-bold mt-10">
            Acesso restrito ao painel administrativo da loja.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
