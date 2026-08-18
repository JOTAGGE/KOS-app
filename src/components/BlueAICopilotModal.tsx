import React, { useState, useRef, useEffect } from "react";
import {
  X, Sparkles, Send, User, Check, RefreshCw, AlertCircle, Trash2, CheckCircle2,
  BookOpen, Layers, Package, HelpCircle, ChevronDown, ChevronRight, Award
} from "lucide-react";
import { useAuth } from "../firebase/authContext";
import { BlueService } from "../ai/blue/blueService";
import { BLUE_ONBOARDING_INITIAL_MESSAGE, BLUE_PROMPT_SUGGESTIONS } from "../ai/blue/bluePrompts";
import type {
  BlueMessage,
  DomainProposal,
  LessonsProposal,
  ModulesProposal,
  QuestionsProposal,
  FullCurriculumProposal,
  StudyRecommendation
} from "../ai/blue/blueTypes";
import type { Domain, Lesson, ModuleItem, Question, LessonCategory } from "../types";

interface BlueAICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  domains: Domain[];
  lessons: Lesson[];
  categories: LessonCategory[];
  modules: ModuleItem[];
  questions: Question[];
  onSaveDomain: (d: Omit<Domain, "id">) => void;
  onSaveCategory?: (c: Omit<LessonCategory, "id">) => void;
  onSaveLesson: (l: Omit<Lesson, "id">, days?: any) => void;
  onSaveModule: (m: Omit<ModuleItem, "id">) => void;
  onSaveQuestion: (q: Omit<Question, "id">) => void;
}

const playSuccessChime = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12); // G5
    osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.25); // C6
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
};

