import React, { useState } from "react";
import { Edit3, Plus, Trash2, X, ExternalLink, Bot, BookOpen, Layers, Link2 } from "lucide-react";
import type { Vault, VaultConnection, VaultSource, VaultAILesson, Domain, Lesson, Question } from "../types";

export function EditVaultModal({
  targetName,
  initialVault,
  domains = [],
  lessons = [],
  questions = [],
  onClose,
  onSave,
  onDelete,
}: {
  targetName: string;
  initialVault: Vault;
  domains?: Domain[];
  lessons?: Lesson[];
  questions?: Question[];
  onClose: () => void;
  onSave: (v: Vault) => void;
  onDelete?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"geral" | "conexoes" | "fontes" | "ai_lessons">("geral");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Core Vault Fields
  const [learning, setLearning] = useState(initialVault.learning || "");
  const [answer, setAnswer] = useState(initialVault.answer || "");
  const [notes, setNotes] = useState(initialVault.notes || "");

  // Interactive Pill Tags for Highlights, Examples, Applications
  const [highlights, setHighlights] = useState<string[]>(initialVault.highlights || []);
  const [newHighlightInput, setNewHighlightInput] = useState("");

  const [examples, setExamples] = useState<string[]>(initialVault.examples || []);
  const [newExampleInput, setNewExampleInput] = useState("");

  const [applications, setApplications] = useState<string[]>(initialVault.applications || []);
  const [newApplicationInput, setNewApplicationInput] = useState("");

  const parseToArray = (val: string | string[] | undefined): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return [val];
  };

  const [insightsList, setInsightsList] = useState<string[]>(parseToArray(initialVault.insights));
  const [newInsightInput, setNewInsightInput] = useState("");

  const [doubtsList, setDoubtsList] = useState<string[]>(parseToArray(initialVault.doubts));
  const [newDoubtInput, setNewDoubtInput] = useState("");

  const [thirtySeconds, setThirtySeconds] = useState(initialVault.activeReview?.thirtySeconds || "");

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

  // 1. Conexões com Lessons, Questions ou Vaults
  const parseInitialConnections = (): VaultConnection[] => {
    return (initialVault.connections || []).map((c, i) => {
      if (typeof c === "object" && c !== null) return c;
      return { id: `c-${i}`, type: "lesson", title: c };
    });
  };
  const [connections, setConnections] = useState<VaultConnection[]>(parseInitialConnections());
  const [newConnType, setNewConnType] = useState<"lesson" | "question" | "vault">("lesson");
  const [newConnTitle, setNewConnTitle] = useState("");

  const handleAddConnection = () => {
    if (!newConnTitle.trim()) return;
    setConnections(prev => [...prev, {
      id: `conn-${Date.now()}`,
      type: newConnType,
      title: newConnTitle.trim(),
    }]);
    setNewConnTitle("");
  };

  const handleRemoveConnection = (index: number) => {
    setConnections(prev => prev.filter((_, i) => i !== index));
  };

  // 2. Fontes e Referências com Links
  const parseInitialSources = (): VaultSource[] => {
    return (initialVault.sources || []).map((s, i) => {
      if (typeof s === "object" && s !== null) return s;
      return { id: `s-${i}`, title: s, url: "", type: "outro" };
    });
  };
  const [sources, setSources] = useState<VaultSource[]>(parseInitialSources());
  const [newSourceTitle, setNewSourceTitle] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceAuthor, setNewSourceAuthor] = useState("");
  const [newSourceType, setNewSourceType] = useState<VaultSource["type"]>("documentacao");

  const handleAddSource = () => {
    if (!newSourceTitle.trim()) return;
    setSources(prev => [...prev, {
      id: `src-${Date.now()}`,
      title: newSourceTitle.trim(),
      url: newSourceUrl.trim(),
      authorOrPlatform: newSourceAuthor.trim(),
      type: newSourceType,
    }]);
    setNewSourceTitle("");
    setNewSourceUrl("");
    setNewSourceAuthor("");
  };

  const handleRemoveSource = (index: number) => {
    setSources(prev => prev.filter((_, i) => i !== index));
  };

  // 3. Textos / Aulas da IA Usada para Estudo (Gemini, Claude, ChatGPT, etc.)
  const [aiLessons, setAiLessons] = useState<VaultAILesson[]>(initialVault.aiLessons || []);
  const [newAiModel, setNewAiModel] = useState("Gemini 1.5 Pro (Google)");
  const [newAiTopic, setNewAiTopic] = useState("");
  const [newAiContent, setNewAiContent] = useState("");

  const handleAddAiLesson = () => {
    if (!newAiContent.trim()) return;
    setAiLessons(prev => [
      ...prev,
      {
        id: `ai-${Date.now()}`,
        aiModel: newAiModel,
        topic: newAiTopic.trim() || "Explicação conceitual",
        content: newAiContent.trim(),
        date: "Hoje",
      }
    ]);
    setNewAiTopic("");
    setNewAiContent("");
  };

  const handleRemoveAiLesson = (index: number) => {
    setAiLessons(prev => prev.filter((_, i) => i !== index));
  };

  // Insights handlers
  const handleAddInsight = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && "key" in e && e.key !== "Enter") return;
    if (!newInsightInput.trim()) return;
    setInsightsList(prev => [...prev, newInsightInput.trim()]);
    setNewInsightInput("");
  };
  const handleRemoveInsight = (index: number) => {
    setInsightsList(prev => prev.filter((_, i) => i !== index));
  };

  // Doubts handlers
  const handleAddDoubt = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && "key" in e && e.key !== "Enter") return;
    if (!newDoubtInput.trim()) return;
    setDoubtsList(prev => [...prev, newDoubtInput.trim()]);
    setNewDoubtInput("");
  };
  const handleRemoveDoubt = (index: number) => {
    setDoubtsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedVault: Vault = {
      learning: learning.trim(),
      answer: answer.trim(),
      notes: notes.trim(),
      highlights,
      examples,
      applications,
      insights: insightsList,
      doubts: doubtsList,
      connections,
      sources,
      aiLessons,
      activeReview: {
        what: learning.trim(),
        how: answer.trim(),
        why: initialVault.activeReview?.why || "Para consolidar e aplicar no mundo real com maestria.",
        where: initialVault.activeReview?.where || "",
        connections: connections.map(c => c.title).join(", "),
        thirtySeconds: thirtySeconds.trim(),
      }
    };

    onSave(updatedVault);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: "780px", maxHeight: "90vh", overflowY: "auto" }}>
        <div className="modal-header">
          <div className="modal-title">
            <Edit3 size={18} />
            <h3>Editar Vault: {targetName}</h3>
          </div>
          <button className="icon-button" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Sub tabs in Modal */}
        <div className="modal-sub-tabs" style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "16px" }}>
          <button
            type="button"
            className={`tab-btn-pill ${activeTab === "geral" ? "active" : ""}`}
            onClick={() => setActiveTab("geral")}
          >
            ▤ Síntese & Destaques
          </button>
          <button
            type="button"
            className={`tab-btn-pill ${activeTab === "conexoes" ? "active" : ""}`}
            onClick={() => setActiveTab("conexoes")}
          >
            🔗 Conexões ({connections.length})
          </button>
          <button
            type="button"
            className={`tab-btn-pill ${activeTab === "fontes" ? "active" : ""}`}
            onClick={() => setActiveTab("fontes")}
          >
            📚 Fontes com Links ({sources.length})
          </button>
          <button
            type="button"
            className={`tab-btn-pill ${activeTab === "ai_lessons" ? "active" : ""}`}
            onClick={() => setActiveTab("ai_lessons")}
          >
            🤖 Aulas da IA ({aiLessons.length})
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* TAB 1: GERAL (Aprendizado, Answer, Notas, Destaques Tags, Exemplos Tags, Aplicações Tags) */}
          {activeTab === "geral" && (
            <div className="modal-tab-content">
              <div className="form-group">
                <label>📖 Aprendizado Central (O que você precisa lembrar?)</label>
                <textarea rows={2} value={learning} onChange={(e) => setLearning(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>🧠 Answer / Síntese Profunda (O que é · como funciona · por que existe)</label>
                <textarea rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>📝 Notas & Sínteses Rápidas (Anotações livres e observações)</label>
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Insira anotações soltas, raciocínio livre ou notas de estudo..." />
              </div>

              {/* 🔖 DESTAQUES (TAGS) */}
              <div className="form-group">
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
                      placeholder="Digite um destaque e pressione Enter..."
                    />
                    <button type="button" className="btn-tag-add" onClick={handleAddHighlight}>
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 🌎 EXEMPLOS (TAGS) */}
              <div className="form-group">
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

              {/* 🚀 APLICAÇÕES (TAGS) */}
              <div className="form-group">
                <label>🚀 Aplicações no Mundo Real</label>
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

              {/* 💡 MÚLTIPLOS INSIGHTS */}
              <div className="form-group">
                <label>💡 Insights de Primeira Ordem ({insightsList.length})</label>
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

              {/* ❓ MÚLTIPLAS DÚVIDAS */}
              <div className="form-group">
                <label>❓ Dúvidas em Aberto ({doubtsList.length})</label>
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

              <div className="form-group">
                <label>⚡ Explique em 30 Segundos (Feynman Technique)</label>
                <textarea rows={2} value={thirtySeconds} onChange={(e) => setThirtySeconds(e.target.value)} />
              </div>
            </div>
          )}

          {/* TAB 2: CONEXÕES COM OUTRAS LESSONS, QUESTIONS OU VAULTS */}
          {activeTab === "conexoes" && (
            <div className="modal-tab-content">
              <p className="tab-helper-text">
                Vincule esta Vault a outras <strong>Lessons</strong>, <strong>Questions</strong> ou <strong>Vaults</strong> existentes para criar conexões em rede no seu grafo de conhecimento.
              </p>

              {/* Add Connection Row */}
              <div className="add-item-box-v2">
                <div className="form-row-3">
                  <div className="form-group">
                    <label>Tipo de Conexão</label>
                    <select value={newConnType} onChange={(e) => setNewConnType(e.target.value as any)}>
                      <option value="lesson">▦ Outra Lesson</option>
                      <option value="question">□ Outra Question</option>
                      <option value="vault">▤ Outro Vault</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label>Selecionar ou Digitar Título da Conexão</label>
                    <input
                      type="text"
                      list="connections-datalist"
                      value={newConnTitle}
                      onChange={(e) => setNewConnTitle(e.target.value)}
                      placeholder={newConnType === "lesson" ? "Selecione ou digite uma Lesson..." : newConnType === "question" ? "Selecione ou digite uma Question..." : "Nome do Vault..."}
                    />
                    <datalist id="connections-datalist">
                      {newConnType === "lesson" && lessons.map(l => <option key={l.id} value={l.name}>{l.domain} • {l.name}</option>)}
                      {newConnType === "question" && questions.map(q => <option key={q.id} value={q.title}>{q.domain} • {q.lesson} • {q.title}</option>)}
                      {newConnType === "vault" && questions.map(q => <option key={`v-${q.id}`} value={`Vault • ${q.title}`} />)}
                    </datalist>
                  </div>
                </div>

                <button type="button" className="btn-add-mini" onClick={handleAddConnection}>
                  <Plus size={14} /> Adicionar Conexão
                </button>
              </div>

              {/* Current Connections List */}
              <div className="items-manage-list">
                <label className="list-label">Conexões Atuais ({connections.length}):</label>
                {connections.length > 0 ? (
                  connections.map((c, idx) => (
                    <div key={c.id || idx} className="item-manage-row">
                      <span className="item-badge-pill">
                        {c.type === "lesson" ? "▦ Lesson" : c.type === "question" ? "□ Question" : "▤ Vault"}
                      </span>
                      <strong className="item-title">{c.title}</strong>
                      <button
                        type="button"
                        className="btn-trash-icon"
                        onClick={() => handleRemoveConnection(idx)}
                        title="Remover conexão"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="empty-subtext">Nenhuma conexão adicionada ainda.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FONTES E REFERÊNCIAS COM LINKS */}
          {activeTab === "fontes" && (
            <div className="modal-tab-content">
              <p className="tab-helper-text">
                Cadastre livros, artigos, papers, documentações, vídeos e aulas com <strong>links (URLs)</strong> diretos para consulta rápida.
              </p>

              {/* Add Source Box */}
              <div className="add-item-box-v2">
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Título da Fonte / Referência *</label>
                    <input
                      type="text"
                      value={newSourceTitle}
                      onChange={(e) => setNewSourceTitle(e.target.value)}
                      placeholder="Ex: MDN Web Docs — Memory Management..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Tipo</label>
                    <select value={newSourceType} onChange={(e) => setNewSourceType(e.target.value as any)}>
                      <option value="documentacao">🌐 Documentação Web</option>
                      <option value="artigo">📝 Artigo / Post</option>
                      <option value="livro">📚 Livro</option>
                      <option value="paper">📄 Paper Acadêmico</option>
                      <option value="video">🎥 Vídeo / Aula</option>
                      <option value="ia">🤖 Conversa com IA</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>URL / Link Web (Opcional)</label>
                    <input
                      type="url"
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Autor / Plataforma (Opcional)</label>
                    <input
                      type="text"
                      value={newSourceAuthor}
                      onChange={(e) => setNewSourceAuthor(e.target.value)}
                      placeholder="Ex: Mozilla, Martin Fowler, YouTube..."
                    />
                  </div>
                </div>

                <button type="button" className="btn-add-mini" onClick={handleAddSource}>
                  <Plus size={14} /> Adicionar Fonte
                </button>
              </div>

              {/* Current Sources List */}
              <div className="items-manage-list">
                <label className="list-label">Fontes & Referências Cadastradas ({sources.length}):</label>
                {sources.length > 0 ? (
                  sources.map((s, idx) => (
                    <div key={s.id || idx} className="item-manage-row">
                      <span className="source-tag-mini">{s.type || "link"}</span>
                      <div className="source-row-info">
                        <strong>{s.title}</strong>
                        {s.url && <span className="source-url-preview"><ExternalLink size={10} /> {s.url}</span>}
                      </div>
                      <button
                        type="button"
                        className="btn-trash-icon"
                        onClick={() => handleRemoveSource(idx)}
                        title="Remover fonte"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="empty-subtext">Nenhuma fonte cadastrada ainda.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: AULAS & EXPLICAÇÕES DA IA USADA */}
          {activeTab === "ai_lessons" && (
            <div className="modal-tab-content">
              <p className="tab-helper-text">
                Insira textos, resumos ou aulas explicativas geradas por IAs como <strong>Gemini (Google)</strong>, <strong>Claude (Anthropic)</strong>, <strong>ChatGPT (OpenAI)</strong> ou <strong>DeepSeek</strong> durante seus estudos.
              </p>

              {/* Add AI Lesson Box */}
              <div className="add-item-box-v2">
                <div className="form-row-2">
                  <div className="form-group">
                    <label>IA Usada no Estudo *</label>
                    <select value={newAiModel} onChange={(e) => setNewAiModel(e.target.value)}>
                      <option value="Gemini 1.5 Pro (Google)">Gemini 1.5 Pro (Google)</option>
                      <option value="Gemini 1.5 Flash (Google)">Gemini 1.5 Flash (Google)</option>
                      <option value="Claude 3.5 Sonnet (Anthropic)">Claude 3.5 Sonnet (Anthropic)</option>
                      <option value="Claude 3 Opus (Anthropic)">Claude 3 Opus (Anthropic)</option>
                      <option value="ChatGPT (GPT-4o OpenAI)">ChatGPT (GPT-4o OpenAI)</option>
                      <option value="DeepSeek-R1">DeepSeek-R1</option>
                      <option value="KOS AI Copilot">KOS AI Copilot</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Tópico / Pergunta Feita à IA</label>
                    <input
                      type="text"
                      value={newAiTopic}
                      onChange={(e) => setNewAiTopic(e.target.value)}
                      placeholder="Ex: Como funciona a memória Stack vs Heap em detalhes?"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Texto / Aula Explicativa da IA *</label>
                  <textarea
                    rows={5}
                    value={newAiContent}
                    onChange={(e) => setNewAiContent(e.target.value)}
                    placeholder="Cole aqui a resposta completa ou explicação gerada pela IA..."
                  />
                </div>

                <button type="button" className="btn-add-mini" onClick={handleAddAiLesson}>
                  <Plus size={14} /> Adicionar Aula de IA
                </button>
              </div>

              {/* Current AI Lessons List */}
              <div className="items-manage-list">
                <label className="list-label">Aulas de IA Registradas ({aiLessons.length}):</label>
                {aiLessons.length > 0 ? (
                  aiLessons.map((item, idx) => (
                    <div key={item.id || idx} className="ai-lesson-manage-card">
                      <div className="ai-lesson-manage-head">
                        <span className="ai-model-tag">🤖 {item.aiModel}</span>
                        {item.topic && <strong>{item.topic}</strong>}
                        <button
                          type="button"
                          className="btn-trash-icon"
                          onClick={() => handleRemoveAiLesson(idx)}
                          title="Remover aula de IA"
                          style={{ marginLeft: "auto" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <p className="ai-content-clamp">{item.content.substring(0, 160)}...</p>
                    </div>
                  ))
                ) : (
                  <p className="empty-subtext">Nenhum texto de IA registrado ainda.</p>
                )}
              </div>
            </div>
          )}

          {showDeleteConfirm && (
            <div className="delete-confirm-box" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--danger)", borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
              <p style={{ color: "var(--danger)", fontSize: "0.85rem", fontWeight: 600, margin: "0 0 8px 0" }}>Tem certeza que deseja excluir o Vault de "{targetName}"?</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" className="btn-danger-confirm" style={{ background: "var(--danger)", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }} onClick={() => { if (onDelete) onDelete(); onClose(); }}>Sim, Excluir</button>
                <button type="button" className="btn-cancel" style={{ padding: "6px 12px", fontSize: "0.8rem" }} onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
              </div>
            </div>
          )}

          <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              {onDelete && !showDeleteConfirm && (
                <button type="button" className="btn-delete-row" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 size={14} /> Excluir Vault
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn-submit">Salvar Vault Completa</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
