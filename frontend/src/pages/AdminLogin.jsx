import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.adminLogin(username, password);
      if (res.success && res.token) {
        localStorage.setItem('harsha_admin_token', res.token);
        localStorage.setItem('harsha_admin_user', JSON.stringify(res.admin));
        navigate('/admin');
      } else {
        setError(res.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <Link to="/" className="brand-logo" style={{ justifyContent: 'center' }}>
            <span>Harsha</span>
            <span className="brand-dot" aria-hidden="true" />
          </Link>
          <div style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Admin Dashboard Login
          </div>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.88rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username or Email
            </label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. harsha"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--text-secondary)' }}>
            ← Back to Public Website
          </Link>
        </div>
      </div>
    </div>
  );
}
