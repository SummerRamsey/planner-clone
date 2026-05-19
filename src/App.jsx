import { useState, useEffect, useMemo } from "react"

var uid = function() { return Math.random().toString(36).slice(2, 10) }

var safeParse = function(s, fallback) {
  try { var v = JSON.parse(s); return v != null ? v : fallback }
  catch(e) { return fallback }
}

var encodeSync = function(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
}

var decodeSync = function(code) {
  return JSON.parse(decodeURIComponent(escape(atob(code.trim()))))
}

var yyyyMmDd = function(d) {
  var dt = new Date(d)
  var y = dt.getFullYear()
  var m = String(dt.getMonth() + 1).padStart(2, "0")
  var day = String(dt.getDate()).padStart(2, "0")
  return y + "-" + m + "-" + day
}

var startOfMonth = function(d) { return new Date(d.getFullYear(), d.getMonth(), 1) }
var addMonths = function(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1) }

var getCalendarGrid = function(monthDate) {
  var first = startOfMonth(monthDate)
  var startIdx = first.getDay()
  var gridStart = new Date(first)
  gridStart.setDate(first.getDate() - startIdx)
  var cells = []
  for (var i = 0; i < 42; i++) {
    var d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    cells.push({ date: d, inMonth: d.getMonth() === monthDate.getMonth(), isToday: yyyyMmDd(d) === yyyyMmDd(new Date()) })
  }
  return cells
}

var COLUMNS = ["To Do", "In Progress", "Review", "Done"]

var DEFAULT_BUCKETS = [
  { id: "saddleside", name: "Saddleside" },
  { id: "legacy", name: "Legacy Fields" },
  { id: "lonestar", name: "Lonestar" },
  { id: "alpha", name: "Alpha Ranch" },
  { id: "willow", name: "Willowstone" },
  { id: "other", name: "Other" }
]

var PRIORITY_ORDER = { Urgent: 0, High: 1, Medium: 2, Low: 3 }
var PRIORITY_EMOJI = { Urgent: "💗", High: "❤️", Medium: "💜", Low: "💚" }
var PRIORITY_COLORS = { Urgent: "#F7C2D4", High: "#F3B3B3", Medium: "#DCC8F7", Low: "#C8F0D7" }

var LABELS = [
  { name: "Important", color: "#F3B3B3" },
  { name: "Call", color: "#F7C2D4" },
  { name: "Docs", color: "#DCC8F7" },
  { name: "Follow-up", color: "#C8F0D7" },
  { name: "Meeting", color: "#F6D7A9" },
  { name: "Personal", color: "#BEE9F7" }
]

var BUCKET_DOTS = { saddleside: "#BFD7F2", legacy: "#BFEAD2", lonestar: "#F6D7C3", alpha: "#DCC8F7", willow: "#BEE9F7", other: "#D6DCE6" }

var TH = {
  bg: "#FBF7FF",
  header: "linear-gradient(135deg, #DCE7F6 0%, #EADCF6 50%, #F6DCEB 100%)",
  text: "#2E3A4A",
  sub: "#6B7A90",
  shadow: "0 12px 30px rgba(30,60,90,0.08)",
  border: "1px solid rgba(200,214,235,0.55)",
  pill: "rgba(255,255,255,0.65)",
  accent: "#B39DDB",
  accent2: "#F7A9C4",
  accent3: "#A7DCC3",
  input: "rgba(255,255,255,0.85)"
}

var pillStyle = function(active) {
  return { border: "none", borderRadius: 999, padding: "10px 14px", cursor: "pointer", fontWeight: 800, fontSize: 13, color: TH.text, background: active ? "rgba(255,255,255,0.92)" : TH.pill, boxShadow: active ? "0 10px 24px rgba(0,0,0,0.06)" : "none" }
}

var btnStyle = function(bg) {
  return { border: "none", borderRadius: 14, padding: "10px 14px", cursor: "pointer", fontWeight: 900, color: "#fff", background: bg, boxShadow: "0 14px 28px rgba(0,0,0,0.10)" }
}

var makeTask = function(id, created, bid, f) {
  return { id: id, createdAt: created, bucketId: bid, title: f.title, notes: f.notes, priority: f.priority, startDate: f.startDate, dueDate: f.dueDate, column: f.column, labels: f.labels, checklist: f.checklist, assignee: f.assignee, pinned: f.pinned, comments: f.comments }
}

