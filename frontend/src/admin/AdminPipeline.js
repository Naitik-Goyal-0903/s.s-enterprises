import React, { useState, useEffect } from 'react';
import { getBookings, updateBooking } from '../services/api';

export default function AdminPipeline() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const statuses = ['New', 'Contacted', 'Qualified', 'Visited', 'Negotiating', 'Closed', 'Lost'];

  const statusColors = {
    New: '#f59e0b',
    Contacted: '#3b82f6',
    Qualified: '#8b5cf6',
    Visited: '#06b6d4',
    Negotiating: '#ec4899',
    Closed: '#10b981',
    Lost: '#ef4444'
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await getBookings();
      setBookings(response.data.data || []);
    } catch (error) {
      console.error('Error fetching pipeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const moveStatus = async (bookingId, direction) => {
    const current = bookings.find((booking) => booking._id === bookingId);
    if (!current) return;

    const currentIndex = statuses.indexOf(current.status);
    if (currentIndex === -1) return;

    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= statuses.length) return;

    try {
      await updateBooking(bookingId, { status: statuses[nextIndex] });
      fetchData();
    } catch (error) {
      alert('Unable to move lead to next stage.');
    }
  };

  const totalLeads = bookings.length;
  const closedDeals = bookings.filter((booking) => booking.status === 'Closed').length;
  const conversionRate = totalLeads ? ((closedDeals / totalLeads) * 100).toFixed(1) : '0.0';

  if (loading) return <p>Loading pipeline...</p>;

  return (
    <div>
      <div className="admin-module-head">
        <div>
          <h2>Sales Pipeline</h2>
          <p>Move leads across stages and monitor closure performance.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={fetchData}>Refresh Pipeline</button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.2rem' }}>
        <div className="stat-card">
          <h4>Total Leads</h4>
          <div className="value">{totalLeads}</div>
        </div>
        <div className="stat-card">
          <h4>Closed Deals</h4>
          <div className="value">{closedDeals}</div>
        </div>
        <div className="stat-card">
          <h4>Conversion</h4>
          <div className="value">{conversionRate}%</div>
        </div>
      </div>

      <div className="admin-pipeline-board">
        {statuses.map((status) => {
          const stageItems = bookings.filter((booking) => booking.status === status);

          return (
            <section key={status} className="admin-pipeline-column" style={{ borderTopColor: statusColors[status] }}>
              <header>
                <h3>{status}</h3>
                <span>{stageItems.length}</span>
              </header>

              <div className="admin-pipeline-list">
                {stageItems.length === 0 && <p className="admin-muted">No leads here</p>}
                {stageItems.map((booking) => {
                  const stageIndex = statuses.indexOf(booking.status);
                  return (
                    <article key={booking._id} className="admin-pipeline-card">
                      <h4>{booking.name}</h4>
                      <p>{booking.propertyName}</p>
                      <p>{booking.phone}</p>
                      {booking.budget && <strong>₹{Number(booking.budget).toLocaleString('en-IN')}</strong>}

                      <div className="admin-pipeline-actions">
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={stageIndex === 0}
                          onClick={() => moveStatus(booking._id, 'prev')}
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          disabled={stageIndex === statuses.length - 1}
                          onClick={() => moveStatus(booking._id, 'next')}
                        >
                          Next
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
