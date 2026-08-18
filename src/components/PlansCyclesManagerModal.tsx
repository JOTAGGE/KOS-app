import React, { useState } from "react";
import {
  X, Target, RotateCw, Plus, Edit3, Trash2, Check,
  Sparkles, Layers, BookOpen, AlertCircle, Save
} from "lucide-react";
import type { StudyPlan, StudyCycle, Lesson } from "../types";

export function PlansCyclesManagerModal({
  isOpen,
  onClose,
  plans,
  cycles,
  lessons,
  onSavePlan,
  onDeletePlan,
  onSaveCycle,
  onDeleteCycle,
}: {
  isOpen: boolean;
  onClose: () => void;
  plans: StudyPlan[];
  cycles: StudyCycle[];
  lessons: Lesson[];
  onSavePlan: (plan: Omit<StudyPlan, "id"> & { id?: string }) => void;
  onDeletePlan: (planId: string) => void;
  onSaveCycle: (cycle: Omit<StudyCycle, "id"> & { id?: string }) => void;
  onDeleteCycle: (cycleId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"plans" | "cycles">("plans");

  // Plan Form State (Create / Edit)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState("");
  const [planDesc, setPlanDesc] = useState("");
  const [planColor, setPlanColor] = useState("#2563eb");

  // Cycle Form State (Create / Edit)
  const [editingCycleId, setEditingCycleId] = useState<string | null>(null);
  const [cycleName, setCycleName] = useState("");
  const [cycleDesc, setCycleDesc] = useState("");
  const [cycleColor, setCycleColor] = useState("#a855f7");

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  // PLAN HANDLERS
  const handleStartEditPlan = (p: StudyPlan) => {
    setEditingPlanId(p.id);
    setPlanName(p.name);
    setPlanDesc(p.description || "");
    setPlanColor(p.color || "#2563eb");
    setConfirmDeleteId(null);
  };

  const handleCancelPlanEdit = () => {
    setEditingPlanId(null);
    setPlanName("");
    setPlanDesc("");
    setPlanColor("#2563eb");
  };

  const handleSavePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;

    onSavePlan({
      ...(editingPlanId ? { id: editingPlanId } : {}),
      name: planName.trim(),
      description: planDesc.trim(),
      color: planColor,
    });

    handleCancelPlanEdit();
  };

  // CYCLE HANDLERS
  const handleStartEditCycle = (c: StudyCycle) => {
    setEditingCycleId(c.id);
    setCycleName(c.name);
    setCycleDesc(c.description || "");
    setCycleColor(c.color || "#a855f7");
    setConfirmDeleteId(null);
  };

  const handleCancelCycleEdit = () => {
    setEditingCycleId(null);
    setCycleName("");
    setCycleDesc("");
    setCycleColor("#a855f7");
  };

  const handleSaveCycleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleName.trim()) return;

    onSaveCycle({
      ...(editingCycleId ? { id: editingCycleId } : {}),
      name: cycleName.trim(),
      description: cycleDesc.trim(),
      color: cycleColor,
    });

    handleCancelCycleEdit();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-plans-cycles-crud" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="crud-header-icon">
              {activeTab === "plans" ? <Target size={20} /> : <RotateCw size={20} />}
            </div>
            <div>
              <h2>Gerenciar Planos & Ciclos de Estudo</h2>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--text-dim)" }}>
                Crie, edite e organize seus filtros personalizados para o Crono
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Tab Switcher */}
        <div className="crud-tabs-segmented">
          <button
            type="button"
            className={activeTab === "plans" ? "active" : ""}
            onClick={() => { setActiveTab("plans"); handleCancelPlanEdit(); handleCancelCycleEdit(); }}
          >
            <Target size={14} />
            <span>🎯 Planos de Estudo ({plans.length})</span>
          </button>
          <button
            type="button"
            className={activeTab === "cycles" ? "active" : ""}
            onClick={() => { setActiveTab("cycles"); handleCancelPlanEdit(); handleCancelCycleEdit(); }}
          >
            <RotateCw size={14} />
            <span>🔄 Ciclos de Estudo ({cycles.length})</span>
          </button>
        </div>

        <div className="modal-body-scrollable">
          {activeTab === "plans" ? (
            /* ==========================================
               PLANS TAB
               ========================================== */
            <div className="crud-section-wrapper">
              {/* Form to Add / Edit Plan */}
              <form onSubmit={handleSavePlanSubmit} className="crud-inline-form">
                <div className="crud-form-header">
                  <span>{editingPlanId ? "✏️ Editar Plano" : "➕ Novo Plano de Estudos"}</span>
                </div>
                <div className="crud-form-grid">
                  <div className="form-group">
                    <label>Nome do Plano *</label>
                    <input
                      type="text"
                      placeholder="Ex: Concurso PF, Residência Médica, OAB..."
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label>Descrição / Meta</label>
                    <input
                      type="text"
                      placeholder="Ex: Foco edital 2026, 4h diárias"
                      value={planDesc}
                      onChange={(e) => setPlanDesc(e.target.value)}
                    />
                  </div>
                </div>

                <div className="crud-form-actions-row">
                  {editingPlanId && (
                    <button type="button" className="btn-cancel-mini" onClick={handleCancelPlanEdit}>
                      Cancelar Edição
                    </button>
                  )}
                  <button type="submit" className="btn-save-mini" disabled={!planName.trim()}>
                    <Save size={13} />
                    <span>{editingPlanId ? "Atualizar Plano" : "Salvar Novo Plano"}</span>
                  </button>
                </div>
              </form>

              {/* Plans List */}
              <div className="crud-items-list-header">
                <span>Planos Cadastrados</span>
                <span className="count-badge">{plans.length} total</span>
              </div>

              {plans.length === 0 ? (
                <div className="crud-empty-list">
                  <Target size={28} style={{ opacity: 0.4, marginBottom: "8px" }} />
                  <p>Nenhum plano de estudos cadastrado ainda.</p>
                  <small>Crie seu primeiro plano acima (ex: <em>Concurso PF</em>) para filtrar sua rotina.</small>
                </div>
              ) : (
                <div className="crud-items-grid">
                  {plans.map((p) => {
                    const linkedCount = lessons.filter(l => (l.plan || "").toLowerCase() === p.name.toLowerCase()).length;
                    const isDeleting = confirmDeleteId === p.id;

                    return (
                      <div key={p.id} className={`crud-item-card ${editingPlanId === p.id ? "is-editing" : ""}`}>
                        <div className="crud-item-main">
                          <div className="crud-item-title-row">
                            <span className="crud-item-badge plan-badge">🎯 {p.name}</span>
                            <span className="crud-linked-count">
                              <BookOpen size={11} /> {linkedCount} {linkedCount === 1 ? "lição vinculada" : "lições vinculadas"}
                            </span>
                          </div>
                          {p.description && <p className="crud-item-desc">{p.description}</p>}
                        </div>

                        <div className="crud-item-actions">
                          {isDeleting ? (
                            <div className="delete-confirm-box">
                              <span style={{ fontSize: "11px", color: "#fca5a5" }}>Excluir?</span>
                              <button
                                type="button"
                                className="btn-confirm-delete"
                                onClick={() => { onDeletePlan(p.id); setConfirmDeleteId(null); }}
                              >
                                Sim
                              </button>
                              <button
                                type="button"
                                className="btn-cancel-delete"
                                onClick={() => setConfirmDeleteId(null)}
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn-crud-action"
                                onClick={() => handleStartEditPlan(p)}
                                title="Editar nome e descrição"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                className="btn-crud-action delete"
                                onClick={() => setConfirmDeleteId(p.id)}
                                title="Excluir este plano"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ==========================================
               CYCLES TAB
               ========================================== */
            <div className="crud-section-wrapper">
              {/* Form to Add / Edit Cycle */}
              <form onSubmit={handleSaveCycleSubmit} className="crud-inline-form">
                <div className="crud-form-header">
                  <span>{editingCycleId ? "✏️ Editar Ciclo" : "➕ Novo Ciclo de Estudo"}</span>
                </div>
                <div className="crud-form-grid">
                  <div className="form-group">
                    <label>Nome do Ciclo *</label>
                    <input
                      type="text"
                      placeholder="Ex: Ciclo 1, Ciclo Básico, Reta Final..."
                      value={cycleName}
                      onChange={(e) => setCycleName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label>Descrição / Foco</label>
                    <input
                      type="text"
                      placeholder="Ex: Teoria inicial e resolução de questões"
                      value={cycleDesc}
                      onChange={(e) => setCycleDesc(e.target.value)}
                    />
                  </div>
                </div>

                <div className="crud-form-actions-row">
                  {editingCycleId && (
                    <button type="button" className="btn-cancel-mini" onClick={handleCancelCycleEdit}>
                      Cancelar Edição
                    </button>
                  )}
                  <button type="submit" className="btn-save-mini" disabled={!cycleName.trim()}>
                    <Save size={13} />
                    <span>{editingCycleId ? "Atualizar Ciclo" : "Salvar Novo Ciclo"}</span>
                  </button>
                </div>
              </form>

              {/* Cycles List */}
              <div className="crud-items-list-header">
                <span>Ciclos Cadastrados</span>
                <span className="count-badge">{cycles.length} total</span>
              </div>

              {cycles.length === 0 ? (
                <div className="crud-empty-list">
                  <RotateCw size={28} style={{ opacity: 0.4, marginBottom: "8px" }} />
                  <p>Nenhum ciclo de estudos cadastrado ainda.</p>
                  <small>Crie seu primeiro ciclo acima (ex: <em>Ciclo 1</em>) para organizar as rodadas de estudo.</small>
                </div>
              ) : (
                <div className="crud-items-grid">
                  {cycles.map((c) => {
                    const linkedCount = lessons.filter(l => (l.cycle || "").toLowerCase() === c.name.toLowerCase()).length;
                    const isDeleting = confirmDeleteId === c.id;

                    return (
                      <div key={c.id} className={`crud-item-card ${editingCycleId === c.id ? "is-editing" : ""}`}>
                        <div className="crud-item-main">
                          <div className="crud-item-title-row">
                            <span className="crud-item-badge cycle-badge">🔄 {c.name}</span>
                            <span className="crud-linked-count">
                              <BookOpen size={11} /> {linkedCount} {linkedCount === 1 ? "lição vinculada" : "lições vinculadas"}
                            </span>
                          </div>
                          {c.description && <p className="crud-item-desc">{c.description}</p>}
                        </div>

                        <div className="crud-item-actions">
                          {isDeleting ? (
                            <div className="delete-confirm-box">
                              <span style={{ fontSize: "11px", color: "#fca5a5" }}>Excluir?</span>
                              <button
                                type="button"
                                className="btn-confirm-delete"
                                onClick={() => { onDeleteCycle(c.id); setConfirmDeleteId(null); }}
                              >
                                Sim
                              </button>
                              <button
                                type="button"
                                className="btn-cancel-delete"
                                onClick={() => setConfirmDeleteId(null)}
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn-crud-action"
                                onClick={() => handleStartEditCycle(c)}
                                title="Editar nome e descrição"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                className="btn-crud-action delete"
                                onClick={() => setConfirmDeleteId(c.id)}
                                title="Excluir este ciclo"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ borderTop: "1px solid var(--line)", padding: "14px 20px" }}>
          <button type="button" className="btn-modal-secondary" onClick={onClose} style={{ marginLeft: "auto" }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
