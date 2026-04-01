import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout, ProtectedRoute } from './components';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Exams from './pages/Exams';
import ExamList from './pages/ExamList';
import Rooms from './pages/Rooms';
import Students from './pages/Students';
import Seating from './pages/Seating';
import ExamSchedule from './pages/ExamSchedule';
import UploadSchedule from './pages/UploadSchedule';
import PublishExams from './pages/PublishExams';
import History from './pages/History';
import Settings from './pages/Settings';
import { useTheme } from './utils/useTheme';

const App = () => {
  useTheme(); // applies saved/system theme to <html data-theme>
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          {/* Redirect old route to the new PDF-based schedule flow */}
          <Route path="/exams" element={<Navigate to="/upload-schedule" replace />} />
          {/* Legacy manual-exam module (kept for backwards compatibility) */}
          <Route path="/legacy-exams" element={<Exams />} />
          <Route path="/exam-list" element={<ExamList />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/students" element={<Students />} />
          <Route path="/seating" element={<Seating />} />
          {/* New PDF-based schedule module */}
          <Route path="/exam-schedule" element={<ExamSchedule />} />
          <Route path="/upload-schedule" element={<UploadSchedule />} />
          <Route path="/publish-exams" element={<PublishExams />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
