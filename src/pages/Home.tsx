import { Link } from 'react-router-dom';
import EcosystemPreview from '../components/EcosystemPreview';
import { useAuth } from '../context/AuthContext';
import { addFriend, removeFriend } from '../services/api';
import { useState } from 'react';

function FriendAdder({ onAdd }: { onAdd?: () => void }) {
  const [name, setName] = useState('');
  const [xp, setXp] = useState(1000);
  const [studyTime, setStudyTime] = useState('5h');
  const [level, setLevel] = useState(5);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name) return;
        await addFriend({ name, xp, studyTime, level });
        setName('');
        if (onAdd) onAdd();
      }}
      style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
    >
      <input placeholder="Friend name" value={name} onChange={(e) => setName(e.target.value)} />
      <input type="number" value={xp} onChange={(e) => setXp(Number(e.target.value) || 0)} style={{ width: '6rem' }} />
      <input placeholder="Study time" value={studyTime} onChange={(e) => setStudyTime(e.target.value)} style={{ width: '6rem' }} />
      <input type="number" value={level} onChange={(e) => setLevel(Number(e.target.value) || 1)} style={{ width: '5rem' }} />
      <button className="submit-button" type="submit">Add Friend</button>
    </form>
  );
}

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
        <h2>Social Leaderboards</h2>
        {dashboard ? (
          <div>
            <ul className="countdown-list">
              {dashboard.leaderboard.map((friend) => (
                <li className="countdown-item" key={friend.name}>
                  <div className="task-details">
                    <span>{friend.name}</span>
                    <span>{friend.level} lvl</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{friend.studyTime} • {friend.xp} XP</strong>
                    <div>
                      <button
                        className="submit-button"
                        type="button"
                        onClick={async () => {
                          if (friend.name !== (dashboard ? dashboard.leaderboard.find((f) => f.name === friend.name)?.name : '')) {
                            await removeFriend(friend.name);
                            window.location.reload();
                          }
                        }}
                      >Remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <FriendAdder onAdd={async () => { window.location.reload(); }} />
          </div>
        ) : (
          <div className="preview-panel">Friend leaderboard loads after sign in.</div>
        )}
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
