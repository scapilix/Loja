import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppLayout from '../components/Layout/AppLayout';
import Overview from '../pages/Overview';
import Clientes from '../pages/Clientes';
import BaseClientes from '../pages/BaseClientes';
import Produtos from '../pages/Produtos';
import Rankings from '../pages/Rankings';
import Portes from '../pages/Portes';
import Faturas from '../pages/Faturas';
import Despesas from '../pages/Despesas';
import Login from '../pages/Login';
import { FilterProvider } from '../contexts/FilterContext';
import { DataProvider } from '../contexts/DataContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import rawData from '../data/data.json';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuth();
  const location = useLocation();

  if (!isInitialized) return null; // Wait for session check

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <HashRouter>
      <AuthProvider>
        <DataProvider initialData={rawData as any}>
          <FilterProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<Overview />} />
                <Route path="clientes" element={<Clientes />} />
                <Route path="base-clientes" element={<BaseClientes />} />
                <Route path="produtos" element={<Produtos />} />
                <Route path="rankings" element={<Rankings />} />
                <Route path="portes" element={<Portes />} />
                <Route path="faturas" element={<Faturas />} />
                <Route path="despesas" element={<Despesas />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </FilterProvider>
        </DataProvider>
      </AuthProvider>
    </HashRouter>
  );
}

export default AppRoutes;
