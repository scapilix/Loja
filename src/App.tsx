import { useState, useEffect, useMemo } from 'react'
import { LayoutDashboard, Users, ShoppingCart, Package, BarChart3, TrendingUp, DollarSign, Briefcase, ChevronRight, Filter, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { KpiCard } from './components/KpiCard'
import { DataTable } from './components/DataTable'
import { ThemeToggle } from './components/ThemeToggle'
import { TopClientes } from './components/TopClientes'
import { TopProdutos } from './components/TopProdutos'
import { ProdutosPorLocalidade } from './components/ProdutosPorLocalidade'
import { DiasDaSemana } from './components/DiasDaSemana'
import { VendasPorDia } from './components/VendasPorDia'
import { MetodosPagamento } from './components/MetodosPagamento'
import { StockAnalysis } from './components/StockAnalysis'
import { SmartDateFilter } from './components/SmartDateFilter'
import { useDashboardData } from './hooks/useDashboardData'
import rawData from './data/data.json'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isDark, setIsDark] = useState(false)
  
  // Filter State
  const [filters, setFilters] = useState({
    year: '',
    month: '',
    days: [] as string[] // Changed from day to days for multi-selection
  })

  const { 
    totalRevenue, 
    totalProfit, 
    orderCount, 
    avgTicket, 
    topCustomers,
    topProducts,
    salesByLocation,
    salesByDayOfWeek,
    customerSalesCount,
    salesByDate,
    paymentMethodData,
    isFiltered,
    availableFilters,
    filterCounts
  } = useDashboardData(filters)

  // Memoized sorted customers for the Clientes tab with their purchases
  const sortedCustomers = useMemo(() => {
    const customers = [...(rawData as any).customers || []];
    const allOrders = (rawData as any).orders || [];

    return customers
      .map(customer => ({
        ...customer,
        // Attach history of purchases for this customer
        items: allOrders
          .filter((o: any) => o.nome_cliente === customer.nome_cliente)
          .map((o: any) => ({
            ref: o.id_venda || 'N/A',
            pvp: o.pvp,
            lucro: o.lucro,
            localidade: o.data_venda ? new Date(o.data_venda).toLocaleDateString() : 'Sem data'
          }))
      }))
      .sort((a, b) => {
        const countA = customerSalesCount[a.nome_cliente] || 0;
        const countB = customerSalesCount[b.nome_cliente] || 0;
        return countB - countA;
      });
  }, [customerSalesCount]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  const formatCurrency = (val: number) => 
    val?.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' }) || '0,00 €'

  const orderColumns = [
    { header: 'ID', accessor: 'id_venda' },
    { header: 'Cliente', accessor: 'nome_cliente' },
    { header: 'Data', accessor: 'data_venda', render: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    { header: 'Items', accessor: 'item_count', render: (v: any) => (
      <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-lg text-xs font-black">
        {v} PRODUTOS
      </span>
    )},
    { header: 'Total (REF)', accessor: 'pvp', render: (v: any) => (
      <span className="font-black text-slate-900 dark:text-white">{formatCurrency(v)}</span>
    )},
    { header: 'Lucro', accessor: 'lucro', render: (v: any) => (
      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(v)}</span>
    )},
    { header: 'Pagamento', accessor: 'forma_de_pagamento' },
  ]

  const customerColumns = [
    { header: 'Nome', accessor: 'nome_cliente' },
    { header: 'Localidade', accessor: 'localidade' },
    { header: 'Telemóvel', accessor: 'telefone_cliente' },
    { header: 'Email', accessor: 'email_cliente' },
    { 
      header: 'Nº Compras', 
      accessor: 'nome_cliente',
      render: (customerName: any) => {
        const count = customerSalesCount[customerName] || 0;
        return (
          <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-lg text-xs font-black">
            {count} {count === 1 ? 'COMPRA' : 'COMPRAS'}
          </span>
        );
      }
    },
  ]

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  }

  return (
    <div className="flex h-screen bg-[#fdfaff] dark:bg-[#08040d] text-slate-900 dark:text-slate-50 overflow-hidden font-sans transition-colors duration-500">
      {/* Sidebar */}
      <aside className="w-72 bg-white/40 dark:bg-white/[0.02] backdrop-blur-3xl border-r border-purple-100/50 dark:border-white/[0.05] flex flex-col z-30">
        <div className="p-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/40 transform transition-all hover:scale-110 hover:rotate-6 cursor-pointer">
            <BarChart3 className="text-white w-7 h-7" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tighter text-gradient leading-none">Antigravity</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500/60 dark:text-purple-400/40 mt-1">Enterprise</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'orders', label: 'Encomendas', icon: ShoppingCart },
            { id: 'customers', label: 'Clientes', icon: Users },
            { id: 'stock', label: 'Inventário', icon: Package },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                activeTab === item.id 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 dark:bg-white/10 dark:text-white dark:shadow-none dark:border dark:border-white/5' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white'
              }`}
            >
              {activeTab === item.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute left-0 w-1 h-8 bg-white/20 rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon className={`w-5 h-5 transition-all duration-300 ${activeTab === item.id ? 'text-white' : 'group-hover:text-purple-600 dark:group-hover:text-purple-400'}`} />
              <span className={`font-medium text-sm tracking-wide transition-all ${activeTab === item.id ? 'font-bold' : ''}`}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-8 mt-auto">
          <div className="glass p-6 rounded-3xl border-white/20 dark:border-white/5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-xs font-bold text-slate-400">System Status</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '92%' }}
                className="h-full bg-emerald-500"
              />
            </div>
            <p className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest text-center">92% Operational</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-[#fdfaff] dark:bg-transparent scroll-smooth">
        {/* Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[100px]"></div>
        </div>
        
        <header className="sticky top-0 z-20 p-10 flex justify-between items-center backdrop-blur-xl border-b border-purple-100/50 dark:border-white/[0.05] bg-white/40 dark:bg-transparent">
          <div className="flex flex-col">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold tracking-tight capitalize bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
                {activeTab === 'stock' ? 'Inventário' : activeTab}
              </h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Gestão Comercial & Analytics</p>
          </div>
          
          <div className="flex items-center gap-8">
            <ThemeToggle isDark={isDark} toggle={() => setIsDark(!isDark)} />
            
            <div className="flex items-center gap-5 pl-8 border-l border-slate-200 dark:border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.1em]">Ricardo Souza</p>
                <p className="text-[10px] text-purple-500 dark:text-purple-400 font-black uppercase tracking-widest mt-0.5">Administrator</p>
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center text-gradient font-black text-xl shadow-lg ring-1 ring-black/5">
                  RS
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-10 lg:p-14 space-y-14 max-w-[1700px] mx-auto relative z-10">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="space-y-12"
              >
                {/* Filter Bar */}
                <div className="relative z-50 flex flex-wrap items-center justify-between gap-4 bg-white/50 dark:bg-slate-800/40 p-3 rounded-3xl border border-purple-100 dark:border-purple-800/20 backdrop-blur-xl">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-white/5 rounded-2xl">
                      <Filter className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-black text-purple-900 dark:text-purple-300 uppercase tracking-wider">Smart Filters</span>
                    </div>
                    
                    <SmartDateFilter 
                      filters={filters} 
                      setFilters={setFilters} 
                      availableFilters={availableFilters as any} 
                      counts={filterCounts}
                    />
                  </div>

                  {isFiltered && (
                    <button 
                      onClick={() => setFilters({ year: '', month: '', days: [] })}
                      className="flex items-center gap-2 px-5 py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 mr-2"
                    >
                      <X className="w-4 h-4" />
                      Limpar
                    </button>
                  )}
                </div>

                {/* KPI Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  <KpiCard 
                    label="Faturamento Total" 
                    value={formatCurrency(totalRevenue)} 
                    icon={DollarSign} 
                    trend="+12.5% vs fev"
                    color="purple"
                  />
                  <KpiCard 
                    label="Lucro Líquido" 
                    value={formatCurrency(totalProfit)} 
                    icon={TrendingUp} 
                    trend="+8.2% vs fev"
                    color="green"
                  />
                  <KpiCard 
                    label="Total de Compras" 
                    value={orderCount} 
                    icon={ShoppingCart} 
                    trend={`Vol: ${orderCount}`}
                    color="purple"
                  />
                  <KpiCard 
                    label="Ticket Médio" 
                    value={formatCurrency(avgTicket)} 
                    icon={Briefcase} 
                    trend="Ideal: > 25€"
                    color="orange"
                  />
                </div>



                {/* Charts Section Removed as per request */}

                {/* Full Width Chart Section */}
                <div className="w-full">
                  <VendasPorDia dailySales={salesByDate} />
                </div>

                {/* Analytics Section - Top Customers & Products */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <TopClientes customers={topCustomers} />
                  <TopProdutos products={topProducts} />
                </div>

                {/* Analytics Section - Payment Methods */}
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-10">
                  <MetodosPagamento paymentMethods={paymentMethodData} />
                </div>

                {/* Analytics Section - Location Distribution */}
                <ProdutosPorLocalidade locations={salesByLocation} />

                {/* Analytics Section - Day of Week Analysis */}
                <DiasDaSemana days={salesByDayOfWeek} />

                {/* Recent Orders Shortcut Card */}
                <div className="glass p-10 rounded-[2.5rem] group cursor-pointer" onClick={() => setActiveTab('orders')}>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">Explorador de Encomendas</h3>
                      <p className="text-slate-500 text-sm mt-1">Dados agrupados com detalhamento de itens</p>
                    </div>
                    <ChevronRight className="w-8 h-8 text-purple-500 transform group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div 
                key="orders"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="h-[800px]"
              >
                <DataTable 
                  columns={orderColumns} 
                  data={rawData.orders || []} 
                  title="Log de Encomendas" 
                />
              </motion.div>
            )}

            {activeTab === 'customers' && (
              <motion.div 
                key="customers"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="h-[800px]"
              >
                <DataTable 
                  columns={customerColumns} 
                  data={sortedCustomers} 
                  title="Base de Clientes" 
                />
              </motion.div>
            )}

            {activeTab === 'stock' && (
              <motion.div 
                key="stock"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="w-full"
              >
                <StockAnalysis />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

export default App
