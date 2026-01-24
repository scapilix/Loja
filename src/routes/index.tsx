import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/Layout/AppLayout';
import Overview from '../pages/Overview';
import Clientes from '../pages/Clientes';
import BaseClientes from '../pages/BaseClientes';
import Produtos from '../pages/Produtos';
import Rankings from '../pages/Rankings';
import Portes from '../pages/Portes';
import { FilterProvider } from '../contexts/FilterContext';
import { DataProvider } from '../contexts/DataContext';
import rawData from '../data/data.json';

function AppRoutes() {
  return (
    <HashRouter>
      <DataProvider initialData={rawData as any}>
        <FilterProvider>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Overview />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="base-clientes" element={<BaseClientes />} />
              <Route path="produtos" element={<Produtos />} />
              <Route path="rankings" element={<Rankings />} />
              <Route path="portes" element={<Portes />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </FilterProvider>
      </DataProvider>
    </HashRouter>
  );
}

export default AppRoutes;
