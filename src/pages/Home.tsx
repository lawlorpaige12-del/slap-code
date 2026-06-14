import { Link } from 'react-router-dom';
import EcosystemPreview from '../components/EcosystemPreview';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { user, dashboard, loading } = useAuth();

  return (
    <section className="section-grid" aria-label="Home dashboard">
      <div className="card">
        <h1 className="page-title">Home Dashboard</h1>
        <p>
          {loading
            ? 'Loading your dashboard…'
            : `Welcome back, ${user?.name ?? 'Scholar'}. Track today’s progress and keep your ecosystem growing.`}
        </p>
      </div>

      <div className="stats-grid">
        <div className="card metric-pill">
          <strong>Tasks Completed</strong>
          {dashboard ? `${dashboard.tasksCompleted} / 24` : '—'}
        </div>
        <div className="card metric-pill">
          <strong>Total Study Time</strong>
          {dashboard ? dashboard.totalStudyTime : '—'}
        </div>
        <div className="card metric-pill">
          <strong>Study Streak</strong>
          {dashboard ? `${dashboard.streak} days` : '—'}
        </div>
        <div className="card metric-pill">
          <strong>XP Balance</strong>
          {dashboard ? `${dashboard.xp} XP` : '—'}
        </div>
      </div>

      <div className="card">
        <h2>Productivity Overview</h2>
        <div className="preview-panel">
          {dashboard ? (
            <div className="weekly-graph" aria-hidden>
              {Array.from({ length: 7 }).map((_, i) => {
                const height = Math.max(6, Math.min(80, Math.round((dashboard.tasksCompleted / 24) * 80) + (i % 3) * 6));
                return <div key={i} className="bar" style={{ height: `${height}px` }} />;
              })}
            </div>
          ) : (
            <div className="preview-panel">Weekly and monthly graphs appear here.</div>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Social</h2>
        <div className="preview-panel">Social leaderboards and friend features are disabled.</div>
      </div>

      <div className="card">
        <h2>Countdown to Deadlines</h2>
        <ul className="countdown-list">
          {dashboard && dashboard.upcoming && dashboard.upcoming.length ? (
            dashboard.upcoming.map((item) => (
              <li className="countdown-item" key={item.title}>
                <div className="task-details">
                  <span>{item.title}</span>
                  <span className={`countdown-pill ${item.priority.toLowerCase()}`} style={{ marginLeft: '0.75rem' }}>{item.priority}</span>
                </div>
                <strong>{item.due}</strong>
              </li>
            ))
          ) : (
            <>
              <li className="countdown-item">
                <div className="task-details">
                  <span>AP Calculus Exam</span>
                  <span className="countdown-pill high" style={{ marginLeft: '0.75rem' }}>High</span>
                </div>
                <strong>5 days remaining</strong>
              </li>
              <li className="countdown-item">
                <div className="task-details">
                  <span>History DBQ Draft</span>
                  <span className="countdown-pill medium">Medium</span>
                </div>
                <strong>2 days remaining</strong>
              </li>
            </>
          )}
        </ul>
      </div>

      <div className="card ecosystem-preview">
        <div className="ecosystem-header">
          <h2>Ecosystem Preview</h2>
          <Link className="nav-link nav-link-button" to="/planner">
            Refresh plan
          </Link>
        </div>
        <EcosystemPreview health={dashboard?.ecosystemHealth ?? 'vibrant'} />
      </div>
    </section>
  );
}

export default Home;
