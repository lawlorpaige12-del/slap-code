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
        <div className="preview-panel">Weekly and monthly graphs appear here.</div>
      </div>

      <div className="card">
        <h2>Social Leaderboards</h2>
        {dashboard ? (
          <ul className="countdown-list">
            {dashboard.leaderboard.map((friend) => (
              <li className="countdown-item" key={friend.name}>
                <div className="task-details">
                  <span>{friend.name}</span>
                  <span>{friend.level} lvl</span>
                </div>
                <strong>{friend.studyTime} • {friend.xp} XP</strong>
              </li>
            ))}
          </ul>
        ) : (
          <div className="preview-panel">Friend leaderboard loads after sign in.</div>
        )}
      </div>

      <div className="card">
        <h2>Countdown to Deadlines</h2>
        <ul className="countdown-list">
          <li className="countdown-item">
            <div className="task-details">
              <span>AP Calculus Exam</span>
              <span className="countdown-pill high">High</span>
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
          <li className="countdown-item">
            <div className="task-details">
              <span>Biology Review</span>
              <span className="countdown-pill low">Low</span>
            </div>
            <strong>9 days remaining</strong>
          </li>
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
