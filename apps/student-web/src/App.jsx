import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import RoomPage from './pages/RoomPage';
import { useTheme } from './utils/useTheme';

// Auth guard: redirect to login if no token in localStorage
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('examination_portal_token');
  const location = useLocation();
  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return children;
};

const StudentRoutes = () => {
  const location = useLocation();
  if (location.pathname.endsWith('/room')) {
    return <RoomPage />;
  }
  return <ProfilePage />;
};

const App = () => {
  // Apply saved theme on every render (also handles system changes)
  useTheme();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        {/* React Router v6 doesn't allow suffixes after splats, so we handle it manually */}
        <Route
          path="/student/*"
          element={
            <ProtectedRoute>
              <StudentRoutes />
            </ProtectedRoute>
          }
        />
        {/* Keep the old /room route as fallback just in case */}
        <Route
          path="/room"
          element={
            <ProtectedRoute>
              <RoomPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;

