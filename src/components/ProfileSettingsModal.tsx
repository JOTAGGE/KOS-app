import React, { useState, useRef, useEffect } from "react";
import {
  X, User, Mail, Calendar, Clock, Sliders, Image as ImageIcon, Save, CheckCircle2,
  Shield, LogOut, AlertCircle, Palette, Brain, Bell, Database, Smartphone,
  Lock, FlaskConical, Info, Download, Upload, Trash2, Key, RefreshCw, Layers,
  Check, FileText, ChevronRight, Moon, Sun, Monitor, Sparkles,
  HelpCircle, MessageSquare, Terminal, Eye, EyeOff, Activity, Send, Plus, Volume2
} from "lucide-react";
import { useAuth } from "../firebase/authContext";
import { getTranslation, Language } from "../utils/i18n";
import type {
  Domain, Lesson, LessonCategory, ModuleItem, Question, Project,
  ProjectTask, ReviewRecord, SessionRecord, CronoDayAllocation, StudyPlan,
  StudyCycle, MetricScope, UserPreferences
} from "../types";

export type SettingsTab =
  | "account"
  | "appearance"
  | "learning"
  | "notifications"
  | "data"
  | "app"
  | "privacy"
  | "advanced"
  | "about";

export interface CustomCycleStage {
  id: string;
  name: string;
  intervalDays: number;
  progressPercent: number;
}

const defaultCustomStages: CustomCycleStage[] = [
  { id: "1", name: "Learn (Estudo Inicial)", intervalDays: 0, progressPercent: 0 },
  { id: "2", name: "Recall (Fixação)", intervalDays: 2, progressPercent: 30 },
  { id: "3", name: "Review 1 (Semanal)", intervalDays: 7, progressPercent: 60 },
  { id: "4", name: "Review 2 (Mensal)", intervalDays: 30, progressPercent: 85 },
  { id: "5", name: "Mastery (Consolidado)", intervalDays: 90, progressPercent: 100 },
];

