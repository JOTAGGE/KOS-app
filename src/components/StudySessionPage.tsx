import React, { useState, useEffect, useMemo } from "react";
import {
  Clock, Flame, Play, Pause, RefreshCw, Zap, Coffee, Timer,
  BookOpen, CheckCircle2, CircleHelp, Sparkles, Plus, Trash2,
  ExternalLink, Bot, Layers, ArrowRight, X, Check, Copy, CheckCheck,
  CalendarDays, CheckCircle, AlertCircle, Award, ChevronDown, ChevronRight
} from "lucide-react";
import type {
  Question, Vault, Domain, Lesson, CronoDayAllocation,
  VaultConnection, VaultSource, VaultAILesson, DayOfWeek, SessionRecord
} from "../types";
import { sampleVault } from "../data/mock";
import { useAuth } from "../firebase/authContext";
import { StudySessionHistoryModal } from "./StudySessionHistoryModal";

const DAY_INDEX_MAP: Record<number, DayOfWeek> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};

const ALL_DAYS: DayOfWeek[] = [
  "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"
];

export function StudySessionPage({
  questions,
  domains,
  lessons,
  schedule,
  sessions = [],
  initialQuestionId,
  onCompleteSession,
  onQuestionClick,
  onLessonClick,
}: {
  questions: Question[];
  domains: Domain[];
  lessons: Lesson[];
  schedule: CronoDayAllocation[];
  sessions?: SessionRecord[];
  initialQuestionId?: string;
  onCompleteSession: (params: {
    question: Question;
    durationMinutes: number;
    mode: "pomodoro" | "stopwatch";
    updatedVault: Vault;
    advanceStage: boolean;
  }) => void;
  onQuestionClick?: (q: Question) => void;
  onLessonClick?: (l: Lesson) => void;
}) {
  const { userProfile } = useAuth();
  const prefPomodoroMins = userProfile?.preferences?.pomodoroMinutes || 25;
  const prefBreakMins = userProfile?.preferences?.shortBreakMinutes || 5;

  // Real current day of the week
  const todayRealDay: DayOfWeek = DAY_INDEX_MAP[new Date().getDay()] || "Segunda";
  const [selectedCronoDay, setSelectedCronoDay] = useState<DayOfWeek>(todayRealDay);
  const [showMasteredForLesson, setShowMasteredForLesson] = useState<Record<string, boolean>>({});
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Timer State
  const [timerMode, setTimerMode] = useState<"pomodoro" | "stopwatch">("pomodoro");
  const [pomodoroDuration, setPomodoroDuration] = useState<number>(prefPomodoroMins * 60);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(prefPomodoroMins * 60);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isBreak, setIsBreak] = useState<boolean>(false);

  // Question Picker State (Organized, no giant endless list)
  const [pickerTab, setPickerTab] = useState<"crono_today" | "cascade" | "reviews">("crono_today");
  const [filterDomain, setFilterDomain] = useState<string>(domains[0]?.name || "");
  const [filterLesson, setFilterLesson] = useState<string>("");

  const [selectedQId, setSelectedQId] = useState<string>(initialQuestionId || questions[0]?.id || "");
  const currentQuestion = questions.find(q => q.id === selectedQId) || questions[0];

  // Helper to parse strings or string arrays safely
  const parseToArray = (val: string | string[] | undefined): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return [val];
  };

  // Live Vault Fields (Supporting Multiple Insights, Doubts, AI Lessons, Highlights, Examples, Applications!)
  const [learning, setLearning] = useState(currentQuestion?.vault?.learning || sampleVault.learning);
  const [answer, setAnswer] = useState(currentQuestion?.vault?.answer || sampleVault.answer);
  const [notes, setNotes] = useState(currentQuestion?.vault?.notes || sampleVault.notes || "");
  
  // Interactive Tag Arrays
  const [highlights, setHighlights] = useState<string[]>(currentQuestion?.vault?.highlights || sampleVault.highlights);
  const [newHighlightInput, setNewHighlightInput] = useState("");

  const [examples, setExamples] = useState<string[]>(currentQuestion?.vault?.examples || sampleVault.examples);
  const [newExampleInput, setNewExampleInput] = useState("");

  const [applications, setApplications] = useState<string[]>(currentQuestion?.vault?.applications || sampleVault.applications);
  const [newApplicationInput, setNewApplicationInput] = useState("");

  // Multiple Insights & Multiple Doubts
  const [insightsList, setInsightsList] = useState<string[]>(parseToArray(currentQuestion?.vault?.insights || sampleVault.insights));
  const [newInsightInput, setNewInsightInput] = useState("");

  const [doubtsList, setDoubtsList] = useState<string[]>(parseToArray(currentQuestion?.vault?.doubts || sampleVault.doubts));
  const [newDoubtInput, setNewDoubtInput] = useState("");

  // Multiple AI Lessons
  const [aiLessonsList, setAiLessonsList] = useState<VaultAILesson[]>(currentQuestion?.vault?.aiLessons || sampleVault.aiLessons || []);
  const [newAiModel, setNewAiModel] = useState("Gemini 1.5 Pro (Google)");
  const [newAiTopic, setNewAiTopic] = useState("");
  const [newAiContent, setNewAiContent] = useState("");

  const [thirtySeconds, setThirtySeconds] = useState(currentQuestion?.vault?.activeReview?.thirtySeconds || sampleVault.activeReview.thirtySeconds);

  // Sync state on question change
  useEffect(() => {
    if (currentQuestion) {
      const v = currentQuestion.vault || sampleVault;
      setLearning(v.learning || "");
      setAnswer(v.answer || "");
      setNotes(v.notes || "");
      setHighlights(v.highlights || []);
      setExamples(v.examples || []);
      setApplications(v.applications || []);
      setInsightsList(parseToArray(v.insights));
      setDoubtsList(parseToArray(v.doubts));
      setAiLessonsList(v.aiLessons || []);
      setThirtySeconds(v.activeReview?.thirtySeconds || "");
    }
  }, [currentQuestion?.id]);

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        if (timerMode === "pomodoro") {
          setSecondsRemaining(prev => {
            if (prev <= 1) {
              setIsRunning(false);
              return 0;
            }
            return prev - 1;
          });
        } else {
          setStopwatchSeconds(prev => prev + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timerMode]);

  const toggleTimer = () => setIsRunning(prev => !prev);

  const resetTimer = () => {
    setIsRunning(false);
    if (timerMode === "pomodoro") {
      setSecondsRemaining(pomodoroDuration);
    } else {
      setStopwatchSeconds(0);
    }
  };

  const handleSetPomodoroPreset = (mins: number, isBreakMode: boolean = false) => {
    setIsRunning(false);
    setIsBreak(isBreakMode);
    setPomodoroDuration(mins * 60);
    setSecondsRemaining(mins * 60);
    setTimerMode("pomodoro");
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Highlights Tag Handlers
  const handleAddHighlight = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && "key" in e && e.key !== "Enter") return;
    if (!newHighlightInput.trim()) return;
    if (!highlights.includes(newHighlightInput.trim())) {
      setHighlights(prev => [...prev, newHighlightInput.trim()]);
    }
    setNewHighlightInput("");
  };

  const handleRemoveHighlight = (item: string) => {
    setHighlights(prev => prev.filter(h => h !== item));
  };

  // Examples Tag Handlers
  const handleAddExample = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && "key" in e && e.key !== "Enter") return;
    if (!newExampleInput.trim()) return;
    if (!examples.includes(newExampleInput.trim())) {
      setExamples(prev => [...prev, newExampleInput.trim()]);
    }
    setNewExampleInput("");
  };

  const handleRemoveExample = (item: string) => {
    setExamples(prev => prev.filter(ex => ex !== item));
  };

  // Applications Tag Handlers
  const handleAddApplication = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && "key" in e && e.key !== "Enter") return;
    if (!newApplicationInput.trim()) return;
    if (!applications.includes(newApplicationInput.trim())) {
      setApplications(prev => [...prev, newApplicationInput.trim()]);
    }
    setNewApplicationInput("");
  };

  const handleRemoveApplication = (item: string) => {
    setApplications(prev => prev.filter(a => a !== item));
  };

  // Insights Handlers
  const handleAddInsight = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && "key" in e && e.key !== "Enter") return;
    if (!newInsightInput.trim()) return;
    setInsightsList(prev => [...prev, newInsightInput.trim()]);
    setNewInsightInput("");
  };

  const handleRemoveInsight = (index: number) => {
    setInsightsList(prev => prev.filter((_, i) => i !== index));
  };

  // Doubts Handlers
  const handleAddDoubt = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && "key" in e && e.key !== "Enter") return;
    if (!newDoubtInput.trim()) return;
    setDoubtsList(prev => [...prev, newDoubtInput.trim()]);
    setNewDoubtInput("");
  };

  const handleRemoveDoubt = (index: number) => {
    setDoubtsList(prev => prev.filter((_, i) => i !== index));
  };

  // Multiple AI Lessons Handlers
  const handleAddAiLesson = () => {
    if (!newAiContent.trim()) return;
    setAiLessonsList(prev => [
      ...prev,
      {
        id: `ai-${Date.now()}`,
        aiModel: newAiModel,
        topic: newAiTopic.trim() || currentQuestion.title,
        content: newAiContent.trim(),
        date: "Hoje na Sessão",
      }
    ]);
    setNewAiTopic("");
    setNewAiContent("");
  };

  const handleRemoveAiLesson = (index: number) => {
    setAiLessonsList(prev => prev.filter((_, i) => i !== index));
  };

  // Deduplicate and get lessons allocated for the selected day in Crono
  const currentDayLessons = useMemo(() => {
    const alloc = schedule.find(s => s.day === selectedCronoDay);
    if (!alloc) return [];
    const uniqueIds = Array.from(new Set(alloc.lessonIds));
    return uniqueIds
      .map(id => lessons.find(l => l.id === id))
      .filter(Boolean) as Lesson[];
  }, [schedule, selectedCronoDay, lessons]);

  // Lessons of the day with STRICT matching of their questions, identifying unmastered questions & their cycle stages
  const todayLessonsWithQuestions = useMemo(() => {
    return currentDayLessons.map(l => {
      // Strict matching by lesson name to prevent duplicate cross-lesson contamination
      const allLessonQuestions = questions.filter(q =>
        q.lesson.trim().toLowerCase() === l.name.trim().toLowerCase()
      );

      const pendingQuestions = allLessonQuestions.filter(q => q.stage !== "mastered");
      const masteredQuestions = allLessonQuestions.filter(q => q.stage === "mastered");

      return {
        lesson: l,
        allQuestions: allLessonQuestions,
        pendingQuestions,
        masteredQuestions,
        nextQuestion: pendingQuestions[0] || allLessonQuestions[0],
        allMastered: allLessonQuestions.length > 0 && pendingQuestions.length === 0,
      };
    });
  }, [currentDayLessons, questions]);

  const totalPendingQuestionsInDay = todayLessonsWithQuestions.reduce((acc, item) => acc + item.pendingQuestions.length, 0);

  // Filtered by domain & lesson cascade
  const availableLessonsInDomain = lessons.filter(l => l.domain.toLowerCase() === filterDomain.toLowerCase());
  const effectiveLessonName = filterLesson || availableLessonsInDomain[0]?.name || "";
  const cascadeQuestions = questions.filter(q =>
    q.domain.toLowerCase() === filterDomain.toLowerCase() &&
    (!effectiveLessonName || q.lesson.toLowerCase() === effectiveLessonName.toLowerCase())
  );

  // Pending Reviews Questions
  const reviewQuestions = questions.filter(q => q.stage === "fixation" || q.stage === "weekly" || q.stage === "study");

  const handleFinishAndSaveVault = () => {
    if (!currentQuestion) return;

    const durationMins = timerMode === "pomodoro"
      ? Math.max(1, Math.round((pomodoroDuration - secondsRemaining) / 60))
      : Math.max(1, Math.round(stopwatchSeconds / 60));

    const updatedVault: Vault = {
      learning: learning.trim(),
      answer: answer.trim(),
      notes: notes.trim(),
      highlights,
      examples,
      applications,
      insights: insightsList,
      doubts: doubtsList,
      connections: currentQuestion.vault?.connections || sampleVault.connections,
      sources: currentQuestion.vault?.sources || sampleVault.sources,
      aiLessons: aiLessonsList,
      activeReview: {
        what: learning.trim(),
        how: answer.trim(),
        why: "Para consolidar e aplicar no mundo real com maestria.",
        where: currentQuestion.module,
        connections: highlights.join(", "),
        thirtySeconds: thirtySeconds.trim(),
      },
    };

    onCompleteSession({
      question: currentQuestion,
      durationMinutes: durationMins,
      mode: timerMode,
      updatedVault,
      advanceStage: true,
    });

    setIsRunning(false);
  };

  const getStageLabel = (st: string) => {
    switch (st) {
      case "study": return "Study (1º Estudo)";
      case "fixation": return "Fixation (24-48h)";
      case "weekly": return "Weekly (7d)";
      case "monthly": return "Monthly (30d)";
      case "mastered": return "Mastered (100%)";
      default: return st;
    }
  };

  if (!currentQuestion || questions.length === 0) {
    return (
      <div className="study-session-page">
        <div className="session-header-banner">
          <div>
            <span className="spark-badge"><Sparkles size={13} /> SESSÃO DE ESTUDO ATIVO</span>
            <h1>Study Session & Cronômetro Pomodoro</h1>
            <p>Seu sistema KOS está pronto e limpo para novos estudos.</p>
          </div>
        </div>
        <div className="empty-state-box" style={{ padding: "50px 20px", textAlign: "center", background: "var(--card)", borderRadius: "8px", border: "1px dashed var(--line)", margin: "20px 0" }}>
          <Clock size={36} style={{ color: "var(--text-dim)", marginBottom: "14px" }} />
          <h3 style={{ color: "#fff", marginBottom: "8px" }}>Nenhuma Question Cadastrada</h3>
          <p style={{ color: "var(--text-dim)", maxWidth: "460px", margin: "0 auto 20px", fontSize: "13px" }}>
            Cadastre um Domínio, Lição e Perguntas ou converse com o KOS AI para gerar suas primeiras questões e iniciar o cronômetro com a Vault.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="study-session-page">
      <div className="session-header-banner">
        <div>
          <span className="spark-badge"><Sparkles size={13} /> SESSÃO DE ESTUDO ATIVO</span>
          <h1>Study Session & Preenchimento da Vault</h1>
          <p>
            Hoje é <strong>{todayRealDay}</strong>. O sistema localiza as lessons do dia no Crono e lista as <strong>próximas questions não concluídas</strong> e suas fases de retenção.
          </p>
        </div>

        <button
          type="button"
          className="btn-session-history"
          onClick={() => setHistoryModalOpen(true)}
          title="Abrir Histórico de Sessões de Estudo"
        >
          <Award size={14} />
          <span>Histórico de Sessões ({sessions.length})</span>
        </button>
      </div>

      <div className="session-layout-grid">
        {/* LEFT COLUMN: TIMER & QUESTION SELECTION */}
        <div className="session-timer-card">
          {/* Timer Mode Buttons */}
          <div className="timer-mode-segmented">
            <button
              className={timerMode === "pomodoro" && !isBreak && pomodoroDuration === prefPomodoroMins * 60 ? "active" : ""}
              onClick={() => handleSetPomodoroPreset(prefPomodoroMins, false)}
            >
              <Flame size={13} /> Pomodoro ({prefPomodoroMins}m)
            </button>
            <button
              className={timerMode === "pomodoro" && pomodoroDuration === 50 * 60 ? "active" : ""}
              onClick={() => handleSetPomodoroPreset(50, false)}
            >
              <Zap size={13} /> Deep Work (50m)
            </button>
            <button
              className={isBreak ? "active" : ""}
              onClick={() => handleSetPomodoroPreset(prefBreakMins, true)}
            >
              <Coffee size={13} /> Pausa ({prefBreakMins}m)
            </button>
            <button
              className={timerMode === "stopwatch" ? "active" : ""}
              onClick={() => { setIsRunning(false); setTimerMode("stopwatch"); }}
            >
              <Timer size={13} /> Livre
            </button>
          </div>

          {/* Clock Digits Display */}
          <div className="timer-display-box">
            <div className={`timer-clock-digits ${isRunning ? "running" : ""}`}>
              {timerMode === "pomodoro" ? formatTime(secondsRemaining) : formatTime(stopwatchSeconds)}
            </div>
            <div className="timer-status-caption">
              {isRunning
                ? (isBreak ? "☕ Intervalo de descanso..." : "🔥 Foco Total • Estudando Question...")
                : "Pausado / Pronto para iniciar foco"}
            </div>
          </div>

          <div className="timer-actions-row">
            <button className={`timer-btn-main ${isRunning ? "running" : ""}`} onClick={toggleTimer}>
              {isRunning ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
              <span>{isRunning ? "Pausar" : "Iniciar Foco"}</span>
            </button>
            <button className="timer-btn-secondary" onClick={resetTimer} title="Resetar Timer">
              <RefreshCw size={16} />
            </button>
            {timerMode === "pomodoro" && (
              <button className="timer-btn-secondary" onClick={() => setSecondsRemaining(p => p + 300)} title="+5 minutos">
                +5m
              </button>
            )}
          </div>

          {/* ORGANIZED QUESTION PICKER (Tabs & Cascades) */}
          <div className="session-question-selector-box">
            <label className="selector-label"><Layers size={14} /> ESCOLHER QUESTION DO DIA:</label>

            <div className="picker-tabs-bar">
              <button
                className={`picker-tab-btn ${pickerTab === "crono_today" ? "active" : ""}`}
                onClick={() => setPickerTab("crono_today")}
              >
                📅 Do Crono ({totalPendingQuestionsInDay} para hoje)
              </button>
              <button
                className={`picker-tab-btn ${pickerTab === "cascade" ? "active" : ""}`}
                onClick={() => setPickerTab("cascade")}
              >
                ◈ Por Domínio & Lesson
              </button>
              <button
                className={`picker-tab-btn ${pickerTab === "reviews" ? "active" : ""}`}
                onClick={() => setPickerTab("reviews")}
              >
                ↻ Para Revisar ({reviewQuestions.length})
              </button>
            </div>

            {/* TAB 1: DO CRONO DO DIA ATUAL (STRICT LESSON & NEXT UNMASTERED QUESTIONS) */}
            {pickerTab === "crono_today" && (
              <div className="picker-crono-today-container">
                {/* Horizontal Day Selector Pills Bar */}
                <div className="day-selector-pills-bar">
                  {ALL_DAYS.map(day => {
                    const isCurrentRealDay = day === todayRealDay;
                    const isSelected = day === selectedCronoDay;
                    return (
                      <button
                        key={day}
                        type="button"
                        className={`day-selector-pill ${isSelected ? "selected" : ""} ${isCurrentRealDay ? "is-today" : ""}`}
                        onClick={() => setSelectedCronoDay(day)}
                      >
                        <span>{day}</span>
                        {isCurrentRealDay && <span className="today-dot-mini">• Hoje</span>}
                      </button>
                    );
                  })}
                </div>

                <div className="picker-options-list-grouped">
                  {todayLessonsWithQuestions.length > 0 ? (
                    todayLessonsWithQuestions.map(({ lesson, allQuestions, pendingQuestions, masteredQuestions, nextQuestion, allMastered }) => {
                      const showMastered = !!showMasteredForLesson[lesson.id];

                      return (
                        <div key={lesson.id} className="lesson-day-group-card">
                          {/* Lesson Group Header */}
                          <div className="lesson-group-head">
                            <div className="lesson-group-title">
                              <span className="lesson-icon">▦</span>
                              <div>
                                <strong>{lesson.name}</strong>
                                <small>{lesson.domain} • {lesson.category}</small>
                              </div>
                            </div>
                            <span className="lesson-count-badge">
                              {pendingQuestions.length} pendentes / {allQuestions.length} total
                            </span>
                          </div>

                          {/* List of Pending Questions to Study Today */}
                          <div className="lesson-questions-items-list">
                            {pendingQuestions.map((q, idx) => {
                              const isSelected = q.id === selectedQId;
                              const isNext = q.id === nextQuestion?.id;

                              return (
                                <div
                                  key={q.id}
                                  className={`picker-q-item ${isSelected ? "selected" : ""} ${isNext ? "is-next-in-cycle" : ""}`}
                                  onClick={() => setSelectedQId(q.id)}
                                >
                                  <span className="q-item-icon">
                                    {isSelected ? <Check size={14} /> : "□"}
                                  </span>

                                  <div className="q-item-body">
                                    <div className="q-title-row">
                                      <strong>{q.title}</strong>
                                      {isNext && <span className="next-focus-badge">✨ Próxima a Estudar</span>}
                                    </div>
                                    <div className="q-meta-line">
                                      <span className={`stage-tag-mini stage-${q.stage}`}>{getStageLabel(q.stage)}</span>
                                      <span className="dot">•</span>
                                      <span className="q-retention-pill">Retenção: {q.progress}%</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {/* All questions mastered in this lesson */}
                            {allMastered && (
                              <div className="lesson-all-mastered-box">
                                <CheckCircle size={14} style={{ color: "#10b981" }} />
                                <span>Todas as {allQuestions.length} questions desta lição já foram dominadas (100%)!</span>
                              </div>
                            )}

                            {allQuestions.length === 0 && (
                              <p className="empty-subtext" style={{ padding: "8px 10px" }}>
                                Nenhuma pergunta cadastrada para esta lição.
                              </p>
                            )}

                            {/* Collapsible section for already mastered questions */}
                            {masteredQuestions.length > 0 && (
                              <div className="mastered-toggle-wrapper">
                                <button
                                  type="button"
                                  className="btn-toggle-mastered"
                                  onClick={() => setShowMasteredForLesson(p => ({ ...p, [lesson.id]: !p[lesson.id] }))}
                                >
                                  {showMastered ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                  <span>{showMastered ? "Ocultar" : "Ver"} {masteredQuestions.length} já dominadas</span>
                                </button>

                                {showMastered && (
                                  <div className="mastered-questions-sublist">
                                    {masteredQuestions.map(q => (
                                      <div
                                        key={q.id}
                                        className={`picker-q-item mastered-q ${q.id === selectedQId ? "selected" : ""}`}
                                        onClick={() => setSelectedQId(q.id)}
                                      >
                                        <span className="q-item-icon">
                                          <CheckCircle size={13} style={{ color: "#10b981" }} />
                                        </span>
                                        <div className="q-item-body">
                                          <strong>{q.title}</strong>
                                          <small style={{ color: "#10b981" }}>✓ Dominada (100%)</small>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty-crono-day-box">
                      <CalendarDays size={20} />
                      <p>Nenhuma lesson alocada para <strong>{selectedCronoDay}</strong> no Crono Semanal.</p>
                      <small>Vá até a página do Crono para agendar lições para este dia.</small>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Por Domínio & Lesson (Cascade) */}
            {pickerTab === "cascade" && (
              <div className="picker-cascade-container">
                <div className="cascade-selectors-row">
                  <select
                    value={filterDomain}
                    onChange={(e) => {
                      setFilterDomain(e.target.value);
                      const firstLes = lessons.find(l => l.domain.toLowerCase() === e.target.value.toLowerCase());
                      setFilterLesson(firstLes?.name || "");
                    }}
                  >
                    {domains.map(d => <option key={d.id} value={d.name}>{d.icon} {d.name}</option>)}
                  </select>

                  <select
                    value={effectiveLessonName}
                    onChange={(e) => setFilterLesson(e.target.value)}
                  >
                    {availableLessonsInDomain.map(l => (
                      <option key={l.id} value={l.name}>▦ {l.name}</option>
                    ))}
                  </select>
                </div>

                <div className="picker-options-list">
                  {cascadeQuestions.map(q => (
                    <div
                      key={q.id}
                      className={`picker-q-item ${q.id === selectedQId ? "selected" : ""}`}
                      onClick={() => setSelectedQId(q.id)}
                    >
                      <span className="q-item-icon">{q.id === selectedQId ? <Check size={13} /> : "□"}</span>
                      <div className="q-item-body">
                        <strong>{q.title}</strong>
                        <small>{q.module}</small>
                      </div>
                      <span className={`stage-tag-mini stage-${q.stage}`}>{q.stage}</span>
                    </div>
                  ))}
                  {cascadeQuestions.length === 0 && (
                    <p className="empty-subtext">Nenhuma question nesta lesson.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Para Revisar */}
            {pickerTab === "reviews" && (
              <div className="picker-options-list">
                {reviewQuestions.map(q => (
                  <div
                    key={q.id}
                    className={`picker-q-item ${q.id === selectedQId ? "selected" : ""}`}
                    onClick={() => setSelectedQId(q.id)}
                  >
                    <span className="q-item-icon">{q.id === selectedQId ? <Check size={13} /> : "↻"}</span>
                    <div className="q-item-body">
                      <strong>{q.title}</strong>
                      <small>{q.domain} • {q.lesson}</small>
                    </div>
                    <span className={`stage-tag-mini stage-${q.stage}`}>{q.stage}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Question Detail Card */}
            {currentQuestion && (
              <div className="selected-q-preview">
                <div className="preview-top">
                  <span className="domain-tag">{currentQuestion.domain}</span>
                  <span className="dot">•</span>
                  <span>{currentQuestion.lesson}</span>
                  <span className="dot">•</span>
                  <span className="module-pill">{currentQuestion.module}</span>
                  <span className="dot">•</span>
                  <span className="stage-pill">Fase: {getStageLabel(currentQuestion.stage)}</span>
                </div>
                <strong>{currentQuestion.title}</strong>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE VAULT FILLING */}
        <div className="session-vault-live-card">
          <div className="vault-live-header">
            <div className="vault-live-title">
              <BookOpen size={18} />
              <div>
                <h3>Preenchimento da Vault da Question</h3>
                <small>Adicione múltiplos insights, dúvidas, explicações de IA e conceitos em tempo real.</small>
              </div>
            </div>

            <button className="finish-session-btn" onClick={handleFinishAndSaveVault}>
              <CheckCircle2 size={16} /> Concluir Sessão & Salvar Vault
            </button>
          </div>

          <div className="vault-live-form">
            {/* 📖 Aprendizado Central */}
            <div className="live-field-group">
              <label>📖 Aprendizado Central (O que você precisa fixar e lembrar?)</label>
              <textarea
                rows={2}
                value={learning}
                onChange={(e) => setLearning(e.target.value)}
                placeholder="Escreva em suas próprias palavras a ideia central..."
              />
            </div>

            {/* 🧠 Answer / Síntese Profunda */}
            <div className="live-field-group">
              <label>🧠 Answer / Síntese Profunda (O que é · como funciona · por que existe)</label>
              <textarea
                rows={3}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Explique a resposta detalhada e como os componentes interagem..."
              />
            </div>

            {/* 📝 Notas & Sínteses Rápidas */}
            <div className="live-field-group">
              <label>📝 Notas & Sínteses Rápidas (Anotações livres e observações)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Registre notas soltas, referências mentais ou raciocínio de estudo..."
              />
            </div>

            {/* 🔖 DESTAQUES (Interactive Tag Adder) */}
            <div className="live-field-group">
              <label>🔖 Destaques & Modelos (Adicione termos, fórmulas, conceitos)</label>
              <div className="interactive-tags-box">
                <div className="tags-chips-wrap">
                  {highlights.map((h, i) => (
                    <span key={i} className="interactive-chip highlight-chip">
                      🔖 {h}
                      <button type="button" onClick={() => handleRemoveHighlight(h)}><X size={11} /></button>
                    </span>
                  ))}
                </div>
                <div className="tag-input-row">
                  <input
                    type="text"
                    value={newHighlightInput}
                    onChange={(e) => setNewHighlightInput(e.target.value)}
                    onKeyDown={handleAddHighlight}
                    placeholder="Digite um destaque e pressione Enter ou clique +"
                  />
                  <button type="button" className="btn-tag-add" onClick={handleAddHighlight}>
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* 🌎 EXEMPLOS PRÁTICOS (Interactive Tag Adder) */}
            <div className="live-field-group">
              <label>🌎 Exemplos Práticos (Vida real, tecnologia, analogias)</label>
              <div className="interactive-tags-box">
                <div className="tags-chips-wrap">
                  {examples.map((ex, i) => (
                    <span key={i} className="interactive-chip example-chip">
                      🌎 {ex}
                      <button type="button" onClick={() => handleRemoveExample(ex)}><X size={11} /></button>
                    </span>
                  ))}
                </div>
                <div className="tag-input-row">
                  <input
                    type="text"
                    value={newExampleInput}
                    onChange={(e) => setNewExampleInput(e.target.value)}
                    onKeyDown={handleAddExample}
                    placeholder="Digite um exemplo e pressione Enter..."
                  />
                  <button type="button" className="btn-tag-add" onClick={handleAddExample}>
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* 🚀 APLICAÇÕES NO MUNDO REAL (Interactive Tag Adder) */}
            <div className="live-field-group">
              <label>🚀 Aplicações no Mundo Real (Onde e como colocar em prática)</label>
              <div className="interactive-tags-box">
                <div className="tags-chips-wrap">
                  {applications.map((app, i) => (
                    <span key={i} className="interactive-chip application-chip">
                      🚀 {app}
                      <button type="button" onClick={() => handleRemoveApplication(app)}><X size={11} /></button>
                    </span>
                  ))}
                </div>
                <div className="tag-input-row">
                  <input
                    type="text"
                    value={newApplicationInput}
                    onChange={(e) => setNewApplicationInput(e.target.value)}
                    onKeyDown={handleAddApplication}
                    placeholder="Digite uma aplicação e pressione Enter..."
                  />
                  <button type="button" className="btn-tag-add" onClick={handleAddApplication}>
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* 💡 MÚLTIPLOS INSIGHTS DE 1ª ORDEM */}
            <div className="live-field-group">
              <label>💡 Insights de 1ª Ordem ({insightsList.length} registrados)</label>
              <div className="interactive-tags-box">
                <div className="multi-items-list-vertical">
                  {insightsList.map((ins, i) => (
                    <div key={i} className="multi-item-row-card insight-row">
                      <span className="item-bullet">💡</span>
                      <p className="item-text">{ins}</p>
                      <button type="button" className="btn-trash-icon" onClick={() => handleRemoveInsight(i)}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="tag-input-row">
                  <input
                    type="text"
                    value={newInsightInput}
                    onChange={(e) => setNewInsightInput(e.target.value)}
                    onKeyDown={handleAddInsight}
                    placeholder="Adicionar novo insight de primeira ordem (Enter)..."
                  />
                  <button type="button" className="btn-tag-add" onClick={handleAddInsight}>
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* ❓ MÚLTIPLAS DÚVIDAS EM ABERTO */}
            <div className="live-field-group">
              <label>❓ Dúvidas em Aberto ({doubtsList.length} registradas)</label>
              <div className="interactive-tags-box">
                <div className="multi-items-list-vertical">
                  {doubtsList.map((dbt, i) => (
                    <div key={i} className="multi-item-row-card doubt-row">
                      <span className="item-bullet">❓</span>
                      <p className="item-text">{dbt}</p>
                      <button type="button" className="btn-trash-icon" onClick={() => handleRemoveDoubt(i)}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="tag-input-row">
                  <input
                    type="text"
                    value={newDoubtInput}
                    onChange={(e) => setNewDoubtInput(e.target.value)}
                    onKeyDown={handleAddDoubt}
                    placeholder="Adicionar nova dúvida ou ponto para aprofundar (Enter)..."
                  />
                  <button type="button" className="btn-tag-add" onClick={handleAddDoubt}>
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* 🤖 MÚLTIPLAS AULAS / EXPLICAÇÕES DA IA USADA (GEMINI, CLAUDE, ETC.) */}
            <div className="live-field-group ai-study-box">
              <div className="ai-study-box-head">
                <label><Bot size={14} /> Aulas & Explicações da IA Usada ({aiLessonsList.length} adicionadas)</label>
              </div>

              {/* List of currently added AI lessons */}
              {aiLessonsList.length > 0 && (
                <div className="session-ai-lessons-stack">
                  {aiLessonsList.map((item, idx) => (
                    <div key={item.id || idx} className="session-ai-card-item">
                      <div className="ai-card-item-top">
                        <span className="ai-model-tag">🤖 {item.aiModel}</span>
                        {item.topic && <strong>{item.topic}</strong>}
                        <button
                          type="button"
                          className="btn-trash-icon"
                          onClick={() => handleRemoveAiLesson(idx)}
                          title="Remover aula de IA"
                          style={{ marginLeft: "auto" }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <p className="ai-card-item-snippet">{item.content.substring(0, 180)}...</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Form to add another AI lesson */}
              <div className="add-ai-lesson-inline-form">
                <div className="form-row-2" style={{ marginBottom: "8px" }}>
                  <select
                    value={newAiModel}
                    onChange={(e) => setNewAiModel(e.target.value)}
                  >
                    <option value="Gemini 1.5 Pro (Google)">Gemini 1.5 Pro (Google)</option>
                    <option value="Gemini 1.5 Flash (Google)">Gemini 1.5 Flash (Google)</option>
                    <option value="Claude 3.5 Sonnet (Anthropic)">Claude 3.5 Sonnet (Anthropic)</option>
                    <option value="Claude 3 Opus (Anthropic)">Claude 3 Opus (Anthropic)</option>
                    <option value="ChatGPT (GPT-4o OpenAI)">ChatGPT (GPT-4o OpenAI)</option>
                    <option value="DeepSeek-R1">DeepSeek-R1</option>
                  </select>

                  <input
                    type="text"
                    value={newAiTopic}
                    onChange={(e) => setNewAiTopic(e.target.value)}
                    placeholder="Tópico / Pergunta feita à IA"
                  />
                </div>

                <textarea
                  rows={3}
                  value={newAiContent}
                  onChange={(e) => setNewAiContent(e.target.value)}
                  placeholder="Cole aqui o texto ou explicação gerada pela IA (Gemini, etc.)..."
                  style={{ marginBottom: "8px" }}
                />

                <button
                  type="button"
                  className="btn-add-mini"
                  onClick={handleAddAiLesson}
                  disabled={!newAiContent.trim()}
                >
                  <Plus size={13} /> Adicionar Aula / Explicação de IA
                </button>
              </div>
            </div>

            {/* ⚡ Feynman Recall */}
            <div className="live-field-group">
              <label>⚡ Feynman Recall (Explique em 30 Segundos)</label>
              <textarea
                rows={2}
                value={thirtySeconds}
                onChange={(e) => setThirtySeconds(e.target.value)}
                placeholder="Explique como se estivesse ensinando para alguém leigo..."
              />
            </div>
          </div>
        </div>
      </div>

      <StudySessionHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        sessions={sessions}
        questions={questions}
        lessons={lessons}
        onQuestionClick={onQuestionClick}
        onLessonClick={onLessonClick}
      />
    </div>
  );
}
