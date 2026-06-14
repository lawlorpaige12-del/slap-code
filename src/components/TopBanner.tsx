import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Study Planner', path: '/planner' },
  { label: 'Pomodoro', path: '/pomodoro' },
  { label: 'Study Tools', path: '/tools' },
  { label: 'Contact Us', path: '/contact' },
];

function TopBanner() {
  const { user, loading, dashboard } = useAuth();

  return (
    <header className="top-banner" role="banner">
      <div className="brand">
        <div className="brand-mark">slAP</div>
        <div>
          <span className="brand-title">Study & Productivity Ecosystem</span>
          <p className="brand-subtitle">Intelligent planning, accountability, and growth.</p>
        </div>
      </div>

      <div className="nav-row">
        <nav className="site-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="account-bar">
          {loading ? (
            <span className="account-text">Loading…</span>
          ) : (
            <div className="account-controls">
              <span className="account-text">{user?.name ?? 'Scholar'}</span>
              <div style={{ marginLeft: '0.75rem', fontWeight: 800 }}>
                XP: {dashboard ? dashboard.xp : 0}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopBanner;
