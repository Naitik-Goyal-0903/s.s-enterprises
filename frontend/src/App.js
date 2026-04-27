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

function App() {
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [loading, setLoading] = useState(true);

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
          path="/admin/*" 
          element={isAdminAuth ? <AdminDashboard setIsAdminAuth={setIsAdminAuth} /> : <Navigate to={ADMIN_ENTRY_PATH} />} 
        />
      </Routes>
    </HashRouter>
  );
}

export default App;
