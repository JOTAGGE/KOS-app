import React from "react";
import {
  ArrowLeft, BookOpen, Brain, Calendar, CheckCircle2, CircleHelp,
  Edit3, ExternalLink, Flame, Layers, Play, Plus, Sparkles, Tag, Target, Clock
} from "lucide-react";
import type { Question, Stage, Vault } from "../types";
import { stageProgressMap } from "../types";
import { sampleVault } from "../data/mock";

const stageConfig: Record<Stage, { label: string; color: string; desc: string }> = {
  study: { label: "Study (Estudo Inicial — 0%)", color: "#60a5fa", desc: "Compreensão conceitual e elaboração da primeira síntese." },
  fixation: { label: "Fixation (Fixação 24-48h — 30%)", color: "#f59e0b", desc: "Primeira recuperação ativa pós-estudo para consolidação." },
  weekly: { label: "Weekly (Revisão Semanal — 60%)", color: "#a855f7", desc: "Revisão espaçada intermediária para retenção duradoura." },
  monthly: { label: "Monthly (Revisão Mensal — 85%)", color: "#ec4899", desc: "Revisão de longo prazo para fixação permanente." },
  mastered: { label: "Mastered (100% Dominado)", color: "#10b981", desc: "Conhecimento automatizado e pronto para aplicação prática." },
};

