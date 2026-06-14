import React, { useEffect, useState } from 'react';
import { generatePlan, fetchSavedPlan, fetchCalendarEntries, PlannerInput, PlanTask, savePlan } from '../services/api';
import { useAuth } from '../context/AuthContext';

function StudyPlanner() {
  const [studyWindow, setStudyWindow] = useState('6:00 - 9:00 PM');
  const [courses, setCourses] = useState('Calculus, Biology, History, Chemistry');
  const [nextExam, setNextExam] = useState('2026-06-15');
  const [priority, setPriority] = useState<PlannerInput['priority']>('High');
  const [weeklyAvailability, setWeeklyAvailability] = useState<Record<string, number | null>>({
    Mon: null,
    Tue: null,
    Wed: null,
    Thu: null,
    Fri: null,
    Sat: null,
    Sun: null,
  });
  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [calendar, setCalendar] = useState<Array<{ id: string; day: string; task: string; time: string }>>([]);
  const [status, setStatus] = useState('Your study plan is ready.');

  const loadSavedPlan = async () => {
    const savedTasks = await fetchSavedPlan();
    if (savedTasks?.length) {
      setTasks(savedTasks);
      setCalendar(await fetchCalendarEntries(savedTasks));
      try { await auth.refreshDashboard(); } catch (e) { /* ignore */ }
    }
  };

  

  useEffect(() => {
    loadSavedPlan();
  }, []);

  const handleGenerate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('Generating your adaptive study schedule…');
    const input: PlannerInput = {
      studyWindow,
      courses,
      nextExam,
      priority,
      weeklyAvailability: weeklyAvailability as any,
    };
    const generated = await generatePlan(input);
    setTasks(generated);
    await savePlan(generated);
    setCalendar(await fetchCalendarEntries(generated));
    setStatus('Your study plan has been updated.');
    // refresh global dashboard
    try { await auth.refreshDashboard(); } catch (e) { /* ignore */ }
  };

  const auth = useAuth();

  return (
    <section className="section-grid" aria-label="AI study planner">
      <div className="card">
        <h1 className="page-title">AI Study Planner</h1>
        <p>Complete the onboarding survey and let the AI generate a personalized schedule for your current coursework.</p>
      </div>

      <form className="card planner-form" onSubmit={handleGenerate}>
        <h2>Onboarding Survey</h2>
        <label>
          Courses and subjects
          <textarea value={courses} onChange={(event) => setCourses(event.target.value)} />
        </label>
        <label>
          Available study times (example: 2 = 2 hours)
          <input value={studyWindow} onChange={(event) => setStudyWindow(event.target.value)} />
        </label>
        <label>
          Next exam date
          <input type="date" value={nextExam} onChange={(event) => setNextExam(event.target.value)} />
        </label>
        <label>
          Priority
          <select value={priority} onChange={(event) => setPriority(event.target.value as PlannerInput['priority'])}>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </label>
        <label>
          Weekly availability (hours per day)
          <div className="weekly-grid">
            {Object.keys(weeklyAvailability).map((day) => (
              <label key={day}>
                {day}
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={weeklyAvailability[day] ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : Number(e.target.value);
                    setWeeklyAvailability((prev) => ({ ...prev, [day]: val }));
                  }}
                />
              </label>
            ))}
          </div>
        </label>
        <button className="submit-button" type="submit">Regenerate Schedule</button>
        <p className="planner-status">{status}</p>
      </form>

      <div className="card">
        <h2>Task View — Actionable Items</h2>
        <div className="task-grid">
          {tasks.length ? (
            tasks.map((task) => (
              <article key={task.id} className="card task-card">
                <header>{task.title}</header>
                <div className="task-details">
                  <span>{task.duration}</span>
                  <span>+{task.xp} XP</span>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <button
                    className="submit-button"
                    type="button"
                    onClick={async () => {
                        const updated = tasks.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t));
                        setTasks(updated);
                        await savePlan(updated);
                        setCalendar(await fetchCalendarEntries(updated));
                        try { await auth.refreshDashboard(); } catch (e) { /* ignore */ }
                      }}
                  >
                    {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="preview-panel">Generate a new study plan to see your first actionable tasks.</div>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Calendar View</h2>
        {calendar.length ? (
          <div className="calendar-list">
            {calendar.map((entry) => (
              <div key={entry.id} className="countdown-item">
                <div className="task-details">
                  <span>{entry.day}</span>
                  <span>{entry.time}</span>
                </div>
                <strong>{entry.task}</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="calendar-placeholder">Scheduled study sessions display on a weekly calendar here.</div>
        )}
      </div>
    </section>
  );
}

export default StudyPlanner;