export function BlueAICopilotModal({
  isOpen,
  onClose,
  domains,
  lessons,
  categories,
  modules,
  questions,
  onSaveDomain,
  onSaveCategory,
  onSaveLesson,
  onSaveModule,
  onSaveQuestion,
}: BlueAICopilotModalProps) {
  const { user, userProfile } = useAuth();
  const currentUserId = user?.uid || "guest_user";
  const currentUserName = userProfile?.name || user?.displayName || "Estudante";
  const storageKey = `kos_blue_chat_history_${currentUserId}`;

  const [messages, setMessages] = useState<BlueMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return [
      {
        id: "initial",
        role: "assistant",
        content: BLUE_ONBOARDING_INITIAL_MESSAGE,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "text",
      },
    ];
  });

  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [creationToast, setCreationToast] = useState<{ message: string; type: string } | null>(null);

  const [activeProposal, setActiveProposal] = useState<{
    type: "curriculum" | "domain" | "lessons" | "modules" | "questions" | "recommendations";
    data: any;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {}
  }, [messages, storageKey]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeProposal, loading]);

  if (!isOpen) return null;

  const handleClearHistory = () => {
    if (confirm("Deseja iniciar uma nova conversa com a Blue e limpar o histórico atual?")) {
      const resetMessages: BlueMessage[] = [
        {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: BLUE_ONBOARDING_INITIAL_MESSAGE,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          type: "text",
        },
      ];
      setMessages(resetMessages);
      setActiveProposal(null);
      setErrorMsg("");
      setCreationToast(null);
      localStorage.removeItem(storageKey);
    }
  };

  const getUserContext = () => ({
    userName: currentUserName,
    existingDomains: domains.map(d => d.name),
    existingLessons: lessons.map(l => `${l.name} (${l.domain})`),
    activeDomain: domains[0]?.name,
  });

  // --- Send Standard Chat Message ---
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || loading) return;

    setErrorMsg("");
    setInputPrompt("");

    const userMessage: BlueMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const res = await BlueService.chat(currentUserId, history, getUserContext());

      if (res.success && res.payload) {
        const payload = res.payload;
        const assistantMessage: BlueMessage = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          content: payload.replyText || "Estruturei sua jornada de estudos no card abaixo!",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          type: payload.hasCurriculumProposal && payload.curriculum ? "curriculum_proposal" : "text",
          data: payload.curriculum,
        };

        setMessages([...newMessages, assistantMessage]);

        if (payload.hasCurriculumProposal && payload.curriculum) {
          setActiveProposal({ type: "curriculum", data: payload.curriculum });
        }
      } else {
        setErrorMsg(res.error || "Não foi possível obter resposta da Blue no momento.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro inesperado ao consultar a Blue.");
    } finally {
      setLoading(false);
    }
  };

  // --- 1-CLICK COMPLETE CURRICULUM CREATION WITH DEDUPLICATION ---
  const handleApproveCurriculum = async (curriculum: FullCurriculumProposal) => {
    setLoading(true);

    try {
      const domainName = curriculum.domain.name.trim();
      const categoryName = (curriculum.domain.category || "Geral").trim();

      // 1. Check if Domain already exists (case-insensitive)
      const existingDomain = domains.find(d => d.name.toLowerCase() === domainName.toLowerCase());
      const isDomainNew = !existingDomain;

      if (isDomainNew) {
        onSaveDomain({
          name: domainName,
          icon: curriculum.domain.icon || "📚",
          color: "#3b82f6",
          gradient: "linear-gradient(135deg, #2563eb, #1d4ed8)",
          createdAt: "Hoje",
          layer: "human knowledge",
          priorityLevel: "P1 - Alta",
          interestLevel: "4/5 - Alto",
          meta: curriculum.domain.description || "Domínio de Aprendizagem no KOS",
          proposito: curriculum.domain.description,
          objetivo: curriculum.domain.goal,
          focusLesson: curriculum.lessons[0]?.name || "Fundamentos",
          projects: [],
          lessonsCount: curriculum.lessons.length,
          questionsCount: curriculum.lessons.reduce((acc, l) => acc + (l.questions?.length || 0), 0),
          progress: 0,
          nextUp: curriculum.lessons[0]?.name || "Fundamentos",
        });
      }

      // 2. Check if Category already exists
      const existingCat = categories.find(c =>
        c.name.toLowerCase() === categoryName.toLowerCase() &&
        c.domain?.toLowerCase() === domainName.toLowerCase()
      );
      if (!existingCat && onSaveCategory && categoryName) {
        onSaveCategory({
          name: categoryName,
          domain: domainName,
          lessonsCount: curriculum.lessons.length,
          description: `Categoria temática para ${domainName}`,
          color: "#3b82f6",
        });
      }

      let createdLessonsCount = 0;
      let createdModulesCount = 0;
      let createdQuestionsCount = 0;

      // 3. Create Lessons, Modules & Questions (avoiding duplicates)
      for (const l of curriculum.lessons) {
        const lName = l.name.trim();
        const lessonModules = l.modules || [];
        const lessonQuestions = l.questions || [];

        // Check if lesson already exists in this domain
        const existingLesson = lessons.find(
          item => item.name.toLowerCase() === lName.toLowerCase() &&
                  item.domain.toLowerCase() === domainName.toLowerCase()
        );

        if (!existingLesson) {
          createdLessonsCount++;
          onSaveLesson({
            name: lName,
            domain: domainName,
            category: l.category || categoryName,
            module: lessonModules[0]?.name || "Fundamentos",
            questionsCount: lessonQuestions.length,
            progress: 0,
            difficulty: l.difficulty || "Intermediário",
            status: "Em Estudo",
            createdAt: "Hoje",
            lastReview: "Hoje",
            nextReview: "Em 2 dias",
            objective: l.objective,
            items: [
              { id: `item-${Date.now()}-1`, title: "Estudo Inicial & Active Recall", completed: false }
            ],
            keyConcepts: l.keyConcepts || [],
            difficulties: [],
            projects: [],
          });
        }

        // Save Modules
        for (const m of lessonModules) {
          const mName = m.name.trim();
          const existingMod = modules.find(
            item => item.name.toLowerCase() === mName.toLowerCase() &&
                    item.lesson.toLowerCase() === lName.toLowerCase()
          );

          if (!existingMod) {
            createdModulesCount++;
            onSaveModule({
              name: mName,
              domain: domainName,
              category: l.category || categoryName,
              lesson: lName,
              questionsCount: lessonQuestions.filter(q => q.moduleName === m.name).length || 1,
              progress: 0,
              description: m.description,
              status: "Em Estudo",
            });
          }
        }

        // Save Questions with Initial Vaults
        for (const q of lessonQuestions) {
          const qTitle = q.title.trim();
          const existingQ = questions.find(
            item => item.title.toLowerCase() === qTitle.toLowerCase() &&
                    item.lesson.toLowerCase() === lName.toLowerCase()
          );

          if (!existingQ) {
            createdQuestionsCount++;
            onSaveQuestion({
              title: qTitle,
              domain: domainName,
              lesson: lName,
              module: q.moduleName || lessonModules[0]?.name || "Geral",
              stage: "study",
              progress: 0,
              createdAt: "Hoje",
              vault: {
                learning: q.initialVaultSummary,
                answer: q.initialVaultSummary,
                highlights: [q.cognitiveType || "Active Recall"],
                examples: [],
                applications: ["Aplique durante as sessões de Active Recall."],
                insights: ["Estruturado pela Blue AI no KOS."],
                doubts: [],
                connections: [domainName, lName],
                sources: [{ title: "KOS Blue AI", type: "ia" }],
                activeReview: {
                  what: qTitle,
                  how: q.initialVaultSummary,
                  why: "Conceito essencial para retenção e maestria do tema.",
                  where: `${domainName} → ${lName}`,
                  connections: domainName,
                  thirtySeconds: q.initialVaultSummary,
                },
              },
            });
          }
        }
      }

      playSuccessChime();

      const toastText = isDomainNew
        ? `Grade Completa Criada! 1 Domínio, ${createdLessonsCount} Lições, ${createdModulesCount} Módulos e ${createdQuestionsCount} Perguntas salvos no Firebase!`
        : `Domínio Existente '${domainName}' Atualizado! ${createdLessonsCount} novas Lições, ${createdModulesCount} Módulos e ${createdQuestionsCount} Perguntas adicionadas!`;

      setCreationToast({
        message: toastText,
        type: "curriculum"
      });
      setTimeout(() => setCreationToast(null), 6000);

      const celebratoryMessage: BlueMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: isDomainNew
          ? `🎉 **Grade Completa Criada e Sincronizada com Sucesso!**\n\n- 🏷️ **Domínio:** ${domainName} (${curriculum.domain.icon})\n- 📂 **Categoria:** ${categoryName}\n- 📚 **${createdLessonsCount} Lições** estruturadas\n- 📦 **${createdModulesCount} Módulos** de aprofundamento\n- 🎯 **${createdQuestionsCount} Questions de Active Recall** com Vaults prontas\n\nToda a estrutura já está disponível na sua **Knowledge DB**, no **Dashboard** e pronta para você praticar na aba **Study Session**!`
          : `🎉 **Estrutura Expandida no Domínio Existente '${domainName}'!**\n\n- 📚 **+${createdLessonsCount} Novas Lições** adicionadas\n- 📦 **+${createdModulesCount} Módulos** integrados\n- 🎯 **+${createdQuestionsCount} Perguntas de Active Recall** prontas com Vaults\n\nSeu domínio foi enriquecido sem duplicatas e já está sincronizado no KOS!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "text",
      };

      setMessages(prev => [...prev, celebratoryMessage]);
      setActiveProposal(null);
    } catch (err: any) {
      setErrorMsg("Erro ao salvar Grade: " + err?.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-blue-ai-shell" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="blue-ai-header">
          <div className="blue-ai-branding">
            <div className="blue-avatar-glow">
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <h3>BLUE</h3>
                <span className="blue-ai-badge">KOS Intelligence</span>
              </div>
              <small>Orientadora de Aprendizagem & Método Cycles</small>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              className="icon-button"
              onClick={handleClearHistory}
              title="Iniciar nova conversa e limpar histórico"
              style={{ width: "32px", height: "32px" }}
            >
              <Trash2 size={14} />
            </button>
            <button className="settings-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Real-time Creation Feedback Toast */}
        {creationToast && (
          <div className="blue-creation-toast">
            <CheckCircle2 size={15} />
            <span>{creationToast.message}</span>
          </div>
        )}

        {/* Scrollable Chat & Proposals Area */}
        <div className="blue-ai-body">
          {errorMsg && (
            <div className="settings-alert-banner danger" style={{ margin: "0 0 12px 0" }}>
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`blue-chat-bubble-wrap ${m.role}`}>
              <div className="bubble-avatar">
                {m.role === "assistant" ? <Sparkles size={14} /> : <User size={14} />}
              </div>
              <div className="bubble-content-box">
                <div className="bubble-header-meta">
                  <strong>{m.role === "assistant" ? "Blue" : currentUserName}</strong>
                  <span>{m.timestamp}</span>
                </div>
                <div className="bubble-text" style={{ whiteSpace: "pre-line" }}>
                  {m.content}
                </div>

                {/* Inline Curriculum Proposal Card if message contains structured data */}
                {m.type === "curriculum_proposal" && m.data && (
                  <div className="blue-proposal-card full-curriculum-card" style={{ marginTop: "12px" }}>
                    <div className="proposal-card-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="proposal-tag">PROPOSTA DE GRADE COMPLETA</span>
                        <span className="badge-pill blue" style={{ fontSize: "10px" }}>
                          🏷️ {m.data.domain?.category || "Geral"}
                        </span>
                      </div>
                      <span className="proposal-icon">{m.data.domain?.icon || "📚"}</span>
                    </div>

                    <h3 className="proposal-title" style={{ fontSize: "17px", margin: "4px 0" }}>
                      {m.data.domain?.name}
                    </h3>
                    <p className="proposal-desc" style={{ fontSize: "12px", marginBottom: "8px" }}>
                      {m.data.domain?.description}
                    </p>

                    <div className="proposal-goal-box" style={{ padding: "8px 12px", margin: "0 0 12px 0" }}>
                      <strong>🎯 Meta de Aprendizado:</strong>
                      <span>{m.data.domain?.goal}</span>
                    </div>

                    {/* Lessons, Modules & Questions Breakdown */}
                    <div className="curriculum-lessons-stack">
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "12.5px", color: "var(--text)" }}>
                        Trilha Estruturada ({m.data.lessons?.length} Lições):
                      </h4>

                      {m.data.lessons?.map((l: any, lIdx: number) => (
                        <div key={lIdx} className="curriculum-lesson-block">
                          <div className="curriculum-lesson-head">
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span className="lesson-num-badge">{lIdx + 1}</span>
                              <strong>{l.name}</strong>
                            </div>
                            <span className="badge-pill blue" style={{ fontSize: "9.5px" }}>{l.difficulty}</span>
                          </div>

                          <p style={{ margin: "4px 0 6px 0", fontSize: "11px", color: "var(--text-muted)" }}>
                            {l.objective}
                          </p>

                          {/* Modules chips */}
                          <div className="curriculum-sub-row">
                            <small style={{ color: "var(--text-dim)", fontSize: "10.5px" }}>📦 Módulos:</small>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                              {l.modules?.map((mod: any, mIdx: number) => (
                                <span key={mIdx} className="preview-chip" style={{ fontSize: "10px", padding: "2px 6px" }}>
                                  {mod.name}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Questions preview */}
                          <div className="curriculum-questions-list">
                            <small style={{ color: "var(--text-dim)", fontSize: "10.5px", display: "block", margin: "2px 0" }}>
                              🎯 Perguntas de Active Recall ({l.questions?.length || 0}):
                            </small>
                            {l.questions?.map((q: any, qIdx: number) => (
                              <div key={qIdx} className="curriculum-question-item">
                                <span style={{ color: "#3b82f6" }}>❓</span>
                                <span>{q.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Master 1-Click Approval Action */}
                    <div className="proposal-actions-row" style={{ marginTop: "14px" }}>
                      <button
                        type="button"
                        className="btn-proposal-primary"
                        onClick={() => handleApproveCurriculum(m.data)}
                        disabled={loading}
                        style={{ padding: "10px 18px", fontSize: "12.5px" }}
                      >
                        <Check size={15} /> 🚀 Criar e Salvar Grade Completa no KOS (Firebase)
                      </button>
                      <button
                        type="button"
                        className="btn-proposal-secondary"
                        onClick={() => handleSendMessage(`Faça um ajuste na grade do domínio ${m.data.domain?.name} focando mais em...`)}
                        disabled={loading}
                      >
                        <RefreshCw size={13} /> Pedir Ajuste
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator with Animated Glow */}
          {loading && (
            <div className="blue-chat-bubble-wrap assistant">
              <div className="bubble-avatar pulsate">
                <Sparkles size={14} />
              </div>
              <div className="bubble-content-box loading-box" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <RefreshCw size={13} className="spin-icon" style={{ animation: "spin 1.2s linear infinite" }} />
                  <strong>Blue está estruturando sua grade completa...</strong>
                </div>
                <span>Criando Domínio, Lições, Módulos e Perguntas de Active Recall com gabaritos conceituais para a Vault.</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>


        {/* Quick Suggestion Chips */}
        {messages.length <= 2 && (
          <div className="blue-quick-chips-row">
            {BLUE_PROMPT_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                className="quick-chip-btn"
                onClick={() => handleSendMessage(s)}
                disabled={loading}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="blue-ai-input-bar">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Diga o que você quer aprender (ex: Primatologia, Machine Learning, etc.)..."
            disabled={loading}
            autoFocus
          />
          <button
            type="button"
            className="btn-send-blue"
            onClick={() => handleSendMessage()}
            disabled={!inputPrompt.trim() || loading}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
