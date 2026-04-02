import { Navigate, useLocation } from 'react-router-dom';

const ADMIN_TOKEN_KEY = 'examination_portal_admin_token';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
