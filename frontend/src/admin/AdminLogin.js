import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../services/api';

export default function AdminLogin({ setIsAdminAuth }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await loginAdmin(username, password);
      if (response.data.success) {
        localStorage.setItem('adminToken', response.data.token);
        setIsAdminAuth(true);
        navigate('/admin');
      }
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-shell">
        <div className="admin-login-brand">
          <p className="admin-login-kicker">Secure Access</p>
          <h1>S.S Enterprises Admin Portal</h1>
          <p>
            Use authorized credentials to access listings management, enquiry CRM,
            and sales pipeline insights.
          </p>
          <ul className="admin-login-points">
            <li>Protected operations for property and booking updates</li>
            <li>Centralized visibility for lead status and team actions</li>
            <li>Session-based authentication with role guard</li>
          </ul>
        </div>

        <div className="card admin-login-card">
          <h2>Admin Login</h2>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Admin Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter admin username"
              />
            </div>

            <div className="form-group">
              <label>Admin Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter secure password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '1rem' }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login to Dashboard'}
            </button>
          </form>

          <p className="admin-login-demo">
            Use authorized credentials only.
          </p>
        </div>
      </div>
    </div>
  );
}
