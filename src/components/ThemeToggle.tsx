import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ThemeToggleProps {
  isDark: boolean;
  toggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, toggle }) => {
  return (
    <button
      onClick={toggle}
      className="p-3 rounded-2xl glass glass-hover relative overflow-hidden group transition-all active:scale-95"
      title={isDark ? "Mudar para Modo Dia" : "Mudar para Modo Noite"}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : 90, opacity: isDark ? 0 : 1 }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <Sun className="w-5 h-5 text-orange-500" />
      </motion.div>
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : -90, opacity: isDark ? 1 : 0 }}
        className="flex items-center justify-center"
      >
        <Moon className="w-5 h-5 text-blue-400" />
      </motion.div>
    </button>
  );
};
