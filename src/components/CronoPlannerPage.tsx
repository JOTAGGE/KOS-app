import React, { useState, useMemo } from "react";
import {
  CalendarDays, ChevronRight, Clock, Flame, Play, Plus, Sparkles,
  Trash2, BookOpen, CheckCircle2, CircleHelp, Layers, ArrowRight, X,
  Filter, Search, Tag, Check, Edit3, Target, RotateCw, Settings2, SlidersHorizontal
} from "lucide-react";
import type { Lesson, Question, CronoDayAllocation, DayOfWeek, Domain, StudyPlan, StudyCycle } from "../types";
import { PlansCyclesManagerModal } from "./PlansCyclesManagerModal";

const DAYS_OF_WEEK: DayOfWeek[] = [
  "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"
];

export function CronoPlannerPage({
  schedule,
  lessons,
  questions,
  plans = [],
  cycles = [],
  onUpdateSchedule,
  onStartSessionWithQuestion,
  onOpenLesson,
  onOpenQuestion,
  onUpdateLesson,
  onSavePlan,
  onDeletePlan,
  onSaveCycle,
  onDeleteCycle,
}: {
  schedule: CronoDayAllocation[];
  lessons: Lesson[];
  questions: Question[];
  plans: StudyPlan[];
  cycles: StudyCycle[];
  onUpdateSchedule: (newSchedule: CronoDayAllocation[]) => void;
  onStartSessionWithQuestion: (q: Question) => void;
  onOpenLesson: (l: Lesson) => void;
  onOpenQuestion: (q: Question) => void;
  onUpdateLesson?: (l: Lesson) => void;
  onSavePlan: (plan: Omit<StudyPlan, "id"> & { id?: string }) => void;
  onDeletePlan: (planId: string) => void;
  onSaveCycle: (cycle: Omit<StudyCycle, "id"> & { id?: string }) => void;
  onDeleteCycle: (cycleId: string) => void;
}) {
  // Filter States (Plano & Ciclo & Busca textual — SEM filtro de domínio conforme solicitado)
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>("all");
  const [selectedCycleFilter, setSelectedCycleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Manager Modal State
  const [managerModalOpen, setManagerModalOpen] = useState(false);

  // Quick Inline Creation Modals
  const [newPlanModalOpen, setNewPlanModalOpen] = useState(false);
  const [newCycleModalOpen, setNewCycleModalOpen] = useState(false);
  const [newPlanInput, setNewPlanInput] = useState("");
  const [newCycleInput, setNewCycleInput] = useState("");

  // Quick Tagging Modal
  const [taggingLesson, setTaggingLesson] = useState<Lesson | null>(null);
  const [tagPlanVal, setTagPlanVal] = useState("");
  const [tagCycleVal, setTagCycleVal] = useState("");

  // Day Allocation State
  const [selectedDayToAdd, setSelectedDayToAdd] = useState<DayOfWeek | null>(null);
  const [selectedLessonIdToAdd, setSelectedLessonIdToAdd] = useState<string>("");

  // Distinct lists combining registered entities + any loose values in lessons
  const allAvailablePlans = useMemo(() => {
    const fromPlans = plans.map(p => p.name);
    const fromLessons = lessons.map(l => l.plan).filter(Boolean) as string[];
    return Array.from(new Set([...fromPlans, ...fromLessons])).filter(Boolean);
  }, [plans, lessons]);

  const allAvailableCycles = useMemo(() => {
    const fromCycles = cycles.map(c => c.name);
    const fromLessons = lessons.map(l => l.cycle).filter(Boolean) as string[];
    return Array.from(new Set([...fromCycles, ...fromLessons])).filter(Boolean);
  }, [cycles, lessons]);

  // Active Filter Check
  const hasActiveFilters = selectedPlanFilter !== "all" || selectedCycleFilter !== "all" || searchQuery.trim() !== "";

  const clearAllFilters = () => {
    setSelectedPlanFilter("all");
    setSelectedCycleFilter("all");
    setSearchQuery("");
  };

  // Helper to test if a lesson matches the active filters
  const lessonMatchesFilters = (les: Lesson): boolean => {
    if (selectedPlanFilter !== "all" && (les.plan || "").toLowerCase() !== selectedPlanFilter.toLowerCase()) {
      return false;
    }
    if (selectedCycleFilter !== "all" && (les.cycle || "").toLowerCase() !== selectedCycleFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = les.name.toLowerCase().includes(q);
      const matchDomain = les.domain.toLowerCase().includes(q);
      const matchModule = (les.module || "").toLowerCase().includes(q);
      const matchPlan = (les.plan || "").toLowerCase().includes(q);
      const matchCycle = (les.cycle || "").toLowerCase().includes(q);
      if (!matchName && !matchDomain && !matchModule && !matchPlan && !matchCycle) {
        return false;
      }
    }
    return true;
  };

  // Get filtered lessons for a specific day
  const getLessonsForDay = (day: DayOfWeek): Lesson[] => {
    const dayAlloc = schedule.find(s => s.day === day);
    if (!dayAlloc) return [];
    const rawLessons = dayAlloc.lessonIds
      .map(id => lessons.find(l => l.id === id))
      .filter((l): l is Lesson => Boolean(l));

    return rawLessons.filter(lessonMatchesFilters);
  };

  // Lessons available to add (respecting active filters to make selection easier)
  const availableLessonsToAdd = useMemo(() => {
    return lessons.filter(lessonMatchesFilters);
  }, [lessons, selectedPlanFilter, selectedCycleFilter, searchQuery]);

  const handleAddLessonToDay = (day: DayOfWeek) => {
    const lessonId = selectedLessonIdToAdd || availableLessonsToAdd[0]?.id;
    if (!lessonId) return;

    const current = schedule.find(s => s.day === day);
    const updatedLessonIds = current ? [...new Set([...current.lessonIds, lessonId])] : [lessonId];

    const newSchedule = DAYS_OF_WEEK.map(d => {
      if (d === day) {
        return { day: d, lessonIds: updatedLessonIds };
      }
      return schedule.find(s => s.day === d) || { day: d, lessonIds: [] };
    });

    onUpdateSchedule(newSchedule);
    setSelectedDayToAdd(null);
    setSelectedLessonIdToAdd("");
  };

  const handleRemoveLessonFromDay = (day: DayOfWeek, lessonId: string) => {
    const newSchedule = schedule.map(s => {
      if (s.day === day) {
        return { ...s, lessonIds: s.lessonIds.filter(id => id !== lessonId) };
      }
      return s;
    });
    onUpdateSchedule(newSchedule);
  };

  const handleCreateNewPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanInput.trim()) return;
    const val = newPlanInput.trim();
    onSavePlan({ name: val });
    setSelectedPlanFilter(val);
    setNewPlanInput("");
    setNewPlanModalOpen(false);
  };

  const handleCreateNewCycle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCycleInput.trim()) return;
    const val = newCycleInput.trim();
    onSaveCycle({ name: val });
    setSelectedCycleFilter(val);
    setNewCycleInput("");
    setNewCycleModalOpen(false);
  };

  const handleOpenTagging = (les: Lesson) => {
    setTaggingLesson(les);
    setTagPlanVal(les.plan || "");
    setTagCycleVal(les.cycle || "");
  };

  const handleSaveTagging = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taggingLesson || !onUpdateLesson) return;
    onUpdateLesson({
      ...taggingLesson,
      plan: tagPlanVal.trim() || undefined,
      cycle: tagCycleVal.trim() || undefined,
    });
    setTaggingLesson(null);
  };

  // Find next question in cycle for a lesson
  const getNextQuestionForLesson = (lesson: Lesson): Question | undefined => {
    const qInLes = questions.filter(q => q.lesson.toLowerCase() === lesson.name.toLowerCase());
    return qInLes.find(q => q.stage === "study" || q.stage === "fixation") || qInLes[0];
  };

  // Compute total matching lessons in schedule
  const totalFilteredScheduled = useMemo(() => {
    let count = 0;
    DAYS_OF_WEEK.forEach(day => {
      count += getLessonsForDay(day).length;
    });
    return count;
  }, [schedule, lessons, selectedPlanFilter, selectedCycleFilter, searchQuery]);

  return (
    <div className="crono-planner-page">
      {/* HEADER BANNER */}
      <div className="crono-header-banner">
        <div>
          <div className="dash-badge">
            <CalendarDays size={13} />
            <span>PLANEJADOR SEMANAL CRONO</span>
          </div>
          <h1>Quadro Semanal Crono</h1>
          <p>
            Organize múltiplos cronogramas filtrando por <strong>Planos de Estudo</strong> (ex: <em>Concurso PF, OAB</em>) e <strong>Ciclos</strong> (ex: <em>Ciclo 1, Reta Final</em>).
          </p>
        </div>

        <div className="crono-header-stats">
          <button
            type="button"
            className="btn-crono-manage-plans"
            onClick={() => setManagerModalOpen(true)}
            title="Gerenciar Planos e Ciclos (CRUD)"
          >
            <SlidersHorizontal size={14} />
            <span>Gerenciar Planos & Ciclos</span>
          </button>
          <div className="crono-stat-pill">
            <span className="pill-dot" />
            <span>Lições Exibidas: <strong>{totalFilteredScheduled}</strong></span>
          </div>
        </div>
      </div>

      {/* DYNAMIC FILTER TOOLBAR (SEM FILTRO DE DOMÍNIO) */}
      <div className="crono-filter-toolbar">
        <div className="crono-filter-group-row" style={{ gridTemplateColumns: "1.2fr 1.2fr 1.6fr auto" }}>
          {/* PLANO DE ESTUDOS FILTER */}
          <div className="crono-filter-item">
            <label>
              <Target size={13} style={{ color: "#60a5fa" }} />
              <span>Plano de Estudos:</span>
            </label>
            <div className="crono-select-with-add">
              <select
                value={selectedPlanFilter}
                onChange={(e) => setSelectedPlanFilter(e.target.value)}
              >
                <option value="all">🎯 Todos os Planos</option>
                {allAvailablePlans.map(plan => (
                  <option key={plan} value={plan}>{plan}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn-crono-new-filter"
                onClick={() => setNewPlanModalOpen(true)}
                title="Criar novo Plano de Estudos"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          {/* CICLO DE ESTUDO FILTER */}
          <div className="crono-filter-item">
            <label>
              <RotateCw size={13} style={{ color: "#a855f7" }} />
              <span>Ciclo de Estudo:</span>
            </label>
            <div className="crono-select-with-add">
              <select
                value={selectedCycleFilter}
                onChange={(e) => setSelectedCycleFilter(e.target.value)}
              >
                <option value="all">🔄 Todos os Ciclos</option>
                {allAvailableCycles.map(cycle => (
                  <option key={cycle} value={cycle}>{cycle}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn-crono-new-filter"
                onClick={() => setNewCycleModalOpen(true)}
                title="Criar novo Ciclo de Estudo"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="crono-filter-item search-filter">
            <label>
              <Search size={13} />
              <span>Buscar na Grade:</span>
            </label>
            <input
              type="text"
              placeholder="Buscar por nome da lição, módulo, plano ou ciclo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* MANAGE BUTTON IN TOOLBAR */}
          <div className="crono-filter-item" style={{ justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn-crono-manage-toolbar"
              onClick={() => setManagerModalOpen(true)}
            >
              <Settings2 size={13} />
              <span>CRUD Planos/Ciclos</span>
            </button>
          </div>
        </div>

        {/* ACTIVE FILTERS SUMMARY CHIPS */}
        {hasActiveFilters && (
          <div className="crono-active-filters-bar">
            <div className="active-chips-list">
              <span className="filter-summary-label"><Filter size={12} /> Filtros ativos:</span>
              {selectedPlanFilter !== "all" && (
                <span className="filter-chip-badge plan-badge">
                  Plano: <strong>{selectedPlanFilter}</strong>
                  <button onClick={() => setSelectedPlanFilter("all")}><X size={11} /></button>
                </span>
              )}
              {selectedCycleFilter !== "all" && (
                <span className="filter-chip-badge cycle-badge">
                  Ciclo: <strong>{selectedCycleFilter}</strong>
                  <button onClick={() => setSelectedCycleFilter("all")}><X size={11} /></button>
                </span>
              )}
              {searchQuery.trim() && (
                <span className="filter-chip-badge search-badge">
                  Busca: <strong>"{searchQuery}"</strong>
                  <button onClick={() => setSearchQuery("")}><X size={11} /></button>
                </span>
              )}
            </div>

            <button className="btn-clear-crono-filters" onClick={clearAllFilters}>
              <X size={13} /> Limpar Filtros
            </button>
          </div>
        )}
      </div>

      {/* 7-DAY KANBAN BOARD */}
      <div className="crono-kanban-board">
        {DAYS_OF_WEEK.map((day) => {
          const dayLessons = getLessonsForDay(day);
          const isToday = (day === "Segunda");

          return (
            <div key={day} className={`crono-kanban-col ${isToday ? "is-current-day" : ""}`}>
              <div className="crono-col-header">
                <div className="crono-day-title">
                  <span className="crono-day-name">{day}</span>
                  {isToday && <span className="today-badge">Hoje</span>}
                </div>
                <span className="crono-col-count">{dayLessons.length} {dayLessons.length === 1 ? "lição" : "lições"}</span>
              </div>

              <div className="crono-cards-stack">
                {dayLessons.map((les) => {
                  const nextQ = getNextQuestionForLesson(les);
                  const qCount = questions.filter(q => q.lesson.toLowerCase() === les.name.toLowerCase()).length;

                  return (
                    <div key={`${day}-${les.id}`} className="crono-lesson-card">
                      {/* Top tags row */}
                      <div className="crono-card-top-row">
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
                          <span className="domain-tag-mini">{les.domain}</span>
                          {les.module && <span className="module-pill-mini">{les.module}</span>}
                          {les.plan && <span className="plan-pill-mini" title={`Plano: ${les.plan}`}>🎯 {les.plan}</span>}
                          {les.cycle && <span className="cycle-pill-mini" title={`Ciclo: ${les.cycle}`}>🔄 {les.cycle}</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          {onUpdateLesson && (
                            <button
                              className="crono-tag-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenTagging(les);
                              }}
                              title="Configurar Plano e Ciclo desta Lesson"
                            >
                              <Tag size={11} />
                            </button>
                          )}
                          <button
                            className="crono-remove-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveLessonFromDay(day, les.id);
                            }}
                            title="Remover deste dia"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>

                      <h4
                        className="crono-lesson-title"
                        onClick={() => onOpenLesson(les)}
                        title="Abrir página da Lesson"
                      >
                        ▦ {les.name}
                      </h4>

                      <div className="crono-lesson-progress-row">
                        <div className="bar-track" style={{ height: "4px" }}>
                          <div className="bar-fill" style={{ width: `${les.progress}%`, backgroundColor: "#10b981" }} />
                        </div>
                        <small>{les.progress}% • {qCount} Qs</small>
                      </div>

                      {/* Next Question Highlight in Card */}
                      {nextQ ? (
                        <div className="crono-next-q-box">
                          <div className="next-q-label">
                            <span>□ Próxima Question:</span>
                            <span className={`stage-tag-mini stage-${nextQ.stage}`}>{nextQ.stage}</span>
                          </div>
                          <strong
                            className="next-q-text"
                            onClick={() => onOpenQuestion(nextQ)}
                          >
                            {nextQ.title}
                          </strong>

                          <div className="crono-card-actions">
                            <button
                              className="crono-start-session-btn"
                              onClick={() => onStartSessionWithQuestion(nextQ)}
                              title="Iniciar Study Session com esta Question"
                            >
                              <Play size={12} fill="currentColor" /> Estudar na Session
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="crono-no-q-box">
                          <small>Nenhuma question cadastrada para esta lição.</small>
                        </div>
                      )}
                    </div>
                  );
                })}

                {dayLessons.length === 0 && (
                  <div className="crono-empty-day-state">
                    {hasActiveFilters ? (
                      <small style={{ color: "var(--text-dim)" }}>Nenhuma lição neste dia com os filtros ativos</small>
                    ) : (
                      <small>Nenhuma lição agendada</small>
                    )}
                  </div>
                )}

                {/* Add Lesson to Day Form / Button */}
                {selectedDayToAdd === day ? (
                  <div className="crono-add-form-inline">
                    <label>
                      Alocar Lesson {hasActiveFilters && "(Filtradas)"}:
                    </label>
                    <select
                      value={selectedLessonIdToAdd || availableLessonsToAdd[0]?.id || ""}
                      onChange={(e) => setSelectedLessonIdToAdd(e.target.value)}
                    >
                      {availableLessonsToAdd.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.domain} • {l.name} {l.plan ? `[🎯 ${l.plan}]` : ""} {l.cycle ? `[🔄 ${l.cycle}]` : ""}
                        </option>
                      ))}
                      {availableLessonsToAdd.length === 0 && (
                        <option value="" disabled>Nenhuma lição disponível para o filtro</option>
                      )}
                    </select>
                    <div className="add-form-btns">
                      <button
                        className="btn-add-confirm"
                        onClick={() => handleAddLessonToDay(day)}
                        disabled={availableLessonsToAdd.length === 0}
                      >
                        Adicionar
                      </button>
                      <button
                        className="btn-add-cancel"
                        onClick={() => setSelectedDayToAdd(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="crono-add-day-btn"
                    onClick={() => {
                      setSelectedDayToAdd(day);
                      setSelectedLessonIdToAdd(availableLessonsToAdd[0]?.id || "");
                    }}
                  >
                    <Plus size={13} /> Alocar Lesson
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: GERENCIADOR COMPLETO DE PLANOS E CICLOS (CRUD) */}
      <PlansCyclesManagerModal
        isOpen={managerModalOpen}
        onClose={() => setManagerModalOpen(false)}
        plans={plans}
        cycles={cycles}
        lessons={lessons}
        onSavePlan={onSavePlan}
        onDeletePlan={onDeletePlan}
        onSaveCycle={onSaveCycle}
        onDeleteCycle={onDeleteCycle}
      />

      {/* MODAL: CRIAR NOVO PLANO DE ESTUDOS RÁPIDO */}
      {newPlanModalOpen && (
        <div className="modal-overlay" onClick={() => setNewPlanModalOpen(false)}>
          <div className="modal-card modal-compact" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Target size={18} style={{ color: "#60a5fa" }} />
                <h3>Criar Novo Plano de Estudos</h3>
              </div>
              <button className="icon-button" onClick={() => setNewPlanModalOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateNewPlan} className="modal-form">
              <div className="form-group">
                <label>Nome do Plano *</label>
                <input
                  type="text"
                  placeholder="Ex: Concurso PF, Residência Médica, OAB..."
                  value={newPlanInput}
                  onChange={(e) => setNewPlanInput(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setNewPlanModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-submit" disabled={!newPlanInput.trim()}>Criar e Filtrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR NOVO CICLO DE ESTUDOS RÁPIDO */}
      {newCycleModalOpen && (
        <div className="modal-overlay" onClick={() => setNewCycleModalOpen(false)}>
          <div className="modal-card modal-compact" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <RotateCw size={18} style={{ color: "#a855f7" }} />
                <h3>Criar Novo Ciclo de Estudo</h3>
              </div>
              <button className="icon-button" onClick={() => setNewCycleModalOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateNewCycle} className="modal-form">
              <div className="form-group">
                <label>Nome do Ciclo *</label>
                <input
                  type="text"
                  placeholder="Ex: Ciclo 1, Ciclo Básico, Reta Final..."
                  value={newCycleInput}
                  onChange={(e) => setNewCycleInput(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setNewCycleModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-submit" disabled={!newCycleInput.trim()}>Criar e Filtrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QUICK TAG LESSON (PLANO & CICLO) */}
      {taggingLesson && (
        <div className="modal-overlay" onClick={() => setTaggingLesson(null)}>
          <div className="modal-card modal-compact" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Tag size={18} style={{ color: "#60a5fa" }} />
                <h3>Vincular Plano & Ciclo à Lição</h3>
              </div>
              <button className="icon-button" onClick={() => setTaggingLesson(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveTagging} className="modal-form">
              <div style={{ marginBottom: "12px", fontSize: "13px", color: "var(--text-soft)" }}>
                Lição: <strong>{taggingLesson.name}</strong> ({taggingLesson.domain})
              </div>

              <div className="form-group">
                <label>🎯 Plano de Estudos</label>
                <input
                  type="text"
                  list="plans-datalist"
                  placeholder="Ex: Concurso PF"
                  value={tagPlanVal}
                  onChange={(e) => setTagPlanVal(e.target.value)}
                />
                <datalist id="plans-datalist">
                  {allAvailablePlans.map(p => <option key={p} value={p} />)}
                </datalist>
              </div>

              <div className="form-group">
                <label>🔄 Ciclo de Estudos</label>
                <input
                  type="text"
                  list="cycles-datalist"
                  placeholder="Ex: Ciclo 1"
                  value={tagCycleVal}
                  onChange={(e) => setTagCycleVal(e.target.value)}
                />
                <datalist id="cycles-datalist">
                  {allAvailableCycles.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setTaggingLesson(null)}>Cancelar</button>
                <button type="submit" className="btn-submit">Salvar Vínculo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
