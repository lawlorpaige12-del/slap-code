const STORAGE_USER_KEY = 'slap-studious-user';
const STORAGE_PLAN_KEY = 'slap-studious-plan';
const STORAGE_PLAN_INPUT_KEY = 'slap-studious-plan-input';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const defaultUser = {
  id: 'user-001',
  name: 'Scholar',
  email: 'hello@slapstudy.com',
  xp: 0,
  streak: 0,
  level: 1,
};

export type DashboardStats = {
  tasksCompleted: number;
  totalStudyTime: string;
  streak: number;
  xp: number;
  level: number;
  totalTasks: number;
  upcoming: Array<{ title: string; due: string; priority: 'High' | 'Medium' | 'Low' }>;
  leaderboard: Array<{ name: string; xp: number; studyTime: string; level: number }>;
  ecosystemHealth: 'vibrant' | 'recovering' | 'neglected';
};

export type WeeklyAvailability = {
  Mon: number | null;
  Tue: number | null;
  Wed: number | null;
  Thu: number | null;
  Fri: number | null;
  Sat: number | null;
  Sun: number | null;
};

export type PlannerInput = {
  studyWindow: string;
  courses: string;
  nextExam: string;
  priority: 'High' | 'Medium' | 'Low';
  weeklyAvailability: WeeklyAvailability;
};

export type PlanTask = {
  id: string;
  title: string;
  duration: string;
  xp: number;
  completed: boolean;
};

export async function signInWithEmail(email: string, password: string) {
  await delay(500);
  const handle = email.split('@')[0] || 'Scholar';
  const name = handle.charAt(0).toUpperCase() + handle.slice(1);
  const user = { ...defaultUser, email, name };
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
  return user;
}

export async function signOutUser() {
  await delay(200);
  localStorage.removeItem(STORAGE_USER_KEY);
}

