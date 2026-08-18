export type Stage =
  | "study"
  | "fixation"
  | "weekly"
  | "monthly"
  | "mastered";

export const stageProgressMap: Record<Stage, number> = {
  study: 0,
  fixation: 30,
  weekly: 60,
  monthly: 85,
  mastered: 100,
};

export function getStageProgress(stage: Stage): number {
  return stageProgressMap[stage] ?? 0;
}

export interface UserPreferences {
  theme?: "dark" | "light" | "system";
  accentColor?: string;
  density?: "comfortable" | "compact";
  sidebarMode?: "expanded" | "collapsed";
  defaultDbView?: "table" | "board" | "gallery" | "list";
  showPageIcons?: boolean;
  reducedMotion?: boolean;
  
  // Learning & Cycles
  cycleModel?: "standard" | "custom";
  questionsPerSession?: number;
  autoSelectQuestions?: boolean;
  mixLessons?: boolean;
  prioritizeOverdue?: boolean;
  prioritizeHard?: boolean;
  allowRepeatQuestions?: boolean;
  showSessionProgress?: boolean;
  reviewScheduleTime?: "morning" | "afternoon" | "evening" | "custom";
  dailyReviewLimit?: number;
  autoReviews?: boolean;
  defaultScope?: "question" | "lesson" | "category" | "module" | "domain";
  pomodoroMinutes?: number;
  shortBreakMinutes?: number;
  longBreakMinutes?: number;

  // Notifications
  notifySessionAvailable?: boolean;
  notifyReviewAvailable?: boolean;
  notifyOverdue?: boolean;
  notifyCycleComplete?: boolean;
  notifyWeeklySummary?: boolean;
  notifyMonthlySummary?: boolean;
  notifyAiSuggestions?: boolean;
  notificationTime?: "morning" | "afternoon" | "evening" | "custom";

  // Data & Workspace
  confirmBeforeDelete?: boolean;
  dateFormat?: "DD/MM/YYYY" | "YYYY-MM-DD" | "MM/DD/YYYY";
  firstDayOfWeek?: "Segunda" | "Domingo";

  // App & Device
  language?: "pt-BR" | "en-US";
  offlineMode?: boolean;
  autoSync?: boolean;
  keepScreenAwake?: boolean;
  hapticFeedback?: boolean;

  // Advanced
  developerMode?: boolean;
  betaFeatures?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
  preferences?: UserPreferences;
}

export type MetricScope = "question" | "lesson" | "category" | "module" | "domain";

export type Layer =
  | "life skill"
  | "human knowledge"
  | "strategico"
  | "mission critical";

export const layerConfig: Record<Layer, { label: string; color: string; bg: string; border: string }> = {
  "mission critical": { label: "Mission Critical", color: "#f87171", bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.35)" },
  "strategico": { label: "Estratégico", color: "#fbbf24", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.35)" },
  "human knowledge": { label: "Human Knowledge", color: "#60a5fa", bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.35)" },
  "life skill": { label: "Life Skill", color: "#34d399", bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.35)" },
};

export type PriorityLevel = "P0 - Urgente" | "P1 - Alta" | "P2 - Média" | "P3 - Normal";

export const priorityConfig: Record<PriorityLevel, { label: string; color: string }> = {
  "P0 - Urgente": { label: "P0 • Urgente", color: "#ef4444" },
  "P1 - Alta": { label: "P1 • Alta", color: "#f97316" },
  "P2 - Média": { label: "P2 • Média", color: "#eab308" },
  "P3 - Normal": { label: "P3 • Normal", color: "#94a3b8" },
};

export type InterestLevel = "5/5 - Máximo" | "4/5 - Alto" | "3/5 - Médio" | "2/5 - Baixo";

export interface Note {
  id: string;
  title: string;
  domain: string;
  lesson?: string;
  snippet: string;
  createdAt: string;
  tags: string[];
}

export interface Domain {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string;
  createdAt: string;
  layer: Layer;
  priorityLevel: PriorityLevel;
  interestLevel: InterestLevel;
  meta: string;
  proposito: string;
  objetivo: string;
  focusLesson: string;
  focusType?: "lesson" | "question";
  focusTarget?: string;
  projects: string[];
  lessonsCount: number;
  questionsCount: number;
  progress: number;
  nextUp: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  completed: boolean;
  dueDate: string;
  priority?: "Alta" | "Média" | "Baixa";
}

export interface ProjectSectionObjective {
  problem?: string;
  desiredResult?: string;
}

export interface ProjectSectionDirection {
  vision?: string;
  scope?: string;
}

export interface ProjectSectionVisual {
  heroImage?: string;
  gallery?: string[];
}

export interface ProjectSectionLinks {
  github?: string;
  figma?: string;
  deploy?: string;
  apk?: string;
  customLinks?: { title: string; url: string }[];
}

