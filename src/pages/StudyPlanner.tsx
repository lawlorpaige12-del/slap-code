import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { generatePlan, PlannerInput, PlanTask, PlannerCourse, Priority } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const HOURS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const MERIDIEMS = ['AM', 'PM'] as const;

const makeCourse = (overrides: Partial<PlannerCourse> = {}): PlannerCourse => ({
  id: overrides.id || `course-${Math.random().toString(36).slice(2, 9)}`,
  name: overrides.name || '',
  examDate: overrides.examDate || '',
  priority: overrides.priority || 'Medium',
});

const makeDayAvailability = () => ({
  available: false,
  startHour: '9',
  startMinute: '00',
  startMeridiem: 'AM' as const,
  endHour: '10',
  endMinute: '00',
  endMeridiem: 'AM' as const,
});

const toMinutes = (hour: string, minute: string, meridiem: string) => {
  const fullHour = Number(hour) || 1;
  const hour24 = meridiem === 'PM' && fullHour !== 12 ? fullHour + 12 : fullHour === 12 && meridiem === 'AM' ? 0 : fullHour;
  return hour24 * 60 + Number(minute || 0);
};

const formatTimeForStorage = (hour: string, minute: string, meridiem: string) => {
  const fullHour = Number(hour) || 1;
  const hour24 = meridiem === 'PM' && fullHour !== 12 ? fullHour + 12 : fullHour === 12 && meridiem === 'AM' ? 0 : fullHour;
  return `${String(hour24).padStart(2, '0')}:${minute}`;
};

const calculateDayMinutes = (entry: ReturnType<typeof makeDayAvailability>) => {
  if (!entry.available) return 0;
  const start = toMinutes(entry.startHour, entry.startMinute, entry.startMeridiem);
  const end = toMinutes(entry.endHour, entry.endMinute, entry.endMeridiem);
  if (end <= start) return 0;
  return end - start;
};

const buildAvailabilityMap = (availability: Record<string, ReturnType<typeof makeDayAvailability>>) => {
  const next: Record<string, number | null> = {};
  DAYS.forEach((day) => {
    const entry = availability[day] || makeDayAvailability();
    next[day] = calculateDayMinutes(entry) || null;
  });
  return next;
};

const getEarliestExamDate = (courses: PlannerCourse[]) => {
  const valid = courses.filter((course) => course.examDate).sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
  return valid[0]?.examDate || '';
};

