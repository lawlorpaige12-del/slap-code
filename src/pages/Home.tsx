import { Link } from 'react-router-dom';
import EcosystemPreview from '../components/EcosystemPreview';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { sessionState, dashboard, loading } = useAuth();
  const { userName, tasks } = sessionState;

  return (
    <section className="section-grid" aria-label="Home dashboard">
      <div className="card">
        <h1 className="page-title">Home Dashboard</h1>
        <p>
          {loading
            ? 'Loading your dashboard…'
            : userName
            ? `Welcome back, ${userName}. Track today's progress and keep your ecosystem growing.`
            : 'Welcome to slAP. Start by completing your study plan.'}
        </p>
      </div>

      {tasks.length ? (
        <>
        <div className="stats-grid">
        <div className="card metric-pill">
          <strong>Tasks Completed</strong>
          {dashboard ? `${dashboard.tasksCompleted} / ${dashboard.totalTasks || 0}` : '—'}
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
                const maxHeight = Math.max(6, Math.round((dashboard.tasksCompleted / Math.max(1, dashboard.totalTasks)) * 80));
                const height = Math.max(6, Math.min(80, maxHeight + (i % 3) * 6));
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
                <div className="preview-panel">No exams scheduled. Add an exam date in the Study Planner to see countdowns.</div>
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
        </>
      ) : (
        <div className="card">
          <p>Start by going to the <Link to="/planner">Study Planner</Link> and creating your first study schedule.</p>
        </div>
      )}
    </section>
  );
}

export default Home;
