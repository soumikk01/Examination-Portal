import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  DoorOpen,
  Users,
  Grid3X3,
  LogOut,
  CalendarDays,
  Upload,
  Megaphone,
  Settings,
  History,
} from 'lucide-react';
import logo from '../assets/logo.png';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/rooms', label: 'Rooms', icon: DoorOpen },
  { to: '/seating', label: 'Room Allocation', icon: Grid3X3 },
  { to: '/exam-schedule', label: 'Exam Schedule', icon: CalendarDays },
  { to: '/upload-schedule', label: 'Upload Schedule', icon: Upload },
  { to: '/publish-exams', label: 'Publish Exams', icon: Megaphone },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const AdminLayout = () => {
  const navigate = useNavigate();

  const staffJson = localStorage.getItem('examination_portal_admin_staff');
  const staff = staffJson ? JSON.parse(staffJson) : null;

  const handleLogout = () => {
    localStorage.removeItem('examination_portal_admin_token');
    localStorage.removeItem('examination_portal_admin_staff');
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '1rem 1.5rem' }}>
          <img src={logo} alt="JIS Logo" style={{ maxHeight: '35px', width: 'auto' }} />
          <span style={{ fontSize: '1rem', lineHeight: 1.2, whiteSpace: 'pre-wrap' }}>JIS College of Engineering</span>
        </div>
        <nav className="admin-sidebar-nav" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flex: 1 }}>
            {navItems.slice(0, -1).map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `admin-sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={20} />
                {label}
              </NavLink>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
            {navItems.slice(-1).map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `admin-sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={20} />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </aside>
      <main className="admin-main">
        <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Examination Portal</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {staff?.name && (
              <span style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>
                {staff.name}
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="admin-btn"
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.875rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
              title="Sign out"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