export function QuestionPage({
  question,
  onBack,
  onEditQuestion,
  onOpenVaultPage,
  onEditVault,
  onCreateVault,
  onStartSession,
}: {
  question: Question | null;
  onBack: () => void;
  onEditQuestion: () => void;
  onOpenVaultPage: () => void;
  onEditVault: () => void;
  onCreateVault: () => void;
  onStartSession: () => void;
}) {
  if (!question) {
    return (
      <div className="question-data-page">
        <div className="page-nav-bar">
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={14} /> Voltar
          </button>
        </div>
        <div className="empty-state-box" style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-dim)" }}>
          <p>Nenhuma pergunta selecionada.</p>
        </div>
      </div>
    );
  }

  const currentStage = stageConfig[question.stage] || stageConfig.study;
  const autoProgress = stageProgressMap[question.stage] ?? question.progress ?? 0;
  const hasVault = Boolean(question.vault && (question.vault.learning || question.vault.answer));
  const vault = question.vault || sampleVault;

  return (
    <div className="question-data-page">
      {/* Top Navigation */}
      <div className="page-nav-bar">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={14} /> Voltar
        </button>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button className="hero-btn primary" onClick={onStartSession}>
            <Play size={14} fill="currentColor" /> Iniciar Estudo Crono
          </button>
          <button className="edit-entity-top-btn" onClick={onEditQuestion}>
            <Edit3 size={14} /> Editar Questão
          </button>
        </div>
      </div>

      {/* Header Info */}
      <div className="question-header-hero">
        <div className="question-eyebrow-line">
          <span className="q-badge-pill">□ Question Central</span>
          <span className="dot">•</span>
          <span className="domain-tag">{question.domain}</span>
          <span className="dot">•</span>
          <span className="category-pill">{question.lesson}</span>
          <span className="dot">•</span>
          <span className="module-pill">{question.module}</span>
        </div>

        <h1 className="question-page-h1">{question.title}</h1>

        <div className="question-props-ribbon">
          <div className="ribbon-item">
            <span className="ribbon-label">Fase no Ciclo:</span>
            <span className="stage-badge-pill" style={{ color: currentStage.color, borderColor: `${currentStage.color}40`, backgroundColor: `${currentStage.color}15` }}>
              ● {currentStage.label}
            </span>
          </div>

          <div className="ribbon-item">
            <span className="ribbon-label">Progresso de Retenção:</span>
            <div className="table-progress-v2" style={{ minWidth: "120px" }}>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${autoProgress}%`, backgroundColor: currentStage.color }} />
              </div>
              <span className="progress-num">{autoProgress}%</span>
            </div>
          </div>

          <div className="ribbon-item">
            <span className="ribbon-label">Criado em:</span>
            <span className="ribbon-val">{question.createdAt || "15 Jan 2026"}</span>
          </div>
        </div>
      </div>

      {/* 🌟 PRINCIPAL CARD EM CIMA DE TODOS: A VAULT (CASO EXISTA / CRIAR CASO NÃO EXISTA) */}
      <section className="question-main-vault-card-section">
        {hasVault ? (
          <div className="featured-vault-card">
            <div className="vault-card-top-header">
              <div className="vault-header-left">
                <div className="vault-icon-badge">
                  <BookOpen size={18} />
                </div>
                <div>
                  <span className="vault-card-eyebrow">VAULT DO CONHECIMENTO • SÍNTESE VINCULADA</span>
                  <h3>Síntese & Aprendizado Registrado</h3>
                </div>
              </div>

              <div className="vault-header-actions">
                <button className="vault-action-btn secondary" onClick={onEditVault}>
                  <Edit3 size={13} /> ✎ Editar Vault
                </button>
                <button className="vault-action-btn primary" onClick={onOpenVaultPage}>
                  <BookOpen size={13} /> Abrir Página Completa da Vault
                </button>
              </div>
            </div>

            <div className="featured-vault-body">
              <div className="vault-preview-block">
                <label className="preview-label">📖 APRENDIZADO CENTRAL:</label>
                <p className="preview-learning-text">{vault.learning || "Sem registro de aprendizado."}</p>
              </div>

              <div className="vault-preview-block">
                <label className="preview-label">🧠 ANSWER / SÍNTESE PROFUNDA:</label>
                <p className="preview-answer-text">{vault.answer || "Sem síntese profunda registrada."}</p>
              </div>

              <div className="vault-meta-counters-row">
                <div className="meta-counter-badge">
                  <span>🔖 Destaques:</span>
                  <strong>{vault.highlights?.length || 0}</strong>
                </div>
                <div className="meta-counter-badge">
                  <span>🌎 Exemplos:</span>
                  <strong>{vault.examples?.length || 0}</strong>
                </div>
                <div className="meta-counter-badge">
                  <span>🔗 Conexões KOS:</span>
                  <strong>{vault.connections?.length || 0}</strong>
                </div>
                <div className="meta-counter-badge">
                  <span>📚 Fontes:</span>
                  <strong>{vault.sources?.length || 0}</strong>
                </div>
                <div className="meta-counter-badge" style={{ borderColor: "rgba(59, 130, 246, 0.3)" }}>
                  <span>🤖 Aulas de IA:</span>
                  <strong style={{ color: "#93c5fd" }}>{vault.aiLessons?.length || 0}</strong>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-vault-cta-card">
            <div className="empty-vault-icon">
              <BookOpen size={28} />
            </div>
            <div className="empty-vault-content">
              <h3>Esta Question ainda não possui uma Vault cadastrada</h3>
              <p>
                A Vault armazena o aprendizado essencial, sínteses profundas, conexões, fontes com links e aulas de IA para esta pergunta.
              </p>
            </div>
            <button className="create-vault-cta-btn" onClick={onCreateVault}>
              <Plus size={15} /> Criar Vault para esta Question
            </button>
          </div>
        )}
      </section>

      {/* DADOS & ESTATÍSTICAS DA QUESTION */}
      <section className="question-data-grid-section">
        <div className="question-stat-box">
          <div className="stat-box-head">
            <span className="stat-title">STATUS NO CICLO DE REPETIÇÃO ESPAÇADA</span>
            <Layers size={16} style={{ color: currentStage.color }} />
          </div>
          <div className="stat-big-val" style={{ color: currentStage.color }}>
            {currentStage.label.split(" ")[0]}
          </div>
          <p className="stat-subtext">{currentStage.desc}</p>
        </div>

        <div className="question-stat-box">
          <div className="stat-box-head">
            <span className="stat-title">MÉTRICA DE RETENÇÃO</span>
            <Target size={16} style={{ color: "#10b981" }} />
          </div>
          <div className="stat-big-val">{question.progress}%</div>
          <div className="bar-track" style={{ height: "6px", margin: "10px 0" }}>
            <div className="bar-fill" style={{ width: `${question.progress}%`, backgroundColor: currentStage.color }} />
          </div>
          <p className="stat-subtext">Calculado com base em Active Recalls e sessões completas.</p>
        </div>

        <div className="question-stat-box">
          <div className="stat-box-head">
            <span className="stat-title">LOCALIZAÇÃO NO KOS</span>
            <Tag size={16} style={{ color: "#60a5fa" }} />
          </div>
          <div className="location-tree">
            <div>◈ Domínio: <strong>{question.domain}</strong></div>
            <div>▦ Lesson: <strong>{question.lesson}</strong></div>
            <div>📦 Módulo: <strong>{question.module}</strong></div>
          </div>
        </div>
      </section>

      {/* ACTIVE RECALL & FEYNMAN QUICK TEST */}
      <section className="question-feynman-test-section">
        <div className="section-divider-title">
          <span>⚡ Active Recall & Feynman Technique (30 Segundos)</span>
          <div className="line-bar" />
        </div>

        <div className="feynman-card-box">
          <div className="feynman-card-head">
            <Sparkles size={16} />
            <strong>Explicação Rápida em 30 Segundos:</strong>
          </div>
          <p className="feynman-text">
            {vault.activeReview?.thirtySeconds || "Explique em suas próprias palavras como se estivesse ensinando para alguém leigo para testar sua retenção imediata."}
          </p>
          <div className="feynman-card-actions">
            <button className="hero-btn primary" onClick={onStartSession}>
              <Brain size={14} /> Praticar no Pomodoro Study Session
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
