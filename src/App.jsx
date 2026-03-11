/* src/App.jsx */
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Deliveries from './pages/Deliveries';
import Customers from './pages/Customers';
import Transactions from './pages/Transactions';
import Settings from './pages/Settings';
import CustomerOrder from './pages/CustomerOrder';
import MenuManager from './pages/MenuManager';
import AdminLock from './components/AdminLock';
import SplashScreen from './components/SplashScreen';
import { useStore } from './context/StoreContext';

// Resets on every hard page load; survives React re-renders and SPA navigation
let splashShown = false;

function AppRoutes() {
  const { loading } = useStore();
  const isAdminRoute = window.location.pathname.startsWith('/admin');
  const [splashDone, setSplashDone] = useState(() => splashShown || !isAdminRoute);

  const handleSplashDone = () => {
    splashShown = true;
    setSplashDone(true);
  };

  if (!splashDone) {
    return <SplashScreen onDone={handleSplashDone} />;
  }

  // Customer page has its own branded splash & data fetching — skip the global admin loader
  if (loading && isAdminRoute) {
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
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/order" replace />} />
      <Route path="/order" element={<CustomerOrder />} />

      {/* Admin panel — Dashboard, POS, and Transactions are always open */}
      <Route path="/admin" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="pos" element={<POS />} />
        <Route path="transactions" element={<Transactions />} />
        
        {/* Sensitive management/settings routes are gated by password */}
        <Route path="inventory" element={<AdminLock><Inventory /></AdminLock>} />
        <Route path="menu" element={<AdminLock><MenuManager /></AdminLock>} />
        <Route path="deliveries" element={<AdminLock><Deliveries /></AdminLock>} />
        <Route path="customers" element={<AdminLock><Customers /></AdminLock>} />
        <Route path="settings" element={<AdminLock><Settings /></AdminLock>} />

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/order" replace />} />
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