export async function getCurrentUser() {
  await delay(150);
  const raw = localStorage.getItem(STORAGE_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  await delay(200);
  // build stats from stored plan and friends so data is personalized and consistent
  const rawUser = localStorage.getItem(STORAGE_USER_KEY);
  const user = rawUser ? JSON.parse(rawUser) : defaultUser;
  const rawPlan = localStorage.getItem(STORAGE_PLAN_KEY);
  const tasks = rawPlan ? JSON.parse(rawPlan) : [];
  const tasksCompleted = tasks.filter((t: any) => t.completed).length;
  const totalTasks = tasks.length;
  const totalStudyMins = tasks.reduce((acc: number, t: any) => {
    const m = parseInt((t.duration || '').toString(), 10) || 0;
    return acc + (isNaN(m) ? 0 : m);
  }, 0);
  const totalStudyTime = `${Math.floor(totalStudyMins / 60)}h ${totalStudyMins % 60}m`;
  const streak = user.streak ?? 0;
  const xp = user.xp ?? 0;
  const level = user.level ?? 1;

  const leaderboard = [
    { name: user.name, xp, studyTime: totalStudyTime, level },
  ];

  // upcoming items: try to read from saved planner input or tasks with due info
  const rawInput = localStorage.getItem(STORAGE_PLAN_INPUT_KEY);
  let upcoming: Array<{ title: string; due: string; priority: 'High' | 'Medium' | 'Low' }> = [];
  if (rawInput) {
    try {
      const input = JSON.parse(rawInput);
      if (input.nextExam) {
        // If nextExam is a date, compute days until
        const then = new Date(input.nextExam);
        if (!Number.isNaN(then.getTime())) {
          const diff = Math.ceil((then.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          upcoming.push({ title: 'Next Exam', due: `${diff} days`, priority: input.priority });
        }
      }
    } catch (e) {
      // ignore
    }
  }

  return {
    tasksCompleted,
    totalStudyTime,
    streak,
    xp,
    level,
    totalTasks,
    upcoming,
    leaderboard,
    ecosystemHealth: 'vibrant',
  };
}

export async function fetchSavedPlan() {
  await delay(150);
  const raw = localStorage.getItem(STORAGE_PLAN_KEY);
  return raw ? (JSON.parse(raw) as PlanTask[]) : null;
}

export async function savePlan(tasks: PlanTask[]) {
  await delay(150);
  localStorage.setItem(STORAGE_PLAN_KEY, JSON.stringify(tasks));

  // update user XP to reflect completed tasks (sum of completed task xp)
  const rawUser = localStorage.getItem(STORAGE_USER_KEY);
  if (rawUser) {
    try {
      const user = JSON.parse(rawUser);
      const completedXp = tasks.filter((t: any) => t.completed).reduce((acc: number, t: any) => acc + (t.xp || 0), 0);
      user.xp = completedXp;
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    } catch (e) {
      // ignore
    }
  }
}

export async function savePlannerInput(input: PlannerInput) {
  await delay(50);
  localStorage.setItem(STORAGE_PLAN_INPUT_KEY, JSON.stringify(input));
}

export async function getPlannerInput(): Promise<PlannerInput | null> {
  await delay(20);
  const raw = localStorage.getItem(STORAGE_PLAN_INPUT_KEY);
  return raw ? JSON.parse(raw) : null;
}

// Friends / social features removed — intentionally omitted per product decision.

export async function generatePlan(input: PlannerInput) {
  await delay(300);
  const courseList = input.courses
    .split(',')
    .map((course) => course.trim())
    .filter(Boolean);
  const priorities = {
    High: { multiplier: 1.3, xp: 120 },
    Medium: { multiplier: 1, xp: 90 },
    Low: { multiplier: 0.85, xp: 70 },
  };
  const baseTasks = [
    'Practice Test',
    'Review Notes',
    'Concept Drill',
    'Flashcard Sprint',
    'Problem Set',
  ];

  // Determine total available study slots from weekly availability (if provided)
  const availability = (input.weeklyAvailability || {}) as WeeklyAvailability;
  const totalSlots = (Object.keys(availability) as Array<keyof WeeklyAvailability>)
    .reduce((acc, d) => acc + (Number(availability[d]) || 0), 0);

  const generated: any[] = [];
  if (totalSlots > 0) {
    // create up to totalSlots tasks, cycling through courses and activities
    let i = 0;
    while (generated.length < totalSlots) {
      const course = courseList[i % courseList.length] || `Course${(i % courseList.length) + 1}`;
      const activity = baseTasks[i % baseTasks.length];
      const priorityObj = priorities[input.priority];
      const durationBase = 30 + (i % 5) * 10;
      generated.push({
        id: `${course}-${activity}-${i}`,
        title: `${course} ${activity}`,
        duration: `${Math.round(durationBase * priorityObj.multiplier)} min`,
        xp: Math.round(priorityObj.xp * priorityObj.multiplier),
        completed: false,
      });
      i += 1;
    }
  } else {
    // fallback: one task per course
    courseList.forEach((course, index) => {
      const activity = baseTasks[index % baseTasks.length];
      const priority = priorities[input.priority];
      const durationBase = 30 + index * 10;
      generated.push({
        id: `${course}-${activity}`,
        title: `${course} ${activity}`,
        duration: `${Math.round(durationBase * priority.multiplier)} min`,
        xp: Math.round(priority.xp * priority.multiplier),
        completed: false,
      });
    });
  }

  // persist tasks and planner input for other parts of the app
  await savePlan(generated);
  await savePlannerInput(input);
  return generated;
}

export async function fetchCalendarEntries(tasks: PlanTask[]) {
  await delay(120);
  const rawInput = localStorage.getItem(STORAGE_PLAN_INPUT_KEY);
  if (!rawInput) return [];
  try {
    const input = JSON.parse(rawInput) as PlannerInput;
    const availability = (input.weeklyAvailability || {}) as WeeklyAvailability;
    const dayOrder: Array<keyof WeeklyAvailability> = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Build slots array where each day appears a number of times equal to available hours (rounded)
    const slots: string[] = [];
    dayOrder.forEach((d) => {
      const hours = Number(availability[d]) || 0;
      const count = Math.max(0, Math.round(hours));
      for (let i = 0; i < count; i++) slots.push(d);
    });

    if (!slots.length) return [];

    // Assign tasks to slots in order, wrap if tasks > slots
    const formatHour = (hour24: number) => {
      const h = ((hour24 + 11) % 12) + 1;
      const suffix = hour24 >= 12 ? 'PM' : 'AM';
      return `${h}:00 ${suffix}`;
    };

    return tasks.map((task, index) => {
      const day = slots[index % slots.length];
      const timeSlotIndex = Math.floor(index / slots.length) % 12; // choose a slot offset
      const hour = 18 + timeSlotIndex; // start at 6pm and move forward
      return {
        id: task.id,
        day,
        task: task.title,
        time: formatHour(hour),
      };
    });
  } catch (e) {
    return [];
  }
}
