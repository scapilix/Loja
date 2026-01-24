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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-slate-950/90 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-purple-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)] glow-primary">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/40 mb-6 border border-white/10">
              <BarChart3 className="text-white w-10 h-10" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">Antigravity</h1>
            <p className="text-purple-400 text-xs font-black uppercase tracking-[0.5em] mt-3">Gestão de Loja</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-100 uppercase tracking-widest ml-1">Administradora</label>
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

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-100 uppercase tracking-widest ml-1">Palavra-Passe</label>
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
                  className={`block w-full pl-11 pr-4 py-4 bg-slate-900 border ${error ? 'border-rose-500' : 'border-white/10'} rounded-2xl text-white font-black focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all placeholder:text-slate-700 shadow-inner`}
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

          <p className="text-center text-slate-500 text-[10px] font-black uppercase tracking-widest mt-12 opacity-60">
            Acesso Restrito • Painel Administrativo
          </p>
        </div>
      </motion.div>
    </div>
  );
}
