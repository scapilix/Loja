import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: { name: string } | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (oldP: string, newP: string) => Promise<boolean>;
  isInitialized: boolean;
  isSyncing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOGGED_KEY = 'antigravity_is_logged';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [globalPassword, setGlobalPassword] = useState('0000');

  useEffect(() => {
    const isLogged = sessionStorage.getItem(LOGGED_KEY) === 'true';
    if (isLogged) {
      setUser({ name: 'Diana' });
    }
    fetchGlobalPassword();
    setIsInitialized(true);
  }, []);

  const fetchGlobalPassword = async () => {
    try {
      setIsSyncing(true);
      const { data, error } = await supabase
        .from('loja_auth_config')
        .select('password')
        .eq('id', 1)
        .single();
      
      if (data && !error) {
        setGlobalPassword(data.password);
      }
    } catch (err) {
      console.error('Failed to sync global password:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const login = async (input: string) => {
    // Re-fetch password to ensure we have the absolute latest before checking
    await fetchGlobalPassword();
    
    if (input === globalPassword) {
      setUser({ name: 'Diana' });
      sessionStorage.setItem(LOGGED_KEY, 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(LOGGED_KEY);
  };

  const changePassword = async (oldP: string, newP: string) => {
    // Check against latest known password
    if (oldP === globalPassword) {
      try {
        const { error } = await supabase
          .from('loja_auth_config')
          .update({ password: newP, updated_at: new Date().toISOString() })
          .eq('id', 1);

        if (!error) {
          setGlobalPassword(newP);
          return true;
        }
      } catch (err) {
        console.error('Failed to update global password:', err);
      }
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword, isInitialized, isSyncing }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
