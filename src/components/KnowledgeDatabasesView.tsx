import React, { useState, useMemo } from "react";
import {
  Table2, LayoutGrid, Layers, List, Plus, Search, Filter,
  ArrowUpDown, X, ChevronRight, ChevronDown, Edit3, Check,
  Clock, Calendar, Award, ExternalLink, Sparkles, Tag, CheckSquare,
  Flame, BookOpen, Brain, Bot, Box, FolderGit2, SlidersHorizontal, Columns, Trash2
} from "lucide-react";
import type {
  Domain, Project, ProjectTask, LessonCategory, ModuleItem,
  Lesson, Question, ReviewRecord, Vault, Layer, PriorityLevel,
  SessionRecord
} from "../types";
import { layerConfig, priorityConfig } from "../types";
import { VaultViewTarget } from "./VaultFullPage";
import { sampleVault } from "../data/mock";

export type DbType = "domains" | "lessons" | "categories" | "modules" | "questions" | "vaults" | "reviews" | "projects" | "sessions";
export type ViewFormat = "table" | "gallery" | "board" | "list";

interface KnowledgeDatabasesViewProps {
  activeDb: DbType;
  setActiveDb: (db: DbType) => void;
  domains: Domain[];
  projects: Project[];
  projectTasks: ProjectTask[];
  categories: LessonCategory[];
  modules: ModuleItem[];
  lessons: Lesson[];
  questions: Question[];
  reviews: ReviewRecord[];
  sessions?: SessionRecord[];
  onQuestion: (q: Question) => void;
  onDomainClick: (d: Domain) => void;
  onLessonClick: (l: Lesson) => void;
  onProjectClick?: (p: Project) => void;
  onOpenVaultPage: (target: VaultViewTarget) => void;
  onEditDomain: (d: Domain) => void;
  onEditProject: (p: Project) => void;
  onToggleProjectTask: (taskId: string) => void;
  onAddProjectTask: (projectId: string, title: string, dueDate: string) => void;
  onDeleteProjectTask: (taskId: string) => void;
  onEditCategory: (c: LessonCategory) => void;
  onEditModule: (m: ModuleItem) => void;
  onEditLesson: (l: Lesson) => void;
  onEditQuestion: (q: Question) => void;
  onEditReview: (r: ReviewRecord) => void;
  onEditVault: (id: string, name: string, v: Vault) => void;
  onAddDomain: () => void;
  onAddProject: () => void;
  onAddCategory: () => void;
  onAddModule: () => void;
  onAddLesson: () => void;
  onAddQuestion: () => void;
  onAddReview: () => void;
  onAddVault?: () => void;
  onDeleteDomain?: (id: string) => void;
  onDeleteProject?: (id: string) => void;
  onDeleteCategory?: (id: string) => void;
  onDeleteModule?: (id: string) => void;
  onDeleteLesson?: (id: string) => void;
  onDeleteQuestion?: (id: string) => void;
  onDeleteReview?: (id: string) => void;
  onDeleteSession?: (id: string) => void;
}

