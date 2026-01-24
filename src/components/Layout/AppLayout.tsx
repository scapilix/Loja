import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Trophy,
  BarChart3, 
  Menu,
  X,
  Truck,
  Database,
  LogOut,
  ShieldCheck,
  KeyRound
} from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import { ExcelImport } from '../ExcelImport';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

const navigation = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/' },
  { id: 'clientes', label: 'Análise Clientes', icon: Users, path: '/clientes' },
  { id: 'base-clientes', label: 'Base Clientes', icon: Database, path: '/base-clientes' },
  { id: 'produtos', label: 'Produtos', icon: Package, path: '/produtos' },
  { id: 'rankings', label: 'Rankings', icon: Trophy, path: '/rankings' },
  { id: 'portes', label: 'Portes', icon: Truck, path: '/portes' },
];

function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Collapsed state
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { setData, setIsLoading } = useData();
  const { logout, changePassword } = useAuth();
  
  // States for Password Change
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passError, setPassError] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const handlePassChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (changePassword(oldPass, newPass)) {
      setPassSuccess(true);
      setTimeout(() => {
        setIsPassModalOpen(false);
        setPassSuccess(false);
        setOldPass('');
        setNewPass('');
      }, 2000);
    } else {
      setPassError(true);
      setTimeout(() => setPassError(false), 2000);
    }
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const getPageTitle = () => {
    const route = navigation.find(nav => nav.path === location.pathname);
    return route ? route.label : 'Overview';
  };

  const handleDataImport = (importedData: { orders: any[]; customers: any[] }) => {
    setIsLoading(true);
    setData(importedData);
    setIsLoading(false);
  };

  return (
    <div className="flex h-screen bg-[#fdfaff] dark:bg-[#08040d] text-slate-900 dark:text-slate-50 overflow-hidden font-sans transition-colors duration-500">
      {/* Sidebar - Desktop */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarCollapsed ? 80 : 288 }} 
        className="hidden lg:flex bg-white/40 dark:bg-white/[0.02] backdrop-blur-3xl border-r border-purple-100/50 dark:border-white/[0.05] flex-col z-30 transition-all duration-300"
      >
        <div className={`p-6 flex items-center gap-4 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          <div 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 transform transition-all hover:scale-105 cursor-pointer flex-shrink-0"
          >
            <BarChart3 className="text-white w-5 h-5" />
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col overflow-hidden whitespace-nowrap">
              <span className="font-black text-xl tracking-tighter text-gradient leading-none">Antigravity</span>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-500/60 dark:text-purple-400/40 mt-1">Enterprise</span>
            </div>
          )}
        </div>
        
        <nav className="flex-1 px-3 space-y-2 mt-4">
          {navigation.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              title={isSidebarCollapsed ? item.label : ''}
              className={({ isActive }) =>
                `w-full flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 dark:bg-white/10 dark:text-white dark:shadow-none'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white'
                } ${isSidebarCollapsed ? 'justify-center' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && !isSidebarCollapsed && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 w-1 h-6 bg-white/20 rounded-full"
                    />
                  )}
                  <item.icon className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${isActive ? 'text-white' : 'group-hover:text-purple-600 dark:group-hover:text-purple-400'}`} />
                  {!isSidebarCollapsed && (
                    <span className={`font-medium text-sm tracking-wide truncate ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={`p-4 mt-auto border-t border-purple-100/50 dark:border-white/5 ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
          <ExcelImport 
            onDataImported={handleDataImport} 
            variant={isSidebarCollapsed ? 'sidebar-collapsed' : 'sidebar'} 
          />
        </div>
      </motion.aside>

      {/* Mobile Menu Button - Unchanged */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-lg shadow-md flex items-center justify-center border border-purple-100 dark:border-white/10"
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Menu Overlay & Drawer - Unchanged (Simplified for brevity regarding collapse logic) */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isMobileMenuOpen ? 0 : -300 }}
        transition={{ type: "spring", damping: 20 }}
        className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 z-50 flex flex-col shadow-2xl"
      >
         {/* Mobile content same as before */}
         <div className="p-6 flex items-center gap-4 border-b border-purple-100 dark:border-white/10">
            <span className="font-black text-xl">Antigravity</span>
         </div>
          <nav className="flex-1 px-4 space-y-2 mt-4">
          {navigation.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)} // Close on navigate
              className={({ isActive }) =>
                `w-full flex items-center gap-4 px-5 py-3 rounded-xl ${isActive ? 'bg-purple-600 text-white' : 'text-slate-600 dark:text-slate-400'}`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-purple-100/50 dark:border-white/5">
          <ExcelImport onDataImported={handleDataImport} variant="sidebar" />
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-[#fdfaff] dark:bg-transparent scroll-smooth">
        {/* Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[100px]"></div>
        </div>

        {/* Compact Header */}
        <header className="sticky top-0 z-20 px-6 py-3 flex justify-between items-center backdrop-blur-xl border-b border-purple-100/50 dark:border-white/[0.05] bg-white/60 dark:bg-transparent">
          <div className="flex items-center gap-3 ml-12 lg:ml-0">
             {/* Toggle Button for Desktop */}
             <button 
               onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
               className="hidden lg:flex p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
             >
                <Menu className="w-4 h-4" />
             </button>
             
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight capitalize bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white leading-tight">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle isDark={isDark} toggle={() => setIsDark(!isDark)} />

            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-white/10 relative">
              <div className="text-right hidden md:block cursor-pointer" onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}>
                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Diana</p>
                <div className="flex items-center gap-1 justify-end">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Admin</span>
                </div>
              </div>
              <div 
                className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg cursor-pointer"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              >
                  DI
              </div>

              {/* User Dropdown */}
              {isUserDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsUserDropdownOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full right-0 mt-3 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-3xl"
                  >
                     <button 
                        onClick={() => { setIsPassModalOpen(true); setIsUserDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl text-slate-600 dark:text-slate-300 transition-colors text-xs font-bold"
                     >
                        <KeyRound className="w-4 h-4 text-purple-500" />
                        Alterar Senha
                     </button>
                     <button 
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl text-rose-600 transition-colors text-xs font-bold"
                     >
                        <LogOut className="w-4 h-4" />
                        Terminar Sessão
                     </button>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-8 space-y-8 max-w-[1700px] mx-auto relative z-10">
          <Outlet />
        </div>
      </main>


      {/* Password Change Modal */}
      {isPassModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsPassModalOpen(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-sm glass p-8 rounded-[2.5rem] border-white/10 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-black text-slate-900 dark:text-white">Segurança</h3>
               <button onClick={() => setIsPassModalOpen(false)} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handlePassChange} className="space-y-4">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Senha Atual</label>
                  <input 
                    type="password" 
                    value={oldPass}
                    onChange={(e) => setOldPass(e.target.value)}
                    className="w-full mt-1.5 px-4 py-3 bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="••••"
                  />
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nova Senha</label>
                  <input 
                    type="password" 
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full mt-1.5 px-4 py-3 bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="Mín. 4 caracteres"
                  />
               </div>

               {passError && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-wider text-center">Senha atual incorreta</p>}
               {passSuccess && <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider text-center">Senha alterada com sucesso!</p>}

               <button 
                  type="submit"
                  className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all pt-4"
               >
                  Guardar Nova Senha
               </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default AppLayout;
