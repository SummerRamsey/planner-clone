import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "p_planner_v4";

const DEFAULT_PROJECTS = [
  "Saddleside - Ponder",
  "Pistone and Downe",
  "Lonestar Phase 2",
  "Alpha Ranch",
  "Other",
];

const SECTIONS = [
  { key: "todo", label: "To do", color: "#E0E7FF" },
  { key: "inprogress", label: "In progress", color: "#FEF3C7" },
  { key: "done", label: "Done", color: "#D1FAE5" },
  { key: "other", label: "Other tasks", color: "#F3E8FF" },
];

const PRIORITIES = ["High", "Medium", "Low"];

const uid = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}_${Math.random().toString(36).slice(2)}`;

function blankProjects() {
  return DEFAULT_PROJECTS.map((name) => ({
    id: uid(),
    name,
    tasks: [],
  }));
}

/* ───────────────────── APP ───────────────────── */

export default function App() {
  const [projects, setProjects] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const p = JSON.parse(s);
        if (Array.isArray(p) && p.length) return p;
      }
    } catch {}
    return blankProjects();
  });

  const [addingTo, setAddingTo] = useState(null); // projectId currently adding to
  const [form, setForm] = useState({ title: "", priority: "Medium", due: "", section: "todo" });
  const [collapsedSections, setCollapsedSections] = useState({});
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  /* ── helpers ── */
  const collapseKey = (pId, sKey) => `${pId}__${sKey}`;
  const isCollapsed = (pId, sKey) => !!collapsedSections[collapseKey(pId, sKey)];
  const toggleCollapse = (pId, sKey) =>
    setCollapsedSections((prev) => ({
      ...prev,
      [collapseKey(pId, sKey)]: !prev[collapseKey(pId, sKey)],
    }));

  /* ── task CRUD ── */
  function openAdd(projectId) {
    setAddingTo(projectId);
    setForm({ title: "", priority: "Medium", due: "", section: "todo" });
  }

  function submitTask() {
    if (!form.title.trim() || !addingTo) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === addingTo
          ? {
              ...p,
              tasks: [
                {
                  id: uid(),
                  title: form.title.trim(),
                  priority: form.priority,
                  due: form.due.trim(),
                  section: form.section,
                  createdAt: Date.now(),
                },
                ...p.tasks,
              ],
            }
          : p
      )
    );
    setForm({ title: "", priority: "Medium", due: "", section: "todo" });
    setAddingTo(null);
  }

  function deleteTask(pId, tId) {
    setProjects((prev) =>
      prev.map((p) => (p.id === pId ? { ...p, tasks: p.tasks.filter((t) => t.id !== tId) } : p))
    );
  }

  function moveTask(pId, tId, section) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === pId
          ? { ...p, tasks: p.tasks.map((t) => (t.id === tId ? { ...t, section } : t)) }
          : p
      )
    );
  }

  function changePriority(pId, tId, priority) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === pId
          ? { ...p, tasks: p.tasks.map((t) => (t.id === tId ? { ...t, priority } : t)) }
          : p
      )
    );
  }

  /* ── export / import ── */
  function doExport() {
    const json = JSON.stringify(projects, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "planner-export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    try { navigator.clipboard.writeText(json); } catch {}
    alert("Exported! File downloaded (and JSON copied to clipboard).");
  }

  function doImport(text) {
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("Must be a JSON array.");
      setProjects(
        parsed.map((p) => ({
          id: p.id || uid(),
          name: p.name || "Untitled",
          tasks: Array.isArray(p.tasks)
            ? p.tasks.map((t) => ({
                id: t.id || uid(),
                title: t.title || "",
                priority: PRIORITIES.includes(t.priority) ? t.priority : "Medium",
                due: t.due || "",
                section: SECTIONS.some((s) => s.key === t.section) ? t.section : "todo",
                createdAt: t.createdAt || Date.now(),
              }))
            : [],
        }))
      );
      setImportOpen(false);
      setImportText("");
      alert("Import complete!");
    } catch (e) {
      alert("Import failed: " + (e.message || "Invalid JSON"));
    }
  }

  function importFile(file) {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => doImport(String(r.result));
    r.readAsText(file);
  }

  /* ───────────────── RENDER ───────────────── */
  return (
    <div style={s.page}>
      {/* Top bar */}
      <header style={s.header}>
        <h1 style={s.logo}>Planner</h1>
        <div style={s.headerBtns}>
          <button style={s.headerBtn} onClick={doExport}>Export</button>
          <button style={s.headerBtn} onClick={() => setImportOpen(true)}>Import</button>
          <button
            style={{ ...s.headerBtn, color: "#EF4444" }}
            onClick={() => {
              if (confirm("Reset everything?")) {
                setProjects(blankProjects());
                setCollapsedSections({});
              }
            }}
          >
            Reset
          </button>
        </div>
      </header>

      {/* Board */}
      <div style={s.board}>
        {projects.map((project) => (
          <div key={project.id} style={s.col}>
            {/* Column title */}
            <h2 style={s.colTitle}>{project.name}</h2>

            {/* + Add task button */}
            {addingTo !== project.id && (
              <button style={s.addTaskBtn} onClick={() => openAdd(project.id)}>
                + Add task
              </button>
            )}

            {/* Add task form (expanded) */}
            {addingTo === project.id && (
              <div style={s.formCard}>
                <input
                  autoFocus
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Task name"
                  style={s.formInput}
                  onKeyDown={(e) => e.key === "Enter" && submitTask()}
                />

                <div style={s.formRow}>
                  <label style={s.formLabel}>
                    Priority
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      style={s.formSelect}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </label>

                  <label style={s.formLabel}>
                    Due date
                    <input
                      value={form.due}
                      onChange={(e) => setForm({ ...form, due: e.target.value })}
                      placeholder="e.g. 5/22"
                      style={s.formSmallInput}
                    />
                  </label>

                  <label style={s.formLabel}>
                    Section
                    <select
                      value={form.section}
                      onChange={(e) => setForm({ ...form, section: e.target.value })}
                      style={s.formSelect}
                    >
                      {SECTIONS.map((sec) => (
                        <option key={sec.key} value={sec.key}>{sec.label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div style={s.formActions}>
                  <button style={s.formSubmit} onClick={submitTask}>Add</button>
                  <button style={s.formCancel} onClick={() => setAddingTo(null)}>Cancel</button>
                </div>
              </div>
            )}

            {/* Sections */}
            {SECTIONS.map((sec) => {
              const tasks = project.tasks
                .filter((t) => t.section === sec.key)
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
              const collapsed = isCollapsed(project.id, sec.key);
              if (tasks.length === 0 && sec.key !== "todo") return null; // hide empty non-todo sections

              return (
                <div key={sec.key} style={s.section}>
                  <button
                    style={s.sectionBtn}
                    onClick={() => toggleCollapse(project.id, sec.key)}
                  >
                    <span style={{ ...s.sectionDot, background: sec.color }} />
                    <span style={s.sectionLabel}>{sec.label}</span>
                    <span style={s.sectionCount}>{tasks.length}</span>
                    <span style={s.caret}>{collapsed ? "▸" : "▾"}</span>
                  </button>

                  {!collapsed &&
                    tasks.map((task) => (
                      <div key={task.id} style={s.card}>
                        <div style={s.cardRow1}>
                          <span style={pBadge(task.priority)}>
                            {task.priority} Priority
                          </span>
                          <button
                            style={s.xBtn}
                            onClick={() => deleteTask(project.id, task.id)}
                          >
                            ×
                          </button>
                        </div>

                        <div style={s.cardRow2}>
                          <span style={s.circle} />
                          <span style={s.taskTitle}>{task.title}</span>
                        </div>

                        <div style={s.cardRow3}>
                          {task.due && <span style={s.dueBadge}>📅 {task.due}</span>}

                          <select
                            value={task.section}
                            onChange={(e) => moveTask(project.id, task.id, e.target.value)}
                            style={s.tinySelect}
                          >
                            {SECTIONS.map((sc) => (
                              <option key={sc.key} value={sc.key}>{sc.label}</option>
                            ))}
                          </select>

                          <select
                            value={task.priority}
                            onChange={(e) => changePriority(project.id, task.id, e.target.value)}
                            style={s.tinySelect}
                          >
                            {PRIORITIES.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}

                  {!collapsed && tasks.length === 0 && (
                    <div style={s.empty}>No tasks yet</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Import modal */}
      {importOpen && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalTop}>
              <h3 style={{ margin: 0 }}>Import Data</h3>
              <button style={s.xBtn} onClick={() => { setImportOpen(false); setImportText(""); }}>×</button>
            </div>
            <p style={s.modalHint}>Upload a <b>planner-export.json</b> file or paste JSON below.</p>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              style={{ marginBottom: 12 }}
              onChange={(e) => importFile(e.target.files?.[0])}
            />
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste JSON here..."
              style={s.modalTextarea}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={s.formSubmit} onClick={() => doImport(importText)}>Import</button>
              <button style={s.formCancel} onClick={() => { setImportOpen(false); setImportText(""); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── priority badge ───────── */
function pBadge(p) {
  const m = {
    High:   { bg: "#FEE2E2", color: "#991B1B", border: "#FECACA" },
    Medium: { bg: "#DBEAFE", color: "#1E40AF", border: "#BFDBFE" },
    Low:    { bg: "#EDE9FE", color: "#5B21B6", border: "#DDD6FE" },
  };
  const c = m[p] || m.Medium;
  return {
    background: c.bg,
    color: c.color,
    border: `1px solid ${c.border}`,
    padding: "3px 10px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
  };
}

/* ───────── styles ───────── */
const s = {
  page: {
    minHeight: "100vh",
    background: "#F5F3FA",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: "#1F2937",
    padding: "20px 24px",
  },

  /* header */
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  logo: { fontSize: 24, fontWeight: 800, margin: 0, color: "#111827" },
  headerBtns: { display: "flex", gap: 8 },
  headerBtn: {
    background: "#FFF",
    border: "1px solid #E5E7EB",
    borderRadius: 8,
    padding: "7px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    color: "#374151",
  },

  /* board */
  board: {
    display: "flex",
    gap: 20,
    overflowX: "auto",
    paddingBottom: 20,
    alignItems: "flex-start",
  },

  /* column */
  col: {
    minWidth: 300,
    maxWidth: 320,
    flexShrink: 0,
  },
  colTitle: {
    fontSize: 16,
    fontWeight: 800,
    marginBottom: 12,
    color: "#111827",
  },

  /* + Add task */
  addTaskBtn: {
    width: "100%",
    background: "#FFF",
    border: "1px dashed #D1D5DB",
    borderRadius: 10,
    padding: "10px",
    fontSize: 13,
    fontWeight: 600,
    color: "#6B7280",
    cursor: "pointer",
    marginBottom: 16,
    textAlign: "left",
  },

  /* add form */
  formCard: {
    background: "#FFF",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  },
  formInput: {
    width: "100%",
    border: "1px solid #E5E7EB",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    marginBottom: 12,
    outline: "none",
    boxSizing: "border-box",
  },
  formRow: {
    display: "flex",
    gap: 10,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  formLabel: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    fontSize: 12,
    fontWeight: 600,
    color: "#6B7280",
    flex: 1,
    minWidth: 80,
  },
  formSelect: {
    border: "1px solid #E5E7EB",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    outline: "none",
    background: "#FFF",
  },
  formSmallInput: {
    border: "1px solid #E5E7EB",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    outline: "none",
  },
  formActions: { display: "flex", gap: 8 },
  formSubmit: {
    background: "#7C3AED",
    color: "#FFF",
    border: "none",
    borderRadius: 8,
    padding: "8px 18px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  formCancel: {
    background: "#F3F4F6",
    color: "#374151",
    border: "1px solid #E5E7EB",
    borderRadius: 8,
    padding: "8px 18px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },

  /* sections */
  section: {
    marginBottom: 8,
  },
  sectionBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px 0",
    width: "100%",
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    flexShrink: 0,
  },
  sectionLabel: { fontSize: 13, fontWeight: 700, color: "#374151" },
  sectionCount: {
    fontSize: 11,
    fontWeight: 700,
    color: "#6B7280",
    background: "#F3F4F6",
    borderRadius: 999,
    padding: "2px 7px",
  },
  caret: { fontSize: 12, color: "#9CA3AF", marginLeft: "auto" },

  /* cards */
  card: {
    background: "#FFF",
    border: "1px solid #F3F4F6",
    borderRadius: 12,
    padding: "12px 14px",
    marginBottom: 10,
    marginLeft: 18,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  cardRow1: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardRow2: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  circle: {
    width: 14,
    height: 14,
    borderRadius: 999,
    border: "2px solid #D1D5DB",
    flexShrink: 0,
  },
  taskTitle: { fontSize: 14, fontWeight: 600, color: "#111827" },
  cardRow3: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  dueBadge: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: 600,
  },
  tinySelect: {
    border: "1px solid #E5E7EB",
    borderRadius: 6,
    padding: "4px 8px",
    fontSize: 11,
    fontWeight: 600,
    color: "#374151",
    background: "#FAFAFA",
    cursor: "pointer",
    outline: "none",
  },
  xBtn: {
    background: "none",
    border: "none",
    fontSize: 18,
    color: "#9CA3AF",
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
  },

  empty: {
    fontSize: 12,
    color: "#9CA3AF",
    padding: "6px 0 6px 18px",
  },

  /* modal */
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 16,
  },
  modal: {
    background: "#FFF",
    borderRadius: 14,
    padding: 20,
    width: "min(600px, 95vw)",
    boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
  },
  modalTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalHint: { fontSize: 13, color: "#6B7280", marginBottom: 12 },
  modalTextarea: {
    width: "100%",
    minHeight: 160,
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    fontFamily: "monospace",
    outline: "none",
    marginBottom: 12,
    boxSizing: "border-box",
  },
};
