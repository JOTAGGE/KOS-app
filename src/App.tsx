import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft, ArrowRight, Brain, CalendarDays, Check, ChevronDown, ChevronRight,
  CircleHelp, Clock3, FileText, Filter, Flame, Home, LayoutGrid, List, Menu, Plus,
  Search, Settings, Sparkles, Table2, Target, X, Zap, CheckCircle2, TrendingUp,
  BookOpen, Layers, Award, BarChart3, RotateCw, Play, Pause, RefreshCw, Compass, FolderGit2,
  Tag, MoreHorizontal, ArrowUpDown, Eye, ExternalLink, Calendar, SlidersHorizontal,
  StickyNote, CheckCircle, Activity, Gauge, AlertTriangle, CheckSquare, Square,
  Edit3, Trash2, Save, Undo, Box, Boxes, Timer, Coffee, FlameKindling, Bot, LogOut, LogIn
} from "lucide-react";
import {
  domains as initialDomains,
  projects as initialProjects,
  initialProjectTasks,
  lessonCategories as initialCategories,
  initialModules,
  lessons as initialLessons,
  questions as initialQuestions,
  notes as initialNotes,
  initialReviews,
  initialSessions,
  initialWeeklyCrono,
  sampleVault,
  weeklyActivity
} from "./data/mock";
import type {
  Question, Stage, Domain, Project, ProjectTask, LessonCategory, ModuleItem, Lesson, Note,
  ReviewRecord, SessionRecord, Vault, Layer, PriorityLevel, InterestLevel,
  VaultConnection, VaultSource, VaultAILesson, CronoDayAllocation, DayOfWeek,
  MetricScope, StudyPlan, StudyCycle
} from "./types";
import { layerConfig, priorityConfig, stageProgressMap, getStageProgress } from "./types";
import { VaultFullPage, VaultViewTarget } from "./components/VaultFullPage";
import { EditVaultModal } from "./components/EditVaultModal";
import { ProjectFullPage } from "./components/ProjectFullPage";
import { CronoPlannerPage } from "./components/CronoPlannerPage";
import { StudySessionPage } from "./components/StudySessionPage";
import { QuestionPage } from "./components/QuestionPage";
import { KnowledgeDatabasesView } from "./components/KnowledgeDatabasesView";
import { ProfileSettingsModal } from "./components/ProfileSettingsModal";
import { BlueAICopilotModal } from "./components/BlueAICopilotModal";
import { EmojiPickerSelector } from "./components/EmojiPickerSelector";
import { useAuth } from "./firebase/authContext";
import { LoginPage } from "./components/LoginPage";
import {
  subscribeToDomains, saveDomain, deleteDomain,
} from "./firebase/services/domainsService";
import {
  subscribeToCategories, saveCategory, deleteCategory,
} from "./firebase/services/categoriesService";
import {
  subscribeToModules, saveModule, deleteModule,
} from "./firebase/services/modulesService";
import {
  subscribeToLessons, saveLesson, deleteLesson,
} from "./firebase/services/lessonsService";
import {
  subscribeToQuestions, saveQuestion, updateQuestionVault, deleteQuestion,
} from "./firebase/services/questionsService";
import {
  subscribeToProjects, saveProject, deleteProject,
  subscribeToProjectTasks, saveProjectTask, updateProjectTask, deleteProjectTask,
} from "./firebase/services/projectsService";
import {
  subscribeToReviews, saveReview, updateReview as updateReviewRecord, deleteReview,
} from "./firebase/services/reviewsService";
import {
  subscribeToSessions, saveSession, deleteSession,
} from "./firebase/services/sessionsService";
import {
  subscribeToCronoSchedule, saveCronoSchedule,
} from "./firebase/services/cronoService";
import {
  subscribeToNotes, saveNote, deleteNote,
} from "./firebase/services/notesService";
import {
  subscribeToStudyPlans, saveStudyPlan, deleteStudyPlan,
  subscribeToStudyCycles, saveStudyCycle, deleteStudyCycle,
} from "./firebase/services/plansCyclesService";
import { seedInitialUserDataIfEmpty } from "./firebase/services/seedService";
const stages: { key: Stage; label: string; color: string; desc: string }[] = [
  { key: "study", label: "Study", color: "#60a5fa", desc: "Estudo inicial & síntese" },
  { key: "fixation", label: "Fixation", color: "#f59e0b", desc: "Fixação em 24-48h" },
  { key: "weekly", label: "Weekly", color: "#a855f7", desc: "Revisão semanal (7d)" },
  { key: "monthly", label: "Monthly", color: "#ec4899", desc: "Revisão mensal (30d)" },
  { key: "mastered", label: "Mastered", color: "#10b981", desc: "Conhecimento retido 100%" },
];

const nav = [
  { id: "home", label: "Dashboard", icon: Home },
  { id: "crono", label: "Crono (Semanal)", icon: CalendarDays },
  { id: "session", label: "Study Session", icon: Clock3 },
  { id: "knowledge", label: "Knowledge DBs", icon: Table2 },
  { id: "reviews", label: "Reviews", icon: Brain },
];

type DbType = "domains" | "lessons" | "categories" | "modules" | "questions" | "vaults" | "reviews" | "projects" | "sessions";

