const STORAGE_USER_KEY = 'slap-studious-user';
const STORAGE_PLAN_KEY = 'slap-studious-plan';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const defaultUser = {
  id: 'user-001',
  name: 'Jordan',
  email: 'jordan@slapstudy.com',
  xp: 4120,
  streak: 7,
  level: 12,
};

export type DashboardStats = {
  tasksCompleted: number;
  totalStudyTime: string;
  streak: number;
  xp: number;
  level: number;
  upcoming: Array<{ title: string; due: string; priority: 'High' | 'Medium' | 'Low' }>;
  leaderboard: Array<{ name: string; xp: number; studyTime: string; level: number }>;
  ecosystemHealth: 'vibrant' | 'recovering' | 'neglected';
};

export type PlannerInput = {
  studyWindow: string;
  courses: string;
  nextExam: string;
  priority: 'High' | 'Medium' | 'Low';
  weeklyAvailability: string;
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
  const user = { ...defaultUser, email };
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
  return {
    tasksCompleted: 18,
    totalStudyTime: '9h 40m',
    streak: 7,
    xp: 4120,
    level: 12,
    upcoming: [
      { title: 'AP Calculus Exam', due: '5 days', priority: 'High' },
      { title: 'History DBQ Draft', due: '2 days', priority: 'Medium' },
      { title: 'Biology Review', due: '9 days', priority: 'Low' },
    ],
    leaderboard: [
      { name: 'Avery', xp: 5180, studyTime: '14h', level: 14 },
      { name: 'Jordan', xp: 4120, studyTime: '9h 40m', level: 12 },
      { name: 'Miles', xp: 3850, studyTime: '8h 30m', level: 11 },
    ],
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
}

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

  const generated = courseList.flatMap((course, index) => {
    const activity = baseTasks[index % baseTasks.length];
    const priority = priorities[input.priority];
    const durationBase = 30 + index * 10;
    return {
      id: `${course}-${activity}`,
      title: `${course} ${activity}`,
      duration: `${Math.round(durationBase * priority.multiplier)} min`,
      xp: Math.round(priority.xp * priority.multiplier),
      completed: false,
    };
  });

  savePlan(generated);
  return generated;
}

export async function fetchCalendarEntries(tasks: PlanTask[]) {
  await delay(120);
  return tasks.map((task, index) => ({
    id: task.id,
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][index % 5],
    task: task.title,
    time: `${8 + (index % 4) * 1}:00 PM`,
  }));
}