export function KnowledgeDatabasesView(props: KnowledgeDatabasesViewProps) {
  const {
    activeDb,
    setActiveDb,
    domains,
    projects,
    projectTasks,
    categories,
    modules,
    lessons,
    questions,
    reviews,
    sessions = [],
    onQuestion,
    onDomainClick,
    onLessonClick,
    onProjectClick,
    onOpenVaultPage,
    onEditDomain,
    onEditProject,
    onToggleProjectTask,
    onAddProjectTask,
    onDeleteProjectTask,
    onEditCategory,
    onEditModule,
    onEditLesson,
    onEditQuestion,
    onEditReview,
    onEditVault,
    onAddDomain,
    onAddProject,
    onAddCategory,
    onAddModule,
    onAddLesson,
    onAddQuestion,
    onAddReview,
    onAddVault,
    onDeleteDomain,
    onDeleteProject,
    onDeleteCategory,
    onDeleteModule,
    onDeleteLesson,
    onDeleteQuestion,
    onDeleteReview,
    onDeleteSession,
  } = props;

  // View format: table, gallery, board, list
  const [viewFormat, setViewFormat] = useState<ViewFormat>("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("default");

  // Kanban "Group By" definition state for the board view
  const [boardGroupBy, setBoardGroupBy] = useState<string>("default");

  // Collapsible Tags Drawer state
  const [tagsDrawerOpen, setTagsDrawerOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Helper to extract tags dynamically from all entities in the active database
  const activeTagsMap = useMemo(() => {
    const counts: Record<string, number> = {};
    const addTag = (t: string | undefined | null) => {
      if (!t || typeof t !== "string") return;
      const clean = t.trim();
      if (!clean) return;
      counts[clean] = (counts[clean] || 0) + 1;
    };

    switch (activeDb) {
      case "domains":
        domains.forEach(d => {
          addTag(d.layer);
          addTag(d.priorityLevel);
          if (d.focusLesson) addTag(d.focusLesson);
          d.projects.forEach(p => addTag(p));
        });
        break;
      case "lessons":
        lessons.forEach(l => {
          addTag(l.domain);
          addTag(l.category);
          addTag(l.module);
          addTag(l.difficulty);
          addTag(l.status);
          l.keyConcepts?.forEach(k => addTag(k));
          l.difficulties?.forEach(df => addTag(df));
          l.projects?.forEach(p => addTag(p));
        });
        break;
      case "categories":
        categories.forEach(c => {
          addTag(c.domain);
          addTag("Categoria");
        });
        break;
      case "modules":
        modules.forEach(m => {
          addTag(m.domain);
          addTag(m.lesson);
          addTag(m.category);
          addTag(m.status);
        });
        break;
      case "questions":
        questions.forEach(q => {
          addTag(q.domain);
          addTag(q.lesson);
          addTag(q.module);
          addTag(`Fase: ${q.stage}`);
          q.vault?.highlights?.forEach(h => addTag(h));
          q.vault?.examples?.forEach(e => addTag(e));
          q.vault?.applications?.forEach(a => addTag(a));
        });
        break;
      case "vaults":
        questions.forEach(q => {
          addTag(q.domain);
          addTag(q.lesson);
          q.vault?.highlights?.forEach(h => addTag(h));
          q.vault?.applications?.forEach(a => addTag(a));
          q.vault?.aiLessons?.forEach(ai => addTag(ai.aiModel));
        });
        break;
      case "reviews":
        reviews.forEach(r => {
          addTag(r.type);
          addTag(r.status);
          addTag(r.domain);
          addTag(r.lesson);
          addTag(r.interval);
        });
        break;
      case "projects":
        projects.forEach(p => {
          addTag(p.domain);
          addTag(p.category);
          addTag(p.status);
        });
        break;
    }

    return counts;
  }, [activeDb, domains, lessons, categories, modules, questions, reviews, projects]);

  const uniqueTagsList = Object.entries(activeTagsMap).sort((a, b) => b[1] - a[1]);

  // Handle entity tag match filter
  const matchesTag = (entityTags: (string | undefined | null)[]): boolean => {
    if (!selectedTag) return true;
    return entityTags.some(t => t && t.toLowerCase() === selectedTag.toLowerCase());
  };

  // Filtered Domains
  const filteredDomains = useMemo(() => {
    return domains.filter(d => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch = d.name.toLowerCase().includes(q) || d.meta.toLowerCase().includes(q) || d.projects.some(p => p.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }
      return matchesTag([d.layer, d.priorityLevel, d.focusLesson, ...d.projects]);
    });
  }, [domains, searchQuery, selectedTag]);

  // Filtered Lessons
  const filteredLessons = useMemo(() => {
    return lessons.filter(l => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch = l.name.toLowerCase().includes(q) || l.domain.toLowerCase().includes(q) || l.category.toLowerCase().includes(q) || l.module.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      return matchesTag([l.domain, l.category, l.module, l.difficulty, l.status, ...(l.keyConcepts || []), ...(l.difficulties || []), ...(l.projects || [])]);
    });
  }, [lessons, searchQuery, selectedTag]);

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch = c.name.toLowerCase().includes(q) || c.domain.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      return matchesTag([c.domain, "Categoria"]);
    });
  }, [categories, searchQuery, selectedTag]);

  // Filtered Modules
  const filteredModules = useMemo(() => {
    return modules.filter(m => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch = m.name.toLowerCase().includes(q) || m.domain.toLowerCase().includes(q) || m.lesson.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      return matchesTag([m.domain, m.lesson, m.category, m.status]);
    });
  }, [modules, searchQuery, selectedTag]);

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (searchQuery.trim()) {
        const term = searchQuery.toLowerCase();
        const matchesSearch = q.title.toLowerCase().includes(term) || q.domain.toLowerCase().includes(term) || q.lesson.toLowerCase().includes(term) || q.module.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }
      const vaultHighlights = q.vault?.highlights || [];
      const vaultApps = q.vault?.applications || [];
      return matchesTag([q.domain, q.lesson, q.module, `Fase: ${q.stage}`, ...vaultHighlights, ...vaultApps]);
    });
  }, [questions, searchQuery, selectedTag]);

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    let list = reviews;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => r.title.toLowerCase().includes(q) || r.domain.toLowerCase().includes(q) || r.lesson.toLowerCase().includes(q) || r.question.toLowerCase().includes(q));
    }
    if (selectedTag) {
      list = list.filter(r => r.domain.toLowerCase() === selectedTag.toLowerCase() || r.lesson.toLowerCase() === selectedTag.toLowerCase());
    }
    return list;
  }, [reviews, searchQuery, selectedTag]);

  const filteredSessions = useMemo(() => {
    let list = sessions;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.questionTitle.toLowerCase().includes(q) || s.domain.toLowerCase().includes(q) || s.lesson.toLowerCase().includes(q));
    }
    if (selectedTag) {
      list = list.filter(s => s.domain.toLowerCase() === selectedTag.toLowerCase() || s.lesson.toLowerCase() === selectedTag.toLowerCase());
    }
    return list;
  }, [sessions, searchQuery, selectedTag]);

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (searchQuery.trim()) {
        const term = searchQuery.toLowerCase();
        const matchesSearch = p.name.toLowerCase().includes(term) || p.domain.toLowerCase().includes(term) || p.category.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }
      return matchesTag([p.domain, p.category, p.status]);
    });
  }, [projects, searchQuery, selectedTag]);

  const handleAddNew = () => {
    switch (activeDb) {
      case "domains": onAddDomain(); break;
      case "lessons": onAddLesson(); break;
      case "categories": onAddCategory(); break;
      case "modules": onAddModule(); break;
      case "questions": onAddQuestion(); break;
      case "reviews": onAddReview(); break;
      case "projects": onAddProject(); break;
      default: onAddQuestion(); break;
    }
  };

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
      sessions: "Study Sessions DB"
    };
    return titles[k] || "Database";
  }

  return (
    <div className="database-view-page">
      {/* DB Title Header */}
      <div className="notion-title">
        <div>
          <p className="breadcrumb-mini">Workspace Databases • Multi-Format & Auto-Tags</p>
          <h1>{dbTitle(activeDb)}</h1>
          <p>Exibição flexível (Tabela, Galeria, Quadro, Lista) com tags automáticas e agrupamento personalizado no quadro.</p>
        </div>

        <div className="db-header-actions">
          <button className="new-button" onClick={handleAddNew}>
            <Plus size={15} /> Novo Item em {dbTitle(activeDb).replace(" DB", "").replace(" (Questions)", "")}
          </button>
        </div>
      </div>

      {/* Top Database Tabs */}
      <div className="db-tabs-bar">
        <button className={activeDb === "domains" ? "active" : ""} onClick={() => { setActiveDb("domains"); setSelectedTag(null); setBoardGroupBy("default"); }}>
          <span>◈</span> 1. Domains <span className="tab-pill">{domains.length}</span>
        </button>
        <button className={activeDb === "lessons" ? "active" : ""} onClick={() => { setActiveDb("lessons"); setSelectedTag(null); setBoardGroupBy("default"); }}>
          <span>▦</span> 2. Lessons <span className="tab-pill">{lessons.length}</span>
        </button>
        <button className={activeDb === "categories" ? "active" : ""} onClick={() => { setActiveDb("categories"); setSelectedTag(null); setBoardGroupBy("default"); }}>
          <span>🏷️</span> 3. Categories <span className="tab-pill">{categories.length}</span>
        </button>
        <button className={activeDb === "modules" ? "active" : ""} onClick={() => { setActiveDb("modules"); setSelectedTag(null); setBoardGroupBy("default"); }}>
          <span>📦</span> 4. Modules <span className="tab-pill">{modules.length}</span>
        </button>
        <button className={activeDb === "questions" ? "active" : ""} onClick={() => { setActiveDb("questions"); setSelectedTag(null); setBoardGroupBy("default"); }}>
          <span>□</span> 5. Questions <span className="tab-pill">{questions.length}</span>
        </button>
        <button className={activeDb === "vaults" ? "active" : ""} onClick={() => { setActiveDb("vaults"); setSelectedTag(null); setBoardGroupBy("default"); }}>
          <span>▤</span> 6. Vaults (Questions) <span className="tab-pill">{questions.filter(q => q.vault).length || questions.length}</span>
        </button>
        <button className={activeDb === "reviews" ? "active" : ""} onClick={() => { setActiveDb("reviews"); setSelectedTag(null); setBoardGroupBy("default"); }}>
          <span>↻</span> 7. Reviews <span className="tab-pill">{reviews.length}</span>
        </button>
        <button className={activeDb === "projects" ? "active" : ""} onClick={() => { setActiveDb("projects"); setSelectedTag(null); setBoardGroupBy("default"); }}>
          <span>📁</span> 8. Projects & Tasks <span className="tab-pill">{projects.length}</span>
        </button>
        <button className={activeDb === "sessions" ? "active" : ""} onClick={() => { setActiveDb("sessions"); setSelectedTag(null); setBoardGroupBy("default"); }}>
          <span>⏱️</span> 9. Study Sessions <span className="tab-pill">{sessions.length}</span>
        </button>
      </div>

      {/* Main Database Toolbar with Format Switcher & Group-By Selector */}
      <div className="database-toolbar-v2">
        {/* VIEW FORMAT SWITCHER (TABLE, GALLERY, BOARD, LIST) */}
        <div className="db-view-selector">
          <button
            className={`view-btn ${viewFormat === "table" ? "active" : ""}`}
            onClick={() => setViewFormat("table")}
            title="Visualização em Tabela Detalhada"
          >
            <Table2 size={14} /> Tabela
          </button>
          <button
            className={`view-btn ${viewFormat === "gallery" ? "active" : ""}`}
            onClick={() => setViewFormat("gallery")}
            title="Visualização em Galeria de Cards"
          >
            <LayoutGrid size={14} /> Galeria
          </button>
          <button
            className={`view-btn ${viewFormat === "board" ? "active" : ""}`}
            onClick={() => setViewFormat("board")}
            title="Visualização em Quadro / Kanban"
          >
            <Layers size={14} /> Quadro (Board)
          </button>
          <button
            className={`view-btn ${viewFormat === "list" ? "active" : ""}`}
            onClick={() => setViewFormat("list")}
            title="Visualização em Lista Compacta"
          >
            <List size={14} /> Lista
          </button>
        </div>

        {/* Filters and Search Controls */}
        <div className="db-filters-group">
          {/* USER SELECTOR TO DECIDE WHAT DEFINES THE BOARD VIEW (GROUP BY) */}
          {viewFormat === "board" && (
            <div className="db-board-group-selector">
              <Columns size={13} />
              <label>Agrupar por:</label>
              <select value={boardGroupBy} onChange={(e) => setBoardGroupBy(e.target.value)}>
                {activeDb === "domains" && (
                  <>
                    <option value="default">Layer (Mission Critical / Estratégico...)</option>
                    <option value="priority">Prioridade (P0, P1, P2, P3)</option>
                    <option value="interest">Nível de Interesse</option>
                    <option value="progress">Faixa de Progresso</option>
                  </>
                )}

                {activeDb === "lessons" && (
                  <>
                    <option value="default">Status (Em Estudo / Revisando / Dominado)</option>
                    <option value="domain">Domínio</option>
                    <option value="category">Categoria</option>
                    <option value="difficulty">Dificuldade</option>
                    <option value="module">Módulo</option>
                  </>
                )}

                {activeDb === "categories" && (
                  <>
                    <option value="default">Domínio</option>
                  </>
                )}

                {activeDb === "modules" && (
                  <>
                    <option value="default">Status (Em Estudo / Revisando / Dominado)</option>
                    <option value="domain">Domínio</option>
                    <option value="lesson">Lesson</option>
                    <option value="category">Categoria</option>
                  </>
                )}

                {activeDb === "questions" && (
                  <>
                    <option value="default">Fase no Ciclo KOS (Study, Fixation, Weekly, Monthly, Mastered)</option>
                    <option value="domain">Domínio</option>
                    <option value="lesson">Lesson</option>
                    <option value="module">Módulo</option>
                    <option value="progress">Faixa de Retenção</option>
                  </>
                )}

                {activeDb === "vaults" && (
                  <>
                    <option value="default">Domínio</option>
                    <option value="lesson">Lesson</option>
                    <option value="ai">Modelo de IA Usado</option>
                  </>
                )}

                {activeDb === "reviews" && (
                  <>
                    <option value="default">Status (Pendente / Pronto / Concluído)</option>
                    <option value="type">Tipo de Revisão (Daily, Weekly, Monthly)</option>
                    <option value="domain">Domínio</option>
                    <option value="interval">Intervalo</option>
                  </>
                )}

                {activeDb === "projects" && (
                  <>
                    <option value="default">Status (Em Andamento / Planejado / Concluído)</option>
                    <option value="domain">Domínio</option>
                    <option value="category">Categoria</option>
                    <option value="progress">Faixa de Progresso</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Collapsible Tags Toggle Button */}
          <button
            className={`db-tags-toggle-btn ${tagsDrawerOpen || selectedTag ? "active" : ""}`}
            onClick={() => setTagsDrawerOpen(prev => !prev)}
          >
            <Tag size={13} />
            <span>Tags ({uniqueTagsList.length})</span>
            {selectedTag && <span className="active-tag-indicator">Filtro Ativo</span>}
            {tagsDrawerOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>

          {/* Quick Search Box */}
          <div className="db-search-inline">
            <Search size={13} />
            <input
              type="text"
              placeholder={`Buscar em ${dbTitle(activeDb)}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-btn" onClick={() => setSearchQuery("")}>
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* COLLAPSIBLE AUTO-TAGS DRAWER */}
      {tagsDrawerOpen && (
        <div className="db-tags-collapsible-drawer">
          <div className="tags-drawer-header">
            <div className="tags-header-title">
              <Tag size={14} />
              <span>Tags Automáticas desta Base ({uniqueTagsList.length} identificadas):</span>
              <small>Geradas e sincronizadas automaticamente a partir de conceitos, layers e propriedades.</small>
            </div>
            {selectedTag && (
              <button className="clear-tag-filter-btn" onClick={() => setSelectedTag(null)}>
                <X size={12} /> Limpar Filtro ({selectedTag})
              </button>
            )}
          </div>

          <div className="tags-chips-drawer-grid">
            {uniqueTagsList.map(([tag, count]) => {
              const isSelected = selectedTag?.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  type="button"
                  className={`db-auto-tag-pill ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedTag(isSelected ? null : tag)}
                >
                  <span className="tag-name">🏷️ {tag}</span>
                  <span className="tag-count-badge">{count}</span>
                </button>
              );
            })}
            {uniqueTagsList.length === 0 && (
              <span className="placeholder">Nenhuma tag cadastrada nesta base de dados.</span>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
         RENDER SELECTED DATABASE IN THE CHOSEN FORMAT
         ========================================================================= */}

      {/* 1. DOMAINS */}
      {activeDb === "domains" && (
        viewFormat === "table" ? (
          <DomainTable domains={filteredDomains} onDomainClick={onDomainClick} onEditDomain={onEditDomain} onAddNew={onAddDomain} />
        ) : viewFormat === "gallery" ? (
          <DomainGallery domains={filteredDomains} onDomainClick={onDomainClick} onEditDomain={onEditDomain} onAddNew={onAddDomain} />
        ) : viewFormat === "board" ? (
          <DomainBoard domains={filteredDomains} groupBy={boardGroupBy} onDomainClick={onDomainClick} onEditDomain={onEditDomain} onAddNew={onAddDomain} />
        ) : (
          <DomainList domains={filteredDomains} onDomainClick={onDomainClick} onEditDomain={onEditDomain} onAddNew={onAddDomain} />
        )
      )}

      {/* 2. LESSONS */}
      {activeDb === "lessons" && (
        viewFormat === "table" ? (
          <LessonsTable lessons={filteredLessons} onOpenLesson={onLessonClick} onEditLesson={onEditLesson} onAddNew={onAddLesson} />
        ) : viewFormat === "gallery" ? (
          <LessonsGallery lessons={filteredLessons} onOpenLesson={onLessonClick} onEditLesson={onEditLesson} onAddNew={onAddLesson} />
        ) : viewFormat === "board" ? (
          <LessonsBoard lessons={filteredLessons} groupBy={boardGroupBy} onOpenLesson={onLessonClick} onEditLesson={onEditLesson} onAddNew={onAddLesson} />
        ) : (
          <LessonsList lessons={filteredLessons} onOpenLesson={onLessonClick} onEditLesson={onEditLesson} onAddNew={onAddLesson} />
        )
      )}

      {/* 3. CATEGORIES */}
      {activeDb === "categories" && (
        viewFormat === "table" ? (
          <CategoriesTable categories={filteredCategories} onEditCategory={onEditCategory} onOpenDomain={(domName) => {
            const found = domains.find(d => d.name.toLowerCase() === domName.toLowerCase());
            if (found) onDomainClick(found);
          }} onAddNew={onAddCategory} />
        ) : viewFormat === "gallery" ? (
          <CategoriesGallery categories={filteredCategories} onEditCategory={onEditCategory} onAddNew={onAddCategory} />
        ) : viewFormat === "board" ? (
          <CategoriesBoard categories={filteredCategories} groupBy={boardGroupBy} onEditCategory={onEditCategory} onAddNew={onAddCategory} />
        ) : (
          <CategoriesList categories={filteredCategories} onEditCategory={onEditCategory} onAddNew={onAddCategory} />
        )
      )}

      {/* 4. MODULES */}
      {activeDb === "modules" && (
        viewFormat === "table" ? (
          <ModulesTable modules={filteredModules} onEditModule={onEditModule} onOpenLesson={(lesName) => {
            const found = lessons.find(l => l.name.toLowerCase() === lesName.toLowerCase());
            if (found) onLessonClick(found);
          }} onAddNew={onAddModule} />
        ) : viewFormat === "gallery" ? (
          <ModulesGallery modules={filteredModules} onEditModule={onEditModule} onAddNew={onAddModule} />
        ) : viewFormat === "board" ? (
          <ModulesBoard modules={filteredModules} groupBy={boardGroupBy} onEditModule={onEditModule} onAddNew={onAddModule} />
        ) : (
          <ModulesList modules={filteredModules} onEditModule={onEditModule} onAddNew={onAddModule} />
        )
      )}

      {/* 5. QUESTIONS */}
      {activeDb === "questions" && (
        viewFormat === "table" ? (
          <QuestionsTable questions={filteredQuestions} onQuestion={onQuestion} onEditQuestion={onEditQuestion} onAddNew={onAddQuestion} />
        ) : viewFormat === "gallery" ? (
          <QuestionsGallery questions={filteredQuestions} onQuestion={onQuestion} onEditQuestion={onEditQuestion} onAddNew={onAddQuestion} />
        ) : viewFormat === "board" ? (
          <QuestionsBoard questions={filteredQuestions} groupBy={boardGroupBy} onQuestion={onQuestion} onEditQuestion={onEditQuestion} onAddNew={onAddQuestion} />
        ) : (
          <QuestionsList questions={filteredQuestions} onQuestion={onQuestion} onEditQuestion={onEditQuestion} onAddNew={onAddQuestion} />
        )
      )}

      {/* 6. VAULTS (QUESTIONS) */}
      {activeDb === "vaults" && (
        viewFormat === "table" ? (
          <VaultsTable questions={filteredQuestions} onOpenVaultPage={onOpenVaultPage} onEditVault={onEditVault} onAddNew={onAddVault || onAddQuestion} onDeleteVault={onDeleteQuestion} />
        ) : viewFormat === "gallery" ? (
          <VaultsGallery questions={filteredQuestions} onOpenVaultPage={onOpenVaultPage} onEditVault={onEditVault} onAddNew={onAddVault || onAddQuestion} onDeleteVault={onDeleteQuestion} />
        ) : viewFormat === "board" ? (
          <VaultsBoard questions={filteredQuestions} groupBy={boardGroupBy} onOpenVaultPage={onOpenVaultPage} onEditVault={onEditVault} onAddNew={onAddVault || onAddQuestion} onDeleteVault={onDeleteQuestion} />
        ) : (
          <VaultsList questions={filteredQuestions} onOpenVaultPage={onOpenVaultPage} onEditVault={onEditVault} onAddNew={onAddVault || onAddQuestion} onDeleteVault={onDeleteQuestion} />
        )
      )}

      {/* 7. REVIEWS */}
      {activeDb === "reviews" && (
        viewFormat === "table" ? (
          <ReviewsTable reviews={filteredReviews} onQuestion={onQuestion} onEditReview={onEditReview} onAddNew={onAddReview} />
        ) : viewFormat === "gallery" ? (
          <ReviewsGallery reviews={filteredReviews} onQuestion={onQuestion} onEditReview={onEditReview} onAddNew={onAddReview} />
        ) : viewFormat === "board" ? (
          <ReviewsBoard reviews={filteredReviews} groupBy={boardGroupBy} onQuestion={onQuestion} onEditReview={onEditReview} onAddNew={onAddReview} />
        ) : (
          <ReviewsList reviews={filteredReviews} onQuestion={onQuestion} onEditReview={onEditReview} onAddNew={onAddReview} />
        )
      )}

      {/* 8. PROJECTS */}
      {/* 8. PROJECTS & TASKS */}
      {activeDb === "projects" && (
        viewFormat === "table" ? (
          <ProjectsTable
            projects={filteredProjects}
            tasks={projectTasks}
            onEditProject={onEditProject}
            onOpenProjectPage={onProjectClick}
            onToggleTask={onToggleProjectTask}
            onAddTask={onAddProjectTask}
            onDeleteTask={onDeleteProjectTask}
            onOpenDomain={(domName) => {
              const found = domains.find(d => d.name.toLowerCase() === domName.toLowerCase());
              if (found) onDomainClick(found);
            }}
            onAddNew={onAddProject}
          />
        ) : viewFormat === "gallery" ? (
          <ProjectsGallery projects={filteredProjects} tasks={projectTasks} onEditProject={onEditProject} onOpenProjectPage={onProjectClick} onAddNew={onAddProject} />
        ) : viewFormat === "board" ? (
          <ProjectsBoard projects={filteredProjects} tasks={projectTasks} groupBy={boardGroupBy} onEditProject={onEditProject} onOpenProjectPage={onProjectClick} onAddNew={onAddProject} />
        ) : (
          <ProjectsList projects={filteredProjects} tasks={projectTasks} onEditProject={onEditProject} onOpenProjectPage={onProjectClick} onAddNew={onAddProject} />
        )
      )}

      {/* 9. SESSIONS (STUDY HISTORY) */}
      {activeDb === "sessions" && (
        viewFormat === "table" ? (
          <SessionsTable sessions={filteredSessions} onDeleteSession={onDeleteSession} />
        ) : viewFormat === "gallery" ? (
          <SessionsGallery sessions={filteredSessions} onDeleteSession={onDeleteSession} />
        ) : viewFormat === "board" ? (
          <SessionsBoard sessions={filteredSessions} groupBy={boardGroupBy} onDeleteSession={onDeleteSession} />
        ) : (
          <SessionsList sessions={filteredSessions} onDeleteSession={onDeleteSession} />
        )
      )}
    </div>
  );
}

