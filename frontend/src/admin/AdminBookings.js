import React, { useState, useEffect, useMemo } from 'react';
import { getBookings, updateBooking } from '../services/api';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [notes, setNotes] = useState({});
  const [expandedNotes, setExpandedNotes] = useState(null);

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
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await getBookings();
      setBookings(response.data.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const statusOk = statusFilter === 'All' ? true : booking.status === statusFilter;
      const query = searchText.trim().toLowerCase();
      const queryOk =
        query.length === 0
          ? true
          : `${booking.name} ${booking.phone} ${booking.propertyName}`.toLowerCase().includes(query);
      return statusOk && queryOk;
    });
  }, [bookings, statusFilter, searchText]);

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await updateBooking(bookingId, { status: newStatus });
      fetchBookings();
    } catch (error) {
      alert('Unable to update status.');
    }
  };

  const handleNotesSave = async (bookingId) => {
    try {
      await updateBooking(bookingId, { notes: notes[bookingId] || '' });
      fetchBookings();
      setExpandedNotes(null);
    } catch (error) {
      alert('Unable to save notes.');
    }
  };

  const handleWhatsApp = (phone, propertyName) => {
    const message = `Hi, regarding enquiry for ${propertyName}, this is S.S Enterprises team.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div>
      <div className="admin-module-head">
        <div>
          <h2>Bookings CRM</h2>
          <p>Track enquiries, update status, and keep internal notes for each lead.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={fetchBookings}>
          Refresh Leads
        </button>
      </div>

      <div className="admin-filters-bar">
        <input
          type="text"
          placeholder="Search by name, phone, or property"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All Stages</option>
          {statuses.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <p>Loading bookings...</p>
        ) : filteredBookings.length === 0 ? (
          <p className="admin-muted">No leads found for current filters.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Lead</th>
                <th>Property</th>
                <th>Budget</th>
                <th>Status</th>
                <th>Visit Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <React.Fragment key={booking._id}>
                  <tr>
                    <td>
                      <strong>{booking.name}</strong>
                      <p className="admin-mini-text">{booking.phone}</p>
                      <p className="admin-mini-text">{booking.email}</p>
                    </td>
                    <td>{booking.propertyName}</td>
                    <td>{booking.budget ? `₹${Number(booking.budget).toLocaleString('en-IN')}` : '-'}</td>
                    <td>
                      <select
                        value={booking.status}
                        onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                        style={{
                          marginBottom: 0,
                          background: '#fff',
                          borderColor: statusColors[booking.status] || '#cbd5e1',
                          color: '#0f172a',
                          fontWeight: 600
                        }}
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td>{booking.visitDate ? new Date(booking.visitDate).toLocaleDateString() : '-'}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => handleWhatsApp(booking.phone, booking.propertyName)}>
                          WhatsApp
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => {
                            setExpandedNotes(expandedNotes === booking._id ? null : booking._id);
                            setNotes((prev) => ({ ...prev, [booking._id]: prev[booking._id] ?? booking.notes ?? '' }));
                          }}
                        >
                          {expandedNotes === booking._id ? 'Close Notes' : 'Notes'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedNotes === booking._id && (
                    <tr>
                      <td colSpan="6" style={{ background: '#f8fafc' }}>
                        <div style={{ padding: '0.8rem 0' }}>
                          <label>Internal Notes</label>
                          <textarea
                            rows="3"
                            value={notes[booking._id] || ''}
                            onChange={(e) => setNotes((prev) => ({ ...prev, [booking._id]: e.target.value }))}
                            style={{ marginBottom: '0.7rem' }}
                          />
                          <button type="button" className="btn btn-primary" onClick={() => handleNotesSave(booking._id)}>
                            Save Note
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-status-summary">
        {statuses.map((status) => {
          const count = bookings.filter((booking) => booking.status === status).length;
          return (
            <div key={status} className="admin-status-summary-card" style={{ borderTopColor: statusColors[status] }}>
              <p>{status}</p>
              <strong>{count}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}