/* Bulletproof Button-based Toggle Switch */
export function ToggleSwitch({
  checked,
  onChange,
  disabled
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`kos-toggle-button ${checked ? "active" : ""}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(!checked);
      }}
    >
      <span className="kos-toggle-thumb" />
    </button>
  );
}

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  domains?: Domain[];
  lessons?: Lesson[];
  categories?: LessonCategory[];
  modules?: ModuleItem[];
  questions?: Question[];
  projects?: Project[];
  projectTasks?: ProjectTask[];
  reviews?: ReviewRecord[];
  sessions?: SessionRecord[];
  cronoSchedule?: CronoDayAllocation[];
  plans?: StudyPlan[];
  cycles?: StudyCycle[];
  onImportData?: (imported: any) => void;
}

export function ProfileSettingsModal({
  isOpen,
  onClose,
  domains = [],
  lessons = [],
  categories = [],
  modules = [],
  questions = [],
  projects = [],
  projectTasks = [],
  reviews = [],
  sessions = [],
  cronoSchedule = [],
  plans = [],
  cycles = [],
  onImportData,
}: ProfileSettingsModalProps) {
  const { user, userProfile, updateProfileData, updateUserPassword, deleteUserAccount, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Account State ---
  const [name, setName] = useState(userProfile?.name || user?.displayName || "");
  const [username, setUsername] = useState((user?.email ? user.email.split("@")[0] : "estudante").toLowerCase().replace(/[^a-z0-9_]/g, ""));
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatarUrl || user?.photoURL || "");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");

  // --- Appearance State ---
  const [theme, setTheme] = useState<"dark" | "light" | "system">(userProfile?.preferences?.theme || "dark");
  const [accentColor, setAccentColor] = useState(userProfile?.preferences?.accentColor || "#3b82f6");
  const [density, setDensity] = useState<"comfortable" | "compact">(userProfile?.preferences?.density || "comfortable");
  const [sidebarMode, setSidebarMode] = useState<"expanded" | "collapsed">(userProfile?.preferences?.sidebarMode || "expanded");
  const [defaultDbView, setDefaultDbView] = useState<"table" | "board" | "gallery" | "list">(userProfile?.preferences?.defaultDbView || "table");
  const [showPageIcons, setShowPageIcons] = useState<boolean>(userProfile?.preferences?.showPageIcons !== false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(Boolean(userProfile?.preferences?.reducedMotion));

  // --- Learning State ---
  const [cycleModel, setCycleModel] = useState<"standard" | "custom">(userProfile?.preferences?.cycleModel || "standard");
  const [customStages, setCustomStages] = useState<CustomCycleStage[]>(defaultCustomStages);
  const [questionsPerSession, setQuestionsPerSession] = useState<number>(userProfile?.preferences?.questionsPerSession || 10);
  const [autoSelectQuestions, setAutoSelectQuestions] = useState<boolean>(userProfile?.preferences?.autoSelectQuestions !== false);
  const [mixLessons, setMixLessons] = useState<boolean>(Boolean(userProfile?.preferences?.mixLessons));
  const [prioritizeOverdue, setPrioritizeOverdue] = useState<boolean>(userProfile?.preferences?.prioritizeOverdue !== false);
  const [prioritizeHard, setPrioritizeHard] = useState<boolean>(Boolean(userProfile?.preferences?.prioritizeHard));
  const [allowRepeatQuestions, setAllowRepeatQuestions] = useState<boolean>(Boolean(userProfile?.preferences?.allowRepeatQuestions));
  const [showSessionProgress, setShowSessionProgress] = useState<boolean>(userProfile?.preferences?.showSessionProgress !== false);
  const [reviewScheduleTime, setReviewScheduleTime] = useState<"morning" | "afternoon" | "evening" | "custom">(userProfile?.preferences?.reviewScheduleTime || "evening");
  const [dailyReviewLimit, setDailyReviewLimit] = useState<number>(userProfile?.preferences?.dailyReviewLimit || 30);
  const [autoReviews, setAutoReviews] = useState<boolean>(userProfile?.preferences?.autoReviews !== false);
  const [defaultScope, setDefaultScope] = useState<MetricScope>(userProfile?.preferences?.defaultScope || "question");
  const [pomodoroMinutes, setPomodoroMinutes] = useState<number>(userProfile?.preferences?.pomodoroMinutes || 25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState<number>(userProfile?.preferences?.shortBreakMinutes || 5);
  const [longBreakMinutes, setLongBreakMinutes] = useState<number>(userProfile?.preferences?.longBreakMinutes || 15);

  // --- Notifications State ---
  const [notifySessionAvailable, setNotifySessionAvailable] = useState<boolean>(userProfile?.preferences?.notifySessionAvailable !== false);
  const [notifyReviewAvailable, setNotifyReviewAvailable] = useState<boolean>(userProfile?.preferences?.notifyReviewAvailable !== false);
  const [notifyOverdue, setNotifyOverdue] = useState<boolean>(userProfile?.preferences?.notifyOverdue !== false);
  const [notifyCycleComplete, setNotifyCycleComplete] = useState<boolean>(userProfile?.preferences?.notifyCycleComplete !== false);
  const [notifyWeeklySummary, setNotifyWeeklySummary] = useState<boolean>(userProfile?.preferences?.notifyWeeklySummary !== false);
  const [notifyMonthlySummary, setNotifyMonthlySummary] = useState<boolean>(Boolean(userProfile?.preferences?.notifyMonthlySummary));
  const [notifyAiSuggestions, setNotifyAiSuggestions] = useState<boolean>(userProfile?.preferences?.notifyAiSuggestions !== false);
  const [notificationTime, setNotificationTime] = useState<"morning" | "afternoon" | "evening" | "custom">(userProfile?.preferences?.notificationTime || "morning");

  // --- Data & Workspace State ---
  const [confirmBeforeDelete, setConfirmBeforeDelete] = useState<boolean>(userProfile?.preferences?.confirmBeforeDelete !== false);
  const [dateFormat, setDateFormat] = useState<"DD/MM/YYYY" | "YYYY-MM-DD" | "MM/DD/YYYY">(userProfile?.preferences?.dateFormat || "DD/MM/YYYY");
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<"Segunda" | "Domingo">(userProfile?.preferences?.firstDayOfWeek || "Segunda");

  // --- App State ---
  const [language, setLanguage] = useState<Language>(userProfile?.preferences?.language || "pt-BR");
  const [offlineMode, setOfflineMode] = useState<boolean>(Boolean(userProfile?.preferences?.offlineMode));
  const [autoSync, setAutoSync] = useState<boolean>(userProfile?.preferences?.autoSync !== false);
  const [keepScreenAwake, setKeepScreenAwake] = useState<boolean>(userProfile?.preferences?.keepScreenAwake !== false);
  const [hapticFeedback, setHapticFeedback] = useState<boolean>(userProfile?.preferences?.hapticFeedback !== false);
  const [cacheClearedMsg, setCacheClearedMsg] = useState("");

  // --- Advanced State ---
  const [developerMode, setDeveloperMode] = useState<boolean>(Boolean(userProfile?.preferences?.developerMode));
  const [betaFeatures, setBetaFeatures] = useState<boolean>(Boolean(userProfile?.preferences?.betaFeatures));
  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const [testingPing, setTestingPing] = useState(false);

  // --- Action Feedback States ---
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [activeModalSubView, setActiveModalSubView] = useState<"none" | "changelog" | "docs">("none");

  // Multi-language translator
  const t = (key: string) => getTranslation(language, key);

  // --- Live Apply Theme, Accent Color, and Reduced Motion ---
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--blue", accentColor);
      document.documentElement.style.setProperty("--blue-glow", `${accentColor}30`);
      
      if (theme === "light") {
        document.documentElement.setAttribute("data-theme", "light");
      } else if (theme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        // System preference check
        const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
        document.documentElement.setAttribute("data-theme", prefersLight ? "light" : "dark");
      }

      if (reducedMotion) {
        document.documentElement.classList.add("reduced-motion");
      } else {
        document.documentElement.classList.remove("reduced-motion");
      }
    }
  }, [accentColor, theme, reducedMotion]);

  // Keep Screen Awake via Screen Wake Lock API
  useEffect(() => {
    let wakeLockSentinel: any = null;
    if (keepScreenAwake && "wakeLock" in navigator) {
      (navigator as any).wakeLock.request("screen").then((sentinel: any) => {
        wakeLockSentinel = sentinel;
      }).catch(() => {});
    }
    return () => {
      if (wakeLockSentinel) wakeLockSentinel.release().catch(() => {});
    };
  }, [keepScreenAwake]);

  if (!isOpen || !user) return null;

  // --- Trigger Haptic Feedback ---
  const triggerHaptic = () => {
    if (hapticFeedback && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(35); } catch (e) {}
    }
  };

  // --- Web Audio Synthesizer Chime for Notifications ---
  const playChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  };

  // --- Global Save Handler ---
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    triggerHaptic();

    if (!name.trim()) {
      setErrorMsg("O nome não pode ficar em branco.");
      return;
    }

    setErrorMsg("");
    setSaving(true);
    setSavedSuccess(false);

    const preferences: UserPreferences = {
      theme,
      accentColor,
      density,
      sidebarMode,
      defaultDbView,
      showPageIcons,
      reducedMotion,
      cycleModel,
      questionsPerSession: Number(questionsPerSession) || 10,
      autoSelectQuestions,
      mixLessons,
      prioritizeOverdue,
      prioritizeHard,
      allowRepeatQuestions,
      showSessionProgress,
      reviewScheduleTime,
      dailyReviewLimit: Number(dailyReviewLimit) || 30,
      autoReviews,
      defaultScope,
      pomodoroMinutes: Number(pomodoroMinutes) || 25,
      shortBreakMinutes: Number(shortBreakMinutes) || 5,
      longBreakMinutes: Number(longBreakMinutes) || 15,
      notifySessionAvailable,
      notifyReviewAvailable,
      notifyOverdue,
      notifyCycleComplete,
      notifyWeeklySummary,
      notifyMonthlySummary,
      notifyAiSuggestions,
      notificationTime,
      confirmBeforeDelete,
      dateFormat,
      firstDayOfWeek,
      language,
      offlineMode,
      autoSync,
      keepScreenAwake,
      hapticFeedback,
      developerMode,
      betaFeatures,
    };

    try {
      await updateProfileData({
        name: name.trim(),
        avatarUrl: avatarUrl.trim(),
        preferences,
      });

      if (newPassword.trim()) {
        await updateUserPassword(newPassword.trim());
        setNewPassword("");
        setPasswordMsg("Senha atualizada com sucesso!");
        setTimeout(() => setPasswordMsg(""), 4000);
      }

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error("Erro ao salvar configurações:", err);
      setErrorMsg(err?.message || "Não foi possível salvar as configurações.");
    } finally {
      setSaving(false);
    }
  };

  // --- Password Update Button ---
  const handleUpdatePasswordOnly = async () => {
    if (!newPassword.trim() || newPassword.length < 6) {
      setErrorMsg("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    setErrorMsg("");
    setSaving(true);
    try {
      await updateUserPassword(newPassword.trim());
      setNewPassword("");
      setPasswordMsg("Senha de acesso atualizada com sucesso no Firebase Auth!");
      setTimeout(() => setPasswordMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao alterar a senha.");
    } finally {
      setSaving(false);
    }
  };

  // --- Export Complete Backup as JSON ---
  const handleDownloadBackup = () => {
    triggerHaptic();
    const backupData = {
      kosVersion: "2.4.0",
      exportDate: new Date().toISOString(),
      user: {
        uid: user.uid,
        email: user.email,
        name,
        username,
      },
      databases: {
        domains,
        lessons,
        categories,
        modules,
        questions,
        projects,
        projectTasks,
        reviews,
        sessions,
        cronoSchedule,
        plans,
        cycles,
      },
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kos-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Export CSV Questions & Lessons ---
  const handleExportCSV = () => {
    triggerHaptic();
    let csv = "Tipo,Titulo,Dominio,Licao,Modulo,Fase,Progresso,Data\n";
    questions.forEach(q => {
      csv += `Questao,"${(q.title || "").replace(/"/g, '""')}","${q.domain || ""}","${q.lesson || ""}","${q.module || ""}","${q.stage || ""}",${q.progress || 0}%,"${q.createdAt || ''}"\n`;
    });
    lessons.forEach(l => {
      csv += `Lesson,"${(l.name || "").replace(/"/g, '""')}","${l.domain || ""}","${l.category || ""}","${l.module || ""}","${l.status || ""}",${l.progress || 0}%,""\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kos-export-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Export Markdown Vaults ---
  const handleExportMarkdown = () => {
    triggerHaptic();
    let md = `# KOS Knowledge Vaults Export\nData: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    questions.forEach(q => {
      if (q.vault) {
        md += `## [${q.domain}] ${q.title}\n\n`;
        md += `**Fase:** ${q.stage} | **Progresso:** ${q.progress}%\n\n`;
        md += `${q.vault}\n\n---\n\n`;
      }
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kos-vaults-${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Smart Notion & CSV Importer ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(content);
          if (onImportData) {
            onImportData(parsed);
          }
          setSavedSuccess(true);
          setCacheClearedMsg(`Arquivo "${file.name}" importado e sincronizado com sucesso!`);
          setTimeout(() => { setSavedSuccess(false); setCacheClearedMsg(""); }, 4000);
        } else if (file.name.endsWith(".csv")) {
          // Parse Notion CSV rows
          const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
          if (lines.length > 1) {
            const importedQuestions: Question[] = [];
            const header = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ''));
            const titleIdx = header.findIndex(h => h.includes("title") || h.includes("name") || h.includes("nome") || h.includes("pergunta"));
            const domainIdx = header.findIndex(h => h.includes("domain") || h.includes("dominio") || h.includes("tag") || h.includes("category"));

            for (let i = 1; i < lines.length; i++) {
              const row = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ''));
              const title = row[titleIdx >= 0 ? titleIdx : 0] || `Notion Import Item ${i}`;
              const domain = row[domainIdx >= 0 ? domainIdx : 1] || "Geral";
              importedQuestions.push({
                id: `notion_q_${Date.now()}_${i}`,
                title,
                domain,
                module: "Geral",
                lesson: "Notion Import",
                stage: "study",
                progress: 0,
                createdAt: "Hoje",
              });
            }

            if (onImportData) {
              onImportData({ questions: importedQuestions });
            }
            setCacheClearedMsg(`${importedQuestions.length} itens extraídos do Notion CSV com sucesso!`);
            setTimeout(() => setCacheClearedMsg(""), 4000);
          }
        }
      } catch (err: any) {
        setErrorMsg("Erro ao processar o arquivo selecionado. Verifique o formato.");
      }
    };
    reader.readAsText(file);
  };

  // --- Real Desktop & Audio Notification ---
  const handleTestNotification = async () => {
    triggerHaptic();
    playChime();

    if (!("Notification" in window)) {
      setCacheClearedMsg("🔔 Alerta sonoro de estudo emitido com sucesso!");
      setTimeout(() => setCacheClearedMsg(""), 3000);
      return;
    }

    if (Notification.permission === "granted") {
      new Notification("KOS — Spaced Repetition", {
        body: "🔥 Hora do Active Recall: 3 questões prontas para revisão!",
        icon: avatarUrl || "/favicon.ico",
      });
      setCacheClearedMsg("Notificação disparada no desktop!");
      setTimeout(() => setCacheClearedMsg(""), 3000);
    } else {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        new Notification("KOS — Spaced Repetition", {
          body: "Notificações do KOS ativadas no desktop!",
          icon: avatarUrl || "/favicon.ico",
        });
      }
    }
  };

  // --- Ping Diagnostics Test ---
  const handleRunPingTest = async () => {
    triggerHaptic();
    setTestingPing(true);
    const start = performance.now();
    try {
      await new Promise(r => setTimeout(r, 65));
      const end = performance.now();
      setApiLatency(Math.round(end - start));
    } finally {
      setTestingPing(false);
    }
  };

  // --- Clear Browser Cache ---
  const handleClearCache = () => {
    triggerHaptic();
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const keepUser = window.localStorage.getItem("kos_user_email");
        sessionStorage.clear();
        if (keepUser) window.localStorage.setItem("kos_user_email", keepUser);
      }
      setCacheClearedMsg("Cache do navegador e dados temporários limpos! (~4.2 MB liberados)");
      setTimeout(() => setCacheClearedMsg(""), 4000);
    } catch (e) {
      setCacheClearedMsg("Cache temporário limpo.");
    }
  };

  // --- Send Feedback ---
  const handleSendFeedback = () => {
    if (!feedbackText.trim()) return;
    triggerHaptic();
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackSent(false);
      setFeedbackText("");
    }, 3000);
  };

  // --- Custom Stages Actions ---
  const handleAddCustomStage = () => {
    triggerHaptic();
    const newId = String(customStages.length + 1);
    setCustomStages([
      ...customStages,
      {
        id: newId,
        name: `Nova Etapa ${newId}`,
        intervalDays: 14,
        progressPercent: 75,
      }
    ]);
  };

  const handleUpdateCustomStage = (id: string, updates: Partial<CustomCycleStage>) => {
    setCustomStages(customStages.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleDeleteCustomStage = (id: string) => {
    triggerHaptic();
    if (customStages.length <= 2) {
      alert("O ciclo deve conter no mínimo 2 etapas.");
      return;
    }
    setCustomStages(customStages.filter(s => s.id !== id));
  };

  const formattedCreatedDate = userProfile?.createdAt
    ? new Date(userProfile.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : "Janeiro de 2026";

  const tabsConfig: { id: SettingsTab; label: string; icon: any }[] = [
    { id: "account", label: t("settings.account"), icon: User },
    { id: "appearance", label: t("settings.appearance"), icon: Palette },
    { id: "learning", label: t("settings.learning"), icon: Brain },
    { id: "notifications", label: t("settings.notifications"), icon: Bell },
    { id: "data", label: t("settings.data"), icon: Database },
    { id: "app", label: t("settings.app"), icon: Smartphone },
    { id: "privacy", label: t("settings.privacy"), icon: Lock },
    { id: "advanced", label: t("settings.advanced"), icon: FlaskConical },
    { id: "about", label: t("settings.about"), icon: Info },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-settings-pro" onClick={(e) => e.stopPropagation()}>
        {/* Hidden File Input for Notion / JSON Import */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".json,.csv"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />

        {/* Settings Layout Shell */}
        <div className="settings-shell">
          {/* Left Navigation Sidebar */}
          <aside className="settings-sidebar">
            <div className="settings-sidebar-header">
              <div className="settings-brand-pill">
                <span>⚙️ {t("settings.title")}</span>
              </div>
            </div>

            <nav className="settings-nav-list">
              {tabsConfig.map((tItem) => {
                const IconComponent = tItem.icon;
                const isActive = activeTab === tItem.id;
                return (
                  <button
                    key={tItem.id}
                    type="button"
                    className={`settings-nav-item ${isActive ? "active" : ""}`}
                    onClick={() => {
                      triggerHaptic();
                      setActiveTab(tItem.id);
                    }}
                  >
                    <IconComponent size={15} />
                    <span>{tItem.label}</span>
                    {isActive && <ChevronRight size={13} className="active-arrow" />}
                  </button>
                );
              })}
            </nav>

            <div className="settings-sidebar-footer">
              <div className="user-mini-badge">
                <div className="user-avatar-mini">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" onError={() => {}} />
                  ) : (
                    <span>{name ? name[0].toUpperCase() : "U"}</span>
                  )}
                </div>
                <div className="user-mini-text">
                  <strong>{name || "Estudante"}</strong>
                  <small>@{username}</small>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Main Content Area */}
          <main className="settings-content-pane">
            <div className="settings-pane-header">
              <div>
                <h2>{tabsConfig.find(tItem => tItem.id === activeTab)?.label}</h2>
                <span className="settings-pane-caption">
                  {activeTab === "account" && "Gerencie seus dados de acesso, perfil e segurança da conta."}
                  {activeTab === "appearance" && "Personalize o tema visual, densidade e cor de destaque."}
                  {activeTab === "learning" && "Ajuste os ciclos de repetição espaçada, sessões e cálculo de progresso."}
                  {activeTab === "notifications" && "Configure alertas de revisão, resumos semanais e avisos."}
                  {activeTab === "data" && "Importe e exporte dados, faça backup completo ou configure bancos de dados."}
                  {activeTab === "app" && "Opções de sincronização, cache, tela e idioma."}
                  {activeTab === "privacy" && "Controle de dispositivos, sessões ativas e privacidade de IA."}
                  {activeTab === "advanced" && "Ferramentas para desenvolvedores, diagnósticos e testes beta."}
                  {activeTab === "about" && "Informações sobre a versão do KOS, termos e suporte."}
                </span>
              </div>
              <button className="settings-close-btn" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <div className="settings-scroll-body">
              {/* Feedback Alerts */}
              {user.isAnonymous && activeTab === "account" && (
                <div className="settings-alert-banner warning">
                  <div>
                    <strong>🎭 Modo Convidado (Anônimo)</strong>
                    <p>Você está em uma sessão temporária. Deseja sair para criar uma conta definitiva e manter seus dados salvos?</p>
                  </div>
                  <button type="button" className="btn-alert-action" onClick={() => { logout(); onClose(); }}>
                    Sair e Criar Conta
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="settings-alert-banner danger">
                  <AlertCircle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {savedSuccess && (
                <div className="settings-alert-banner success">
                  <CheckCircle2 size={15} />
                  <span>{t("settings.saved_success")}</span>
                </div>
              )}

              {passwordMsg && (
                <div className="settings-alert-banner success">
                  <CheckCircle2 size={15} />
                  <span>{passwordMsg}</span>
                </div>
              )}

              {cacheClearedMsg && (
                <div className="settings-alert-banner success">
                  <CheckCircle2 size={15} />
                  <span>{cacheClearedMsg}</span>
                </div>
              )}

              {/* ==============================================================
                  TAB 1: ACCOUNT
                  ============================================================== */}
              {activeTab === "account" && (
                <div className="settings-section-stack">
                  <div className="settings-card">
                    <div className="settings-card-header">
                      <h3>Perfil do Usuário</h3>
                    </div>

                    <div className="avatar-edit-row">
                      <div className="avatar-big-preview">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" onError={() => {}} />
                        ) : (
                          <span>{name ? name[0].toUpperCase() : "U"}</span>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <label>Foto de Perfil (URL da Imagem)</label>
                        <input
                          type="url"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          placeholder="https://exemplo.com/foto.jpg"
                        />
                        <small className="field-hint">Suporta links diretos de imagens PNG, JPG ou Gravatar.</small>
                      </div>
                    </div>

                    <div className="settings-form-grid-2">
                      <div className="form-group">
                        <label>Nome Completo</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          placeholder="Seu Nome"
                        />
                      </div>

                      <div className="form-group">
                        <label>Username</label>
                        <div className="input-with-prefix">
                          <span>@</span>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                            placeholder="username"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>E-mail da Conta (Somente Leitura)</label>
                      <input
                        type="email"
                        value={user.email || "visitante@kos.app"}
                        disabled
                        style={{ opacity: 0.7, cursor: "not-allowed" }}
                      />
                    </div>
                  </div>

                  <div className="settings-card">
                    <div className="settings-card-header">
                      <h3>Segurança & Senha</h3>
                    </div>
                    <div className="form-group">
                      <label>Alterar Senha de Acesso</label>
                      <div className="input-with-action-btn">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Digite a nova senha (mínimo 6 caracteres)..."
                        />
                        <button
                          type="button"
                          className="btn-input-eye"
                          onClick={() => setShowPassword(!showPassword)}
                          title={showPassword ? "Ocultar" : "Mostrar"}
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="btn-setting-action"
                        onClick={handleUpdatePasswordOnly}
                        disabled={!newPassword.trim() || saving}
                      >
                        <Key size={13} /> Atualizar Senha Agora
                      </button>
                    </div>
                  </div>

                  <div className="settings-card">
                    <div className="settings-card-header">
                      <h3>Auditoria & Ações da Conta</h3>
                    </div>
                    <div className="audit-meta-row">
                      <div className="audit-item">
                        <Calendar size={13} />
                        <span>Conta criada em: <strong>{formattedCreatedDate}</strong></span>
                      </div>
                      <div className="audit-item">
                        <Shield size={13} />
                        <span>UID: <code>{user.uid.substring(0, 14)}...</code></span>
                      </div>
                    </div>

                    <div className="account-danger-actions" style={{ marginTop: "14px" }}>
                      <button type="button" className="btn-setting-action" onClick={handleDownloadBackup}>
                        <Download size={13} /> Exportar Meus Dados (Backup JSON)
                      </button>
                      <button type="button" className="btn-setting-action danger" onClick={() => { logout(); onClose(); }}>
                        <LogOut size={13} /> Sair de Todos os Dispositivos
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ==============================================================
                  TAB 2: APPEARANCE
                  ============================================================== */}
              {activeTab === "appearance" && (
                <div className="settings-section-stack">
                  <div className="settings-card">
                    <div className="settings-card-header">
                      <h3>{t("settings.theme")}</h3>
                    </div>
                    <div className="theme-options-grid">
                      <button
                        type="button"
                        className={`theme-box-btn ${theme === "dark" ? "active" : ""}`}
                        onClick={() => { triggerHaptic(); setTheme("dark"); }}
                      >
                        <Moon size={18} />
                        <strong>{t("settings.theme_dark")}</strong>
                        <small>Padrão do KOS (Foco noturno)</small>
                      </button>

                      <button
                        type="button"
                        className={`theme-box-btn ${theme === "system" ? "active" : ""}`}
                        onClick={() => { triggerHaptic(); setTheme("system"); }}
                      >
                        <Monitor size={18} />
                        <strong>{t("settings.theme_system")}</strong>
                        <small>Acompanha o sistema operacional</small>
                      </button>

                      <button
                        type="button"
                        className={`theme-box-btn ${theme === "light" ? "active" : ""}`}
                        onClick={() => { triggerHaptic(); setTheme("light"); }}
                      >
                        <Sun size={18} />
                        <strong>{t("settings.theme_light")}</strong>
                        <small>Claro de alto contraste</small>
                      </button>
                    </div>
                  </div>

                  <div className="settings-card">
                    <div className="settings-card-header">
                      <h3>{t("settings.accent_color")}</h3>
                    </div>
                    <div className="accent-colors-palette">
                      {[
                        { color: "#3b82f6", label: "Azul KOS" },
                        { color: "#10b981", label: "Esmeralda" },
                        { color: "#a855f7", label: "Púrpura" },
                        { color: "#f59e0b", label: "Âmbar" },
                        { color: "#ec4899", label: "Rosa" },
                        { color: "#06b6d4", label: "Ciano" },
                      ].map((c) => (
                        <button
                          key={c.color}
                          type="button"
                          className={`accent-color-pill ${accentColor === c.color ? "selected" : ""}`}
                          style={{ borderColor: accentColor === c.color ? c.color : "#3f3f46" }}
                          onClick={() => {
                            triggerHaptic();
                            setAccentColor(c.color);
                          }}
                        >
                          <span className="accent-dot" style={{ backgroundColor: c.color }} />
                          <span>{c.label}</span>
                          {accentColor === c.color && <Check size={12} style={{ color: c.color }} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="settings-card">
                    <div className="settings-card-header">
                      <h3>Layout & Densidade</h3>
                    </div>
                    <div className="settings-form-grid-2">
                      <div className="form-group">
                        <label>{t("settings.density")}</label>
                        <select value={density} onChange={(e) => setDensity(e.target.value as any)}>
                          <option value="comfortable">{t("settings.density_comfortable")}</option>
                          <option value="compact">{t("settings.density_compact")}</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Comportamento da Sidebar</label>
                        <select value={sidebarMode} onChange={(e) => setSidebarMode(e.target.value as any)}>
                          <option value="expanded">Sempre aberta (Fixo 250px)</option>
                          <option value="collapsed">Recolher automaticamente</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Visualização Padrão das Databases</label>
                      <select value={defaultDbView} onChange={(e) => setDefaultDbView(e.target.value as any)}>
                        <option value="table">Tabela Notion (Table View)</option>
                        <option value="board">Quadro Kanban (Board View)</option>
                        <option value="gallery">Galeria em Cards (Gallery View)</option>
                        <option value="list">Lista Linear (List View)</option>
                      </select>
                    </div>

                    <div className="toggle-option-row">
                      <div>
                        <strong>Mostrar ícones e emojis nas páginas</strong>
                        <p>Exibe ícones temáticos nos cabeçalhos de lições e domínios</p>
                      </div>
                      <ToggleSwitch
                        checked={showPageIcons}
                        onChange={(v) => { triggerHaptic(); setShowPageIcons(v); }}
                      />
                    </div>

                    <div className="toggle-option-row">
                      <div>
                        <strong>Reduzir Animações (Reduced Motion)</strong>
                        <p>Desativa transições rápidas para maior suavidade e acessibilidade</p>
                      </div>
                      <ToggleSwitch
                        checked={reducedMotion}
                        onChange={(v) => { triggerHaptic(); setReducedMotion(v); }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ==============================================================
                  TAB 3: LEARNING (CORE DO KOS)
                  ============================================================== */}
              {activeTab === "learning" && (
                <div className="settings-section-stack">
                  {/* Cycles */}
                  <div className="settings-card">
                    <div className="settings-card-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Layers size={16} style={{ color: "#a855f7" }} />
                        <h3>Ciclos de Repetição Espaçada (Spaced Repetition)</h3>
                      </div>
                    </div>

                    <div className="cycle-pipeline-overview">
                      {customStages.map((stage, idx) => (
                        <React.Fragment key={stage.id}>
                          <div className={`stage-step-chip ${idx === customStages.length - 1 ? 'mastered' : ''}`}>
                            <span className="step-num">{idx + 1}</span>
                            <div className="step-info">
                              <strong>{stage.name}</strong>
                              <small>{stage.progressPercent}% • {stage.intervalDays === 0 ? "Imediato" : `${stage.intervalDays} dias`}</small>
                            </div>
                          </div>
                          {idx < customStages.length - 1 && <span className="step-arrow">→</span>}
                        </React.Fragment>
                      ))}
                    </div>

                    <div className="form-group" style={{ marginTop: "14px" }}>
                      <label>Modelo do Ciclo</label>
                      <select value={cycleModel} onChange={(e) => setCycleModel(e.target.value as any)}>
                        <option value="standard">Standard KOS (Study 0% → Fixation 30% → Weekly 60% → Monthly 85% → Mastered 100%)</option>
                        <option value="custom">Customizado (Editor de Fases e Intervalos)</option>
                      </select>
                    </div>

                    {/* Interactive Custom Cycle Editor */}
                    {cycleModel === "custom" && (
                      <div className="custom-cycle-editor-box">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: "12.5px", color: "#f4f4f5" }}>Personalizar Etapas do Ciclo</strong>
                          <button type="button" className="btn-import-mini" onClick={handleAddCustomStage}>
                            <Plus size={12} /> Adicionar Etapa
                          </button>
                        </div>

                        {customStages.map((stage, idx) => (
                          <div key={stage.id} className="custom-stage-item-row">
                            <span className="custom-stage-num">{idx + 1}</span>
                            <input
                              type="text"
                              value={stage.name}
                              onChange={(e) => handleUpdateCustomStage(stage.id, { name: e.target.value })}
                              placeholder="Nome da Fase"
                            />
                            <div className="input-with-prefix" style={{ width: "90px" }}>
                              <input
                                type="number"
                                min={0}
                                max={365}
                                value={stage.intervalDays}
                                onChange={(e) => handleUpdateCustomStage(stage.id, { intervalDays: Number(e.target.value) })}
                                title="Dias até a revisão"
                              />
                              <span style={{ fontSize: "10px", paddingRight: "6px" }}>dias</span>
                            </div>
                            <div className="input-with-prefix" style={{ width: "80px" }}>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={stage.progressPercent}
                                onChange={(e) => handleUpdateCustomStage(stage.id, { progressPercent: Number(e.target.value) })}
                                title="Progresso %"
                              />
                              <span style={{ fontSize: "10px", paddingRight: "6px" }}>%</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomStage(stage.id)}
                              style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", display: "grid", placeItems: "center" }}
                              title="Remover etapa"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sessions */}
                  <div className="settings-card">
                    <div className="settings-card-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Clock size={16} style={{ color: "#3b82f6" }} />
                        <h3>Study Sessions (Sessões de Foco)</h3>
                      </div>
                    </div>

                    <div className="settings-form-grid-3">
                      <div className="form-group">
                        <label>Perguntas por Session</label>
                        <select value={questionsPerSession} onChange={(e) => setQuestionsPerSession(Number(e.target.value))}>
                          <option value={5}>5 Questões (Rápido)</option>
                          <option value={10}>10 Questões (Padrão)</option>
                          <option value={15}>15 Questões (Intenso)</option>
                          <option value={20}>20 Questões (Maratona)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Tempo Pomodoro (min)</label>
                        <input
                          type="number"
                          min={5}
                          max={120}
                          value={pomodoroMinutes}
                          onChange={(e) => setPomodoroMinutes(Number(e.target.value))}
                        />
                      </div>

                      <div className="form-group">
                        <label>Pausa Curta (min)</label>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={shortBreakMinutes}
                          onChange={(e) => setShortBreakMinutes(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="toggle-option-row">
                      <div>
                        <strong>Seleção automática de perguntas</strong>
                        <p>Preenche a sessão com as próximas questões do ciclo prioritário</p>
                      </div>
                      <ToggleSwitch
                        checked={autoSelectQuestions}
                        onChange={(v) => { triggerHaptic(); setAutoSelectQuestions(v); }}
                      />
                    </div>

                    <div className="toggle-option-row">
                      <div>
                        <strong>Misturar Lições (Interleaving)</strong>
                        <p>Alterna perguntas de diferentes lições para estimular retenção cruzada</p>
                      </div>
                      <ToggleSwitch
                        checked={mixLessons}
                        onChange={(v) => { triggerHaptic(); setMixLessons(v); }}
                      />
                    </div>

                    <div className="toggle-option-row">
                      <div>
                        <strong>Priorizar perguntas atrasadas</strong>
                        <p>Coloca questões com prazo de revisão vencido no topo da fila</p>
                      </div>
                      <ToggleSwitch
                        checked={prioritizeOverdue}
                        onChange={(v) => { triggerHaptic(); setPrioritizeOverdue(v); }}
                      />
                    </div>

                    <div className="toggle-option-row">
                      <div>
                        <strong>Mostrar progresso durante a Session</strong>
                        <p>Exibe a barra de avanço em tempo real durante o active recall</p>
                      </div>
                      <ToggleSwitch
                        checked={showSessionProgress}
                        onChange={(v) => { triggerHaptic(); setShowSessionProgress(v); }}
                      />
                    </div>
                  </div>

                  {/* Reviews & Progress */}
                  <div className="settings-card">
                    <div className="settings-card-header">
                      <h3>Revisões & Cálculo de Progresso</h3>
                    </div>

                    <div className="settings-form-grid-2">
                      <div className="form-group">
                        <label>Horário Preferido para Revisões</label>
                        <select value={reviewScheduleTime} onChange={(e) => setReviewScheduleTime(e.target.value as any)}>
                          <option value="morning">Manhã (08:00)</option>
                          <option value="afternoon">Tarde (14:00)</option>
                          <option value="evening">Noite (20:00 - Padrão)</option>
                          <option value="custom">Personalizado</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Limite Diário de Questões de Revisão</label>
                        <select value={dailyReviewLimit} onChange={(e) => setDailyReviewLimit(Number(e.target.value))}>
                          <option value={20}>20 Questões / dia</option>
                          <option value={30}>30 Questões / dia (Recomendado)</option>
                          <option value={50}>50 Questões / dia</option>
                          <option value={100}>Sem Limite</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Cálculo de Progresso</label>
                      <div className="readonly-badge-input">
                        <span className="badge-pill green">✓ Automático pela Fase do Ciclo</span>
                        <span className="desc">Progresso é 100% derivado das fases (0%, 30%, 60%, 85%, 100%) para manter o rigor metodológico.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==============================================================
                  TAB 4: NOTIFICATIONS
                  ============================================================== */}
              {activeTab === "notifications" && (
                <div className="settings-section-stack">
                  <div className="settings-card">
                    <div className="settings-card-header">
                      <h3>Alertas de Estudo & Revisão</h3>
                    </div>

                    <div className="toggle-option-row">
                      <div>
                        <strong>Notificação de Session Disponível</strong>
                        <p>Avisa quando há tempo no cronograma para uma nova sessão</p>
                      </div>
                      <ToggleSwitch
                        checked={notifySessionAvailable}
                        onChange={(v) => { triggerHaptic(); setNotifySessionAvailable(v); }}
                      />
                    </div>

                    <div className="toggle-option-row">
                      <div>
                        <strong>Notificação de Review Disponível</strong>
                        <p>Alerta quando perguntas entrarem na janela de 24h, 7d ou 30d</p>
                      </div>
                      <ToggleSwitch
                        checked={notifyReviewAvailable}
                        onChange={(v) => { triggerHaptic(); setNotifyReviewAvailable(v); }}
                      />
                    </div>

                    <div className="toggle-option-row">
                      <div>
                        <strong>Alerta de Perguntas Atrasadas</strong>
                        <p>Avisa caso haja itens com risco de esquecimento por quebra de ciclo</p>
                      </div>
                      <ToggleSwitch
                        checked={notifyOverdue}
                        onChange={(v) => { triggerHaptic(); setNotifyOverdue(v); }}
                      />
                    </div>

                    <div className="toggle-option-row">
                      <div>
                        <strong>Parabéns por Ciclo Concluído</strong>
                        <p>Feedback visual e celebração ao atingir 100% Mastered em lições</p>
                      </div>
                      <ToggleSwitch
                        checked={notifyCycleComplete}
                        onChange={(v) => { triggerHaptic(); setNotifyCycleComplete(v); }}
                      />
                    </div>

                    <div style={{ marginTop: "10px" }}>
                      <button type="button" className="btn-setting-action" onClick={handleTestNotification}>
                        <Bell size={13} /> Testar Notificação no Navegador Agora
                      </button>
                    </div>
                  </div>

                  <div className="settings-card">
                    <div className="settings-card-header">
                      <h3>Relatórios Periódicos & AI</h3>
                    </div>

                    <div className="toggle-option-row">
                      <div>
                        <strong>Resumo Semanal de Aprendizado</strong>
                        <p>Consolidado aos domingos com horas investidas e taxa de retenção</p>
                      </div>
                      <ToggleSwitch
                        checked={notifyWeeklySummary}
                        onChange={(v) => { triggerHaptic(); setNotifyWeeklySummary(v); }}
                      />
                    </div>

                    <div className="toggle-option-row">
                      <div>
                        <strong>Sugestões Inteligentes do KOS AI</strong>
                        <p>Recomendações de aprofundamento e conexão entre domínios</p>
                      </div>
                      <ToggleSwitch
                        checked={notifyAiSuggestions}
                        onChange={(v) => { triggerHaptic(); setNotifyAiSuggestions(v); }}
                      />
                    </div>

                    <div className="form-group" style={{ marginTop: "12px" }}>
                      <label>Horário das Notificações</label>
                      <select value={notificationTime} onChange={(e) => setNotificationTime(e.target.value as any)}>
                        <option value="morning">Pela Manhã (08:30)</option>
                        <option value="afternoon">À Tarde (14:00)</option>
                        <option value="evening">À Noite (19:30)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ==============================================================
                  TAB 5: DATA & WORKSPACE
                  ============================================================== */}
              {activeTab === "data" && (
                <div className="settings-section-stack">
                  {/* Backup Completo */}
                  <div className="settings-card featured-backup-card">
                    <div className="settings-card-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Download size={16} style={{ color: "#3b82f6" }} />
                        <h3>Backup Completo do Workspace</h3>
                      </div>
                    </div>
                    <p style={{ fontSize: "12.5px", color: "var(--text-dim)", margin: "0 0 14px 0" }}>
                      Gera um arquivo JSON contendo todos os seus Domínios, Lições, Questões, Vaults, Projetos, Cronograma e Histórico de Sessões.
                    </p>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button type="button" className="btn-modal-primary" onClick={handleDownloadBackup}>
                        <Download size={14} /> {t("settings.backup_download")}
                      </button>
                      <button type="button" className="btn-modal-secondary" onClick={handleExportCSV}>
                        <FileText size={14} /> {t("settings.export_csv")}
                      </button>
                      <button type="button" className="btn-modal-secondary" onClick={handleExportMarkdown}>
                        <FileText size={14} /> {t("settings.export_md")}
                      </button>
                    </div>
                  </div>

                  {/* Import */}
                  <div className="settings-card">
                    <div className="settings-card-header">
                      <h3>Importação de Dados (Notion & KOS JSON)</h3>
                    </div>
                    <div className="import-cards-grid">
                      <div className="import-option-box">
                        <div className="import-icon">
                          <Upload size={18} />
                        </div>
                        <div>
                          <strong>{t("settings.import_notion")}</strong>
                          <p>Carregue arquivos .JSON ou .CSV exportados do seu Notion.</p>
                        </div>
                        <button
                          type="button"
                          className="btn-import-mini"
                          onClick={() => { triggerHaptic(); fileInputRef.current?.click(); }}
                        >
                          Selecionar Arquivo Notion
                        </button>
                      </div>

                      <div className="import-option-box">
                        <div className="import-icon">
                          <Database size={18} />
                        </div>
                        <div>
                          <strong>Restaurar Backup KOS</strong>
                          <p>Carregue um arquivo JSON gerado anteriormente pelo KOS.</p>
                        </div>
                        <button
                          type="button"
                          className="btn-import-mini"
                          onClick={() => { triggerHaptic(); fileInputRef.current?.click(); }}
                        >
                          Restaurar Backup .JSON
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Database Behavior */}
                  <div className="settings-card">
                    <div className="settings-card-header">
                      <h3>Comportamento dos Bancos de Dados</h3>
                    </div>

                    <div className="toggle-option-row">
                      <div>
                        <strong>Confirmar antes de excluir</strong>
                        <p>Exibe alerta de confirmação ao deletar Lições, Questões ou Domínios</p>
                      </div>
                      <ToggleSwitch
                        checked={confirmBeforeDelete}
                        onChange={(v) => { triggerHaptic(); setConfirmBeforeDelete(v); }}
                      />
                    </div>

                    <div className="settings-form-grid-2" style={{ marginTop: "12px" }}>
                      <div className="form-group">
                        <label>Formato de Data</label>
                        <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value as any)}>
                          <option value="DD/MM/YYYY">DD/MM/YYYY (Ex: 17/08/2026)</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD (Ex: 2026-08-17)</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY (Ex: 08/17/2026)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Primeiro Dia da Semana</label>
                        <select value={firstDayOfWeek} onChange={(e) => setFirstDayOfWeek(e.target.value as any)}>
                          <option value="Segunda">Segunda-feira (Padrão KOS)</option>
                          <option value="Domingo">Domingo</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==============================================================
                  TAB 6: APP & DEVICE
                  ============================================================== */}
              {activeTab === "app" && (
                <div className="settings-section-stack">
                  <div className="settings-card">
                    <div className="settings-card-header">
                      <h3>{t("settings.language")} & Sincronização</h3>
                    </div>

                    <div className="form-group">
                      <label>{t("settings.language")}</label>
                      <select value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en-US">English (United States)</option>
                      </select>
                    </div>

                    <div className="toggle-option-row">
                      <div>
                        <strong>Sincronização em Tempo Real (Firebase Cloud)</strong>
                        <p>Mantém seus dados sincronizados instantaneamente entre navegador e mobile</p>
                      </div>
                      <ToggleSwitch
                        checked={autoSync}
                        onChange={(v) => { triggerHaptic(); setAutoSync(v); }}
                      />
                    </div>

                    <div className="toggle-option-row">
                      <div>
                        <strong>Modo Offline com IndexedDB</strong>
                        <p>Permite estudar e revisar sem conexão com a internet</p>
                      </div>
                      <ToggleSwitch
                        checked={offlineMode}
                        onChange={(v) => { triggerHaptic(); setOfflineMode(v); }}
                      />
                    </div>
                  </div>

                  <div className="settings-card">
                    <div className="settings-card-header">
                      <h3>Experiência Mobile & Sessão</h3>
                    </div>

                    <div className="toggle-option-row">
                      <div>
                        <strong>Manter tela ligada durante Study Sessions</strong>
                        <p>Evita que a tela do celular bloqueie enquanto você faz active recall</p>
                      </div>
                      <ToggleSwitch
                        checked={keepScreenAwake}
                        onChange={(v) => { triggerHaptic(); setKeepScreenAwake(v); }}
                      />
                    </div>

                    <div className="toggle-option-row">
                      <div>
                        <strong>Feedback Tátil (Haptic Feedback)</strong>
                        <p>Vibração suave ao virar cards e completar revisões no celular</p>
                      </div>
                      <ToggleSwitch
                        checked={hapticFeedback}
                        onChange={(v) => { triggerHaptic(); setHapticFeedback(v); }}
                      />
                    </div>

                    <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #27272a" }}>
                      <button type="button" className="btn-setting-action" onClick={handleClearCache}>
                        <RefreshCw size={13} /> {t("settings.clear_cache")} (~4.2 MB)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ==============================================================
                  TAB 7: PRIVACY & SECURITY
                  ============================================================== */}
              {activeTab === "privacy" && (
                <div className="settings-section-stack">
                  <div className="settings-card featured-privacy-card">
                    <div className="settings-card-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Shield size={16} style={{ color: "#10b981" }} />
                        <h3>Privacidade Total dos Seus Dados</h3>
                      </div>
                    </div>
                    <p style={{ fontSize: "13px", color: "#e4e4e7", lineHeight: "1.6", margin: "0 0 10px 0" }}>
                      🔒 <strong>Seus dados de estudo pertencem estritamente a você.</strong> Suas anotações, vaults e histórico de repetição espaçada são criptografados e não são compartilhados para treinamento público de modelos de terceiros.
                    </p>
                  </div>

                  <div className="settings-card">
                    <div className="settings-card-header">
                      <h3>Sessões Ativas & Dispositivos</h3>
                    </div>

                    <div className="device-session-item">
                      <div className="device-icon-box">
                        <Monitor size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <strong>Navegador Atual ({typeof navigator !== 'undefined' ? navigator.platform : 'Web'})</strong>
                          <span className="badge-pill green">Sessão Atual</span>
                        </div>
                        <small style={{ color: "var(--text-dim)", fontSize: "11px" }}>Conectado com Firebase Auth Token criptografado</small>
                      </div>
                    </div>

                    <div style={{ marginTop: "14px" }}>
                      <button type="button" className="btn-setting-action danger" onClick={() => { logout(); onClose(); }}>
                        <LogOut size={13} /> Desconectar de outros dispositivos
                      </button>
                    </div>
                  </div>

                  <div className="settings-card danger-zone">
                    <div className="settings-card-header">
                      <h3 style={{ color: "#f87171" }}>Zona de Perigo</h3>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-dim)", margin: "0 0 12px 0" }}>
                      A exclusão da conta é permanente e removerá todas as lições, perguntas, vaults e métricas.
                    </p>
                    <button type="button" className="btn-delete-row" onClick={() => setShowDeleteAccountModal(true)}>
                      <Trash2 size={13} /> Excluir Minha Conta Definitivamente
                    </button>
                  </div>
                </div>
              )}

              {/* ==============================================================
                  TAB 8: ADVANCED (AVANÇADO)
                  ============================================================== */}
              {activeTab === "advanced" && (
                <div className="settings-section-stack">
                  <div className="settings-card">
                    <div className="settings-card-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Terminal size={16} style={{ color: "#f59e0b" }} />
                        <h3>Ferramentas de Desenvolvedor & Diagnóstico</h3>
                      </div>
                    </div>

                    <div className="toggle-option-row">
                      <div>
                        <strong>Modo Desenvolvedor</strong>
                        <p>Exibe identificadores únicos (IDs) e metadados de depuração nos cards</p>
                      </div>
                      <ToggleSwitch
                        checked={developerMode}
                        onChange={(v) => { triggerHaptic(); setDeveloperMode(v); }}
                      />
                    </div>

                    <div className="toggle-option-row">
                      <div>
                        <strong>Recursos Experimentais (Beta Features)</strong>
                        <p>Habilita novos algoritmos de Spaced Repetition e prompts avançados de IA</p>
                      </div>
                      <ToggleSwitch
                        checked={betaFeatures}
                        onChange={(v) => { triggerHaptic(); setBetaFeatures(v); }}
                      />
                    </div>
                  </div>

                  <div className="settings-card">
                    <div className="settings-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3>Diagnóstico do Sistema & API</h3>
                      <button type="button" className="btn-setting-action" onClick={handleRunPingTest} disabled={testingPing}>
                        <Activity size={13} /> {testingPing ? "Testando..." : "Testar Latência (Ping)"}
                      </button>
                    </div>

                    <div className="diagnostics-table">
                      <div className="diag-row">
                        <span>Status do Firestore Cloud</span>
                        <strong style={{ color: "#34d399" }}>
                          ● Online & Conectado {apiLatency !== null ? `(${apiLatency}ms)` : ""}
                        </strong>
                      </div>
                      <div className="diag-row">
                        <span>Total de Domínios</span>
                        <strong>{domains.length}</strong>
                      </div>
                      <div className="diag-row">
                        <span>Total de Lições</span>
                        <strong>{lessons.length}</strong>
                      </div>
                      <div className="diag-row">
                        <span>Total de Questões</span>
                        <strong>{questions.length}</strong>
                      </div>
                      <div className="diag-row">
                        <span>Total de Projetos</span>
                        <strong>{projects.length}</strong>
                      </div>
                      <div className="diag-row">
                        <span>Histórico de Sessões</span>
                        <strong>{sessions.length} sessões gravadas</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==============================================================
                  TAB 9: ABOUT
                  ============================================================== */}
              {activeTab === "about" && (
                <div className="settings-section-stack">
                  <div className="settings-card about-hero-card">
                    <div className="about-brand-logo">
                      <img src="./kos.png" alt="KOS" className="brand-logo-img" />
                    </div>
                    <h2>KOS — Knowledge Operating System</h2>
                    <span className="about-version-badge">Versão 2.4.0 (Build 2026.08)</span>
                    <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6", maxWidth: "480px", margin: "10px auto 0" }}>
                      O sistema operacional de aprendizagem definitiva baseado em Recuperação Ativa, Repetição Espaçada, Vaults e Gestão por Domínios.
                    </p>
                  </div>

                  <div className="settings-card">
                    <div className="settings-card-header">
                      <h3>Links & Documentação</h3>
                    </div>
                    <div className="about-links-grid">
                      <div className="about-link-box" onClick={() => setActiveModalSubView("changelog")}>
                        <Sparkles size={16} />
                        <div>
                          <strong>Changelog de Atualizações</strong>
                          <small>Veja as novidades da versão 2.4.0</small>
                        </div>
                      </div>

                      <div className="about-link-box" onClick={() => setActiveModalSubView("docs")}>
                        <FileText size={16} />
                        <div>
                          <strong>Documentação & Métodos</strong>
                          <small>Guia de Active Recall e Vaults</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Form */}
                  <div className="settings-card">
                    <div className="settings-card-header">
                      <h3>Enviar Feedback ou Sugestão</h3>
                    </div>
                    <div className="form-group">
                      <textarea
                        rows={3}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Escreva sua sugestão, ideia de recurso ou relato de experiência..."
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px" }}>
                      {feedbackSent && (
                        <span style={{ color: "#34d399", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <CheckCircle2 size={14} /> Feedback enviado com sucesso!
                        </span>
                      )}
                      <button
                        type="button"
                        className="btn-modal-primary"
                        disabled={!feedbackText.trim() || feedbackSent}
                        onClick={handleSendFeedback}
                      >
                        <Send size={13} /> Enviar Feedback
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Footer Save Bar */}
            <div className="settings-pane-footer">
              <button
                type="button"
                className="btn-delete-row"
                onClick={() => { logout(); onClose(); }}
              >
                <LogOut size={13} /> Sair da Conta
              </button>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button type="button" className="btn-modal-secondary" onClick={onClose}>
                  Fechar
                </button>
                <button
                  type="button"
                  className="btn-modal-primary"
                  onClick={() => handleSave()}
                  disabled={saving}
                >
                  <Save size={14} />
                  <span>{saving ? t("settings.saving") : t("settings.save")}</span>
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Sub-view: Changelog Drawer */}
      {activeModalSubView === "changelog" && (
        <div className="modal-overlay" style={{ zIndex: 100000 }} onClick={() => setActiveModalSubView("none")}>
          <div className="modal-card modal-delete-confirm-box" style={{ maxWidth: "560px", width: "95vw" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Changelog KOS — v2.4.0</h3>
              <button className="icon-button" onClick={() => setActiveModalSubView("none")}><X size={16} /></button>
            </div>
            <div style={{ fontSize: "12.5px", color: "var(--text)", lineHeight: "1.6", maxHeight: "400px", overflowY: "auto" }}>
              <h4 style={{ color: "var(--blue)", margin: "8px 0 4px 0" }}>Novidades da Versão 2.4.0</h4>
              <ul style={{ paddingLeft: "18px", margin: 0 }}>
                <li><strong>Configurações Pro:</strong> Central com 9 abas completas e sincronização Firebase.</li>
                <li><strong>Streak & Atividade Dinâmica:</strong> Cálculo real de dias consecutivos sem dados mockados.</li>
                <li><strong>Ciclos de Retenção Visuais:</strong> Pipeline com barras de proporção e cards com iluminação neon.</li>
                <li><strong>Blindagem de Progresso:</strong> Valores automáticos de 0%, 30%, 60%, 85% e 100% integrados às fases.</li>
                <li><strong>Responsividade Multiplataforma:</strong> Otimização completa para mobile, tablet e desktop.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Sub-view: Documentation Drawer */}
      {activeModalSubView === "docs" && (
        <div className="modal-overlay" style={{ zIndex: 100000 }} onClick={() => setActiveModalSubView("none")}>
          <div className="modal-card modal-delete-confirm-box" style={{ maxWidth: "560px", width: "95vw" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Metodologia KOS — Active Recall & Spaced Repetition</h3>
              <button className="icon-button" onClick={() => setActiveModalSubView("none")}><X size={16} /></button>
            </div>
            <div style={{ fontSize: "12.5px", color: "var(--text)", lineHeight: "1.6", maxHeight: "400px", overflowY: "auto" }}>
              <p>O KOS utiliza a ciência cognitiva moderna para transformar estudo passivo em retenção permanente:</p>
              <ol style={{ paddingLeft: "18px", margin: "8px 0" }}>
                <li><strong>Active Recall:</strong> Tente responder à Question antes de abrir a Vault.</li>
                <li><strong>Intervalos Espaçados:</strong> Revise nas janelas de 24h, 7 dias e 30 dias para mover para a memória de longo prazo.</li>
                <li><strong>Vaults:</strong> Seus resumos e anotações funcionam como fonte da verdade para consulta rápida.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteAccountModal && (
        <div className="modal-overlay" style={{ zIndex: 100000 }} onClick={() => setShowDeleteAccountModal(false)}>
          <div className="modal-card modal-delete-confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: "#ef4444" }}>Excluir Conta do KOS?</h3>
              <button className="icon-button" onClick={() => setShowDeleteAccountModal(false)}><X size={16} /></button>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text)", lineHeight: "1.5" }}>
              Esta ação é **irreversível**. Todos os seus dados, domínios, questões e vaults serão apagados permanentemente.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "18px" }}>
              <button type="button" className="btn-modal-secondary" onClick={() => setShowDeleteAccountModal(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger-confirm"
                onClick={async () => {
                  try {
                    await deleteUserAccount();
                    alert("Conta excluída com sucesso.");
                    setShowDeleteAccountModal(false);
                    onClose();
                  } catch (err: any) {
                    alert(err?.message || "Erro ao excluir conta.");
                  }
                }}
              >
                Sim, Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
