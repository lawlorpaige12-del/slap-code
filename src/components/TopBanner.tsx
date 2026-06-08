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
  const { user, loading, signOut } = useAuth();

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
            <span className="account-text">Loading profile…</span>
          ) : user ? (
            <div className="account-controls">
              <span className="account-text">{user.name}</span>
              <button className="nav-button" type="button" onClick={() => void signOut()}>
                Sign out
              </button>
            </div>
          ) : (
            <NavLink className="nav-link nav-link-button" to="/login">
              Sign in
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopBanner;
