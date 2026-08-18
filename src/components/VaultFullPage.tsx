import React, { useState } from "react";
import {
  ArrowLeft, BookOpen, Brain, Check, ChevronRight, Edit3, ExternalLink,
  Layers, Link2, Sparkles, Copy, CheckCheck, Bot, FileText, Globe, Book, Video, Trash2
} from "lucide-react";
import type { Vault, VaultConnection, VaultSource, VaultAILesson, Question, Lesson } from "../types";
import { sampleVault } from "../data/mock";

export interface VaultViewTarget {
  id: string;
  name: string;
  type: "lesson" | "question";
  domain: string;
  lesson: string;
  module?: string;
  vault: Vault;
}

export function VaultFullPage({
  target,
  onBack,
  onEditVault,
  onStartSession,
  onDeleteVault,
  onNavigateToLesson,
  onNavigateToQuestion,
  onNavigateToVault,
}: {
  target: VaultViewTarget;
  onBack: () => void;
  onEditVault: () => void;
  onStartSession: () => void;
  onDeleteVault?: (targetId: string) => void;
  onNavigateToLesson?: (lessonName: string) => void;
  onNavigateToQuestion?: (questionTitle: string) => void;
  onNavigateToVault?: (target: VaultViewTarget) => void;
}) {
  const [activeTab, setActiveTab] = useState<"sintese" | "ai_lessons" | "review">("sintese");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const vault = target.vault || sampleVault;
  const connections: (string | VaultConnection)[] = vault.connections || [];
  const sources: (string | VaultSource)[] = vault.sources || [];
  const aiLessons: VaultAILesson[] = vault.aiLessons || [];

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSourceIcon = (type?: string) => {
    switch (type) {
      case "livro": return <Book size={14} />;
      case "video": return <Video size={14} />;
      case "documentacao": return <Globe size={14} />;
      case "ia": return <Bot size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const getAIBadgeColor = (model: string) => {
    const m = model.toLowerCase();
    if (m.includes("gemini")) return { bg: "rgba(59, 130, 246, 0.18)", color: "#93c5fd", border: "rgba(59, 130, 246, 0.35)", icon: "✨" };
    if (m.includes("claude")) return { bg: "rgba(217, 119, 6, 0.18)", color: "#fcd34d", border: "rgba(217, 119, 6, 0.35)", icon: "🧡" };
    if (m.includes("gpt") || m.includes("chatgpt") || m.includes("openai")) return { bg: "rgba(16, 185, 129, 0.18)", color: "#6ee7b7", border: "rgba(16, 185, 129, 0.35)", icon: "🟢" };
    if (m.includes("deepseek")) return { bg: "rgba(168, 85, 247, 0.18)", color: "#d8b4fe", border: "rgba(168, 85, 247, 0.35)", icon: "🔮" };
    return { bg: "rgba(99, 102, 241, 0.18)", color: "#a5b4fc", border: "rgba(99, 102, 241, 0.35)", icon: "🤖" };
  };

  return (
    <div className="vault-full-page">
      <div className="page-nav-bar">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={14} /> Voltar
        </button>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button className="hero-btn secondary" onClick={onStartSession}>
            <Brain size={13} /> Praticar em Estudo Crono
          </button>
          <button className="edit-entity-top-btn" onClick={onEditVault}>
            <Edit3 size={14} /> ✎ Editar Vault
          </button>
        </div>
      </div>

      <div className="vault-page-header">
        <div className="vault-eyebrow-line">
          <span className="vault-badge-pill">▤ Vault do Conhecimento</span>
          <span className="dot">•</span>
          <span className="domain-tag">{target.domain}</span>
          <span className="dot">•</span>
          <span className="category-pill">{target.lesson}</span>
          {target.module && (
            <>
              <span className="dot">•</span>
              <span className="module-pill">{target.module}</span>
            </>
          )}
        </div>

        <div className="vault-title-row">
          <h1 className="vault-page-h1">{target.name}</h1>
          <span className="vault-type-tag">{target.type === "lesson" ? "Lesson Vault" : "Question Vault"}</span>
        </div>
      </div>

      <div className="vault-sub-tabs" style={{ marginBottom: "20px" }}>
        <button
          className={`vault-tab-btn ${activeTab === "sintese" ? "active" : ""}`}
          onClick={() => setActiveTab("sintese")}
        >
          ▤ Síntese & Conhecimento
        </button>
        <button
          className={`vault-tab-btn ${activeTab === "ai_lessons" ? "active" : ""}`}
          onClick={() => setActiveTab("ai_lessons")}
        >
          🤖 Aulas da IA Usada ({aiLessons.length})
        </button>
        <button
          className={`vault-tab-btn ${activeTab === "review" ? "active" : ""}`}
          onClick={() => setActiveTab("review")}
        >
          ↻ Active Review & Feynman
        </button>
      </div>

      {activeTab === "sintese" && (
        <div className="vault-page-content-cards">
          {/* 📖 Aprendizado Central */}
          <div className="vault-block-card">
            <div className="vault-block-head">
              <span className="block-icon">📖</span>
              <div>
                <strong>Aprendizado Central</strong>
                <small>O que você precisa lembrar?</small>
              </div>
            </div>
            <div className="vault-block-body highlight-box">
              {vault.learning || <span className="placeholder">Sem registro</span>}
            </div>
          </div>

          {/* 🧠 Answer / Síntese */}
          <div className="vault-block-card">
            <div className="vault-block-head">
              <span className="block-icon">🧠</span>
              <div>
                <strong>Answer / Síntese Profunda</strong>
                <small>O que é · como funciona · por que existe · detalhes essenciais</small>
              </div>
            </div>
            <div className="vault-block-body text-rich">
              {vault.answer || <span className="placeholder">Sem síntese</span>}
            </div>
          </div>

          {/* 📝 Bloco Notas & Sínteses Rápidas */}
          <div className="vault-block-card">
            <div className="vault-block-head">
              <span className="block-icon">📝</span>
              <div>
                <strong>Notas & Sínteses Rápidas</strong>
                <small>Anotações adicionais, observações e raciocínio livre</small>
              </div>
            </div>
            <div className="vault-block-body notes-box">
              {vault.notes ? (
                <p className="vault-notes-text">{vault.notes}</p>
              ) : (
                <span className="placeholder">Nenhuma anotação avulsa adicionada. Clique em "✎ Editar Vault" para registrar.</span>
              )}
            </div>
          </div>

          {/* 🔖 Destaques & Exemplos */}
          <div className="vault-blocks-grid-2">
            <div className="vault-block-card">
              <div className="vault-block-head">
                <span className="block-icon">🔖</span>
                <div>
                  <strong>Destaques & Modelos</strong>
                  <small>Termos, modelos mentais, fórmulas</small>
                </div>
              </div>
              <div className="vault-block-body">
                <div className="rel-tags-wrap">
                  {vault.highlights?.length ? vault.highlights.map((h, i) => (
                    <span key={i} className="highlight-pill">🔖 {h}</span>
                  )) : <span className="placeholder">Nenhum destaque</span>}
                </div>
              </div>
            </div>

            <div className="vault-block-card">
              <div className="vault-block-head">
                <span className="block-icon">🌎</span>
                <div>
                  <strong>Exemplos Práticos</strong>
                  <small>Vida real, tecnologia, natureza</small>
                </div>
              </div>
              <div className="vault-block-body">
                <div className="rel-tags-wrap">
                  {vault.examples?.length ? vault.examples.map((e, i) => (
                    <span key={i} className="example-pill">🌎 {e}</span>
                  )) : <span className="placeholder">Nenhum exemplo</span>}
                </div>
              </div>
            </div>
          </div>

          {/* 🚀 Aplicações & Insights */}
          <div className="vault-blocks-grid-2">
            <div className="vault-block-card">
              <div className="vault-block-head">
                <span className="block-icon">🚀</span>
                <div>
                  <strong>Aplicações no Mundo Real</strong>
                  <small>Como colocar em prática</small>
                </div>
              </div>
              <div className="vault-block-body">
                <div className="rel-tags-wrap">
                  {vault.applications?.length ? vault.applications.map((a, i) => (
                    <span key={i} className="application-pill">🚀 {a}</span>
                  )) : <span className="placeholder">Nenhuma aplicação registrada</span>}
                </div>
              </div>
            </div>

            <div className="vault-block-card">
              <div className="vault-block-head">
                <span className="block-icon">💡</span>
                <div>
                  <strong>Insights de 1ª Ordem</strong>
                  <small>Conexões intuitivas e princípios fundamentais</small>
                </div>
              </div>
              <div className="vault-block-body">
                {Array.isArray(vault.insights) ? (
                  vault.insights.length > 0 ? (
                    <div className="vault-multi-items-list">
                      {vault.insights.map((ins, i) => (
                        <div key={i} className="vault-insight-row-item">
                          <span className="bullet-glow">💡</span>
                          <p>{ins}</p>
                        </div>
                      ))}
                    </div>
                  ) : <span className="placeholder">Nenhum insight registrado</span>
                ) : (
                  <p>{vault.insights || <span className="placeholder">Nenhum insight registrado</span>}</p>
                )}
              </div>
            </div>
          </div>

          {/* ❓ Dúvidas */}
          <div className="vault-block-card">
            <div className="vault-block-head">
              <span className="block-icon">❓</span>
              <div>
                <strong>Dúvidas & Pontos em Aberto</strong>
                <small>Perguntas para aprofundar em próximas sessões</small>
              </div>
            </div>
            <div className="vault-block-body">
              {Array.isArray(vault.doubts) ? (
                vault.doubts.length > 0 ? (
                  <div className="vault-multi-items-list">
                    {vault.doubts.map((dbt, i) => (
                      <div key={i} className="vault-doubt-row-item">
                        <span className="bullet-glow">❓</span>
                        <p>{dbt}</p>
                      </div>
                    ))}
                  </div>
                ) : <span className="placeholder">Nenhuma dúvida pendente</span>
              ) : (
                <p>{vault.doubts || <span className="placeholder">Nenhuma dúvida pendente</span>}</p>
              )}
            </div>
          </div>

          {/* 🔗 Conexões com Lessons, Questions ou Vaults */}
          <div className="vault-block-card">
            <div className="vault-block-head">
              <span className="block-icon">🔗</span>
              <div>
                <strong>Conexões com Lessons, Questions e Vaults</strong>
                <small>Pontes de conhecimento com outras partes do seu grafo KOS</small>
              </div>
            </div>
            <div className="vault-block-body">
              <div className="vault-connections-list">
                {connections.length > 0 ? (
                  connections.map((c, i) => {
                    const isObj = typeof c === "object" && c !== null;
                    const cType = isObj ? c.type : "lesson";
                    const cTitle = isObj ? c.title : c;
                    const cDomain = isObj ? c.domain : undefined;

                    return (
                      <div
                        key={i}
                        className={`vault-conn-item conn-${cType}`}
                        onClick={() => {
                          if (cType === "lesson" && onNavigateToLesson) {
                            onNavigateToLesson(cTitle);
                          } else if (cType === "question" && onNavigateToQuestion) {
                            onNavigateToQuestion(cTitle);
                          }
                        }}
                      >
                        <span className="conn-badge-icon">
                          {cType === "lesson" ? "▦ Lesson" : cType === "question" ? "□ Question" : "▤ Vault"}
                        </span>
                        <span className="conn-title-text">{cTitle}</span>
                        {cDomain && <span className="conn-domain-tag">◈ {cDomain}</span>}
                        <ChevronRight size={13} className="conn-arrow-icon" />
                      </div>
                    );
                  })
                ) : (
                  <span className="placeholder">Nenhuma conexão vinculada. Clique em "✎ Editar Vault" para conectar a outras Lessons, Questions ou Vaults.</span>
                )}
              </div>
            </div>
          </div>

          {/* 📚 Fontes & Referências (Com Links Clicáveis) */}
          <div className="vault-block-card">
            <div className="vault-block-head">
              <span className="block-icon">📚</span>
              <div>
                <strong>Fontes & Referências (Com Links)</strong>
                <small>Artigos, papers, livros, vídeos, aulas e referências digitais</small>
              </div>
            </div>
            <div className="vault-block-body">
              <div className="vault-sources-list">
                {sources.length > 0 ? (
                  sources.map((s, i) => {
                    const isObj = typeof s === "object" && s !== null;
                    const title = isObj ? s.title : s;
                    const url = isObj ? s.url : undefined;
                    const author = isObj ? s.authorOrPlatform : undefined;
                    const type = isObj ? s.type : "outro";

                    return (
                      <div key={i} className="vault-source-row">
                        <div className="source-info-left">
                          <span className="source-type-icon">{getSourceIcon(type)}</span>
                          <div>
                            <strong className="source-title-text">{title}</strong>
                            {author && <small className="source-author-sub">{author}</small>}
                          </div>
                        </div>

                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="source-link-btn"
                            title={url}
                          >
                            <span>Acessar Link</span>
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="source-no-link-badge">Sem link web</span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <span className="placeholder">Nenhuma fonte cadastrada. Clique em "✎ Editar Vault" para adicionar links de estudo.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🤖 Aulas da IA Usada para o Estudo */}
      {activeTab === "ai_lessons" && (
        <div className="vault-ai-lessons-container">
          <div className="ai-lessons-banner">
            <div className="banner-icon-box">
              <Sparkles size={20} />
            </div>
            <div>
              <h3>Aulas & Explicações da IA de Estudo</h3>
              <p>Textos explicativos e aulas geradas por IA (Gemini, Claude, ChatGPT, etc.) registradas para esta Vault.</p>
            </div>
            <button className="add-ai-lesson-btn" onClick={onEditVault}>
              <Edit3 size={13} /> Gerenciar Aulas de IA
            </button>
          </div>

          {aiLessons.length > 0 ? (
            <div className="ai-lessons-grid">
              {aiLessons.map((item, idx) => {
                const badgeStyle = getAIBadgeColor(item.aiModel);
                const isCopied = copiedId === (item.id || `ai-${idx}`);

                return (
                  <div key={item.id || idx} className="ai-lesson-card">
                    <div className="ai-lesson-card-head">
                      <div className="ai-model-badge" style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color, borderColor: badgeStyle.border }}>
                        <span>{badgeStyle.icon}</span>
                        <strong>{item.aiModel}</strong>
                        <span className="ia-usada-tag">(IA usada no estudo)</span>
                      </div>

                      {item.date && <span className="ai-date-pill">{item.date}</span>}

                      <button
                        className="ai-copy-btn"
                        onClick={() => handleCopyText(item.id || `ai-${idx}`, item.content)}
                        title="Copiar texto da aula"
                      >
                        {isCopied ? <><CheckCheck size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
                      </button>
                    </div>

                    {item.topic && (
                      <h4 className="ai-topic-title">
                        📌 Tópico: {item.topic}
                      </h4>
                    )}

                    <div className="ai-lesson-content-body">
                      <pre className="ai-formatted-text">{item.content}</pre>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-ai-lessons-box">
              <Bot size={32} />
              <h4>Nenhum texto de IA registrado ainda</h4>
              <p>Adicione transcrições de aulas ou explicações geradas pelo Gemini, Claude ou ChatGPT para fixar os conceitos.</p>
              <button className="hero-btn primary" onClick={onEditVault}>
                <Edit3 size={14} /> Inserir Aula de IA na Vault
              </button>
            </div>
          )}
        </div>
      )}

      {/* ↻ Active Review & Feynman */}
      {activeTab === "review" && (
        <div className="review-editor">
          {[
            ['O que é?', vault.activeReview?.what],
            ['Como funciona?', vault.activeReview?.how],
            ['Por que existe?', vault.activeReview?.why],
            ['Onde aparece?', vault.activeReview?.where],
            ['Como se conecta?', vault.activeReview?.connections],
            ['Explique em 30 segundos (Feynman Technique).', vault.activeReview?.thirtySeconds]
          ].map(([t, a]) => (
            <div className="recall-card" key={t}>
              <strong>{t}</strong>
              <p>{a || "Não preenchido"}</p>
              <button className="used"><Check size={12} /> Consolidado</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
