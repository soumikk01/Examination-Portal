import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import RoomPage from './pages/RoomPage';

// Auth guard: with cookie-based auth, the token is in an httpOnly cookie (not accessible to JS).
// We use the presence of the student profile in sessionStorage as the login indicator.
const ProtectedRoute = ({ children }) => {
  const student = sessionStorage.getItem('examination_portal_student');
  const location = useLocation();
  if (!student) {
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
