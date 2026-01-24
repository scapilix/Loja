import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon: Icon, trend, color = 'blue' }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="relative overflow-hidden p-6 rounded-3xl bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-3xl border border-white/50 dark:border-white/10 hover:shadow-2xl transition-all duration-300 group"
    >
      <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500`}>
        <Icon className={`w-32 h-32 text-slate-900 dark:text-white transform rotate-12 group-hover:rotate-6 transition-transform duration-500`} />
      </div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-6">
          <div className={`p-3.5 rounded-2xl bg-${color}-500/10 text-${color}-600 dark:text-${color}-400 ring-1 ring-${color}-500/20`}>
            <Icon className="w-6 h-6" />
          </div>
          {trend && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5">
              {trend}
            </span>
          )}
        </div>

        <div>
           <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1 tracking-wide">{label}</p>
           <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</h3>
        </div>
      </div>
    </motion.div>
  );
};
