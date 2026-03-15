import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileQuestion,
  DoorOpen,
  Users,
  Grid3X3,
  LogOut,
  ListOrdered,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/exams', label: 'Exams', icon: FileQuestion },
  { to: '/exam-list', label: 'Exam list', icon: ListOrdered },
  { to: '/rooms', label: 'Rooms', icon: DoorOpen },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/seating', label: 'Seating', icon: Grid3X3 },
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
        <div className="admin-sidebar-brand">Exam Portal Admin</div>
        <nav className="admin-sidebar-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
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
