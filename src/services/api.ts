// Stateless API service — no localStorage, no defaults, no persistence
// All data flows through context and component state

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

// Compute dashboard stats from tasks and planner input (no storage)
export async function computeDashboardStats(
  tasks: PlanTask[],
  plannerInput: PlannerInput | null,
  userName: string
): Promise<DashboardStats> {
  await delay(100);

  const tasksCompleted = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;

  // Calculate total study time in minutes from task durations
  const totalStudyMins = tasks.reduce((acc, t) => {
    const m = parseInt(t.duration.replace(/\D/g, ''), 10) || 0;
    return acc + (isNaN(m) ? 0 : m);
  }, 0);
  const totalStudyTime = `${Math.floor(totalStudyMins / 60)}h ${totalStudyMins % 60}m`;

  // Calculate XP from completed tasks
  const xp = tasks.filter((t) => t.completed).reduce((acc, t) => acc + (t.xp || 0), 0);

  // Build upcoming exams from planner input if available
  const upcoming: Array<{ title: string; due: string; priority: 'High' | 'Medium' | 'Low' }> = [];
  if (plannerInput?.nextExam) {
    try {
      const then = new Date(plannerInput.nextExam);
      if (!Number.isNaN(then.getTime())) {
        const diff = Math.ceil((then.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (diff >= 0) {
          upcoming.push({
            title: 'Next Exam',
            due: `${diff} days`,
            priority: plannerInput.priority,
          });
        }
      }
    } catch (e) {
      // ignore
    }
  }

  return {
    tasksCompleted,
    totalStudyTime,
    streak: 0, // No persistent streak tracking in stateless app
    xp,
    level: 1, // No persistent levels in stateless app
    totalTasks,
    upcoming,
    leaderboard: userName ? [{ name: userName, xp, studyTime: totalStudyTime, level: 1 }] : [],
    ecosystemHealth: 'vibrant',
  };
}

// Generate plan from user input (no storage)
export async function generatePlan(input: PlannerInput): Promise<PlanTask[]> {
  await delay(300);

  const courseList = input.courses
    .split(',')
    .map((course) => course.trim())
    .filter(Boolean);

  if (!courseList.length) return [];

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

  // Determine total available study slots from weekly availability
  const availability = (input.weeklyAvailability || {}) as WeeklyAvailability;
  const totalSlots = (Object.keys(availability) as Array<keyof WeeklyAvailability>).reduce(
    (acc, d) => acc + (Number(availability[d]) || 0),
    0
  );

  const generated: PlanTask[] = [];

  if (totalSlots > 0) {
    // Create tasks proportional to available slots
    let i = 0;
    while (generated.length < totalSlots) {
      const course = courseList[i % courseList.length];
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
    // Fallback: one task per course if no availability specified
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

  return generated;
}

// Generate calendar entries from tasks and availability (no storage)
export async function fetchCalendarEntries(
  tasks: PlanTask[],
  plannerInput: PlannerInput | null
) {
  await delay(120);

  if (!plannerInput || !tasks.length) return [];

  try {
    const availability = (plannerInput.weeklyAvailability || {}) as WeeklyAvailability;
    const dayOrder: Array<keyof WeeklyAvailability> = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Build slots array where each day appears a number of times equal to available hours
    const slots: string[] = [];
    dayOrder.forEach((d) => {
      const hours = Number(availability[d]) || 0;
      const count = Math.max(0, Math.round(hours));
      for (let i = 0; i < count; i++) slots.push(d);
    });

    if (!slots.length) return [];

    // Format time helper
    const formatHour = (hour24: number) => {
      const h = ((hour24 + 11) % 12) + 1;
      const suffix = hour24 >= 12 ? 'PM' : 'AM';
      return `${h}:00 ${suffix}`;
    };

    // Assign tasks to day/time slots
    return tasks.map((task, index) => {
      const day = slots[index % slots.length];
      const timeSlotIndex = Math.floor(index / slots.length) % 12;
      const hour = 18 + timeSlotIndex;
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
