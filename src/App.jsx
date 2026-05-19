import React, { useEffect, useMemo, useState } from "react";

/** ---------------------------
 *  Helpers
 *  --------------------------*/
const uid = () => Math.random().toString(36).slice(2, 10);

const yyyyMmDd = (d) => {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const safeJsonParse = (s, fallback) => {
  try {
    const v = JSON.parse(s);
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

const encodeSync = (obj) => {
  // Note: base64 can get long if you have tons of tasks—this is normal.
  const json = JSON.stringify(obj);
  return btoa(unescape(encodeURIComponent(json)));
};

const decodeSync = (code) => {
  const json = decodeURIComponent(escape(atob(code.trim())));
  return JSON.parse(json);
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const addMonths = (date, delta) => new Date(date.getFullYear(), date.getMonth() + delta, 1);

const getCalendarGrid = (monthDate) => {
  // Returns 42 cells (6 weeks x 7 days) for a month grid
  const first = startOfMonth(monthDate);
  const last = endOfMonth(monthDate);

  const startDayIndex = first.getDay(); // 0 Sun ... 6 Sat
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
  return { first, last, cells };
};

/** ---------------------------
 *  Defaults / Config
 *  --------------------------*/
const COLUMNS = ["To Do", "In Progress", "Review", "Done"];

const DEFAULT_BUCKETS = [
  { id: "saddleside", name: "Saddleside" },
  { id: "legacyfields", name: "Legacy Fields" },
  { id: "lonestar", name: "Lonestar" },
  { id: "alpharanch", name: "Alpha Ranch" },
  { id: "willowstone", name: "Willowstone" },
  { id: "other", name: "Other" },
];

const PRIORITY_ORDER = { Urgent: 0, High: 1, Medium: 2, Low: 3 };

const PRIORITY_COLORS_PASTEL = {
  Urgent: "#F2A7A7", // pastel red
  High: "#F4C19A",   // pastel orange
  Medium: "#F4E49A", // pastel yellow
  Low: "#A8DDB5",    // pastel green
};

const PRIORITY_EMOJI = {
  Urgent: "🔴",
  High: "🟠",
  Medium: "🟡",
  Low: "🟢",
};

const LABELS = [
  { name: "Bug", color: "#F28C8C" },
  { name: "Feature", color: "#8BBCEB" },
  { name: "Design", color: "#C7A6E8" },
  { name: "Research", color: "#9ED6B8" },
  { name: "Meeting", color: "#F3C07B" },
  { name: "Personal", color: "#88D6D8" },
];

const BUCKET_COLORS_PASTEL = {
  saddleside: "#9EC5E8",
  legacyfields: "#A6D9B6",
  lonestar: "#F1C3A1",
  alpharanch: "#C8B2E6",
  willowstone: "#9AD9DB",
  other: "#B7C6D6",
};

/** ---------------------------
 *  Main App
 *  --------------------------*/
export default function App() {
  // Views: "board" | "month"
  const [view, setView] = useState(() => localStorage.getItem("planner-view") || "board");

  // Theme
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("planner-dark") === "true");

  // Buckets + selection
  const [buckets, setBuckets] = useState(() =>
    safeJsonParse(localStorage.getItem("planner-buckets"), DEFAULT_BUCKETS)
  );
  const [currentBucketId, setCurrentBucketId] = useState(() =>
    localStorage.getItem("planner-current-bucket") || DEFAULT_BUCKETS[0].id
  );

  // Tasks
  const [tasks, setTasks] = useState(() =>
    safeJsonParse(localStorage.getItem("planner-tasks"), [])
  );

  // UI state
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
   *  Persist to localStorage
   *  --------------------------*/
  useEffect(() => {
    localStorage.setItem("planner-view", view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem("planner-dark", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("planner-buckets", JSON.stringify(buckets));
  }, [buckets]);

  useEffect(() => {
    localStorage.setItem("planner-current-bucket", currentBucketId);
  }, [currentBucketId]);

  useEffect(() => {
    localStorage.setItem("planner-tasks", JSON.stringify(tasks));
  }, [tasks]);

  /** ---------------------------
   *  Derived data
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

  const isDueToday = (t) => t.dueDate && yyyyMmDd(new Date(t.dueDate)) === yyyyMmDd(new Date()) && t.column !== "Done";

  const isDueSoon = (t) => {
    if (!t.dueDate || t.column === "Done") return false;
    if (isDueToday(t) || isOverdue(t)) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = (due - today) / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= 3;
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

  const sortedTasks = (list) => {
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
   *  Sync: Export / Import
   *  --------------------------*/
  const openSync = () => {
    const payload = {
      v: 1,
      exportedAt: new Date().toISOString(),
      darkMode,
      buckets,
      currentBucketId,
      tasks,
    };
    const code = encodeSync(payload);
    setSyncExportCode(code);
    setSyncImportCode("");
    setSyncMessage("");
    setShowSyncModal(true);
  };

  const copySyncCode = async () => {
    try {
      await navigator.clipboard.writeText(syncExportCode);
      setSyncMessage("✅ Copied! Paste it on your other device to import.");
    } catch {
      setSyncMessage("⚠️ Copy didn’t work. Tap the code, Select All, then Copy.");
    }
  };

  const importSyncCode = () => {
    if (!syncImportCode.trim()) {
      setSyncMessage("⚠️ Paste a code first.");
      return;
    }
    try {
      const data = decodeSync(syncImportCode);
      if (Array.isArray(data.tasks)) setTasks(data.tasks);
      if (Array.isArray(data.buckets)) setBuckets(data.buckets);
      if (typeof data.darkMode === "boolean") setDarkMode(data.darkMode);
      if (data.currentBucketId) setCurrentBucketId(data.currentBucketId);

      setSyncMessage("✅ Imported! Your planner is updated on this device.");
      setTimeout(() => {
        setShowSyncModal(false);
        setSyncMessage("");
      }, 1200);
    } catch {
      setSyncMessage("❌ Invalid code. Make sure you copied the entire code.");
    }
  };

  /** ---------------------------
   *  Buckets CRUD
   *  --------------------------*/
  const openBucketEditor = (bucket) => {
    if (bucket) {
      setEditingBucketId(bucket.id);
      setBucketFormName(bucket.name);
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
        prev.map((t) =>
          t.id === editingTaskId
            ? {
                ...t,
                ...form,
              }
            : t
        )
      );
    } else {
      const newTask = {
        id: uid(),
        createdAt: new Date().toISOString(),
        bucketId: currentBucketId,
        ...form,
      };
      setTasks((prev) => [...prev, newTask]);
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

  const addComment = (taskId, text) => {
    const msg = text.trim();
    if (!msg) return;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const comments = [...(t.comments || []), { text: msg, date: new Date().toLocaleString() }];
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
   *  Month Calendar data
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
    // sort each day’s tasks by priority then due date
    for (const [k, list] of map.entries()) {
      list.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2));
      map.set(k, list);
    }
    return map;
  }, [tasks]);

  const selectedDayTasks = useMemo(() => {
    const list = tasksByDueDate.get(selectedDay) || [];
    return list;
  }, [tasksByDueDate, selectedDay]);

  /** ---------------------------
   *  THEME (Pastel Blue Light)
   *  --------------------------*/
  const theme = useMemo(() => {
    if (darkMode) {
      return {
        bg: "#141C2A",
        headerBg: "linear-gradient(135deg, #1E3458, #162844)",
        toolbarBg: "#1A2740",
        columnBg: "#1A2944",
        cardBg: "#17253E",
        text: "#E7EEF8",
        subtext: "#A7B5C9",
        border: "#2A3A58",
        inputBg: "#13213A",
        inputBorder: "#2A3A58",
        accent: "#7DAED4",
      };
    }
    // Pastel blue focus:
    return {
      bg: "#E8F2FF", // light pastel blue overall
      headerBg: "linear-gradient(135deg, #B7D8F6, #9CC7EB)", // pastel blue heading
      toolbarBg: "#F1F7FF",
      columnBg: "#DDEBFA",
      cardBg: "#FFFFFF",
      text: "#274058",
      subtext: "#5F7F9D",
      border: "#C5DAF2",
      inputBg: "#FFFFFF",
      inputBorder: "#B8D0EA",
      accent: "#7CAFD6",
    };
  }, [darkMode]);

  /** ---------------------------
   *  Stats (current bucket)
   *  --------------------------*/
  const stats = useMemo(() => {
    const total = bucketTasks.length;
    const done = bucketTasks.filter((t) => t.column === "Done").length;
    const overdue = bucketTasks.filter((t) => isOverdue(t)).length;
    const dueSoon = bucketTasks.filter((t) => isDueSoon(t) || isDueToday(t)).length;
    return { total, done, overdue, dueSoon };
  }, [bucketTasks]);

  /** ---------------------------
   *  UI Components
   *  --------------------------*/
  const Pill = ({ color, children }) => (
    <span
      style={{
        background: color,
        color: "#fff",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );

  /** ---------------------------
   *  Render
   *  --------------------------*/
  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text, fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" }}>
      {/* Header */}
      <header style={{ background: theme.headerBg, color: "white", padding: "14px 18px", boxShadow: "0 6px 24px rgba(0,0,0,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, fontSize: 22, letterSpacing: 0.2 }}>💙 My Planner</h1>
            <span style={{ opacity: 0.9, fontSize: 12 }}>
              📊 {stats.total} | ✅ {stats.done}
              {stats.overdue > 0 ? ` | ⚠️ ${stats.overdue}` : ""}
              {stats.dueSoon > 0 ? ` | 🔔 ${stats.dueSoon}` : ""}
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => setView("board")}
              style={{
                border: "none",
                borderRadius: 10,
                padding: "8px 10px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                background: view === "board" ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.18)",
                color: "white",
              }}
            >
              📋 Board
            </button>

            <button
              onClick={() => setView("month")}
              style={{
                border: "none",
                borderRadius: 10,
                padding: "8px 10px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                background: view === "month" ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.18)",
                color: "white",
              }}
            >
              🗓️ Month
            </button>

            <button
              onClick={openSync}
              style={{
                border: "none",
                borderRadius: 10,
                padding: "8px 10px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                background: "rgba(255,255,255,0.18)",
                color: "white",
              }}
            >
              🔄 Sync
            </button>

            <button
              onClick={() => setDarkMode((v) => !v)}
              style={{
                border: "none",
                borderRadius: 10,
                padding: "8px 10px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                background: "rgba(255,255,255,0.18)",
                color: "white",
              }}
            >
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>
        </div>

        {/* Bucket Tabs */}
        <div style={{ marginTop: 12, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {buckets.map((b) => {
            const active = b.id === currentBucketId;
            const count = tasks.filter((t) => t.bucketId === b.id).length;
            return (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button
                  onClick={() => setCurrentBucketId(b.id)}
                  style={{
                    border: "none",
                    borderRadius: "10px 10px 0 0",
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: active ? 800 : 600,
                    background: active ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.15)",
                    color: "white",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: BUCKET_COLORS_PASTEL[b.id] || theme.accent,
                        display: "inline-block",
                      }}
                    />
                    {b.name} <span style={{ opacity: 0.75, fontSize: 11 }}>({count})</span>
                  </span>
                </button>

                {active && (
                  <>
                    <button
                      onClick={() => openBucketEditor(b)}
                      style={{ border: "none", background: "transparent", color: "white", cursor: "pointer", fontSize: 12 }}
                      title="Rename bucket"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteBucket(b.id)}
                      style={{ border: "none", background: "transparent", color: "#FFE0E0", cursor: "pointer", fontSize: 12 }}
                      title="Delete bucket"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            );
          })}

          <button
            onClick={() => openBucketEditor(null)}
            style={{
              border: "1px dashed rgba(255,255,255,0.65)",
              background: "transparent",
              color: "white",
              borderRadius: 10,
              padding: "8px 12px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            + Bucket
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div style={{ background: theme.toolbarBg, borderBottom: `1px solid ${theme.border}`, padding: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`🔍 Search in ${currentBucket?.name || "bucket"}...`}
            style={{
              flex: 1,
              minWidth: 180,
              padding: "10px 12px",
              borderRadius: 12,
              border: `1px solid ${theme.inputBorder}`,
              background: theme.inputBg,
              color: theme.text,
              outline: "none",
              fontSize: 14,
            }}
          />

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: `1px solid ${theme.inputBorder}`,
              background: theme.inputBg,
              color: theme.text,
              fontSize: 14,
            }}
          >
            <option value="All">All Priorities</option>
            <option value="Urgent">🔴 Urgent</option>
            <option value="High">🟠 High</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🟢 Low</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: `1px solid ${theme.inputBorder}`,
              background: theme.inputBg,
              color: theme.text,
              fontSize: 14,
            }}
          >
            <option value="none">Sort: Default</option>
            <option value="priority">Sort: Priority</option>
            <option value="dueDate">Sort: Due Date</option>
            <option value="name">Sort: Name</option>
          </select>

          <button
            onClick={() => openNewTask("To Do")}
            style={{
              padding: "10px 14px",
              border: "none",
              borderRadius: 12,
              background: theme.accent,
              color: "white",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: 14,
              boxShadow: "0 10px 22px rgba(124,175,214,0.28)",
            }}
          >
            + New Task
          </button>
        </div>
      </div>

      {/* Main Content */}
      {view === "board" ? (
        <div style={{ padding: 16, display: "flex", gap: 14, overflowX: "auto" }}>
          {COLUMNS.map((col) => {
            const colTasks = sortedTasks(filteredTasks.filter((t) => t.column === col));
            return (
              <div
                key={col}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDropColumn(col)}
                style={{
                  minWidth: 300,
                  maxWidth: 380,
                  flex: 1,
                  background: theme.columnBg,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 16,
                  padding: 14,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <h2 style={{ margin: 0, fontSize: 15 }}>{col}</h2>
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: darkMode ? "#2A3A58" : "#CFE2F6",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {colTasks.map((t) => {
                    const expanded = viewingTaskId === t.id;
                    const progress = getProgress(t);
                    const overdue = isOverdue(t);
                    const dueToday = isDueToday(t);
                    const dueSoon = isDueSoon(t);

                    return (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={() => onDragStart(t.id)}
                        onClick={() => setViewingTaskId(expanded ? null : t.id)}
                        style={{
                          background: theme.cardBg,
                          borderRadius: 14,
                          padding: 12,
                          borderLeft: `6px solid ${PRIORITY_COLORS_PASTEL[t.priority] || theme.accent}`,
                          border: overdue
                            ? "1px solid #E36A6A"
                            : dueToday
                            ? "1px solid #E0A04E"
                            : t.pinned
                            ? `1px solid ${theme.accent}`
                            : `1px solid transparent`,
                          boxShadow: t.pinned ? "0 10px 22px rgba(124,175,214,0.22)" : "0 6px 14px rgba(0,0,0,0.06)",
                          cursor: "pointer",
                        }}
                      >
                        {t.pinned && (
                          <div style={{ fontSize: 11, fontWeight: 800, color: theme.accent, marginBottom: 4 }}>📌 PINNED</div>
                        )}

                        {/* Labels */}
                        {t.labels?.length > 0 && (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                            {t.labels.map((l) => {
                              const lo = LABELS.find((x) => x.name === l);
                              return (
                                <span
                                  key={l}
                                  style={{
                                    background: lo?.color || "#9AA7B3",
                                    color: "white",
                                    padding: "2px 8px",
                                    borderRadius: 999,
                                    fontSize: 10,
                                    fontWeight: 800,
                                  }}
                                >
                                  {l}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 4 }}>{t.title}</div>

                        {t.assignee && <div style={{ fontSize: 12, color: theme.subtext, marginBottom: 6 }}>👤 {t.assignee}</div>}

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
                          <Pill color={PRIORITY_COLORS_PASTEL[t.priority] || theme.accent}>
                            {PRIORITY_EMOJI[t.priority]} {t.priority}
                          </Pill>
                          {overdue && <span style={{ fontSize: 11, fontWeight: 800, color: "#E36A6A" }}>⚠️ OVERDUE</span>}
                          {dueToday && <span style={{ fontSize: 11, fontWeight: 800, color: "#E0A04E" }}>📌 DUE TODAY</span>}
                          {dueSoon && <span style={{ fontSize: 11, fontWeight: 800, color: "#D7B04B" }}>🔔 DUE SOON</span>}
                        </div>

                        {(t.startDate || t.dueDate) && (
                          <div style={{ fontSize: 12, color: theme.subtext, marginBottom: 6 }}>
                            {t.startDate && <div>📅 Start: {t.startDate}</div>}
                            {t.dueDate && <div>⏰ Due: {t.dueDate}</div>}
                          </div>
                        )}

                        {progress !== null && (
                          <div style={{ marginBottom: 6 }}>
                            <div style={{ height: 6, borderRadius: 999, background: darkMode ? "#2A3A58" : "#D3E6FB", overflow: "hidden" }}>
                              <div
                                style={{
                                  width: `${progress}%`,
                                  height: "100%",
                                  background: progress === 100 ? "#53B37D" : theme.accent,
                                }}
                              />
                            </div>
                            <div style={{ fontSize: 11, color: theme.subtext, marginTop: 4 }}>{progress}% complete</div>
                          </div>
                        )}

                        {t.comments?.length > 0 && !expanded && (
                          <div style={{ fontSize: 11, color: theme.subtext }}>💬 {t.comments.length} comment{t.comments.length === 1 ? "" : "s"}</div>
                        )}

                        {expanded && (
                          <div style={{ marginTop: 10, borderTop: `1px solid ${theme.border}`, paddingTop: 10 }}>
                            {t.notes && (
                              <div style={{ marginBottom: 10 }}>
                                <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 4 }}>📝 Notes</div>
                                <div style={{ fontSize: 13, color: theme.subtext, whiteSpace: "pre-wrap" }}>{t.notes}</div>
                              </div>
                            )}

                            {t.checklist?.length > 0 && (
                              <div style={{ marginBottom: 10 }}>
                                <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>☑️ Checklist</div>
                                {t.checklist.map((c, i) => (
                                  <div
                                    key={i}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleChecklist(t.id, i);
                                    }}
                                    style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, padding: "4px 0" }}
                                  >
                                    <span>{c.done ? "✅" : "⬜"}</span>
                                    <span style={{ textDecoration: c.done ? "line-through" : "none", color: c.done ? theme.subtext : theme.text }}>
                                      {c.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Comments */}
                            <div style={{ marginBottom: 10 }}>
                              <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>💬 Comments</div>
                              {(t.comments || []).map((c, i) => (
                                <div key={i} style={{ background: darkMode ? "#13213A" : "#F4FAFF", border: `1px solid ${theme.border}`, borderRadius: 10, padding: 10, marginBottom: 6 }}>
                                  <div style={{ fontSize: 13 }}>{c.text}</div>
                                  <div style={{ fontSize: 11, color: theme.subtext, marginTop: 4 }}>{c.date}</div>
                                </div>
                              ))}

                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{ display: "flex", gap: 8, alignItems: "center" }}
                              >
                                <input
                                  placeholder="Add a comment..."
                                  style={{
                                    flex: 1,
                                    padding: "8px 10px",
                                    borderRadius: 10,
                                    border: `1px solid ${theme.inputBorder}`,
                                    background: theme.inputBg,
                                    color: theme.text,
                                  }}
                                  value={t.__draftComment || ""}
                                  onChange={() => {}}
                                  // We'll use a simple prompt button below to keep this file shorter/safer
                                  readOnly
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const msg = prompt("Add comment:");
                                    if (msg) addComment(t.id, msg);
                                  }}
                                  style={{
                                    border: "none",
                                    borderRadius: 10,
                                    padding: "8px 10px",
                                    background: theme.accent,
                                    color: "white",
                                    cursor: "pointer",
                                    fontWeight: 900,
                                  }}
                                >
                                  + 💬
                                </button>
                              </div>
                            </div>

                            {/* Move buttons (great for phone) */}
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                              {COLUMNS.filter((c) => c !== t.column).map((c) => (
                                <button
                                  key={c}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveTask(t.id, c);
                                  }}
                                  style={{
                                    border: `1px solid ${theme.accent}`,
                                    background: "transparent",
                                    color: theme.accent,
                                    padding: "6px 10px",
                                    borderRadius: 10,
                                    cursor: "pointer",
                                    fontSize: 12,
                                    fontWeight: 800,
                                  }}
                                >
                                  → {c}
                                </button>
                              ))}
                            </div>

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePin(t.id);
                                }}
                                style={{
                                  border: "none",
                                  borderRadius: 10,
                                  padding: "8px 10px",
                                  cursor: "pointer",
                                  fontWeight: 900,
                                  color: "white",
                                  background: t.pinned ? "#E0A04E" : "#8FA6BB",
                                }}
                              >
                                {t.pinned ? "📌 Unpin" : "📌 Pin"}
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditTask(t);
                                }}
                                style={{
                                  border: "none",
                                  borderRadius: 10,
                                  padding: "8px 10px",
                                  cursor: "pointer",
                                  fontWeight: 900,
                                  color: "white",
                                  background: theme.accent,
                                }}
                              >
                                ✏️ Edit
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeTask(t.id);
                                }}
                                style={{
                                  border: "none",
                                  borderRadius: 10,
                                  padding: "8px 10px",
                                  cursor: "pointer",
                                  fontWeight: 900,
                                  color: "white",
                                  background: "#E36A6A",
                                }}
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
                    marginTop: 10,
                    padding: 10,
                    borderRadius: 14,
                    border: `2px dashed ${theme.inputBorder}`,
                    background: "transparent",
                    cursor: "pointer",
                    fontWeight: 900,
                    color: theme.subtext,
                  }}
                >
                  + Add Task
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* Month View */
        <div style={{ padding: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={() => setMonthCursor((d) => addMonths(d, -1))}
                style={{
                  border: `1px solid ${theme.inputBorder}`,
                  background: theme.inputBg,
                  color: theme.text,
                  borderRadius: 12,
                  padding: "8px 10px",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                ◀
              </button>

              <div style={{ fontSize: 18, fontWeight: 950 }}>
                {monthCursor.toLocaleString(undefined, { month: "long", year: "numeric" })}
              </div>

              <button
                onClick={() => setMonthCursor((d) => addMonths(d, +1))}
                style={{
                  border: `1px solid ${theme.inputBorder}`,
                  background: theme.inputBg,
                  color: theme.text,
                  borderRadius: 12,
                  padding: "8px 10px",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                ▶
              </button>

              <button
                onClick={() => {
                  setMonthCursor(startOfMonth(new Date()));
                  setSelectedDay(yyyyMmDd(new Date()));
                }}
                style={{
                  border: "none",
                  background: theme.accent,
                  color: "white",
                  borderRadius: 12,
                  padding: "8px 10px",
                  cursor: "pointer",
                  fontWeight: 950,
                }}
              >
                Today
              </button>
            </div>

            <button
              onClick={() => openNewTask("To Do")}
              style={{
                border: "none",
                background: theme.accent,
                color: "white",
                borderRadius: 12,
                padding: "10px 14px",
                cursor: "pointer",
                fontWeight: 950,
                boxShadow: "0 10px 22px rgba(124,175,214,0.28)",
              }}
            >
              + New Task
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} style={{ fontSize: 12, fontWeight: 900, color: theme.subtext, padding: "6px 8px" }}>
                {d}
              </div>
            ))}

            {cells.map((c, idx) => {
              const key = yyyyMmDd(c.date);
              const dayTasks = tasksByDueDate.get(key) || [];
              const count = dayTasks.length;
              const selected = key === selectedDay;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDay(key)}
                  style={{
                    background: selected ? (darkMode ? "#203455" : "#CFE6FF") : theme.cardBg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 14,
                    padding: 10,
                    minHeight: 84,
                    cursor: "pointer",
                    opacity: c.inMonth ? 1 : 0.45,
                    boxShadow: selected ? "0 12px 24px rgba(0,0,0,0.10)" : "0 6px 12px rgba(0,0,0,0.05)",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 950, fontSize: 13 }}>
                      {c.date.getDate()}
                      {c.isToday ? <span style={{ marginLeft: 6, fontSize: 11, color: theme.accent, fontWeight: 950 }}>●</span> : null}
                    </div>
                    {count > 0 && (
                      <span
                        style={{
                          background: theme.accent,
                          color: "white",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 900,
                        }}
                      >
                        {count}
                      </span>
                    )}
                  </div>

                  {/* show up to 2 task titles as preview */}
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                    {dayTasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        style={{
                          fontSize: 11,
                          color: theme.text,
                          borderLeft: `4px solid ${PRIORITY_COLORS_PASTEL[t.priority] || theme.accent}`,
                          paddingLeft: 8,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontWeight: 800,
                        }}
                        title={t.title}
                      >
                        {t.title}
                      </div>
                    ))}
                    {count > 2 && <div style={{ fontSize: 11, color: theme.subtext }}>+ {count - 2} more</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected day details */}
          <div style={{ marginTop: 16, background: theme.toolbarBg, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 950 }}>
                Tasks due on <span style={{ color: theme.accent }}>{selectedDay}</span>
              </div>
              <div style={{ fontSize: 12, color: theme.subtext }}>
                Tip: month view shows tasks by <b>Due Date</b>
              </div>
            </div>

            {selectedDayTasks.length === 0 ? (
              <div style={{ marginTop: 10, color: theme.subtext }}>No tasks due on this day.</div>
            ) : (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                {selectedDayTasks.map((t) => {
                  const bucketName = buckets.find((b) => b.id === t.bucketId)?.name || "Unknown";
                  return (
                    <div
                      key={t.id}
                      style={{
                        background: theme.cardBg,
                        borderRadius: 14,
                        border: `1px solid ${theme.border}`,
                        padding: 12,
                        borderLeft: `6px solid ${PRIORITY_COLORS_PASTEL[t.priority] || theme.accent}`,
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ minWidth: 240, flex: 1 }}>
                        <div style={{ fontWeight: 950, marginBottom: 4 }}>{t.title}</div>
                        <div style={{ fontSize: 12, color: theme.subtext }}>
                          {bucketName} • {t.column} • {PRIORITY_EMOJI[t.priority]} {t.priority}
                        </div>
                        {t.assignee && <div style={{ fontSize: 12, color: theme.subtext, marginTop: 4 }}>👤 {t.assignee}</div>}
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          onClick={() => {
                            setCurrentBucketId(t.bucketId);
                            setView("board");
                            setViewingTaskId(t.id);
                          }}
                          style={{
                            border: "none",
                            borderRadius: 12,
                            padding: "8px 10px",
                            background: theme.accent,
                            color: "white",
                            cursor: "pointer",
                            fontWeight: 950,
                          }}
                        >
                          Open on Board
                        </button>

                        <button
                          onClick={() => openEditTask(t)}
                          style={{
                            border: `1px solid ${theme.accent}`,
                            borderRadius: 12,
                            padding: "8px 10px",
                            background: "transparent",
                            color: theme.accent,
                            cursor: "pointer",
                            fontWeight: 950,
                          }}
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

      {/* ---------------------------
          Task Modal
         -------------------------- */}
      {showTaskModal && (
        <div
          onClick={() => setShowTaskModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 560,
              background: theme.cardBg,
              border: `1px solid ${theme.border}`,
              borderRadius: 18,
              padding: 18,
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 950, marginBottom: 12 }}>
              {editingTaskId ? "✏️ Edit Task" : "➕ New Task"}
            </div>

            <label style={{ fontSize: 12, fontWeight: 900, color: theme.subtext }}>Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              style={{
                width: "100%",
                marginTop: 6,
                marginBottom: 12,
                padding: "10px 12px",
                borderRadius: 12,
                border: `1px solid ${theme.inputBorder}`,
                background: theme.inputBg,
                color: theme.text,
                fontSize: 14,
              }}
              placeholder="What needs to be done?"
            />

            <label style={{ fontSize: 12, fontWeight: 900, color: theme.subtext }}>Assigned To</label>
            <input
              value={form.assignee}
              onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
              style={{
                width: "100%",
                marginTop: 6,
                marginBottom: 12,
                padding: "10px 12px",
                borderRadius: 12,
                border: `1px solid ${theme.inputBorder}`,
                background: theme.inputBg,
                color: theme.text,
                fontSize: 14,
              }}
              placeholder="Name (optional)"
            />

            <label style={{ fontSize: 12, fontWeight: 900, color: theme.subtext }}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              style={{
                width: "100%",
                marginTop: 6,
                marginBottom: 12,
                padding: "10px 12px",
                borderRadius: 12,
                border: `1px solid ${theme.inputBorder}`,
                background: theme.inputBg,
                color: theme.text,
                fontSize: 14,
                resize: "vertical",
              }}
              placeholder="Details, links, notes..."
            />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label style={{ fontSize: 12, fontWeight: 900, color: theme.subtext }}>Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: `1px solid ${theme.inputBorder}`,
                    background: theme.inputBg,
                    color: theme.text,
                    fontSize: 14,
                  }}
                >
                  <option value="Urgent">🔴 Urgent</option>
                  <option value="High">🟠 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">🟢 Low</option>
                </select>
              </div>

              <div style={{ flex: 1, minWidth: 180 }}>
                <label style={{ fontSize: 12, fontWeight: 900, color: theme.subtext }}>Column</label>
                <select
                  value={form.column}
                  onChange={(e) => setForm((f) => ({ ...f, column: e.target.value }))}
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: `1px solid ${theme.inputBorder}`,
                    background: theme.inputBg,
                    color: theme.text,
                    fontSize: 14,
                  }}
                >
                  {COLUMNS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label style={{ fontSize: 12, fontWeight: 900, color: theme.subtext }}>Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: `1px solid ${theme.inputBorder}`,
                    background: theme.inputBg,
                    color: theme.text,
                    fontSize: 14,
                  }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 180 }}>
                <label style={{ fontSize: 12, fontWeight: 900, color: theme.subtext }}>Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: `1px solid ${theme.inputBorder}`,
                    background: theme.inputBg,
                    color: theme.text,
                    fontSize: 14,
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 900, color: theme.subtext }}>📌 Pin</label>
              <button
                onClick={() => setForm((f) => ({ ...f, pinned: !f.pinned }))}
                style={{
                  border: "none",
                  borderRadius: 12,
                  padding: "8px 10px",
                  cursor: "pointer",
                  fontWeight: 900,
                  background: form.pinned ? "#E0A04E" : (darkMode ? "#2A3A58" : "#D3E6FB"),
                  color: form.pinned ? "white" : theme.text,
                }}
              >
                {form.pinned ? "Pinned" : "Not pinned"}
              </button>
            </div>

            <label style={{ fontSize: 12, fontWeight: 900, color: theme.subtext }}>Labels</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, marginBottom: 14 }}>
              {LABELS.map((l) => {
                const selected = form.labels.includes(l.name);
                return (
                  <button
                    key={l.name}
                    onClick={() => {
                      setForm((f) => ({
                        ...f,
                        labels: selected ? f.labels.filter((x) => x !== l.name) : [...f.labels, l.name],
                      }));
                    }}
                    style={{
                      border: "none",
                      borderRadius: 999,
                      padding: "6px 10px",
                      cursor: "pointer",
                      fontWeight: 900,
                      fontSize: 12,
                      background: selected ? l.color : (darkMode ? "#2A3A58" : "#E5F2FF"),
                      color: selected ? "white" : theme.text,
                    }}
                  >
                    {l.name}
                  </button>
                );
              })}
            </div>

            <label style={{ fontSize: 12, fontWeight: 900, color: theme.subtext }}>Checklist</label>
            <div style={{ marginTop: 8, marginBottom: 12 }}>
              {(form.checklist || []).map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 14 }}>{c.done ? "✅" : "⬜"}</span>
                  <span style={{ flex: 1, fontSize: 13, color: c.done ? theme.subtext : theme.text }}>
                    {c.text}
                  </span>
                  <button
                    onClick={() => setForm((f) => ({ ...f, checklist: f.checklist.filter((_, idx) => idx !== i) }))}
                    style={{ border: "none", background: "transparent", cursor: "pointer", color: "#E36A6A", fontWeight: 900 }}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                onClick={() => {
                  const txt = prompt("Checklist item:");
                  if (!txt) return;
                  setForm((f) => ({ ...f, checklist: [...(f.checklist || []), { text: txt, done: false }] }));
                }}
                style={{
                  border: `1px dashed ${theme.inputBorder}`,
                  background: "transparent",
                  color: theme.subtext,
                  borderRadius: 12,
                  padding: "8px 10px",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                + Add checklist item
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setShowTaskModal(false)}
                style={{
                  border: `1px solid ${theme.inputBorder}`,
                  background: theme.inputBg,
                  color: theme.text,
                  borderRadius: 12,
                  padding: "10px 12px",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                Cancel
              </button>
              <button
                onClick={upsertTask}
                style={{
                  border: "none",
                  background: theme.accent,
                  color: "white",
                  borderRadius: 12,
                  padding: "10px 14px",
                  cursor: "pointer",
                  fontWeight: 950,
                }}
              >
                {editingTaskId ? "Save Changes" : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------
          Bucket Modal
         -------------------------- */}
      {showBucketModal && (
        <div
          onClick={() => setShowBucketModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 420,
              background: theme.cardBg,
              border: `1px solid ${theme.border}`,
              borderRadius: 18,
              padding: 18,
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 950, marginBottom: 12 }}>
              {editingBucketId ? "✏️ Rename Bucket" : "📂 New Bucket"}
            </div>

            <input
              value={bucketFormName}
              onChange={(e) => setBucketFormName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveBucket();
              }}
              placeholder="Bucket name"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: `1px solid ${theme.inputBorder}`,
                background: theme.inputBg,
                color: theme.text,
                fontSize: 14,
                marginBottom: 14,
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setShowBucketModal(false)}
                style={{
                  border: `1px solid ${theme.inputBorder}`,
                  background: theme.inputBg,
                  color: theme.text,
                  borderRadius: 12,
                  padding: "10px 12px",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveBucket}
                style={{
                  border: "none",
                  background: theme.accent,
                  color: "white",
                  borderRadius: 12,
                  padding: "10px 14px",
                  cursor: "pointer",
                  fontWeight: 950,
                }}
              >
                {editingBucketId ? "Save" : "Create Bucket"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------
          Sync Modal
         -------------------------- */}
      {showSyncModal && (
        <div
          onClick={() => setShowSyncModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 620,
              background: theme.cardBg,
              border: `1px solid ${theme.border}`,
              borderRadius: 18,
              padding: 18,
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 950, marginBottom: 12 }}>🔄 Sync Between Devices</div>

            <div style={{ background: darkMode ? "#13213A" : "#F4FAFF", border: `1px solid ${theme.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <div style={{ fontWeight: 950, marginBottom: 6 }}>📤 Export from THIS device</div>
              <div style={{ fontSize: 12, color: theme.subtext, marginBottom: 8 }}>
                Copy this code and paste it into the Import box on your other device.
              </div>
              <textarea
                readOnly
                value={syncExportCode}
                onClick={(e) => e.target.select()}
                style={{
                  width: "100%",
                  height: 120,
                  padding: 10,
                  borderRadius: 12,
                  border: `1px solid ${theme.inputBorder}`,
                  background: theme.inputBg,
                  color: theme.text,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: 11,
                  resize: "none",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button
                  onClick={copySyncCode}
                  style={{
                    border: "none",
                    background: theme.accent,
                    color: "white",
                    borderRadius: 12,
                    padding: "10px 12px",
                    cursor: "pointer",
                    fontWeight: 950,
                  }}
                >
                  📋 Copy Code
                </button>
              </div>
            </div>

            <div style={{ background: darkMode ? "#152B1E" : "#F2FFF6", border: `1px solid ${theme.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <div style={{ fontWeight: 950, marginBottom: 6 }}>📥 Import on THIS device</div>
              <div style={{ fontSize: 12, color: theme.subtext, marginBottom: 8 }}>
                Paste the code from your other device here, then import.
              </div>

              <textarea
                value={syncImportCode}
                onChange={(e) => setSyncImportCode(e.target.value)}
                placeholder="Paste sync code here..."
                style={{
                  width: "100%",
                  height: 120,
                  padding: 10,
                  borderRadius: 12,
                  border: `1px solid ${theme.inputBorder}`,
                  background: theme.inputBg,
                  color: theme.text,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: 11,
                  resize: "none",
                }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button
                  onClick={importSyncCode}
                  style={{
                    border: "none",
                    background: "#53B37D",
                    color: "white",
                    borderRadius: 12,
                    padding: "10px 12px",
                    cursor: "pointer",
                    fontWeight: 950,
                  }}
                >
                  📥 Import Tasks
                </button>
              </div>
            </div>

            {syncMessage && (
              <div style={{ padding: 10, borderRadius: 12, background: darkMode ? "#2A3A58" : "#E6F3FF", color: theme.text, fontWeight: 900 }}>
                {syncMessage}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button
                onClick={() => setShowSyncModal(false)}
                style={{
                  border: `1px solid ${theme.inputBorder}`,
                  background: theme.inputBg,
                  color: theme.text,
                  borderRadius: 12,
                  padding: "10px 12px",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
