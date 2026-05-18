import { useState, useEffect } from "react"

var generateId = function() { return Math.random().toString(36).substr(2, 9) }
var defaultColumns = ["ToingTask, setViewingTask] = useState(null)var defaultColumns = ["To Do", "In Progress", "Review", "Done"]
  var [searchQuery, setSearchQuery] = useState("")
  var [filterPriority, setFilterPriority] = useState("All")
  var [newChecklistItem, setNewChecklistItem] = useState("")
  var [draggedTaskId, setDraggedTaskId] = useState(null)
  var [showBoardModal, setShowBoardModal] = useState(false)
  var [boardFormName, setBoardFormName] = useState("")
  var [editingBoardId, setEditingBoardId] = useState(null)
  var [showSyncModal, setShowSyncModal] = useState(false)
  var [syncExportCode, setSyncExportCode] = useState("")
  var [syncImportCode, setSyncImportCode] = useState("")
  var [syncMessage, setSyncMessage] = useState("")
  var [form, setForm] = useState({ title: "", notes: "", priority: "Medium", startDate: "", dueDate: "", column: "To Do", labels: [], checklist: [], assignee: "" })

  useEffect(function() {
    localStorage.setItem("planner-tasks-v2", JSON.stringify(tasks))
    localStorage.setItem("planner-boards", JSON.stringify(boards))
    localStorage.setItem("planner-dark", darkMode.toString())
  }, [tasks, boards, darkMode])
  useEffect(function() { localStorage.setItem("planner-current-board", currentBoardId) }, [currentBoardId])

  var handleExport = function() {
    var data = JSON.stringify({ tasks: tasks, boards: boards, darkMode: darkMode })
    var code = btoa(unescape(encodeURIComponent(data)))
    setSyncExportCode(code)
    setSyncImportCode("")
    setSyncMessage("")
    setShowSyncModal(true)
  }

  var handleImport = function() {
    if (!syncImportCode.trim()) { setSyncMessage("⚠️ Please paste a sync code first!"); return }
    try {
      var data = JSON.parse(decodeURIComponent(escape(atob(syncImportCode.trim()))))
      if (data.tasks) setTasks(data.tasks)
      if (data.boards) setBoards(data.boards)
      if (data.darkMode !== undefined) setDarkMode(data.darkMode)
      setSyncMessage("✅ Tasks imported successfully!")
      setTimeout(function() { setShowSyncModal(false); setSyncMessage("") }, 1500)
    } catch(e) {
      setSyncMessage("❌ Invalid code. Please copy the full code from your other device.")
    }
  }

  var handleCopyCode = function() {
    navigator.clipboard.writeText(syncExportCode).then(function() {
      setSyncMessage("✅ Copied! Now paste this on your other device.")
    }).catch(function() {
      setSyncMessage("⚠️ Select all the code above and copy it manually (Ctrl+C)")
    })
  }

  var updateForm = function(field, value) {
    var f = { title: form.title, notes: form.notes, priority: form.priority, startDate: form.startDate, dueDate: form.dueDate, column: form.column, labels: form.labels, checklist: form.checklist, assignee: form.assignee }
    f[field] = value; setForm(f)
  }
  var addBoard = function() {
    if (!boardFormName.trim()) return
    var nb = { id: generateId(), name: boardFormName.trim() }
    setBoards(boards.concat([nb])); setCurrentBoardId(nb.id); setBoardFormName(""); setShowBoardModal(false)
  }
  var deleteBoard = function(bid) {
    if (boards.length <= 1) { alert("You need at least one board!"); return }
    if (!window.confirm("Delete this board and all its tasks?")) return
    var remaining = boards.filter(function(b) { return b.id !== bid })
    setBoards(remaining); setTasks(tasks.filter(function(tk) { return tk.boardId !== bid }))
    if (currentBoardId === bid) setCurrentBoardId(remaining[0].id)
  }
  var renameBoard = function() {
    if (!boardFormName.trim()) return
    setBoards(boards.map(function(b) { if (b.id === editingBoardId) return { id: b.id, name: boardFormName.trim() }; return b }))
    setBoardFormName(""); setEditingBoardId(null); setShowBoardModal(false)
  }
  var openBoardModal = function(board) {
    if (board) { setEditingBoardId(board.id); setBoardFormName(board.name) } else { setEditingBoardId(null); setBoardFormName("") }
    setShowBoardModal(true)
  }
  var openNewTask = function(column) {
    setForm({ title: "", notes: "", priority: "Medium", startDate: "", dueDate: "", column: column || "To Do", labels: [], checklist: [], assignee: "" })
    setEditingTask(null); setNewChecklistItem(""); setShowModal(true)
  }
  var openEditTask = function(task) {
    setForm({ title: task.title, notes: task.notes || "", priority: task.priority, startDate: task.startDate || "", dueDate: task.dueDate || "", column: task.column, labels: task.labels || [], checklist: task.checklist || [], assignee: task.assignee || "" })
    setEditingTask(task.id); setViewingTask(null); setNewChecklistItem(""); setShowModal(true)
  }
  var saveTask = function() {
    if (!form.title.trim()) { alert("Please enter a task title"); return }
    if (editingTask) {
      setTasks(tasks.map(function(tk) {
        if (tk.id === editingTask) return { id: tk.id, createdAt: tk.createdAt, boardId: tk.boardId, title: form.title, notes: form.notes, priority: form.priority, startDate: form.startDate, dueDate: form.dueDate, column: form.column, labels: form.labels, checklist: form.checklist, assignee: form.assignee }
        return tk
      }))
    } else {
      setTasks(tasks.concat([{ id: generateId(), createdAt: new Date().toISOString(), boardId: currentBoardId, title: form.title, notes: form.notes, priority: form.priority, startDate: form.startDate, dueDate: form.dueDate, column: form.column, labels: form.labels, checklist: form.checklist, assignee: form.assignee }]))
    }
    setShowModal(false); setEditingTask(null)
  }
  var deleteTask = function(id) {
    if (window.confirm("Delete this task?")) { setTasks(tasks.filter(function(tk) { return tk.id !== id })); setViewingTask(null) }
  }
  var moveTask = function(id, newCol) {
    setTasks(tasks.map(function(tk) {
      if (tk.id === id) return { id: tk.id, createdAt: tk.createdAt, boardId: tk.boardId, title: tk.title, notes: tk.notes, priority: tk.priority, startDate: tk.startDate, dueDate: tk.dueDate, column: newCol, labels: tk.labels, checklist: tk.checklist, assignee: tk.assignee }
      return tk
    }))
  }
  var toggleChecklistItem = function(taskId, idx) {
    setTasks(tasks.map(function(tk) {
      if (tk.id === taskId) {
        var nc = tk.checklist.map(function(item, i) { if (i === idx) return { text: item.text, done: !item.done }; return item })
        return { id: tk.id, createdAt: tk.createdAt, boardId: tk.boardId, title: tk.title, notes: tk.notes, priority: tk.priority, startDate: tk.startDate, dueDate: tk.dueDate, column: tk.column, labels: tk.labels, checklist: nc, assignee: tk.assignee }
      }
      return tk
    }))
  }
  var addChecklistItem = function() {
    if (!newChecklistItem.trim()) return
    updateForm("checklist", form.checklist.concat([{ text: newChecklistItem, done: false }])); setNewChecklistItem("")
  }
  var removeChecklistItem = function(idx) { updateForm("checklist", form.checklist.filter(function(_, i) { return i !== idx })) }
  var toggleLabel = function(name) {
    if (form.labels.indexOf(name) >= 0) updateForm("labels", form.labels.filter(function(l) { return l !== name }))
    else updateForm("labels", form.labels.concat([name]))
  }
  var handleDragStart = function(e, taskId) { setDraggedTaskId(taskId); e.dataTransfer.effectAllowed = "move" }
  var handleDragOver = function(e) { e.preventDefault(); e.dataTransfer.dropEffect = "move" }
  var handleDrop = function(e, col) { e.preventDefault(); if (draggedTaskId) { moveTask(draggedTaskId, col); setDraggedTaskId(null) } }

  var boardTasks = tasks.filter(function(tk) { return tk.boardId === currentBoardId })
  var filteredTasks = boardTasks.filter(function(tk) {
    var ms = tk.title.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0 || (tk.notes && tk.notes.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0) || (tk.assignee && tk.assignee.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0)
    var mp = filterPriority === "All" || tk.priority === filterPriority
    return ms && mp
  })
  var isOverdue = function(task) { if (!task.dueDate) return false; var today = new Date(); today.setHours(0,0,0,0); return new Date(task.dueDate) < today && task.column !== "Done" }
  var isDueToday = function(task) { if (!task.dueDate) return false; return task.dueDate === new Date().toISOString().split("T")[0] && task.column !== "Done" }
  var isDueSoon = function(task) { if (!task.dueDate || isOverdue(task) || isDueToday(task)) return false; var today = new Date(); today.setHours(0,0,0,0); var diff = (new Date(task.dueDate) - today) / (1000*60*60*24); return diff <= 3 && diff > 0 && task.column !== "Done" }
  var getProgress = function(task) { if (!task.checklist || task.checklist.length === 0) return null; var done = task.checklist.filter(function(c) { return c.done }).length; return Math.round((done / task.checklist.length) * 100) }

  var totalTasks = boardTasks.length
  var completedTasks = boardTasks.filter(function(tk) { return tk.column === "Done" }).length
  var overdueTasks = boardTasks.filter(function(tk) { return isOverdue(tk) }).length
  var dueSoonTasks = boardTasks.filter(function(tk) { return isDueSoon(tk) || isDueToday(tk) }).length

  var th = darkMode ? {
    bg: "#1a1a2e", headerBg: "linear-gradient(135deg, #16213e, #0f3460)", cardBg: "#16213e",
    columnBg: "#1a1a3e", text: "#e0e0e0", subtext: "#a0a0b0", border: "#2a2a4a",
    toolbarBg: "#16213e", inputBg: "#1a1a3e", inputBorder: "#2a2a4a", modalBg: "#16213e"
  } : {
    bg: "#eef2f7", headerBg: "linear-gradient(135deg, #0078d4, #005a9e)", cardBg: "white",
    columnBg: "#f4f6f8", text: "#333", subtext: "#777", border: "#ddd",
    toolbarBg: "white", inputBg: "white", inputBorder: "#ccc", modalBg: "white"
  }

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif", background: th.bg, minHeight: "100vh", color: th.text }}>
      <header style={{ background: th.headerBg, color: "white", padding: "12px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <h1 style={{ margin: 0, fontSize: "22px" }}>📋 My Planner</h1>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", opacity: 0.8 }}>📊{totalTasks} | ✅{completedTasks}{overdueTasks > 0 ? " | ⚠️" + overdueTasks : ""}{dueSoonTasks > 0 ? " | 🔔" + dueSoonTasks : ""}</span>
            <button onClick={handleExport} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "6px", padding: "5px 10px", color: "white", cursor: "pointer", fontSize: "12px" }}>🔄 Sync</button>
            <button onClick={function() { setDarkMode(!darkMode) }} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "6px", padding: "5px 10px", color: "white", cursor: "pointer", fontSize: "12px" }}>{darkMode ? "☀️" : "🌙"}</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap", alignItems: "center" }}>
          {boards.map(function(b) {
            var isActive = b.id === currentBoardId
            return (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <button onClick={function() { setCurrentBoardId(b.id) }} style={{ padding: "6px 14px", borderRadius: "6px 6px 0 0", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: isActive ? "bold" : "normal", background: isActive ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)", color: "white" }}>{b.name}</button>
                {isActive && (
                  <div style={{ display: "flex", gap: "2px" }}>
                    <button onClick={function() { openBoardModal(b) }} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "11px", padding: "2px" }}>✏️</button>
                    <button onClick={function() { deleteBoard(b.id) }} style={{ background: "none", border: "none", color: "#ffcdd2", cursor: "pointer", fontSize: "11px", padding: "2px" }}>✕</button>
                  </div>
                )}
              </div>
            )
          })}
          <button onClick={function() { openBoardModal(null) }} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px dashed rgba(255,255,255,0.5)", background: "transparent", color: "white", cursor: "pointer", fontSize: "13px" }}>+ Board</button>
        </div>
      </header>

      <div style={{ padding: "12px 24px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", background: th.toolbarBg, borderBottom: "1px solid " + th.border }}>
        <input type="text" placeholder="🔍 Search tasks or people..." value={searchQuery} onChange={function(e) { setSearchQuery(e.target.value) }} style={{ padding: "8px 14px", border: "1px solid " + th.inputBorder, borderRadius: "6px", fontSize: "14px", flex: "1", minWidth: "150px", background: th.inputBg, color: th.text }} />
        <select value={filterPriority} onChange={function(e) { setFilterPriority(e.target.value) }} style={{ padding: "8px 14px", border: "1px solid " + th.inputBorder, borderRadius: "6px", fontSize: "14px", background: th.inputBg, color: th.text }}>
          <option value="All">All Priorities</option>
          <option value="Urgent">🔴 Urgent</option>
          <option value="High">🟠 High</option>
          <option value="Medium">🟡 Medium</option>
          <option value="Low">🟢 Low</option>
        </select>
        <button onClick={function() { openNewTask("To Do") }} style={{ padding: "8px 20px", background: "#0078d4", color: "white", border: "none", borderRadius: "6px", fontSize: "14px", cursor: "pointer", fontWeight: "bold" }}>+ New Task</button>
      </div>

      <div style={{ display: "flex", gap: "16px", padding: "20px", overflowX: "auto", minHeight: "calc(100vh - 160px)" }}>
        {defaultColumns.map(function(column) {
          var colTasks = filteredTasks.filter(function(tk) { return tk.column === column })
          return (
            <div key={column} onDragOver={handleDragOver} onDrop={function(e) { handleDrop(e, column) }} style={{ background: th.columnBg, borderRadius: "12px", padding: "14px", minWidth: "280px", flex: "1", maxWidth: "350px", border: draggedTaskId ? "2px dashed #0078d4" : "2px solid transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h2 style={{ margin: 0, fontSize: "16px", color: th.text }}>{column}</h2>
                <span style={{ background: darkMode ? "#2a2a4a" : "#ddd", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", color: th.text }}>{colTasks.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "10px" }}>
                {colTasks.map(function(task) {
                  var progress = getProgress(task); var overdue = isOverdue(task); var dueToday = isDueToday(task); var dueSoon = isDueSoon(task); var isExpanded = viewingTask === task.id
                  return (
                    <div key={task.id} draggable={true} onDragStart={function(e) { handleDragStart(e, task.id) }} onClick={function() { setViewingTask(isExpanded ? null : task.id) }} style={{ background: th.cardBg, borderRadius: "8px", padding: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderLeft: "4px solid " + priorityColors[task.priority], cursor: "pointer", border: overdue ? "1px solid #f44336" : dueToday ? "1px solid #ff9800" : "1px solid transparent", opacity: draggedTaskId === task.id ? 0.5 : 1 }}>
                      {task.labels && task.labels.length > 0 && (
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "6px" }}>
                          {task.labels.map(function(l) { var lo = labelOptions.find(function(x) { return x.name === l }); return <span key={l} style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", color: "white", background: lo ? lo.color : "#999" }}>{l}</span> })}
                        </div>
                      )}
                      <div style={{ fontWeight: "600", fontSize: "14px", marginBottom: "6px", color: th.text }}>{task.title}</div>
                      {task.assignee && <div style={{ fontSize: "12px", color: th.subtext, marginBottom: "6px" }}>👤 {task.assignee}</div>}
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", marginBottom: "6px" }}>
                        <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", color: "white", background: priorityColors[task.priority] }}>{priorityEmoji[task.priority]} {task.priority}</span>
                        {overdue && <span style={{ fontSize: "11px", color: "#f44336", fontWeight: "bold" }}>⚠️ OVERDUE</span>}
                        {dueToday && <span style={{ fontSize: "11px", color: "#ff9800", fontWeight: "bold" }}>📌 TODAY</span>}
                        {dueSoon && <span style={{ fontSize: "11px", color: "#ffa726", fontWeight: "bold" }}>🔔 SOON</span>}
                      </div>
                      {(task.startDate || task.dueDate) && (
                        <div style={{ fontSize: "12px", color: th.subtext, marginBottom: "6px" }}>
                          {task.startDate && <div>📅 Start: {task.startDate}</div>}
                          {task.dueDate && <div style={{ color: overdue ? "#f44336" : dueToday ? "#ff9800" : th.subtext }}>⏰ Due: {task.dueDate}</div>}
                        </div>
                      )}
                      {progress !== null && (
                        <div style={{ marginBottom: "6px" }}>
                          <div style={{ background: darkMode ? "#2a2a4a" : "#e0e0e0", borderRadius: "10px", height: "6px", overflow: "hidden" }}>
                            <div style={{ background: progress === 100 ? "#4caf50" : "#0078d4", height: "100%", width: progress + "%", borderRadius: "10px", transition: "width 0.3s" }}></div>
                          </div>
                          <span style={{ fontSize: "11px", color: th.subtext }}>{progress}%</span>
                        </div>
                      )}
                      {isExpanded && (
                        <div style={{ marginTop: "10px", borderTop: "1px solid " + th.border, paddingTop: "10px" }}>
                          {task.notes && (
                            <div style={{ marginBottom: "10px" }}>
                              <strong style={{ fontSize: "12px" }}>📝 Notes:</strong>
                              <p style={{ fontSize: "13px", color: th.subtext, margin: "4px 0", whiteSpace: "pre-wrap" }}>{task.notes}</p>
                            </div>
                          )}
                          {task.checklist && task.checklist.length > 0 && (
                            <div style={{ marginBottom: "10px" }}>
                              <strong style={{ fontSize: "12px" }}>☑️ Checklist:</strong>
                              {task.checklist.map(function(item, i) {
                                return <div key={i} onClick={function(e) { e.stopPropagation(); toggleChecklistItem(task.id, i) }} style={{ display: "flex", gap: "8px", alignItems: "center", padding: "4px 0", cursor: "pointer", fontSize: "13px" }}><span>{item.done ? "✅" : "⬜"}</span><span style={{ textDecoration: item.done ? "line-through" : "none", color: item.done ? th.subtext : th.text }}>{item.text}</span></div>
                              })}
                            </div>
                          )}
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                            {defaultColumns.filter(function(c) { return c !== task.column }).map(function(c) {
                              return <button key={c} onClick={function(e) { e.stopPropagation(); moveTask(task.id, c) }} style={{ fontSize: "11px", padding: "4px 10px", border: "1px solid #0078d4", borderRadius: "4px", background: th.cardBg, color: "#0078d4", cursor: "pointer" }}>→ {c}</button>
                            })}
                          </div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button onClick={function(e) { e.stopPropagation(); openEditTask(task) }} style={{ fontSize: "12px", padding: "6px 12px", border: "none", borderRadius: "4px", background: "#0078d4", color: "white", cursor: "pointer" }}>✏️ Edit</button>
                            <button onClick={function(e) { e.stopPropagation(); deleteTask(task.id) }} style={{ fontSize: "12px", padding: "6px 12px", border: "none", borderRadius: "4px", background: "#f44336", color: "white", cursor: "pointer" }}>🗑️ Delete</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <button onClick={function() { openNewTask(column) }} style={{ width: "100%", padding: "8px", border: "2px dashed " + (darkMode ? "#2a2a4a" : "#ccc"), borderRadius: "8px", background: "transparent", color: th.subtext, cursor: "pointer", fontSize: "13px" }}>+ Add Task</button>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div onClick={function() { setShowModal(false) }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div onClick={function(e) { e.stopPropagation() }} style={{ background: th.modalBg, borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto", color: th.text }}>
            <h2 style={{ margin: "0 0 16px 0" }}>{editingTask ? "✏️ Edit Task" : "➕ New Task"}</h2>
            <label style={{ fontSize: "13px", fontWeight: "bold", color: th.subtext, display: "block", marginBottom: "4px" }}>Title *</label>
            <input type="text" value={form.title} onChange={function(e) { updateForm("title", e.target.value) }} placeholder="What needs to be done?" style={{ width: "100%", padding: "10px", border: "1px solid " + th.inputBorder, borderRadius: "6px", fontSize: "14px", marginBottom: "12px", boxSizing: "border-box", background: th.inputBg, color: th.text }} />
            <label style={{ fontSize: "13px", fontWeight: "bold", color: th.subtext, display: "block", marginBottom: "4px" }}>Assigned To</label>
            <input type="text" value={form.assignee} onChange={function(e) { updateForm("assignee", e.target.value) }} placeholder="Who is responsible?" style={{ width: "100%", padding: "10px", border: "1px solid " + th.inputBorder, borderRadius: "6px", fontSize: "14px", marginBottom: "12px", boxSizing: "border-box", background: th.inputBg, color: th.text }} />
            <label style={{ fontSize: "13px", fontWeight: "bold", color: th.subtext, display: "block", marginBottom: "4px" }}>Notes</label>
            <textarea value={form.notes} onChange={function(e) { updateForm("notes", e.target.value) }} placeholder="Add details, links, or instructions..." rows={3} style={{ width: "100%", padding: "10px", border: "1px solid " + th.inputBorder, borderRadius: "6px", fontSize: "14px", marginBottom: "12px", boxSizing: "border-box", resize: "vertical", background: th.inputBg, color: th.text }} />
            <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", color: th.subtext, display: "block", marginBottom: "4px" }}>Priority</label>
                <select value={form.priority} onChange={function(e) { updateForm("priority", e.target.value) }} style={{ width: "100%", padding: "10px", border: "1px solid " + th.inputBorder, borderRadius: "6px", fontSize: "14px", background: th.inputBg, color: th.text }}>
                  <option value="Urgent">🔴 Urgent</option>
                  <option value="High">🟠 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">🟢 Low</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", color: th.subtext, display: "block", marginBottom: "4px" }}>Column</label>
                <select value={form.column} onChange={function(e) { updateForm("column", e.target.value) }} style={{ width: "100%", padding: "10px", border: "1px solid " + th.inputBorder, borderRadius: "6px", fontSize: "14px", background: th.inputBg, color: th.text }}>
                  {defaultColumns.map(function(c) { return <option key={c} value={c}>{c}</option> })}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", color: th.subtext, display: "block", marginBottom: "4px" }}>Start Date</label>
                <input type="date" value={form.startDate} onChange={function(e) { updateForm("startDate", e.target.value) }} style={{ width: "100%", padding: "10px", border: "1px solid " + th.inputBorder, borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", background: th.inputBg, color: th.text }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", color: th.subtext, display: "block", marginBottom: "4px" }}>Due Date</label>
                <input type="date" value={form.dueDate} onChange={function(e) { updateForm("dueDate", e.target.value) }} style={{ width: "100%", padding: "10px", border: "1px solid " + th.inputBorder, borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", background: th.inputBg, color: th.text }} />
              </div>
            </div>
            <label style={{ fontSize: "13px", fontWeight: "bold", color: th.subtext, display: "block", marginBottom: "4px" }}>Labels</label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
              {labelOptions.map(function(l) { var sel = form.labels.indexOf(l.name) >= 0; return <button key={l.name} onClick={function() { toggleLabel(l.name) }} style={{ fontSize: "12px", padding: "4px 12px", borderRadius: "12px", border: "none", cursor: "pointer", background: sel ? l.color : (darkMode ? "#2a2a4a" : "#e0e0e0"), color: sel ? "white" : th.subtext }}>{l.name}</button> })}
            </div>
            <label style={{ fontSize: "13px", fontWeight: "bold", color: th.subtext, display: "block", marginBottom: "4px" }}>Checklist</label>
            <div style={{ marginBottom: "8px" }}>
              {form.checklist.map(function(item, i) {
                return <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: darkMode ? "#1a1a2e" : "#f9f9f9", borderRadius: "4px", marginBottom: "4px" }}><span style={{ fontSize: "13px" }}>{item.text}</span><button onClick={function() { removeChecklistItem(i) }} style={{ border: "none", background: "none", color: "#f44336", cursor: "pointer", fontSize: "16px" }}>✕</button></div>
              })}
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <input type="text" value={newChecklistItem} onChange={function(e) { setNewChecklistItem(e.target.value) }} onKeyDown={function(e) { if (e.key === "Enter") addChecklistItem() }} placeholder="Add checklist item..." style={{ flex: 1, padding: "8px", border: "1px solid " + th.inputBorder, borderRadius: "6px", fontSize: "13px", background: th.inputBg, color: th.text }} />
              <button onClick={addChecklistItem} style={{ padding: "8px 14px", border: "none", borderRadius: "6px", background: "#0078d4", color: "white", cursor: "pointer", fontSize: "13px" }}>Add</button>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={function() { setShowModal(false) }} style={{ padding: "10px 20px", border: "1px solid " + th.inputBorder, borderRadius: "6px", background: th.cardBg, cursor: "pointer", fontSize: "14px", color: th.text }}>Cancel</button>
              <button onClick={saveTask} style={{ padding: "10px 20px", border: "none", borderRadius: "6px", background: "#0078d4", color: "white", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}>{editingTask ? "Save Changes" : "Create Task"}</button>
            </div>
          </div>
        </div>
      )}

      {showBoardModal && (
        <div onClick={function() { setShowBoardModal(false) }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div onClick={function(e) { e.stopPropagation() }} style={{ background: th.modalBg, borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "400px", color: th.text }}>
            <h2 style={{ margin: "0 0 16px 0" }}>{editingBoardId ? "✏️ Rename Board" : "📂 New Board"}</h2>
            <input type="text" value={boardFormName} onChange={function(e) { setBoardFormName(e.target.value) }} onKeyDown={function(e) { if (e.key === "Enter") { if (editingBoardId) renameBoard(); else addBoard() } }} placeholder="Board name" style={{ width: "100%", padding: "10px", border: "1px solid " + th.inputBorder, borderRadius: "6px", fontSize: "14px", marginBottom: "16px", boxSizing: "border-box", background: th.inputBg, color: th.text }} />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={function() { setShowBoardModal(false) }} style={{ padding: "10px 20px", border: "1px solid " + th.inputBorder, borderRadius: "6px", background: th.cardBg, cursor: "pointer", fontSize: "14px", color: th.text }}>Cancel</button>
              <button onClick={function() { if (editingBoardId) renameBoard(); else addBoard() }} style={{ padding: "10px 20px", border: "none", borderRadius: "6px", background: "#0078d4", color: "white", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}>{editingBoardId ? "Save" : "Create Board"}</button>
            </div>
          </div>
        </div>
      )}

      {showSyncModal && (
        <div onClick={function() { setShowSyncModal(false) }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div onClick={function(e) { e.stopPropagation() }} style={{ background: th.modalBg, borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto", color: th.text }}>
            <h2 style={{ margin: "0 0 16px 0" }}>🔄 Sync Between Devices</h2>

            <div style={{ background: darkMode ? "#0f3460" : "#e3f2fd", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "15px" }}>📤 Export from THIS device</h3>
              <p style={{ fontSize: "13px", color: th.subtext, margin: "0 0 10px 0" }}>Copy this code and paste it on your other device.</p>
              <textarea readOnly value={syncExportCode} style={{ width: "100%", height: "80px", padding: "8px", border: "1px solid " + th.inputBorder, borderRadius: "6px", fontSize: "11px", fontFamily: "monospace", background: th.inputBg, color: th.text, boxSizing: "border-box", resize: "none" }} onClick={function(e) { e.target.select() }} />
              <button onClick={handleCopyCode} style={{ marginTop: "8px", padding: "8px 16px", background: "#0078d4", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>📋 Copy Code</button>
            </div>

            <div style={{ background: darkMode ? "#1a3a1a" : "#e8f5e9", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "15px" }}>📥 Import from ANOTHER device</h3>
              <p style={{ fontSize: "13px", color: th.subtext, margin: "0 0 10px 0" }}>Paste the code from your other device here.</p>
              <textarea value={syncImportCode} onChange={function(e) { setSyncImportCode(e.target.value) }} placeholder="Paste sync code here..." style={{ width: "100%", height: "80px", padding: "8px", border: "1px solid " + th.inputBorder, borderRadius: "6px", fontSize: "11px", fontFamily: "monospace", background: th.inputBg, color: th.text, boxSizing: "border-box", resize: "none" }} />
              <button onClick={handleImport} style={{ marginTop: "8px", padding: "8px 16px", background: "#4caf50", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>📥 Import Tasks</button>
            </div>

            {syncMessage && <div style={{ padding: "10px", borderRadius: "6px", background: darkMode ? "#2a2a4a" : "#f5f5f5", textAlign: "center", fontSize: "14px", fontWeight: "bold", marginBottom: "12px" }}>{syncMessage}</div>}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={function() { setShowSyncModal(false) }} style={{ padding: "10px 20px", border: "1px solid " + th.inputBorder, borderRadius: "6px", background: th.cardBg, cursor: "pointer", fontSize: "14px", color: th.text }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
var priorityColors = { Urgent: "#d32f2f", High: "#f57c00", Medium: "#fbc02d", Low: "#4caf50" }
var priorityEmoji = { Urgent: "🔴", High: "🟠", Medium: "🟡", Low: "🟢" }
var labelOptions = [
  { name: "Bug", color: "#e53935" }, { name: "Feature", color: "#1e88e5" },
  { name: "Design", color: "#8e24aa" }, { name: "Research", color: "#43a047" },
  { name: "Meeting", color: "#fb8c00" }, { name: "Personal", color: "#00acc1" }
]

export default function App() {
  var [darkMode, setDarkMode] = useState(function() {
    try { return localStorage.getItem("planner-dark") === "true" } catch(e) { return false }
  })
  var [boards, setBoards] = useState(function() {
    try { var s = localStorage.getItem("planner-boards"); return s ? JSON.parse(s) : [{ id: "default", name: "My Project" }] } catch(e) { return [{ id: "default", name: "My Project" }] }
  })
  var [currentBoardId, setCurrentBoardId] = useState(function() {
    try { return localStorage.getItem("planner-current-board") || "default" } catch(e) { return "default" }
  })
  var [tasks, setTasks] = useState(function() {
    try { var s = localStorage.getItem("planner-tasks-v2"); return s ? JSON.parse(s) : [] } catch(e) { return [] }
  })

  var [showModal, setShowModal] = useState(false)
  var [editingTask, setEditingTask] = useState(null)
