import React, { useState, useMemo } from "react";
import {
  X, Award, Clock, Calendar, Search, Filter,
  BookOpen, CircleHelp, CheckCircle2, ChevronRight
} from "lucide-react";
import type { SessionRecord, Question, Lesson } from "../types";

export function StudySessionHistoryModal({
  isOpen,
  onClose,
  sessions,
  questions = [],
  lessons = [],
  onQuestionClick,
  onLessonClick,
}: {
  isOpen: boolean;
  onClose: () => void;
  sessions: SessionRecord[];
  questions?: Question[];
  lessons?: Lesson[];
  onQuestionClick?: (q: Question) => void;
  onLessonClick?: (l: Lesson) => void;
}) {
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<string>("all");

  const totalMinutes = useMemo(() => {
    return sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  }, [sessions]);

  const totalHours = (totalMinutes / 60).toFixed(1);
  const avgMinutes = sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0;

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      if (filterMode !== "all" && s.mode !== filterMode) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const mTitle = (s.title || "").toLowerCase().includes(q);
        const mLesson = (s.lesson || "").toLowerCase().includes(q);
        const mQuestion = (s.questionTitle || "").toLowerCase().includes(q);
        const mDomain = (s.domain || "").toLowerCase().includes(q);
        if (!mTitle && !mLesson && !mQuestion && !mDomain) return false;
      }
      return true;
    });
  }, [sessions, search, filterMode]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-sessions-history" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="crud-header-icon" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              <Award size={20} />
            </div>
            <div>
              <h2>Histórico de Sessões de Estudo</h2>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--text-dim)" }}>
                Registro cronológico de Pomodoros e sessões ativas realizadas
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Top KPIs */}
        <div className="session-history-kpis-grid">
          <div className="session-kpi-card">
            <span className="kpi-label"><Clock size={12} /> Total de Horas</span>
            <strong className="kpi-val" style={{ color: "#60a5fa" }}>{totalHours}h</strong>
            <small>{totalMinutes} minutos acumulados</small>
          </div>
          <div className="session-kpi-card">
            <span className="kpi-label"><Award size={12} /> Sessões Concluídas</span>
            <strong className="kpi-val" style={{ color: "#10b981" }}>{sessions.length}</strong>
            <small>Ciclos de foco finalizados</small>
          </div>
          <div className="session-kpi-card">
            <span className="kpi-label"><Calendar size={12} /> Média por Sessão</span>
            <strong className="kpi-val" style={{ color: "#a855f7" }}>{avgMinutes} min</strong>
            <small>Duração média de estudo</small>
          </div>
        </div>

        {/* Filters */}
        <div className="session-history-filters-bar">
          <div className="session-history-search">
            <Search size={13} style={{ color: "var(--text-dim)" }} />
            <input
              type="text"
              placeholder="Buscar por lição, pergunta ou domínio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="session-mode-filter"
          >
            <option value="all">Todos os Modos</option>
            <option value="pomodoro">Pomodoro / Deep Work</option>
            <option value="stopwatch">Cronômetro Livre</option>
          </select>
        </div>

        {/* Sessions List */}
        <div className="session-history-list-scroll">
          {filteredSessions.length === 0 ? (
            <div className="crud-empty-list">
              <Clock size={28} style={{ opacity: 0.4, marginBottom: "8px" }} />
              <p>Nenhuma sessão de estudo registrada ainda.</p>
              <small>Inicie um cronômetro na Study Session e clique em <em>Concluir Sessão & Salvar</em> para registrar seu tempo.</small>
            </div>
          ) : (
            <div className="session-history-items-stack">
              {filteredSessions.map((s) => {
                const matchedQ = questions.find(q => q.id === s.questionId || q.title === s.questionTitle);
                const matchedL = lessons.find(l => l.name.toLowerCase() === (s.lesson || "").toLowerCase());

                return (
                  <div key={s.id} className="session-history-item-card">
                    <div className="session-item-left">
                      <div className="session-item-badge-row">
                        <span className={`session-mode-badge mode-${s.mode}`}>
                          {s.mode === "pomodoro" ? "🔥 Pomodoro" : "⏱️ Livre"}
                        </span>
                        <span className="session-date-badge">
                          <Calendar size={11} /> {s.date || "Hoje"}
                        </span>
                        <span className="session-duration-badge">
                          <Clock size={11} /> {s.durationMinutes} min
                        </span>
                        <span className="session-status-badge">
                          <CheckCircle2 size={11} /> {s.status || "Concluída"}
                        </span>
                      </div>

                      <h4 className="session-item-title">
                        {s.questionTitle || s.title}
                      </h4>

                      <div className="session-item-details">
                        <span className="detail-tag domain-tag-mini">{s.domain}</span>
                        {s.lesson && (
                          <span
                            className="detail-tag lesson-link-mini"
                            onClick={() => matchedL && onLessonClick && onLessonClick(matchedL)}
                            style={{ cursor: matchedL ? "pointer" : "default" }}
                          >
                            ▦ {s.lesson}
                          </span>
                        )}
                        {s.module && <span className="detail-tag module-pill-mini">📦 {s.module}</span>}
                      </div>
                    </div>

                    {matchedQ && onQuestionClick && (
                      <button
                        type="button"
                        className="btn-open-session-q"
                        onClick={() => {
                          onQuestionClick(matchedQ);
                          onClose();
                        }}
                        title="Abrir Question no KOS"
                      >
                        Abrir <ChevronRight size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: "1px solid var(--line)", padding: "14px 20px" }}>
          <button type="button" className="btn-modal-secondary" onClick={onClose} style={{ marginLeft: "auto" }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
