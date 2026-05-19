import React, { useEffect, useMemo, useState } from "react";

/** ---------------------------
 *  Helpers
 *  --------------------------*/
const uid = () => Math.random().toString(36).slice(2, 10);

const safeParse = (s, fallback) => {
  try {
    const v = JSON.parse(s);
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

const encodeSync = (obj) => {
  const json = JSON.stringify(obj);
  return btoa(unescape(encodeURIComponent(json)));
};

const decodeSync = (code) => {
  const json = decodeURIComponent(escape(atob(code.trim())));
  return JSON.parse(json);
};

const yyyyMmDd = (d) => {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const addMonths = (date, delta) => new Date(date.getFullYear(), date.getMonth() + delta, 1);

const getCalendarGrid = (monthDate) => {
  // 6 weeks x 7 days
  const first = startOfMonth(monthDate);
  const startDayIndex = first.getDay(); // 0=Sun..6=Sat
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startDayIndex);

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push({
      date: d,
      inMonth: d.getMonth() === monthDate.getMonth(),
      isToday: yyyyMmDd(d) === yyyyMmDd(new Date()),
    });
  }
  return { cells };
};

/** ---------------------------
 *  Defaults
 *  --------------------------*/
const COLUMNS = ["To Do", "In Progress", "Review", "Done"];

const DEFAULT_BUCKETS = [
  { id: "saddleside", name: "Saddleside" },
  { id: "legacy", name: "Legacy Fields" },
  { id: "lonestar", name: "Lonestar" },
  { id: "alpha", name: "Alpha Ranch" },
  { id: "willow", name: "Willowstone" },
  { id: "other", name: "Other" },
];

// Girly pastel priorities (task color system)
const PRIORITY_ORDER = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
const PRIORITY_EMOJI = { Urgent: "💗", High: "❤️", Medium: "💜", Low: "💚" };
const PRIORITY_COLORS = {
  Urgent: "#F7C2D4", // pastel pink
  High: "#F3B3B3",   // pastel red
  Medium: "#DCC8F7", // pastel purple
  Low: "#C8F0D7",    // pastel green
};

// Cute labels (optional)
const LABELS = [
  { name: "Important", color: "#F3B3B3" },
  { name: "Call", color: "#F7C2D4" },
  { name: "Docs", color: "#DCC8F7" },
  { name: "Follow-up", color: "#C8F0D7" },
  { name: "Meeting", color: "#F6D7A9" },
  { name: "Personal", color: "#BEE9F7" },
];

// Bucket dot colors (soft, Pinterest-like)
const BUCKET_DOTS = {
  saddleside: "#BFD7F2",
  legacy: "#BFEAD2",
  lonestar: "#F6D7C3",
  alpha: "#DCC8F7",
  willow: "#BEE9F7",
  other: "#D6DCE6",
};

/** ---------------------------
 *  App
 *  --------------------------*/
export default function App() {
  // Views: "board" | "month"
  const [view, setView] = useState(() => localStorage.getItem("p_view") || "board");

  // Data
  const [buckets, setBuckets] = useState(() =>
    safeParse(localStorage.getItem("p_buckets"), DEFAULT_BUCKETS)
  );
  const [currentBucketId, setCurrentBucketId] = useState(() =>
    localStorage.getItem("p_currentBucket") || DEFAULT_BUCKETS[0].id
  );
  const [tasks, setTasks] = useState(() => safeParse(localStorage.getItem("p_tasks"), []));

  // UI
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");
  const [sortBy, setSortBy] = useState("none"); // none|priority|dueDate|name
  const [viewingTaskId, setViewingTaskId] = useState(null);
  const [dragTaskId, setDragTaskId] = useState(null);

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);

  const [showBucketModal, setShowBucketModal] = useState(false);
  const [bucketFormName, setBucketFormName] = useState("");
  const [editingBucketId, setEditingBucketId] = useState(null);

  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncExportCode, setSyncExportCode] = useState("");
  const [syncImportCode, setSyncImportCode] = useState("");
  const [syncMessage, setSyncMessage] = useState("");

  // Calendar
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => yyyyMmDd(new Date()));

  // Task form
  const [form, setForm] = useState({
    title: "",
    notes: "",
    priority: "Medium",
    startDate: "",
    dueDate: "",
    column: "To Do",
    labels: [],
    checklist: [],
    assignee: "",
    pinned: false,
    comments: [],
  });

  /** ---------------------------
   *  Persist
   *  --------------------------*/
  useEffect(() => localStorage.setItem("p_view", view), [view]);
  useEffect(() => localStorage.setItem("p_buckets", JSON.stringify(buckets)), [buckets]);
  useEffect(() => localStorage.setItem("p_currentBucket", currentBucketId), [currentBucketId]);
  useEffect(() => localStorage.setItem("p_tasks", JSON.stringify(tasks)), [tasks]);

  /** ---------------------------
   *  Derived
   *  --------------------------*/
  const currentBucket = useMemo(
    () => buckets.find((b) => b.id === currentBucketId) || buckets[0],
    [buckets, currentBucketId]
  );

  const bucketTasks = useMemo(
    () => tasks.filter((t) => t.bucketId === currentBucketId),
    [tasks, currentBucketId]
  );

  const isOverdue = (t) => {
    if (!t.dueDate || t.column === "Done") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const isDueToday = (t) => t.dueDate && yyyyMmDd(t.dueDate) === yyyyMmDd(new Date()) && t.column !== "Done";

  const isDueSoon = (t) => {
    if (!t.dueDate || t.column === "Done") return false;
    if (isOverdue(t) || isDueToday(t)) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = (due - today) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 3;
  };

  const getProgress = (t) => {
    if (!t.checklist?.length) return null;
    const done = t.checklist.filter((c) => c.done).length;
    return Math.round((done / t.checklist.length) * 100);
  };

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bucketTasks.filter((t) => {
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.notes || "").toLowerCase().includes(q) ||
        (t.assignee || "").toLowerCase().includes(q);

      const matchesPriority = filterPriority === "All" || t.priority === filterPriority;
      return matchesSearch && matchesPriority;
    });
  }, [bucketTasks, searchQuery, filterPriority]);

  const sortTasks = (list) => {
    const pinned = list.filter((t) => t.pinned);
    const rest = list.filter((t) => !t.pinned);

    if (sortBy === "priority") {
      rest.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2));
    } else if (sortBy === "dueDate") {
      rest.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    } else if (sortBy === "name") {
      rest.sort((a, b) => a.title.localeCompare(b.title));
    }
    return [...pinned, ...rest];
  };

  /** ---------------------------
   *  Sync
   *  --------------------------*/
  const openSync = () => {
    const payload = {
      v: 1,
      exportedAt: new Date().toISOString(),
      buckets,
      currentBucketId,
      tasks,
    };
    setSyncExportCode(encodeSync(payload));
    setSyncImportCode("");
    setSyncMessage("");
    setShowSyncModal(true);
  };

  const copySyncCode = async () => {
    try {
      await navigator.clipboard.writeText(syncExportCode);
      setSyncMessage("✅ Copied! Paste it on your phone to import.");
    } catch {
      setSyncMessage("⚠️ Tap the code → Select All → Copy (manual).");
    }
  };

  const importSync = () => {
    if (!syncImportCode.trim()) {
      setSyncMessage("⚠️ Paste a code first.");
      return;
    }
    try {
      const data = decodeSync(syncImportCode);
      if (Array.isArray(data.tasks)) setTasks(data.tasks);
      if (Array.isArray(data.buckets)) setBuckets(data.buckets);
      if (data.currentBucketId) setCurrentBucketId(data.currentBucketId);

      setSyncMessage("✅ Imported! This device is updated.");
      setTimeout(() => {
        setShowSyncModal(false);
        setSyncMessage("");
      }, 1200);
    } catch {
      setSyncMessage("❌ Invalid code. Make sure you copied the FULL code.");
    }
  };

  /** ---------------------------
   *  Bucket CRUD
   *  --------------------------*/
  const openBucketEditor = (b) => {
    if (b) {
      setEditingBucketId(b.id);
      setBucketFormName(b.name);
    } else {
      setEditingBucketId(null);
      setBucketFormName("");
    }
    setShowBucketModal(true);
  };

  const saveBucket = () => {
    const name = bucketFormName.trim();
    if (!name) return;

    if (editingBucketId) {
      setBuckets((prev) => prev.map((b) => (b.id === editingBucketId ? { ...b, name } : b)));
    } else {
      const id = uid();
      setBuckets((prev) => [...prev, { id, name }]);
      setCurrentBucketId(id);
    }
    setShowBucketModal(false);
  };

  const deleteBucket = (bid) => {
    if (buckets.length <= 1) return alert("You need at least one bucket.");
    if (!confirm("Delete this bucket and all its tasks?")) return;

    const remaining = buckets.filter((b) => b.id !== bid);
    setBuckets(remaining);
    setTasks((prev) => prev.filter((t) => t.bucketId !== bid));
    if (currentBucketId === bid) setCurrentBucketId(remaining[0].id);
  };

  /** ---------------------------
   *  Task CRUD
   *  --------------------------*/
  const openNewTask = (column = "To Do") => {
    setForm({
      title: "",
      notes: "",
      priority: "Medium",
      startDate: "",
      dueDate: "",
      column,
      labels: [],
      checklist: [],
      assignee: "",
      pinned: false,
      comments: [],
    });
    setEditingTaskId(null);
    setShowTaskModal(true);
  };

  const openEditTask = (t) => {
    setForm({
      title: t.title,
      notes: t.notes || "",
      priority: t.priority,
      startDate: t.startDate || "",
      dueDate: t.dueDate || "",
      column: t.column,
      labels: t.labels || [],
      checklist: t.checklist || [],
      assignee: t.assignee || "",
      pinned: !!t.pinned,
      comments: t.comments || [],
    });
    setEditingTaskId(t.id);
    setShowTaskModal(true);
  };

  const upsertTask = () => {
    if (!form.title.trim()) return alert("Please enter a task title.");

    if (editingTaskId) {
      setTasks((prev) =>
        prev.map((t) => (t.id === editingTaskId ? { ...t, ...form } : t))
      );
    } else {
      setTasks((prev) => [
        ...prev,
        { id: uid(), createdAt: new Date().toISOString(), bucketId: currentBucketId, ...form },
      ]);
    }
    setShowTaskModal(false);
    setEditingTaskId(null);
  };

  const removeTask = (id) => {
    if (!confirm("Delete this task?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setViewingTaskId(null);
  };

  const moveTask = (id, column) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, column } : t)));
  };

  const togglePin = (id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t)));
  };

  const toggleChecklist = (taskId, idx) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const list = (t.checklist || []).map((c, i) => (i === idx ? { ...c, done: !c.done } : c));
        return { ...t, checklist: list };
      })
    );
  };

  const addComment = (taskId) => {
    const msg = prompt("Add comment:");
    if (!msg) return;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const comments = [...(t.comments || []), { text: msg.trim(), date: new Date().toLocaleString() }];
        return { ...t, comments };
      })
    );
  };

  /** ---------------------------
   *  Drag & Drop
   *  --------------------------*/
  const onDragStart = (id) => setDragTaskId(id);
  const onDropColumn = (col) => {
    if (!dragTaskId) return;
    moveTask(dragTaskId, col);
    setDragTaskId(null);
  };

  /** ---------------------------
   *  Month Calendar
   *  --------------------------*/
  const { cells } = useMemo(() => getCalendarGrid(monthCursor), [monthCursor]);

  const tasksByDueDate = useMemo(() => {
    const map = new Map();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const key = yyyyMmDd(t.dueDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    }
    for (const [k, list] of map.entries()) {
      list.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2));
      map.set(k, list);
    }
    return map;
  }, [tasks]);

  const selectedDayTasks = useMemo(() => tasksByDueDate.get(selectedDay) || [], [tasksByDueDate, selectedDay]);

  /** ---------------------------
   *  Pinterest Aesthetic Theme
   *  --------------------------*/
  const theme = {
    bg: "linear-gradient(180deg, #FBF7FF 0%, #F7FBFF 40%, #FDF7FB 100%)",
    header: "linear-gradient(135deg, #DCE7F6 0%, #EADCF6 50%, #F6DCEB 100%)",
    text: "#2E3A4A",
    subtext: "#6B7A90",
    card: "#FFFFFF",
    cardShadow: "0 12px 30px rgba(30, 60, 90, 0.08)",
    cardHoverShadow: "0 18px 40px rgba(30, 60, 90, 0.12)",
    softBorder: "1px solid rgba(200, 214, 235, 0.55)",
    pill: "rgba(255,255,255,0.65)",
    accent: "#B39DDB", // lilac accent
    accent2: "#F7A9C4", // blush
    accent3: "#A7DCC3", // mint
    inputBg: "rgba(255,255,255,0.85)",
  };

  /** ---------------------------
   *  Stats
   *  --------------------------*/
  const stats = useMemo(() => {
    const total = bucketTasks.length;
    const done = bucketTasks.filter((t) => t.column === "Done").length;
    const overdue = bucketTasks.filter((t) => isOverdue(t)).length;
    const dueSoon = bucketTasks.filter((t) => isDueSoon(t) || isDueToday(t)).length;
    return { total, done, overdue, dueSoon };
  }, [bucketTasks]);

  const pillBtn = (active = false) => ({
    border: "none",
    borderRadius: 999,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 13,
    color: theme.text,
    background: active ? "rgba(255,255,255,0.92)" : theme.pill,
    boxShadow: active ? "0 10px 24px rgba(0,0,0,0.06)" : "none",
    transition: "transform 140ms ease, box-shadow 140ms ease",
  });

  const softBtn = (bg) => ({
    border: "none",
    borderRadius: 14,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 900,
    color: "#fff",
    background: bg,
    boxShadow: "0 14px 28px rgba(0,0,0,0.10)",
    transition: "transform 140ms ease, box-shadow 140ms ease",
  });

  /** ---------------------------
   *  Render
   *  --------------------------*/
  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text, fontFamily: "Segoe UI, system-ui, -apple-system, sans-serif" }}>
      {/* Little CSS for hover lift */}
      <style>{`
        .lift:hover { transform: translateY(-2px); box-shadow: ${theme.cardHoverShadow}; }
        .btnlift:hover { transform: translateY(-1px); box-shadow: 0 18px 34px rgba(0,0,0,0.12); }
        ::selection { background: rgba(247, 169, 196, 0.45); }
      `}</style>

      {/* Header */}
      <header style={{ background: theme.header, padding: 16, boxShadow: "0 18px 50px rgba(0,0,0,0.10)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 14,
              background: "rgba(255,255,255,0.85)",
              display: "grid", placeItems: "center",
              boxShadow: "0 12px 26px rgba(0,0,0,0.10)",
              fontSize: 20
            }}>🧁</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 950, letterSpacing: 0.2 }}>My Planner</div>
              <div style={{ fontSize: 12, color: theme.subtext, fontWeight: 700 }}>
                📊 {stats.total} • ✅ {stats.done}
                {stats.overdue ? ` • ⚠️ ${stats.overdue}` : ""}
                {stats.dueSoon ? ` • 🔔 ${stats.dueSoon}` : ""}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={pillBtn(view === "board")} onClick={() => setView("board")} className="btnlift">📋 Board</button>
            <button style={pillBtn(view === "month")} onClick={() => setView("month")} className="btnlift">🗓️ Month</button>
            <button style={pillBtn(false)} onClick={openSync} className="btnlift">🔄 Sync</button>
            <button style={pillBtn(false)} onClick={() => openBucketEditor(null)} className="btnlift">+ Bucket</button>
          </div>
        </div>

        {/* Bucket tabs */}
        <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {buckets.map((b) => {
            const active = b.id === currentBucketId;
            const count = tasks.filter((t) => t.bucketId === b.id).length;
            return (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  style={{
                    ...pillBtn(active),
                    padding: "10px 12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8
                  }}
                  onClick={() => {
                    setCurrentBucketId(b.id);
                    setViewingTaskId(null);
                  }}
                  className="btnlift"
                >
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: BUCKET_DOTS[b.id] || theme.accent }} />
                  {b.name}
                  <span style={{ opacity: 0.7, fontSize: 12 }}>({count})</span>
                </button>

                {active && (
                  <>
                    <button
                      onClick={() => openBucketEditor(b)}
                      style={{ border: "none", background: "transparent", cursor: "pointer", fontWeight: 900, color: theme.subtext }}
                      title="Rename"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteBucket(b.id)}
                      style={{ border: "none", background: "transparent", cursor: "pointer", fontWeight: 900, color: "#D36C7D" }}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </header>

      {/* Toolbar */}
      <div style={{ padding: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search in ${currentBucket?.name || "bucket"}...`}
          style={{
            flex: 1, minWidth: 220,
            padding: "12px 14px",
            borderRadius: 18,
            border: theme.softBorder,
            background: theme.inputBg,
            outline: "none",
            boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
            fontWeight: 700,
            color: theme.text
          }}
        />

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          style={{
            padding: "12px 14px",
            borderRadius: 18,
            border: theme.softBorder,
            background: theme.inputBg,
            boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
            fontWeight: 800,
            color: theme.text
          }}
        >
          <option value="All">All priorities</option>
          <option value="Urgent">💗 Urgent</option>
          <option value="High">❤️ High</option>
          <option value="Medium">💜 Medium</option>
          <option value="Low">💚 Low</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: "12px 14px",
            borderRadius: 18,
            border: theme.softBorder,
            background: theme.inputBg,
            boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
            fontWeight: 800,
            color: theme.text
          }}
        >
          <option value="none">Sort: default</option>
          <option value="priority">Sort: priority</option>
          <option value="dueDate">Sort: due date</option>
          <option value="name">Sort: name</option>
        </select>

        <button onClick={() => openNewTask("To Do")} style={softBtn(theme.accent)} className="btnlift">
          + New Task
        </button>
      </div>

      {/* Board */}
      {view === "board" && (
        <div style={{ padding: 14, display: "flex", gap: 14, overflowX: "auto" }}>
          {COLUMNS.map((col) => {
            const colTasks = sortTasks(filteredTasks.filter((t) => t.column === col));
            return (
              <div
                key={col}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDropColumn(col)}
                style={{
                  minWidth: 320,
                  maxWidth: 420,
                  flex: 1,
                  background: "rgba(255,255,255,0.55)",
                  border: theme.softBorder,
                  borderRadius: 24,
                  padding: 14,
                  boxShadow: "0 18px 40px rgba(0,0,0,0.06)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 950, fontSize: 15 }}>{col}</div>
                  <div style={{
                    width: 28, height: 28, borderRadius: 999,
                    background: "rgba(179,157,219,0.25)",
                    display: "grid", placeItems: "center",
                    fontWeight: 950
                  }}>
                    {colTasks.length}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {colTasks.map((t) => {
                    const expanded = viewingTaskId === t.id;
                    const progress = getProgress(t);
                    const overdue = isOverdue(t);
                    const dueToday = isDueToday(t);
                    const dueSoon = isDueSoon(t);

                    const tint = PRIORITY_COLORS[t.priority] + "55"; // tinted background
                    const border = PRIORITY_COLORS[t.priority];

                    return (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={() => onDragStart(t.id)}
                        onClick={() => setViewingTaskId(expanded ? null : t.id)}
                        className="lift"
                        style={{
                          background: tint,
                          border: `1px solid rgba(0,0,0,0.03)`,
                          borderLeft: `10px solid ${border}`,
                          borderRadius: 22,
                          padding: 12,
                          boxShadow: theme.cardShadow,
                          cursor: "pointer"
                        }}
                      >
                        {t.pinned && (
                          <div style={{ fontSize: 11, fontWeight: 950, color: "#7B6AA9", marginBottom: 6 }}>
                            📌 PINNED
                          </div>
                        )}

                        {/* title */}
                        <div style={{ fontSize: 14, fontWeight: 950, marginBottom: 6 }}>
                          {t.title}
                        </div>

                        {/* tags row */}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
                          <span style={{
                            padding: "4px 10px",
                            borderRadius: 999,
                            background: "rgba(255,255,255,0.65)",
                            fontWeight: 900,
                            fontSize: 12
                          }}>
                            {PRIORITY_EMOJI[t.priority]} {t.priority}
                          </span>

                          {t.assignee && (
                            <span style={{ fontSize: 12, fontWeight: 800, color: "#44546B" }}>
                              👤 {t.assignee}
                            </span>
                          )}

                          {overdue && <span style={{ fontSize: 11, fontWeight: 950, color: "#B5475A" }}>⚠️ OVERDUE</span>}
                          {dueToday && <span style={{ fontSize: 11, fontWeight: 950, color: "#B1762B" }}>📌 TODAY</span>}
                          {dueSoon && <span style={{ fontSize: 11, fontWeight: 950, color: "#8E7A2A" }}>🔔 SOON</span>}
                        </div>

                        {/* dates */}
                        {(t.startDate || t.dueDate) && (
                          <div style={{ fontSize: 12, fontWeight: 800, color: theme.subtext, marginBottom: 8 }}>
                            {t.startDate && <div>📅 Start: {t.startDate}</div>}
                            {t.dueDate && <div>⏰ Due: {t.dueDate}</div>}
                          </div>
                        )}

                        {/* progress */}
                        {progress !== null && (
                          <div style={{ marginBottom: 8 }}>
                            <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.65)", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${progress}%`, background: "#7FB7D9" }} />
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 900, color: theme.subtext, marginTop: 4 }}>
                              {progress}% complete
                            </div>
                          </div>
                        )}

                        {!expanded && (t.comments?.length > 0) && (
                          <div style={{ fontSize: 11, fontWeight: 800, color: theme.subtext }}>
                            💬 {t.comments.length} comment{t.comments.length === 1 ? "" : "s"}
                          </div>
                        )}

                        {/* Expanded details */}
                        {expanded && (
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.7)" }}>
                            {t.notes && (
                              <div style={{ marginBottom: 10 }}>
                                <div style={{ fontSize: 12, fontWeight: 950, marginBottom: 4 }}>📝 Notes</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#3A485B", whiteSpace: "pre-wrap" }}>{t.notes}</div>
                              </div>
                            )}

                            {t.checklist?.length > 0 && (
                              <div style={{ marginBottom: 10 }}>
                                <div style={{ fontSize: 12, fontWeight: 950, marginBottom: 6 }}>☑️ Checklist</div>
                                {t.checklist.map((c, i) => (
                                  <div
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); toggleChecklist(t.id, i); }}
                                    style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, padding: "4px 0", fontWeight: 750 }}
                                  >
                                    <span>{c.done ? "✅" : "⬜"}</span>
                                    <span style={{ textDecoration: c.done ? "line-through" : "none", color: c.done ? theme.subtext : theme.text }}>
                                      {c.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                              {COLUMNS.filter((c) => c !== t.column).map((c) => (
                                <button
                                  key={c}
                                  onClick={(e) => { e.stopPropagation(); moveTask(t.id, c); }}
                                  style={{
                                    border: "none",
                                    background: "rgba(255,255,255,0.75)",
                                    borderRadius: 999,
                                    padding: "8px 10px",
                                    cursor: "pointer",
                                    fontWeight: 900,
                                    fontSize: 12,
                                    color: "#4A5568"
                                  }}
                                  className="btnlift"
                                >
                                  → {c}
                                </button>
                              ))}
                            </div>

                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); togglePin(t.id); }}
                                style={softBtn(t.pinned ? theme.accent2 : theme.accent)}
                                className="btnlift"
                              >
                                {t.pinned ? "📌 Unpin" : "📌 Pin"}
                              </button>

                              <button
                                onClick={(e) => { e.stopPropagation(); openEditTask(t); }}
                                style={softBtn("#7FB7D9")}
                                className="btnlift"
                              >
                                ✏️ Edit
                              </button>

                              <button
                                onClick={(e) => { e.stopPropagation(); addComment(t.id); }}
                                style={softBtn("#F0A9C2")}
                                className="btnlift"
                              >
                                💬 Comment
                              </button>

                              <button
                                onClick={(e) => { e.stopPropagation(); removeTask(t.id); }}
                                style={softBtn("#D36C7D")}
                                className="btnlift"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => openNewTask(col)}
                  style={{
                    width: "100%",
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 22,
                    border: "2px dashed rgba(179,157,219,0.55)",
                    background: "rgba(255,255,255,0.55)",
                    cursor: "pointer",
                    fontWeight: 950,
                    color: "#6B7A90"
                  }}
                  className="btnlift"
                >
                  + Add Task
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Month View */}
      {view === "month" && (
        <div style={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button style={pillBtn(false)} className="btnlift" onClick={() => setMonthCursor((d) => addMonths(d, -1))}>◀</button>
              <div style={{ fontSize: 18, fontWeight: 950 }}>
                {monthCursor.toLocaleString(undefined, { month: "long", year: "numeric" })}
              </div>
              <button style={pillBtn(false)} className="btnlift" onClick={() => setMonthCursor((d) => addMonths(d, +1))}>▶</button>
              <button
                style={softBtn("#7FB7D9")}
                className="btnlift"
                onClick={() => {
                  setMonthCursor(startOfMonth(new Date()));
                  setSelectedDay(yyyyMmDd(new Date()));
                }}
              >
                Today
              </button>
            </div>

            <button style={softBtn(theme.accent)} className="btnlift" onClick={() => openNewTask("To Do")}>
              + New Task
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
              <div key={d} style={{ fontWeight: 950, fontSize: 12, color: theme.subtext, padding: "0 8px" }}>{d}</div>
            ))}

            {cells.map((c, idx) => {
              const key = yyyyMmDd(c.date);
              const dayTasks = tasksByDueDate.get(key) || [];
              const selected = key === selectedDay;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDay(key)}
                  className="lift"
                  style={{
                    background: selected ? "rgba(179,157,219,0.25)" : "rgba(255,255,255,0.70)",
                    border: theme.softBorder,
                    borderRadius: 22,
                    padding: 12,
                    minHeight: 92,
                    cursor: "pointer",
                    opacity: c.inMonth ? 1 : 0.45,
                    boxShadow: theme.cardShadow
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 950 }}>
                      {c.date.getDate()}
                      {c.isToday ? <span style={{ marginLeft: 6, color: theme.accent2 }}>●</span> : null}
                    </div>
                    {dayTasks.length > 0 && (
                      <div style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.75)",
                        fontWeight: 950,
                        fontSize: 12
                      }}>
                        {dayTasks.length}
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                    {dayTasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        style={{
                          borderLeft: `8px solid ${PRIORITY_COLORS[t.priority]}`,
                          paddingLeft: 8,
                          fontSize: 11,
                          fontWeight: 900,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                        title={t.title}
                      >
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div style={{ fontSize: 11, fontWeight: 800, color: theme.subtext }}>
                        + {dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 16, background: "rgba(255,255,255,0.75)", border: theme.softBorder, borderRadius: 24, padding: 14, boxShadow: theme.cardShadow }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontWeight: 950 }}>Tasks due on <span style={{ color: theme.accent }}>{selectedDay}</span></div>
              <div style={{ fontSize: 12, color: theme.subtext, fontWeight: 700 }}>
                Month view uses <b>Due Date</b>
              </div>
            </div>

            {selectedDayTasks.length === 0 ? (
              <div style={{ marginTop: 10, color: theme.subtext, fontWeight: 800 }}>No tasks due this day.</div>
            ) : (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                {selectedDayTasks.map((t) => {
                  const bucketName = buckets.find((b) => b.id === t.bucketId)?.name || "Unknown";
                  return (
                    <div
                      key={t.id}
                      className="lift"
                      style={{
                        background: PRIORITY_COLORS[t.priority] + "55",
                        borderRadius: 22,
                        padding: 12,
                        borderLeft: `10px solid ${PRIORITY_COLORS[t.priority]}`,
                        boxShadow: theme.cardShadow
                      }}
                    >
                      <div style={{ fontWeight: 950 }}>{t.title}</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: theme.subtext, marginTop: 4 }}>
                        {bucketName} • {t.column} • {PRIORITY_EMOJI[t.priority]} {t.priority}
                      </div>

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                        <button
                          style={softBtn("#7FB7D9")}
                          className="btnlift"
                          onClick={() => {
                            setCurrentBucketId(t.bucketId);
                            setView("board");
                            setViewingTaskId(t.id);
                          }}
                        >
                          Open on Board
                        </button>
                        <button
                          style={softBtn(theme.accent)}
                          className="btnlift"
                          onClick={() => openEditTask(t)}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div
          onClick={() => setShowTaskModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "grid", placeItems: "center", zIndex: 1000, padding: 14 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 640,
              background: "rgba(255,255,255,0.92)",
              border: theme.softBorder,
              borderRadius: 28,
              padding: 16,
              boxShadow: "0 30px 80px rgba(0,0,0,0.18)",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 950, marginBottom: 10 }}>
              {editingTaskId ? "✏️ Edit Task" : "➕ New Task"}
            </div>

            <label style={{ fontSize: 12, fontWeight: 900, color: theme.subtext }}>Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="What are we doing, bestie?"
              style={{ width: "100%", marginTop: 6, marginBottom: 10, padding: "12px 14px", borderRadius: 18, border: theme.softBorder, background: theme.inputBg, fontWeight: 800 }}
            />

            <label style={{ fontSize: 12, fontWeight: 900, color: theme.subtext }}>Assigned To</label>
            <input
              value={form.assignee}
              onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
              placeholder="Who’s owning this?"
              style={{ width: "100%", marginTop: 6, marginBottom: 10, padding: "12px 14px", borderRadius: 18, border: theme.softBorder, background: theme.inputBg, fontWeight: 800 }}
            />

            <label style={{ fontSize: 12, fontWeight: 900, color: theme.subtext }}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="Add cute notes + details…"
              style={{ width: "100%", marginTop: 6, marginBottom: 10, padding: "12px 14px", borderRadius: 18, border: theme.softBorder, background: theme.inputBg, fontWeight: 750, resize: "vertical" }}
            />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: 12, fontWeight: 900, color: theme.subtext }}>Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  style={{ width: "100%", marginTop: 6, padding: "12px 14px", borderRadius: 18, border: theme.softBorder, background: theme.inputBg, fontWeight: 900 }}
                >
                  <option value="Urgent">💗 Urgent</option>
                  <option value="High">❤️ High</option>
                  <option value="Medium">💜 Medium</option>
                  <option value="Low">💚 Low</option>
                </select>
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: 12, fontWeight: 900, color: theme.subtext }}>Column</label>
                <select
                  value={form.column}
                  onChange={(e) => setForm((f) => ({ ...f, column: e.target.value }))}
                  style={{ width: "100%", marginTop: 6, padding: "12px 14px", borderRadius: 18, border: theme.softBorder, background: theme.inputBg, fontWeight: 900 }}
                >
                  {COLUMNS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: 12, fontWeight: 900, color: theme.subtext }}>Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  style={{ width: "100%", marginTop: 6, padding: "12px 14px", borderRadius: 18, border: theme.softBorder, background: theme.inputBg, fontWeight: 850 }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: 12, fontWeight: 900, color: theme.subtext }}>Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  style={{ width: "100%", marginTop: 6, padding: "12px 14px", borderRadius: 18, border: theme.softBorder, background: theme.inputBg, fontWeight: 850 }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
              <button
                onClick={() => setForm((f) => ({ ...f, pinned: !f.pinned }))}
                style={softBtn(form.pinned ? theme.accent2 : theme.accent)}
                className="btnlift"
              >
                {form.pinned ? "📌 Pinned" : "📌 Pin"}
              </button>

              <button
                onClick={() => {
                  const txt = prompt("Checklist item:");
                  if (!txt) return;
                  setForm((f) => ({ ...f, checklist: [...(f.checklist || []), { text: txt, done: false }] }));
                }}
                style={softBtn("#7FB7D9")}
                className="btnlift"
              >
                + Checklist item
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setShowTaskModal(false)}
                style={{ ...pillBtn(false), padding: "12px 16px" }}
                className="btnlift"
              >
                Cancel
              </button>
              <button onClick={upsertTask} style={softBtn(theme.accent)} className="btnlift">
                {editingTaskId ? "Save Changes" : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bucket Modal */}
      {showBucketModal && (
        <div
          onClick={() => setShowBucketModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "grid", placeItems: "center", zIndex: 1000, padding: 14 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 420,
              background: "rgba(255,255,255,0.92)",
              border: theme.softBorder,
              borderRadius: 28,
              padding: 16,
              boxShadow: "0 30px 80px rgba(0,0,0,0.18)",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 950, marginBottom: 10 }}>
              {editingBucketId ? "✏️ Rename Bucket" : "📂 New Bucket"}
            </div>
            <input
              value={bucketFormName}
              onChange={(e) => setBucketFormName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveBucket()}
              placeholder="Bucket name"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 18, border: theme.softBorder, background: theme.inputBg, fontWeight: 850 }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
              <button onClick={() => setShowBucketModal(false)} style={{ ...pillBtn(false), padding: "12px 16px" }} className="btnlift">Cancel</button>
              <button onClick={saveBucket} style={softBtn(theme.accent)} className="btnlift">{editingBucketId ? "Save" : "Create"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Modal */}
      {showSyncModal && (
        <div
          onClick={() => setShowSyncModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "grid", placeItems: "center", zIndex: 1000, padding: 14 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 720,
              background: "rgba(255,255,255,0.92)",
              border: theme.softBorder,
              borderRadius: 28,
              padding: 16,
              boxShadow: "0 30px 80px rgba(0,0,0,0.18)",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 950, marginBottom: 10 }}>🔄 Sync Between Devices</div>

            <div style={{ background: "rgba(247, 169, 196, 0.12)", border: theme.softBorder, borderRadius: 22, padding: 12, marginBottom: 10 }}>
              <div style={{ fontWeight: 950, marginBottom: 6 }}>📤 Export</div>
              <textarea
                readOnly
                value={syncExportCode}
                onClick={(e) => e.target.select()}
                style={{
                  width: "100%",
                  height: 120,
                  padding: 12,
                  borderRadius: 18,
                  border: theme.softBorder,
                  background: "rgba(255,255,255,0.85)",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: 11
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button onClick={copySyncCode} style={softBtn(theme.accent2)} className="btnlift">📋 Copy Code</button>
              </div>
            </div>

            <div style={{ background: "rgba(167, 220, 195, 0.12)", border: theme.softBorder, borderRadius: 22, padding: 12, marginBottom: 10 }}>
              <div style={{ fontWeight: 950, marginBottom: 6 }}>📥 Import</div>
              <textarea
                value={syncImportCode}
                onChange={(e) => setSyncImportCode(e.target.value)}
                placeholder="Paste code here…"
                style={{
                  width: "100%",
                  height: 120,
                  padding: 12,
                  borderRadius: 18,
                  border: theme.softBorder,
                  background: "rgba(255,255,255,0.85)",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: 11
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button onClick={importSync} style={softBtn(theme.accent3)} className="btnlift">📥 Import Tasks</button>
              </div>
            </div>

            {syncMessage && (
              <div style={{ padding: 12, borderRadius: 18, background: "rgba(179,157,219,0.18)", border: theme.softBorder, fontWeight: 900 }}>
                {syncMessage}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button onClick={() => setShowSyncModal(false)} style={{ ...pillBtn(false), padding: "12px 16px" }} className="btnlift">Close</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 22 }} />
    </div>
  );
}
