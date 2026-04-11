import { Outlet, NavLink } from 'react-router-dom';
import api from '../services/api';
import {
  LayoutDashboard,
  DoorOpen,
  Users,
  Armchair,
  LogOut,
  CalendarDays,
  Upload,
  Megaphone,
  ServerCog,
  History,
} from 'lucide-react';
import logo from '../assets/logo.png';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/rooms', label: 'Room Allotment', icon: DoorOpen },
  { to: '/seating', label: 'Seating Arrangement', icon: Armchair },
  { to: '/exam-schedule', label: 'Exam Schedule', icon: CalendarDays },
  { to: '/upload-schedule', label: 'Upload Schedule', icon: Upload },
  { to: '/publish-exams', label: 'Publish Exams', icon: Megaphone },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: ServerCog },
];

const AdminLayout = () => {
  const staffJson = sessionStorage.getItem('examination_portal_admin_staff');
  let staff = null;
  try {
    staff = staffJson ? JSON.parse(staffJson) : null;
  } catch {
    // Corrupted storage — ignore and treat as logged out (api interceptor will redirect)
    sessionStorage.removeItem('examination_portal_admin_staff');
  }

  const handleLogout = async () => {
    await api.logout();
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <img src={logo} alt="JIS Logo" style={{ maxHeight: '36px', width: 'auto', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
          <span style={{ 
            fontSize: '0.85rem', 
            lineHeight: 1.2, 
            fontWeight: 900,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#fff',
            display: 'inline-block'
          }}>
            JIS College<br />Of Engineering
          </span>
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
          <span>JIS Exam Management System (EMS)</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {staff?.name && (
              <span style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>
                {staff.name}
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="admin-btn admin-btn-logout"
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
