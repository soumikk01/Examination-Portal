import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import RoomPage from './pages/RoomPage';

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
        <Route path="/student/*" element={<StudentRoutes />} />
        {/* Keep the old /room route as fallback just in case */}
        <Route path="/room" element={<RoomPage />} />
      </Routes>
    </Router>
  );
};

export default App;
