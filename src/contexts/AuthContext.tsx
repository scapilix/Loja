import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: { name: string } | null;
  login: (password: string) => boolean;
  logout: () => void;
  changePassword: (oldP: string, newP: string) => boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PASS_KEY = 'antigravity_admin_pass';
const LOGGED_KEY = 'antigravity_is_logged';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [password, setPassword] = useState(() => localStorage.getItem(PASS_KEY) || '0000');

  useEffect(() => {
    const isLogged = sessionStorage.getItem(LOGGED_KEY) === 'true';
    if (isLogged) {
      setUser({ name: 'Diana' });
    }
    setIsInitialized(true);
  }, []);

  const login = (input: string) => {
    if (input === password) {
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

  const changePassword = (oldP: string, newP: string) => {
    if (oldP === password) {
      setPassword(newP);
      localStorage.setItem(PASS_KEY, newP);
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
