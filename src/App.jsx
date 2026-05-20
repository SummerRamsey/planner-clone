import { useEffect, useMemo, useRef, useState } from "react";

/**
 * One vertical column per PROJECT.
 * Inside each project: sections (To do / In progress / Done / Other tasks)
 * Inline add row (no prompts) + Export/Import (JSON) for phone/computer sync.
 */

const STORAGE_KEY = "p_projects_v3";

const DEFAULT_PROJECTS = [
  "Saddleside - Ponder",
  "Pistone and Downe - Northl...",
  "Lonestar Phase 2",
  "Alpha Ranch",
  "Other",
];

const SECTIONS = [
  { key: "todo", label: "To do" },
  { key: "inprogress", label: "In progress" },
  { key: "done", label: "Done" },
  { key: "other", label: "Other tasks" },
];

const PRIORITIES = ["High", "Medium", "Low"];

const uid = () =>
  (globalThis.crypto?.randomUUID?.() ??
    `id_${Date.now()}_${Math.random().toString(16).slice(2)}`);

function makeBlankProjects() {
  return DEFAULT_PROJECTS.map((name) => ({
    id: uid(),
    name,
    tasks: [], // { id, title, priority, due, section, createdAt }
    collapsed: { done: true }, // collapse Done by default
  }));
}

