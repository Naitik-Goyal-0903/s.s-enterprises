import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProperties, getBookings, getBookingStats } from '../services/api';
import AdminProperties from './AdminProperties';
import AdminBookings from './AdminBookings';
import AdminPipeline from './AdminPipeline';

export default function AdminDashboard({ setIsAdminAuth }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeListings: 0,
    totalBookings: 0,
    bookingsByStatus: {}
  });

  const tabs = useMemo(
    () => [
      { id: 'dashboard', label: 'Dashboard', desc: 'Business overview and KPIs' },
      { id: 'properties', label: 'Properties', desc: 'Inventory and media management' },
      { id: 'bookings', label: 'Bookings CRM', desc: 'Lead follow-up and notes' },
      { id: 'pipeline', label: 'Pipeline', desc: 'Stage-wise deal movement' }
    ],
    []
  );

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [propsRes, bookingsRes, statsRes] = await Promise.all([
        getProperties(),
        getBookings(),
        getBookingStats()
      ]);

      setStats({
        totalProperties: propsRes.data.count,
        activeListings: propsRes.data.data.filter((p) => p.isActive).length,
        totalBookings: bookingsRes.data.count,
        bookingsByStatus: statsRes.data.data.byStatus || {}
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAdminAuth(false);
    navigate('/rk-secure-admin-portal-2026');
  };

  const topStatuses = Object.entries(stats.bookingsByStatus)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const conversionRate = stats.totalBookings
    ? (((stats.bookingsByStatus.Closed || 0) / stats.totalBookings) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand-wrap">
          <p className="admin-brand-title">S.S ENTERPRISES</p>
          <p className="admin-brand-subtitle">Executive Admin Console</p>
        </div>

        <nav className="admin-nav-list">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`admin-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="admin-nav-label">{tab.label}</span>
              <span className="admin-nav-desc">{tab.desc}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button type="button" onClick={handleLogout} className="admin-logout-btn">
            Logout Securely
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <p className="admin-topbar-kicker">Admin Workspace</p>
            <h1>
              {activeTab === 'dashboard' && 'Business Performance Dashboard'}
              {activeTab === 'properties' && 'Properties & Media Operations'}
              {activeTab === 'bookings' && 'Lead CRM & Follow-up Desk'}
              {activeTab === 'pipeline' && 'Sales Pipeline Control'}
            </h1>
            <p className="admin-topbar-meta">Manage listings, leads, and conversion pipeline in one place.</p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={fetchStats}>
            Refresh Live Data
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div>
            <div className="stats-grid">
              <div className="stat-card">
                <h4>Total Properties</h4>
                <div className="value">{stats.totalProperties}</div>
                <p className="admin-card-note">Complete inventory count</p>
              </div>
              <div className="stat-card">
                <h4>Active Listings</h4>
                <div className="value">{stats.activeListings}</div>
                <p className="admin-card-note">Currently visible to visitors</p>
              </div>
              <div className="stat-card">
                <h4>Total Leads</h4>
                <div className="value">{stats.totalBookings}</div>
                <p className="admin-card-note">Captured enquiries and bookings</p>
              </div>
              <div className="stat-card">
                <h4>Conversion Rate</h4>
                <div className="value">{conversionRate}%</div>
                <p className="admin-card-note">Closed deals vs total leads</p>
              </div>
            </div>

            <div className="admin-overview-grid">
              <section className="card">
                <h3 style={{ marginBottom: '1rem' }}>Lead Stage Distribution</h3>
                <div className="admin-status-stack">
                  {topStatuses.length === 0 && <p className="admin-muted">No leads yet. Create first enquiry from site.</p>}
                  {topStatuses.map(([status, count]) => {
                    const width = stats.totalBookings ? Math.max((count / stats.totalBookings) * 100, 6) : 0;
                    return (
                      <div key={status} className="admin-status-row">
                        <div className="admin-status-row-head">
                          <span>{status}</span>
                          <strong>{count}</strong>
                        </div>
                        <div className="admin-status-bar">
                          <span style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="admin-quick-actions">
                <button type="button" className="admin-action-card" onClick={() => setActiveTab('properties')}>
                  <h4>Manage Property Inventory</h4>
                  <p>Add listings, upload photos, and update availability status.</p>
                </button>
                <button type="button" className="admin-action-card" onClick={() => setActiveTab('bookings')}>
                  <h4>Handle New Enquiries</h4>
                  <p>Prioritize leads, update follow-up status, and save notes.</p>
                </button>
                <button type="button" className="admin-action-card" onClick={() => setActiveTab('pipeline')}>
                  <h4>Track Deal Closures</h4>
                  <p>Monitor stage movement and improve team conversion velocity.</p>
                </button>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'properties' && <AdminProperties onPropertyAdded={fetchStats} />}
        {activeTab === 'bookings' && <AdminBookings />}
        {activeTab === 'pipeline' && <AdminPipeline />}
      </main>
    </div>
  );
}