function App() {
  const { user, userProfile, loading: authLoading, logout } = useAuth();
  const [page, setPage] = useState("home");
  const [activeDb, setActiveDb] = useState<DbType>("domains");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarDbsCollapsed, setSidebarDbsCollapsed] = useState(false);

  // Core State (Syncs with Firebase when user is authenticated)
  const [domainsList, setDomainsList] = useState<Domain[]>(initialDomains);
  const [projectsList, setProjectsList] = useState<Project[]>(initialProjects);
  const [projectTasksList, setProjectTasksList] = useState<ProjectTask[]>(initialProjectTasks);
  const [categoriesList, setCategoriesList] = useState<LessonCategory[]>(initialCategories);
  const [modulesList, setModulesList] = useState<ModuleItem[]>(initialModules);
  const [lessonsList, setLessonsList] = useState<Lesson[]>(initialLessons);
  const [questionsList, setQuestionsList] = useState<Question[]>(initialQuestions);
  const [notesList, setNotesList] = useState<Note[]>(initialNotes);
  const [reviewsList, setReviewsList] = useState<ReviewRecord[]>(initialReviews);
  const [sessionsList, setSessionsList] = useState<SessionRecord[]>(initialSessions);
  const [cronoSchedule, setCronoSchedule] = useState<CronoDayAllocation[]>(initialWeeklyCrono);
  const [plansList, setPlansList] = useState<StudyPlan[]>([]);
  const [cyclesList, setCyclesList] = useState<StudyCycle[]>([]);

  // Realtime Subscriptions with Firebase
  useEffect(() => {
    if (!user) {
      setDomainsList([]);
      setLessonsList([]);
      setCategoriesList([]);
      setModulesList([]);
      setQuestionsList([]);
      setProjectsList([]);
      setProjectTasksList([]);
      setReviewsList([]);
      setSessionsList([]);
      setCronoSchedule(initialWeeklyCrono);
      setNotesList([]);
      setPlansList([]);
      setCyclesList([]);
      setSelectedDomain(null);
      setSelectedLesson(null);
      setSelectedQuestion(null);
      return;
    }

    // Garante que o banco de dados do usuário no Firestore possui todos os registros iniciais
    seedInitialUserDataIfEmpty(user.uid).catch(console.error);

    const unsubs = [
      subscribeToDomains(user.uid, (data) => setDomainsList(data)),
      subscribeToLessons(user.uid, (data) => setLessonsList(data)),
      subscribeToCategories(user.uid, (data) => setCategoriesList(data)),
      subscribeToModules(user.uid, (data) => setModulesList(data)),
      subscribeToQuestions(user.uid, (data) => setQuestionsList(data)),
      subscribeToProjects(user.uid, (data) => setProjectsList(data)),
      subscribeToProjectTasks(user.uid, (data) => setProjectTasksList(data)),
      subscribeToReviews(user.uid, (data) => setReviewsList(data)),
      subscribeToSessions(user.uid, (data) => setSessionsList(data)),
      subscribeToCronoSchedule(user.uid, (data) => setCronoSchedule(data)),
      subscribeToNotes(user.uid, (data) => setNotesList(data)),
      subscribeToStudyPlans(user.uid, (data) => setPlansList(data)),
      subscribeToStudyCycles(user.uid, (data) => setCyclesList(data)),
    ];

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [user]);

  // Selected Entities
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(initialDomains[0] || null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(initialLessons[0] || null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(initialQuestions[0] || null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(initialProjects[0] || null);
  const [selectedVaultTarget, setSelectedVaultTarget] = useState<VaultViewTarget | null>(null);
  const [activeSessionQuestionId, setActiveSessionQuestionId] = useState<string>("");

  // Metrics Scope State
  const [progressScope, setProgressScope] = useState<MetricScope>("question");
  const [masteredScope, setMasteredScope] = useState<MetricScope>("question");

  // Sync Default Scope from User Preferences
  useEffect(() => {
    if (userProfile?.preferences?.defaultScope) {
      setProgressScope(userProfile.preferences.defaultScope);
      setMasteredScope(userProfile.preferences.defaultScope);
    }
  }, [userProfile?.preferences?.defaultScope]);

  // Modals Open State
  const [aiOpen, setAiOpen] = useState(false);
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const [newQuestionOpen, setNewQuestionOpen] = useState(false);
  const [newDomainOpen, setNewDomainOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newModuleOpen, setNewModuleOpen] = useState(false);
  const [newLessonOpen, setNewLessonOpen] = useState(false);
  const [newReviewOpen, setNewReviewOpen] = useState(false);

  // Edit Modals Target Entity State
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingCategory, setEditingCategory] = useState<LessonCategory | null>(null);
  const [editingModule, setEditingModule] = useState<ModuleItem | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingReview, setEditingReview] = useState<ReviewRecord | null>(null);
  const [editingVaultTarget, setEditingVaultTarget] = useState<{ id: string; name: string; vault: Vault } | null>(null);

  // Global Toast Feedback Notification
  const [toastMessage, setToastMessage] = useState<{ message: string; type?: "success" | "danger" | "info" } | null>(null);
  const showToast = (message: string, type: "success" | "danger" | "info" = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync User Theme, Accent Color, and Reduced Motion globally to DOM
  useEffect(() => {
    if (typeof document !== "undefined") {
      const theme = userProfile?.preferences?.theme || "dark";
      const accent = userProfile?.preferences?.accentColor || "#3b82f6";
      
      document.documentElement.style.setProperty("--blue", accent);
      document.documentElement.style.setProperty("--blue-glow", `${accent}30`);
      
      if (theme === "light") {
        document.documentElement.setAttribute("data-theme", "light");
      } else if (theme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
        document.documentElement.setAttribute("data-theme", prefersLight ? "light" : "dark");
      }

      if (userProfile?.preferences?.reducedMotion) {
        document.documentElement.classList.add("reduced-motion");
      } else {
        document.documentElement.classList.remove("reduced-motion");
      }
    }
  }, [userProfile?.preferences?.theme, userProfile?.preferences?.accentColor, userProfile?.preferences?.reducedMotion]);

  // Dynamic automatic rollups for progress: Question (by stage) -> Module -> Lesson -> Category -> Domain
  const computedQuestions = useMemo(() => {
    return questionsList.map(q => ({
      ...q,
      progress: stageProgressMap[q.stage] ?? q.progress ?? 0,
    }));
  }, [questionsList]);

  const computedModules = useMemo(() => {
    return modulesList.map(mod => {
      const qInMod = computedQuestions.filter(q => q.module.toLowerCase() === mod.name.toLowerCase() && q.lesson.toLowerCase() === mod.lesson.toLowerCase());
      const avg = qInMod.length ? Math.round(qInMod.reduce((a, b) => a + b.progress, 0) / qInMod.length) : 0;
      const status: ModuleItem["status"] = avg === 100 ? "Dominado" : avg > 0 ? "Revisando" : "Em Estudo";
      return {
        ...mod,
        questionsCount: qInMod.length || mod.questionsCount,
        progress: avg,
        status,
      };
    });
  }, [modulesList, computedQuestions]);

  // Lesson time invested is calculated automatically from sessionsList!
  const computedLessons = useMemo(() => {
    return lessonsList.map(l => {
      const qInLes = computedQuestions.filter(q => q.lesson.toLowerCase() === l.name.toLowerCase());
      const avg = qInLes.length ? Math.round(qInLes.reduce((a, b) => a + b.progress, 0) / qInLes.length) : 0;
      const status: Lesson["status"] = avg === 100 ? "Dominado" : avg > 0 ? "Revisando" : "Em Estudo";
      const totalMinutes = sessionsList
        .filter(s => s.lesson.toLowerCase() === l.name.toLowerCase())
        .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      const autoTimeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;

      // Auto-extract scheduled days from weekly crono schedule
      const cronoDays = cronoSchedule
        .filter(d => d.lessonIds.includes(l.id))
        .map(d => d.day);
      const scheduledDays = Array.from(new Set([...(l.scheduledDays || []), ...cronoDays]));

      // Multi-plan and multi-cycle arrays with fallback
      const plans = l.plans && l.plans.length > 0 ? l.plans : (l.plan ? [l.plan] : []);
      const cycles = l.cycles && l.cycles.length > 0 ? l.cycles : (l.cycle ? [l.cycle] : []);

      return {
        ...l,
        questionsCount: qInLes.length || l.questionsCount,
        progress: avg,
        status,
        timeInvested: autoTimeStr,
        plans,
        cycles,
        scheduledDays,
      };
    });
  }, [lessonsList, computedQuestions, sessionsList, cronoSchedule]);

  const computedCategories = useMemo(() => {
    return categoriesList.map(cat => {
      const lesInCat = computedLessons.filter(l => l.category.toLowerCase() === cat.name.toLowerCase());
      return {
        ...cat,
        lessonsCount: lesInCat.length,
      };
    });
  }, [categoriesList, computedLessons]);

  const computedProjects = useMemo(() => {
    return projectsList.map(p => {
      const tasks = projectTasksList.filter(t => t.projectId === p.id);
      const completed = tasks.filter(t => t.completed).length;
      const autoProgress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : p.progress;
      return {
        ...p,
        progress: autoProgress,
      };
    });
  }, [projectsList, projectTasksList]);

  const computedDomains = useMemo(() => {
    return domainsList.map(d => {
      const dLessons = computedLessons.filter(l => l.domain.toLowerCase() === d.name.toLowerCase());
      const avg = dLessons.length ? Math.round(dLessons.reduce((a, b) => a + b.progress, 0) / dLessons.length) : 0;
      const qInDomain = computedQuestions.filter(q => q.domain.toLowerCase() === d.name.toLowerCase());
      const nextUnfinishedQ = qInDomain.find(q => q.stage !== "mastered");
      const nextUpLabel = nextUnfinishedQ ? `Questão: ${nextUnfinishedQ.title}` : (dLessons[0] ? `Lição: ${dLessons[0].name}` : "Nenhum tópico pendente");

      return {
        ...d,
        lessonsCount: dLessons.length,
        questionsCount: qInDomain.length,
        progress: avg,
        nextUp: nextUpLabel,
      };
    });
  }, [domainsList, computedLessons, computedQuestions]);

  const openDomainPage = (d: Domain) => {
    setSelectedDomain(d);
    setPage("domain");
    setMobileOpen(false);
  };

  const openLessonPage = (l: Lesson) => {
    setSelectedLesson(l);
    setPage("lesson");
    setMobileOpen(false);
  };

  const openProjectPage = (p: Project) => {
    setSelectedProject(p);
    setPage("project");
    setMobileOpen(false);
  };

  const openQuestionPage = (q: Question) => {
    setSelectedQuestion(q);
    setPage("question");
    setMobileOpen(false);
  };

  const openQuestion = openQuestionPage;

  const openVaultPage = (target: VaultViewTarget) => {
    setSelectedVaultTarget(target);
    setPage("vault");
    setMobileOpen(false);
  };

  const startSessionWithQuestion = (q: Question) => {
    setSelectedQuestion(q);
    setActiveSessionQuestionId(q.id);
    setPage("session");
    setMobileOpen(false);
  };

  const openDb = (db: DbType) => {
    setActiveDb(db);
    setPage("knowledge");
    setMobileOpen(false);
  };

  // --- CRUD Handlers with Firebase Persistence ---

  const handleAddDomain = (newD: Omit<Domain, "id" | "progress" | "lessonsCount" | "questionsCount" | "nextUp" | "gradient">) => {
    const d: Domain = {
      ...newD,
      id: `dom-${Date.now()}`,
      progress: 0,
      lessonsCount: 0,
      questionsCount: 0,
      nextUp: "Definir primeira lição",
      gradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(30, 58, 138, 0.35))",
    };
    setDomainsList(prev => [d, ...prev]);
    if (user) saveDomain(user.uid, d).catch(console.error);
    setNewDomainOpen(false);
  };

  const handleUpdateDomain = (updated: Domain) => {
    setDomainsList(prev => prev.map(d => d.id === updated.id ? updated : d));
    if (selectedDomain?.id === updated.id) setSelectedDomain(updated);
    if (user) saveDomain(user.uid, updated).catch(console.error);
    setEditingDomain(null);
  };

  const handleDeleteDomain = (domainId: string) => {
    setDomainsList(prev => prev.filter(d => d.id !== domainId));
    if (selectedDomain?.id === domainId || page === "domain") {
      setSelectedDomain(null);
      setPage("knowledge");
      setActiveDb("domains");
    }
    setEditingDomain(null);
    if (user) deleteDomain(user.uid, domainId).catch(console.error);
    showToast("Domínio excluído com sucesso!", "danger");
  };

  const handleAddProject = (newP: Omit<Project, "id">) => {
    const p: Project = { ...newP, id: `proj-${Date.now()}` };
    setProjectsList(prev => [p, ...prev]);
    if (user) saveProject(user.uid, p).catch(console.error);
    setNewProjectOpen(false);
  };

  const handleUpdateProject = (updated: Project) => {
    setProjectsList(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (user) saveProject(user.uid, updated).catch(console.error);
    setEditingProject(null);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjectsList(prev => prev.filter(p => p.id !== projectId));
    if (selectedProject?.id === projectId || page === "project") {
      setSelectedProject(null);
      setPage("knowledge");
      setActiveDb("projects");
    }
    setEditingProject(null);
    if (user) deleteProject(user.uid, projectId).catch(console.error);
    showToast("Projeto excluído com sucesso!", "danger");
  };

  const handleToggleProjectTask = (taskId: string) => {
    const target = projectTasksList.find(t => t.id === taskId);
    const updatedStatus = !target?.completed;
    setProjectTasksList(prev => prev.map(t => t.id === taskId ? { ...t, completed: updatedStatus } : t));
    if (user) updateProjectTask(user.uid, taskId, { completed: updatedStatus }).catch(console.error);
  };

  const handleAddProjectTask = (projectId: string, title: string, dueDate: string) => {
    if (!title.trim()) return;
    const newTask: ProjectTask = {
      id: `pt-${Date.now()}`,
      projectId,
      title: title.trim(),
      completed: false,
      dueDate: dueDate || "2026-09-30",
    };
    setProjectTasksList(prev => [...prev, newTask]);
    if (user) saveProjectTask(user.uid, newTask).catch(console.error);
  };

  const handleDeleteProjectTask = (taskId: string) => {
    setProjectTasksList(prev => prev.filter(t => t.id !== taskId));
    if (user) deleteProjectTask(user.uid, taskId).catch(console.error);
  };

  const handleAddCategory = (newC: Omit<LessonCategory, "id">) => {
    const c: LessonCategory = { ...newC, id: `cat-${Date.now()}` };
    setCategoriesList(prev => [c, ...prev]);
    if (user) saveCategory(user.uid, c).catch(console.error);
    setNewCategoryOpen(false);
  };

  const handleUpdateCategory = (updated: LessonCategory) => {
    setCategoriesList(prev => prev.map(c => c.id === updated.id ? updated : c));
    if (user) saveCategory(user.uid, updated).catch(console.error);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategoriesList(prev => prev.filter(c => c.id !== categoryId));
    setEditingCategory(null);
    if (user) deleteCategory(user.uid, categoryId).catch(console.error);
    showToast("Categoria excluída com sucesso!", "danger");
  };

  const handleAddModule = (newM: Omit<ModuleItem, "id" | "progress" | "questionsCount" | "status">) => {
    const m: ModuleItem = {
      ...newM,
      id: `mod-${Date.now()}`,
      progress: 0,
      questionsCount: 0,
      status: "Em Estudo"
    };
    setModulesList(prev => [m, ...prev]);
    if (user) saveModule(user.uid, m).catch(console.error);
    setNewModuleOpen(false);
  };

  const handleUpdateModule = (updated: ModuleItem) => {
    setModulesList(prev => prev.map(m => m.id === updated.id ? updated : m));
    if (user) saveModule(user.uid, updated).catch(console.error);
    setEditingModule(null);
  };

  const handleDeleteModule = (moduleId: string) => {
    setModulesList(prev => prev.filter(m => m.id !== moduleId));
    setEditingModule(null);
    if (user) deleteModule(user.uid, moduleId).catch(console.error);
    showToast("Módulo excluído com sucesso!", "danger");
  };

  const handleAddLesson = (
    newL: Omit<Lesson, "id" | "progress" | "questionsCount" | "items">,
    days?: DayOfWeek[]
  ) => {
    const lessonId = `les-${Date.now()}`;
    const l: Lesson = {
      ...newL,
      id: lessonId,
      progress: 0,
      questionsCount: 0,
      scheduledDays: days || newL.scheduledDays || [],
      items: [
        { id: `i-${Date.now()}-1`, title: "Pergunta 1: Fundamentos", completed: false, duration: "30 min" }
      ],
    };
    setLessonsList(prev => [l, ...prev]);
    if (user) saveLesson(user.uid, l).catch(console.error);

    if (days && days.length > 0) {
      const allDays: DayOfWeek[] = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
      const updatedSchedule = allDays.map(day => {
        const existing = cronoSchedule.find(d => d.day === day) || { day, lessonIds: [] };
        if (days.includes(day) && !existing.lessonIds.includes(lessonId)) {
          return { ...existing, lessonIds: [...existing.lessonIds, lessonId] };
        }
        return existing;
      });
      setCronoSchedule(updatedSchedule);
      if (user) saveCronoSchedule(user.uid, updatedSchedule).catch(console.error);
    }
    setNewLessonOpen(false);
  };

  const handleUpdateLesson = (updated: Lesson, days?: DayOfWeek[]) => {
    const scheduledDays = days !== undefined ? days : (updated.scheduledDays || []);
    const fullUpdated: Lesson = { ...updated, scheduledDays };
    setLessonsList(prev => prev.map(l => l.id === fullUpdated.id ? fullUpdated : l));
    if (selectedLesson?.id === fullUpdated.id) setSelectedLesson(fullUpdated);
    if (user) saveLesson(user.uid, fullUpdated).catch(console.error);

    if (days !== undefined) {
      const allDays: DayOfWeek[] = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
      const updatedSchedule = allDays.map(day => {
        const existing = cronoSchedule.find(d => d.day === day) || { day, lessonIds: [] };
        const shouldInclude = days.includes(day);
        const isIncluded = existing.lessonIds.includes(fullUpdated.id);
        if (shouldInclude && !isIncluded) {
          return { ...existing, lessonIds: [...existing.lessonIds, fullUpdated.id] };
        } else if (!shouldInclude && isIncluded) {
          return { ...existing, lessonIds: existing.lessonIds.filter(id => id !== fullUpdated.id) };
        }
        return existing;
      });
      setCronoSchedule(updatedSchedule);
      if (user) saveCronoSchedule(user.uid, updatedSchedule).catch(console.error);
    }

    setEditingLesson(null);
  };

  const handleDeleteLesson = (lessonId: string) => {
    setLessonsList(prev => prev.filter(l => l.id !== lessonId));
    if (selectedLesson?.id === lessonId || page === "lesson") {
      setSelectedLesson(null);
      setPage("knowledge");
      setActiveDb("lessons");
    }
    setEditingLesson(null);
    if (user) deleteLesson(user.uid, lessonId).catch(console.error);
    showToast("Lesson excluída com sucesso!", "danger");
  };

  const handleAddQuestion = (newQ: Omit<Question, "id" | "progress">) => {
    const q: Question = {
      ...newQ,
      id: `q${Date.now()}`,
      progress: stageProgressMap[newQ.stage] ?? 0,
      createdAt: "Hoje",
      vault: { ...sampleVault }
    };
    setQuestionsList(prev => [q, ...prev]);
    if (user) saveQuestion(user.uid, q).catch(console.error);
    setNewQuestionOpen(false);
  };

  const handleUpdateQuestion = (updated: Question) => {
    const fullUpdated: Question = {
      ...updated,
      progress: stageProgressMap[updated.stage] ?? 0,
    };
    setQuestionsList(prev => prev.map(q => q.id === fullUpdated.id ? fullUpdated : q));
    if (selectedQuestion?.id === fullUpdated.id) setSelectedQuestion(fullUpdated);
    if (user) saveQuestion(user.uid, fullUpdated).catch(console.error);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestionsList(prev => prev.filter(q => q.id !== questionId));
    if (selectedQuestion?.id === questionId || page === "question" || page === "vault") {
      setSelectedQuestion(null);
      setPage("knowledge");
      setActiveDb("questions");
    }
    setEditingQuestion(null);
    if (user) deleteQuestion(user.uid, questionId).catch(console.error);
    showToast("Questão excluída com sucesso!", "danger");
  };

  const handleUpdateVault = (targetId: string, updatedVault: Vault) => {
    setQuestionsList(prev => prev.map(q => {
      if (q.id === targetId) {
        const updated = { ...q, vault: updatedVault };
        if (selectedQuestion?.id === q.id) setSelectedQuestion(updated);
        return updated;
      }
      return q;
    }));
    if (user) updateQuestionVault(user.uid, targetId, updatedVault).catch(console.error);
    setEditingVaultTarget(null);
  };

  const handleAddReview = (newR: Omit<ReviewRecord, "id">) => {
    const r: ReviewRecord = { ...newR, id: `rev-${Date.now()}` };
    setReviewsList(prev => [r, ...prev]);
    if (user) saveReview(user.uid, r).catch(console.error);
    setNewReviewOpen(false);
  };

  const handleUpdateReview = (updated: ReviewRecord) => {
    setReviewsList(prev => prev.map(r => r.id === updated.id ? updated : r));
    if (user) saveReview(user.uid, updated).catch(console.error);
    setEditingReview(null);
  };

  const handleDeleteReview = (reviewId: string) => {
    setReviewsList(prev => prev.filter(r => r.id !== reviewId));
    setEditingReview(null);
    if (user) deleteReview(user.uid, reviewId).catch(console.error);
    showToast("Revisão excluída com sucesso!", "danger");
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessionsList(prev => prev.filter(s => s.id !== sessionId));
    if (user) deleteSession(user.uid, sessionId).catch(console.error);
    showToast("Sessão de estudo excluída com sucesso!", "danger");
  };

  const handleImportBackup = (imported: any) => {
    if (!imported || !user) return;
    const db = imported.databases || imported;

    if (Array.isArray(db.domains)) {
      setDomainsList(db.domains);
      db.domains.forEach((d: Domain) => saveDomain(user.uid, d).catch(console.error));
    }
    if (Array.isArray(db.lessons)) {
      setLessonsList(db.lessons);
      db.lessons.forEach((l: Lesson) => saveLesson(user.uid, l).catch(console.error));
    }
    if (Array.isArray(db.questions)) {
      setQuestionsList(db.questions);
      db.questions.forEach((q: Question) => saveQuestion(user.uid, q).catch(console.error));
    }
    if (Array.isArray(db.projects)) {
      setProjectsList(db.projects);
      db.projects.forEach((p: Project) => saveProject(user.uid, p).catch(console.error));
    }
    if (Array.isArray(db.categories)) {
      setCategoriesList(db.categories);
      db.categories.forEach((c: LessonCategory) => saveCategory(user.uid, c).catch(console.error));
    }
    if (Array.isArray(db.modules)) {
      setModulesList(db.modules);
      db.modules.forEach((m: ModuleItem) => saveModule(user.uid, m).catch(console.error));
    }
    if (Array.isArray(db.reviews)) {
      setReviewsList(db.reviews);
      db.reviews.forEach((r: ReviewRecord) => saveReview(user.uid, r).catch(console.error));
    }
    if (Array.isArray(db.sessions)) {
      setSessionsList(db.sessions);
      db.sessions.forEach((s: SessionRecord) => saveSession(user.uid, s).catch(console.error));
    }
    showToast("Backup importado e sincronizado no Firebase!", "success");
  };

  const handleToggleCronoLesson = (day: DayOfWeek, lessonId: string) => {
    const updatedSchedule = cronoSchedule.map(item => {
      if (item.day !== day) return item;
      const isAlreadyIn = item.lessonIds.includes(lessonId);
      const newLessonIds = isAlreadyIn
        ? item.lessonIds.filter(id => id !== lessonId)
        : [...item.lessonIds, lessonId];
      return { ...item, lessonIds: newLessonIds };
    });
    setCronoSchedule(updatedSchedule);
    if (user) saveCronoSchedule(user.uid, updatedSchedule).catch(console.error);
  };

  const handleCompleteStudySession = ({
    question,
    durationMinutes,
    mode,
    updatedVault,
    advanceStage
  }: {
    question: Question;
    durationMinutes: number;
    mode: "pomodoro" | "stopwatch";
    updatedVault: Vault;
    advanceStage: boolean;
  }) => {
    const nextStageMap: Record<Stage, Stage> = {
      study: "fixation",
      fixation: "weekly",
      weekly: "monthly",
      monthly: "mastered",
      mastered: "mastered",
    };

    const nextProgressMap: Record<Stage, number> = {
      study: 40,
      fixation: 65,
      weekly: 80,
      monthly: 90,
      mastered: 100,
    };

    const nextStage = advanceStage ? nextStageMap[question.stage] || question.stage : question.stage;
    const nextProgress = advanceStage ? nextProgressMap[nextStage] || question.progress : question.progress;

    const updatedQ: Question = {
      ...question,
      stage: nextStage,
      progress: nextProgress,
      vault: updatedVault,
    };

    setQuestionsList(prev => prev.map(q => {
      if (q.id === question.id) {
        if (selectedQuestion?.id === q.id) setSelectedQuestion(updatedQ);
        return updatedQ;
      }
      return q;
    }));

    const newSession: SessionRecord = {
      id: `ses-${Date.now()}`,
      title: `Sessão • ${question.lesson}`,
      questionId: question.id,
      questionTitle: question.title,
      domain: question.domain,
      lesson: question.lesson,
      module: question.module,
      date: "Hoje",
      durationMinutes,
      mode,
      status: "Concluída",
      notesVaultFilled: true,
    };
    setSessionsList(prev => [newSession, ...prev]);

    const newRev: ReviewRecord = {
      id: `rev-${Date.now()}`,
      title: `Revisão de ${question.title.substring(0, 30)}...`,
      type: nextStage === "fixation" ? "Daily (24h)" : nextStage === "weekly" ? "Weekly (7d)" : "Monthly (30d)",
      domain: question.domain,
      lesson: question.lesson,
      question: question.title,
      dueDate: "Amanhã",
      interval: nextStage === "fixation" ? "24h" : nextStage === "weekly" ? "7d" : "30d",
      status: "Pronto",
      retentionScore: nextProgress,
      benchmarkTestResult: `Fixação pós-sessão de ${durationMinutes} min`,
      lastReviewedAt: "Hoje",
    };
    setReviewsList(prev => [newRev, ...prev]);

    // Persist all 3 entities atomically to Firebase
    if (user) {
      saveQuestion(user.uid, updatedQ).catch(console.error);
      saveSession(user.uid, newSession).catch(console.error);
      saveReview(user.uid, newRev).catch(console.error);
    }

    alert(`🎉 Sessão concluída com sucesso!\nVault salvo para "${question.title}".\nQuestão avançou para a fase [${nextStage.toUpperCase()}] com ${nextProgress}% de retenção!\nTempo investido atualizado automaticamente no Firestore.`);
  };

  const handleToggleLessonItem = (lessonId: string, itemId: string) => {
    let updatedLessonRef: Lesson | null = null;
    setLessonsList(prev => prev.map(l => {
      if (l.id !== lessonId) return l;
      const updatedItems = l.items.map(item => {
        if (item.id === itemId) return { ...item, completed: !item.completed };
        return item;
      });
      const updatedLesson = { ...l, items: updatedItems };
      if (selectedLesson?.id === lessonId) setSelectedLesson(updatedLesson);
      return updatedLesson;
    }));
  };

  const handleSavePlan = async (plan: Omit<StudyPlan, "id"> & { id?: string }) => {
    if (!user) {
      if (plan.id) {
        setPlansList(prev => prev.map(p => p.id === plan.id ? { ...p, ...plan } as StudyPlan : p));
      } else {
        setPlansList(prev => [...prev, { ...plan, id: `plan-${Date.now()}` }]);
      }
      return;
    }
    await saveStudyPlan(user.uid, plan);
  };

  const handleDeletePlan = async (planId: string) => {
    if (!user) {
      setPlansList(prev => prev.filter(p => p.id !== planId));
      return;
    }
    await deleteStudyPlan(user.uid, planId);
  };

  const handleSaveCycle = async (cycle: Omit<StudyCycle, "id"> & { id?: string }) => {
    if (!user) {
      if (cycle.id) {
        setCyclesList(prev => prev.map(c => c.id === cycle.id ? { ...c, ...cycle } as StudyCycle : c));
      } else {
        setCyclesList(prev => [...prev, { ...cycle, id: `cycle-${Date.now()}` }]);
      }
      return;
    }
    await saveStudyCycle(user.uid, cycle);
  };

  const handleDeleteCycle = async (cycleId: string) => {
    if (!user) {
      setCyclesList(prev => prev.filter(c => c.id !== cycleId));
      return;
    }
    await deleteStudyCycle(user.uid, cycleId);
  };

  const go = (id: string) => {
    setPage(id);
    setMobileOpen(false);
  };

  if (authLoading) {
    return (
      <div className="login-screen-overlay">
        <div style={{ textAlign: "center", color: "#fff" }}>
          <div className="login-brand-logo">K</div>
          <p style={{ marginTop: "12px", color: "var(--text-dim)", fontSize: "13px" }}>Carregando Knowledge OS...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="workspace" onClick={() => go("home")}>
          <div className="workspace-icon">K</div>
          <div>
            <strong>KOS</strong>
            <span>Knowledge OS</span>
          </div>
          <ChevronDown size={14} />
        </div>

        <div className="side-section">
          <span className="side-label">WORKSPACE</span>
          {nav.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${page === item.id ? "active" : ""}`}
                onClick={() => go(item.id)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.id === "reviews" && (
                  <span className="nav-badge">{reviewsList.filter(r => r.status === "Pronto" || r.dueDate === "Hoje" || r.dueDate === "2026-08-17").length}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="side-section">
          <button
            type="button"
            className="side-label-toggle-btn"
            onClick={() => setSidebarDbsCollapsed(p => !p)}
            title="Recolher / Expandir Bases de Dados"
          >
            <span className="side-label" style={{ marginBottom: 0 }}>DATABASES (8)</span>
            <span className="toggle-chevron">
              {sidebarDbsCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
            </span>
          </button>

          {!sidebarDbsCollapsed && (
            <div className="side-dbs-stack">
              <button className={`nav-item ${page === "knowledge" && activeDb === "domains" ? "sub-active active" : ""}`} onClick={() => openDb("domains")}>
                <span className="db-dot">◈</span>
                <span>1. Domains</span>
                <span className="db-count-tag">{computedDomains.length}</span>
              </button>
              <button className={`nav-item ${page === "knowledge" && activeDb === "lessons" ? "sub-active active" : ""}`} onClick={() => openDb("lessons")}>
                <span className="db-dot">▦</span>
                <span>2. Lessons</span>
                <span className="db-count-tag">{computedLessons.length}</span>
              </button>
              <button className={`nav-item ${page === "knowledge" && activeDb === "categories" ? "sub-active active" : ""}`} onClick={() => openDb("categories")}>
                <span className="db-dot">🏷️</span>
                <span>3. Categories</span>
                <span className="db-count-tag">{computedCategories.length}</span>
              </button>
              <button className={`nav-item ${page === "knowledge" && activeDb === "modules" ? "sub-active active" : ""}`} onClick={() => openDb("modules")}>
                <span className="db-dot">📦</span>
                <span>4. Modules</span>
                <span className="db-count-tag">{computedModules.length}</span>
              </button>
              <button className={`nav-item ${page === "knowledge" && activeDb === "questions" ? "sub-active active" : ""}`} onClick={() => openDb("questions")}>
                <span className="db-dot">□</span>
                <span>5. Questions</span>
                <span className="db-count-tag">{questionsList.length}</span>
              </button>
              <button className={`nav-item ${page === "knowledge" && activeDb === "vaults" ? "sub-active active" : ""}`} onClick={() => openDb("vaults")}>
                <span className="db-dot">▤</span>
                <span>6. Vaults</span>
                <span className="db-count-tag">{questionsList.length}</span>
              </button>
              <button className={`nav-item ${page === "knowledge" && activeDb === "reviews" ? "sub-active active" : ""}`} onClick={() => openDb("reviews")}>
                <span className="db-dot">↻</span>
                <span>7. Reviews</span>
                <span className="db-count-tag">{reviewsList.length}</span>
              </button>
              <button className={`nav-item ${page === "knowledge" && activeDb === "projects" ? "sub-active active" : ""}`} onClick={() => openDb("projects")}>
                <span className="db-dot">📁</span>
                <span>Projects & Tasks</span>
                <span className="db-count-tag">{computedProjects.length}</span>
              </button>
            </div>
          )}
        </div>

        <div className="sidebar-bottom">
          <button className="nav-item ai-trigger-btn" onClick={() => setAiOpen(true)}>
            <Sparkles size={16} />
            <span>BLUE (IA KOS)</span>
          </button>
          <button className="nav-item" onClick={() => setProfileSettingsOpen(true)}>
            <Settings size={16} />
            <span>Preferências</span>
          </button>
          <div
            className="profile"
            style={{ justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
            onClick={() => setProfileSettingsOpen(true)}
            title="Abrir Perfil & Preferências"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
              <div className="avatar" style={{ overflow: "hidden", padding: 0 }}>
                {userProfile?.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  userProfile?.name ? userProfile.name[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : "U")
                )}
              </div>
              <div style={{ overflow: "hidden" }}>
                <strong style={{ display: "block", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.isAnonymous ? "🎭 Convidado (Anônimo)" : (userProfile?.name || user.displayName || user.email?.split("@")[0] || "Usuário")}
                </strong>
                <span style={{ fontSize: "10.5px", color: user.isAnonymous ? "#fbbf24" : "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                  {user.isAnonymous ? "Clique na porta para Login" : (userProfile?.email || user.email || "Workspace")}
                </span>
              </div>
            </div>
            <button
              className="btn-logout-mini"
              onClick={(e) => { e.stopPropagation(); logout(); }}
              title={user.isAnonymous ? "Sair do modo anônimo e ir para o Login" : "Sair da Conta"}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)} />}

      <main className="main">
        <header className="topbar">
          <button className="icon-button mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
            <Menu size={18} />
          </button>

          <div className="breadcrumb">
            <span onClick={() => go("home")} style={{ cursor: "pointer" }}>KOS</span>
            <ChevronRight size={13} />
            {page === "domain" && selectedDomain ? (
              <>
                <span onClick={() => openDb("domains")} style={{ cursor: "pointer" }}>Domains</span>
                <ChevronRight size={13} />
                <strong>◈ {selectedDomain.name}</strong>
              </>
            ) : page === "lesson" && selectedLesson ? (
              <>
                <span onClick={() => openDb("lessons")} style={{ cursor: "pointer" }}>Lessons</span>
                <ChevronRight size={13} />
                <strong>▦ {selectedLesson.name}</strong>
              </>
            ) : page === "question" && selectedQuestion ? (
              <>
                <span onClick={() => openDb("questions")} style={{ cursor: "pointer" }}>Questions</span>
                <ChevronRight size={13} />
                <strong>□ {selectedQuestion.title}</strong>
              </>
            ) : page === "vault" && selectedVaultTarget ? (
              <>
                <span onClick={() => openDb("vaults")} style={{ cursor: "pointer" }}>Vaults DB</span>
                <ChevronRight size={13} />
                <strong>▤ {selectedVaultTarget.name}</strong>
              </>
            ) : page === "crono" ? (
              <strong>Quadro Semanal Crono</strong>
            ) : page === "session" ? (
              <strong>Study Session & Cronômetro Pomodoro</strong>
            ) : (
              <strong>{labelFor(page)}</strong>
            )}
          </div>

          <div className="topbar-right">
            {user.isAnonymous && (
              <button
                className="btn-guest-topbar"
                onClick={logout}
                title="Sair do modo anônimo e voltar para a tela de login/cadastro"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(245, 158, 11, 0.15)",
                  border: "1px solid rgba(245, 158, 11, 0.35)",
                  color: "#fbbf24",
                  padding: "5px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                <LogIn size={13} />
                <span>Sair do Convidado / Login</span>
              </button>
            )}
            <button className="quick-add-top-btn" onClick={() => setNewQuestionOpen(true)}>
              <Plus size={14} /> <span>Nova Pergunta</span>
            </button>
            <button className="icon-button" onClick={() => setAiOpen(true)} title="KOS AI">
              <Sparkles size={17} />
            </button>
          </div>
        </header>

        <div className="content">
          {page === "home" && (
            <DashboardHome
              userName={userProfile?.name || user?.displayName || user?.email?.split("@")[0] || "Estudante"}
              domains={computedDomains}
              categories={computedCategories}
              modules={computedModules}
              lessons={computedLessons}
              questions={computedQuestions}
              sessions={sessionsList}
              progressScope={progressScope}
              setProgressScope={setProgressScope}
              masteredScope={masteredScope}
              setMasteredScope={setMasteredScope}
              onQuestion={openQuestion}
              onGo={go}
              onOpenDb={openDb}
              onOpenNewModal={() => setNewQuestionOpen(true)}
              onOpenAI={() => setAiOpen(true)}
              onDomainClick={openDomainPage}
            />
          )}

          {page === "crono" && (
            <CronoPlannerPage
              schedule={cronoSchedule}
              lessons={computedLessons}
              questions={computedQuestions}
              plans={plansList}
              cycles={cyclesList}
              onUpdateSchedule={setCronoSchedule}
              onStartSessionWithQuestion={startSessionWithQuestion}
              onOpenLesson={openLessonPage}
              onOpenQuestion={openQuestion}
              onUpdateLesson={handleUpdateLesson}
              onSavePlan={handleSavePlan}
              onDeletePlan={handleDeletePlan}
              onSaveCycle={handleSaveCycle}
              onDeleteCycle={handleDeleteCycle}
            />
          )}

          {page === "session" && (
            <StudySessionPage
              questions={computedQuestions}
              domains={computedDomains}
              lessons={computedLessons}
              schedule={cronoSchedule}
              sessions={sessionsList}
              initialQuestionId={activeSessionQuestionId}
              onCompleteSession={handleCompleteStudySession}
              onQuestionClick={openQuestion}
              onLessonClick={openLessonPage}
            />
          )}

          {page === "question" && selectedQuestion && (
            <QuestionPage
              question={computedQuestions.find(q => q.id === selectedQuestion.id) || selectedQuestion}
              onBack={() => go("home")}
              onEditQuestion={() => setEditingQuestion(selectedQuestion)}
              onOpenVaultPage={() => openVaultPage({
                id: selectedQuestion.id,
                name: `Questão • ${selectedQuestion.title}`,
                type: "question",
                domain: selectedQuestion.domain,
                lesson: selectedQuestion.lesson,
                module: selectedQuestion.module,
                vault: selectedQuestion.vault || sampleVault,
              })}
              onEditVault={() => setEditingVaultTarget({ id: selectedQuestion.id, name: selectedQuestion.title, vault: selectedQuestion.vault || sampleVault })}
              onCreateVault={() => setEditingVaultTarget({ id: selectedQuestion.id, name: selectedQuestion.title, vault: sampleVault })}
              onStartSession={() => startSessionWithQuestion(selectedQuestion)}
            />
          )}

          {page === "domain" && selectedDomain && (
            <DomainFullPage
              domain={computedDomains.find(d => d.id === selectedDomain.id) || selectedDomain}
              lessons={computedLessons.filter(l => l.domain.toLowerCase() === selectedDomain.name.toLowerCase())}
              questions={computedQuestions.filter(q => q.domain.toLowerCase() === selectedDomain.name.toLowerCase())}
              projects={computedProjects.filter(p => p.domain.toLowerCase() === selectedDomain.name.toLowerCase())}
              notes={notesList.filter(n => n.domain.toLowerCase() === selectedDomain.name.toLowerCase())}
              onLessonClick={openLessonPage}
              onQuestionClick={openQuestion}
              onOpenVaultPage={openVaultPage}
              onEditDomain={() => setEditingDomain(selectedDomain)}
              onBack={() => openDb("domains")}
              onAddQuestion={() => setNewQuestionOpen(true)}
            />
          )}

          {page === "lesson" && selectedLesson && (
            <LessonFullPage
              lesson={computedLessons.find(l => l.id === selectedLesson.id) || selectedLesson}
              questions={computedQuestions.filter(q => q.lesson.toLowerCase() === selectedLesson.name.toLowerCase() || (q.domain.toLowerCase() === selectedLesson.domain.toLowerCase() && q.module.toLowerCase() === selectedLesson.module.toLowerCase()))}
              notes={notesList.filter(n => n.lesson?.toLowerCase() === selectedLesson.name.toLowerCase() || n.domain.toLowerCase() === selectedLesson.domain.toLowerCase())}
              projects={computedProjects.filter(p => selectedLesson.projects?.includes(p.name))}
              cronoSchedule={cronoSchedule}
              onToggleItem={(itemId) => handleToggleLessonItem(selectedLesson.id, itemId)}
              onQuestionClick={openQuestion}
              onOpenVaultPage={openVaultPage}
              onEditLesson={() => setEditingLesson(selectedLesson)}
              onBack={() => openDb("lessons")}
              onGoCrono={() => go("crono")}
              onAddQuestion={() => setNewQuestionOpen(true)}
            />
          )}

          {page === "vault" && selectedVaultTarget && (
            <VaultFullPage
              target={selectedVaultTarget}
              onBack={() => openDb("vaults")}
              onEditVault={() => setEditingVaultTarget({ id: selectedVaultTarget.id, name: selectedVaultTarget.name, vault: selectedVaultTarget.vault })}
              onDeleteVault={(id) => handleDeleteQuestion(id)}
              onStartSession={() => {
                const found = computedQuestions.find(q => q.id === selectedVaultTarget.id);
                if (found) startSessionWithQuestion(found);
                else go("session");
              }}
              onNavigateToLesson={(lesName) => {
                const found = computedLessons.find(l => l.name.toLowerCase() === lesName.toLowerCase());
                if (found) openLessonPage(found);
              }}
              onNavigateToQuestion={(qTitle) => {
                const found = computedQuestions.find(q => q.title.toLowerCase() === qTitle.toLowerCase());
                if (found) openQuestion(found);
              }}
            />
          )}

          {page === "project" && selectedProject && (
            <ProjectFullPage
              project={computedProjects.find(p => p.id === selectedProject.id) || selectedProject}
              tasks={projectTasksList}
              domains={computedDomains}
              onBack={() => openDb("projects")}
              onEditProject={() => setEditingProject(selectedProject)}
              onDeleteProject={handleDeleteProject}
              onUpdateProject={handleUpdateProject}
              onToggleTask={handleToggleProjectTask}
              onAddTask={handleAddProjectTask}
              onDeleteTask={handleDeleteProjectTask}
            />
          )}

          {page === "knowledge" && (
            <KnowledgeDatabasesView
              activeDb={activeDb}
              setActiveDb={setActiveDb}
              domains={computedDomains}
              projects={computedProjects}
              projectTasks={projectTasksList}
              categories={computedCategories}
              modules={computedModules}
              lessons={computedLessons}
              questions={computedQuestions}
              reviews={reviewsList}
              sessions={sessionsList}
              onQuestion={openQuestion}
              onDomainClick={openDomainPage}
              onLessonClick={openLessonPage}
              onProjectClick={openProjectPage}
              onOpenVaultPage={openVaultPage}
              onEditDomain={(d) => setEditingDomain(d)}
              onEditProject={(p) => setEditingProject(p)}
              onToggleProjectTask={handleToggleProjectTask}
              onAddProjectTask={handleAddProjectTask}
              onDeleteProjectTask={handleDeleteProjectTask}
              onEditCategory={(c) => setEditingCategory(c)}
              onEditModule={(m) => setEditingModule(m)}
              onEditLesson={(l) => setEditingLesson(l)}
              onEditQuestion={(q) => setEditingQuestion(q)}
              onEditReview={(r) => setEditingReview(r)}
              onEditVault={(id, name, v) => setEditingVaultTarget({ id, name, vault: v })}
              onAddDomain={() => setNewDomainOpen(true)}
              onAddProject={() => setNewProjectOpen(true)}
              onAddCategory={() => setNewCategoryOpen(true)}
              onAddModule={() => setNewModuleOpen(true)}
              onAddLesson={() => setNewLessonOpen(true)}
              onAddQuestion={() => setNewQuestionOpen(true)}
              onAddReview={() => setNewReviewOpen(true)}
              onDeleteDomain={handleDeleteDomain}
              onDeleteProject={handleDeleteProject}
              onDeleteCategory={handleDeleteCategory}
              onDeleteModule={handleDeleteModule}
              onDeleteLesson={handleDeleteLesson}
              onDeleteQuestion={handleDeleteQuestion}
              onDeleteReview={handleDeleteReview}
              onDeleteSession={handleDeleteSession}
            />
          )}

          {page === "reviews" && (
            <ReviewsPage
              reviews={reviewsList}
              questions={questionsList}
              onQuestion={openQuestion}
              onOpenReviewsDb={() => openDb("reviews")}
              onEditReview={(r) => setEditingReview(r)}
            />
          )}
        </div>
      </main>

      {/* Blue AI Copilot & Creation Modals */}
      {aiOpen && (
        <BlueAICopilotModal
          isOpen={aiOpen}
          onClose={() => setAiOpen(false)}
          domains={computedDomains}
          lessons={computedLessons}
          categories={computedCategories}
          modules={computedModules}
          questions={questionsList}
          onSaveDomain={handleAddDomain}
          onSaveCategory={handleAddCategory}
          onSaveLesson={handleAddLesson}
          onSaveModule={handleAddModule}
          onSaveQuestion={handleAddQuestion}
        />
      )}
      {newQuestionOpen && <NewQuestionModal onClose={() => setNewQuestionOpen(false)} onSave={handleAddQuestion} domains={computedDomains} lessons={computedLessons} modules={computedModules} />}
      {newDomainOpen && <NewDomainModal onClose={() => setNewDomainOpen(false)} onSave={handleAddDomain} allProjects={computedProjects} />}
      {newProjectOpen && <NewProjectModal onClose={() => setNewProjectOpen(false)} onSave={handleAddProject} domains={computedDomains} categories={computedCategories} />}
      {newCategoryOpen && <NewCategoryModal onClose={() => setNewCategoryOpen(false)} onSave={handleAddCategory} domains={computedDomains} />}
      {newModuleOpen && <NewModuleModal onClose={() => setNewModuleOpen(false)} onSave={handleAddModule} domains={computedDomains} lessons={computedLessons} categories={computedCategories} />}
      {newLessonOpen && <NewLessonModal onClose={() => setNewLessonOpen(false)} onSave={handleAddLesson} domains={computedDomains} categories={computedCategories} modules={computedModules} plans={plansList} cycles={cyclesList} cronoSchedule={cronoSchedule} />}
      {newReviewOpen && <NewReviewModal onClose={() => setNewReviewOpen(false)} onSave={handleAddReview} domains={computedDomains} lessons={computedLessons} questions={questionsList} />}

      {/* Edit Entity Modals */}
      {editingDomain && (
        <EditDomainModal
          domain={editingDomain}
          domainQuestions={questionsList.filter(q => q.domain.toLowerCase() === editingDomain.name.toLowerCase())}
          domainLessons={computedLessons.filter(l => l.domain.toLowerCase() === editingDomain.name.toLowerCase())}
          allProjects={computedProjects}
          onClose={() => setEditingDomain(null)}
          onSave={handleUpdateDomain}
          onDelete={handleDeleteDomain}
        />
      )}
      {editingProject && <EditProjectModal project={editingProject} domains={computedDomains} categories={computedCategories} onClose={() => setEditingProject(null)} onSave={handleUpdateProject} onDelete={handleDeleteProject} />}
      {editingCategory && <EditCategoryModal category={editingCategory} domains={computedDomains} onClose={() => setEditingCategory(null)} onSave={handleUpdateCategory} onDelete={handleDeleteCategory} />}
      {editingModule && <EditModuleModal moduleItem={editingModule} domains={computedDomains} lessons={computedLessons} categories={computedCategories} onClose={() => setEditingModule(null)} onSave={handleUpdateModule} onDelete={handleDeleteModule} />}
      {editingLesson && <EditLessonModal lesson={editingLesson} domains={computedDomains} categories={computedCategories} modules={computedModules} plans={plansList} cycles={cyclesList} cronoSchedule={cronoSchedule} onClose={() => setEditingLesson(null)} onSave={handleUpdateLesson} onDelete={handleDeleteLesson} />}
      {editingQuestion && <EditQuestionModal question={editingQuestion} domains={computedDomains} lessons={computedLessons} modules={computedModules} onClose={() => setEditingQuestion(null)} onSave={handleUpdateQuestion} onDelete={handleDeleteQuestion} />}
      {editingReview && <EditReviewModal review={editingReview} domains={computedDomains} lessons={computedLessons} questions={questionsList} onClose={() => setEditingReview(null)} onSave={handleUpdateReview} onDelete={handleDeleteReview} />}
      {editingVaultTarget && (
        <EditVaultModal
          targetName={editingVaultTarget.name}
          initialVault={editingVaultTarget.vault}
          domains={computedDomains}
          lessons={computedLessons}
          questions={questionsList}
          onClose={() => setEditingVaultTarget(null)}
          onSave={(v) => handleUpdateVault(editingVaultTarget.id, v)}
          onDelete={() => handleDeleteQuestion(editingVaultTarget.id)}
        />
      )}

      {/* User Profile & Preferences Modal */}
      <ProfileSettingsModal
        isOpen={profileSettingsOpen}
        onClose={() => setProfileSettingsOpen(false)}
        domains={computedDomains}
        lessons={computedLessons}
        categories={computedCategories}
        modules={computedModules}
        questions={computedQuestions}
        projects={computedProjects}
        projectTasks={projectTasksList}
        reviews={reviewsList}
        sessions={sessionsList}
        cronoSchedule={cronoSchedule}
        plans={plansList}
        cycles={cyclesList}
        onImportData={handleImportBackup}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="kos-toast-notification" style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          backgroundColor: toastMessage.type === "danger" ? "#881337" : "#064e3b",
          color: "#ffffff",
          border: `1px solid ${toastMessage.type === "danger" ? "#f43f5e" : "#10b981"}`,
          padding: "12px 20px",
          borderRadius: "8px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          zIndex: 99999,
          fontWeight: 600,
          fontSize: "13.5px"
        }}>
          <span style={{ fontSize: "16px" }}>{toastMessage.type === "danger" ? "🗑️" : "✓"}</span>
          <span>{toastMessage.message}</span>
        </div>
      )}
    </div>
  );
}

function labelFor(page: string) {
  return nav.find(n => n.id === page)?.label ?? "Question";
}

function dbTitle(k: DbType) {
  const titles: Record<DbType, string> = {
    domains: "Domains DB",
    lessons: "Lessons DB",
    categories: "Lesson Categories DB",
    modules: "Modules DB",
    questions: "Questions DB",
    vaults: "Vaults DB (Questions)",
    reviews: "Reviews DB",
    projects: "Projects DB & Tasks",
    sessions: "Study Sessions DB (Histórico)"
  };
  return titles[k] || "Database";
}


/* ==========================================================================
   MODULES DATABASE TABLE VIEW
   ========================================================================== */

function ModulesDatabaseTable({
  modules,
  onEditModule,
  onOpenLesson,
  onAddNew,
}: {
  modules: ModuleItem[];
  onEditModule: (m: ModuleItem) => void;
  onOpenLesson: (lesson: string) => void;
  onAddNew: () => void;
}) {
  const avgProgress = Math.round(modules.reduce((acc, m) => acc + m.progress, 0) / (modules.length || 1));

  return (
    <div className="notion-db-card">
      <div className="notion-table-wrapper">
        <table className="notion-table">
          <thead>
            <tr>
              <th className="col-name"><span className="prop-type">📦</span> Módulo</th>
              <th><span className="prop-type">▦</span> Lesson</th>
              <th><span className="prop-type">◈</span> Domínio</th>
              <th><span className="prop-type">🏷️</span> Categoria</th>
              <th><span className="prop-type">□</span> Perguntas</th>
              <th><span className="prop-type">●</span> Status</th>
              <th><span className="prop-type">📊</span> Progresso (Auto)</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((m) => (
              <tr key={m.id} className="notion-row" onClick={() => onEditModule(m)}>
                <td className="cell-title">
                  <span className="q-icon">📦</span>
                  <strong>{m.name}</strong>
                </td>
                <td>
                  <button
                    className="domain-link-btn"
                    onClick={(e) => { e.stopPropagation(); onOpenLesson(m.lesson); }}
                  >
                    ▦ {m.lesson}
                  </button>
                </td>
                <td><span className="domain-tag">{m.domain}</span></td>
                <td><span className="category-pill">{m.category}</span></td>
                <td><span className="lesson-count-badge">{m.questionsCount}</span></td>
                <td>
                  <span className="status-pill" style={{ color: m.status === "Dominado" ? "#10b981" : m.status === "Revisando" ? "#60a5fa" : "#fbbf24" }}>
                    ● {m.status}
                  </span>
                </td>
                <td>
                  <div className="table-progress-v2">
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${m.progress}%`, backgroundColor: "#60a5fa" }} />
                    </div>
                    <span className="progress-num">{m.progress}%</span>
                  </div>
                </td>
                <td>
                  <button
                    className="row-open-peek"
                    onClick={(e) => { e.stopPropagation(); onEditModule(m); }}
                  >
                    <Edit3 size={12} /> Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="notion-summary-row">
              <td><small>Total {modules.length} módulos</small></td>
              <td></td>
              <td></td>
              <td></td>
              <td><small>Soma {modules.reduce((a, b) => a + b.questionsCount, 0)} perguntas</small></td>
              <td></td>
              <td><small>Média {avgProgress}%</small></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <button className="notion-add-row" onClick={onAddNew}>
        <Plus size={14} /> Novo Módulo
      </button>
    </div>
  );
}

/* ==========================================================================
   DOMAIN DATABASE TABLE VIEW
   ========================================================================== */

function DomainDatabaseTable({
  domains,
  onDomainClick,
  onEditDomain,
  onAddNew,
}: {
  domains: Domain[];
  onDomainClick: (d: Domain) => void;
  onEditDomain: (d: Domain) => void;
  onAddNew: () => void;
}) {
  const avgProgress = Math.round(domains.reduce((acc, d) => acc + d.progress, 0) / (domains.length || 1));
  const totalLessons = domains.reduce((acc, d) => acc + d.lessonsCount, 0);
  const totalProjects = domains.reduce((acc, d) => acc + d.projects.length, 0);

  return (
    <div className="notion-db-card">
      <div className="notion-table-wrapper">
        <table className="notion-table">
          <thead>
            <tr>
              <th className="col-name"><span className="prop-type">Aa</span> Domínio</th>
              <th className="col-created"><span className="prop-type">📅</span> Criado em</th>
              <th className="col-layer"><span className="prop-type">🏷️</span> Layer</th>
              <th className="col-priority"><span className="prop-type">⭐</span> Prioridade</th>
              <th className="col-interest"><span className="prop-type">🔥</span> Interesse</th>
              <th className="col-meta"><span className="prop-type">📝</span> Meta</th>
              <th className="col-projects"><span className="prop-type">🔗</span> Projetos</th>
              <th className="col-lessons"><span className="prop-type">▦</span> Lessons</th>
              <th className="col-progress"><span className="prop-type">📊</span> Progresso (Auto)</th>
              <th className="col-open">Ações</th>
            </tr>
          </thead>
          <tbody>
            {domains.map((d) => {
              const layerStyle = layerConfig[d.layer] || layerConfig["life skill"];
              const priorityStyle = priorityConfig[d.priorityLevel] || priorityConfig["P2 - Média"];

              return (
                <tr key={d.id} className="notion-row" onClick={() => onDomainClick(d)}>
                  <td className="cell-title">
                    <span className="domain-row-icon">{d.icon}</span>
                    <strong>{d.name}</strong>
                  </td>

                  <td className="cell-created">
                    <span>{d.createdAt}</span>
                  </td>

                  <td className="cell-layer">
                    <span
                      className="layer-badge"
                      style={{
                        backgroundColor: layerStyle.bg,
                        color: layerStyle.color,
                        borderColor: layerStyle.border,
                      }}
                    >
                      {layerStyle.label}
                    </span>
                  </td>

                  <td className="cell-priority">
                    <span className="priority-pill" style={{ color: priorityStyle.color }}>
                      ● {priorityStyle.label}
                    </span>
                  </td>

                  <td className="cell-interest">
                    <span className="interest-pill">{d.interestLevel}</span>
                  </td>

                  <td className="cell-meta" title={d.meta}>
                    <p className="meta-clamp">{d.meta}</p>
                  </td>

                  <td className="cell-projects">
                    <div className="rel-tags-wrap">
                      {d.projects.map((p) => (
                        <span key={p} className="rel-tag">🔗 {p}</span>
                      ))}
                    </div>
                  </td>

                  <td className="cell-lessons">
                    <span className="lesson-count-badge">
                      {d.lessonsCount} lições
                    </span>
                  </td>

                  <td className="cell-progress">
                    <div className="table-progress-v2">
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${d.progress}%`, backgroundColor: d.color }}
                        />
                      </div>
                      <span className="progress-num">{d.progress}%</span>
                    </div>
                  </td>

                  <td className="cell-open">
                    <div className="row-action-btns">
                      <button
                        className="icon-edit-btn"
                        title="Editar Domínio"
                        onClick={(e) => { e.stopPropagation(); onEditDomain(d); }}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        className="row-open-peek"
                        onClick={(e) => { e.stopPropagation(); onDomainClick(d); }}
                      >
                        Abrir <ChevronRight size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="notion-summary-row">
              <td><small>Count {domains.length}</small></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td><small>{totalProjects} projetos</small></td>
              <td><small>Soma {totalLessons} lições</small></td>
              <td><small>Média {avgProgress}%</small></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <button className="notion-add-row" onClick={onAddNew}>
        <Plus size={14} /> Novo Domínio
      </button>
    </div>
  );
}

/* ==========================================================================
   DOMAIN DATABASE: GALLERY VIEW
   ========================================================================= */

function DomainDatabaseGallery({
  domains,
  onDomainClick,
  onEditDomain,
  onAddNew,
}: {
  domains: Domain[];
  onDomainClick: (d: Domain) => void;
  onEditDomain: (d: Domain) => void;
  onAddNew: () => void;
}) {
  return (
    <div className="domain-gallery-layout">
      {domains.map((d) => {
        const layerStyle = layerConfig[d.layer];
        const priorityStyle = priorityConfig[d.priorityLevel];

        return (
          <div key={d.id} className="domain-gallery-card" onClick={() => onDomainClick(d)}>
            <div className="gallery-header-cover" style={{ background: d.gradient }}>
              <span
                className="gallery-layer-badge"
                style={{
                  backgroundColor: layerStyle.bg,
                  color: layerStyle.color,
                  borderColor: layerStyle.border,
                }}
              >
                {layerStyle.label}
              </span>
              <button
                className="gallery-edit-btn"
                title="Editar Domínio"
                onClick={(e) => { e.stopPropagation(); onEditDomain(d); }}
              >
                <Edit3 size={13} />
              </button>
            </div>

            <div className="gallery-card-content">
              <div className="gallery-title-row">
                <span className="gallery-icon">{d.icon}</span>
                <div>
                  <h3>{d.name}</h3>
                  <small className="gallery-date">Criado em {d.createdAt}</small>
                </div>
              </div>

              <div className="gallery-props-list">
                <div className="prop-line">
                  <span className="prop-key">Prioridade:</span>
                  <span className="priority-pill" style={{ color: priorityStyle.color }}>
                    ● {priorityStyle.label}
                  </span>
                </div>
                <div className="prop-line">
                  <span className="prop-key">Interesse:</span>
                  <span className="interest-pill">{d.interestLevel}</span>
                </div>
              </div>

              <div className="gallery-meta-box">
                <small className="prop-key">META:</small>
                <p>{d.meta}</p>
              </div>

              <div className="gallery-projects-box">
                <small className="prop-key">PROJETOS RELACIONADOS:</small>
                <div className="rel-tags-wrap">
                  {d.projects.map(p => (
                    <span key={p} className="rel-tag">🔗 {p}</span>
                  ))}
                </div>
              </div>

              <div className="gallery-footer-progress">
                <div className="gallery-progress-info">
                  <span>{d.lessonsCount} lições • {d.questionsCount} perguntas</span>
                  <strong>{d.progress}%</strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${d.progress}%`, backgroundColor: d.color }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <button className="gallery-add-card" onClick={onAddNew}>
        <Plus size={20} />
        <span>Novo Domínio</span>
      </button>
    </div>
  );
}

/* ==========================================================================
   DOMAIN DATABASE: BOARD (KANBAN) VIEW
   ========================================================================== */

function DomainDatabaseBoard({
  domains,
  onDomainClick,
  onEditDomain,
  onAddNew,
}: {
  domains: Domain[];
  onDomainClick: (d: Domain) => void;
  onEditDomain: (d: Domain) => void;
  onAddNew: () => void;
}) {
  const layers: Layer[] = ["mission critical", "strategico", "human knowledge", "life skill"];

  return (
    <div className="notion-board-grid">
      {layers.map((layer) => {
        const layerStyle = layerConfig[layer];
        const domainsInLayer = domains.filter((d) => d.layer === layer);

        return (
          <div key={layer} className="board-column">
            <div className="board-col-header">
              <span
                className="layer-badge"
                style={{
                  backgroundColor: layerStyle.bg,
                  color: layerStyle.color,
                  borderColor: layerStyle.border,
                }}
              >
                {layerStyle.label}
              </span>
              <span className="col-count">{domainsInLayer.length}</span>
            </div>

            <div className="board-cards-stack">
              {domainsInLayer.map((d) => (
                <div key={d.id} className="board-card" onClick={() => onDomainClick(d)}>
                  <div className="board-card-head">
                    <span className="board-icon">{d.icon}</span>
                    <strong>{d.name}</strong>
                    <button
                      className="card-mini-edit"
                      onClick={(e) => { e.stopPropagation(); onEditDomain(d); }}
                      title="Editar"
                    >
                      <Edit3 size={11} />
                    </button>
                  </div>

                  <p className="board-meta">{d.meta}</p>

                  <div className="board-card-props">
                    <span className="board-badge">{d.priorityLevel}</span>
                    <span className="board-badge">{d.lessonsCount} lições</span>
                  </div>

                  <div className="board-progress-row">
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${d.progress}%`, backgroundColor: d.color }} />
                    </div>
                    <small>{d.progress}%</small>
                  </div>
                </div>
              ))}

              <button className="board-add-btn" onClick={onAddNew}>
                <Plus size={13} /> Adicionar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ==========================================================================
   LESSONS DATABASE TABLE VIEW
   ========================================================================== */

function LessonsDatabaseTable({
  lessons,
  onOpenLesson,
  onEditLesson,
  onOpenQuestion,
  onAddNew,
}: {
  lessons: Lesson[];
  onOpenLesson: (l: Lesson) => void;
  onEditLesson: (l: Lesson) => void;
  onOpenQuestion: (q: Question) => void;
  onAddNew: () => void;
}) {
  return (
    <div className="notion-db-card">
      <div className="notion-table-wrapper">
        <table className="notion-table">
          <thead>
            <tr>
              <th className="col-name"><span className="prop-type">Aa</span> Lesson</th>
              <th><span className="prop-type">◈</span> Domínio</th>
              <th><span className="prop-type">🏷️</span> Categoria</th>
              <th><span className="prop-type">📦</span> Módulo</th>
              <th><span className="prop-type">⚡</span> Dificuldade</th>
              <th><span className="prop-type">●</span> Status</th>
              <th><span className="prop-type">□</span> Perguntas</th>
              <th><span className="prop-type">⏱️</span> Tempo Investido (Auto)</th>
              <th><span className="prop-type">📊</span> Progresso (Auto)</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((l) => (
              <tr key={l.id} className="notion-row" onClick={() => onOpenLesson(l)}>
                <td className="cell-title">
                  <span className="q-icon">▦</span>
                  <strong>{l.name}</strong>
                </td>
                <td><span className="domain-tag">{l.domain}</span></td>
                <td><span className="category-pill">{l.category}</span></td>
                <td><span className="module-pill">{l.module}</span></td>
                <td><span className="difficulty-pill">{l.difficulty}</span></td>
                <td><span className="status-pill">● {l.status}</span></td>
                <td><span className="lesson-count-badge">{l.questionsCount}</span></td>
                <td><span className="time-pill">{l.timeInvested}</span></td>
                <td>
                  <div className="table-progress-v2">
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${l.progress}%`, backgroundColor: "#10b981" }} />
                    </div>
                    <span className="progress-num">{l.progress}%</span>
                  </div>
                </td>
                <td>
                  <div className="row-action-btns">
                    <button
                      className="icon-edit-btn"
                      title="Editar Lesson"
                      onClick={(e) => { e.stopPropagation(); onEditLesson(l); }}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      className="row-open-peek"
                      onClick={(e) => { e.stopPropagation(); onOpenLesson(l); }}
                    >
                      Abrir <ChevronRight size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="notion-add-row" onClick={onAddNew}>
        <Plus size={14} /> Nova Lesson
      </button>
    </div>
  );
}

/* ==========================================================================
   CATEGORIES DATABASE TABLE VIEW
   ========================================================================== */

function CategoriesDatabaseTable({
  categories,
  onEditCategory,
  onOpenDomain,
  onAddNew,
}: {
  categories: LessonCategory[];
  onEditCategory: (c: LessonCategory) => void;
  onOpenDomain: (domain: string) => void;
  onAddNew: () => void;
}) {
  return (
    <div className="notion-db-card">
      <div className="notion-table-wrapper">
        <table className="notion-table">
          <thead>
            <tr>
              <th className="col-name"><span className="prop-type">Aa</span> Categoria de Lesson</th>
              <th><span className="prop-type">◈</span> Domínio</th>
              <th><span className="prop-type">▦</span> Total de Lições</th>
              <th style={{ width: "350px" }}><span className="prop-type">📝</span> Escopo & Descrição</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="notion-row" onClick={() => onEditCategory(c)}>
                <td className="cell-title">
                  <span className="cat-color-dot" style={{ backgroundColor: c.color }} />
                  <strong>{c.name}</strong>
                </td>
                <td>
                  <button
                    className="domain-link-btn"
                    onClick={(e) => { e.stopPropagation(); onOpenDomain(c.domain); }}
                  >
                    ◈ {c.domain}
                  </button>
                </td>
                <td>
                  <span className="lesson-count-badge">{c.lessonsCount} lições</span>
                </td>
                <td>
                  <p className="meta-clamp">{c.description}</p>
                </td>
                <td>
                  <button
                    className="row-open-peek"
                    onClick={(e) => { e.stopPropagation(); onEditCategory(c); }}
                  >
                    <Edit3 size={12} /> Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="notion-add-row" onClick={onAddNew}>
        <Plus size={14} /> Nova Categoria
      </button>
    </div>
  );
}

/* ==========================================================================
   PROJECTS & TASKS DATABASE TABLE VIEW (Collapsible Sub-Database)
   ========================================================================== */

function ProjectsDatabaseTable({
  projects,
  tasks,
  onEditProject,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onOpenDomain,
  onAddNew,
}: {
  projects: Project[];
  tasks: ProjectTask[];
  onEditProject: (p: Project) => void;
  onToggleTask: (taskId: string) => void;
  onAddTask: (projectId: string, title: string, dueDate: string) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenDomain: (domain: string) => void;
  onAddNew: () => void;
}) {
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("2026-09-30");

  const statusColors: Record<string, string> = {
    "Em Andamento": "#3b82f6",
    "Planejado": "#f59e0b",
    "Concluído": "#10b981",
    "Pausado": "#6b7280",
  };

  const handleCreateTask = (projectId: string) => {
    if (!newTaskTitle.trim()) return;
    onAddTask(projectId, newTaskTitle.trim(), newTaskDueDate);
    setNewTaskTitle("");
  };

  return (
    <div className="projects-db-wrapper">
      <div className="notion-db-card">
        <div className="notion-table-wrapper">
          <table className="notion-table">
            <thead>
              <tr>
                <th className="col-name"><span className="prop-type">Aa</span> Projeto</th>
                <th><span className="prop-type">◈</span> Domínio</th>
                <th><span className="prop-type">🏷️</span> Categoria</th>
                <th><span className="prop-type">●</span> Status</th>
                <th><span className="prop-type">📅</span> Data Alvo</th>
                <th><span className="prop-type">☑️</span> Tarefas</th>
                <th><span className="prop-type">📊</span> Progresso (Auto)</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const projectTasks = tasks.filter(t => t.projectId === p.id);
                const completedCount = projectTasks.filter(t => t.completed).length;
                const isExpanded = expandedProjectId === p.id;

                return (
                  <React.Fragment key={p.id}>
                    <tr className="notion-row" onClick={() => setExpandedProjectId(isExpanded ? null : p.id)}>
                      <td className="cell-title">
                        <span className="domain-row-icon">{p.icon}</span>
                        <strong>{p.name}</strong>
                      </td>
                      <td>
                        <button
                          className="domain-link-btn"
                          onClick={(e) => { e.stopPropagation(); onOpenDomain(p.domain); }}
                        >
                          ◈ {p.domain}
                        </button>
                      </td>
                      <td>
                        <span className="category-pill">{p.category}</span>
                      </td>
                      <td>
                        <span className="status-badge" style={{ color: statusColors[p.status] || "#aaa" }}>
                          ● {p.status}
                        </span>
                      </td>
                      <td>
                        <span className="date-pill">{p.targetDate}</span>
                      </td>
                      <td>
                        <span className="task-count-pill" style={{ color: "#60a5fa" }}>
                          ☑️ {completedCount}/{projectTasks.length}
                        </span>
                      </td>
                      <td>
                        <div className="table-progress-v2">
                          <div className="bar-track">
                            <div className="bar-fill" style={{ width: `${p.progress}%`, backgroundColor: "#3b82f6" }} />
                          </div>
                          <span className="progress-num">{p.progress}%</span>
                        </div>
                      </td>
                      <td>
                        <div className="row-action-btns">
                          <button
                            className="icon-edit-btn"
                            title="Editar Projeto"
                            onClick={(e) => { e.stopPropagation(); onEditProject(p); }}
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            className="row-open-peek"
                            onClick={(e) => { e.stopPropagation(); setExpandedProjectId(isExpanded ? null : p.id); }}
                          >
                            {isExpanded ? "Fechar Tarefas ▲" : "Ver Tarefas ▼"}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* COLLAPSIBLE PROJECT TASKS DATABASE VIEW */}
                    {isExpanded && (
                      <tr className="project-tasks-embedded-row">
                        <td colSpan={8} style={{ padding: "0" }}>
                          <div className="embedded-tasks-container">
                            <div className="embedded-tasks-header">
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <CheckSquare size={15} style={{ color: "#60a5fa" }} />
                                <strong>Tarefas do Projeto: {p.name}</strong>
                                <small style={{ color: "var(--text-dim)" }}>({completedCount} de {projectTasks.length} concluídas • {p.progress}%)</small>
                              </div>
                            </div>

                            <div className="embedded-tasks-list">
                              {projectTasks.map(t => (
                                <div key={t.id} className={`embedded-task-item ${t.completed ? "completed" : ""}`}>
                                  <button
                                    className="task-check-btn"
                                    onClick={() => onToggleTask(t.id)}
                                  >
                                    {t.completed ? <CheckSquare size={16} className="checked" /> : <Square size={16} />}
                                  </button>
                                  <span className="task-title-text">{t.title}</span>
                                  <span className="task-date-badge"><Calendar size={11} /> {t.dueDate}</span>
                                  <button
                                    className="task-delete-btn"
                                    onClick={() => onDeleteTask(t.id)}
                                    title="Remover tarefa"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}

                              {projectTasks.length === 0 && (
                                <p className="empty-subtext">Nenhuma tarefa cadastrada para este projeto.</p>
                              )}

                              {/* Inline Add Task */}
                              <div className="add-task-inline-row">
                                <input
                                  type="text"
                                  placeholder="Nova tarefa para este projeto..."
                                  value={newTaskTitle}
                                  onChange={(e) => setNewTaskTitle(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && handleCreateTask(p.id)}
                                />
                                <input
                                  type="date"
                                  value={newTaskDueDate}
                                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                                />
                                <button
                                  className="btn-add-mini"
                                  onClick={() => handleCreateTask(p.id)}
                                >
                                  <Plus size={13} /> Adicionar Tarefa
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <button className="notion-add-row" onClick={onAddNew}>
          <Plus size={14} /> Novo Projeto
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   QUESTION DATABASE TABLE VIEW
   ========================================================================== */

function QuestionDatabaseTable({
  questions,
  onQuestion,
  onEditQuestion,
  onAddNew,
}: {
  questions: Question[];
  onQuestion: (q: Question) => void;
  onEditQuestion?: (q: Question) => void;
  onAddNew?: () => void;
}) {
  return (
    <div className="notion-db-card">
      <div className="notion-table-wrapper">
        <table className="notion-table">
          <thead>
            <tr>
              <th className="col-name"><span className="prop-type">Aa</span> Questão / Conceito</th>
              <th><span className="prop-type">◈</span> Domínio</th>
              <th><span className="prop-type">▦</span> Lesson</th>
              <th><span className="prop-type">📦</span> Módulo</th>
              <th><span className="prop-type">📅</span> Criado em</th>
              <th><span className="prop-type">🧬</span> Fase no Ciclo</th>
              <th><span className="prop-type">📊</span> Progresso</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id} className="notion-row" onClick={() => onQuestion(q)}>
                <td className="cell-title">
                  <span className="q-icon">□</span>
                  <strong>{q.title}</strong>
                </td>
                <td><span className="domain-tag">{q.domain}</span></td>
                <td><span>{q.lesson}</span></td>
                <td><span className="module-pill">{q.module}</span></td>
                <td><span>{q.createdAt || "10 Jan 2026"}</span></td>
                <td><StageBadge stage={q.stage} /></td>
                <td>
                  <div className="table-progress-v2">
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${q.progress}%`, backgroundColor: "#60a5fa" }} />
                    </div>
                    <span className="progress-num">{q.progress}%</span>
                  </div>
                </td>
                <td>
                  <div className="row-action-btns">
                    {onEditQuestion && (
                      <button
                        className="icon-edit-btn"
                        title="Editar Questão"
                        onClick={(e) => { e.stopPropagation(); onEditQuestion(q); }}
                      >
                        <Edit3 size={13} />
                      </button>
                    )}
                    <button className="row-open-peek" onClick={(e) => { e.stopPropagation(); onQuestion(q); }}>
                      Abrir Página <ChevronRight size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {onAddNew && (
        <button className="notion-add-row" onClick={onAddNew}>
          <Plus size={14} /> Nova Question
        </button>
      )}
    </div>
  );
}

/* ==========================================================================
   VAULT DATABASE TABLE VIEW (ONLY QUESTIONS HAVE VAULTS)
   ========================================================================== */

function VaultDatabaseTable({
  questions,
  onOpenVaultPage,
}: {
  questions: Question[];
  onOpenVaultPage: (target: VaultViewTarget) => void;
}) {
  return (
    <div className="notion-db-card">
      <div className="notion-table-wrapper">
        <table className="notion-table">
          <thead>
            <tr>
              <th className="col-name"><span className="prop-type">Aa</span> Vault da Question (Síntese & Conhecimento)</th>
              <th><span className="prop-type">◈</span> Domínio</th>
              <th><span className="prop-type">▦</span> Lesson</th>
              <th><span className="prop-type">📦</span> Módulo</th>
              <th><span className="prop-type">🔖</span> Highlights</th>
              <th><span className="prop-type">🔗</span> Conexões</th>
              <th><span className="prop-type">🤖</span> Aulas IA</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr
                key={`v-q-${q.id}`}
                className="notion-row"
                onClick={() => onOpenVaultPage({
                  id: q.id,
                  name: `Questão • ${q.title}`,
                  type: "question",
                  domain: q.domain,
                  lesson: q.lesson,
                  module: q.module,
                  vault: q.vault || sampleVault,
                })}
              >
                <td className="cell-title">
                  <span className="q-icon">▤</span>
                  <strong>Vault • {q.title}</strong>
                </td>
                <td><span className="domain-tag">{q.domain}</span></td>
                <td><span>{q.lesson}</span></td>
                <td><span className="module-pill">{q.module}</span></td>
                <td><span>{q.vault?.highlights?.length || 3} destaques</span></td>
                <td><span style={{ color: "#a855f7", fontSize: "11px", fontWeight: 600 }}>{q.vault?.connections?.length || 3} conexões</span></td>
                <td><span className="category-pill" style={{ fontSize: "9px" }}>{q.vault?.aiLessons?.length || 2} aulas IA</span></td>
                <td>
                  <button
                    className="row-open-peek"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenVaultPage({
                        id: q.id,
                        name: `Questão • ${q.title}`,
                        type: "question",
                        domain: q.domain,
                        lesson: q.lesson,
                        module: q.module,
                        vault: q.vault || sampleVault,
                      });
                    }}
                  >
                    Abrir Página Vault <ChevronRight size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ==========================================================================
   REVIEWS DATABASE TABLE VIEW (With Benchmark Test Results)
   ========================================================================== */

function ReviewsDatabaseTable({
  reviews,
  onQuestion,
  onEditReview,
  onAddNew,
}: {
  reviews: ReviewRecord[];
  onQuestion: (q: Question) => void;
  onEditReview: (r: ReviewRecord) => void;
  onAddNew: () => void;
}) {
  const readyCount = reviews.filter(r => r.status === "Pronto" || r.dueDate === "Hoje" || r.dueDate === "2026-08-17").length;

  return (
    <div className="notion-db-card">
      <div className="notion-table-wrapper">
        <table className="notion-table">
          <thead>
            <tr>
              <th className="col-name"><span className="prop-type">↻</span> Ciclo de Revisão</th>
              <th><span className="prop-type">◈</span> Domínio</th>
              <th><span className="prop-type">▦</span> Lesson</th>
              <th><span className="prop-type">□</span> Pergunta Alvo</th>
              <th><span className="prop-type">📅</span> Vencimento</th>
              <th><span className="prop-type">●</span> Status</th>
              <th><span className="prop-type">📊</span> Score & Benchmark (NotebookLM)</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id} className="notion-row" onClick={() => onEditReview(r)}>
                <td className="cell-title">
                  <span className="q-icon">↻</span>
                  <strong>{r.title}</strong>
                </td>
                <td><span className="domain-tag">{r.domain}</span></td>
                <td><span>{r.lesson}</span></td>
                <td><p className="meta-clamp" style={{ maxWidth: "180px" }}>{r.question}</p></td>
                <td>
                  <span className={`date-pill ${r.dueDate === "Hoje" || r.dueDate === "2026-08-17" ? "text-highlight" : ""}`} style={{ fontWeight: r.dueDate === "Hoje" ? 700 : 400 }}>
                    {r.dueDate}
                  </span>
                </td>
                <td>
                  <span className="status-pill" style={{ color: r.status === "Pronto" ? "#34d399" : r.status === "Pendente" ? "#fbbf24" : "#94a3b8" }}>
                    ● {r.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div className="table-progress-v2" style={{ width: "90px" }}>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${r.retentionScore}%`, backgroundColor: "#34d399" }} />
                      </div>
                      <span className="progress-num">{r.retentionScore}%</span>
                    </div>
                    {r.benchmarkTestResult && (
                      <small style={{ fontSize: "10px", color: "var(--text-dim)" }}>{r.benchmarkTestResult}</small>
                    )}
                  </div>
                </td>
                <td>
                  <div className="row-action-btns">
                    <button
                      className="icon-edit-btn"
                      title="Editar Revisão"
                      onClick={(e) => { e.stopPropagation(); onEditReview(r); }}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      className="row-open-peek"
                      onClick={(e) => { e.stopPropagation(); onEditReview(r); }}
                    >
                      Recall <ArrowRight size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="notion-summary-row">
              <td><small>Total {reviews.length} revisões</small></td>
              <td></td>
              <td></td>
              <td></td>
              <td><small>{readyCount} prontas hoje</small></td>
              <td></td>
              <td><small>Média {Math.round(reviews.reduce((a, b) => a + b.retentionScore, 0) / (reviews.length || 1))}%</small></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <button className="notion-add-row" onClick={onAddNew}>
        <Plus size={14} /> Agendar Nova Revisão
      </button>
    </div>
  );
}

/* ==========================================================================
   DOMAIN FULL PAGE
   ========================================================================== */

function DomainFullPage({
  domain,
  lessons,
  questions,
  projects,
  notes,
  onQuestionClick,
  onLessonClick,
  onOpenVaultPage,
  onEditDomain,
  onBack,
  onAddQuestion,
}: {
  domain: Domain;
  lessons: Lesson[];
  questions: Question[];
  projects: Project[];
  notes: Note[];
  onQuestionClick: (q: Question) => void;
  onLessonClick: (l: Lesson) => void;
  onOpenVaultPage: (target: VaultViewTarget) => void;
  onEditDomain: () => void;
  onBack: () => void;
  onAddQuestion: () => void;
}) {
  const layerStyle = layerConfig[domain.layer] || layerConfig["life skill"];
  const priorityStyle = priorityConfig[domain.priorityLevel] || priorityConfig["P2 - Média"];

  const domainStageCounts = useMemo(() => {
    const counts: Record<Stage, number> = { study: 0, fixation: 0, weekly: 0, monthly: 0, mastered: 0 };
    questions.forEach(q => {
      if (counts[q.stage] !== undefined) counts[q.stage]++;
    });
    return counts;
  }, [questions]);

  const masteredQuestionsCount = domainStageCounts.mastered;

  const isQuestionFocus = domain.focusType === "question";
  const matchedFocusQuestion = questions.find(q => q.title === (domain.focusTarget || domain.focusLesson));
  const matchedFocusLesson = lessons.find(l => l.name === (domain.focusTarget || domain.focusLesson)) || lessons[0];

  const inFocusTitle = isQuestionFocus
    ? (matchedFocusQuestion?.title || domain.focusLesson)
    : (matchedFocusLesson?.name || domain.focusLesson || "Fundamentos");

  const nextUpQuestion = questions.find(q => q.title === domain.nextUp) || questions.find(q => q.stage === "study" || q.stage === "fixation") || questions[0];

  return (
    <div className="domain-full-page">
      <div className="page-nav-bar">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={14} /> Voltar para Domains DB
        </button>

        <button className="edit-entity-top-btn" onClick={onEditDomain}>
          <Edit3 size={14} /> Editar Domínio
        </button>
      </div>

      <div className="domain-page-hero" style={{ background: domain.gradient }}>
        <div className="domain-hero-icon-large">{domain.icon}</div>
      </div>

      <div className="domain-page-header-info">
        <div className="domain-eyebrow-line">
          <span>Domain</span>
          <span className="dot">•</span>
          <span
            className="layer-badge"
            style={{
              backgroundColor: layerStyle.bg,
              color: layerStyle.color,
              borderColor: layerStyle.border,
            }}
          >
            Layer {layerStyle.label}
          </span>
          <span className="dot">•</span>
          <span className="priority-pill" style={{ color: priorityStyle.color }}>
            {priorityStyle.label}
          </span>
        </div>

        <h1 className="domain-page-h1">{domain.name}</h1>
      </div>

      <section className="domain-props-section">
        <div className="domain-props-grid">
          <div className="prop-entry">
            <span className="prop-label"><Calendar size={13} /> Criado em</span>
            <div className="prop-val">{domain.createdAt}</div>
          </div>

          <div className="prop-entry">
            <span className="prop-label"><Tag size={13} /> Layer</span>
            <div className="prop-val">
              <span
                className="layer-badge"
                style={{
                  backgroundColor: layerStyle.bg,
                  color: layerStyle.color,
                  borderColor: layerStyle.border,
                }}
              >
                {layerStyle.label}
              </span>
            </div>
          </div>

          <div className="prop-entry">
            <span className="prop-label"><Award size={13} /> Prioridade Level</span>
            <div className="prop-val">
              <span className="priority-pill" style={{ color: priorityStyle.color }}>
                ● {priorityStyle.label}
              </span>
            </div>
          </div>

          <div className="prop-entry">
            <span className="prop-label"><Flame size={13} /> Interest Level</span>
            <div className="prop-val">
              <span className="interest-pill">{domain.interestLevel}</span>
            </div>
          </div>

          <div className="prop-entry full-width">
            <span className="prop-label"><Target size={13} /> 🎯 Propósito</span>
            <div className="prop-val text-block">{domain.proposito || domain.meta}</div>
          </div>

          <div className="prop-entry full-width">
            <span className="prop-label"><Award size={13} /> 🏆 Objetivo</span>
            <div className="prop-val text-block">{domain.objetivo}</div>
          </div>

          <div className="prop-entry full-width">
            <span className="prop-label"><FolderGit2 size={13} /> 🔗 Projetos Relacionados ({projects.length} selecionados)</span>
            <div className="prop-val">
              <div className="rel-tags-wrap">
                {projects.length > 0 ? projects.map((p) => (
                  <span key={p.id} className="rel-tag">🔗 {p.name}</span>
                )) : <span className="placeholder">Nenhum projeto vinculado</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🔥 Foco Atual */}
      <section className="domain-section-block">
        <div className="section-divider-title">
          <span>🔥 Foco Atual ({isQuestionFocus ? "Question em Foco" : "Lesson em Foco"})</span>
          <div className="line-bar" />
        </div>

        <div className="focus-lesson-card">
          <div className="focus-lesson-head">
            <span className="spark-badge"><Sparkles size={13} /> FOCO DEFINIDO NO DOMÍNIO</span>
            <span className="module-badge">{isQuestionFocus ? "□ Question Alvo" : "▦ Lesson"}</span>
          </div>

          <h2
            className="focus-lesson-title interactive-link"
            onClick={() => {
              if (isQuestionFocus && matchedFocusQuestion) {
                onQuestionClick(matchedFocusQuestion);
              } else if (matchedFocusLesson) {
                onLessonClick(matchedFocusLesson);
              }
            }}
          >
            {inFocusTitle} <ChevronRight size={16} />
          </h2>
          <p className="focus-lesson-desc">
            Próximo tópico prioritário: <strong>{domain.nextUp}</strong>. Pratique a recuperação ativa das perguntas associadas.
          </p>

          {nextUpQuestion && (
            <div className="focus-question-box">
              <div className="q-label">□ PRÓXIMA QUESTION SELECIONADA:</div>
              <div className="q-title-row">
                <strong>{nextUpQuestion.title}</strong>
                <StageBadge stage={nextUpQuestion.stage} />
              </div>
            </div>
          )}

          <div className="focus-lesson-actions">
            {nextUpQuestion && (
              <button
                className="focus-btn-primary"
                onClick={() => onOpenVaultPage({
                  id: nextUpQuestion.id,
                  name: `Questão • ${nextUpQuestion.title}`,
                  type: "question",
                  domain: nextUpQuestion.domain,
                  lesson: nextUpQuestion.lesson,
                  module: nextUpQuestion.module,
                  vault: nextUpQuestion.vault || sampleVault,
                })}
              >
                <BookOpen size={14} /> Abrir Página da Vault
              </button>
            )}
            {nextUpQuestion && (
              <button className="focus-btn-secondary" onClick={() => onQuestionClick(nextUpQuestion)}>
                <Brain size={14} /> Fazer Active Recall
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 📚 Lessons */}
      <section className="domain-section-block">
        <div className="section-divider-title">
          <span>📚 Lessons</span>
          <span className="count-pill">{lessons.length}</span>
          <div className="line-bar" />
        </div>

        <div className="notion-db-card">
          <div className="notion-table-wrapper">
            <table className="notion-table">
              <thead>
                <tr>
                  <th className="col-name"><span className="prop-type">Aa</span> Lesson</th>
                  <th><span className="prop-type">🏷️</span> Categoria</th>
                  <th><span className="prop-type">📦</span> Módulo</th>
                  <th><span className="prop-type">⚡</span> Dificuldade</th>
                  <th><span className="prop-type">●</span> Status</th>
                  <th><span className="prop-type">□</span> Perguntas</th>
                  <th><span className="prop-type">⏱️</span> Tempo Investido</th>
                  <th><span className="prop-type">📊</span> Progresso (Auto)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((l) => (
                  <tr key={l.id} className="notion-row" onClick={() => onLessonClick(l)}>
                    <td className="cell-title">
                      <span className="q-icon">▦</span>
                      <strong>{l.name}</strong>
                    </td>
                    <td><span className="category-pill">{l.category}</span></td>
                    <td><span className="module-pill">{l.module}</span></td>
                    <td><span className="difficulty-pill">{l.difficulty}</span></td>
                    <td><span className="status-pill">● {l.status}</span></td>
                    <td><span className="lesson-count-badge">{l.questionsCount}</span></td>
                    <td><span className="time-pill">{l.timeInvested}</span></td>
                    <td>
                      <div className="table-progress-v2">
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${l.progress}%`, backgroundColor: domain.color }} />
                        </div>
                        <span className="progress-num">{l.progress}%</span>
                      </div>
                    </td>
                    <td>
                      <button className="row-open-peek" onClick={(e) => { e.stopPropagation(); onLessonClick(l); }}>
                        Ver Lesson <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ❓ Questions */}
      <section className="domain-section-block">
        <div className="section-divider-title">
          <span>❓ Questions</span>
          <span className="count-pill">{questions.length}</span>
          <div className="line-bar" />
          <button className="new-button-mini" onClick={onAddQuestion}>
            <Plus size={13} /> Nova Question
          </button>
        </div>

        <div className="notion-db-card">
          <div className="notion-table-wrapper">
            <table className="notion-table">
              <thead>
                <tr>
                  <th className="col-name"><span className="prop-type">Aa</span> Questão Central</th>
                  <th><span className="prop-type">▦</span> Lesson</th>
                  <th><span className="prop-type">📦</span> Módulo</th>
                  <th><span className="prop-type">📅</span> Criado em</th>
                  <th><span className="prop-type">🧬</span> Fase no Ciclo</th>
                  <th><span className="prop-type">📊</span> Progresso</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id} className="notion-row" onClick={() => onQuestionClick(q)}>
                    <td className="cell-title">
                      <span className="q-icon">□</span>
                      <strong>{q.title}</strong>
                    </td>
                    <td><span>{q.lesson}</span></td>
                    <td><span className="module-pill">{q.module}</span></td>
                    <td><span>{q.createdAt || "12 Jan 2026"}</span></td>
                    <td><StageBadge stage={q.stage} /></td>
                    <td>
                      <div className="table-progress-v2">
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${q.progress}%`, backgroundColor: "#60a5fa" }} />
                        </div>
                        <span className="progress-num">{q.progress}%</span>
                      </div>
                    </td>
                    <td>
                      <button
                        className="row-open-peek"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenVaultPage({
                            id: q.id,
                            name: `Questão • ${q.title}`,
                            type: "question",
                            domain: q.domain,
                            lesson: q.lesson,
                            module: q.module,
                            vault: q.vault || sampleVault,
                          });
                        }}
                      >
                        Página Vault <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 🚀 Projetos Relacionados (Filtrados estritamente pelos selecionados no domínio!) */}
      <section className="domain-section-block">
        <div className="section-divider-title">
          <span>🚀 Projetos Relacionados</span>
          <span className="count-pill">{projects.length} selecionados</span>
          <div className="line-bar" />
        </div>

        <div className="domain-projects-grid">
          {projects.map((p) => (
            <div key={p.id} className="project-card-mini">
              <div className="proj-head">
                <span className="proj-icon">{p.icon}</span>
                <div>
                  <strong>{p.name}</strong>
                  <small>{p.category}</small>
                </div>
                <span className="status-badge" style={{ color: p.status === "Em Andamento" ? "#3b82f6" : "#f59e0b", marginLeft: "auto" }}>
                  ● {p.status}
                </span>
              </div>
              <p className="proj-desc">{p.description}</p>
              <div className="proj-footer">
                <span className="date-pill"><Calendar size={11} /> {p.targetDate}</span>
                <div className="table-progress-v2" style={{ width: "110px", marginLeft: "auto" }}>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${p.progress}%`, backgroundColor: "#3b82f6" }} />
                  </div>
                  <span className="progress-num">{p.progress}%</span>
                </div>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="empty-subtext" style={{ padding: "20px", background: "var(--card-subtle)", borderRadius: "8px" }}>
              Nenhum projeto selecionado para este domínio. Clique em "Editar Domínio" para vincular projetos.
            </div>
          )}
        </div>
      </section>

      {/* 📊 Progress & Estatísticas */}
      <section className="domain-section-block">
        <div className="section-divider-title">
          <span>📊 Progress & Estatísticas</span>
          <div className="line-bar" />
        </div>

        <div className="domain-stats-dashboard-grid">
          <div className="stat-box-card">
            <div className="stat-box-head">
              <span className="stat-title">DOMINIO PROGRESS (CALCULADO AUTOMATICAMENTE)</span>
              <Gauge size={16} style={{ color: domain.color }} />
            </div>
            <div className="stat-big-val">{domain.progress}%</div>
            <div className="bar-track" style={{ height: "8px", margin: "12px 0" }}>
              <div className="bar-fill" style={{ width: `${domain.progress}%`, backgroundColor: domain.color }} />
            </div>
            <div className="stat-foot-info">
              <span>{masteredQuestionsCount} de {questions.length} perguntas em Mastered</span>
              <span>{lessons.length} lições mapeadas</span>
            </div>
          </div>

          <div className="stat-box-card">
            <div className="stat-box-head">
              <span className="stat-title">CYCLE STATUS (SPACED REPETITION)</span>
              <Layers size={16} style={{ color: "#a855f7" }} />
            </div>
            <div className="cycle-pills-row">
              {stages.map(s => (
                <div key={s.key} className="cycle-pill-item">
                  <span className="stage-dot" style={{ backgroundColor: s.color }} />
                  <span className="stage-name">{s.label}</span>
                  <strong>{domainStageCounts[s.key]}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="stat-box-card">
            <div className="stat-box-head">
              <span className="stat-title">MÉTRICAS DE APRENDIZADO</span>
              <Activity size={16} style={{ color: "#10b981" }} />
            </div>
            <div className="stat-items-stack">
              <div className="stat-row-item">
                <span>Taxa de Retenção de Longo Prazo</span>
                <strong>{Math.round((masteredQuestionsCount / (questions.length || 1)) * 100)}%</strong>
              </div>
              <div className="stat-row-item">
                <span>Projetos Ativos</span>
                <strong>{projects.length}</strong>
              </div>
              <div className="stat-row-item">
                <span>Notas & Insights Registrados</span>
                <strong>{notes.length}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ==========================================================================
   LESSON FULL PAGE
   ========================================================================== */

function LessonFullPage({
  lesson,
  questions,
  notes,
  projects,
  cronoSchedule = [],
  onToggleItem,
  onQuestionClick,
  onOpenVaultPage,
  onEditLesson,
  onBack,
  onGoCrono,
  onAddQuestion,
}: {
  lesson: Lesson;
  questions: Question[];
  notes: Note[];
  projects: Project[];
  cronoSchedule?: CronoDayAllocation[];
  onToggleItem: (itemId: string) => void;
  onQuestionClick: (q: Question) => void;
  onOpenVaultPage: (target: VaultViewTarget) => void;
  onEditLesson: () => void;
  onBack: () => void;
  onGoCrono: () => void;
  onAddQuestion: () => void;
}) {
  const masteredCount = questions.filter(q => q.stage === "mastered" || q.progress >= 100).length;
  const retentionRate = questions.length > 0 ? Math.round((masteredCount / questions.length) * 100) : lesson.progress;

  const plans = lesson.plans && lesson.plans.length > 0 ? lesson.plans : (lesson.plan ? [lesson.plan] : []);
  const cycles = lesson.cycles && lesson.cycles.length > 0 ? lesson.cycles : (lesson.cycle ? [lesson.cycle] : []);
  const cronoDays = (cronoSchedule || []).filter(d => d.lessonIds.includes(lesson.id)).map(d => d.day);
  const scheduledDays = Array.from(new Set([...(lesson.scheduledDays || []), ...cronoDays]));

  return (
    <div className="lesson-full-page">
      <div className="page-nav-bar">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={14} /> Voltar para Lessons DB
        </button>

        <button className="edit-entity-top-btn" onClick={onEditLesson}>
          <Edit3 size={14} /> Editar Lesson
        </button>
      </div>

      <div className="lesson-page-header">
        <div className="lesson-eyebrow-line">
          <span className="lesson-badge-pill">▦ Lesson</span>
          <span className="dot">•</span>
          <span className="domain-tag">{lesson.domain}</span>
          <span className="dot">•</span>
          <span className="category-pill">{lesson.category}</span>
          <span className="dot">•</span>
          <span className="module-pill">{lesson.module}</span>
        </div>

        <div className="lesson-title-action-row">
          <h1 className="lesson-page-h1">{lesson.name}</h1>
          <div className="lesson-top-actions">
            <button className="hero-btn primary" onClick={onGoCrono}>
              <Play size={14} fill="currentColor" /> Iniciar no Crono Semanal
            </button>
            <button className="hero-btn secondary" onClick={onAddQuestion}>
              <Plus size={14} /> Nova Question
            </button>
          </div>
        </div>

        <div className="lesson-props-ribbon">
          <div className="ribbon-item">
            <span className="ribbon-label">Dificuldade:</span>
            <span className="difficulty-pill">{lesson.difficulty}</span>
          </div>
          <div className="ribbon-item">
            <span className="ribbon-label">Status:</span>
            <span className="status-pill">● {lesson.status}</span>
          </div>
          <div className="ribbon-item">
            <span className="ribbon-label">Progresso (Auto):</span>
            <div className="table-progress-v2" style={{ minWidth: "120px" }}>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${lesson.progress}%`, backgroundColor: "#10b981" }} />
              </div>
              <span className="progress-num">{lesson.progress}%</span>
            </div>
          </div>
          <div className="ribbon-item">
            <span className="ribbon-label">Tempo Investido (Auto):</span>
            <span className="time-pill">{lesson.timeInvested}</span>
          </div>
          <div className="ribbon-item">
            <span className="ribbon-label">Última Revisão:</span>
            <span className="ribbon-val">{lesson.lastReview}</span>
          </div>
        </div>
      </div>

      {/* 🎯 Planos, Ciclos & Cronograma Semanal */}
      <section className="lesson-section-block">
        <div className="section-divider-title">
          <span>🎯 Planos, Ciclos & Cronograma Semanal</span>
          <div className="line-bar" />
        </div>
        <div className="lesson-associations-card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px" }}>
          <div className="association-item">
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              🎯 Planos de Estudo ({plans.length})
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {plans.length > 0 ? (
                plans.map((p, i) => (
                  <span key={i} className="category-pill" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#93c5fd", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
                    🎯 {p}
                  </span>
                ))
              ) : (
                <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Nenhum plano associado</span>
              )}
            </div>
          </div>

          <div className="association-item">
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              🔄 Ciclos de Estudo ({cycles.length})
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {cycles.length > 0 ? (
                cycles.map((c, i) => (
                  <span key={i} className="category-pill" style={{ background: "rgba(168, 85, 247, 0.15)", color: "#d8b4fe", border: "1px solid rgba(168, 85, 247, 0.3)" }}>
                    🔄 {c}
                  </span>
                ))
              ) : (
                <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Nenhum ciclo associado</span>
              )}
            </div>
          </div>

          <div className="association-item">
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              📅 Dias no Crono Semanal ({scheduledDays.length})
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {scheduledDays.length > 0 ? (
                scheduledDays.map((day, i) => (
                  <span key={i} className="category-pill" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#6ee7b7", border: "1px solid rgba(16, 185, 129, 0.3)", fontWeight: 600 }}>
                    📅 {day}
                  </span>
                ))
              ) : (
                <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Não agendado no crono</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* # 🎯 Objetivo */}
      <section className="lesson-section-block">
        <div className="section-divider-title">
          <span>🎯 Objetivo</span>
          <div className="line-bar" />
        </div>
        <div className="lesson-objective-card">
          <p className="sub-prompt-title">O que quero ser capaz de fazer ao terminar?</p>
          <div className="objective-text-content">
            {lesson.objective}
          </div>
        </div>
      </section>

      {/* # 📚 Conteúdo (Questions no Ciclo KOS) */}
      <section className="lesson-section-block">
        <div className="section-divider-title">
          <span>📚 Conteúdo (Questions da Lesson)</span>
          <span className="count-pill">{questions.length} perguntas</span>
          <div className="line-bar" />
          <button className="new-button-mini" onClick={onAddQuestion}>
            <Plus size={13} /> Nova Question
          </button>
        </div>

        <div className="lesson-questions-content-card">
          <div className="lesson-questions-list">
            {questions.map((q, idx) => {
              const isMastered = q.stage === "mastered" || q.progress >= 100;
              return (
                <div
                  key={q.id}
                  className={`lesson-q-row ${isMastered ? "mastered-row" : ""}`}
                  onClick={() => onQuestionClick(q)}
                >
                  <div className="lesson-q-check-box" title={isMastered ? "100% Dominada" : "Em ciclo de estudo"}>
                    {isMastered ? (
                      <CheckCircle2 size={18} className="checked-icon" />
                    ) : (
                      <CircleHelp size={18} className="pending-icon" />
                    )}
                  </div>

                  <div className="lesson-q-info">
                    <span className="lesson-q-idx">Pergunta {idx + 1}:</span>
                    <strong className="lesson-q-title">{q.title}</strong>
                    <div className="lesson-q-meta">
                      <span>Módulo: {q.module}</span>
                      <span className="dot">•</span>
                      <span>Criado em: {q.createdAt || "15 Jan 2026"}</span>
                    </div>
                  </div>

                  <div className="lesson-q-stage">
                    <StageBadge stage={q.stage} />
                  </div>

                  <div className="lesson-q-progress">
                    <div className="table-progress-v2" style={{ width: "100px" }}>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${q.progress}%`,
                            backgroundColor: q.stage === "mastered" ? "#10b981" : "#60a5fa"
                          }}
                        />
                      </div>
                      <span className="progress-num">{q.progress}%</span>
                    </div>
                  </div>

                  <div className="lesson-q-actions">
                    <button
                      className="row-open-peek"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenVaultPage({
                          id: q.id,
                          name: `Questão • ${q.title}`,
                          type: "question",
                          domain: q.domain,
                          lesson: q.lesson,
                          module: q.module,
                          vault: q.vault || sampleVault,
                        });
                      }}
                    >
                      Página Vault <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* # 🧠 Conceitos-Chave */}
      <section className="lesson-section-block">
        <div className="section-divider-title">
          <span>🧠 Conceitos-Chave</span>
          <span className="count-pill">{(lesson.keyConcepts || []).length} conceitos</span>
          <div className="line-bar" />
        </div>

        <div className="key-concepts-grid">
          {(lesson.keyConcepts || []).map((c, i) => (
            <div key={i} className="concept-pill-card">
              <span className="concept-bullet">●</span>
              <span>{c}</span>
            </div>
          ))}
          {(lesson.keyConcepts || []).length === 0 && (
            <p className="placeholder-subtext" style={{ padding: "12px", color: "var(--text-dim)" }}>Nenhum conceito cadastrado ainda.</p>
          )}
        </div>
      </section>

      {/* # ⚠️ Dificuldades */}
      <section className="lesson-section-block">
        <div className="section-divider-title">
          <span>⚠️ Dificuldades & Pontos de Atenção</span>
          <div className="line-bar" />
        </div>

        <div className="difficulties-list-card">
          {(lesson.difficulties || []).map((diff, i) => (
            <div key={i} className="difficulty-row">
              <AlertTriangle size={15} className="warning-icon" />
              <p>{diff}</p>
            </div>
          ))}
          {(lesson.difficulties || []).length === 0 && (
            <p className="placeholder-subtext" style={{ padding: "12px", color: "var(--text-dim)" }}>Nenhum ponto de dificuldade registrado.</p>
          )}
        </div>
      </section>

      {/* # 🔄 Última Revisão & Dados da Lesson */}
      <section className="lesson-section-block">
        <div className="section-divider-title">
          <span>🔄 Última Revisão & Métricas da Lesson</span>
          <div className="line-bar" />
        </div>

        <div className="lesson-closing-metrics-grid">
          <div className="lesson-stat-card">
            <div className="lesson-stat-head">
              <span className="stat-title">CICLO DE REVISÃO</span>
              <RotateCw size={16} className="review-spin-icon" />
            </div>
            <div className="rev-dates-stack">
              <div>
                <span className="rev-sub-label">Data da Última Revisão:</span>
                <strong className="rev-main-date">{lesson.lastReview}</strong>
              </div>
              <div>
                <span className="rev-sub-label">Próxima Recomendada:</span>
                <strong className="rev-main-date" style={{ color: "#60a5fa" }}>{lesson.nextReview}</strong>
              </div>
            </div>
            <button className="hero-btn primary" style={{ marginTop: "14px", width: "100%", justifyContent: "center" }} onClick={onGoCrono}>
              <RotateCw size={13} /> Revisar no Active Recall
            </button>
          </div>

          <div className="lesson-stat-card">
            <div className="lesson-stat-head">
              <span className="stat-title">DOMÍNIO DAS QUESTIONS</span>
              <Award size={16} style={{ color: "#10b981" }} />
            </div>
            <div className="stat-big-val">{masteredCount} <small style={{ fontSize: "16px", color: "var(--text-dim)" }}>/ {questions.length}</small></div>
            <div className="bar-track" style={{ height: "6px", margin: "10px 0" }}>
              <div className="bar-fill" style={{ width: `${retentionRate}%`, backgroundColor: "#10b981" }} />
            </div>
            <div className="stat-foot-info">
              <span>{retentionRate}% de retenção no ciclo KOS</span>
              <span>{questions.length - masteredCount} perguntas em consolidação</span>
            </div>
          </div>

          <div className="lesson-stat-card">
            <div className="lesson-stat-head">
              <span className="stat-title">TEMPO INVESTIDO (AUTO)</span>
              <Clock3 size={16} style={{ color: "#f59e0b" }} />
            </div>
            <div className="stat-big-val">{lesson.timeInvested}</div>
            <div className="stat-foot-info" style={{ marginTop: "10px" }}>
              <span>Módulo: {lesson.module}</span>
              <span>Dificuldade: {lesson.difficulty}</span>
              <span>Status: {lesson.status}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ==========================================================================
   DASHBOARD HOME VIEW
   ========================================================================== */

function DashboardHome({
  userName,
  domains,
  categories,
  modules,
  lessons,
  questions,
  sessions = [],
  progressScope,
  setProgressScope,
  masteredScope,
  setMasteredScope,
  onQuestion,
  onGo,
  onOpenDb,
  onOpenNewModal,
  onOpenAI,
  onDomainClick,
}: {
  userName?: string;
  domains: Domain[];
  categories: LessonCategory[];
  modules: ModuleItem[];
  lessons: Lesson[];
  questions: Question[];
  sessions?: SessionRecord[];
  progressScope: MetricScope;
  setProgressScope: (s: MetricScope) => void;
  masteredScope: MetricScope;
  setMasteredScope: (s: MetricScope) => void;
  onQuestion: (q: Question) => void;
  onGo: (p: string) => void;
  onOpenDb: (db: DbType) => void;
  onOpenNewModal: () => void;
  onOpenAI: () => void;
  onDomainClick: (d: Domain) => void;
}) {
  const [selectedStageFilter, setSelectedStageFilter] = useState<Stage | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "reviews" | "mastered" | "study">("all");

  // Dynamic Streak & Weekly Activity calculation from real session records!
  const { streakDays, weeklyMinutesStr, isActiveToday, computedWeeklyActivity, totalWeeklyMins } = useMemo(() => {
    const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const now = new Date();
    
    // Build last 7 days array
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const dayStr = d.toISOString().split("T")[0];
      const shortDay = dayNames[(d.getDay() + 6) % 7];
      return {
        dateStr: dayStr,
        shortDay,
        day: i === 6 ? "Hoje" : shortDay,
        minutes: 0,
        sessions: 0,
      };
    });

    const sessionDates = new Set<string>();
    let totalWeekMins = 0;

    (sessions || []).forEach(s => {
      if (s.date) {
        let ymd = "";
        const parsed = new Date(s.date);
        if (!isNaN(parsed.getTime())) {
          ymd = parsed.toISOString().split("T")[0];
        } else if (s.date === "Hoje") {
          ymd = now.toISOString().split("T")[0];
        } else {
          ymd = s.date;
        }

        if (ymd) {
          sessionDates.add(ymd);
          const found = last7Days.find(d => d.dateStr === ymd);
          if (found) {
            found.minutes += (s.durationMinutes || 0);
            found.sessions += 1;
            totalWeekMins += (s.durationMinutes || 0);
          }
        }
      }
    });

    const todayStr = now.toISOString().split("T")[0];
    const activeToday = sessionDates.has(todayStr);

    let streak = 0;
    let checkDate = new Date(now);
    if (!activeToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dStr = checkDate.toISOString().split("T")[0];
      if (sessionDates.has(dStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const hours = Math.floor(totalWeekMins / 60);
    const mins = totalWeekMins % 60;
    const weeklyMinutesFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;

    return {
      streakDays: streak,
      weeklyMinutesStr: weeklyMinutesFormatted,
      isActiveToday: activeToday,
      computedWeeklyActivity: last7Days,
      totalWeeklyMins: totalWeekMins,
    };
  }, [sessions]);

  const progressMetrics = useMemo(() => {
    switch (progressScope) {
      case "domain": {
        const total = domains.length;
        const avg = Math.round(domains.reduce((acc, d) => acc + d.progress, 0) / (total || 1));
        return { scopeLabel: "Domínios", value: avg, totalCount: total, itemLabel: `${total} domínios cadastrados`, subtext: "Média ponderada dos domínios" };
      }
      case "category": {
        const total = categories.length;
        const catProgresses = categories.map(c => {
          const cl = lessons.filter(l => l.category.toLowerCase() === c.name.toLowerCase() || l.domain.toLowerCase() === c.domain.toLowerCase());
          return cl.length ? cl.reduce((a, b) => a + b.progress, 0) / cl.length : 50;
        });
        const avg = Math.round(catProgresses.reduce((a, b) => a + b, 0) / (total || 1));
        return { scopeLabel: "Categorias", value: avg, totalCount: total, itemLabel: `${total} categorias estruturadas`, subtext: "Média das categorias de lições" };
      }
      case "module": {
        const total = modules.length;
        const avg = Math.round(modules.reduce((acc, m) => acc + m.progress, 0) / (total || 1));
        return { scopeLabel: "Módulos", value: avg, totalCount: total, itemLabel: `${total} módulos mapeados`, subtext: "Média de conclusão por módulo" };
      }
      case "lesson": {
        const total = lessons.length;
        const avg = Math.round(lessons.reduce((acc, l) => acc + l.progress, 0) / (total || 1));
        return { scopeLabel: "Lessons", value: avg, totalCount: total, itemLabel: `${total} lessons cadastradas`, subtext: "Média de conclusão por lição" };
      }
      case "question":
      default: {
        const total = questions.length;
        const avg = Math.round(questions.reduce((acc, q) => acc + q.progress, 0) / (total || 1));
        return { scopeLabel: "Questões", value: avg, totalCount: total, itemLabel: `${total} perguntas no total`, subtext: "Média de retenção por questão" };
      }
    }
  }, [progressScope, domains, categories, modules, lessons, questions]);

  const masteredMetrics = useMemo(() => {
    switch (masteredScope) {
      case "domain": {
        const total = domains.length;
        const count = domains.filter(d => d.progress >= 70).length;
        const percent = Math.round((count / (total || 1)) * 100);
        return { scopeLabel: "Domínios", count, total, percent, badge: "Alta Retenção (≥70%)", subtext: `${count} de ${total} domínios consolidados` };
      }
      case "category": {
        const total = categories.length;
        const count = categories.filter(c => {
          const cl = lessons.filter(l => l.category.toLowerCase() === c.name.toLowerCase());
          return cl.length ? (cl.reduce((a, b) => a + b.progress, 0) / cl.length) >= 70 : false;
        }).length;
        const percent = Math.round((count / (total || 1)) * 100);
        return { scopeLabel: "Categorias", count, total, percent, badge: "Alta Retenção (≥70%)", subtext: `${count} de ${total} categorias dominadas` };
      }
      case "module": {
        const total = modules.length;
        const count = modules.filter(m => m.status === "Dominado" || m.progress >= 100).length;
        const percent = Math.round((count / (total || 1)) * 100);
        return { scopeLabel: "Módulos", count, total, percent, badge: "Status Dominado", subtext: `${count} de ${total} módulos dominados` };
      }
      case "lesson": {
        const total = lessons.length;
        const count = lessons.filter(l => l.status === "Dominado" || l.progress >= 100).length;
        const percent = Math.round((count / (total || 1)) * 100);
        return { scopeLabel: "Lessons", count, total, percent, badge: "Status Dominado", subtext: `${count} de ${total} lições 100% dominadas` };
      }
      case "question":
      default: {
        const total = questions.length;
        const count = questions.filter(q => q.stage === "mastered" || q.progress >= 100).length;
        const percent = Math.round((count / (total || 1)) * 100);
        return { scopeLabel: "Questões", count, total, percent, badge: "Fase Mastered (100%)", subtext: `${count} de ${total} questões dominadas` };
      }
    }
  }, [masteredScope, domains, categories, modules, lessons, questions]);

  const pendingReviewsCount = questions.filter(q => q.stage === "fixation" || q.stage === "weekly").length;
  const nextStudyQuestion = questions.find(q => q.stage === "study" || q.stage === "fixation") || questions[0];

  const stageCounts = useMemo(() => {
    const counts: Record<Stage, number> = { study: 0, fixation: 0, weekly: 0, monthly: 0, mastered: 0 };
    questions.forEach(q => {
      if (counts[q.stage] !== undefined) counts[q.stage]++;
    });
    return counts;
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (selectedStageFilter !== "all" && q.stage !== selectedStageFilter) return false;
      if (activeTab === "reviews" && !(q.stage === "fixation" || q.stage === "weekly")) return false;
      if (activeTab === "mastered" && q.stage !== "mastered") return false;
      if (activeTab === "study" && q.stage !== "study") return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          q.title.toLowerCase().includes(query) ||
          q.domain.toLowerCase().includes(query) ||
          q.lesson.toLowerCase().includes(query) ||
          q.module.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [questions, selectedStageFilter, activeTab, searchQuery]);

  return (
    <div className="dashboard-container">
      <div className="dash-hero">
        <div className="dash-hero-content">
          <div className="dash-badge">
            <span className="live-dot" />
            <span>KNOWLEDGE OS DASHBOARD</span>
          </div>
          <h1>Olá, {userName || "Estudante"} 👋</h1>
          <p>
            Analisando <strong>{progressMetrics.scopeLabel}</strong> com {progressMetrics.value}% de progresso e{" "}
            <strong>{masteredMetrics.count} {masteredMetrics.scopeLabel.toLowerCase()} dominados</strong>. Você tem{" "}
            <span className="text-highlight">{pendingReviewsCount} revisões pendentes</span> para fixação hoje.
          </p>
        </div>

        <div className="dash-hero-actions">
          <button className="hero-btn primary" onClick={() => onGo("session")}>
            <Play size={14} fill="currentColor" /> Iniciar Study Session
          </button>
          <button className="hero-btn secondary" onClick={() => onGo("crono")}>
            <CalendarDays size={14} /> Abrir Crono Semanal
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card kpi-card-blue">
          <div className="kpi-header">
            <div className="kpi-title-with-scope">
              <span className="kpi-title">PROGRESSO GERAL</span>
              <div className="scope-selector-wrap" title="Escolha a base de cálculo para Progresso Geral">
                <SlidersHorizontal size={11} />
                <select
                  className="scope-select"
                  value={progressScope}
                  onChange={(e) => setProgressScope(e.target.value as MetricScope)}
                >
                  <option value="question">Base: Questões</option>
                  <option value="module">Base: Módulos</option>
                  <option value="lesson">Base: Lessons</option>
                  <option value="category">Base: Categorias</option>
                  <option value="domain">Base: Domínios</option>
                </select>
              </div>
            </div>
            <div className="kpi-icon-wrap blue"><TrendingUp size={16} /></div>
          </div>

          <div className="kpi-value-row">
            <span className="kpi-value">{progressMetrics.value}%</span>
            <span className="kpi-trend positive">{progressMetrics.scopeLabel}</span>
          </div>

          <div className="kpi-progress-bar">
            <div className="kpi-progress-fill blue" style={{ width: `${progressMetrics.value}%` }} />
          </div>

          <div className="kpi-footer">
            <span>{progressMetrics.itemLabel}</span>
            <span style={{ color: "var(--text-soft)" }}>{progressMetrics.subtext}</span>
          </div>
        </div>

        <div className="kpi-card kpi-card-emerald">
          <div className="kpi-header">
            <div className="kpi-title-with-scope">
              <span className="kpi-title">DOMINADOS (100%)</span>
              <div className="scope-selector-wrap" title="Escolha a base de cálculo para Dominados">
                <SlidersHorizontal size={11} />
                <select
                  className="scope-select"
                  value={masteredScope}
                  onChange={(e) => setMasteredScope(e.target.value as MetricScope)}
                >
                  <option value="question">Base: Questões</option>
                  <option value="module">Base: Módulos</option>
                  <option value="lesson">Base: Lessons</option>
                  <option value="category">Base: Categorias</option>
                  <option value="domain">Base: Domínios</option>
                </select>
              </div>
            </div>
            <div className="kpi-icon-wrap emerald"><Award size={16} /></div>
          </div>

          <div className="kpi-value-row">
            <span className="kpi-value">{masteredMetrics.count} <small>/ {masteredMetrics.total}</small></span>
            <span className="kpi-sub-badge emerald">{masteredMetrics.badge}</span>
          </div>

          <div className="kpi-progress-bar">
            <div className="kpi-progress-fill emerald" style={{ width: `${masteredMetrics.percent}%` }} />
          </div>

          <div className="kpi-footer">
            <span>{masteredMetrics.subtext}</span>
            <span className="kpi-percent-accent">{masteredMetrics.percent}%</span>
          </div>
        </div>

        <div className="kpi-card kpi-card-amber">
          <div className="kpi-header">
            <span className="kpi-title">REVISÕES DE HOJE</span>
            <div className="kpi-icon-wrap amber"><RotateCw size={16} /></div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{pendingReviewsCount}</span>
            <span className="kpi-sub-badge amber">Prontas para Recall</span>
          </div>
          <div className="kpi-stage-tags">
            <span className="mini-tag fixation">{stageCounts.fixation} Fixation</span>
            <span className="mini-tag weekly">{stageCounts.weekly} Weekly</span>
          </div>
          <div className="kpi-footer">
            <button className="kpi-action-link" onClick={() => onGo("reviews")}>
              Abrir Revisões <ArrowRight size={12} />
            </button>
          </div>
        </div>

        <div className="kpi-card kpi-card-flame">
          <div className="kpi-header">
            <span className="kpi-title">STREAK DE FOCO</span>
            <div className="kpi-icon-wrap flame"><Flame size={16} /></div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{streakDays} <small>{streakDays === 1 ? "dia" : "dias"}</small></span>
            <span className={`kpi-trend ${isActiveToday ? "positive" : ""}`}>
              {isActiveToday ? "🔥 Ativo hoje" : "⚡ Estude para manter"}
            </span>
          </div>
          <div className="kpi-stats-split">
            <div>
              <strong>{weeklyMinutesStr}</strong>
              <small>Esta semana</small>
            </div>
            <div className="divider" />
            <div>
              <strong>{domains.length}</strong>
              <small>Domínios</small>
            </div>
          </div>
          <div className="kpi-footer">
            <span>{isActiveToday ? "Streak diária consolidada" : "Faça uma sessão hoje"}</span>
          </div>
        </div>
      </div>

      <div className="dash-middle-grid">
        <div className="dash-col-left">
          <div className="dash-card featured-focus-card">
            <div className="card-top-tag">
              <span className="spark-icon"><Sparkles size={13} /></span>
              <span>RECOMENDAÇÃO INTELIGENTE DE HOJE</span>
            </div>

            {nextStudyQuestion ? (
              <div className="focus-content">
                <div className="focus-domain-badge">
                  <span>{nextStudyQuestion.domain}</span>
                  <span className="dot">•</span>
                  <span>{nextStudyQuestion.lesson}</span>
                  <span className="dot">•</span>
                  <span>{nextStudyQuestion.module}</span>
                </div>
                <h2 className="focus-title">{nextStudyQuestion.title}</h2>
                <p className="focus-desc">
                  Esta pergunta está no ciclo de <strong className="stage-name-highlight" style={{ color: stages.find(s => s.key === nextStudyQuestion.stage)?.color || "var(--text)" }}>{stages.find(s => s.key === nextStudyQuestion.stage)?.label}</strong>.
                  Pratique o Active Recall para consolidar na memória de longo prazo.
                </p>

                <div className="focus-meta-bar">
                  <div className="meta-item"><Clock3 size={14} /> <span>~5 min</span></div>
                  <div className="meta-item"><StageBadge stage={nextStudyQuestion.stage} /></div>
                  <div className="meta-item progress"><Progress value={nextStudyQuestion.progress} /></div>
                </div>

                <div className="focus-actions">
                  <button className="focus-btn-primary" onClick={() => onQuestion(nextStudyQuestion)}>
                    <BookOpen size={14} /> Abrir Página da Question
                  </button>
                  <button className="focus-btn-ghost" onClick={() => onGo("session")}>
                    Iniciar Session <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="focus-content empty-focus" style={{ padding: "20px 0" }}>
                <h2 className="focus-title" style={{ fontSize: "18px" }}>Nenhuma pergunta cadastrada</h2>
                <p className="focus-desc">
                  Seu sistema KOS está pronto e limpo. Crie sua primeira pergunta para alimentar os ciclos de retenção e sessões de estudo.
                </p>
                <div className="focus-actions" style={{ marginTop: "16px" }}>
                  <button className="focus-btn-primary" onClick={onOpenNewModal}>
                    <Plus size={14} /> Criar Primeira Question
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="dash-card">
            <div className="dash-card-header">
              <div className="dash-card-title">
                <BarChart3 size={16} />
                <h3>Atividade Semanal de Estudo</h3>
              </div>
              <span className="dash-card-caption">Total: {weeklyMinutesStr}</span>
            </div>

            <div className="weekly-chart">
              {computedWeeklyActivity.map((day) => {
                const maxMins = 90;
                const heightPercent = Math.max(12, Math.min(100, (day.minutes / maxMins) * 100));
                const isToday = day.day === "Hoje";
                return (
                  <div key={day.dateStr} className={`chart-col ${isToday ? 'today' : ''}`}>
                    <div className="chart-bar-wrap">
                      <div className="chart-tooltip">{day.minutes} min ({day.sessions} sessões)</div>
                      <div className={`chart-bar ${isToday ? 'active-today' : ''}`} style={{ height: `${heightPercent}%` }} />
                    </div>
                    <span className="chart-label">{day.shortDay}</span>
                    <span className="chart-mins">{day.minutes}m</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="dash-col-right">
          <div className="dash-card">
            <div className="dash-card-header">
              <div className="dash-card-title">
                <Layers size={16} />
                <h3>Ciclo de Retenção (Spaced Repetition)</h3>
              </div>
              {selectedStageFilter !== "all" && (
                <button
                  className="filter-clear-btn active"
                  onClick={() => setSelectedStageFilter("all")}
                >
                  ✕ Limpar Filtro ({selectedStageFilter})
                </button>
              )}
            </div>

            {/* Visual Retention Proportion Pipeline */}
            <div className="retention-pipeline-bar" title="Distribuição do conhecimento nas fases de retenção">
              {stages.map((stage) => {
                const count = stageCounts[stage.key];
                const widthPercent = questions.length > 0 ? (count / questions.length) * 100 : 20;
                return (
                  <div
                    key={stage.key}
                    className="pipeline-segment"
                    style={{
                      width: `${Math.max(widthPercent, count > 0 ? 5 : 2)}%`,
                      backgroundColor: stage.color,
                      opacity: selectedStageFilter === "all" || selectedStageFilter === stage.key ? 1 : 0.25,
                    }}
                    title={`${stage.label}: ${count} questões (${Math.round(widthPercent)}%)`}
                  />
                );
              })}
            </div>

            <div className="stage-cards-grid">
              {stages.map((stage) => {
                const count = stageCounts[stage.key];
                const isSelected = selectedStageFilter === stage.key;
                const stagePercentMap: Record<Stage, string> = {
                  study: "0%",
                  fixation: "30%",
                  weekly: "60%",
                  monthly: "85%",
                  mastered: "100%",
                };
                return (
                  <div
                    key={stage.key}
                    className={`stage-card ${isSelected ? 'selected' : ''}`}
                    style={{
                      "--stage-color": stage.color,
                      "--stage-glow": `${stage.color}35`,
                    } as React.CSSProperties}
                    onClick={() => setSelectedStageFilter(isSelected ? "all" : stage.key)}
                  >
                    <div className="stage-top">
                      <span className="stage-badge-pill-header" style={{ color: stage.color, backgroundColor: `${stage.color}15`, border: `1px solid ${stage.color}35` }}>
                        {stagePercentMap[stage.key]}
                      </span>
                      <span className="stage-count">{count}</span>
                    </div>
                    <div className="stage-info">
                      <h4>{stage.label}</h4>
                      <p>{stage.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="dash-card ai-copilot-card">
            <div className="ai-copilot-header">
              <div className="ai-badge">
                <Sparkles size={12} />
                <span>BLUE — KOS INTELLIGENCE</span>
              </div>
            </div>
            <h3>Estruture seu Conhecimento com a Blue</h3>
            <p>
              Converse com a Blue para transformar qualquer assunto em Domains, Lessons, Modules e Questions de Active Recall direto no seu Firebase.
            </p>
            <div className="ai-copilot-actions">
              <button onClick={onOpenAI} className="ai-btn-open">
                <Sparkles size={13} /> Conversar com a Blue
              </button>
              <button onClick={() => onOpenDb("domains")} className="ai-btn-sub">
                Explorar Domínios
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="dash-section">
        <div className="dash-section-header">
          <div className="dash-section-title">
            <Compass size={18} />
            <h2>Domínios de Conhecimento</h2>
            <span className="count-pill">{domains.length}</span>
          </div>
          <button className="view-all-link" onClick={() => onOpenDb("domains")}>
            Abrir Database Completa <ArrowRight size={13} />
          </button>
        </div>

        <div className="domains-grid">
          {domains.map((d) => {
            const layerStyle = layerConfig[d.layer] || layerConfig["life skill"];
            return (
              <div
                key={d.id}
                className="domain-card-v2"
                onClick={() => onDomainClick(d)}
              >
                <div className="domain-card-accent" style={{ background: d.gradient }} />
                <div className="domain-card-body">
                  <div className="domain-card-top">
                    <span className="domain-icon">{d.icon}</span>
                    <span
                      className="layer-badge"
                      style={{
                        backgroundColor: layerStyle.bg,
                        color: layerStyle.color,
                        borderColor: layerStyle.border,
                      }}
                    >
                      {layerStyle.label}
                    </span>
                  </div>
                  <h3>{d.name}</h3>
                  <div className="domain-stats-sub">
                    <span>{d.lessonsCount} lições</span>
                    <span className="dot">•</span>
                    <span>{d.projects?.length || 0} projetos</span>
                  </div>

                  <p className="domain-card-meta">{d.meta}</p>

                  <div className="domain-progress-wrap">
                    <div className="domain-progress-bar">
                      <div
                        className="domain-progress-fill"
                        style={{ width: `${d.progress}%`, backgroundColor: d.color }}
                      />
                    </div>
                  </div>

                  <div className="domain-next">
                    <small>PRÓXIMO TÓPICO:</small>
                    <span>{d.nextUp}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {domains.length === 0 && (
            <div className="empty-state-box" style={{ gridColumn: "1 / -1", padding: "30px", textAlign: "center", background: "var(--card-subtle)", borderRadius: "8px", border: "1px dashed var(--line)" }}>
              <p style={{ color: "var(--text-dim)", marginBottom: "12px", fontSize: "13px" }}>Nenhum domínio cadastrado ainda no KOS.</p>
              <button className="hero-btn primary" onClick={() => onOpenDb("domains")} style={{ margin: "0 auto", display: "inline-flex" }}>
                <Plus size={14} /> Cadastrar Primeiro Domínio
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="dash-section">
        <div className="dash-section-header">
          <div className="dash-section-title">
            <FileText size={18} />
            <h2>Acervo de Perguntas & Vaults</h2>
            <span className="count-pill">{filteredQuestions.length}</span>
          </div>

          <button className="new-button" onClick={onOpenNewModal}>
            <Plus size={14} /> Nova Pergunta
          </button>
        </div>

        <div className="dash-table-toolbar">
          <div className="dash-filter-tabs">
            <button
              className={`filter-pill ${activeTab === 'all' && selectedStageFilter === 'all' ? 'active' : ''}`}
              onClick={() => { setActiveTab('all'); setSelectedStageFilter('all'); }}
            >
              Todas ({questions.length})
            </button>
            <button
              className={`filter-pill ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              ⚡ Para Revisar ({pendingReviewsCount})
            </button>
            <button
              className={`filter-pill ${activeTab === 'study' ? 'active' : ''}`}
              onClick={() => setActiveTab('study')}
            >
              📖 Em Estudo ({stageCounts.study})
            </button>
            <button
              className={`filter-pill ${activeTab === 'mastered' ? 'active' : ''}`}
              onClick={() => setActiveTab('mastered')}
            >
              🏆 Dominadas ({masteredMetrics.count})
            </button>
          </div>

          <div className="dash-search-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar pergunta, domínio ou lição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery("")}>
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="db-table-wrapper">
          <div className="db-table">
            <div className="tr th question-cols-v2">
              <span>Título da Questão</span>
              <span>Domínio</span>
              <span>Lição / Módulo</span>
              <span>Progresso</span>
              <span>Fase Atual</span>
              <span style={{ textAlign: "right" }}>Ação</span>
            </div>

            {filteredQuestions.length > 0 ? (
              filteredQuestions.map((q) => (
                <div className="tr question-cols-v2 item-row" key={q.id}>
                  <div className="name-cell-interactive" onClick={() => onQuestion(q)}>
                    <span className="q-icon">□</span>
                    <strong>{q.title}</strong>
                  </div>
                  <span>
                    <span className="domain-tag">{q.domain}</span>
                  </span>
                  <span className="lesson-module-cell">
                    <span>{q.lesson}</span>
                    <small>{q.module}</small>
                  </span>
                  <span>
                    <Progress value={q.progress} />
                  </span>
                  <span>
                    <StageBadge stage={q.stage} />
                  </span>
                  <div className="row-actions">
                    <button
                      className="row-btn-action"
                      onClick={() => onQuestion(q)}
                      title="Abrir Página da Question"
                    >
                      Abrir <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-results-dash">
                <Search size={24} />
                <p>Nenhuma pergunta encontrada com os filtros atuais.</p>
                <button
                  className="text-button"
                  onClick={() => { setSearchQuery(""); setSelectedStageFilter("all"); setActiveTab("all"); }}
                >
                  Limpar todos os filtros
                </button>
              </div>
            )}

            <button className="new-row-btn" onClick={onOpenNewModal}>
              <Plus size={14} /> Adicionar nova pergunta a este acervo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   EDIT DOMAIN MODAL
   ========================================================================== */

function EditDomainModal({
  domain,
  domainQuestions,
  domainLessons,
  allProjects,
  onClose,
  onSave,
  onDelete,
}: {
  domain: Domain;
  domainQuestions: Question[];
  domainLessons: Lesson[];
  allProjects: Project[];
  onClose: () => void;
  onSave: (d: Domain) => void;
  onDelete?: (id: string) => void;
}) {
  const [name, setName] = useState(domain.name);
  const [icon, setIcon] = useState(domain.icon);
  const [layer, setLayer] = useState<Layer>(domain.layer);
  const [priorityLevel, setPriorityLevel] = useState<PriorityLevel>(domain.priorityLevel);
  const [interestLevel, setInterestLevel] = useState<InterestLevel>(domain.interestLevel);
  const [meta, setMeta] = useState(domain.meta);
  const [proposito, setProposito] = useState(domain.proposito || domain.meta);
  const [objetivo, setObjetivo] = useState(domain.objetivo || "");

  const [focusType, setFocusType] = useState<"lesson" | "question">(domain.focusType || "lesson");
  const [focusTarget, setFocusTarget] = useState<string>(domain.focusTarget || domain.focusLesson || (domainLessons[0]?.name ?? ""));
  const [nextUpQuestionTitle, setNextUpQuestionTitle] = useState(domain.nextUp || "");
  const [selectedProjects, setSelectedProjects] = useState<string[]>(domain.projects || []);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggleProject = (projName: string) => {
    setSelectedProjects(prev =>
      prev.includes(projName) ? prev.filter(p => p !== projName) : [...prev, projName]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      ...domain,
      name: name.trim(),
      icon: icon || "🌐",
      layer,
      priorityLevel,
      interestLevel,
      meta: meta.trim(),
      proposito: proposito.trim() || meta.trim(),
      objetivo: objetivo.trim(),
      focusType,
      focusTarget,
      focusLesson: focusTarget,
      nextUp: nextUpQuestionTitle || (domainQuestions[0]?.title ?? "Definir primeira lição"),
      projects: selectedProjects,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: "650px", maxHeight: "88vh", overflowY: "auto" }}>
        <div className="modal-header">
          <div className="modal-title">
            <Edit3 size={18} />
            <h3>Editar Domínio: {domain.name}</h3>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row-2">
            <EmojiPickerSelector value={icon} onChange={setIcon} />

            <div className="form-group">
              <label>Nome do Domínio *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label>Layer *</label>
              <select value={layer} onChange={(e) => setLayer(e.target.value as Layer)}>
                <option value="mission critical">Mission Critical</option>
                <option value="strategico">Estratégico</option>
                <option value="human knowledge">Human Knowledge</option>
                <option value="life skill">Life Skill</option>
              </select>
            </div>

            <div className="form-group">
              <label>Prioridade Level</label>
              <select value={priorityLevel} onChange={(e) => setPriorityLevel(e.target.value as PriorityLevel)}>
                <option value="P0 - Urgente">P0 • Urgente</option>
                <option value="P1 - Alta">P1 • Alta</option>
                <option value="P2 - Média">P2 • Média</option>
                <option value="P3 - Normal">P3 • Normal</option>
              </select>
            </div>

            <div className="form-group">
              <label>Interest Level</label>
              <select value={interestLevel} onChange={(e) => setInterestLevel(e.target.value as InterestLevel)}>
                <option value="5/5 - Máximo">5/5 - Máximo</option>
                <option value="4/5 - Alto">4/5 - Alto</option>
                <option value="3/5 - Médio">3/5 - Médio</option>
                <option value="2/5 - Baixo">2/5 - Baixo</option>
              </select>
            </div>
          </div>

          <div className="form-row-2" style={{ background: "rgba(255, 255, 255, 0.02)", padding: "10px", borderRadius: "8px", border: "1px solid var(--line)" }}>
            <div className="form-group">
              <label>🔥 Tipo de Foco Atual</label>
              <select
                value={focusType}
                onChange={(e) => {
                  const val = e.target.value as "lesson" | "question";
                  setFocusType(val);
                  setFocusTarget(val === "lesson" ? (domainLessons[0]?.name ?? "") : (domainQuestions[0]?.title ?? ""));
                }}
              >
                <option value="lesson">▦ Foco em Lesson</option>
                <option value="question">□ Foco em Question Específica</option>
              </select>
            </div>

            <div className="form-group">
              <label>Escolher Item em Foco *</label>
              {focusType === "lesson" ? (
                <select value={focusTarget} onChange={(e) => setFocusTarget(e.target.value)}>
                  {domainLessons.map(l => (
                    <option key={l.id} value={l.name}>▦ {l.name} ({l.module})</option>
                  ))}
                  {domainLessons.length === 0 && <option value="Fundamentos Iniciais">Fundamentos Iniciais</option>}
                </select>
              ) : (
                <select value={focusTarget} onChange={(e) => setFocusTarget(e.target.value)}>
                  {domainQuestions.map(q => (
                    <option key={q.id} value={q.title}>□ [{q.lesson}] {q.title}</option>
                  ))}
                  {domainQuestions.length === 0 && <option value="Definir primeira pergunta">Definir primeira pergunta</option>}
                </select>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>🎯 Propósito</label>
            <textarea
              rows={2}
              value={proposito}
              onChange={(e) => setProposito(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>🏆 Objetivo</label>
            <textarea
              rows={2}
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Próximo Tópico Recomendado (Question do Ciclo) *</label>
            <select
              value={nextUpQuestionTitle}
              onChange={(e) => setNextUpQuestionTitle(e.target.value)}
            >
              <option value="">(Automático - Próxima do Ciclo)</option>
              {domainQuestions.map(q => (
                <option key={q.id} value={q.title}>
                  [{q.lesson} • {q.module}] {q.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>🔗 Projetos Relacionados (Selecione os existentes):</label>
            <div className="projects-select-grid">
              {allProjects.map((p) => {
                const isSelected = selectedProjects.includes(p.name);
                return (
                  <button
                    type="button"
                    key={p.id}
                    className={`project-pill-select-btn ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleProject(p.name)}
                  >
                    <span className="checkbox-icon">{isSelected ? <Check size={12} /> : null}</span>
                    <span className="p-icon">{p.icon}</span>
                    <span className="p-name">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {showDeleteConfirm && (
            <div className="delete-confirm-box" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--danger)", borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
              <p style={{ color: "var(--danger)", fontSize: "0.85rem", fontWeight: 600, margin: "0 0 8px 0" }}>Tem certeza que deseja excluir o Domínio "{domain.name}"?</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" className="btn-danger-confirm" style={{ background: "var(--danger)", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }} onClick={() => { if (onDelete) onDelete(domain.id); onClose(); }}>Sim, Excluir</button>
                <button type="button" className="btn-cancel" style={{ padding: "6px 12px", fontSize: "0.8rem" }} onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
              </div>
            </div>
          )}

          <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              {onDelete && !showDeleteConfirm && (
                <button type="button" className="btn-delete-row" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 size={14} /> Excluir Domínio
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn-submit">
                Salvar Alterações
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewDomainModal({
  onClose,
  onSave,
  allProjects,
}: {
  onClose: () => void;
  onSave: (d: Omit<Domain, "id" | "progress" | "lessonsCount" | "questionsCount" | "nextUp" | "gradient">) => void;
  allProjects: Project[];
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🌐");
  const [layer, setLayer] = useState<Layer>("strategico");
  const [priorityLevel, setPriorityLevel] = useState<PriorityLevel>("P1 - Alta");
  const [interestLevel, setInterestLevel] = useState<InterestLevel>("4/5 - Alto");
  const [meta, setMeta] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  const toggleProject = (projName: string) => {
    setSelectedProjects(prev =>
      prev.includes(projName) ? prev.filter(p => p !== projName) : [...prev, projName]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      icon: icon || "🌐",
      color: layer === "mission critical" ? "#ef4444" : layer === "strategico" ? "#f59e0b" : layer === "human knowledge" ? "#3b82f6" : "#10b981",
      createdAt: "Hoje",
      layer,
      priorityLevel,
      interestLevel,
      meta: meta.trim() || "Meta de aprendizado a definir.",
      proposito: meta.trim() || "Construir base sólida e inabalável.",
      objetivo: "Dominar com 85%+ de retenção no ciclo KOS.",
      focusLesson: "Fundamentos Iniciais",
      projects: selectedProjects,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: "620px" }}>
        <div className="modal-header">
          <div className="modal-title">
            <Plus size={18} />
            <h3>Criar Novo Domínio de Conhecimento</h3>
          </div>
          <button className="icon-button" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row-2">
            <EmojiPickerSelector value={icon} onChange={setIcon} />
            <div className="form-group">
              <label>Nome do Domínio *</label>
              <input type="text" placeholder="Ex: Inteligência Artificial..." value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label>Layer *</label>
              <select value={layer} onChange={(e) => setLayer(e.target.value as Layer)}>
                <option value="mission critical">Mission Critical</option>
                <option value="strategico">Estratégico</option>
                <option value="human knowledge">Human Knowledge</option>
                <option value="life skill">Life Skill</option>
              </select>
            </div>
            <div className="form-group">
              <label>Prioridade Level</label>
              <select value={priorityLevel} onChange={(e) => setPriorityLevel(e.target.value as PriorityLevel)}>
                <option value="P0 - Urgente">P0 • Urgente</option>
                <option value="P1 - Alta">P1 • Alta</option>
                <option value="P2 - Média">P2 • Média</option>
                <option value="P3 - Normal">P3 • Normal</option>
              </select>
            </div>
            <div className="form-group">
              <label>Interest Level</label>
              <select value={interestLevel} onChange={(e) => setInterestLevel(e.target.value as InterestLevel)}>
                <option value="5/5 - Máximo">5/5 - Máximo</option>
                <option value="4/5 - Alto">4/5 - Alto</option>
                <option value="3/5 - Médio">3/5 - Médio</option>
                <option value="2/5 - Baixo">2/5 - Baixo</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Meta de Aprendizagem (Texto / Propósito)</label>
            <textarea rows={3} placeholder="Descreva a meta e o que você pretende dominar..." value={meta} onChange={(e) => setMeta(e.target.value)} />
          </div>

          <div className="form-group">
            <label>🔗 Projetos Relacionados:</label>
            <div className="projects-select-grid">
              {allProjects.map((p) => {
                const isSelected = selectedProjects.includes(p.name);
                return (
                  <button
                    type="button"
                    key={p.id}
                    className={`project-pill-select-btn ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleProject(p.name)}
                  >
                    <span className="checkbox-icon">{isSelected ? <Check size={12} /> : null}</span>
                    <span className="p-icon">{p.icon}</span>
                    <span className="p-name">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-submit" disabled={!name.trim()}>Salvar Domínio</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   MODULES MODALS (DOMAIN, LESSON & CATEGORY SELECTABLE WITH EXISTING)
   ========================================================================== */

function NewModuleModal({
  onClose,
  onSave,
  domains,
  lessons,
  categories,
}: {
  onClose: () => void;
  onSave: (m: Omit<ModuleItem, "id" | "progress" | "questionsCount" | "status">) => void;
  domains: Domain[];
  lessons: Lesson[];
  categories: LessonCategory[];
}) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState(domains[0]?.name || "Tecnologia");

  const availableLessons = lessons.filter(l => l.domain.toLowerCase() === domain.toLowerCase());
  const [lesson, setLesson] = useState(availableLessons[0]?.name || lessons[0]?.name || "");

  const availableCategories = categories.filter(c => c.domain.toLowerCase() === domain.toLowerCase());
  const [category, setCategory] = useState(availableCategories[0]?.name || categories[0]?.name || "");

  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      domain,
      lesson: lesson || (availableLessons[0]?.name ?? "Geral"),
      category: category || (availableCategories[0]?.name ?? "Geral"),
      description: description.trim() || "Módulo estrutural de aprendizagem.",
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: "660px" }}>
        <div className="modal-header">
          <div className="modal-title">
            <Plus size={18} />
            <h3>Criar Novo Módulo</h3>
          </div>
          <button className="icon-button" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Nome do Módulo *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="Ex: Processador & Execução..." />
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label>Domínio *</label>
              <select
                value={domain}
                style={{ width: "100%", maxWidth: "100%" }}
                onChange={(e) => {
                  setDomain(e.target.value);
                  const les = lessons.filter(l => l.domain.toLowerCase() === e.target.value.toLowerCase());
                  setLesson(les[0]?.name || "");
                  const cats = categories.filter(c => c.domain.toLowerCase() === e.target.value.toLowerCase());
                  setCategory(cats[0]?.name || "");
                }}
              >
                {domains.map(d => <option key={d.id} value={d.name}>{d.icon} {d.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Lesson Existente *</label>
              <select value={lesson} style={{ width: "100%", maxWidth: "100%" }} onChange={(e) => setLesson(e.target.value)} required>
                {availableLessons.map(l => (
                  <option key={l.id} value={l.name}>▦ {l.name}</option>
                ))}
                {availableLessons.length === 0 && <option value="">Sem lições</option>}
              </select>
            </div>

            <div className="form-group">
              <label>Categoria *</label>
              <select value={category} style={{ width: "100%", maxWidth: "100%" }} onChange={(e) => setCategory(e.target.value)} required>
                {availableCategories.map(c => (
                  <option key={c.id} value={c.name}>🏷️ {c.name}</option>
                ))}
                {availableCategories.length === 0 && <option value="">Sem categorias</option>}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Descrição do Módulo</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Conceitos que compõem este módulo..." />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-submit" disabled={!name.trim()}>Salvar Módulo</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditModuleModal({
  moduleItem,
  domains,
  lessons,
  categories,
  onClose,
  onSave,
  onDelete,
}: {
  moduleItem: ModuleItem;
  domains: Domain[];
  lessons: Lesson[];
  categories: LessonCategory[];
  onClose: () => void;
  onSave: (m: ModuleItem) => void;
  onDelete?: (id: string) => void;
}) {
  const [name, setName] = useState(moduleItem.name);
  const [domain, setDomain] = useState(moduleItem.domain);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const availableLessons = lessons.filter(l => l.domain.toLowerCase() === domain.toLowerCase());
  const [lesson, setLesson] = useState(moduleItem.lesson || availableLessons[0]?.name || "");

  const availableCategories = categories.filter(c => c.domain.toLowerCase() === domain.toLowerCase());
  const [category, setCategory] = useState(moduleItem.category || availableCategories[0]?.name || "");

  const [description, setDescription] = useState(moduleItem.description);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      ...moduleItem,
      name: name.trim(),
      domain,
      lesson: lesson || moduleItem.lesson,
      category: category || moduleItem.category,
      description: description.trim(),
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: "660px" }}>
        <div className="modal-header">
          <div className="modal-title">
            <Edit3 size={18} />
            <h3>Editar Módulo: {moduleItem.name}</h3>
          </div>
          <button className="icon-button" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Nome do Módulo *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label>Domínio *</label>
              <select
                value={domain}
                style={{ width: "100%", maxWidth: "100%" }}
                onChange={(e) => {
                  setDomain(e.target.value);
                  const les = lessons.filter(l => l.domain.toLowerCase() === e.target.value.toLowerCase());
                  setLesson(les[0]?.name || "");
                  const cats = categories.filter(c => c.domain.toLowerCase() === e.target.value.toLowerCase());
                  setCategory(cats[0]?.name || "");
                }}
              >
                {domains.map(d => <option key={d.id} value={d.name}>{d.icon} {d.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Lesson Existente *</label>
              <select value={lesson} style={{ width: "100%", maxWidth: "100%" }} onChange={(e) => setLesson(e.target.value)} required>
                {availableLessons.map(l => (
                  <option key={l.id} value={l.name}>▦ {l.name}</option>
                ))}
                {availableLessons.length === 0 && <option value={moduleItem.lesson}>▦ {moduleItem.lesson}</option>}
              </select>
            </div>

            <div className="form-group">
              <label>Categoria *</label>
              <select value={category} style={{ width: "100%", maxWidth: "100%" }} onChange={(e) => setCategory(e.target.value)} required>
                {availableCategories.map(c => (
                  <option key={c.id} value={c.name}>🏷️ {c.name}</option>
                ))}
                {availableCategories.length === 0 && <option value={moduleItem.category}>🏷️ {moduleItem.category}</option>}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {showDeleteConfirm && (
            <div className="delete-confirm-box" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--danger)", borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
              <p style={{ color: "var(--danger)", fontSize: "0.85rem", fontWeight: 600, margin: "0 0 8px 0" }}>Tem certeza que deseja excluir o Módulo "{moduleItem.name}"?</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" className="btn-danger-confirm" style={{ background: "var(--danger)", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }} onClick={() => { if (onDelete) onDelete(moduleItem.id); onClose(); }}>Sim, Excluir</button>
                <button type="button" className="btn-cancel" style={{ padding: "6px 12px", fontSize: "0.8rem" }} onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
              </div>
            </div>
          )}

          <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              {onDelete && !showDeleteConfirm && (
                <button type="button" className="btn-delete-row" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 size={14} /> Excluir Módulo
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn-submit">Salvar Alterações</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   PROJECTS MODALS (SELECTABLE CATEGORY & CALENDAR DATE PICKER)
   ========================================================================== */

function NewProjectModal({
  onClose,
  onSave,
  domains,
  categories,
}: {
  onClose: () => void;
  onSave: (p: Omit<Project, "id">) => void;
  domains: Domain[];
  categories: LessonCategory[];
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("⚡");
  const [domain, setDomain] = useState(domains[0]?.name || "Tecnologia");

  const availableCategories = categories.filter(c => c.domain.toLowerCase() === domain.toLowerCase());
  const [category, setCategory] = useState(availableCategories[0]?.name || categories[0]?.name || "Geral");

  const [status, setStatus] = useState<Project["status"]>("Em Andamento");
  const [targetDate, setTargetDate] = useState("2026-10-30");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      icon: icon || "📁",
      domain,
      category: category || (availableCategories[0]?.name ?? "Geral"),
      status,
      targetDate,
      description: description.trim() || "Descrição do projeto a definir.",
      progress: 0,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title">
            <Plus size={18} />
            <h3>Criar Novo Projeto</h3>
          </div>
          <button className="icon-button" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row-2">
            <EmojiPickerSelector value={icon} onChange={setIcon} />
            <div className="form-group">
              <label>Nome do Projeto *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="Ex: KOS App..." />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Domínio *</label>
              <select
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value);
                  const cats = categories.filter(c => c.domain.toLowerCase() === e.target.value.toLowerCase());
                  setCategory(cats[0]?.name || "");
                }}
              >
                {domains.map(d => <option key={d.id} value={d.name}>{d.icon} {d.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Categoria Existente *</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {availableCategories.map(c => (
                  <option key={c.id} value={c.name}>🏷️ {c.name}</option>
                ))}
                {availableCategories.length === 0 && <option value="">Sem categoria definida</option>}
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Planejado">Planejado</option>
                <option value="Concluído">Concluído</option>
                <option value="Pausado">Pausado</option>
              </select>
            </div>

            <div className="form-group">
              <label>📅 Data Alvo (Deadline)</label>
              <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label>Descrição do Projeto</label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Objetivos e escopo do projeto..." />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-submit" disabled={!name.trim()}>Criar Projeto</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditProjectModal({
  project,
  domains,
  categories,
  onClose,
  onSave,
  onDelete,
}: {
  project: Project;
  domains: Domain[];
  categories: LessonCategory[];
  onClose: () => void;
  onSave: (p: Project) => void;
  onDelete?: (id: string) => void;
}) {
  const [name, setName] = useState(project.name);
  const [icon, setIcon] = useState(project.icon);
  const [domain, setDomain] = useState(project.domain);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const availableCategories = categories.filter(c => c.domain.toLowerCase() === domain.toLowerCase());
  const [category, setCategory] = useState(project.category || availableCategories[0]?.name || "");

  const [status, setStatus] = useState<Project["status"]>(project.status);
  const [targetDate, setTargetDate] = useState(project.targetDate);
  const [description, setDescription] = useState(project.description);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      ...project,
      name: name.trim(),
      icon: icon || "📁",
      domain,
      category: category || project.category,
      status,
      targetDate,
      description: description.trim(),
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title">
            <Edit3 size={18} />
            <h3>Editar Projeto: {project.name}</h3>
          </div>
          <button className="icon-button" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row-2">
            <EmojiPickerSelector value={icon} onChange={setIcon} />
            <div className="form-group">
              <label>Nome do Projeto *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Domínio *</label>
              <select
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value);
                  const cats = categories.filter(c => c.domain.toLowerCase() === e.target.value.toLowerCase());
                  setCategory(cats[0]?.name || "");
                }}
              >
                {domains.map(d => <option key={d.id} value={d.name}>{d.icon} {d.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Categoria Existente *</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {availableCategories.map(c => (
                  <option key={c.id} value={c.name}>🏷️ {c.name}</option>
                ))}
                {availableCategories.length === 0 && <option value={project.category}>🏷️ {project.category}</option>}
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Planejado">Planejado</option>
                <option value="Concluído">Concluído</option>
                <option value="Pausado">Pausado</option>
              </select>
            </div>

            <div className="form-group">
              <label>📅 Data Alvo (Deadline)</label>
              <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label>Descrição do Projeto</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {showDeleteConfirm && (
            <div className="delete-confirm-box" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--danger)", borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
              <p style={{ color: "var(--danger)", fontSize: "0.85rem", fontWeight: 600, margin: "0 0 8px 0" }}>Tem certeza que deseja excluir o Projeto "{project.name}"?</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" className="btn-danger-confirm" style={{ background: "var(--danger)", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }} onClick={() => { if (onDelete) onDelete(project.id); onClose(); }}>Sim, Excluir</button>
                <button type="button" className="btn-cancel" style={{ padding: "6px 12px", fontSize: "0.8rem" }} onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
              </div>
            </div>
          )}

          <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              {onDelete && !showDeleteConfirm && (
                <button type="button" className="btn-delete-row" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 size={14} /> Excluir Projeto
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn-submit">Salvar Alterações</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewCategoryModal({
  onClose,
  onSave,
  domains,
}: {
  onClose: () => void;
  onSave: (c: Omit<LessonCategory, "id">) => void;
  domains: Domain[];
}) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState(domains[0]?.name || "Tecnologia");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      domain,
      lessonsCount: 0,
      description: description.trim() || "Estrutura temática de lições.",
      color,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title">
            <Plus size={18} />
            <h3>Criar Nova Categoria de Lesson</h3>
          </div>
          <button className="icon-button" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Nome da Categoria *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="Ex: Fundamentos de Computação..." />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Domínio de Conhecimento</label>
              <select value={domain} onChange={(e) => setDomain(e.target.value)}>
                {domains.map(d => <option key={d.id} value={d.name}>{d.icon} {d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Cor de Destaque</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ height: "38px", padding: "2px" }} />
            </div>
          </div>

          <div className="form-group">
            <label>Escopo & Descrição</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva os tópicos abordados nesta categoria..." />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-submit" disabled={!name.trim()}>Salvar Categoria</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditCategoryModal({
  category,
  domains,
  onClose,
  onSave,
  onDelete,
}: {
  category: LessonCategory;
  domains: Domain[];
  onClose: () => void;
  onSave: (c: LessonCategory) => void;
  onDelete?: (id: string) => void;
}) {
  const [name, setName] = useState(category.name);
  const [domain, setDomain] = useState(category.domain);
  const [description, setDescription] = useState(category.description);
  const [color, setColor] = useState(category.color);
  const [lessonsCount, setLessonsCount] = useState(category.lessonsCount);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      ...category,
      name: name.trim(),
      domain,
      description: description.trim(),
      color,
      lessonsCount,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title">
            <Edit3 size={18} />
            <h3>Editar Categoria: {category.name}</h3>
          </div>
          <button className="icon-button" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Nome da Categoria *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Domínio</label>
              <select value={domain} onChange={(e) => setDomain(e.target.value)}>
                {domains.map(d => <option key={d.id} value={d.name}>{d.icon} {d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Cor</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ height: "38px", padding: "2px" }} />
            </div>
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {showDeleteConfirm && (
            <div className="delete-confirm-box" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--danger)", borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
              <p style={{ color: "var(--danger)", fontSize: "0.85rem", fontWeight: 600, margin: "0 0 8px 0" }}>Tem certeza que deseja excluir a Categoria "{category.name}"?</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" className="btn-danger-confirm" style={{ background: "var(--danger)", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }} onClick={() => { if (onDelete) onDelete(category.id); onClose(); }}>Sim, Excluir</button>
                <button type="button" className="btn-cancel" style={{ padding: "6px 12px", fontSize: "0.8rem" }} onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
              </div>
            </div>
          )}

          <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              {onDelete && !showDeleteConfirm && (
                <button type="button" className="btn-delete-row" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 size={14} /> Excluir Categoria
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn-submit">Salvar Alterações</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   LESSON MODALS (KEY CONCEPTS WITH INTERACTIVE PILLS & AUTO TIME INVESTED)
   ========================================================================== */

function NewLessonModal({
  onClose,
  onSave,
  domains,
  categories,
  modules = [],
  plans = [],
  cycles = [],
  cronoSchedule = [],
}: {
  onClose: () => void;
  onSave: (l: Omit<Lesson, "id" | "progress" | "questionsCount" | "items">, days?: DayOfWeek[]) => void;
  domains: Domain[];
  categories: LessonCategory[];
  modules?: ModuleItem[];
  plans?: StudyPlan[];
  cycles?: StudyCycle[];
  cronoSchedule?: CronoDayAllocation[];
}) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState(domains[0]?.name || "Tecnologia");

  const availableCategories = categories.filter(c => c.domain.toLowerCase() === domain.toLowerCase());
  const [category, setCategory] = useState(availableCategories[0]?.name || categories[0]?.name || "Geral");

  const availableModules = modules.filter(m => m.domain.toLowerCase() === domain.toLowerCase());
  const [module, setModule] = useState(availableModules[0]?.name || "");
  const [customModule, setCustomModule] = useState("");

  const [difficulty, setDifficulty] = useState<Lesson["difficulty"]>("Intermediário");
  const [status, setStatus] = useState<Lesson["status"]>("Em Estudo");

  // Multi-Plan & Multi-Cycle & Scheduled Days State
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [newPlanInput, setNewPlanInput] = useState("");

  const [selectedCycles, setSelectedCycles] = useState<string[]>([]);
  const [newCycleInput, setNewCycleInput] = useState("");

  const [scheduledDays, setScheduledDays] = useState<DayOfWeek[]>([]);

  // Interactive Key Concepts Pill Adder
  const [keyConcepts, setKeyConcepts] = useState<string[]>([]);
  const [newConceptInput, setNewConceptInput] = useState("");

  // Interactive Objectives (multi-chip)
  const [objectives, setObjectives] = useState<string[]>([]);
  const [newObjectiveInput, setNewObjectiveInput] = useState("");

  // Interactive Difficulties (multi-chip)
  const [difficultyChips, setDifficultyChips] = useState<string[]>([]);
  const [newDifficultyInput, setNewDifficultyInput] = useState("");

  const [projectsInput, setProjectsInput] = useState("");

  const handleAddChip = (
    input: string,
    setInput: React.Dispatch<React.SetStateAction<string>>,
    chips: string[],
    setChips: React.Dispatch<React.SetStateAction<string[]>>,
    e?: React.KeyboardEvent | React.MouseEvent
  ) => {
    if (e && "key" in e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      e.stopPropagation();
    }
    if (!input.trim()) return;
    if (!chips.includes(input.trim())) setChips(prev => [...prev, input.trim()]);
    setInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const finalModule = module === "__custom__" ? customModule.trim() : (module.trim() || "Geral");
    onSave({
      name: name.trim(),
      domain,
      category,
      module: finalModule || "Geral",
      plan: selectedPlans[0] || undefined,
      cycle: selectedCycles[0] || undefined,
      plans: selectedPlans,
      cycles: selectedCycles,
      scheduledDays,
      difficulty,
      status,
      createdAt: "Hoje",
      lastReview: "Hoje",
      nextReview: "Em 2 dias",
      objective: objectives.join("; ") || "Dominar os conceitos centrais desta lição.",
      keyConcepts,
      difficulties: difficultyChips,
      projects: projectsInput.split(",").map(p => p.trim()).filter(Boolean),
    }, scheduledDays);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: "660px", maxHeight: "90vh", overflowY: "auto" }}>
        <div className="modal-header">
          <div className="modal-title">
            <Plus size={18} />
            <h3>Criar Nova Lesson</h3>
          </div>
          <button className="icon-button" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Nome da Lesson *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="Ex: Arquitetura de Computadores..." />
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label>Domínio *</label>
              <select
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value);
                  const cats = categories.filter(c => c.domain.toLowerCase() === e.target.value.toLowerCase());
                  setCategory(cats[0]?.name || "");
                  const mods = modules.filter(m => m.domain.toLowerCase() === e.target.value.toLowerCase());
                  setModule(mods[0]?.name || "");
                }}
              >
                {domains.map(d => <option key={d.id} value={d.name}>{d.icon} {d.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Categoria *</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {availableCategories.map(c => (
                  <option key={c.id} value={c.name}>🏷️ {c.name}</option>
                ))}
                {availableCategories.length === 0 && <option value="">Geral</option>}
              </select>
            </div>

            <div className="form-group">
              <label>Módulo</label>
              <select value={module} onChange={(e) => setModule(e.target.value)}>
                <option value="">— Nenhum —</option>
                {availableModules.map(m => (
                  <option key={m.id} value={m.name}>📦 {m.name}</option>
                ))}
                <option value="__custom__">✏️ Digitar novo...</option>
              </select>
              {module === "__custom__" && (
                <input className="mt-1" type="text" value={customModule} onChange={(e) => setCustomModule(e.target.value)} placeholder="Nome do novo módulo" />
              )}
            </div>
          </div>

          {/* 🎯 PLANOS DE ESTUDO (MULTI-SELECT) */}
          <div className="form-group">
            <label>🎯 Planos de Estudo (Selecione existentes ou adicione novos)</label>
            <div className="interactive-tags-box">
              <div className="tags-chips-wrap">
                {selectedPlans.map((p, i) => (
                  <span key={i} className="interactive-chip concept-chip" style={{ background: "rgba(59, 130, 246, 0.18)", color: "#93c5fd", border: "1px solid rgba(59, 130, 246, 0.4)" }}>
                    🎯 {p}
                    <button type="button" onClick={() => setSelectedPlans(prev => prev.filter(item => item !== p))}><X size={11} /></button>
                  </span>
                ))}
                {selectedPlans.length === 0 && <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Nenhum plano selecionado</span>}
              </div>
              {plans.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "8px 0" }}>
                  {plans.map(p => {
                    const isSelected = selectedPlans.includes(p.name);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => setSelectedPlans(prev => isSelected ? prev.filter(item => item !== p.name) : [...prev, p.name])}
                        className={`project-pill-select-btn ${isSelected ? "selected" : ""}`}
                        style={{ padding: "4px 10px", fontSize: "12px", borderRadius: "16px" }}
                      >
                        <span className="checkbox-icon">{isSelected ? <Check size={11} /> : <Plus size={11} />}</span>
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="tag-input-row">
                <input
                  type="text"
                  value={newPlanInput}
                  onChange={(e) => setNewPlanInput(e.target.value)}
                  onKeyDown={(e) => handleAddChip(newPlanInput, setNewPlanInput, selectedPlans, setSelectedPlans, e)}
                  placeholder="Digitar novo plano e pressionar Enter..."
                />
                <button type="button" className="btn-tag-add" onClick={() => handleAddChip(newPlanInput, setNewPlanInput, selectedPlans, setSelectedPlans)}>
                  <Plus size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* 🔄 CICLOS DE ESTUDO (MULTI-SELECT) */}
          <div className="form-group">
            <label>🔄 Ciclos de Estudo (Selecione existentes ou adicione novos)</label>
            <div className="interactive-tags-box">
              <div className="tags-chips-wrap">
                {selectedCycles.map((c, i) => (
                  <span key={i} className="interactive-chip concept-chip" style={{ background: "rgba(168, 85, 247, 0.18)", color: "#d8b4fe", border: "1px solid rgba(168, 85, 247, 0.4)" }}>
                    🔄 {c}
                    <button type="button" onClick={() => setSelectedCycles(prev => prev.filter(item => item !== c))}><X size={11} /></button>
                  </span>
                ))}
                {selectedCycles.length === 0 && <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Nenhum ciclo selecionado</span>}
              </div>
              {cycles.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "8px 0" }}>
                  {cycles.map(c => {
                    const isSelected = selectedCycles.includes(c.name);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setSelectedCycles(prev => isSelected ? prev.filter(item => item !== c.name) : [...prev, c.name])}
                        className={`project-pill-select-btn ${isSelected ? "selected" : ""}`}
                        style={{ padding: "4px 10px", fontSize: "12px", borderRadius: "16px" }}
                      >
                        <span className="checkbox-icon">{isSelected ? <Check size={11} /> : <Plus size={11} />}</span>
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="tag-input-row">
                <input
                  type="text"
                  value={newCycleInput}
                  onChange={(e) => setNewCycleInput(e.target.value)}
                  onKeyDown={(e) => handleAddChip(newCycleInput, setNewCycleInput, selectedCycles, setSelectedCycles, e)}
                  placeholder="Digitar novo ciclo e pressionar Enter..."
                />
                <button type="button" className="btn-tag-add" onClick={() => handleAddChip(newCycleInput, setNewCycleInput, selectedCycles, setSelectedCycles)}>
                  <Plus size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* 📅 DIAS NO CRONOGRAMA SEMANAL */}
          <div className="form-group">
            <label>📅 Dias no Cronograma Semanal (Clique para agendar)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
              {(["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"] as DayOfWeek[]).map((day) => {
                const isSelected = scheduledDays.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => setScheduledDays(prev => isSelected ? prev.filter(d => d !== day) : [...prev, day])}
                    className={`project-pill-select-btn ${isSelected ? "selected" : ""}`}
                    style={{
                      padding: "6px 14px",
                      fontSize: "12.5px",
                      borderRadius: "8px",
                      background: isSelected ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.04)",
                      borderColor: isSelected ? "var(--accent)" : "rgba(255,255,255,0.1)",
                      color: isSelected ? "var(--accent)" : "var(--text-muted)"
                    }}
                  >
                    <span className="checkbox-icon">{isSelected ? <Check size={12} /> : null}</span>
                    📅 {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Dificuldade</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
                <option value="Iniciante">Iniciante</option>
                <option value="Intermediário">Intermediário</option>
                <option value="Avançado">Avançado</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="Em Estudo">Em Estudo</option>
                <option value="Revisando">Revisando</option>
                <option value="Dominado">Dominado</option>
              </select>
            </div>
          </div>

          {/* 🎯 OBJETIVOS INTERATIVOS */}
          <div className="form-group">
            <label>🎯 Objetivos (adicione com Enter ou botão)</label>
            <div className="interactive-tags-box">
              <div className="tags-chips-wrap">
                {objectives.map((o, i) => (
                  <span key={i} className="interactive-chip objective-chip">
                    🎯 {o}
                    <button type="button" onClick={() => setObjectives(prev => prev.filter((_, idx) => idx !== i))}><X size={11} /></button>
                  </span>
                ))}
              </div>
              <div className="tag-input-row">
                <input type="text" value={newObjectiveInput} onChange={(e) => setNewObjectiveInput(e.target.value)}
                  onKeyDown={(e) => handleAddChip(newObjectiveInput, setNewObjectiveInput, objectives, setObjectives, e)}
                  placeholder="Ex: Resolver questões sobre redes..."
                />
                <button type="button" className="btn-tag-add" onClick={() => handleAddChip(newObjectiveInput, setNewObjectiveInput, objectives, setObjectives)}><Plus size={13} /></button>
              </div>
            </div>
          </div>

          {/* 🧠 CONCEITOS-CHAVE INTERATIVOS */}
          <div className="form-group">
            <label>🧠 Conceitos-Chave</label>
            <div className="interactive-tags-box">
              <div className="tags-chips-wrap">
                {keyConcepts.map((c, i) => (
                  <span key={i} className="interactive-chip concept-chip">
                    ● {c}
                    <button type="button" onClick={() => setKeyConcepts(prev => prev.filter(item => item !== c))}><X size={11} /></button>
                  </span>
                ))}
              </div>
              <div className="tag-input-row">
                <input type="text" value={newConceptInput} onChange={(e) => setNewConceptInput(e.target.value)}
                  onKeyDown={(e) => handleAddChip(newConceptInput, setNewConceptInput, keyConcepts, setKeyConcepts, e)}
                  placeholder="Digite um conceito e pressione Enter..."
                />
                <button type="button" className="btn-tag-add" onClick={() => handleAddChip(newConceptInput, setNewConceptInput, keyConcepts, setKeyConcepts)}><Plus size={13} /></button>
              </div>
            </div>
          </div>

          {/* ⚠️ DIFICULDADES INTERATIVAS */}
          <div className="form-group">
            <label>⚠️ Pontos de Dificuldade</label>
            <div className="interactive-tags-box">
              <div className="tags-chips-wrap">
                {difficultyChips.map((d, i) => (
                  <span key={i} className="interactive-chip difficulty-chip">
                    ⚠️ {d}
                    <button type="button" onClick={() => setDifficultyChips(prev => prev.filter((_, idx) => idx !== i))}><X size={11} /></button>
                  </span>
                ))}
              </div>
              <div className="tag-input-row">
                <input type="text" value={newDifficultyInput} onChange={(e) => setNewDifficultyInput(e.target.value)}
                  onKeyDown={(e) => handleAddChip(newDifficultyInput, setNewDifficultyInput, difficultyChips, setDifficultyChips, e)}
                  placeholder="Ex: Confunde com protocolo X..."
                />
                <button type="button" className="btn-tag-add" onClick={() => handleAddChip(newDifficultyInput, setNewDifficultyInput, difficultyChips, setDifficultyChips)}><Plus size={13} /></button>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-submit" disabled={!name.trim()}>Salvar Lesson</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditLessonModal({
  lesson,
  domains,
  categories,
  modules = [],
  plans = [],
  cycles = [],
  cronoSchedule = [],
  onClose,
  onSave,
  onDelete,
}: {
  lesson: Lesson;
  domains: Domain[];
  categories: LessonCategory[];
  modules?: ModuleItem[];
  plans?: StudyPlan[];
  cycles?: StudyCycle[];
  cronoSchedule?: CronoDayAllocation[];
  onClose: () => void;
  onSave: (l: Lesson, days?: DayOfWeek[]) => void;
  onDelete?: (id: string) => void;
}) {
  const [name, setName] = useState(lesson?.name || "");
  const [domain, setDomain] = useState(lesson?.domain || domains[0]?.name || "Tecnologia");

  const availableCategories = categories.filter(c => c.domain.toLowerCase() === (lesson?.domain || domain).toLowerCase());
  const [category, setCategory] = useState(lesson?.category || availableCategories[0]?.name || "");

  const availableModules = modules.filter(m => m.domain.toLowerCase() === (lesson?.domain || domain).toLowerCase());
  const isExistingModule = availableModules.some(m => m.name === lesson?.module);
  const [module, setModule] = useState(isExistingModule ? (lesson?.module || "") : (lesson?.module ? "__custom__" : ""));
  const [customModule, setCustomModule] = useState(isExistingModule ? "" : (lesson?.module || ""));

  // Initial Multi-Plans
  const initialPlans = Array.isArray(lesson?.plans) && lesson.plans.length > 0 ? lesson.plans : (lesson?.plan ? [lesson.plan] : []);
  const [selectedPlans, setSelectedPlans] = useState<string[]>(initialPlans);
  const [newPlanInput, setNewPlanInput] = useState("");

  // Initial Multi-Cycles
  const initialCycles = Array.isArray(lesson?.cycles) && lesson.cycles.length > 0 ? lesson.cycles : (lesson?.cycle ? [lesson.cycle] : []);
  const [selectedCycles, setSelectedCycles] = useState<string[]>(initialCycles);
  const [newCycleInput, setNewCycleInput] = useState("");

  // Initial Scheduled Days (from lesson.scheduledDays or cronoSchedule)
  const cronoDays = (cronoSchedule || []).filter(d => lesson?.id && d.lessonIds.includes(lesson.id)).map(d => d.day);
  const initialDays = Array.from(new Set([...(Array.isArray(lesson?.scheduledDays) ? lesson.scheduledDays : []), ...cronoDays]));
  const [scheduledDays, setScheduledDays] = useState<DayOfWeek[]>(initialDays);

  const [difficulty, setDifficulty] = useState<Lesson["difficulty"]>(lesson?.difficulty || "Intermediário");
  const [status, setStatus] = useState<Lesson["status"]>(lesson?.status || "Em Estudo");

  const [keyConcepts, setKeyConcepts] = useState<string[]>(Array.isArray(lesson?.keyConcepts) ? lesson.keyConcepts : []);
  const [newConceptInput, setNewConceptInput] = useState("");

  const rawObjectives = typeof lesson?.objective === "string" ? lesson.objective.split(";").map(s => s.trim()).filter(Boolean) : [];
  const [objectives, setObjectives] = useState<string[]>(rawObjectives);
  const [newObjectiveInput, setNewObjectiveInput] = useState("");

  const [difficultyChips, setDifficultyChips] = useState<string[]>(Array.isArray(lesson?.difficulties) ? lesson.difficulties : []);
  const [newDifficultyInput, setNewDifficultyInput] = useState("");

  const [lastReview, setLastReview] = useState(lesson?.lastReview || "Hoje");
  const [nextReview, setNextReview] = useState(lesson?.nextReview || "Hoje");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleAddChip = (
    input: string,
    setInput: React.Dispatch<React.SetStateAction<string>>,
    chips: string[],
    setChips: React.Dispatch<React.SetStateAction<string[]>>,
    e?: React.KeyboardEvent | React.MouseEvent
  ) => {
    if (e && "key" in e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      e.stopPropagation();
    }
    if (!input.trim()) return;
    if (!chips.includes(input.trim())) setChips(prev => [...prev, input.trim()]);
    setInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const finalModule = module === "__custom__" ? customModule.trim() : module.trim();
    onSave({
      ...lesson,
      name: name.trim(),
      domain,
      category,
      module: finalModule || "Geral",
      plan: selectedPlans[0] || undefined,
      cycle: selectedCycles[0] || undefined,
      plans: selectedPlans,
      cycles: selectedCycles,
      scheduledDays,
      difficulty,
      status,
      objective: objectives.join("; "),
      keyConcepts,
      difficulties: difficultyChips,
      lastReview,
      nextReview,
    }, scheduledDays);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: "660px", maxHeight: "90vh", overflowY: "auto" }}>
        <div className="modal-header">
          <div className="modal-title">
            <Edit3 size={18} />
            <h3>Editar Lesson: {lesson.name}</h3>
          </div>
          <button className="icon-button" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Nome da Lesson *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label>Domínio *</label>
              <select
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value);
                  const cats = categories.filter(c => c.domain.toLowerCase() === e.target.value.toLowerCase());
                  setCategory(cats[0]?.name || "");
                  const mods = modules.filter(m => m.domain.toLowerCase() === e.target.value.toLowerCase());
                  setModule(mods[0]?.name || "");
                }}
              >
                {domains.map(d => <option key={d.id} value={d.name}>{d.icon} {d.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Categoria *</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {availableCategories.map(c => (
                  <option key={c.id} value={c.name}>🏷️ {c.name}</option>
                ))}
                {availableCategories.length === 0 && <option value={lesson.category}>🏷️ {lesson.category}</option>}
              </select>
            </div>

            <div className="form-group">
              <label>Módulo</label>
              <select value={module} onChange={(e) => setModule(e.target.value)}>
                <option value="">— Nenhum —</option>
                {availableModules.map(m => (
                  <option key={m.id} value={m.name}>📦 {m.name}</option>
                ))}
                <option value="__custom__">✏️ Digitar novo...</option>
              </select>
              {module === "__custom__" && (
                <input className="mt-1" type="text" value={customModule} onChange={(e) => setCustomModule(e.target.value)} placeholder="Nome do módulo" />
              )}
            </div>
          </div>

          {/* 🎯 PLANOS DE ESTUDO (MULTI-SELECT) */}
          <div className="form-group">
            <label>🎯 Planos de Estudo (Selecione existentes ou adicione novos)</label>
            <div className="interactive-tags-box">
              <div className="tags-chips-wrap">
                {selectedPlans.map((p, i) => (
                  <span key={i} className="interactive-chip concept-chip" style={{ background: "rgba(59, 130, 246, 0.18)", color: "#93c5fd", border: "1px solid rgba(59, 130, 246, 0.4)" }}>
                    🎯 {p}
                    <button type="button" onClick={() => setSelectedPlans(prev => prev.filter(item => item !== p))}><X size={11} /></button>
                  </span>
                ))}
                {selectedPlans.length === 0 && <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Nenhum plano selecionado</span>}
              </div>
              {plans.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "8px 0" }}>
                  {plans.map(p => {
                    const isSelected = selectedPlans.includes(p.name);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => setSelectedPlans(prev => isSelected ? prev.filter(item => item !== p.name) : [...prev, p.name])}
                        className={`project-pill-select-btn ${isSelected ? "selected" : ""}`}
                        style={{ padding: "4px 10px", fontSize: "12px", borderRadius: "16px" }}
                      >
                        <span className="checkbox-icon">{isSelected ? <Check size={11} /> : <Plus size={11} />}</span>
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="tag-input-row">
                <input
                  type="text"
                  value={newPlanInput}
                  onChange={(e) => setNewPlanInput(e.target.value)}
                  onKeyDown={(e) => handleAddChip(newPlanInput, setNewPlanInput, selectedPlans, setSelectedPlans, e)}
                  placeholder="Digitar novo plano e pressionar Enter..."
                />
                <button type="button" className="btn-tag-add" onClick={() => handleAddChip(newPlanInput, setNewPlanInput, selectedPlans, setSelectedPlans)}>
                  <Plus size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* 🔄 CICLOS DE ESTUDO (MULTI-SELECT) */}
          <div className="form-group">
            <label>🔄 Ciclos de Estudo (Selecione existentes ou adicione novos)</label>
            <div className="interactive-tags-box">
              <div className="tags-chips-wrap">
                {selectedCycles.map((c, i) => (
                  <span key={i} className="interactive-chip concept-chip" style={{ background: "rgba(168, 85, 247, 0.18)", color: "#d8b4fe", border: "1px solid rgba(168, 85, 247, 0.4)" }}>
                    🔄 {c}
                    <button type="button" onClick={() => setSelectedCycles(prev => prev.filter(item => item !== c))}><X size={11} /></button>
                  </span>
                ))}
                {selectedCycles.length === 0 && <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Nenhum ciclo selecionado</span>}
              </div>
              {cycles.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "8px 0" }}>
                  {cycles.map(c => {
                    const isSelected = selectedCycles.includes(c.name);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setSelectedCycles(prev => isSelected ? prev.filter(item => item !== c.name) : [...prev, c.name])}
                        className={`project-pill-select-btn ${isSelected ? "selected" : ""}`}
                        style={{ padding: "4px 10px", fontSize: "12px", borderRadius: "16px" }}
                      >
                        <span className="checkbox-icon">{isSelected ? <Check size={11} /> : <Plus size={11} />}</span>
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="tag-input-row">
                <input
                  type="text"
                  value={newCycleInput}
                  onChange={(e) => setNewCycleInput(e.target.value)}
                  onKeyDown={(e) => handleAddChip(newCycleInput, setNewCycleInput, selectedCycles, setSelectedCycles, e)}
                  placeholder="Digitar novo ciclo e pressionar Enter..."
                />
                <button type="button" className="btn-tag-add" onClick={() => handleAddChip(newCycleInput, setNewCycleInput, selectedCycles, setSelectedCycles)}>
                  <Plus size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* 📅 DIAS NO CRONOGRAMA SEMANAL */}
          <div className="form-group">
            <label>📅 Dias no Cronograma Semanal (Clique para agendar/desagendar)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
              {(["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"] as DayOfWeek[]).map((day) => {
                const isSelected = scheduledDays.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => setScheduledDays(prev => isSelected ? prev.filter(d => d !== day) : [...prev, day])}
                    className={`project-pill-select-btn ${isSelected ? "selected" : ""}`}
                    style={{
                      padding: "6px 14px",
                      fontSize: "12.5px",
                      borderRadius: "8px",
                      background: isSelected ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.04)",
                      borderColor: isSelected ? "var(--accent)" : "rgba(255,255,255,0.1)",
                      color: isSelected ? "var(--accent)" : "var(--text-muted)"
                    }}
                  >
                    <span className="checkbox-icon">{isSelected ? <Check size={12} /> : null}</span>
                    📅 {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Dificuldade</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
                <option value="Iniciante">Iniciante</option>
                <option value="Intermediário">Intermediário</option>
                <option value="Avançado">Avançado</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="Em Estudo">Em Estudo</option>
                <option value="Revisando">Revisando</option>
                <option value="Dominado">Dominado</option>
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Última Revisão</label>
              <input type="text" value={lastReview} onChange={(e) => setLastReview(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Próxima Revisão</label>
              <input type="text" value={nextReview} onChange={(e) => setNextReview(e.target.value)} />
            </div>
          </div>

          {/* 🎯 OBJETIVOS INTERATIVOS */}
          <div className="form-group">
            <label>🎯 Objetivos (adicione com Enter ou botão)</label>
            <div className="interactive-tags-box">
              <div className="tags-chips-wrap">
                {objectives.map((o, i) => (
                  <span key={i} className="interactive-chip objective-chip">
                    🎯 {o}
                    <button type="button" onClick={() => setObjectives(prev => prev.filter((_, idx) => idx !== i))}><X size={11} /></button>
                  </span>
                ))}
              </div>
              <div className="tag-input-row">
                <input
                  type="text"
                  value={newObjectiveInput}
                  onChange={(e) => setNewObjectiveInput(e.target.value)}
                  onKeyDown={(e) => handleAddChip(newObjectiveInput, setNewObjectiveInput, objectives, setObjectives, e)}
                  placeholder="Ex: Dominar algoritmo X..."
                />
                <button type="button" className="btn-tag-add" onClick={() => handleAddChip(newObjectiveInput, setNewObjectiveInput, objectives, setObjectives)}>
                  <Plus size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* 🧠 CONCEITOS-CHAVE INTERATIVOS */}
          <div className="form-group">
            <label>🧠 Conceitos-Chave</label>
            <div className="interactive-tags-box">
              <div className="tags-chips-wrap">
                {keyConcepts.map((c, i) => (
                  <span key={i} className="interactive-chip concept-chip">
                    ● {c}
                    <button type="button" onClick={() => setKeyConcepts(prev => prev.filter(item => item !== c))}><X size={11} /></button>
                  </span>
                ))}
              </div>
              <div className="tag-input-row">
                <input
                  type="text"
                  value={newConceptInput}
                  onChange={(e) => setNewConceptInput(e.target.value)}
                  onKeyDown={(e) => handleAddChip(newConceptInput, setNewConceptInput, keyConcepts, setKeyConcepts, e)}
                  placeholder="Digite um conceito e pressione Enter..."
                />
                <button type="button" className="btn-tag-add" onClick={() => handleAddChip(newConceptInput, setNewConceptInput, keyConcepts, setKeyConcepts)}>
                  <Plus size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* ⚠️ DIFICULDADES INTERATIVAS */}
          <div className="form-group">
            <label>⚠️ Pontos de Dificuldade</label>
            <div className="interactive-tags-box">
              <div className="tags-chips-wrap">
                {difficultyChips.map((d, i) => (
                  <span key={i} className="interactive-chip difficulty-chip">
                    ⚠️ {d}
                    <button type="button" onClick={() => setDifficultyChips(prev => prev.filter((_, idx) => idx !== i))}><X size={11} /></button>
                  </span>
                ))}
              </div>
              <div className="tag-input-row">
                <input
                  type="text"
                  value={newDifficultyInput}
                  onChange={(e) => setNewDifficultyInput(e.target.value)}
                  onKeyDown={(e) => handleAddChip(newDifficultyInput, setNewDifficultyInput, difficultyChips, setDifficultyChips, e)}
                  placeholder="Ex: Dificuldade na sintaxe..."
                />
                <button type="button" className="btn-tag-add" onClick={() => handleAddChip(newDifficultyInput, setNewDifficultyInput, difficultyChips, setDifficultyChips)}>
                  <Plus size={13} />
                </button>
              </div>
            </div>
          </div>

          {showDeleteConfirm && (
            <div className="delete-confirm-box" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--danger)", borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
              <p style={{ color: "var(--danger)", fontSize: "0.85rem", fontWeight: 600, margin: "0 0 8px 0" }}>Tem certeza que deseja excluir esta Lesson?</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" className="btn-danger-confirm" style={{ background: "var(--danger)", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }} onClick={() => { if (onDelete) onDelete(lesson.id); onClose(); }}>Sim, Excluir</button>
                <button type="button" className="btn-cancel" style={{ padding: "6px 12px", fontSize: "0.8rem" }} onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
              </div>
            </div>
          )}

          <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              {onDelete && !showDeleteConfirm && (
                <button type="button" className="btn-delete-row" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 size={14} /> Excluir Lesson
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn-submit">Salvar Alterações</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   QUESTION MODALS (LESSON & MODULE SELECTABLE WITH EXISTING)
   ========================================================================== */

function NewQuestionModal({
  onClose,
  onSave,
  domains,
  lessons = [],
  modules = [],
}: {
  onClose: () => void;
  onSave: (q: Omit<Question, "id" | "progress">) => void;
  domains: Domain[];
  lessons?: Lesson[];
  modules?: ModuleItem[];
}) {
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState(domains[0]?.name || "Tecnologia");

  const availableLessons = lessons.filter(l => l.domain.toLowerCase() === domain.toLowerCase());
  const [lesson, setLesson] = useState(availableLessons[0]?.name || lessons[0]?.name || "Programação");

  const availableModules = modules.filter(m => m.domain.toLowerCase() === domain.toLowerCase());
  const [module, setModule] = useState(availableModules[0]?.name || "Fundamentos");

  const [stage, setStage] = useState<Stage>("study");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !lesson.trim()) return;
    onSave({
      title: title.trim(),
      domain,
      lesson: lesson.trim(),
      module: module.trim() || "Geral",
      stage,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title">
            <Plus size={18} />
            <h3>Criar Nova Pergunta no KOS</h3>
          </div>
          <button className="icon-button" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Pergunta ou Conceito Central *</label>
            <input type="text" placeholder="Ex: Como funciona o Garbage Collector em JavaScript?" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
          </div>

          <div className="form-group">
            <label>Domínio de Conhecimento *</label>
            <select
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                const les = lessons.filter(l => l.domain.toLowerCase() === e.target.value.toLowerCase());
                setLesson(les[0]?.name || "");
                const mods = modules.filter(m => m.domain.toLowerCase() === e.target.value.toLowerCase());
                setModule(mods[0]?.name || "Fundamentos");
              }}
            >
              {domains.map(d => <option key={d.id} value={d.name}>{d.icon} {d.name}</option>)}
            </select>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Fase Inicial do Ciclo *</label>
              <select value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
                <option value="study">Study (Estudo Inicial — 0%)</option>
                <option value="fixation">Fixation (Fixação 24-48h — 30%)</option>
                <option value="weekly">Weekly (Revisão Semanal — 60%)</option>
                <option value="monthly">Monthly (Revisão Mensal — 85%)</option>
                <option value="mastered">Mastered (100% Dominado)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Progresso de Retenção (Automático)</label>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", height: "38px", padding: "0 12px", background: "var(--input-bg, #18181b)", border: "1px solid var(--input-border, #3f3f46)", borderRadius: "6px" }}>
                <div className="bar-track" style={{ flex: 1, height: "6px" }}>
                  <div className="bar-fill" style={{ width: `${stageProgressMap[stage]}%`, backgroundColor: stage === "mastered" ? "#10b981" : "#3b82f6" }} />
                </div>
                <span style={{ fontWeight: 700, fontSize: "12.5px", color: stage === "mastered" ? "#10b981" : "#93c5fd" }}>{stageProgressMap[stage]}%</span>
              </div>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Lesson Existente *</label>
              <select value={lesson} onChange={(e) => setLesson(e.target.value)} required>
                {availableLessons.map(l => (
                  <option key={l.id} value={l.name}>▦ {l.name}</option>
                ))}
                {availableLessons.length === 0 && <option value="">Sem lições no domínio</option>}
              </select>
            </div>

            <div className="form-group">
              <label>Módulo Existente *</label>
              <select value={module} onChange={(e) => setModule(e.target.value)} required>
                {availableModules.map(m => (
                  <option key={m.id} value={m.name}>📦 {m.name}</option>
                ))}
                {availableModules.length === 0 && <option value="Geral">📦 Geral</option>}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-submit" disabled={!title.trim() || !lesson.trim()}>Criar Pergunta & Iniciar Vault</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditQuestionModal({
  question,
  domains,
  lessons = [],
  modules = [],
  onClose,
  onSave,
  onDelete,
}: {
  question: Question;
  domains: Domain[];
  lessons?: Lesson[];
  modules?: ModuleItem[];
  onClose: () => void;
  onSave: (q: Question) => void;
  onDelete?: (id: string) => void;
}) {
  const [title, setTitle] = useState(question.title);
  const [domain, setDomain] = useState(question.domain);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const availableLessons = lessons.filter(l => l.domain.toLowerCase() === domain.toLowerCase());
  const [lesson, setLesson] = useState(question.lesson || availableLessons[0]?.name || "");

  const availableModules = modules.filter(m => m.domain.toLowerCase() === domain.toLowerCase());
  const [module, setModule] = useState(question.module || availableModules[0]?.name || "");

  const [stage, setStage] = useState<Stage>(question.stage);
  const [progress, setProgress] = useState(question.progress);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      ...question,
      title: title.trim(),
      domain,
      lesson: lesson.trim(),
      module: module.trim(),
      stage,
      progress,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title">
            <Edit3 size={18} />
            <h3>Editar Questão Central</h3>
          </div>
          <button className="icon-button" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Título da Questão *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Domínio *</label>
              <select
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value);
                  const les = lessons.filter(l => l.domain.toLowerCase() === e.target.value.toLowerCase());
                  setLesson(les[0]?.name || "");
                  const mods = modules.filter(m => m.domain.toLowerCase() === e.target.value.toLowerCase());
                  setModule(mods[0]?.name || "");
                }}
              >
                {domains.map(d => <option key={d.id} value={d.name}>{d.icon} {d.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Lição Existente *</label>
              <select value={lesson} onChange={(e) => setLesson(e.target.value)} required>
                {availableLessons.map(l => (
                  <option key={l.id} value={l.name}>▦ {l.name}</option>
                ))}
                {availableLessons.length === 0 && <option value={question.lesson}>▦ {question.lesson}</option>}
              </select>
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label>Módulo Existente</label>
              <select value={module} onChange={(e) => setModule(e.target.value)}>
                {availableModules.map(m => (
                  <option key={m.id} value={m.name}>📦 {m.name}</option>
                ))}
                {availableModules.length === 0 && <option value={question.module}>📦 {question.module}</option>}
              </select>
            </div>

            <div className="form-group">
              <label>Fase no Ciclo *</label>
              <select value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
                <option value="study">Study (Estudo Inicial — 0%)</option>
                <option value="fixation">Fixation (Fixação 24-48h — 30%)</option>
                <option value="weekly">Weekly (Revisão Semanal — 60%)</option>
                <option value="monthly">Monthly (Revisão Mensal — 85%)</option>
                <option value="mastered">Mastered (100% Dominado)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Progresso (Automático)</label>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", height: "38px", padding: "0 12px", background: "var(--input-bg, #18181b)", border: "1px solid var(--input-border, #3f3f46)", borderRadius: "6px" }}>
                <div className="bar-track" style={{ flex: 1, height: "6px" }}>
                  <div className="bar-fill" style={{ width: `${stageProgressMap[stage]}%`, backgroundColor: stage === "mastered" ? "#10b981" : "#3b82f6" }} />
                </div>
                <span style={{ fontWeight: 700, fontSize: "12px", color: stage === "mastered" ? "#10b981" : "#93c5fd" }}>{stageProgressMap[stage]}%</span>
              </div>
            </div>
          </div>

          {showDeleteConfirm && (
            <div className="delete-confirm-box" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--danger)", borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
              <p style={{ color: "var(--danger)", fontSize: "0.85rem", fontWeight: 600, margin: "0 0 8px 0" }}>Tem certeza que deseja excluir a Questão "{question.title}"?</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" className="btn-danger-confirm" style={{ background: "var(--danger)", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }} onClick={() => { if (onDelete) onDelete(question.id); onClose(); }}>Sim, Excluir</button>
                <button type="button" className="btn-cancel" style={{ padding: "6px 12px", fontSize: "0.8rem" }} onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
              </div>
            </div>
          )}

          <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              {onDelete && !showDeleteConfirm && (
                <button type="button" className="btn-delete-row" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 size={14} /> Excluir Questão
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn-submit">Salvar Alterações</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   REVIEW MODALS (DAILY/WEEKLY/MONTHLY, CALENDAR, SELECTABLE ITEMS & BENCHMARK)
   ========================================================================== */

function NewReviewModal({
  onClose,
  onSave,
  domains,
  lessons = [],
  questions = [],
}: {
  onClose: () => void;
  onSave: (r: Omit<ReviewRecord, "id">) => void;
  domains: Domain[];
  lessons?: Lesson[];
  questions?: Question[];
}) {
  const [type, setType] = useState<ReviewRecord["type"]>("Daily (24h)");
  const [domain, setDomain] = useState(domains[0]?.name || "Tecnologia");

  const availableLessons = lessons.filter(l => l.domain.toLowerCase() === domain.toLowerCase());
  const [lesson, setLesson] = useState(availableLessons[0]?.name || lessons[0]?.name || "");

  const availableQuestions = questions.filter(q =>
    q.domain.toLowerCase() === domain.toLowerCase() &&
    (!lesson || q.lesson.toLowerCase() === lesson.toLowerCase())
  );
  const [question, setQuestion] = useState(availableQuestions[0]?.title || questions[0]?.title || "");

  const [dueDate, setDueDate] = useState("2026-08-18");
  const [status, setStatus] = useState<ReviewRecord["status"]>("Pronto");
  const [retentionScore, setRetentionScore] = useState(85);
  const [benchmarkTestResult, setBenchmarkTestResult] = useState("17/20 (85%) no Quiz de Fixação do NotebookLM");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: `${type} Review`,
      type,
      domain,
      lesson,
      question,
      dueDate,
      interval: type.includes("24h") ? "24h" : type.includes("7d") ? "7d" : type.includes("30d") ? "30d" : "60d",
      status,
      retentionScore,
      benchmarkTestResult: benchmarkTestResult.trim(),
      lastReviewedAt: "Hoje",
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title">
            <Plus size={18} />
            <h3>Agendar Nova Revisão</h3>
          </div>
          <button className="icon-button" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row-2">
            <div className="form-group">
              <label>Tipo de Revisão *</label>
              <select value={type} onChange={(e) => setType(e.target.value as any)}>
                <option value="Daily (24h)">Daily (24h)</option>
                <option value="Weekly (7d)">Weekly (7d)</option>
                <option value="Monthly (30d)">Monthly (30d)</option>
                <option value="Mastery Recall">Mastery Recall (60d+)</option>
                <option value="Custom">Personalizada</option>
              </select>
            </div>

            <div className="form-group">
              <label>📅 Vencimento (Calendário) *</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Domínio de Foco *</label>
              <select
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value);
                  const les = lessons.filter(l => l.domain.toLowerCase() === e.target.value.toLowerCase());
                  setLesson(les[0]?.name || "");
                  const qs = questions.filter(q => q.domain.toLowerCase() === e.target.value.toLowerCase());
                  setQuestion(qs[0]?.title || "");
                }}
              >
                {domains.map(d => <option key={d.id} value={d.name}>{d.icon} {d.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Lesson de Foco *</label>
              <select
                value={lesson}
                onChange={(e) => {
                  setLesson(e.target.value);
                  const qs = questions.filter(q => q.lesson.toLowerCase() === e.target.value.toLowerCase());
                  setQuestion(qs[0]?.title || "");
                }}
              >
                {availableLessons.map(l => (
                  <option key={l.id} value={l.name}>▦ {l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Question Alvo da Revisão *</label>
            <select value={question} onChange={(e) => setQuestion(e.target.value)} required>
              {availableQuestions.map(q => (
                <option key={q.id} value={q.title}>□ {q.title}</option>
              ))}
              {availableQuestions.length === 0 && <option value="">Sem perguntas disponíveis</option>}
            </select>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="Pronto">Pronto (Disponível Agora)</option>
                <option value="Pendente">Pendente</option>
                <option value="Agendado">Agendado</option>
                <option value="Concluído">Concluído</option>
              </select>
            </div>

            <div className="form-group">
              <label>Score de Retenção (%)</label>
              <input type="number" min={0} max={100} value={retentionScore} onChange={(e) => setRetentionScore(Number(e.target.value))} />
            </div>
          </div>

          <div className="form-group">
            <label>Resultado / Benchmark do Teste (Ex: NotebookLM Quiz)</label>
            <input
              type="text"
              value={benchmarkTestResult}
              onChange={(e) => setBenchmarkTestResult(e.target.value)}
              placeholder="Ex: 18/20 (90%) acertos no teste do NotebookLM"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-submit">Salvar Revisão</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditReviewModal({
  review,
  domains,
  lessons = [],
  questions = [],
  onClose,
  onSave,
  onDelete,
}: {
  review: ReviewRecord;
  domains: Domain[];
  lessons?: Lesson[];
  questions?: Question[];
  onClose: () => void;
  onSave: (r: ReviewRecord) => void;
  onDelete?: (id: string) => void;
}) {
  const [type, setType] = useState<ReviewRecord["type"]>(review.type);
  const [domain, setDomain] = useState(review.domain);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const availableLessons = lessons.filter(l => l.domain.toLowerCase() === domain.toLowerCase());
  const [lesson, setLesson] = useState(review.lesson || availableLessons[0]?.name || "");

  const availableQuestions = questions.filter(q =>
    q.domain.toLowerCase() === domain.toLowerCase() &&
    (!lesson || q.lesson.toLowerCase() === lesson.toLowerCase())
  );
  const [question, setQuestion] = useState(review.question || availableQuestions[0]?.title || "");

  const [dueDate, setDueDate] = useState(review.dueDate);
  const [status, setStatus] = useState<ReviewRecord["status"]>(review.status);
  const [retentionScore, setRetentionScore] = useState(review.retentionScore);
  const [benchmarkTestResult, setBenchmarkTestResult] = useState(review.benchmarkTestResult || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...review,
      title: `${type} Review`,
      type,
      domain,
      lesson,
      question,
      dueDate,
      interval: type.includes("24h") ? "24h" : type.includes("7d") ? "7d" : type.includes("30d") ? "30d" : "60d",
      status,
      retentionScore,
      benchmarkTestResult: benchmarkTestResult.trim(),
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title">
            <Edit3 size={18} />
            <h3>Editar Revisão Agendada</h3>
          </div>
          <button className="icon-button" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row-2">
            <div className="form-group">
              <label>Tipo de Revisão *</label>
              <select value={type} onChange={(e) => setType(e.target.value as any)}>
                <option value="Daily (24h)">Daily (24h)</option>
                <option value="Weekly (7d)">Weekly (7d)</option>
                <option value="Monthly (30d)">Monthly (30d)</option>
                <option value="Mastery Recall">Mastery Recall</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div className="form-group">
              <label>📅 Vencimento (Calendário) *</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Domínio *</label>
              <select
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value);
                  const les = lessons.filter(l => l.domain.toLowerCase() === e.target.value.toLowerCase());
                  setLesson(les[0]?.name || "");
                  const qs = questions.filter(q => q.domain.toLowerCase() === e.target.value.toLowerCase());
                  setQuestion(qs[0]?.title || "");
                }}
              >
                {domains.map(d => <option key={d.id} value={d.name}>{d.icon} {d.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Lesson *</label>
              <select
                value={lesson}
                onChange={(e) => {
                  setLesson(e.target.value);
                  const qs = questions.filter(q => q.lesson.toLowerCase() === e.target.value.toLowerCase());
                  setQuestion(qs[0]?.title || "");
                }}
              >
                {availableLessons.map(l => (
                  <option key={l.id} value={l.name}>▦ {l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Question Alvo *</label>
            <select value={question} onChange={(e) => setQuestion(e.target.value)} required>
              {availableQuestions.map(q => (
                <option key={q.id} value={q.title}>□ {q.title}</option>
              ))}
              {availableQuestions.length === 0 && <option value={review.question}>□ {review.question}</option>}
            </select>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="Pronto">Pronto</option>
                <option value="Pendente">Pendente</option>
                <option value="Agendado">Agendado</option>
                <option value="Concluído">Concluído</option>
              </select>
            </div>

            <div className="form-group">
              <label>Score de Retenção (%)</label>
              <input type="number" min={0} max={100} value={retentionScore} onChange={(e) => setRetentionScore(Number(e.target.value))} />
            </div>
          </div>

          <div className="form-group">
            <label>Resultado / Benchmark do Teste (NotebookLM)</label>
            <input
              type="text"
              value={benchmarkTestResult}
              onChange={(e) => setBenchmarkTestResult(e.target.value)}
              placeholder="Ex: 18/20 (90%) acertos no teste do NotebookLM"
            />
          </div>

          {showDeleteConfirm && (
            <div className="delete-confirm-box" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--danger)", borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
              <p style={{ color: "var(--danger)", fontSize: "0.85rem", fontWeight: 600, margin: "0 0 8px 0" }}>Tem certeza que deseja excluir esta Revisão?</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" className="btn-danger-confirm" style={{ background: "var(--danger)", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }} onClick={() => { if (onDelete) onDelete(review.id); onClose(); }}>Sim, Excluir</button>
                <button type="button" className="btn-cancel" style={{ padding: "6px 12px", fontSize: "0.8rem" }} onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
              </div>
            </div>
          )}

          <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              {onDelete && !showDeleteConfirm && (
                <button type="button" className="btn-delete-row" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 size={14} /> Excluir Revisão
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn-submit">Salvar Alterações</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   REVIEWS PAGE
   ========================================================================== */

function ReviewsPage({
  reviews,
  questions,
  onQuestion,
  onOpenReviewsDb,
  onEditReview,
}: {
  reviews: ReviewRecord[];
  questions: Question[];
  onQuestion: (q: Question) => void;
  onOpenReviewsDb: () => void;
  onEditReview: (r: ReviewRecord) => void;
}) {
  return (
    <>
      <div className="page-header-with-actions">
        <PageTitle
          eyebrow="REVIEWS"
          title="Active Recall & Spaced Repetition"
          description="Recupere o conhecimento ativamente e avance cada Question no ciclo com suporte a benchmarks de testes."
        />
        <button className="new-button" onClick={onOpenReviewsDb}>
          <Table2 size={15} /> Abrir Reviews Database Completa
        </button>
      </div>

      <div className="review-table">
        <div className="review-row head">
          <span>Revisão Agendada</span>
          <span>Domínio & Lesson</span>
          <span>Pergunta Alvo</span>
          <span>Vencimento</span>
          <span>Status & Benchmark</span>
          <span></span>
        </div>
        {reviews.map(r => {
          const matchedQ = questions.find(q => q.title.toLowerCase() === r.question.toLowerCase()) || questions[0];
          return (
            <div className="review-row" key={r.id}>
              <span className="name-cell">↻ {r.title}</span>
              <span><span className="domain-tag">{r.domain}</span> • {r.lesson}</span>
              <span><p className="meta-clamp" style={{ maxWidth: "220px" }}>{r.question}</p></span>
              <span><span className={r.dueDate === "Hoje" || r.dueDate === "2026-08-17" ? "text-highlight" : ""}>{r.dueDate}</span></span>
              <span>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span className="status-pill">● {r.status} ({r.retentionScore}%)</span>
                  {r.benchmarkTestResult && <small style={{ fontSize: "10px", color: "var(--text-dim)" }}>{r.benchmarkTestResult}</small>}
                </div>
              </span>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button className="icon-edit-btn" title="Editar Revisão" onClick={() => onEditReview(r)}>
                  <Edit3 size={13} />
                </button>
                <button className="text-button" onClick={() => onQuestion(matchedQ)}>
                  Recall <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function StageBadge({ stage }: { stage: Stage }) {
  const s = stages.find(item => item.key === stage);
  const color = s?.color || "#60a5fa";
  return (
    <span
      className={`stage-badge ${stage}`}
      style={{
        borderColor: `${color}40`,
        color: color,
        backgroundColor: `${color}18`,
      }}
    >
      ● {s?.label}
    </span>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div className="table-progress">
      <div><span style={{ width: `${value}%` }} /></div>
      <small>{value}%</small>
    </div>
  );
}

function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: string }) {
  return (
    <section className="page-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && (
        <button className="new-button">
          <Plus size={15} />{action}
        </button>
      )}
    </section>
  );
}

function AIPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="ai-overlay">
      <div className="ai-panel">
        <div className="ai-head">
          <div>
            <p className="eyebrow">KOS AI</p>
            <h2>Learning Copilot</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        <div className="ai-message">
          <Sparkles size={17} />
          <p>Converse comigo sobre o que você quer aprender. Posso estruturar Domains, Lessons, Categories, Modules e Questions com Active Recall.</p>
        </div>
        <div className="ai-suggestions">
          <button>Quero aprender algo novo</button>
          <button>Crie Questions para um Módulo</button>
          <button>Analise meu progresso de retenção</button>
        </div>
        <div className="ai-input">
          <input placeholder="Fale com o KOS AI..." />
          <button><ArrowRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}

export default App;
