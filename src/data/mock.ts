import type {
  Question, Vault, Domain, Project, ProjectTask, LessonCategory,
  Lesson, Note, ReviewRecord, ModuleItem, SessionRecord, CronoDayAllocation
} from "../types";

export interface DailyActivity {
  day: string;
  shortDay: string;
  minutes: number;
  sessions: number;
  active: boolean;
}

export const domains: Domain[] = [];
export const projects: Project[] = [];
export const initialProjectTasks: ProjectTask[] = [];
export const lessonCategories: LessonCategory[] = [];
export const initialModules: ModuleItem[] = [];
export const lessons: Lesson[] = [];
export const questions: Question[] = [];
export const notes: Note[] = [];
export const initialReviews: ReviewRecord[] = [];
export const initialSessions: SessionRecord[] = [];

export const initialWeeklyCrono: CronoDayAllocation[] = [
  { day: "Segunda", lessonIds: [] },
  { day: "Terça", lessonIds: [] },
  { day: "Quarta", lessonIds: [] },
  { day: "Quinta", lessonIds: [] },
  { day: "Sexta", lessonIds: [] },
  { day: "Sábado", lessonIds: [] },
  { day: "Domingo", lessonIds: [] },
];

export const weeklyActivity: DailyActivity[] = [
  { day: "Seg", shortDay: "S", minutes: 0, sessions: 0, active: false },
  { day: "Ter", shortDay: "T", minutes: 0, sessions: 0, active: false },
  { day: "Qua", shortDay: "Q", minutes: 0, sessions: 0, active: false },
  { day: "Qui", shortDay: "Q", minutes: 0, sessions: 0, active: false },
  { day: "Sex", shortDay: "S", minutes: 0, sessions: 0, active: false },
  { day: "Sáb", shortDay: "S", minutes: 0, sessions: 0, active: false },
  { day: "Dom", shortDay: "D", minutes: 0, sessions: 0, active: false },
];

export const sampleVault: Vault = {
  learning: "",
  answer: "",
  notes: "",
  highlights: [],
  examples: [],
  applications: [],
  insights: [],
  doubts: [],
  connections: [],
  sources: [],
  aiLessons: [],
  activeReview: {
    what: "",
    how: "",
    why: "",
    where: "",
    connections: "",
    thirtySeconds: "",
  },
};