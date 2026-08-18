// Stateless API service — no localStorage, no defaults, no persistence
// All data flows through context and component state

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type Priority = 'High' | 'Medium' | 'Low';

export type PlannerCourse = {
  id: string;
  name: string;
  examDate: string;
  priority: Priority;
};

export type WeeklyAvailability = Record<string, number | null>;

export type PlannerInput = {
  studyWindow: string;
  courses: PlannerCourse[] | string;
  nextExam: string;
  priority: Priority;
  weeklyAvailability: WeeklyAvailability;
};

export type ToolKey = 'flashcards' | 'summary' | 'quiz' | 'studyguide';

export type PlanTask = {
  id: string;
  title: string;
  duration: string;
  xp: number;
  completed: boolean;
  course: string;
  tool: ToolKey;
  toolLabel: string;
};

export type DashboardStats = {
  tasksCompleted: number;
  totalStudyTime: string;
  streak: number;
  xp: number;
  level: number;
  totalTasks: number;
  upcoming: Array<{ title: string; due: string; priority: Priority }>;
  leaderboard: Array<{ name: string; xp: number; studyTime: string; level: number }>;
  ecosystemHealth: 'vibrant' | 'recovering' | 'neglected';
};

const PRIORITY_WEIGHTS: Record<Priority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

const TOOL_LABELS: Record<ToolKey, string> = {
  flashcards: 'Flashcards',
  summary: 'Review Notes',
  quiz: 'Practice Questions',
  studyguide: 'Study Guide Review',
};

const TOOL_LINK_LABELS: Record<ToolKey, string> = {
  flashcards: 'Open Flashcard Generator',
  summary: 'Open Note Summarizer',
  quiz: 'Open Quiz & Practice Question Generator',
  studyguide: 'Open Study Guides',
};

const toMinutes = (time: string) => {
  if (!time) return 0;
  const [rawHour, rawMinute] = time.split(':');
  const hour = Number(rawHour) || 0;
  const minute = Number(rawMinute) || 0;
  return hour * 60 + minute;
};

const roundToNearestFive = (minutes: number) => Math.max(5, Math.round(minutes / 5) * 5);

const formatMinutes = (minutes: number) => {
  const total = Math.max(0, minutes);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours && mins) return `${hours}h ${mins}m`;
  if (hours) return `${hours}h`;
  return `${mins || 0}m`;
};

const normalizeCourses = (courses: PlannerCourse[] | string | undefined): PlannerCourse[] => {
  if (Array.isArray(courses)) {
    return courses
      .map((course) => ({
        id: course.id || `${course.name}-${Math.random().toString(36).slice(2, 9)}`,
        name: course.name.trim(),
        examDate: course.examDate || '',
        priority: course.priority || 'Medium',
      }))
      .filter((course) => course.name);
  }

  if (typeof courses === 'string') {
    return courses
      .split(',')
      .map((course) => course.trim())
      .filter(Boolean)
      .map((name, index) => ({
        id: `legacy-course-${index}`,
        name,
        examDate: '',
        priority: 'Medium',
      }));
  }

  return [];
};

const getExamUrgencyMultiplier = (examDate: string) => {
  if (!examDate) return 1;

  const date = new Date(examDate);
  if (Number.isNaN(date.getTime())) return 1;

  const diffDays = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) return 1.8;
  if (diffDays <= 14) return 1.5;
  if (diffDays <= 30) return 1.25;
  return 1;
};

const calculateWeeklyAvailabilityMinutes = (weeklyAvailability: WeeklyAvailability | undefined): number => {
  if (!weeklyAvailability) return 0;

  const entries = Object.values(weeklyAvailability) as Array<number | null>;
  return entries.reduce<number>((total, value) => total + (Number(value ?? 0) || 0), 0);
};

