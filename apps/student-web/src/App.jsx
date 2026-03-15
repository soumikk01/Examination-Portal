import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import StudentExams from './pages/StudentExams';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/student/:collegeId/*" element={<ProfilePage />} />
        <Route path="/exams" element={<StudentExams />} />
      </Routes>
    </Router>
  );
};

export default App;
