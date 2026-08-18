import React, { useState } from "react";
import {
  ArrowLeft, Edit3, Trash2, Plus, Check, X, ExternalLink,
  Target, Compass, Image as ImageIcon, Link as LinkIcon,
  Layers, CheckSquare, TestTube2, TrendingUp, Lightbulb,
  BookOpen, FileText, Flag, Save, Github, Figma, Globe,
  Smartphone, Calendar, Clock, Sparkles, ChevronRight
} from "lucide-react";
import type { Project, ProjectTask, Domain } from "../types";

export function ProjectFullPage({
  project,
  tasks,
  domains,
  onBack,
  onEditProject,
  onDeleteProject,
  onUpdateProject,
  onToggleTask,
  onAddTask,
  onDeleteTask,
}: {
  project: Project;
  tasks: ProjectTask[];
  domains: Domain[];
  onBack: () => void;
  onEditProject: () => void;
  onDeleteProject: (projectId: string) => void;
  onUpdateProject: (p: Project) => void;
  onToggleTask: (taskId: string) => void;
  onAddTask: (projectId: string, title: string, dueDate: string) => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Quick Inline Task Creator
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("Hoje");

  // Inline Section Editing States
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Draft state for inline edits
  const [draftProject, setDraftProject] = useState<Project>(project);

  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const completedTasks = projectTasks.filter(t => t.completed).length;

  const handleSaveDraft = () => {
    onUpdateProject(draftProject);
    setEditingSection(null);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(project.id, newTaskTitle.trim(), newTaskDueDate);
    setNewTaskTitle("");
  };

  // Add Item to Array Helper
  const [newTech, setNewTech] = useState("");
  const [newPart, setNewPart] = useState("");
  const [newDecision, setNewDecision] = useState("");
  const [newProblem, setNewProblem] = useState("");
  const [newSolution, setNewSolution] = useState("");
  const [newInsight, setNewInsight] = useState("");
  const [newResource, setNewResource] = useState("");
  const [newGalleryUrl, setNewGalleryUrl] = useState("");

  return (
    <div className="project-fullpage-container">
      {/* Top Breadcrumb & Actions */}
      <div className="project-page-topbar">
        <button type="button" className="btn-back-link" onClick={onBack}>
          <ArrowLeft size={15} />
          <span>Voltar para Projetos</span>
        </button>

        <div className="project-topbar-actions">
          <button type="button" className="btn-action-pill" onClick={onEditProject}>
            <Edit3 size={13} />
            <span>Editar Metadados</span>
          </button>

          {confirmDelete ? (
            <div className="delete-confirm-box">
              <span style={{ fontSize: "11px", color: "#fca5a5" }}>Excluir Projeto?</span>
              <button
                type="button"
                className="btn-confirm-delete"
                onClick={() => onDeleteProject(project.id)}
              >
                Sim, Excluir
              </button>
              <button
                type="button"
                className="btn-cancel-delete"
                onClick={() => setConfirmDelete(false)}
              >
                Não
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-action-pill delete"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={13} />
              <span>Excluir</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Notion-Style Document Header */}
      <div className="project-notion-header">
        <div className="project-icon-large">{project.icon || "📁"}</div>
        <h1 className="project-title-large">{project.name}</h1>
        
        <div className="project-meta-badges-row">
          <span className="project-type-badge">{project.type || "Product"}</span>
          <span className="bullet-sep">·</span>
          <span className={`project-status-pill status-${project.status.toLowerCase().replace(/\s+/g, "-")}`}>
            ● {project.status}
          </span>
          <span className="bullet-sep">·</span>
          <span className="project-domain-badge">◈ {project.domain}</span>
          {project.category && (
            <>
              <span className="bullet-sep">·</span>
              <span className="project-cat-badge">🏷️ {project.category}</span>
            </>
          )}
        </div>

        {project.description && (
          <p className="project-lead-desc">{project.description}</p>
        )}
      </div>

      <div className="project-divider" />

      {/* Structured Sections */}
      <div className="project-sections-stack">
        
        {/* =========================================================================
           1. 🎯 OBJETIVO
           ========================================================================= */}
        <section className="project-section-card">
          <div className="section-head-row">
            <div className="section-title">
              <Target size={18} style={{ color: "#ef4444" }} />
              <h3>🎯 Objetivo</h3>
            </div>
            {editingSection !== "objective" ? (
              <button className="btn-edit-sec" onClick={() => setEditingSection("objective")}><Edit3 size={12} /> Editar</button>
            ) : (
              <button className="btn-save-sec" onClick={handleSaveDraft}><Save size={12} /> Salvar</button>
            )}
          </div>

          {editingSection === "objective" ? (
            <div className="section-edit-form">
              <div className="form-group">
                <label>Problema</label>
                <textarea
                  rows={2}
                  placeholder="Qual o problema principal que este projeto resolve?"
                  value={draftProject.objective?.problem || ""}
                  onChange={(e) => setDraftProject({
                    ...draftProject,
                    objective: { ...(draftProject.objective || {}), problem: e.target.value }
                  })}
                />
              </div>
              <div className="form-group">
                <label>Resultado Desejado</label>
                <textarea
                  rows={2}
                  placeholder="Qual o resultado mensurável e impacto esperado?"
                  value={draftProject.objective?.desiredResult || ""}
                  onChange={(e) => setDraftProject({
                    ...draftProject,
                    objective: { ...(draftProject.objective || {}), desiredResult: e.target.value }
                  })}
                />
              </div>
            </div>
          ) : (
            <div className="section-content-grid">
              <div className="content-subblock">
                <span className="subblock-label">Problema</span>
                <p>{project.objective?.problem || "A fragmentação de conhecimentos e falta de ciclos estruturados de repetição espaçada."}</p>
              </div>
              <div className="content-subblock">
                <span className="subblock-label">Resultado Desejado</span>
                <p>{project.objective?.desiredResult || "Um sistema operacional de conhecimento único, fluido e de altíssimo desempenho para retenção 100%."}</p>
              </div>
            </div>
          )}
        </section>

        {/* =========================================================================
           2. 🧭 DIREÇÃO
           ========================================================================= */}
        <section className="project-section-card">
          <div className="section-head-row">
            <div className="section-title">
              <Compass size={18} style={{ color: "#f59e0b" }} />
              <h3>🧭 Direção</h3>
            </div>
            {editingSection !== "direction" ? (
              <button className="btn-edit-sec" onClick={() => setEditingSection("direction")}><Edit3 size={12} /> Editar</button>
            ) : (
              <button className="btn-save-sec" onClick={handleSaveDraft}><Save size={12} /> Salvar</button>
            )}
          </div>

          {editingSection === "direction" ? (
            <div className="section-edit-form">
              <div className="form-group">
                <label>Visão</label>
                <textarea
                  rows={2}
                  placeholder="Visão de longo prazo..."
                  value={draftProject.direction?.vision || ""}
                  onChange={(e) => setDraftProject({
                    ...draftProject,
                    direction: { ...(draftProject.direction || {}), vision: e.target.value }
                  })}
                />
              </div>
              <div className="form-group">
                <label>Escopo</label>
                <textarea
                  rows={2}
                  placeholder="Limites e escopo do projeto..."
                  value={draftProject.direction?.scope || ""}
                  onChange={(e) => setDraftProject({
                    ...draftProject,
                    direction: { ...(draftProject.direction || {}), scope: e.target.value }
                  })}
                />
              </div>
            </div>
          ) : (
            <div className="section-content-grid">
              <div className="content-subblock">
                <span className="subblock-label">Visão</span>
                <p>{project.direction?.vision || "Tornar o aprendizado ativo e o domínio de qualquer tema um processo previsível, mensurável e veloz."}</p>
              </div>
              <div className="content-subblock">
                <span className="subblock-label">Escopo</span>
                <p>{project.direction?.scope || "Web App, Desktop Windows (.EXE), Mobile Android (.APK) com autenticação e Firestore em tempo real."}</p>
              </div>
            </div>
          )}
        </section>

        {/* =========================================================================
           3. 🖼️ VISUAL (HERO IMAGE & GALLERY)
           ========================================================================= */}
        <section className="project-section-card">
          <div className="section-head-row">
            <div className="section-title">
              <ImageIcon size={18} style={{ color: "#3b82f6" }} />
              <h3>🖼️ Visual</h3>
            </div>
            {editingSection !== "visual" ? (
              <button className="btn-edit-sec" onClick={() => setEditingSection("visual")}><Edit3 size={12} /> Editar</button>
            ) : (
              <button className="btn-save-sec" onClick={handleSaveDraft}><Save size={12} /> Salvar</button>
            )}
          </div>

          {editingSection === "visual" ? (
            <div className="section-edit-form">
              <div className="form-group">
                <label>URL da Hero Image (Imagem Principal)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... ou caminho da imagem"
                  value={draftProject.visual?.heroImage || ""}
                  onChange={(e) => setDraftProject({
                    ...draftProject,
                    visual: { ...(draftProject.visual || {}), heroImage: e.target.value }
                  })}
                />
              </div>
              <div className="form-group">
                <label>Adicionar Imagem à Galeria</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="URL da imagem/screenshot..."
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-add-mini"
                    onClick={() => {
                      if (!newGalleryUrl.trim()) return;
                      const currentGallery = draftProject.visual?.gallery || [];
                      setDraftProject({
                        ...draftProject,
                        visual: { ...(draftProject.visual || {}), gallery: [...currentGallery, newGalleryUrl.trim()] }
                      });
                      setNewGalleryUrl("");
                    }}
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Hero Banner Box */}
          <div className="project-hero-image-box">
            {project.visual?.heroImage ? (
              <img src={project.visual.heroImage} alt="Hero do Projeto" className="project-hero-img" />
            ) : (
              <div className="hero-placeholder-banner">
                <Sparkles size={28} style={{ opacity: 0.5, marginBottom: "6px" }} />
                <span>[ HERO IMAGE DO PROJETO ]</span>
                <small>Clique em Editar acima para adicionar uma URL de imagem de capa em destaque.</small>
              </div>
            )}
          </div>

          {/* Gallery Thumbnails Grid */}
          <div className="project-gallery-thumbs-grid">
            {(project.visual?.gallery && project.visual.gallery.length > 0) ? (
              project.visual.gallery.map((imgUrl, i) => (
                <div key={i} className="gallery-thumb-item">
                  <img src={imgUrl} alt={`Screenshot ${i + 1}`} />
                </div>
              ))
            ) : (
              <>
                <div className="gallery-thumb-placeholder"><span>[ image 1 ]</span></div>
                <div className="gallery-thumb-placeholder"><span>[ image 2 ]</span></div>
                <div className="gallery-thumb-placeholder"><span>[ image 3 ]</span></div>
              </>
            )}
          </div>
        </section>

        {/* =========================================================================
           4. 🔗 LINKS
           ========================================================================= */}
        <section className="project-section-card">
          <div className="section-head-row">
            <div className="section-title">
              <LinkIcon size={18} style={{ color: "#a855f7" }} />
              <h3>🔗 Links</h3>
            </div>
            {editingSection !== "links" ? (
              <button className="btn-edit-sec" onClick={() => setEditingSection("links")}><Edit3 size={12} /> Editar</button>
            ) : (
              <button className="btn-save-sec" onClick={handleSaveDraft}><Save size={12} /> Salvar</button>
            )}
          </div>

          {editingSection === "links" ? (
            <div className="section-edit-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label>GitHub URL</label>
                  <input
                    type="text"
                    placeholder="https://github.com/..."
                    value={draftProject.links?.github || ""}
                    onChange={(e) => setDraftProject({
                      ...draftProject,
                      links: { ...(draftProject.links || {}), github: e.target.value }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Figma URL</label>
                  <input
                    type="text"
                    placeholder="https://figma.com/..."
                    value={draftProject.links?.figma || ""}
                    onChange={(e) => setDraftProject({
                      ...draftProject,
                      links: { ...(draftProject.links || {}), figma: e.target.value }
                    })}
                  />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Deploy / Web App URL</label>
                  <input
                    type="text"
                    placeholder="https://kos-app.web.app"
                    value={draftProject.links?.deploy || ""}
                    onChange={(e) => setDraftProject({
                      ...draftProject,
                      links: { ...(draftProject.links || {}), deploy: e.target.value }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>APK / Download URL</label>
                  <input
                    type="text"
                    placeholder="Link para APK ou release"
                    value={draftProject.links?.apk || ""}
                    onChange={(e) => setDraftProject({
                      ...draftProject,
                      links: { ...(draftProject.links || {}), apk: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="project-links-chips-row">
              {project.links?.github ? (
                <a href={project.links.github} target="_blank" rel="noreferrer" className="project-link-chip">
                  <Github size={14} /> GitHub <ExternalLink size={11} />
                </a>
              ) : (
                <span className="project-link-chip disabled"><Github size={14} /> GitHub</span>
              )}

              {project.links?.figma ? (
                <a href={project.links.figma} target="_blank" rel="noreferrer" className="project-link-chip">
                  <Figma size={14} /> Figma <ExternalLink size={11} />
                </a>
              ) : (
                <span className="project-link-chip disabled"><Figma size={14} /> Figma</span>
              )}

              {project.links?.deploy ? (
                <a href={project.links.deploy} target="_blank" rel="noreferrer" className="project-link-chip">
                  <Globe size={14} /> Deploy <ExternalLink size={11} />
                </a>
              ) : (
                <span className="project-link-chip disabled"><Globe size={14} /> Deploy</span>
              )}

              {project.links?.apk ? (
                <a href={project.links.apk} target="_blank" rel="noreferrer" className="project-link-chip">
                  <Smartphone size={14} /> APK <ExternalLink size={11} />
                </a>
              ) : (
                <span className="project-link-chip disabled"><Smartphone size={14} /> APK</span>
              )}
            </div>
          )}
        </section>

        {/* =========================================================================
           5. 🧱 ESTRUTURA
           ========================================================================= */}
        <section className="project-section-card">
          <div className="section-head-row">
            <div className="section-title">
              <Layers size={18} style={{ color: "#10b981" }} />
              <h3>🧱 Estrutura</h3>
            </div>
            {editingSection !== "structure" ? (
              <button className="btn-edit-sec" onClick={() => setEditingSection("structure")}><Edit3 size={12} /> Editar</button>
            ) : (
              <button className="btn-save-sec" onClick={handleSaveDraft}><Save size={12} /> Salvar</button>
            )}
          </div>

          {editingSection === "structure" ? (
            <div className="section-edit-form">
              <div className="form-group">
                <label>Arquitetura Geral</label>
                <textarea
                  rows={2}
                  placeholder="Arquitetura do sistema..."
                  value={draftProject.structure?.architecture || ""}
                  onChange={(e) => setDraftProject({
                    ...draftProject,
                    structure: { ...(draftProject.structure || {}), architecture: e.target.value }
                  })}
                />
              </div>
              <div className="form-group">
                <label>Tecnologias (Adicionar)</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="Ex: React 19, Vite, Firebase, Capacitor, Electron..."
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-add-mini"
                    onClick={() => {
                      if (!newTech.trim()) return;
                      const current = draftProject.structure?.technologies || [];
                      setDraftProject({
                        ...draftProject,
                        structure: { ...(draftProject.structure || {}), technologies: [...current, newTech.trim()] }
                      });
                      setNewTech("");
                    }}
                  >
                    + Adicionar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="section-content-grid">
              <div className="content-subblock">
                <span className="subblock-label">Tecnologias</span>
                <div className="tech-tags-list">
                  {(project.structure?.technologies && project.structure.technologies.length > 0) ? (
                    project.structure.technologies.map(t => <span key={t} className="tech-pill">⚡ {t}</span>)
                  ) : (
                    <>
                      <span className="tech-pill">⚡ React 19</span>
                      <span className="tech-pill">⚡ Vite</span>
                      <span className="tech-pill">⚡ Firebase Firestore</span>
                      <span className="tech-pill">⚡ Electron 34</span>
                      <span className="tech-pill">⚡ Capacitor 7</span>
                    </>
                  )}
                </div>
              </div>
              <div className="content-subblock">
                <span className="subblock-label">Arquitetura</span>
                <p>{project.structure?.architecture || "Client-first SPA com sincronização reativa em tempo real (Firestore onSnapshot) e empacotamento híbrido (Capacitor/Electron)."}</p>
              </div>
            </div>
          )}
        </section>

        {/* =========================================================================
           6. 📋 TAREFAS [ DATABASE ]
           ========================================================================= */}
        <section className="project-section-card">
          <div className="section-head-row">
            <div className="section-title">
              <CheckSquare size={18} style={{ color: "#38bdf8" }} />
              <h3>📋 Tarefas ({completedTasks}/{projectTasks.length} concluídas)</h3>
            </div>
          </div>

          <div className="project-tasks-database-box">
            {/* Inline Task Add Form */}
            <form onSubmit={handleCreateTask} className="task-add-inline-bar">
              <input
                type="text"
                placeholder="Nova tarefa ou entrega do projeto..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Prazo (ex: 2026-10-15)"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                style={{ maxWidth: "140px" }}
              />
              <button type="submit" className="btn-add-task-submit" disabled={!newTaskTitle.trim()}>
                <Plus size={13} /> Adicionar Tarefa
              </button>
            </form>

            {/* Tasks Database Table */}
            <div className="tasks-database-table-wrap">
              <table className="tasks-database-table">
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}>Status</th>
                    <th>Tarefa</th>
                    <th style={{ width: "130px" }}>Prazo</th>
                    <th style={{ width: "50px" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {projectTasks.map((t) => (
                    <tr key={t.id} className={t.completed ? "task-row-done" : ""}>
                      <td>
                        <input
                          type="checkbox"
                          checked={t.completed}
                          onChange={() => onToggleTask(t.id)}
                          className="task-check-input"
                        />
                      </td>
                      <td className="task-title-cell">
                        <span className={t.completed ? "line-through-text" : ""}>{t.title}</span>
                      </td>
                      <td>
                        <span className="task-date-badge"><Calendar size={11} /> {t.dueDate}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-task-del"
                          onClick={() => onDeleteTask(t.id)}
                          title="Excluir tarefa"
                        >
                          <X size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {projectTasks.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "var(--text-dim)" }}>
                        Nenhuma tarefa cadastrada para este projeto. Use o campo acima para adicionar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* =========================================================================
           7. 🧪 PROCESSO (DECISÕES, TESTES, PROBLEMAS, SOLUÇÕES)
           ========================================================================= */}
        <section className="project-section-card">
          <div className="section-head-row">
            <div className="section-title">
              <TestTube2 size={18} style={{ color: "#ec4899" }} />
              <h3>🧪 Processo</h3>
            </div>
            {editingSection !== "process" ? (
              <button className="btn-edit-sec" onClick={() => setEditingSection("process")}><Edit3 size={12} /> Editar</button>
            ) : (
              <button className="btn-save-sec" onClick={handleSaveDraft}><Save size={12} /> Salvar</button>
            )}
          </div>

          <div className="process-quadrant-grid">
            <div className="process-quad-card">
              <h4>🎯 Decisões Tomadas</h4>
              <p>{project.process?.decisions?.join(" • ") || "Adoção de Vanilla CSS com temas dark Notion e remoção de dados mockados em prol de Firestore real."}</p>
            </div>
            <div className="process-quad-card">
              <h4>🧪 Testes & Validação</h4>
              <p>{project.process?.tests?.join(" • ") || "Compilação TypeScript estrita e testes nos modos Web, Electron (.exe) e Capacitor Android."}</p>
            </div>
            <div className="process-quad-card">
              <h4>⚠️ Problemas Encontrados</h4>
              <p>{project.process?.problems?.join(" • ") || "Campos de texto planos vs necessidade de seletores inteligentes de Emojis e dropdowns relacionais."}</p>
            </div>
            <div className="process-quad-card">
              <h4>💡 Soluções Aplicadas</h4>
              <p>{project.process?.solutions?.join(" • ") || "Componentes de popover interativos com categorias de emoji e sincronização em tempo real."}</p>
            </div>
          </div>
        </section>

        {/* =========================================================================
           8. 📈 EVOLUÇÃO (CHANGELOG & VERSÕES)
           ========================================================================= */}
        <section className="project-section-card">
          <div className="section-head-row">
            <div className="section-title">
              <TrendingUp size={18} style={{ color: "#10b981" }} />
              <h3>📈 Evolução (Changelog & Versões)</h3>
            </div>
          </div>

          <div className="changelog-timeline">
            <div className="timeline-item">
              <div className="timeline-dot" />
              <div className="timeline-content">
                <strong>v1.0.0 — KOS Multiplataforma & Firestore Real</strong>
                <small>Hoje • Lançamento</small>
                <p>Auth real com Email/Senha e Google, perfil de usuário, Crono com Planos & Ciclos, Study Sessions e suporte Web/APK/EXE.</p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
           9. 💡 INSIGHTS, 📚 RECURSOS, 📝 NOTAS
           ========================================================================= */}
        <div className="insights-resources-row">
          <section className="project-section-card half">
            <div className="section-title">
              <Lightbulb size={18} style={{ color: "#fbbf24" }} />
              <h3>💡 Insights</h3>
            </div>
            <p className="subtext-p">
              {project.insights?.join(" • ") || "A organização em ciclos de repetição espaçada no Crono aumenta a retenção a longo prazo exponencialmente."}
            </p>
          </section>

          <section className="project-section-card half">
            <div className="section-title">
              <BookOpen size={18} style={{ color: "#60a5fa" }} />
              <h3>📚 Recursos</h3>
            </div>
            <p className="subtext-p">
              {project.resources?.join(" • ") || "Documentação Firebase 12, Vite Docs, Capacitor 7 e Electron 34."}
            </p>
          </section>
        </div>

        {/* =========================================================================
           10. 🏁 RESULTADO (ESTADO ATUAL & PRÓXIMO MARCO)
           ========================================================================= */}
        <section className="project-section-card">
          <div className="section-head-row">
            <div className="section-title">
              <Flag size={18} style={{ color: "#ef4444" }} />
              <h3>🏁 Resultado</h3>
            </div>
          </div>

          <div className="section-content-grid">
            <div className="content-subblock">
              <span className="subblock-label">Estado Atual</span>
              <p>{project.result?.currentState || "KOS 100% operacional, persistido no Firebase Firestore e testado para build web, Android e desktop."}</p>
            </div>
            <div className="content-subblock">
              <span className="subblock-label">Próximo Marco</span>
              <p>{project.result?.nextMilestone || "Deploy em produção no Firebase Hosting e exportação do arquivo .apk para dispositivos móveis."}</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