/* ==========================================================================
   DOMAINS VIEWS (TABLE, GALLERY, BOARD, LIST)
   ========================================================================== */

function DomainTable({ domains, onDomainClick, onEditDomain, onAddNew }: { domains: Domain[]; onDomainClick: (d: Domain) => void; onEditDomain: (d: Domain) => void; onAddNew: () => void }) {
  return (
    <div className="notion-db-card">
      <div className="notion-table-wrapper">
        <table className="notion-table">
          <thead>
            <tr>
              <th className="col-name"><span className="prop-type">Aa</span> Domínio</th>
              <th><span className="prop-type">📅</span> Criado em</th>
              <th><span className="prop-type">🏷️</span> Layer</th>
              <th><span className="prop-type">⭐</span> Prioridade</th>
              <th><span className="prop-type">🔥</span> Interesse</th>
              <th><span className="prop-type">📝</span> Meta</th>
              <th><span className="prop-type">🔗</span> Projetos</th>
              <th><span className="prop-type">▦</span> Lessons</th>
              <th><span className="prop-type">📊</span> Progresso</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {domains.map(d => {
              const layerStyle = layerConfig[d.layer] || layerConfig["life skill"];
              const priorityStyle = priorityConfig[d.priorityLevel] || priorityConfig["P2 - Média"];
              return (
                <tr key={d.id} className="notion-row" onClick={() => onDomainClick(d)}>
                  <td className="cell-title">
                    <span className="domain-row-icon">{d.icon}</span>
                    <strong>{d.name}</strong>
                  </td>
                  <td><span>{d.createdAt}</span></td>
                  <td>
                    <span className="layer-badge" style={{ backgroundColor: layerStyle.bg, color: layerStyle.color, borderColor: layerStyle.border }}>
                      {layerStyle.label}
                    </span>
                  </td>
                  <td><span className="priority-pill" style={{ color: priorityStyle.color }}>● {priorityStyle.label}</span></td>
                  <td><span className="interest-pill">{d.interestLevel}</span></td>
                  <td><p className="meta-clamp">{d.meta}</p></td>
                  <td>
                    <div className="rel-tags-wrap">
                      {d.projects.map(p => <span key={p} className="rel-tag">🔗 {p}</span>)}
                    </div>
                  </td>
                  <td><span className="lesson-count-badge">{d.lessonsCount} lições</span></td>
                  <td>
                    <div className="table-progress-v2">
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${d.progress}%`, backgroundColor: d.color }} /></div>
                      <span className="progress-num">{d.progress}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="row-action-btns">
                      <button className="icon-edit-btn" onClick={(e) => { e.stopPropagation(); onEditDomain(d); }}><Edit3 size={13} /></button>
                      <button className="row-open-peek" onClick={(e) => { e.stopPropagation(); onDomainClick(d); }}>Abrir <ChevronRight size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button className="notion-add-row" onClick={onAddNew}><Plus size={14} /> Novo Domínio</button>
    </div>
  );
}

function DomainGallery({ domains, onDomainClick, onEditDomain, onAddNew }: { domains: Domain[]; onDomainClick: (d: Domain) => void; onEditDomain: (d: Domain) => void; onAddNew: () => void }) {
  return (
    <div className="domain-gallery-layout">
      {domains.map(d => {
        const layerStyle = layerConfig[d.layer];
        return (
          <div key={d.id} className="domain-gallery-card" onClick={() => onDomainClick(d)}>
            <div className="gallery-header-cover" style={{ background: d.gradient }}>
              <span className="gallery-layer-badge" style={{ backgroundColor: layerStyle.bg, color: layerStyle.color }}>{layerStyle.label}</span>
              <button className="gallery-edit-btn" onClick={(e) => { e.stopPropagation(); onEditDomain(d); }}><Edit3 size={13} /></button>
            </div>
            <div className="gallery-card-content">
              <div className="gallery-title-row">
                <span className="gallery-icon">{d.icon}</span>
                <div>
                  <h3>{d.name}</h3>
                  <small className="gallery-date">{d.priorityLevel} • {d.lessonsCount} lições</small>
                </div>
              </div>
              <p className="gallery-meta-text">{d.meta}</p>
              <div className="gallery-progress-box">
                <div className="progress-label-row"><span>Progresso</span><strong>{d.progress}%</strong></div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${d.progress}%`, backgroundColor: d.color }} /></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DomainBoard({ domains, groupBy = "default", onDomainClick, onEditDomain, onAddNew }: { domains: Domain[]; groupBy?: string; onDomainClick: (d: Domain) => void; onEditDomain: (d: Domain) => void; onAddNew: () => void }) {
  // Columns computed dynamically based on the user's chosen Group By
  let columns: { id: string; title: string; color?: string; items: Domain[] }[] = [];

  if (groupBy === "priority") {
    const priorities: PriorityLevel[] = ["P0 - Urgente", "P1 - Alta", "P2 - Média", "P3 - Normal"];
    columns = priorities.map(p => ({
      id: p,
      title: priorityConfig[p]?.label || p,
      color: priorityConfig[p]?.color,
      items: domains.filter(d => d.priorityLevel === p)
    }));
  } else if (groupBy === "interest") {
    const interests = ["5/5 - Máximo", "4/5 - Alto", "3/5 - Médio", "2/5 - Normal", "1/5 - Baixo"];
    columns = interests.map(int => ({
      id: int,
      title: `🔥 ${int}`,
      color: "#f59e0b",
      items: domains.filter(d => d.interestLevel === int)
    }));
  } else if (groupBy === "progress") {
    columns = [
      { id: "0-25", title: "0% - 25% (Início)", color: "#94a3b8", items: domains.filter(d => d.progress <= 25) },
      { id: "26-50", title: "26% - 50% (Em Andamento)", color: "#60a5fa", items: domains.filter(d => d.progress > 25 && d.progress <= 50) },
      { id: "51-75", title: "51% - 75% (Avançado)", color: "#a855f7", items: domains.filter(d => d.progress > 50 && d.progress <= 75) },
      { id: "76-100", title: "76% - 100% (Maestria)", color: "#10b981", items: domains.filter(d => d.progress > 75) },
    ];
  } else {
    // Default: Group by Layer
    const layerKeys: Layer[] = ["mission critical", "strategico", "human knowledge", "life skill"];
    columns = layerKeys.map(layer => ({
      id: layer,
      title: layerConfig[layer]?.label || layer,
      color: layerConfig[layer]?.color,
      items: domains.filter(d => d.layer === layer)
    }));
  }

  return (
    <div className="notion-board-grid">
      {columns.map(col => (
        <div key={col.id} className="board-column">
          <div className="board-col-head">
            <span className="board-col-title" style={{ color: col.color || "#fff" }}>● {col.title}</span>
            <span className="board-col-count">{col.items.length}</span>
          </div>
          <div className="board-cards-stack">
            {col.items.map(d => (
              <div key={d.id} className="board-card" onClick={() => onDomainClick(d)}>
                <div className="board-card-header">
                  <span className="board-icon">{d.icon}</span>
                  <strong>{d.name}</strong>
                </div>
                <p className="board-meta">{d.meta}</p>
                <div className="board-progress-row">
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${d.progress}%`, backgroundColor: d.color }} /></div>
                  <small>{d.progress}%</small>
                </div>
              </div>
            ))}
            {col.items.length === 0 && <p className="empty-subtext" style={{ padding: "12px 0" }}>Nenhum domínio nesta coluna.</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function DomainList({ domains, onDomainClick, onEditDomain, onAddNew }: { domains: Domain[]; onDomainClick: (d: Domain) => void; onEditDomain: (d: Domain) => void; onAddNew: () => void }) {
  return (
    <div className="db-list-view-container">
      {domains.map(d => (
        <div key={d.id} className="db-list-item-row" onClick={() => onDomainClick(d)}>
          <span className="list-item-icon">{d.icon}</span>
          <div className="list-item-main">
            <strong>{d.name}</strong>
            <p>{d.meta}</p>
          </div>
          <span className="layer-badge" style={{ backgroundColor: layerConfig[d.layer].bg, color: layerConfig[d.layer].color }}>{d.layer}</span>
          <span className="priority-pill">{d.priorityLevel}</span>
          <span className="progress-num">{d.progress}%</span>
          <ChevronRight size={14} className="list-arrow" />
        </div>
      ))}
    </div>
  );
}

/* ==========================================================================
   LESSONS VIEWS (TABLE, GALLERY, BOARD, LIST)
   ========================================================================== */

function LessonsTable({ lessons, onOpenLesson, onEditLesson, onAddNew }: { lessons: Lesson[]; onOpenLesson: (l: Lesson) => void; onEditLesson: (l: Lesson) => void; onAddNew: () => void }) {
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
              <th><span className="prop-type">🎯</span> Planos & Ciclos</th>
              <th><span className="prop-type">📅</span> Dias Crono</th>
              <th><span className="prop-type">●</span> Status</th>
              <th><span className="prop-type">□</span> Perguntas</th>
              <th><span className="prop-type">⏱️</span> Tempo Investido</th>
              <th><span className="prop-type">📊</span> Progresso</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map(l => {
              const plans = l.plans && l.plans.length > 0 ? l.plans : (l.plan ? [l.plan] : []);
              const cycles = l.cycles && l.cycles.length > 0 ? l.cycles : (l.cycle ? [l.cycle] : []);
              const days = l.scheduledDays || [];

              return (
                <tr key={l.id} className="notion-row" onClick={() => onOpenLesson(l)}>
                  <td className="cell-title">
                    <span className="q-icon">▦</span>
                    <strong>{l.name}</strong>
                  </td>
                  <td><span className="domain-tag">{l.domain}</span></td>
                  <td><span className="category-pill">{l.category}</span></td>
                  <td><span className="module-pill">{l.module}</span></td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", maxWidth: "200px" }}>
                      {plans.map((p, i) => (
                        <span key={`p-${i}`} className="category-pill" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#93c5fd", border: "1px solid rgba(59, 130, 246, 0.3)", fontSize: "10.5px", padding: "1px 6px" }}>
                          🎯 {p}
                        </span>
                      ))}
                      {cycles.map((c, i) => (
                        <span key={`c-${i}`} className="category-pill" style={{ background: "rgba(168, 85, 247, 0.15)", color: "#d8b4fe", border: "1px solid rgba(168, 85, 247, 0.3)", fontSize: "10.5px", padding: "1px 6px" }}>
                          🔄 {c}
                        </span>
                      ))}
                      {plans.length === 0 && cycles.length === 0 && (
                        <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>—</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", maxWidth: "160px" }}>
                      {days.length > 0 ? (
                        days.map((d, i) => (
                          <span key={i} className="category-pill" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#6ee7b7", border: "1px solid rgba(16, 185, 129, 0.3)", fontSize: "10px", padding: "1px 5px" }}>
                            {d.substring(0, 3)}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>—</span>
                      )}
                    </div>
                  </td>
                  <td><span className="status-pill">● {l.status}</span></td>
                  <td><span className="lesson-count-badge">{l.questionsCount}</span></td>
                  <td><span className="time-pill">{l.timeInvested || "1h 30m"}</span></td>
                  <td>
                    <div className="table-progress-v2">
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${l.progress}%`, backgroundColor: "#10b981" }} /></div>
                      <span className="progress-num">{l.progress}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="row-action-btns">
                      <button className="icon-edit-btn" onClick={(e) => { e.stopPropagation(); onEditLesson(l); }}><Edit3 size={13} /></button>
                      <button className="row-open-peek" onClick={(e) => { e.stopPropagation(); onOpenLesson(l); }}>Abrir <ChevronRight size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button className="notion-add-row" onClick={onAddNew}><Plus size={14} /> Nova Lesson</button>
    </div>
  );
}

function LessonsGallery({ lessons, onOpenLesson, onEditLesson, onAddNew }: { lessons: Lesson[]; onOpenLesson: (l: Lesson) => void; onEditLesson: (l: Lesson) => void; onAddNew: () => void }) {
  return (
    <div className="domain-gallery-layout">
      {lessons.map(l => {
        const plans = l.plans && l.plans.length > 0 ? l.plans : (l.plan ? [l.plan] : []);
        const cycles = l.cycles && l.cycles.length > 0 ? l.cycles : (l.cycle ? [l.cycle] : []);
        const days = l.scheduledDays || [];

        return (
          <div key={l.id} className="domain-gallery-card" onClick={() => onOpenLesson(l)}>
            <div className="gallery-header-cover" style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3))" }}>
              <span className="gallery-layer-badge">{l.status}</span>
              <button className="gallery-edit-btn" onClick={(e) => { e.stopPropagation(); onEditLesson(l); }}><Edit3 size={13} /></button>
            </div>
            <div className="gallery-card-content">
              <div className="gallery-title-row">
                <span className="gallery-icon">▦</span>
                <div>
                  <h3>{l.name}</h3>
                  <small className="gallery-date">{l.domain} • {l.module}</small>
                </div>
              </div>
              <p className="gallery-meta-text">{l.objective}</p>
              {(plans.length > 0 || cycles.length > 0 || days.length > 0) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", margin: "8px 0" }}>
                  {plans.map((p, i) => (
                    <span key={i} className="category-pill" style={{ fontSize: "10.5px", background: "rgba(59, 130, 246, 0.15)", color: "#93c5fd" }}>🎯 {p}</span>
                  ))}
                  {cycles.map((c, i) => (
                    <span key={i} className="category-pill" style={{ fontSize: "10.5px", background: "rgba(168, 85, 247, 0.15)", color: "#d8b4fe" }}>🔄 {c}</span>
                  ))}
                  {days.map((d, i) => (
                    <span key={i} className="category-pill" style={{ fontSize: "10.5px", background: "rgba(16, 185, 129, 0.15)", color: "#6ee7b7" }}>📅 {d}</span>
                  ))}
                </div>
              )}
              <div className="gallery-progress-box">
                <div className="progress-label-row"><span>Progresso da Lição</span><strong>{l.progress}%</strong></div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${l.progress}%`, backgroundColor: "#10b981" }} /></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LessonsBoard({ lessons, groupBy = "default", onOpenLesson, onEditLesson, onAddNew }: { lessons: Lesson[]; groupBy?: string; onOpenLesson: (l: Lesson) => void; onEditLesson: (l: Lesson) => void; onAddNew: () => void }) {
  let columns: { id: string; title: string; color?: string; items: Lesson[] }[] = [];

  if (groupBy === "domain") {
    const domainNames = Array.from(new Set(lessons.map(l => l.domain)));
    columns = domainNames.map(d => ({
      id: d,
      title: `◈ ${d}`,
      color: "#60a5fa",
      items: lessons.filter(l => l.domain === d)
    }));
  } else if (groupBy === "category") {
    const catNames = Array.from(new Set(lessons.map(l => l.category)));
    columns = catNames.map(c => ({
      id: c,
      title: `🏷️ ${c}`,
      color: "#a855f7",
      items: lessons.filter(l => l.category === c)
    }));
  } else if (groupBy === "difficulty") {
    const diffs = ["Iniciante", "Intermediário", "Avançado"];
    columns = diffs.map(df => ({
      id: df,
      title: `⚡ ${df}`,
      color: df === "Iniciante" ? "#10b981" : df === "Intermediário" ? "#f59e0b" : "#ef4444",
      items: lessons.filter(l => l.difficulty === df)
    }));
  } else if (groupBy === "module") {
    const modNames = Array.from(new Set(lessons.map(l => l.module)));
    columns = modNames.map(m => ({
      id: m,
      title: `📦 ${m}`,
      color: "#38bdf8",
      items: lessons.filter(l => l.module === m)
    }));
  } else {
    // Default: Status
    const statuses = ["Em Estudo", "Revisando", "Dominado"];
    columns = statuses.map(st => ({
      id: st,
      title: `● ${st}`,
      color: st === "Dominado" ? "#10b981" : st === "Revisando" ? "#60a5fa" : "#f59e0b",
      items: lessons.filter(l => l.status === st)
    }));
  }

  return (
    <div className="notion-board-grid">
      {columns.map(col => (
        <div key={col.id} className="board-column">
          <div className="board-col-head">
            <span className="board-col-title" style={{ color: col.color }}>{col.title}</span>
            <span className="board-col-count">{col.items.length}</span>
          </div>
          <div className="board-cards-stack">
            {col.items.map(l => (
              <div key={l.id} className="board-card" onClick={() => onOpenLesson(l)}>
                <div className="board-card-header">
                  <span className="board-icon">▦</span>
                  <strong>{l.name}</strong>
                </div>
                <p className="board-meta">{l.domain} • {l.module}</p>
                <div className="board-progress-row">
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${l.progress}%`, backgroundColor: "#10b981" }} /></div>
                  <small>{l.progress}%</small>
                </div>
              </div>
            ))}
            {col.items.length === 0 && <p className="empty-subtext" style={{ padding: "12px 0" }}>Nenhuma lição nesta coluna.</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function LessonsList({ lessons, onOpenLesson, onEditLesson, onAddNew }: { lessons: Lesson[]; onOpenLesson: (l: Lesson) => void; onEditLesson: (l: Lesson) => void; onAddNew: () => void }) {
  return (
    <div className="db-list-view-container">
      {lessons.map(l => {
        const plans = l.plans && l.plans.length > 0 ? l.plans : (l.plan ? [l.plan] : []);
        const cycles = l.cycles && l.cycles.length > 0 ? l.cycles : (l.cycle ? [l.cycle] : []);
        const days = l.scheduledDays || [];

        return (
          <div key={l.id} className="db-list-item-row" onClick={() => onOpenLesson(l)}>
            <span className="list-item-icon">▦</span>
            <div className="list-item-main">
              <strong>{l.name}</strong>
              <p>{l.domain} • {l.category} • {l.module}</p>
              {(plans.length > 0 || cycles.length > 0 || days.length > 0) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                  {plans.map((p, i) => (
                    <span key={i} className="category-pill" style={{ fontSize: "10px", background: "rgba(59, 130, 246, 0.15)", color: "#93c5fd" }}>🎯 {p}</span>
                  ))}
                  {cycles.map((c, i) => (
                    <span key={i} className="category-pill" style={{ fontSize: "10px", background: "rgba(168, 85, 247, 0.15)", color: "#d8b4fe" }}>🔄 {c}</span>
                  ))}
                  {days.map((d, i) => (
                    <span key={i} className="category-pill" style={{ fontSize: "10px", background: "rgba(16, 185, 129, 0.15)", color: "#6ee7b7" }}>📅 {d}</span>
                  ))}
                </div>
              )}
            </div>
            <span className="status-pill">● {l.status}</span>
            <span className="progress-num">{l.progress}%</span>
            <ChevronRight size={14} className="list-arrow" />
          </div>
        );
      })}
    </div>
  );
}

/* ==========================================================================
   CATEGORIES VIEWS (TABLE, GALLERY, BOARD, LIST)
   ========================================================================== */

function CategoriesTable({ categories, onEditCategory, onOpenDomain, onAddNew }: { categories: LessonCategory[]; onEditCategory: (c: LessonCategory) => void; onOpenDomain: (d: string) => void; onAddNew: () => void }) {
  return (
    <div className="notion-db-card">
      <div className="notion-table-wrapper">
        <table className="notion-table">
          <thead>
            <tr>
              <th className="col-name"><span className="prop-type">Aa</span> Categoria</th>
              <th><span className="prop-type">◈</span> Domínio</th>
              <th><span className="prop-type">▦</span> Lições</th>
              <th><span className="prop-type">📝</span> Descrição</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id} className="notion-row" onClick={() => onEditCategory(c)}>
                <td className="cell-title"><span className="cat-color-dot" style={{ backgroundColor: c.color }} /><strong>{c.name}</strong></td>
                <td><button className="domain-link-btn" onClick={(e) => { e.stopPropagation(); onOpenDomain(c.domain); }}>◈ {c.domain}</button></td>
                <td><span className="lesson-count-badge">{c.lessonsCount} lições</span></td>
                <td><p className="meta-clamp">{c.description}</p></td>
                <td><button className="row-open-peek" onClick={(e) => { e.stopPropagation(); onEditCategory(c); }}><Edit3 size={12} /> Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="notion-add-row" onClick={onAddNew}><Plus size={14} /> Nova Categoria</button>
    </div>
  );
}

function CategoriesGallery({ categories, onEditCategory, onAddNew }: { categories: LessonCategory[]; onEditCategory: (c: LessonCategory) => void; onAddNew: () => void }) {
  return (
    <div className="domain-gallery-layout">
      {categories.map(c => (
        <div key={c.id} className="domain-gallery-card" onClick={() => onEditCategory(c)}>
          <div className="gallery-header-cover" style={{ background: `linear-gradient(135deg, ${c.color}33, ${c.color}66)` }}>
            <span className="gallery-layer-badge">Categoria</span>
            <button className="gallery-edit-btn" onClick={(e) => { e.stopPropagation(); onEditCategory(c); }}><Edit3 size={13} /></button>
          </div>
          <div className="gallery-card-content">
            <h3>{c.name}</h3>
            <small className="gallery-date">Domínio: {c.domain}</small>
            <p className="gallery-meta-text">{c.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoriesBoard({ categories, groupBy = "default", onEditCategory, onAddNew }: { categories: LessonCategory[]; groupBy?: string; onEditCategory: (c: LessonCategory) => void; onAddNew: () => void }) {
  const domainNames = Array.from(new Set(categories.map(c => c.domain)));
  return (
    <div className="notion-board-grid">
      {domainNames.map(dom => {
        const list = categories.filter(c => c.domain === dom);
        return (
          <div key={dom} className="board-column">
            <div className="board-col-head">
              <span className="board-col-title">◈ {dom}</span>
              <span className="board-col-count">{list.length}</span>
            </div>
            <div className="board-cards-stack">
              {list.map(c => (
                <div key={c.id} className="board-card" onClick={() => onEditCategory(c)}>
                  <strong>{c.name}</strong>
                  <p className="board-meta">{c.lessonsCount} lições</p>
                  <small>{c.description}</small>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CategoriesList({ categories, onEditCategory, onAddNew }: { categories: LessonCategory[]; onEditCategory: (c: LessonCategory) => void; onAddNew: () => void }) {
  return (
    <div className="db-list-view-container">
      {categories.map(c => (
        <div key={c.id} className="db-list-item-row" onClick={() => onEditCategory(c)}>
          <span className="list-item-icon">🏷️</span>
          <div className="list-item-main">
            <strong>{c.name}</strong>
            <p>{c.domain} • {c.description}</p>
          </div>
          <span className="lesson-count-badge">{c.lessonsCount} lições</span>
          <ChevronRight size={14} className="list-arrow" />
        </div>
      ))}
    </div>
  );
}

/* ==========================================================================
   MODULES VIEWS (TABLE, GALLERY, BOARD, LIST)
   ========================================================================== */

function ModulesTable({ modules, onEditModule, onOpenLesson, onAddNew }: { modules: ModuleItem[]; onEditModule: (m: ModuleItem) => void; onOpenLesson: (l: string) => void; onAddNew: () => void }) {
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
              <th><span className="prop-type">📊</span> Progresso</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {modules.map(m => (
              <tr key={m.id} className="notion-row" onClick={() => onEditModule(m)}>
                <td className="cell-title"><span className="q-icon">📦</span><strong>{m.name}</strong></td>
                <td><button className="domain-link-btn" onClick={(e) => { e.stopPropagation(); onOpenLesson(m.lesson); }}>▦ {m.lesson}</button></td>
                <td><span className="domain-tag">{m.domain}</span></td>
                <td><span className="category-pill">{m.category}</span></td>
                <td><span className="lesson-count-badge">{m.questionsCount}</span></td>
                <td><span className="status-pill">● {m.status}</span></td>
                <td>
                  <div className="table-progress-v2">
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${m.progress}%`, backgroundColor: "#60a5fa" }} /></div>
                    <span className="progress-num">{m.progress}%</span>
                  </div>
                </td>
                <td><button className="row-open-peek" onClick={(e) => { e.stopPropagation(); onEditModule(m); }}><Edit3 size={12} /> Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="notion-add-row" onClick={onAddNew}><Plus size={14} /> Novo Módulo</button>
    </div>
  );
}

function ModulesGallery({ modules, onEditModule, onAddNew }: { modules: ModuleItem[]; onEditModule: (m: ModuleItem) => void; onAddNew: () => void }) {
  return (
    <div className="domain-gallery-layout">
      {modules.map(m => (
        <div key={m.id} className="domain-gallery-card" onClick={() => onEditModule(m)}>
          <div className="gallery-header-cover" style={{ background: "linear-gradient(135deg, rgba(96, 165, 250, 0.2), rgba(37, 99, 235, 0.3))" }}>
            <span className="gallery-layer-badge">{m.status}</span>
            <button className="gallery-edit-btn" onClick={(e) => { e.stopPropagation(); onEditModule(m); }}><Edit3 size={13} /></button>
          </div>
          <div className="gallery-card-content">
            <h3>{m.name}</h3>
            <small className="gallery-date">{m.domain} • {m.lesson}</small>
            <div className="gallery-progress-box">
              <div className="progress-label-row"><span>Progresso</span><strong>{m.progress}%</strong></div>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${m.progress}%`, backgroundColor: "#60a5fa" }} /></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ModulesBoard({ modules, groupBy = "default", onEditModule, onAddNew }: { modules: ModuleItem[]; groupBy?: string; onEditModule: (m: ModuleItem) => void; onAddNew: () => void }) {
  let columns: { id: string; title: string; color?: string; items: ModuleItem[] }[] = [];

  if (groupBy === "domain") {
    const domainNames = Array.from(new Set(modules.map(m => m.domain)));
    columns = domainNames.map(d => ({
      id: d,
      title: `◈ ${d}`,
      color: "#60a5fa",
      items: modules.filter(m => m.domain === d)
    }));
  } else if (groupBy === "lesson") {
    const lesNames = Array.from(new Set(modules.map(m => m.lesson)));
    columns = lesNames.map(l => ({
      id: l,
      title: `▦ ${l}`,
      color: "#34d399",
      items: modules.filter(m => m.lesson === l)
    }));
  } else if (groupBy === "category") {
    const catNames = Array.from(new Set(modules.map(m => m.category)));
    columns = catNames.map(c => ({
      id: c,
      title: `🏷️ ${c}`,
      color: "#a855f7",
      items: modules.filter(m => m.category === c)
    }));
  } else {
    // Default: Status
    const statuses = ["Em Estudo", "Revisando", "Dominado"];
    columns = statuses.map(st => ({
      id: st,
      title: `● ${st}`,
      color: st === "Dominado" ? "#10b981" : st === "Revisando" ? "#60a5fa" : "#f59e0b",
      items: modules.filter(m => m.status === st)
    }));
  }

  return (
    <div className="notion-board-grid">
      {columns.map(col => (
        <div key={col.id} className="board-column">
          <div className="board-col-head"><span className="board-col-title" style={{ color: col.color }}>{col.title}</span><span className="board-col-count">{col.items.length}</span></div>
          <div className="board-cards-stack">
            {col.items.map(m => (
              <div key={m.id} className="board-card" onClick={() => onEditModule(m)}>
                <strong>{m.name}</strong>
                <p className="board-meta">{m.domain} • {m.lesson}</p>
              </div>
            ))}
            {col.items.length === 0 && <p className="empty-subtext" style={{ padding: "12px 0" }}>Nenhum módulo nesta coluna.</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ModulesList({ modules, onEditModule, onAddNew }: { modules: ModuleItem[]; onEditModule: (m: ModuleItem) => void; onAddNew: () => void }) {
  return (
    <div className="db-list-view-container">
      {modules.map(m => (
        <div key={m.id} className="db-list-item-row" onClick={() => onEditModule(m)}>
          <span className="list-item-icon">📦</span>
          <div className="list-item-main"><strong>{m.name}</strong><p>{m.domain} • {m.lesson} • {m.category}</p></div>
          <span className="status-pill">● {m.status}</span>
          <span className="progress-num">{m.progress}%</span>
          <ChevronRight size={14} className="list-arrow" />
        </div>
      ))}
    </div>
  );
}

/* ==========================================================================
   QUESTIONS VIEWS (TABLE, GALLERY, BOARD, LIST)
   ========================================================================== */

function QuestionsTable({ questions, onQuestion, onEditQuestion, onAddNew }: { questions: Question[]; onQuestion: (q: Question) => void; onEditQuestion?: (q: Question) => void; onAddNew?: () => void }) {
  return (
    <div className="notion-db-card">
      <div className="notion-table-wrapper">
        <table className="notion-table">
          <thead>
            <tr>
              <th className="col-name"><span className="prop-type">Aa</span> Questão / Pergunta</th>
              <th><span className="prop-type">◈</span> Domínio</th>
              <th><span className="prop-type">▦</span> Lesson</th>
              <th><span className="prop-type">📦</span> Módulo</th>
              <th><span className="prop-type">🧬</span> Fase Ciclo</th>
              <th><span className="prop-type">📊</span> Retenção</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {questions.map(q => (
              <tr key={q.id} className="notion-row" onClick={() => onQuestion(q)}>
                <td className="cell-title"><span className="q-icon">□</span><strong>{q.title}</strong></td>
                <td><span className="domain-tag">{q.domain}</span></td>
                <td><span>{q.lesson}</span></td>
                <td><span className="module-pill">{q.module}</span></td>
                <td><span className={`stage-tag-mini stage-${q.stage}`}>{q.stage}</span></td>
                <td>
                  <div className="table-progress-v2">
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${q.progress}%`, backgroundColor: "#3b82f6" }} /></div>
                    <span className="progress-num">{q.progress}%</span>
                  </div>
                </td>
                <td>
                  <div className="row-action-btns">
                    {onEditQuestion && <button className="icon-edit-btn" onClick={(e) => { e.stopPropagation(); onEditQuestion(q); }}><Edit3 size={13} /></button>}
                    <button className="row-open-peek" onClick={(e) => { e.stopPropagation(); onQuestion(q); }}>Abrir Dados <ChevronRight size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onAddNew && <button className="notion-add-row" onClick={onAddNew}><Plus size={14} /> Nova Question</button>}
    </div>
  );
}

function QuestionsGallery({ questions, onQuestion, onEditQuestion, onAddNew }: { questions: Question[]; onQuestion: (q: Question) => void; onEditQuestion?: (q: Question) => void; onAddNew?: () => void }) {
  return (
    <div className="domain-gallery-layout">
      {questions.map(q => (
        <div key={q.id} className="domain-gallery-card" onClick={() => onQuestion(q)}>
          <div className="gallery-header-cover" style={{ background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.3))" }}>
            <span className={`stage-tag-mini stage-${q.stage}`}>Fase: {q.stage}</span>
            {onEditQuestion && <button className="gallery-edit-btn" onClick={(e) => { e.stopPropagation(); onEditQuestion(q); }}><Edit3 size={13} /></button>}
          </div>
          <div className="gallery-card-content">
            <h3>{q.title}</h3>
            <small className="gallery-date">{q.domain} • {q.lesson} • {q.module}</small>
            <div className="gallery-progress-box">
              <div className="progress-label-row"><span>Retenção no Ciclo</span><strong>{q.progress}%</strong></div>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${q.progress}%`, backgroundColor: "#3b82f6" }} /></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function QuestionsBoard({ questions, groupBy = "default", onQuestion, onEditQuestion, onAddNew }: { questions: Question[]; groupBy?: string; onQuestion: (q: Question) => void; onEditQuestion?: (q: Question) => void; onAddNew?: () => void }) {
  let columns: { id: string; title: string; color?: string; items: Question[] }[] = [];

  if (groupBy === "domain") {
    const domainNames = Array.from(new Set(questions.map(q => q.domain)));
    columns = domainNames.map(d => ({
      id: d,
      title: `◈ ${d}`,
      color: "#60a5fa",
      items: questions.filter(q => q.domain === d)
    }));
  } else if (groupBy === "lesson") {
    const lesNames = Array.from(new Set(questions.map(q => q.lesson)));
    columns = lesNames.map(l => ({
      id: l,
      title: `▦ ${l}`,
      color: "#34d399",
      items: questions.filter(q => q.lesson === l)
    }));
  } else if (groupBy === "module") {
    const modNames = Array.from(new Set(questions.map(q => q.module)));
    columns = modNames.map(m => ({
      id: m,
      title: `📦 ${m}`,
      color: "#c084fc",
      items: questions.filter(q => q.module === m)
    }));
  } else if (groupBy === "progress") {
    columns = [
      { id: "0-49", title: "0% - 49% (Fixação Inicial)", color: "#f59e0b", items: questions.filter(q => q.progress < 50) },
      { id: "50-79", title: "50% - 79% (Em Consolidação)", color: "#60a5fa", items: questions.filter(q => q.progress >= 50 && q.progress < 80) },
      { id: "80-100", title: "80% - 100% (Alta Retenção)", color: "#10b981", items: questions.filter(q => q.progress >= 80) },
    ];
  } else {
    // Default: Group by Stage
    const stages = ["study", "fixation", "weekly", "monthly", "mastered"];
    columns = stages.map(st => ({
      id: st,
      title: `🧬 ${st.toUpperCase()}`,
      color: st === "mastered" ? "#10b981" : st === "monthly" ? "#ec4899" : st === "weekly" ? "#a855f7" : st === "fixation" ? "#f59e0b" : "#60a5fa",
      items: questions.filter(q => q.stage === st)
    }));
  }

  return (
    <div className="notion-board-grid">
      {columns.map(col => (
        <div key={col.id} className="board-column">
          <div className="board-col-head"><span className="board-col-title" style={{ color: col.color }}>{col.title}</span><span className="board-col-count">{col.items.length}</span></div>
          <div className="board-cards-stack">
            {col.items.map(q => (
              <div key={q.id} className="board-card" onClick={() => onQuestion(q)}>
                <strong>{q.title}</strong>
                <p className="board-meta">{q.domain} • {q.lesson}</p>
                <small>{q.progress}% retenção</small>
              </div>
            ))}
            {col.items.length === 0 && <p className="empty-subtext" style={{ padding: "12px 0" }}>Nenhuma question nesta coluna.</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function QuestionsList({ questions, onQuestion, onEditQuestion, onAddNew }: { questions: Question[]; onQuestion: (q: Question) => void; onEditQuestion?: (q: Question) => void; onAddNew?: () => void }) {
  return (
    <div className="db-list-view-container">
      {questions.map(q => (
        <div key={q.id} className="db-list-item-row" onClick={() => onQuestion(q)}>
          <span className="list-item-icon">□</span>
          <div className="list-item-main"><strong>{q.title}</strong><p>{q.domain} • {q.lesson} • {q.module}</p></div>
          <span className={`stage-tag-mini stage-${q.stage}`}>{q.stage}</span>
          <span className="progress-num">{q.progress}%</span>
          <ChevronRight size={14} className="list-arrow" />
        </div>
      ))}
    </div>
  );
}

/* ==========================================================================
   VAULTS VIEWS (TABLE, GALLERY, BOARD, LIST) - EXCLUSIVE TO QUESTIONS
   ========================================================================== */

function VaultsTable({ questions, onOpenVaultPage, onEditVault, onAddNew, onDeleteVault }: { questions: Question[]; onOpenVaultPage: (t: VaultViewTarget) => void; onEditVault: (id: string, name: string, v: Vault) => void; onAddNew?: () => void; onDeleteVault?: (id: string) => void }) {
  return (
    <div className="notion-db-card">
      <div className="notion-table-wrapper">
        <table className="notion-table">
          <thead>
            <tr>
              <th className="col-name"><span className="prop-type">Aa</span> Vault da Question</th>
              <th><span className="prop-type">◈</span> Domínio</th>
              <th><span className="prop-type">▦</span> Lesson</th>
              <th><span className="prop-type">🔖</span> Destaques</th>
              <th><span className="prop-type">🔗</span> Conexões</th>
              <th><span className="prop-type">🤖</span> Aulas IA</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {questions.map(q => (
              <tr key={`v-${q.id}`} className="notion-row" onClick={() => onOpenVaultPage({ id: q.id, name: `Questão • ${q.title}`, type: "question", domain: q.domain, lesson: q.lesson, module: q.module, vault: q.vault || sampleVault })}>
                <td className="cell-title"><span className="q-icon">▤</span><strong>Vault • {q.title}</strong></td>
                <td><span className="domain-tag">{q.domain}</span></td>
                <td><span>{q.lesson}</span></td>
                <td><span>{q.vault?.highlights?.length || 3} destaques</span></td>
                <td><span style={{ color: "#a855f7" }}>{q.vault?.connections?.length || 2} conexões</span></td>
                <td><span className="category-pill">{q.vault?.aiLessons?.length || 1} aulas IA</span></td>
                <td>
                  <div className="row-action-btns">
                    <button className="row-open-peek">Abrir Vault <ChevronRight size={13} /></button>
                    {onDeleteVault && (
                      <button
                        className="icon-edit-btn"
                        title="Excluir Vault"
                        style={{ color: "#ef4444" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteVault(q.id);
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onAddNew && <button className="notion-add-row" onClick={onAddNew}><Plus size={14} /> Novo Vault (Criar Question & Vault)</button>}
    </div>
  );
}

function VaultsGallery({ questions, onOpenVaultPage, onEditVault, onAddNew, onDeleteVault }: { questions: Question[]; onOpenVaultPage: (t: VaultViewTarget) => void; onEditVault: (id: string, name: string, v: Vault) => void; onAddNew?: () => void; onDeleteVault?: (id: string) => void }) {
  return (
    <div className="domain-gallery-layout">
      {questions.map(q => (
        <div key={`vg-${q.id}`} className="domain-gallery-card" onClick={() => onOpenVaultPage({ id: q.id, name: `Questão • ${q.title}`, type: "question", domain: q.domain, lesson: q.lesson, module: q.module, vault: q.vault || sampleVault })}>
          <div className="gallery-header-cover" style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)" }}>
            <span className="gallery-layer-badge">Vault</span>
          </div>
          <div className="gallery-card-content">
            <h3>Vault • {q.title}</h3>
            <small className="gallery-date">{q.domain} • {q.lesson}</small>
            <p className="gallery-meta-text">{q.vault?.learning || "Síntese em construção..."}</p>
            {onDeleteVault && (
              <div style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end" }}>
                <button className="btn-delete-row" style={{ padding: "3px 8px", fontSize: "11px" }} onClick={(e) => { e.stopPropagation(); onDeleteVault(q.id); }}>
                  <Trash2 size={12} /> Excluir Vault
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function VaultsBoard({ questions, groupBy = "default", onOpenVaultPage, onEditVault, onAddNew, onDeleteVault }: { questions: Question[]; groupBy?: string; onOpenVaultPage: (t: VaultViewTarget) => void; onEditVault: (id: string, name: string, v: Vault) => void; onAddNew?: () => void; onDeleteVault?: (id: string) => void }) {
  let columns: { id: string; title: string; color?: string; items: Question[] }[] = [];

  if (groupBy === "lesson") {
    const lesNames = Array.from(new Set(questions.map(q => q.lesson)));
    columns = lesNames.map(l => ({
      id: l,
      title: `▦ ${l}`,
      color: "#34d399",
      items: questions.filter(q => q.lesson === l)
    }));
  } else {
    // Default: Domain
    const domainsList = Array.from(new Set(questions.map(q => q.domain)));
    columns = domainsList.map(dom => ({
      id: dom,
      title: `◈ ${dom}`,
      color: "#60a5fa",
      items: questions.filter(q => q.domain === dom)
    }));
  }

  return (
    <div className="notion-board-grid">
      {columns.map(col => (
        <div key={col.id} className="board-column">
          <div className="board-col-head"><span className="board-col-title" style={{ color: col.color }}>{col.title}</span><span className="board-col-count">{col.items.length}</span></div>
          <div className="board-cards-stack">
            {col.items.map(q => (
              <div key={`vb-${q.id}`} className="board-card" onClick={() => onOpenVaultPage({ id: q.id, name: `Questão • ${q.title}`, type: "question", domain: q.domain, lesson: q.lesson, module: q.module, vault: q.vault || sampleVault })}>
                <strong>Vault • {q.title}</strong>
                <p className="board-meta">{q.lesson}</p>
                {onDeleteVault && (
                  <button className="btn-delete-row" style={{ marginTop: "6px", padding: "2px 6px", fontSize: "10.5px" }} onClick={(e) => { e.stopPropagation(); onDeleteVault(q.id); }}>
                    <Trash2 size={11} /> Excluir Vault
                  </button>
                )}
              </div>
            ))}
            {col.items.length === 0 && <p className="empty-subtext" style={{ padding: "12px 0" }}>Nenhuma vault nesta coluna.</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function VaultsList({ questions, onOpenVaultPage, onEditVault, onAddNew, onDeleteVault }: { questions: Question[]; onOpenVaultPage: (t: VaultViewTarget) => void; onEditVault: (id: string, name: string, v: Vault) => void; onAddNew?: () => void; onDeleteVault?: (id: string) => void }) {
  return (
    <div className="db-list-view-container">
      {questions.map(q => (
        <div key={`vl-${q.id}`} className="db-list-item-row" onClick={() => onOpenVaultPage({ id: q.id, name: `Questão • ${q.title}`, type: "question", domain: q.domain, lesson: q.lesson, module: q.module, vault: q.vault || sampleVault })}>
          <span className="list-item-icon">▤</span>
          <div className="list-item-main"><strong>Vault • {q.title}</strong><p>{q.domain} • {q.lesson}</p></div>
          <span className="category-pill">{q.vault?.highlights?.length || 2} destaques</span>
          {onDeleteVault && (
            <button className="icon-edit-btn" style={{ color: "#ef4444", margin: "0 8px" }} onClick={(e) => { e.stopPropagation(); onDeleteVault(q.id); }}>
              <Trash2 size={13} />
            </button>
          )}
          <ChevronRight size={14} className="list-arrow" />
        </div>
      ))}
    </div>
  );
}

/* ==========================================================================
   REVIEWS VIEWS (TABLE, GALLERY, BOARD, LIST)
   ========================================================================== */

function ReviewsTable({ reviews, onQuestion, onEditReview, onAddNew }: { reviews: ReviewRecord[]; onQuestion: (q: Question) => void; onEditReview: (r: ReviewRecord) => void; onAddNew: () => void }) {
  return (
    <div className="notion-db-card">
      <div className="notion-table-wrapper">
        <table className="notion-table">
          <thead>
            <tr>
              <th className="col-name"><span className="prop-type">↻</span> Revisão</th>
              <th><span className="prop-type">◈</span> Domínio</th>
              <th><span className="prop-type">▦</span> Lesson</th>
              <th><span className="prop-type">📅</span> Vencimento</th>
              <th><span className="prop-type">●</span> Status</th>
              <th><span className="prop-type">📊</span> Score & Benchmark</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r.id} className="notion-row" onClick={() => onEditReview(r)}>
                <td className="cell-title"><span className="q-icon">↻</span><strong>{r.title}</strong></td>
                <td><span className="domain-tag">{r.domain}</span></td>
                <td><span>{r.lesson}</span></td>
                <td><span className="date-pill">{r.dueDate}</span></td>
                <td><span className="status-pill">● {r.status}</span></td>
                <td><small style={{ color: "#34d399" }}>{r.benchmarkTestResult || `${r.retentionScore}%`}</small></td>
                <td><button className="row-open-peek" onClick={(e) => { e.stopPropagation(); onEditReview(r); }}><Edit3 size={12} /> Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="notion-add-row" onClick={onAddNew}><Plus size={14} /> Nova Revisão</button>
    </div>
  );
}

function ReviewsGallery({ reviews, onQuestion, onEditReview, onAddNew }: { reviews: ReviewRecord[]; onQuestion: (q: Question) => void; onEditReview: (r: ReviewRecord) => void; onAddNew: () => void }) {
  return (
    <div className="domain-gallery-layout">
      {reviews.map(r => (
        <div key={r.id} className="domain-gallery-card" onClick={() => onEditReview(r)}>
          <div className="gallery-header-cover" style={{ background: "linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(126, 34, 206, 0.3))" }}>
            <span className="gallery-layer-badge">{r.status}</span>
            <button className="gallery-edit-btn" onClick={(e) => { e.stopPropagation(); onEditReview(r); }}><Edit3 size={13} /></button>
          </div>
          <div className="gallery-card-content">
            <h3>{r.title}</h3>
            <small className="gallery-date">Vencimento: {r.dueDate}</small>
            <p className="gallery-meta-text">{r.benchmarkTestResult || "Score de retenção ativo"}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReviewsBoard({ reviews, groupBy = "default", onQuestion, onEditReview, onAddNew }: { reviews: ReviewRecord[]; groupBy?: string; onQuestion: (q: Question) => void; onEditReview: (r: ReviewRecord) => void; onAddNew: () => void }) {
  let columns: { id: string; title: string; color?: string; items: ReviewRecord[] }[] = [];

  if (groupBy === "type") {
    const types = ["Daily (24h)", "Weekly (7d)", "Monthly (30d)", "Mastery Recall"];
    columns = types.map(t => ({
      id: t,
      title: `↻ ${t}`,
      color: t.includes("Daily") ? "#f59e0b" : t.includes("Weekly") ? "#a855f7" : "#ec4899",
      items: reviews.filter(r => r.type === t)
    }));
  } else if (groupBy === "domain") {
    const domainNames = Array.from(new Set(reviews.map(r => r.domain)));
    columns = domainNames.map(d => ({
      id: d,
      title: `◈ ${d}`,
      color: "#60a5fa",
      items: reviews.filter(r => r.domain === d)
    }));
  } else {
    // Default: Status
    const statuses = ["Pendente", "Pronto", "Concluído"];
    columns = statuses.map(st => ({
      id: st,
      title: `● ${st}`,
      color: st === "Pronto" ? "#34d399" : st === "Pendente" ? "#f59e0b" : "#94a3b8",
      items: reviews.filter(r => r.status === st)
    }));
  }

  return (
    <div className="notion-board-grid">
      {columns.map(col => (
        <div key={col.id} className="board-column">
          <div className="board-col-head"><span className="board-col-title" style={{ color: col.color }}>{col.title}</span><span className="board-col-count">{col.items.length}</span></div>
          <div className="board-cards-stack">
            {col.items.map(r => (
              <div key={r.id} className="board-card" onClick={() => onEditReview(r)}>
                <strong>{r.title}</strong>
                <p className="board-meta">{r.domain} • {r.lesson}</p>
                <small>Prazo: {r.dueDate}</small>
              </div>
            ))}
            {col.items.length === 0 && <p className="empty-subtext" style={{ padding: "12px 0" }}>Nenhuma revisão nesta coluna.</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReviewsList({ reviews, onQuestion, onEditReview, onAddNew }: { reviews: ReviewRecord[]; onQuestion: (q: Question) => void; onEditReview: (r: ReviewRecord) => void; onAddNew: () => void }) {
  return (
    <div className="db-list-view-container">
      {reviews.map(r => (
        <div key={r.id} className="db-list-item-row" onClick={() => onEditReview(r)}>
          <span className="list-item-icon">↻</span>
          <div className="list-item-main"><strong>{r.title}</strong><p>{r.domain} • {r.lesson} • {r.question}</p></div>
          <span className="date-pill">{r.dueDate}</span>
          <span className="status-pill">● {r.status}</span>
          <ChevronRight size={14} className="list-arrow" />
        </div>
      ))}
    </div>
  );
}

/* ==========================================================================
   PROJECTS VIEWS (TABLE, GALLERY, BOARD, LIST) WITH TASKS
   ========================================================================== */

function ProjectsTable({
  projects,
  tasks,
  onEditProject,
  onOpenProjectPage,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onOpenDomain,
  onAddNew,
}: {
  projects: Project[];
  tasks: ProjectTask[];
  onEditProject: (p: Project) => void;
  onOpenProjectPage?: (p: Project) => void;
  onToggleTask: (taskId: string) => void;
  onAddTask: (projectId: string, title: string, dueDate: string) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenDomain: (d: string) => void;
  onAddNew: () => void;
}) {
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("2026-09-30");

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
                <th><span className="prop-type">📅</span> Prazo</th>
                <th><span className="prop-type">☑️</span> Tarefas</th>
                <th><span className="prop-type">📊</span> Progresso</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => {
                const projectTasks = tasks.filter(t => t.projectId === p.id);
                const completedCount = projectTasks.filter(t => t.completed).length;
                const isExpanded = expandedProjectId === p.id;
                return (
                  <React.Fragment key={p.id}>
                    <tr className="notion-row" onClick={() => setExpandedProjectId(isExpanded ? null : p.id)}>
                      <td className="cell-title"><span className="domain-row-icon">{p.icon}</span><strong>{p.name}</strong></td>
                      <td><button className="domain-link-btn" onClick={(e) => { e.stopPropagation(); onOpenDomain(p.domain); }}>◈ {p.domain}</button></td>
                      <td><span className="category-pill">{p.category}</span></td>
                      <td><span className="status-badge">● {p.status}</span></td>
                      <td><span className="date-pill">{p.targetDate}</span></td>
                      <td><span className="task-count-pill">☑️ {completedCount}/{projectTasks.length}</span></td>
                      <td>
                        <div className="table-progress-v2">
                          <div className="bar-track"><div className="bar-fill" style={{ width: `${p.progress}%`, backgroundColor: "#3b82f6" }} /></div>
                          <span className="progress-num">{p.progress}%</span>
                        </div>
                      </td>
                      <td>
                        <div className="row-action-btns">
                          {onOpenProjectPage && (
                            <button className="row-open-peek" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", borderColor: "rgba(59, 130, 246, 0.3)" }} onClick={(e) => { e.stopPropagation(); onOpenProjectPage(p); }}>
                              Página ↗
                            </button>
                          )}
                          <button className="icon-edit-btn" onClick={(e) => { e.stopPropagation(); onEditProject(p); }}><Edit3 size={13} /></button>
                          <button className="row-open-peek" onClick={(e) => { e.stopPropagation(); setExpandedProjectId(isExpanded ? null : p.id); }}>
                            {isExpanded ? "Fechar ▲" : "Tarefas ▼"}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="embedded-tasks-row">
                        <td colSpan={8}>
                          <div className="embedded-tasks-container">
                            <div className="embedded-tasks-header">
                              <strong>☑️ Tarefas de "{p.name}" ({completedCount}/{projectTasks.length} concluídas)</strong>
                            </div>
                            <div className="embedded-tasks-list">
                              {projectTasks.map(task => (
                                <div key={task.id} className={`embedded-task-item ${task.completed ? "completed" : ""}`}>
                                  <button type="button" className="task-check-btn" onClick={() => onToggleTask(task.id)}>
                                    {task.completed ? <CheckSquare size={16} className="checked" /> : <Box size={16} />}
                                  </button>
                                  <span className="task-title-text">{task.title}</span>
                                  {task.dueDate && <span className="task-date-badge">📅 {task.dueDate}</span>}
                                  <button type="button" className="task-delete-btn" onClick={() => onDeleteTask(task.id)}><X size={13} /></button>
                                </div>
                              ))}
                            </div>
                            <div className="add-task-inline-row">
                              <input type="text" placeholder="Adicionar nova tarefa..." value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreateTask(p.id)} />
                              <input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} />
                              <button className="btn-add-mini" onClick={() => handleCreateTask(p.id)}><Plus size={13} /> Adicionar</button>
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
        <button className="notion-add-row" onClick={onAddNew}><Plus size={14} /> Novo Projeto</button>
      </div>
    </div>
  );
}

function ProjectsGallery({ projects, tasks, onEditProject, onOpenProjectPage, onAddNew }: { projects: Project[]; tasks: ProjectTask[]; onEditProject: (p: Project) => void; onOpenProjectPage?: (p: Project) => void; onAddNew: () => void }) {
  return (
    <div className="domain-gallery-layout">
      {projects.map(p => (
        <div key={p.id} className="domain-gallery-card" onClick={() => onOpenProjectPage ? onOpenProjectPage(p) : onEditProject(p)}>
          <div className="gallery-header-cover" style={{ background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(16, 185, 129, 0.3))" }}>
            <span className="gallery-layer-badge">{p.status}</span>
            <button className="gallery-edit-btn" onClick={(e) => { e.stopPropagation(); onEditProject(p); }}><Edit3 size={13} /></button>
          </div>
          <div className="gallery-card-content">
            <h3>{p.icon} {p.name}</h3>
            <small className="gallery-date">Prazo: {p.targetDate}</small>
            <div className="gallery-progress-box">
              <div className="progress-label-row"><span>Progresso</span><strong>{p.progress}%</strong></div>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${p.progress}%`, backgroundColor: "#3b82f6" }} /></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectsBoard({ projects, tasks, groupBy = "default", onEditProject, onOpenProjectPage, onAddNew }: { projects: Project[]; tasks: ProjectTask[]; groupBy?: string; onEditProject: (p: Project) => void; onOpenProjectPage?: (p: Project) => void; onAddNew: () => void }) {
  let columns: { id: string; title: string; color?: string; items: Project[] }[] = [];

  if (groupBy === "domain") {
    const domainNames = Array.from(new Set(projects.map(p => p.domain)));
    columns = domainNames.map(d => ({
      id: d,
      title: `◈ ${d}`,
      color: "#60a5fa",
      items: projects.filter(p => p.domain === d)
    }));
  } else if (groupBy === "category") {
    const catNames = Array.from(new Set(projects.map(p => p.category)));
    columns = catNames.map(c => ({
      id: c,
      title: `🏷️ ${c}`,
      color: "#a855f7",
      items: projects.filter(p => p.category === c)
    }));
  } else if (groupBy === "progress") {
    columns = [
      { id: "0-25", title: "0% - 25% (Iniciando)", color: "#94a3b8", items: projects.filter(p => p.progress <= 25) },
      { id: "26-50", title: "26% - 50% (Em Andamento)", color: "#60a5fa", items: projects.filter(p => p.progress > 25 && p.progress <= 50) },
      { id: "51-75", title: "51% - 75% (Avançado)", color: "#a855f7", items: projects.filter(p => p.progress > 50 && p.progress <= 75) },
      { id: "76-100", title: "76% - 100% (Pronto/Concluído)", color: "#10b981", items: projects.filter(p => p.progress > 75) },
    ];
  } else {
    // Default: Status
    const statuses = ["Em Andamento", "Planejado", "Concluído", "Pausado"];
    columns = statuses.map(st => ({
      id: st,
      title: `● ${st}`,
      color: st === "Concluído" ? "#10b981" : st === "Em Andamento" ? "#3b82f6" : "#f59e0b",
      items: projects.filter(p => p.status === st)
    }));
  }

  return (
    <div className="notion-board-grid">
      {columns.map(col => (
        <div key={col.id} className="board-column">
          <div className="board-col-head"><span className="board-col-title" style={{ color: col.color }}>{col.title}</span><span className="board-col-count">{col.items.length}</span></div>
          <div className="board-cards-stack">
            {col.items.map(p => (
              <div key={p.id} className="board-card" onClick={() => onOpenProjectPage ? onOpenProjectPage(p) : onEditProject(p)}>
                <strong>{p.icon} {p.name}</strong>
                <p className="board-meta">{p.domain} • {p.category}</p>
              </div>
            ))}
            {col.items.length === 0 && <p className="empty-subtext" style={{ padding: "12px 0" }}>Nenhum projeto nesta coluna.</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectsList({ projects, tasks, onEditProject, onOpenProjectPage, onAddNew }: { projects: Project[]; tasks: ProjectTask[]; onEditProject: (p: Project) => void; onOpenProjectPage?: (p: Project) => void; onAddNew: () => void }) {
  return (
    <div className="db-list-view-container">
      {projects.map(p => {
        const projectTasks = tasks.filter(t => t.projectId === p.id);
        const completed = projectTasks.filter(t => t.completed).length;
        return (
          <div key={p.id} className="db-list-item-row" onClick={() => onOpenProjectPage ? onOpenProjectPage(p) : onEditProject(p)}>
            <span className="list-item-icon">{p.icon}</span>
            <div className="list-item-main">
              <strong>{p.name}</strong>
              <p>{p.domain} • {p.category} • Prazo: {p.targetDate}</p>
            </div>
            <span className="category-pill" style={{ margin: "0 8px" }}>{p.status}</span>
            <span className="lesson-count-badge">☑️ {completed}/{projectTasks.length}</span>
            <ChevronRight size={14} className="list-arrow" />
          </div>
        );
      })}
    </div>
  );
}

/* ==========================================================================
   STUDY SESSIONS (HISTORY) VIEWS (TABLE, GALLERY, BOARD, LIST)
   ========================================================================== */

function SessionsTable({ sessions, onDeleteSession }: { sessions: SessionRecord[]; onDeleteSession?: (id: string) => void }) {
  return (
    <div className="notion-db-card">
      <div className="notion-table-wrapper">
        <table className="notion-table">
          <thead>
            <tr>
              <th className="col-name"><span className="prop-type">⏱️</span> Questão Estudada</th>
              <th><span className="prop-type">◈</span> Domínio</th>
              <th><span className="prop-type">▦</span> Lesson</th>
              <th><span className="prop-type">📅</span> Data</th>
              <th><span className="prop-type">⏳</span> Duração</th>
              <th><span className="prop-type">●</span> Modo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id} className="notion-row">
                <td className="cell-title"><span className="q-icon">⏱️</span><strong>{s.questionTitle}</strong></td>
                <td><span className="domain-tag">{s.domain}</span></td>
                <td><span>{s.lesson}</span></td>
                <td><span>{s.date}</span></td>
                <td><span className="time-pill">{s.durationMinutes} min</span></td>
                <td><span className="category-pill">{s.mode === "pomodoro" ? "🍅 Pomodoro" : "⚡ Sprint"}</span></td>
                <td>
                  {onDeleteSession && (
                    <button className="icon-edit-btn" title="Excluir Sessão" style={{ color: "#ef4444" }} onClick={(e) => { e.stopPropagation(); onDeleteSession(s.id); }}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr><td colSpan={7} className="empty-subtext" style={{ textAlign: "center", padding: "20px" }}>Nenhuma sessão de estudo registrada no histórico ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SessionsGallery({ sessions, onDeleteSession }: { sessions: SessionRecord[]; onDeleteSession?: (id: string) => void }) {
  return (
    <div className="domain-gallery-layout">
      {sessions.map(s => (
        <div key={s.id} className="domain-gallery-card">
          <div className="gallery-header-cover" style={{ background: "linear-gradient(135deg, #064e3b, #0f766e)" }}>
            <span className="gallery-layer-badge">{s.mode === "pomodoro" ? "🍅 Pomodoro" : "⚡ Sprint"} • {s.durationMinutes}m</span>
          </div>
          <div className="gallery-card-content">
            <h3>{s.questionTitle}</h3>
            <small className="gallery-date">{s.date} • {s.domain} • {s.lesson}</small>
            {onDeleteSession && (
              <div style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end" }}>
                <button className="btn-delete-row" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={() => onDeleteSession(s.id)}>
                  <Trash2 size={12} /> Excluir
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
      {sessions.length === 0 && <p className="empty-subtext" style={{ padding: "24px" }}>Nenhuma sessão registrada no histórico.</p>}
    </div>
  );
}

function SessionsBoard({ sessions, groupBy = "default", onDeleteSession }: { sessions: SessionRecord[]; groupBy?: string; onDeleteSession?: (id: string) => void }) {
  const modes = ["pomodoro", "sprint"];
  const columns = modes.map(m => ({
    id: m,
    title: m === "pomodoro" ? "🍅 Pomodoro (25m)" : "⚡ Sprint (15m)",
    color: m === "pomodoro" ? "#ef4444" : "#3b82f6",
    items: sessions.filter(s => s.mode === m)
  }));

  return (
    <div className="notion-board-grid">
      {columns.map(col => (
        <div key={col.id} className="board-column">
          <div className="board-col-head"><span className="board-col-title" style={{ color: col.color }}>{col.title}</span><span className="board-col-count">{col.items.length}</span></div>
          <div className="board-cards-stack">
            {col.items.map(s => (
              <div key={s.id} className="board-card">
                <strong>{s.questionTitle}</strong>
                <p className="board-meta">{s.date} • {s.durationMinutes} min • {s.domain}</p>
                {onDeleteSession && (
                  <button className="btn-delete-row" style={{ marginTop: "8px", padding: "2px 6px", fontSize: "10.5px" }} onClick={() => onDeleteSession(s.id)}>
                    <Trash2 size={11} /> Excluir
                  </button>
                )}
              </div>
            ))}
            {col.items.length === 0 && <p className="empty-subtext" style={{ padding: "12px 0" }}>Nenhuma sessão nesta coluna.</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function SessionsList({ sessions, onDeleteSession }: { sessions: SessionRecord[]; onDeleteSession?: (id: string) => void }) {
  return (
    <div className="db-list-view-container">
      {sessions.map(s => (
        <div key={s.id} className="db-list-item-row">
          <span className="list-item-icon">{s.mode === "pomodoro" ? "🍅" : "⚡"}</span>
          <div className="list-item-main">
            <strong>{s.questionTitle}</strong>
            <p>{s.date} • {s.durationMinutes} min • {s.domain} • {s.lesson}</p>
          </div>
          <span className="category-pill" style={{ margin: "0 8px" }}>{s.mode}</span>
          {onDeleteSession && (
            <button className="icon-edit-btn" style={{ color: "#ef4444" }} onClick={() => onDeleteSession(s.id)}>
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ))}
      {sessions.length === 0 && <p className="empty-subtext" style={{ padding: "20px" }}>Nenhuma sessão registrada no histórico.</p>}
    </div>
  );
}
