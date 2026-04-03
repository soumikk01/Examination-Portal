import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { getUserFriendlyApiError } from '../utils/apiError';
import logo from '../assets/logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/admin/login', { email, password });
      sessionStorage.setItem('examination_portal_admin_token', data.token);
      sessionStorage.setItem('examination_portal_admin_staff', JSON.stringify(data.staff));
      navigate(from, { replace: true });
    } catch (err) {
      setError(getUserFriendlyApiError(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page" style={{ flexDirection: 'column', gap: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative Full-Page Dot Grid */}
      <div 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1.2px, transparent 1.2px)', 
          backgroundSize: '30px 30px', 
          zIndex: 0,
          pointerEvents: 'none'
        }} 
      />
      
      <div style={{ 
        fontWeight: 900, 
        textTransform: 'uppercase', 
        letterSpacing: '0.12em', 
        fontSize: '1.4rem',
        textAlign: 'center',
        color: '#ffffff',
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
        lineHeight: 1.2,
        zIndex: 1
      }}>
        JIS Exam<br />Management System (EMS)
      </div>
      <div className="admin-login-card" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <img
            src={logo}
            alt="JIS College of Engineering, Kalyani"
            style={{
              width: '80px',
              height: '80px',
              objectFit: 'contain',
            }}
          />
        </div>
        <h1 style={{ marginTop: '0.5rem' }}>Admin Login</h1>
        <p>Sign in with your college email and password.</p>
        <form onSubmit={handleSubmit} style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label htmlFor="admin-email" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--admin-text)' }}>
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@example.com"
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: '1px solid var(--admin-border)',
                borderRadius: 8,
                fontSize: '1rem',
              }}
            />
          </div>
          <div>
            <label htmlFor="admin-password" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--admin-text)' }}>
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: '1px solid var(--admin-border)',
                borderRadius: 8,
                fontSize: '1rem',
              }}
            />
          </div>
          {error && (
            <p className="admin-status-err" style={{ margin: 0 }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={loading}
            style={{ marginTop: '0.25rem', width: '100%', justifyContent: 'center' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