export default function App() {
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // ignore
      }
    }
    return makeBlankProjects();
  });

  // Inline add form state per project+section
  const [drafts, setDrafts] = useState(() => {
    // { [projectId]: { [sectionKey]: { title, due, priority } } }
    const init = {};
    return init;
  });

  // Import modal
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const sectionCounts = useMemo(() => {
    const map = {};
    for (const p of projects) {
      map[p.id] = { todo: 0, inprogress: 0, done: 0, other: 0 };
      for (const t of p.tasks) map[p.id][t.section] = (map[p.id][t.section] || 0) + 1;
    }
    return map;
  }, [projects]);

  function updateDraft(projectId, sectionKey, patch) {
    setDrafts((prev) => {
      const next = { ...prev };
      const p = next[projectId] ? { ...next[projectId] } : {};
      const s = p[sectionKey]
        ? { title: "", due: "", priority: "Medium", ...p[sectionKey] }
        : { title: "", due: "", priority: "Medium" };
      p[sectionKey] = { ...s, ...patch };
      next[projectId] = p;
      return next;
    });
  }

  function getDraft(projectId, sectionKey) {
    return (
      drafts?.[projectId]?.[sectionKey] ?? { title: "", due: "", priority: "Medium" }
    );
  }

  function addTaskInline(projectId, sectionKey) {
    const d = getDraft(projectId, sectionKey);
    const title = (d.title || "").trim();
    if (!title) return;

    const newTask = {
      id: uid(),
      title,
      priority: PRIORITIES.includes(d.priority) ? d.priority : "Medium",
      due: (d.due || "").trim(),
      section: sectionKey,
      createdAt: Date.now(),
    };

    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, tasks: [newTask, ...p.tasks] } : p))
    );

    // Clear just the title (keep priority & due for fast entry)
    updateDraft(projectId, sectionKey, { title: "" });
  }

  function deleteTask(projectId, taskId) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p
      )
    );
  }

  function toggleDoneCollapse(projectId) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const current = !!p.collapsed?.done;
        return { ...p, collapsed: { ...(p.collapsed || {}), done: !current } };
      })
    );
  }

  function moveTask(projectId, taskId, nextSection) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, section: nextSection } : t)) };
      })
    );
  }

  function setPriority(projectId, taskId, nextPriority) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, priority: nextPriority } : t)) };
      })
    );
  }

  function setDue(projectId, taskId, nextDue) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, due: nextDue } : t)) };
      })
    );
  }

  function resetAll() {
    const ok = confirm("Reset all projects and tasks? This cannot be undone.");
    if (!ok) return;
    setProjects(makeBlankProjects());
    setDrafts({});
  }

  // --- Export / Import (sync between devices) ---
  async function exportData() {
    const payload = JSON.stringify(projects, null, 2);

    // Download file
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "planner-export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    // Copy to clipboard (optional convenience)
    try {
      await navigator.clipboard.writeText(payload);
      alert("Exported! Downloaded planner-export.json and copied JSON to clipboard.");
    } catch {
      alert("Exported! Downloaded planner-export.json.");
    }
  }

  function openImport() {
    setImportText("");
    setImportOpen(true);
  }

  function closeImport() {
    setImportOpen(false);
    setImportText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function applyImportedJson(text) {
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("Import must be a JSON array of projects.");
      // Minimal validation
      const sanitized = parsed.map((p) => ({
        id: p.id || uid(),
        name: p.name || "Untitled",
        tasks: Array.isArray(p.tasks) ? p.tasks.map((t) => ({
          id: t.id || uid(),
          title: t.title || "",
          priority: PRIORITIES.includes(t.priority) ? t.priority : "Medium",
          due: t.due || "",
          section: SECTIONS.some((s) => s.key === t.section) ? t.section : "todo",
          createdAt: typeof t.createdAt === "number" ? t.createdAt : Date.now(),
        })) : [],
        collapsed: p.collapsed && typeof p.collapsed === "object" ? p.collapsed : { done: true },
      }));
      setProjects(sanitized);
      setDrafts({});
      closeImport();
      alert("Import complete!");
    } catch (e) {
      alert(`Import failed: ${e.message || "Invalid JSON"}`);
    }
  }

  function importFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      applyImportedJson(text);
    };
    reader.readAsText(file);
  }

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div>
          <div style={styles.title}>Planner</div>
          <div style={styles.subtitle}>
            Projects in columns · Sections inside each project · Export/Import for syncing
          </div>
        </div>

        <div style={styles.topbarActions}>
          <button onClick={exportData} style={styles.actionBtn} type="button">
            Export
          </button>
          <button onClick={openImport} style={styles.actionBtn} type="button">
            Import
          </button>
          <button onClick={resetAll} style={styles.resetBtn} type="button">
            Reset
          </button>
        </div>
      </div>

      <div style={styles.board}>
        {projects.map((project) => {
          const counts = sectionCounts[project.id] || {};
          const doneCollapsed = !!project.collapsed?.done;

          return (
            <div key={project.id} style={styles.column}>
              <div style={styles.columnHeader}>
                <div style={styles.columnTitle} title={project.name}>
                  {project.name}
                </div>
              </div>

              {SECTIONS.map((sec) => {
                const tasksInSection = project.tasks
                  .filter((t) => t.section === sec.key)
                  .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

                const isDone = sec.key === "done";
                const isCollapsed = isDone && doneCollapsed;
                const d = getDraft(project.id, sec.key);

                return (
                  <div key={sec.key} style={styles.sectionWrap}>
                    <div style={styles.sectionHeader}>
                      <button
                        type="button"
                        onClick={() => isDone && toggleDoneCollapse(project.id)}
                        style={{
                          ...styles.sectionTitleBtn,
                          cursor: isDone ? "pointer" : "default",
                        }}
                        aria-label={isDone ? "Toggle Done" : undefined}
                      >
                        <span style={styles.sectionTitle}>{sec.label}</span>
                        <span style={styles.sectionCount}>{counts[sec.key] || 0}</span>
                        {isDone && <span style={styles.caret}>{isCollapsed ? "▸" : "▾"}</span>}
                      </button>
                    </div>

                    {/* Inline add row */}
                    {!isCollapsed && (
                      <div style={styles.addRow}>
                        <input
                          value={d.title}
                          onChange={(e) => updateDraft(project.id, sec.key, { title: e.target.value })}
                          placeholder="Add a task..."
                          style={styles.input}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") addTaskInline(project.id, sec.key);
                          }}
                        />

                        <input
                          value={d.due}
                          onChange={(e) => updateDraft(project.id, sec.key, { due: e.target.value })}
                          placeholder="Due (e.g., 5/22)"
                          style={styles.smallInput}
                        />

                        <select
                          value={d.priority}
                          onChange={(e) => updateDraft(project.id, sec.key, { priority: e.target.value })}
                          style={styles.select}
                          aria-label="Priority"
                        >
                          {PRIORITIES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          style={styles.addBtn}
                          onClick={() => addTaskInline(project.id, sec.key)}
                        >
                          Add
                        </button>
                      </div>
                    )}

                    {!isCollapsed && (
                      <div style={styles.cardsArea}>
                        {tasksInSection.length === 0 ? (
                          <div style={styles.emptyHint}>No tasks</div>
                        ) : (
                          tasksInSection.map((task) => (
                            <div key={task.id} style={styles.card}>
                              <div style={styles.cardTopRow}>
                                <span style={priorityBadge(task.priority)}>{task.priority} Priority</span>

                                <button
                                  onClick={() => deleteTask(project.id, task.id)}
                                  style={styles.deleteBtn}
                                  title="Delete task"
                                  type="button"
                                >
                                  ×
                                </button>
                              </div>

                              <div style={styles.cardMainRow}>
                                <span style={styles.circle} aria-hidden="true" />
                                <span style={styles.cardTitle}>{task.title}</span>
                              </div>

                              <div style={styles.cardFooter}>
                                <button
                                  type="button"
                                  style={styles.metaBtn}
                                  onClick={() => {
                                    const next = prompt("Due date (e.g., 5/22) or blank:", task.due || "") ?? task.due;
                                    setDue(project.id, task.id, String(next).trim());
                                  }}
                                  title="Set due date"
                                >
                                  {task.due ? `Due ${task.due}` : "Add due date"}
                                </button>

                                <select
                                  value={task.section}
                                  onChange={(e) => moveTask(project.id, task.id, e.target.value)}
                                  style={styles.select}
                                  title="Move to section"
                                >
                                  {SECTIONS.map((s) => (
                                    <option key={s.key} value={s.key}>
                                      {s.label}
                                    </option>
                                  ))}
                                </select>

                                <select
                                  value={task.priority}
                                  onChange={(e) => setPriority(project.id, task.id, e.target.value)}
                                  style={styles.select}
                                  title="Change priority"
                                >
                                  {PRIORITIES.map((p) => (
                                    <option key={p} value={p}>
                                      {p}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Import modal */}
      {importOpen && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true">
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>Import Planner Data</div>
              <button style={styles.modalClose} onClick={closeImport} type="button">
                ×
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.modalHint}>
                Choose a <b>planner-export.json</b> file or paste JSON below. Import will <b>replace</b> current data on this device.
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={(e) => importFromFile(e.target.files?.[0])}
                style={styles.fileInput}
              />

              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste exported JSON here…"
                style={styles.textarea}
              />

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.actionBtn}
                  onClick={() => applyImportedJson(importText)}
                >
                  Import pasted JSON
                </button>
                <button type="button" style={styles.resetBtn} onClick={closeImport}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={styles.footerNote}>
        Export on one device → Import on the other to sync. (No cupcake, no comments — clean + cute.)
      </div>
    </div>
  );
}

function priorityBadge(priority) {
  const map = {
    High: { bg: "#FDE2E7", text: "#8A1F2E", border: "#F7B7C3" },
    Medium: { bg: "#DFF3FF", text: "#0B4F6C", border: "#A8DBF6" },
    Low: { bg: "#EEE7FF", text: "#4B2E83", border: "#D1C2FF" },
  };
  const c = map[priority] || map.Medium;
  return {
    background: c.bg,
    color: c.text,
    border: `1px solid ${c.border}`,
    padding: "4px 8px",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    whiteSpace: "nowrap",
  };
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #F6F4FB 0%, #F3F6FA 60%, #F6F4FB 100%)",
    padding: 18,
    color: "#1F2937",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  topbarActions: { display: "flex", gap: 8, alignItems: "center" },
  title: { fontSize: 22, fontWeight: 800, letterSpacing: "-0.2px" },
  subtitle: { fontSize: 13, color: "#6B7280", marginTop: 4 },

  actionBtn: {
    border: "1px solid #E5E7EB",
    background: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 700,
  },
  resetBtn: {
    border: "1px solid #E5E7EB",
    background: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 700,
  },

  board: {
    display: "flex",
    gap: 16,
    overflowX: "auto",
    paddingBottom: 10,
  },

  column: {
    minWidth: 340,
    maxWidth: 380,
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(229,231,235,0.95)",
    borderRadius: 18,
    padding: 14,
    boxShadow: "0 8px 22px rgba(31,41,55,0.06)",
    backdropFilter: "blur(6px)",
  },
  columnHeader: { display: "flex", alignItems: "center", marginBottom: 10 },
  columnTitle: {
    fontWeight: 800,
    fontSize: 15,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    paddingRight: 8,
  },

  sectionWrap: {
    borderTop: "1px dashed rgba(229,231,235,0.9)",
    paddingTop: 10,
    marginTop: 10,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  sectionTitleBtn: {
    border: "none",
    background: "transparent",
    padding: 0,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: { fontSize: 13, fontWeight: 900, color: "#374151" },
  sectionCount: {
    fontSize: 12,
    fontWeight: 900,
    color: "#6B7280",
    background: "#F3F4F6",
    border: "1px solid #E5E7EB",
    borderRadius: 999,
    padding: "2px 8px",
  },
  caret: { fontSize: 13, color: "#6B7280", marginLeft: 2 },

  addRow: {
    display: "grid",
    gridTemplateColumns: "1fr 110px 110px 72px",
    gap: 8,
    marginBottom: 10,
  },
  input: {
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    borderRadius: 12,
    padding: "10px 10px",
    fontSize: 13,
    outline: "none",
  },
  smallInput: {
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    borderRadius: 12,
    padding: "10px 10px",
    fontSize: 13,
    outline: "none",
  },
  select: {
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    borderRadius: 12,
    padding: "10px 10px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    color: "#374151",
    outline: "none",
  },
  addBtn: {
    border: "1px solid #D1D5DB",
    background: "#F9FAFB",
    borderRadius: 12,
    padding: "10px 10px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 900,
    color: "#374151",
  },

  cardsArea: { display: "flex", flexDirection: "column", gap: 10 },
  emptyHint: { fontSize: 12, color: "#9CA3AF", padding: "6px 2px 2px" },

  card: {
    background: "#FFFFFF",
    border: "1px solid rgba(229,231,235,0.98)",
    borderRadius: 14,
    padding: 12,
    boxShadow: "0 6px 16px rgba(31,41,55,0.06)",
  },
  cardTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  deleteBtn: {
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    borderRadius: 10,
    width: 28,
    height: 28,
    cursor: "pointer",
    fontSize: 18,
    lineHeight: "26px",
    color: "#6B7280",
  },
  cardMainRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  circle: {
    width: 14,
    height: 14,
    borderRadius: 999,
    border: "2px solid #9CA3AF",
    display: "inline-block",
    flex: "0 0 auto",
  },
  cardTitle: { fontSize: 14, fontWeight: 700, color: "#111827", lineHeight: 1.2 },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  metaBtn: {
    border: "1px solid #E5E7EB",
    background: "#F9FAFB",
    borderRadius: 12,
    padding: "8px 10px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800,
    color: "#374151",
  },

  footerNote: { marginTop: 14, fontSize: 12, color: "#6B7280" },

  // Modal styles
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(17, 24, 39, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 50,
  },
  modal: {
    width: "min(720px, 96vw)",
    background: "#FFFFFF",
    borderRadius: 18,
    border: "1px solid #E5E7EB",
    boxShadow: "0 18px 60px rgba(0,0,0,0.22)",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 14px",
    borderBottom: "1px solid #E5E7EB",
    background: "#FAFAFB",
  },
  modalTitle: { fontWeight: 900, color: "#111827" },
  modalClose: {
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    borderRadius: 10,
    width: 34,
    height: 34,
    cursor: "pointer",
    fontSize: 20,
    color: "#6B7280",
  },
  modalBody: { padding: 14 },
  modalHint: { fontSize: 13, color: "#4B5563", marginBottom: 10 },
  fileInput: { marginBottom: 10, width: "100%" },
  textarea: {
    width: "100%",
    minHeight: 200,
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 10,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 12,
    outline: "none",
    marginBottom: 10,
  },
  modalActions: { display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" },
};
