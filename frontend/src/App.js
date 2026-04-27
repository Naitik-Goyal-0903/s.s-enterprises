import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { verifyToken as verifyAdminToken } from './services/api';

// Pages
import HomePage from './pages/HomePage';
import PropertiesPage from './pages/PropertiesPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import AdminLogin from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';

const ADMIN_ENTRY_PATH = '/rk-secure-admin-portal-2026';
const ADMIN_ALIAS_PATH = '/aadmin';
const ADMIN_DIRECT_PATH = '/admin';

function App() {
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Support clean URLs on static hosting by redirecting to hash routes.
    const path = (window.location.pathname || '').toLowerCase();

    if (path === ADMIN_ALIAS_PATH) {
      window.location.replace(`${window.location.origin}/#${ADMIN_ALIAS_PATH}`);
      return;
    }

    if (path === ADMIN_ENTRY_PATH) {
      window.location.replace(`${window.location.origin}/#${ADMIN_ENTRY_PATH}`);
      return;
    }

    if (path === ADMIN_DIRECT_PATH || path.startsWith(`${ADMIN_DIRECT_PATH}/`)) {
      window.location.replace(`${window.location.origin}/#${ADMIN_DIRECT_PATH}`);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setIsAdminAuth(false);
        setLoading(false);
        return;
      }

      try {
        await verifyAdminToken();
        setIsAdminAuth(true);
      } catch (error) {
        localStorage.removeItem('adminToken');
        setIsAdminAuth(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <HashRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/property/:id" element={<PropertyDetailPage />} />

        {/* Admin Routes */}
        <Route 
          path={ADMIN_ENTRY_PATH}
          element={isAdminAuth ? <Navigate to="/admin" /> : <AdminLogin setIsAdminAuth={setIsAdminAuth} />} 
        />
        <Route
          path={ADMIN_ALIAS_PATH}
          element={isAdminAuth ? <Navigate to="/admin" /> : <AdminLogin setIsAdminAuth={setIsAdminAuth} />}
        />
        <Route 
          path="/admin/*" 
          element={isAdminAuth ? <AdminDashboard setIsAdminAuth={setIsAdminAuth} /> : <Navigate to={ADMIN_ALIAS_PATH} />} 
        />
      </Routes>
    </HashRouter>
  );
}

export default App;