export interface ProjectSectionStructure {
  technologies?: string[];
  architecture?: string;
  mainParts?: string[];
}

export interface ProjectSectionProcess {
  decisions?: string[];
  tests?: string[];
  problems?: string[];
  solutions?: string[];
}

export interface ProjectSectionEvolution {
  changelog?: { version: string; date: string; notes: string }[];
  currentVersion?: string;
}

export interface ProjectSectionResult {
  currentState?: string;
  nextMilestone?: string;
}

export interface Project {
  id: string;
  name: string;
  icon: string;
  domain: string;
  status: "Em Andamento" | "Planejado" | "Concluído" | "Pausado";
  progress: number;
  targetDate: string; // ISO / YYYY-MM-DD or readable
  description: string;
  category: string;
  type?: string; // Product · Active, Mobile App, Core System...
  objective?: ProjectSectionObjective;
  direction?: ProjectSectionDirection;
  visual?: ProjectSectionVisual;
  links?: ProjectSectionLinks;
  structure?: ProjectSectionStructure;
  process?: ProjectSectionProcess;
  evolution?: ProjectSectionEvolution;
  insights?: string[];
  resources?: string[];
  notes?: string;
  result?: ProjectSectionResult;
}

export interface LessonCategory {
  id: string;
  name: string;
  domain: string;
  lessonsCount: number;
  description: string;
  color: string;
}

export interface ModuleItem {
  id: string;
  name: string;
  domain: string;
  lesson: string;
  category: string;
  questionsCount: number;
  progress: number;
  description: string;
  status: "Em Estudo" | "Revisando" | "Dominado";
}

export interface LessonItem {
  id: string;
  title: string;
  completed: boolean;
  duration?: string;
}

export interface Lesson {
  id: string;
  name: string;
  domain: string;
  category: string;
  module: string;
  questionsCount: number;
  progress: number;
  status: "Em Estudo" | "Revisando" | "Dominado";
  difficulty: "Iniciante" | "Intermediário" | "Avançado";
  createdAt: string;
  lastReview: string;
  nextReview: string;
  objective: string;
  items: LessonItem[];
  keyConcepts: string[];
  difficulties: string[];
  projects: string[];
  plan?: string;
  cycle?: string;
  plans?: string[];
  cycles?: string[];
  scheduledDays?: DayOfWeek[];
  tags?: string[];
  vault?: Vault;
  timeInvested?: string;
}

export interface StudyPlan {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt?: string;
}

export interface StudyCycle {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt?: string;
}

export interface CronoFilterOption {
  id: string;
  name: string;
  type: "plan" | "cycle" | "custom";
  color?: string;
}

export interface ReviewRecord {
  id: string;
  title: string;
  type: "Daily (24h)" | "Weekly (7d)" | "Monthly (30d)" | "Mastery Recall" | "Custom";
  domain: string;
  lesson: string;
  question: string;
  dueDate: string; // YYYY-MM-DD
  interval: string;
  status: "Pronto" | "Pendente" | "Concluído" | "Agendado";
  retentionScore: number;
  benchmarkTestResult?: string; // Ex: "18/20 acertos no teste do NotebookLM"
  lastReviewedAt: string;
}

export interface SessionRecord {
  id: string;
  title: string;
  questionId: string;
  questionTitle: string;
  domain: string;
  lesson: string;
  module: string;
  date: string;
  durationMinutes: number;
  mode: "pomodoro" | "stopwatch";
  status: "Concluída" | "Em Andamento";
  notesVaultFilled?: boolean;
}

export type Question = {
  id: string;
  title: string;
  domain: string;
  lesson: string;
  module: string;
  stage: Stage;
  progress: number;
  createdAt?: string;
  vault?: Vault;
};

export interface VaultConnection {
  id?: string;
  type: "lesson" | "question" | "vault";
  title: string;
  targetId?: string;
  domain?: string;
}

export interface VaultSource {
  id?: string;
  title: string;
  url?: string;
  authorOrPlatform?: string;
  type?: "livro" | "artigo" | "paper" | "video" | "aula" | "ia" | "documentacao" | "outro";
}

export interface VaultAILesson {
  id?: string;
  aiModel: string;
  topic?: string;
  content: string;
  date?: string;
}

export type Vault = {
  learning: string;
  answer: string;
  notes?: string;
  highlights: string[];
  examples: string[];
  applications: string[];
  insights: string | string[];
  doubts: string | string[];
  connections: (string | VaultConnection)[];
  sources: (string | VaultSource)[];
  aiLessons?: VaultAILesson[];
  activeReview: {
    what: string;
    how: string;
    why: string;
    where: string;
    connections: string;
    thirtySeconds: string;
  };
};

export type DayOfWeek = "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta" | "Sábado" | "Domingo";

export interface CronoDayAllocation {
  day: DayOfWeek;
  lessonIds: string[];
}