export async function computeDashboardStats(
  tasks: PlanTask[],
  plannerInput: PlannerInput | null,
  userName: string
): Promise<DashboardStats> {
  await delay(100);

  const tasksCompleted = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const totalStudyMinutes = tasks.reduce((total, task) => total + (Number(task.duration.replace(/\D/g, '')) || 0), 0);
  const xp = tasks.filter((t) => t.completed).reduce((total, task) => total + (task.xp || 0), 0);

  const upcoming: Array<{ title: string; due: string; priority: Priority }> = [];
  const courses = plannerInput ? normalizeCourses(plannerInput.courses) : [];
  const sorted = [...courses].filter((course) => course.examDate).sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

  if (sorted[0]) {
    const date = new Date(sorted[0].examDate);
    const diffDays = Math.max(0, Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    upcoming.push({
      title: sorted[0].name,
      due: `${diffDays} days`,
      priority: sorted[0].priority,
    });
  }

  return {
    tasksCompleted,
    totalStudyTime: formatMinutes(totalStudyMinutes),
    streak: 0,
    xp,
    level: 1,
    totalTasks,
    upcoming,
    leaderboard: userName ? [{ name: userName, xp, studyTime: formatMinutes(totalStudyMinutes), level: 1 }] : [],
    ecosystemHealth: 'vibrant',
  };
}

export async function generatePlan(input: PlannerInput): Promise<PlanTask[]> {
  await delay(250);

  const courses = normalizeCourses(input.courses);
  if (!courses.length) return [];

  const weeklyMinutes = calculateWeeklyAvailabilityMinutes(input.weeklyAvailability);
  const totalAvailableMinutes = Math.max(30, weeklyMinutes || courses.length * 90);

  const orderedCourses = [...courses].sort((a, b) => {
    const weightA = PRIORITY_WEIGHTS[a.priority] * getExamUrgencyMultiplier(a.examDate);
    const weightB = PRIORITY_WEIGHTS[b.priority] * getExamUrgencyMultiplier(b.examDate);
    return weightB - weightA;
  });

  const totalWeight = orderedCourses.reduce((sum, course) => {
    return sum + PRIORITY_WEIGHTS[course.priority] * getExamUrgencyMultiplier(course.examDate);
  }, 0) || orderedCourses.length;

  const targetTaskCount = Math.max(
    1,
    Math.min(12, Math.round(totalAvailableMinutes / 45))
  );

  const generated: PlanTask[] = [];
  let assignedMinutes = 0;

  orderedCourses.forEach((course, courseIndex) => {
    const toolPool: ToolKey[] = course.priority === 'High'
      ? ['flashcards', 'quiz', 'studyguide', 'summary']
      : course.priority === 'Medium'
        ? ['summary', 'flashcards', 'quiz']
        : ['summary', 'flashcards'];

    const courseWeight = PRIORITY_WEIGHTS[course.priority] * getExamUrgencyMultiplier(course.examDate);
    const share = totalWeight ? courseWeight / totalWeight : 1 / orderedCourses.length;
    const taskCountForCourse = Math.max(
      1,
      Math.min(4, Math.round(share * targetTaskCount + (orderedCourses.length > 1 ? 0.3 : 0)))
    );

    for (let taskIndex = 0; taskIndex < taskCountForCourse; taskIndex += 1) {
      const tool = toolPool[(taskIndex + courseIndex) % toolPool.length];
      const remainingBudget = Math.max(15, totalAvailableMinutes - assignedMinutes);
      const durationBase = Math.min(60, Math.max(15, Math.round(remainingBudget / Math.max(1, taskCountForCourse - taskIndex + 1))));
      const duration = roundToNearestFive(durationBase * (tool === 'studyguide' ? 0.9 : tool === 'quiz' ? 1.1 : 1));
      const xp = Math.round(duration * (tool === 'quiz' ? 2.4 : tool === 'studyguide' ? 2.1 : tool === 'summary' ? 1.9 : 1.7) + PRIORITY_WEIGHTS[course.priority] * 12);

      const title = `${course.name} ${TOOL_LABELS[tool]}`;
      const task: PlanTask = {
        id: `${course.id}-${tool}-${taskIndex}`,
        title,
        duration: `${duration} min`,
        xp,
        completed: false,
        course: course.name,
        tool,
        toolLabel: TOOL_LINK_LABELS[tool],
      };

      if (assignedMinutes + duration <= totalAvailableMinutes || generated.length === 0) {
        generated.push(task);
        assignedMinutes += duration;
      }
    }
  });

  if (!generated.length) {
    const fallbackCourse = orderedCourses[0];
    const fallbackTask: PlanTask = {
      id: `${fallbackCourse.id}-flashcards-0`,
      title: `${fallbackCourse.name} Flashcards`,
      duration: '25 min',
      xp: 40,
      completed: false,
      course: fallbackCourse.name,
      tool: 'flashcards',
      toolLabel: TOOL_LINK_LABELS.flashcards,
    };
    generated.push(fallbackTask);
  }

  return generated.slice(0, Math.min(12, generated.length));
}
