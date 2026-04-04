import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import api from '../services/api';

/**
 * ProtectedRoute — dual-layer admin auth guard.
 *
 * Layer 1 (instant): checks sessionStorage for the staff profile.
 *   - Provides immediate redirect without a network round-trip.
 *   - Can be stale if sessionStorage is cleared (tab crash, incognito, etc.)
 *
 * Layer 2 (background): hits /dashboard/summary to validate the admin_token cookie.
 *   - If the cookie is still valid, we stay logged in even after sessionStorage clears.
 *   - If the cookie is expired/missing, we clear sessionStorage and redirect.
 */
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [authState, setAuthState] = useState(() => {
    // 'loading' | 'authenticated' | 'unauthenticated'
    const staff = sessionStorage.getItem('examination_portal_admin_staff');
    return staff ? 'authenticated' : 'loading';
  });

  useEffect(() => {
    // If sessionStorage already confirmed auth, do a silent background cookie validation
    // to handle cases where sessionStorage was cleared but the cookie is still valid.
    let isMounted = true;

    const validate = async () => {
      try {
        await api.get('/dashboard/summary');
        if (isMounted) {
          setAuthState('authenticated');
        }
      } catch (err) {
        if (!isMounted) return;
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          // Cookie invalid/expired — clean up and redirect
          sessionStorage.removeItem('examination_portal_admin_staff');
          setAuthState('unauthenticated');
        } else {
          // Network error, server down etc. — don't log out, assume authenticated
          // so admin isn't kicked out due to temporary network blip
          setAuthState('authenticated');
        }
      }
    };

    validate();
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (authState === 'loading') {
    // Tiny loading state prevents flashing the login page before validation
    return (
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        height: '100vh', background: 'var(--admin-bg, #f8fafc)' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '32px', height: '32px', border: '3px solid #e2e8f0',
            borderTopColor: 'var(--admin-primary, #4f46e5)', borderRadius: '50%',
            animation: 'spin 0.7s linear infinite', margin: '0 auto 12px'
          }} />
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Verifying session...</p>
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
