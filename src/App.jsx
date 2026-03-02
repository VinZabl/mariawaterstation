/* src/App.jsx */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Deliveries from './pages/Deliveries';
import Customers from './pages/Customers';
import Transactions from './pages/Transactions';
import Settings from './pages/Settings';
import AdminLock from './components/AdminLock';
import { useStore } from './context/StoreContext';

function AppRoutes() {
  const { loading } = useStore();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', flexDirection: 'column', gap: '1rem',
        color: 'var(--text-muted)', fontSize: '1rem'
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          border: '3px solid var(--border-light)',
          borderTopColor: 'var(--primary)',
          animation: 'spin 0.8s linear infinite'
        }} />
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="pos" element={<POS />} />
        <Route path="transactions" element={<Transactions />} />

        {/* Protected Routes */}
        <Route path="inventory" element={<AdminLock><Inventory /></AdminLock>} />
        <Route path="deliveries" element={<AdminLock><Deliveries /></AdminLock>} />
        <Route path="customers" element={<AdminLock><Customers /></AdminLock>} />
        <Route path="settings" element={<AdminLock><Settings /></AdminLock>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
