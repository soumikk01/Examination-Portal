import { Navigate, useLocation } from 'react-router-dom';

// With cookie-based auth, the token is in an httpOnly cookie (not accessible to JS).
// We use the presence of the staff profile in sessionStorage as the login indicator.
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const staff = sessionStorage.getItem('examination_portal_admin_staff');

  if (!staff) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