function StudyPlanner() {
  const auth = useAuth();
  const { setTasks, setPlannerInput, refreshDashboard } = auth;
  const { tasks } = auth.sessionState;

  const [courseEntries, setCourseEntries] = useState<PlannerCourse[]>([
    makeCourse({ id: 'course-1', priority: 'High' }),
  ]);
  const [status, setStatus] = useState('Your study plan is ready.');
  const [dayAvailability, setDayAvailability] = useState<Record<string, ReturnType<typeof makeDayAvailability>>>(() => {
    const map: Record<string, ReturnType<typeof makeDayAvailability>> = {};
    DAYS.forEach((day) => { map[day] = makeDayAvailability(); });
    return map;
  });

  const totalAvailableHours = useMemo(() => {
    const minutes = Object.values(dayAvailability).reduce((total, value) => total + calculateDayMinutes(value), 0);
    return minutes / 60;
  }, [dayAvailability]);

  const handleTaskToggle = async (task: PlanTask) => {
    const updated = tasks.map((t) =>
      t.id === task.id ? { ...t, completed: !t.completed } : t
    );
    setTasks(updated);
    await refreshDashboard();
  };

  const updateDayAvailability = (day: typeof DAYS[number], field: keyof ReturnType<typeof makeDayAvailability>, value: string | boolean) => {
    setDayAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const addCourse = () => {
    setCourseEntries((current) => [...current, makeCourse({ priority: 'Medium' })]);
  };

  const removeCourse = (index: number) => {
    setCourseEntries((current) => {
      if (current.length === 1) return current;
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const updateCourse = <K extends keyof PlannerCourse>(index: number, field: K, value: PlannerCourse[K]) => {
    setCourseEntries((current) => current.map((course, itemIndex) =>
      itemIndex === index ? { ...course, [field]: value } : course
    ));
  };

  const handleGenerate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validCourses = courseEntries.filter((course) => course.name.trim());
    if (!validCourses.length) {
      setStatus('Add at least one course before generating your study plan.');
      return;
    }

    const invalidDay = DAYS.find((day) => {
      const entry = dayAvailability[day];
      if (!entry.available) return false;
      const start = toMinutes(entry.startHour, entry.startMinute, entry.startMeridiem);
      const end = toMinutes(entry.endHour, entry.endMinute, entry.endMeridiem);
      return end <= start;
    });

    if (invalidDay) {
      setStatus(`${invalidDay} has an invalid time range. Please choose an ending time after the starting time or mark the day as not available.`);
      return;
    }

    const weeklyAvailability = buildAvailabilityMap(dayAvailability);
    const totalMinutes = Object.values(weeklyAvailability).reduce<number>((sum, value) => sum + (Number(value ?? 0) || 0), 0);

    if (totalMinutes <= 0) {
      setStatus('Please mark at least one day as available so the planner can calculate your study time.');
      return;
    }

    const priorityOrder: Priority[] = ['High', 'Medium', 'Low'];
    const highestPriority = priorityOrder.find((level) => validCourses.some((course) => course.priority === level)) || 'Medium';

    const input: PlannerInput = {
      studyWindow: '',
      courses: validCourses,
      nextExam: getEarliestExamDate(validCourses),
      priority: highestPriority,
      weeklyAvailability,
    };

    setStatus('Generating your adaptive study schedule…');
    const generated = await generatePlan(input);
    setTasks(generated);
    setPlannerInput(input);
    setStatus('Your study plan has been updated.');
    await refreshDashboard();
  };

  return (
    <section className="section-grid" aria-label="AI study planner">
      <div className="card">
        <h1 className="page-title">AI Study Planner</h1>
        <p>Build a study plan around your real weekly availability and the courses that matter most.</p>
      </div>

      <form className="card planner-form" onSubmit={handleGenerate}>
        <h2>Your Availability</h2>
        <div className="availability-grid">
          {DAYS.map((day) => {
            const entry = dayAvailability[day];
            return (
              <div key={day} className="availability-day">
                <div className="availability-header">
                  <strong>{day}</strong>
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={entry.available}
                      onChange={(event) => updateDayAvailability(day, 'available', event.target.checked)}
                    />
                    <span>Available</span>
                  </label>
                </div>

                {entry.available ? (
                  <div className="availability-controls">
                    <div className="time-group">
                      <span>From</span>
                      <div className="time-select-row">
                        <select value={entry.startHour} onChange={(event) => updateDayAvailability(day, 'startHour', event.target.value)}>
                          {HOURS.map((hour) => <option key={`${day}-start-hour-${hour}`} value={hour}>{hour}</option>)}
                        </select>
                        <select value={entry.startMinute} onChange={(event) => updateDayAvailability(day, 'startMinute', event.target.value)}>
                          {MINUTES.map((minute) => <option key={`${day}-start-minute-${minute}`} value={minute}>{minute}</option>)}
                        </select>
                        <select value={entry.startMeridiem} onChange={(event) => updateDayAvailability(day, 'startMeridiem', event.target.value)}>
                          {MERIDIEMS.map((meridiem) => <option key={`${day}-start-meridiem-${meridiem}`} value={meridiem}>{meridiem}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="time-group">
                      <span>To</span>
                      <div className="time-select-row">
                        <select value={entry.endHour} onChange={(event) => updateDayAvailability(day, 'endHour', event.target.value)}>
                          {HOURS.map((hour) => <option key={`${day}-end-hour-${hour}`} value={hour}>{hour}</option>)}
                        </select>
                        <select value={entry.endMinute} onChange={(event) => updateDayAvailability(day, 'endMinute', event.target.value)}>
                          {MINUTES.map((minute) => <option key={`${day}-end-minute-${minute}`} value={minute}>{minute}</option>)}
                        </select>
                        <select value={entry.endMeridiem} onChange={(event) => updateDayAvailability(day, 'endMeridiem', event.target.value)}>
                          {MERIDIEMS.map((meridiem) => <option key={`${day}-end-meridiem-${meridiem}`} value={meridiem}>{meridiem}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="not-available">Not Available</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="availability-summary">
          <strong>Total weekly availability:</strong> {totalAvailableHours.toFixed(1)} hours
        </div>

        <h2>Your Courses</h2>
        <div className="course-list">
          {courseEntries.map((course, index) => (
            <div key={course.id} className="course-card">
              <div className="course-header">
                <label>
                  Course Name
                  <input
                    value={course.name}
                    onChange={(event) => updateCourse(index, 'name', event.target.value)}
                    placeholder="AP Biology"
                  />
                </label>
                {courseEntries.length > 1 && (
                  <button type="button" className="ghost-button" onClick={() => removeCourse(index)}>
                    Delete
                  </button>
                )}
              </div>

              <div className="course-row">
                <label>
                  Exam / Deadline Date
                  <input
                    type="date"
                    value={course.examDate}
                    onChange={(event) => updateCourse(index, 'examDate', event.target.value)}
                  />
                </label>
                <label>
                  Priority
                  <select
                    value={course.priority}
                    onChange={(event) => updateCourse(index, 'priority', event.target.value as Priority)}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </label>
              </div>
            </div>
          ))}
        </div>

        <button type="button" className="secondary-button" onClick={addCourse}>+ Add Another Course</button>
        <button className="submit-button" type="submit">Generate Study Plan</button>
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
                  <span>{task.course}</span>
                </div>
                <div className="task-details">
                  <span>+{task.xp} XP</span>
                  <span>{task.toolLabel}</span>
                </div>
                <div className="task-actions">
                  <Link className="secondary-button task-link" to={`/tools?tool=${task.tool}&course=${encodeURIComponent(task.course)}`}>
                    {task.toolLabel}
                  </Link>
                  <button className="submit-button" type="button" onClick={() => handleTaskToggle(task)}>
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
    </section>
  );
}

export default StudyPlanner;
