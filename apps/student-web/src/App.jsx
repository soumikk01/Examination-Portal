import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import RoomPage from './pages/RoomPage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/student/:collegeId/*" element={<ProfilePage />} />
        <Route path="/room" element={<RoomPage />} />
      </Routes>
    </Router>
  );
};

export default App;