export default function App() {
  var s = function(key, fb) { return safeParse(localStorage.getItem(key), fb) }

  var [view, setView] = useState(function() { return localStorage.getItem("p_view") || "board" })
  var [buckets, setBuckets] = useState(function() { return s("p_buckets", DEFAULT_BUCKETS) })
  var [curBucket, setCurBucket] = useState(function() { return localStorage.getItem("p_currentBucket") || "saddleside" })
  var [tasks, setTasks] = useState(function() { return s("p_tasks", []) })
  var [search, setSearch] = useState("")
  var [filterP, setFilterP] = useState("All")
  var [sortBy, setSortBy] = useState("none")
  var [viewTask, setViewTask] = useState(null)
  var [dragId, setDragId] = useState(null)
  var [showTask, setShowTask] = useState(false)
  var [editId, setEditId] = useState(null)
  var [showBucket, setShowBucket] = useState(false)
  var [bName, setBName] = useState("")
  var [editBId, setEditBId] = useState(null)
  var [showSync, setShowSync] = useState(false)
  var [syncExp, setSyncExp] = useState("")
  var [syncImp, setSyncImp] = useState("")
  var [syncMsg, setSyncMsg] = useState("")
  var [monthC, setMonthC] = useState(function() { return startOfMonth(new Date()) })
  var [selDay, setSelDay] = useState(function() { return yyyyMmDd(new Date()) })

  var [form, setForm] = useState({ title: "", notes: "", priority: "Medium", startDate: "", dueDate: "", column: "To Do", labels: [], checklist: [], assignee: "", pinned: false, comments: [] })

  useEffect(function() { localStorage.setItem("p_view", view) }, [view])
  useEffect(function() { localStorage.setItem("p_buckets", JSON.stringify(buckets)) }, [buckets])
  useEffect(function() { localStorage.setItem("p_currentBucket", curBucket) }, [curBucket])
  useEffect(function() { localStorage.setItem("p_tasks", JSON.stringify(tasks)) }, [tasks])

  var bucket = useMemo(function() {
    for (var i = 0; i < buckets.length; i++) { if (buckets[i].id === curBucket) return buckets[i] }
    return buckets[0]
  }, [buckets, curBucket])

  var bTasks = useMemo(function() {
    return tasks.filter(function(t) { return t.bucketId === curBucket })
  }, [tasks, curBucket])

  var isOD = function(t) {
    if (!t.dueDate || t.column === "Done") return false
    var today = new Date(); today.setHours(0,0,0,0)
    var due = new Date(t.dueDate); due.setHours(0,0,0,0)
    return due < today
  }

  var isDT = function(t) { return t.dueDate && yyyyMmDd(t.dueDate) === yyyyMmDd(new Date()) && t.column !== "Done" }

  var isDS = function(t) {
    if (!t.dueDate || t.column === "Done") return false
    if (isOD(t) || isDT(t)) return false
    var today = new Date(); today.setHours(0,0,0,0)
    var due = new Date(t.dueDate); due.setHours(0,0,0,0)
    var diff = (due - today) / 86400000
    return diff > 0 && diff <= 3
  }

  var getProg = function(t) {
    if (!t.checklist || t.checklist.length === 0) return null
    var done = 0
    for (var i = 0; i < t.checklist.length; i++) { if (t.checklist[i].done) done++ }
    return Math.round((done / t.checklist.length) * 100)
  }

  var filtered = useMemo(function() {
    var q = search.trim().toLowerCase()
    return bTasks.filter(function(t) {
      var ms = !q || t.title.toLowerCase().indexOf(q) >= 0 || (t.notes || "").toLowerCase().indexOf(q) >= 0 || (t.assignee || "").toLowerCase().indexOf(q) >= 0
      var mp = filterP === "All" || t.priority === filterP
      return ms && mp
    })
  }, [bTasks, search, filterP])

  var doSort = function(list) {
    var p = list.filter(function(t) { return t.pinned })
    var r = list.filter(function(t) { return !t.pinned })
    if (sortBy === "priority") { r.sort(function(a, b) { return (PRIORITY_ORDER[a.priority] || 2) - (PRIORITY_ORDER[b.priority] || 2) }) }
    else if (sortBy === "dueDate") { r.sort(function(a, b) { if (!a.dueDate) return 1; if (!b.dueDate) return -1; return new Date(a.dueDate) - new Date(b.dueDate) }) }
    else if (sortBy === "name") { r.sort(function(a, b) { return a.title.localeCompare(b.title) }) }
    return p.concat(r)
  }

  var uf = function(field, value) {
    var f = { title: form.title, notes: form.notes, priority: form.priority, startDate: form.startDate, dueDate: form.dueDate, column: form.column, labels: form.labels, checklist: form.checklist, assignee: form.assignee, pinned: form.pinned, comments: form.comments }
    f[field] = value
    setForm(f)
  }

  var openSync = function() {
    setSyncExp(encodeSync({ v: 1, buckets: buckets, currentBucketId: curBucket, tasks: tasks }))
    setSyncImp(""); setSyncMsg(""); setShowSync(true)
  }

  var copySync = function() {
    navigator.clipboard.writeText(syncExp).then(function() { setSyncMsg("✅ Copied!") }).catch(function() { setSyncMsg("⚠️ Tap code → Select All → Copy.") })
  }

  var doImport = function() {
    if (!syncImp.trim()) { setSyncMsg("⚠️ Paste a code first."); return }
    try {
      var data = decodeSync(syncImp)
      if (Array.isArray(data.tasks)) setTasks(data.tasks)
      if (Array.isArray(data.buckets)) setBuckets(data.buckets)
      if (data.currentBucketId) setCurBucket(data.currentBucketId)
      setSyncMsg("✅ Imported!")
      setTimeout(function() { setShowSync(false); setSyncMsg("") }, 1200)
    } catch(e) { setSyncMsg("❌ Invalid code.") }
  }

  var openBE = function(b) {
    if (b) { setEditBId(b.id); setBName(b.name) } else { setEditBId(null); setBName("") }
    setShowBucket(true)
  }

  var saveB = function() {
    var name = bName.trim(); if (!name) return
    if (editBId) { setBuckets(buckets.map(function(b) { return b.id === editBId ? { id: b.id, name: name } : b })) }
    else { var id = uid(); setBuckets(buckets.concat([{ id: id, name: name }])); setCurBucket(id) }
    setShowBucket(false)
  }

  var delB = function(bid) {
    if (buckets.length <= 1) { alert("Need at least one bucket."); return }
    if (!confirm("Delete this bucket and all its tasks?")) return
    var rem = buckets.filter(function(b) { return b.id !== bid })
    setBuckets(rem)
    setTasks(tasks.filter(function(t) { return t.bucketId !== bid }))
    if (curBucket === bid) setCurBucket(rem[0].id)
  }

  var openNew = function(col) {
    setForm({ title: "", notes: "", priority: "Medium", startDate: "", dueDate: "", column: col || "To Do", labels: [], checklist: [], assignee: "", pinned: false, comments: [] })
    setEditId(null); setShowTask(true)
  }

  var openEdit = function(t) {
    setForm({ title: t.title, notes: t.notes || "", priority: t.priority, startDate: t.startDate || "", dueDate: t.dueDate || "", column: t.column, labels: t.labels || [], checklist: t.checklist || [], assignee: t.assignee || "", pinned: !!t.pinned, comments: t.comments || [] })
    setEditId(t.id); setShowTask(true)
  }

  var saveTask = function() {
    if (!form.title.trim()) { alert("Please enter a title."); return }
    if (editId) {
      setTasks(tasks.map(function(t) { return t.id === editId ? makeTask(t.id, t.createdAt, t.bucketId, form) : t }))
    } else {
      setTasks(tasks.concat([makeTask(uid(), new Date().toISOString(), curBucket, form)]))
    }
    setShowTask(false); setEditId(null)
  }

  var delTask = function(id) { if (!confirm("Delete?")) return; setTasks(tasks.filter(function(t) { return t.id !== id })); setViewTask(null) }

  var moveTask = function(id, col) {
    setTasks(tasks.map(function(t) {
      if (t.id !== id) return t
      return makeTask(t.id, t.createdAt, t.bucketId, { title: t.title, notes: t.notes, priority: t.priority, startDate: t.startDate, dueDate: t.dueDate, column: col, labels: t.labels, checklist: t.checklist, assignee: t.assignee, pinned: t.pinned, comments: t.comments })
    }))
  }

  var togPin = function(id) {
    setTasks(tasks.map(function(t) {
      if (t.id !== id) return t
      return makeTask(t.id, t.createdAt, t.bucketId, { title: t.title, notes: t.notes, priority: t.priority, startDate: t.startDate, dueDate: t.dueDate, column: t.column, labels: t.labels, checklist: t.checklist, assignee: t.assignee, pinned: !t.pinned, comments: t.comments })
    }))
  }

  var togCheck = function(tid, idx) {
    setTasks(tasks.map(function(t) {
      if (t.id !== tid) return t
      var cl = t.checklist.map(function(c, i) { return i === idx ? { text: c.text, done: !c.done } : c })
      return makeTask(t.id, t.createdAt, t.bucketId, { title: t.title, notes: t.notes, priority: t.priority, startDate: t.startDate, dueDate: t.dueDate, column: t.column, labels: t.labels, checklist: cl, assignee: t.assignee, pinned: t.pinned, comments: t.comments })
    }))
  }

  var addCom = function(tid) {
    var msg = prompt("Add comment:"); if (!msg) return
    setTasks(tasks.map(function(t) {
      if (t.id !== tid) return t
      return makeTask(t.id, t.createdAt, t.bucketId, { title: t.title, notes: t.notes, priority: t.priority, startDate: t.startDate, dueDate: t.dueDate, column: t.column, labels: t.labels, checklist: t.checklist, assignee: t.assignee, pinned: t.pinned, comments: (t.comments || []).concat([{ text: msg.trim(), date: new Date().toLocaleString() }]) })
    }))
  }

  var cells = useMemo(function() { return getCalendarGrid(monthC) }, [monthC])
  var byDate = useMemo(function() {
    var map = {}
    for (var i = 0; i < tasks.length; i++) { if (!tasks[i].dueDate) continue; var k = yyyyMmDd(tasks[i].dueDate); if (!map[k]) map[k] = []; map[k].push(tasks[i]) }
    return map
  }, [tasks])
  var dayTasks = byDate[selDay] || []

  var allT = tasks.length
  var allD = tasks.filter(function(t) { return t.column === "Done" }).length

  return (
    <div style={{ minHeight: "100vh", background: TH.bg, color: TH.text, fontFamily: "Segoe UI, system-ui, sans-serif" }}>
      <style>{".lift:hover{transform:translateY(-2px);box-shadow:0 18px 40px rgba(30,60,90,0.12)}.bl:hover{transform:translateY(-1px);box-shadow:0 18px 34px rgba(0,0,0,0.12)}::selection{background:rgba(247,169,196,0.45)}"}</style>

      <header style={{ background: TH.header, padding: 16, boxShadow: "0 18px 50px rgba(0,0,0,0.10)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 14, background: "rgba(255,255,255,0.85)", display: "grid", placeItems: "center", boxShadow: "0 12px 26px rgba(0,0,0,0.10)", fontSize: 20 }}>🧁</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 950 }}>My Planner</div>
              <div style={{ fontSize: 12, color: TH.sub, fontWeight: 700 }}>{"📊 " + allT + " • ✅ " + allD}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={pillStyle(view === "board")} onClick={function() { setView("board") }} className="bl">📋 Board</button>
            <button style={pillStyle(view === "month")} onClick={function() { setView("month") }} className="bl">🗓️ Month</button>
            <button style={pillStyle(false)} onClick={openSync} className="bl">🔄 Sync</button>
            <button style={pillStyle(false)} onClick={function() { openBE(null) }} className="bl">+ Bucket</button>
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {buckets.map(function(b) {
            var active = b.id === curBucket
            var count = tasks.filter(function(t) { return t.bucketId === b.id }).length
            var dot = BUCKET_DOTS[b.id] || TH.accent
            return (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button style={{ border: "none", borderRadius: "14px 14px 0 0", padding: "10px 14px", cursor: "pointer", fontSize: 13, fontWeight: active ? 950 : 700, background: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.45)", color: TH.text, boxShadow: active ? "0 10px 24px rgba(0,0,0,0.06)" : "none", display: "inline-flex", alignItems: "center", gap: 8 }} onClick={function() { setCurBucket(b.id); setViewTask(null) }} className="bl">
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: dot, display: "inline-block" }} />
                  {b.name}
                  <span style={{ opacity: 0.7, fontSize: 12 }}>{"(" + count + ")"}</span>
                </button>
                {active && (
                  <span style={{ display: "inline-flex", gap: 2 }}>
                    <button onClick={function() { openBE(b) }} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 13 }}>✏️</button>
                    <button onClick={function() { delB(b.id) }} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 13, color: "#D36C7D" }}>✕</button>
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </header>

      <div style={{ padding: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={function(e) { setSearch(e.target.value) }} placeholder={"Search in " + (bucket ? bucket.name : "") + "..."} style={{ flex: 1, minWidth: 220, padding: "12px 14px", borderRadius: 18, border: TH.border, background: TH.input, outline: "none", boxShadow: "0 10px 24px rgba(0,0,0,0.06)", fontWeight: 700, color: TH.text }} />
        <select value={filterP} onChange={function(e) { setFilterP(e.target.value) }} style={{ padding: "12px 14px", borderRadius: 18, border: TH.border, background: TH.input, fontWeight: 800, color: TH.text }}>
          <option value="All">All priorities</option>
          <option value="Urgent">💗 Urgent</option>
          <option value="High">❤️ High</option>
          <option value="Medium">💜 Medium</option>
          <option value="Low">💚 Low</option>
        </select>
        <select value={sortBy} onChange={function(e) { setSortBy(e.target.value) }} style={{ padding: "12px 14px", borderRadius: 18, border: TH.border, background: TH.input, fontWeight: 800, color: TH.text }}>
          <option value="none">Sort: default</option>
          <option value="priority">Sort: priority</option>
          <option value="dueDate">Sort: due date</option>
          <option value="name">Sort: name</option>
        </select>
        <button onClick={function() { openNew("To Do") }} style={btnStyle(TH.accent)} className="bl">+ New Task</button>
      </div>

      {view === "board" && (
        <div style={{ padding: 14, display: "flex", gap: 14, overflowX: "auto" }}>
          {COLUMNS.map(function(col) {
            var colT = doSort(filtered.filter(function(t) { return t.column === col }))
            return (
              <div key={col} onDragOver={function(e) { e.preventDefault() }} onDrop={function() { if (dragId) { moveTask(dragId, col); setDragId(null) } }} style={{ minWidth: 300, maxWidth: 400, flex: 1, background: "rgba(255,255,255,0.55)", border: TH.border, borderRadius: 24, padding: 14, boxShadow: "0 18px 40px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 950, fontSize: 15 }}>{col}</div>
                  <div style={{ width: 28, height: 28, borderRadius: 999, background: "rgba(179,157,219,0.25)", display: "grid", placeItems: "center", fontWeight: 950, fontSize: 13 }}>{colT.length}</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {colT.map(function(t) {
                    var exp = viewTask === t.id
                    var prog = getProg(t)
                    var od = isOD(t)
                    var dt = isDT(t)
                    var ds = isDS(t)
                    var tint = PRIORITY_COLORS[t.priority] + "55"

                    return (
                      <div key={t.id} draggable={true} onDragStart={function() { setDragId(t.id) }} onClick={function() { setViewTask(exp ? null : t.id) }} className="lift" style={{ background: tint, border: "1px solid rgba(0,0,0,0.03)", borderLeft: "10px solid " + PRIORITY_COLORS[t.priority], borderRadius: 22, padding: 12, cursor: "pointer", boxShadow: TH.shadow }}>
                        {t.pinned && <div style={{ fontSize: 11, fontWeight: 950, color: "#7B6AA9", marginBottom: 4 }}>📌 PINNED</div>}

                        {t.labels && t.labels.length > 0 && (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                            {t.labels.map(function(l) {
                              var lo = null; for (var li = 0; li < LABELS.length; li++) { if (LABELS[li].name === l) lo = LABELS[li] }
                              return <span key={l} style={{ background: lo ? lo.color : "#9AA7B3", color: "white", padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 800 }}>{l}</span>
                            })}
                          </div>
                        )}

                        <div style={{ fontSize: 14, fontWeight: 950, marginBottom: 4 }}>{t.title}</div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ padding: "3px 10px", borderRadius: 999, background: "rgba(255,255,255,0.65)", fontWeight: 900, fontSize: 12 }}>{PRIORITY_EMOJI[t.priority] + " " + t.priority}</span>
                          {t.assignee && <span style={{ fontSize: 12, fontWeight: 800, color: "#44546B" }}>{"👤 " + t.assignee}</span>}
                          {od && <span style={{ fontSize: 11, fontWeight: 950, color: "#B5475A" }}>⚠️ OVERDUE</span>}
                          {dt && <span style={{ fontSize: 11, fontWeight: 950, color: "#B1762B" }}>📌 TODAY</span>}
                          {ds && <span style={{ fontSize: 11, fontWeight: 950, color: "#8E7A2A" }}>🔔 SOON</span>}
                        </div>

                        {(t.startDate || t.dueDate) && (
                          <div style={{ fontSize: 12, fontWeight: 800, color: TH.sub, marginBottom: 6 }}>
                            {t.startDate && <div>{"📅 Start: " + t.startDate}</div>}
                            {t.dueDate && <div>{"⏰ Due: " + t.dueDate}</div>}
                          </div>
                        )}

                        {prog !== null && (
                          <div style={{ marginBottom: 6 }}>
                            <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.65)", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: prog + "%", background: prog === 100 ? "#7FC49B" : "#7FB7D9" }} />
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 900, color: TH.sub, marginTop: 4 }}>{prog + "%"}</div>
                          </div>
                        )}

                        {!exp && t.comments && t.comments.length > 0 && (
                          <div style={{ fontSize: 11, fontWeight: 800, color: TH.sub }}>{"💬 " + t.comments.length + (t.comments.length === 1 ? " comment" : " comments")}</div>
                        )}

                        {exp && (
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.7)" }}>
                            {t.notes && (
                              <div style={{ marginBottom: 10 }}>
                                <div style={{ fontSize: 12, fontWeight: 950, marginBottom: 4 }}>📝 Notes</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#3A485B", whiteSpace: "pre-wrap" }}>{t.notes}</div>
                              </div>
                            )}

                            {t.checklist && t.checklist.length > 0 && (
                              <div style={{ marginBottom: 10 }}>
                                <div style={{ fontSize: 12, fontWeight: 950, marginBottom: 6 }}>☑️ Checklist</div>
                                {t.checklist.map(function(c, i) {
                                  return (
                                    <div key={i} onClick={function(e) { e.stopPropagation(); togCheck(t.id, i) }} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, padding: "3px 0", fontWeight: 750, cursor: "pointer" }}>
                                      <span>{c.done ? "✅" : "⬜"}</span>
                                      <span style={{ textDecoration: c.done ? "line-through" : "none", color: c.done ? TH.sub : TH.text }}>{c.text}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {t.comments && t.comments.length > 0 && (
                              <div style={{ marginBottom: 10 }}>
                                <div style={{ fontSize: 12, fontWeight: 950, marginBottom: 6 }}>💬 Comments</div>
                                {t.comments.map(function(c, i) {
                                  return (
                                    <div key={i} style={{ background: "rgba(255,255,255,0.65)", borderRadius: 14, padding: 10, marginBottom: 6 }}>
                                      <div style={{ fontSize: 13 }}>{c.text}</div>
                                      <div style={{ fontSize: 11, color: TH.sub, marginTop: 4 }}>{c.date}</div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                              {COLUMNS.filter(function(c) { return c !== t.column }).map(function(c) {
                                return <button key={c} onClick={function(e) { e.stopPropagation(); moveTask(t.id, c) }} style={{ border: "none", background: "rgba(255,255,255,0.75)", borderRadius: 999, padding: "8px 10px", cursor: "pointer", fontWeight: 900, fontSize: 12, color: "#4A5568" }} className="bl">{"→ " + c}</button>
                              })}
                            </div>

                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <button onClick={function(e) { e.stopPropagation(); togPin(t.id) }} style={btnStyle(t.pinned ? TH.accent2 : TH.accent)} className="bl">{t.pinned ? "📌 Unpin" : "📌 Pin"}</button>
                              <button onClick={function(e) { e.stopPropagation(); openEdit(t) }} style={btnStyle("#7FB7D9")} className="bl">✏️ Edit</button>
                              <button onClick={function(e) { e.stopPropagation(); addCom(t.id) }} style={btnStyle("#F0A9C2")} className="bl">💬</button>
                              <button onClick={function(e) { e.stopPropagation(); delTask(t.id) }} style={btnStyle("#D36C7D")} className="bl">🗑️</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <button onClick={function() { openNew(col) }} style={{ width: "100%", marginTop: 12, padding: 12, borderRadius: 22, border: "2px dashed rgba(179,157,219,0.55)", background: "rgba(255,255,255,0.55)", cursor: "pointer", fontWeight: 950, color: "#6B7A90" }} className="bl">+ Add Task</button>
              </div>
            )
          })}
        </div>
      )}

      {view === "month" && (
        <div style={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button style={pillStyle(false)} className="bl" onClick={function() { setMonthC(addMonths(monthC, -1)) }}>◀</button>
              <div style={{ fontSize: 18, fontWeight: 950 }}>{monthC.toLocaleString(undefined, { month: "long", year: "numeric" })}</div>
              <button style={pillStyle(false)} className="bl" onClick={function() { setMonthC(addMonths(monthC, 1)) }}>▶</button>
              <button style={btnStyle("#7FB7D9")} className="bl" onClick={function() { setMonthC(startOfMonth(new Date())); setSelDay(yyyyMmDd(new Date())) }}>Today</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(function(d) { return <div key={d} style={{ fontWeight: 950, fontSize: 12, color: TH.sub, padding: "0 8px" }}>{d}</div> })}
            {cells.map(function(c, idx) {
              var key = yyyyMmDd(c.date)
              var dt2 = byDate[key] || []
              var sel = key === selDay
              return (
                <div key={idx} onClick={function() { setSelDay(key) }} className="lift" style={{ background: sel ? "rgba(179,157,219,0.25)" : "rgba(255,255,255,0.70)", border: TH.border, borderRadius: 22, padding: 12, minHeight: 92, cursor: "pointer", opacity: c.inMonth ? 1 : 0.45, boxShadow: TH.shadow }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 950 }}>{c.date.getDate()}{c.isToday && <span style={{ marginLeft: 6, color: TH.accent2 }}>●</span>}</div>
                    {dt2.length > 0 && <div style={{ padding: "4px 10px", borderRadius: 999, background: "rgba(255,255,255,0.75)", fontWeight: 950, fontSize: 12 }}>{dt2.length}</div>}
                  </div>
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                    {dt2.slice(0, 2).map(function(t) { return <div key={t.id} style={{ borderLeft: "8px solid " + PRIORITY_COLORS[t.priority], paddingLeft: 8, fontSize: 11, fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div> })}
                    {dt2.length > 2 && <div style={{ fontSize: 11, fontWeight: 800, color: TH.sub }}>{"+ " + (dt2.length - 2) + " more"}</div>}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: 16, background: "rgba(255,255,255,0.75)", border: TH.border, borderRadius: 24, padding: 14, boxShadow: TH.shadow }}>
            <div style={{ fontWeight: 950 }}>{"Tasks due on "}<span style={{ color: TH.accent }}>{selDay}</span></div>
            {dayTasks.length === 0 ? (
              <div style={{ marginTop: 10, color: TH.sub, fontWeight: 800 }}>No tasks due this day.</div>
            ) : (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                {dayTasks.map(function(t) {
                  var bn = "?"; for (var i = 0; i < buckets.length; i++) { if (buckets[i].id === t.bucketId) bn = buckets[i].name }
                  return (
                    <div key={t.id} className="lift" style={{ background: PRIORITY_COLORS[t.priority] + "55", borderRadius: 22, padding: 12, borderLeft: "10px solid " + PRIORITY_COLORS[t.priority], boxShadow: TH.shadow }}>
                      <div style={{ fontWeight: 950 }}>{t.title}</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: TH.sub, marginTop: 4 }}>{bn + " • " + t.column + " • " + PRIORITY_EMOJI[t.priority] + " " + t.priority}</div>
                      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                        <button style={btnStyle("#7FB7D9")} className="bl" onClick={function() { setCurBucket(t.bucketId); setView("board"); setViewTask(t.id) }}>Open on Board</button>
                        <button style={btnStyle(TH.accent)} className="bl" onClick={function() { openEdit(t) }}>✏️ Edit</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {showTask && (
        <div onClick={function() { setShowTask(false) }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 14 }}>
          <div onClick={function(e) { e.stopPropagation() }} style={{ width: "100%", maxWidth: 640, background: "rgba(255,255,255,0.95)", border: TH.border, borderRadius: 28, padding: 16, boxShadow: "0 30px 80px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontSize: 18, fontWeight: 950, marginBottom: 10 }}>{editId ? "✏️ Edit Task" : "➕ New Task"}</div>

            <label style={{ fontSize: 12, fontWeight: 900, color: TH.sub }}>Title *</label>
            <input value={form.title} onChange={function(e) { uf("title", e.target.value) }} placeholder="What needs to be done?" style={{ width: "100%", marginTop: 6, marginBottom: 10, padding: "12px 14px", borderRadius: 18, border: TH.border, background: TH.input, fontWeight: 800, boxSizing: "border-box" }} />

            <label style={{ fontSize: 12, fontWeight: 900, color: TH.sub }}>Assigned To</label>
            <input value={form.assignee} onChange={function(e) { uf("assignee", e.target.value) }} placeholder="Who?" style={{ width: "100%", marginTop: 6, marginBottom: 10, padding: "12px 14px", borderRadius: 18, border: TH.border, background: TH.input, fontWeight: 800, boxSizing: "border-box" }} />

            <label style={{ fontSize: 12, fontWeight: 900, color: TH.sub }}>Notes</label>
            <textarea value={form.notes} onChange={function(e) { uf("notes", e.target.value) }} rows={3} placeholder="Details…" style={{ width: "100%", marginTop: 6, marginBottom: 10, padding: "12px 14px", borderRadius: 18, border: TH.border, background: TH.input, fontWeight: 750, resize: "vertical", boxSizing: "border-box" }} />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: 12, fontWeight: 900, color: TH.sub }}>Priority</label>
                <select value={form.priority} onChange={function(e) { uf("priority", e.target.value) }} style={{ width: "100%", marginTop: 6, padding: "12px 14px", borderRadius: 18, border: TH.border, background: TH.input, fontWeight: 900 }}>
                  <option value="Urgent">💗 Urgent</option>
                  <option value="High">❤️ High</option>
                  <option value="Medium">💜 Medium</option>
                  <option value="Low">💚 Low</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: 12, fontWeight: 900, color: TH.sub }}>Status</label>
                <select value={form.column} onChange={function(e) { uf("column", e.target.value) }} style={{ width: "100%", marginTop: 6, padding: "12px 14px", borderRadius: 18, border: TH.border, background: TH.input, fontWeight: 900 }}>
                  {COLUMNS.map(function(c) { return <option key={c} value={c}>{c}</option> })}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: 12, fontWeight: 900, color: TH.sub }}>Start Date</label>
                <input type="date" value={form.startDate} onChange={function(e) { uf("startDate", e.target.value) }} style={{ width: "100%", marginTop: 6, padding: "12px 14px", borderRadius: 18, border: TH.border, background: TH.input, fontWeight: 850, boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: 12, fontWeight: 900, color: TH.sub }}>Due Date</label>
                <input type="date" value={form.dueDate} onChange={function(e) { uf("dueDate", e.target.value) }} style={{ width: "100%", marginTop: 6, padding: "12px 14px", borderRadius: 18, border: TH.border, background: TH.input, fontWeight: 850, boxSizing: "border-box" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
              <button onClick={function() { uf("pinned", !form.pinned) }} style={btnStyle(form.pinned ? TH.accent2 : TH.accent)} className="bl">{form.pinned ? "📌 Pinned" : "📌 Pin"}</button>
              <button onClick={function() { var txt = prompt("Checklist item:"); if (!txt) return; uf("checklist", form.checklist.concat([{ text: txt, done: false }])) }} style={btnStyle("#7FB7D9")} className="bl">+ Checklist</button>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {LABELS.map(function(l) {
                var sel = form.labels.indexOf(l.name) >= 0
                return <button key={l.name} onClick={function() { uf("labels", sel ? form.labels.filter(function(x) { return x !== l.name }) : form.labels.concat([l.name])) }} style={{ border: "none", borderRadius: 999, padding: "6px 10px", cursor: "pointer", fontWeight: 900, fontSize: 12, background: sel ? l.color : "rgba(255,255,255,0.65)", color: sel ? "#fff" : TH.text }}>{l.name}</button>
              })}
            </div>

            {form.checklist.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                {form.checklist.map(function(c, i) {
                  return (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <span>{c.done ? "✅" : "⬜"}</span>
                      <span style={{ flex: 1, fontSize: 13 }}>{c.text}</span>
                      <button onClick={function() { uf("checklist", form.checklist.filter(function(_, idx) { return idx !== i })) }} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#D36C7D", fontWeight: 900 }}>✕</button>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={function() { setShowTask(false) }} style={pillStyle(false)} className="bl">Cancel</button>
              <button onClick={saveTask} style={btnStyle(TH.accent)} className="bl">{editId ? "Save Changes" : "Create Task"}</button>
            </div>
          </div>
        </div>
      )}

      {showBucket && (
        <div onClick={function() { setShowBucket(false) }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 14 }}>
          <div onClick={function(e) { e.stopPropagation() }} style={{ width: "100%", maxWidth: 420, background: "rgba(255,255,255,0.95)", border: TH.border, borderRadius: 28, padding: 16, boxShadow: "0 30px 80px rgba(0,0,0,0.18)" }}>
            <div style={{ fontSize: 18, fontWeight: 950, marginBottom: 10 }}>{editBId ? "✏️ Rename Bucket" : "📂 New Bucket"}</div>
            <input value={bName} onChange={function(e) { setBName(e.target.value) }} onKeyDown={function(e) { if (e.key === "Enter") saveB() }} placeholder="Bucket name" style={{ width: "100%", padding: "12px 14px", borderRadius: 18, border: TH.border, background: TH.input, fontWeight: 850, boxSizing: "border-box" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
              <button onClick={function() { setShowBucket(false) }} style={pillStyle(false)} className="bl">Cancel</button>
              <button onClick={saveB} style={btnStyle(TH.accent)} className="bl">{editBId ? "Save" : "Create"}</button>
            </div>
          </div>
        </div>
      )}

      {showSync && (
        <div onClick={function() { setShowSync(false) }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 14 }}>
          <div onClick={function(e) { e.stopPropagation() }} style={{ width: "100%", maxWidth: 720, background: "rgba(255,255,255,0.95)", border: TH.border, borderRadius: 28, padding: 16, boxShadow: "0 30px 80px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontSize: 18, fontWeight: 950, marginBottom: 10 }}>🔄 Sync Between Devices</div>
            <div style={{ background: "rgba(247,169,196,0.12)", border: TH.border, borderRadius: 22, padding: 12, marginBottom: 10 }}>
              <div style={{ fontWeight: 950, marginBottom: 6 }}>📤 Export</div>
              <textarea readOnly={true} value={syncExp} onClick={function(e) { e.target.select() }} style={{ width: "100%", height: 120, padding: 12, borderRadius: 18, border: TH.border, background: "rgba(255,255,255,0.85)", fontFamily: "monospace", fontSize: 11, boxSizing: "border-box", resize: "none" }} />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button onClick={copySync} style={btnStyle(TH.accent2)} className="bl">📋 Copy Code</button>
              </div>
            </div>
            <div style={{ background: "rgba(167,220,195,0.12)", border: TH.border, borderRadius: 22, padding: 12, marginBottom: 10 }}>
              <div style={{ fontWeight: 950, marginBottom: 6 }}>📥 Import</div>
              <textarea value={syncImp} onChange={function(e) { setSyncImp(e.target.value) }} placeholder="Paste code here…" style={{ width: "100%", height: 120, padding: 12, borderRadius: 18, border: TH.border, background: "rgba(255,255,255,0.85)", fontFamily: "monospace", fontSize: 11, boxSizing: "border-box", resize: "none" }} />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button onClick={doImport} style={btnStyle(TH.accent3)} className="bl">📥 Import</button>
              </div>
            </div>
            {syncMsg && <div style={{ padding: 12, borderRadius: 18, background: "rgba(179,157,219,0.18)", border: TH.border, fontWeight: 900 }}>{syncMsg}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button onClick={function() { setShowSync(false) }} style={pillStyle(false)} className="bl">Close</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 22 }} />
    </div>
  )
}
