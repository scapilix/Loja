import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterState {
  year: string;
  month: string;
  days: string[]; // Changed from day to days for multi-selection
}

interface SmartDateFilterProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  availableFilters: {
    years: string[];
    months: string[];
    days: string[];
  };
  counts: {
    years: Record<string, number>;
    months: Record<string, number>;
    days: Record<string, number>;
  };
  itemLabel?: string;
}

export const SmartDateFilter: React.FC<SmartDateFilterProps> = ({ filters, setFilters, availableFilters, counts, itemLabel = 'Vendas' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleYearSelect = (y: string) => {
    setFilters(prev => ({ 
      year: prev.year === y ? '' : y, 
      month: '', 
      days: [] 
    }));
  };

  const handleMonthSelect = (m: string) => {
    if (!filters.year) return; // Must select year first
    setFilters(prev => ({ 
      ...prev, 
      month: prev.month === m ? '' : m,
      days: [] 
    }));
  };

  const handleDaySelect = (d: string, event: React.MouseEvent) => {
    if (!filters.month) return; // Must select month first
    
    const isCtrlPressed = event.ctrlKey || event.metaKey; // Support Windows (Ctrl) and Mac (Cmd)
    
    setFilters(prev => {
      const currentDays = prev.days || [];
      
      if (isCtrlPressed) {
        // Multi-select: toggle day in array
        if (currentDays.includes(d)) {
          return { ...prev, days: currentDays.filter(day => day !== d) };
        } else {
          return { ...prev, days: [...currentDays, d].sort() };
        }
      } else {
        // Single select: replace selection
        return { ...prev, days: currentDays.includes(d) && currentDays.length === 1 ? [] : [d] };
      }
    });
  };

  const clearFilters = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFilters({ year: '', month: '', days: [] });
    setIsOpen(false);
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const getActiveLabel = () => {
    const parts = [];
    if (filters.year) parts.push(filters.year);
    if (filters.month) parts.push(monthNames[parseInt(filters.month) - 1]);
    if (filters.days && filters.days.length > 0) {
      if (filters.days.length === 1) {
        parts.push(`Dia ${filters.days[0]}`);
      } else {
        parts.push(`${filters.days.length} Dias`);
      }
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'Filtrar por Data';
  };

  // Helper to generate calendar days grid if needed, 
  // but for "data driven" filters, we should only show available days.
  // We'll trust availableFilters.days which comes from the hook matching the current filter context
  // NOTE: availableFilters.days in the hook might be "all days" if we don't be careful. 
  // Ideally the hook filters available options based on selection.
  // Assuming the parent component handles availability logic or we render provided days.

  return (
    <div className="relative z-50" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300 group
          ${isOpen || filters.year 
            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' 
            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm border border-slate-200 dark:border-white/10'}
        `}
      >
        <Calendar className={`w-5 h-5 ${isOpen || filters.year ? 'text-white' : 'text-purple-500'}`} />
        <span className="font-bold text-sm tracking-wide">{getActiveLabel()}</span>
        {filters.year ? (
          <div 
            onClick={clearFilters}
            className="ml-2 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-3 h-3" />
          </div>
        ) : (
          <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-3 w-[340px] bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-3xl p-4 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border border-slate-300/50 dark:border-white/10 flex flex-col gap-4 ring-1 ring-black/5 z-50"
          >
            {/* Year Selection */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ano</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableFilters.years.map(year => (
                  <button
                    key={year}
                    onClick={() => handleYearSelect(year)}
                    className={`
                      px-3 py-1.5 rounded-xl text-sm font-bold transition-all duration-200 flex-1
                      ${filters.year === year 
                        ? 'bg-purple-600 text-white shadow-md' 
                        : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-purple-500/10 hover:text-purple-600 shadow-sm border border-slate-200/50'}
                    `}
                  >
                    {year}
                    <span className={`block text-[9px] mt-0.5 ${filters.year === year ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                      {counts.years[year] || 0} {itemLabel}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Month Selection */}
            <div className={`transition-opacity duration-300 ${!filters.year ? 'opacity-40 pointer-events-none blur-[1px]' : ''}`}>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Mês</span>
                {!filters.year && <span className="text-[9px] text-rose-500 font-bold">Selecione um ano</span>}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {monthNames.map((month, idx) => {
                  const monthNum = (idx + 1).toString().padStart(2, '0');
                  const isAvailable = availableFilters.months.includes(monthNum);
                  
                  return (
                    <button
                      key={month}
                      disabled={!isAvailable}
                      onClick={() => handleMonthSelect(monthNum)}
                      className={`
                        py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200
                        ${filters.month === monthNum
                          ? 'bg-purple-600 text-white shadow-md'
                          : isAvailable 
                            ? 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-purple-500/10 hover:text-purple-600 shadow-sm border border-slate-200/50'
                            : 'bg-transparent text-slate-300 dark:text-slate-700 cursor-not-allowed'}
                      `}
                    >
                      {month.slice(0, 3)}
                      {isAvailable && (
                        <span className={`block text-[8px] mt-0.5 ${filters.month === monthNum ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                          {counts.months[monthNum] || 0}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Day Selection - Scrollable Grid */}
            <div className={`transition-opacity duration-300 ${!filters.month ? 'opacity-40 pointer-events-none blur-[1px]' : ''}`}>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Dia</span>
              </div>
              
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((dayName) => (
                  <div 
                    key={dayName} 
                    className="w-7 h-5 flex items-center justify-center text-[9px] font-bold text-slate-500 dark:text-slate-400"
                  >
                    {dayName}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 31 }, (_, i) => {
                  const day = (i + 1).toString().padStart(2, '0');
                  const isSelected = filters.days?.includes(day) || false;
                  const dayCount = counts.days[day] || 0;
                  const hasData = dayCount > 0;
                  
                  return (
                    <button
                      key={day}
                      onClick={(e) => handleDaySelect(day, e)}
                      className={`
                        relative w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-200
                        ${isSelected
                          ? 'bg-emerald-600 text-white shadow-md scale-110'
                          : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-emerald-500 hover:text-white shadow-sm border border-slate-200/50'}
                      `}
                    >
                      {i + 1}
                      {hasData && (
                        <span className={`
                          absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold px-1
                          ${isSelected 
                            ? 'bg-white text-emerald-600' 
                            : 'bg-emerald-600 text-white'}
                          shadow-md
                        `}>
                          {dayCount > 99 ? '+' : dayCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
