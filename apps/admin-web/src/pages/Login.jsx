import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { getUserFriendlyApiError } from '../utils/apiError';
import logo from '../assets/logo.png';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [emptyAttempt, setEmptyAttempt] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/';

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 650);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setEmptyAttempt(true);
      setError('Please provide both email and password.');
      triggerShake();
      return;
    }

    setEmptyAttempt(false);
    setLoading(true);
    try {
      const data = await api.post('/auth/admin/login', { email, password });
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

      <style>{`
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
      
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
      <div className="admin-login-card" style={{ 
        position: 'relative', 
        zIndex: 1,
        animation: shake ? 'shake 0.6s cubic-bezier(.36,.07,.19,.97) both' : 'none',
        transition: 'all 0.3s ease'
      }}>
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
        <form onSubmit={handleSubmit} noValidate style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                border: (emptyAttempt && !email.trim()) ? '2px solid #ef4444' : '1px solid var(--admin-border)',
                backgroundColor: (emptyAttempt && !email.trim()) ? '#fef2f2' : 'transparent',
                borderRadius: 8,
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                outline: 'none',
              }}
            />
          </div>
          <div>
            <label htmlFor="admin-password" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--admin-text)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.6rem 2.5rem 0.6rem 0.75rem',
                  border: (emptyAttempt && !password) ? '2px solid #ef4444' : '1px solid var(--admin-border)',
                  backgroundColor: (emptyAttempt && !password) ? '#fef2f2' : 'transparent',
                  borderRadius: 8,
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.4rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.4rem',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {error && (
            <p className="admin-status-err" style={{ margin: 0, color: '#ef4444', textAlign: 'center', fontSize: '0.85rem', transition: 'all 0.3s ease' }}>
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
