import { useState, useEffect } from "react"

const generateId = () => Math.random().toString(36).substr(2, 9)

const defaultColumns = ["To Do", "In Progress", "Review", "Done"]

const priorityColors = {
  Urgent: "#d32f2f",
  High: "#f57c00",
  Medium: "#fbc02d",
  Low: "#4caf50"
}

const priorityEmoji = {
  Urgent: "🔴",
  High: "🟠",
  Medium: "🟡",
  Low: "🟢"
}

const labelOptions = [
  { name: "Bug", color: "#e53935" },
  { name: "Feature", color: "#1e88e5" },
  { name: "Design", color: "#8e24aa" },
  { name: "Research", color: "#43a047" },
  { name: "Meeting", color: "#fb8c00" },
  { name: "Personal", color: "#00acc1" }
]

export default function App() {
  const [tasks, setTasks] = useState(function() {
    try {
      var saved = localStorage.getItem("planner-tasks")
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      return []
    }
  })

  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [viewingTask, setViewingTask] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPriority, setFilterPriority] = useState("All")
  const [newChecklistItem, setNewChecklistItem] = useState("")

  const [form, setForm] = useState({
    title: "",
    notes: "",
    priority: "Medium",
    startDate: "",
    dueDate: "",
    column: "To Do",
    labels: [],
    checklist: []
  })

  useEffect(function() {
    localStorage.setItem("planner-tasks", JSON.stringify(tasks))
  }, [tasks])

  const openNewTask = function(column) {
    setForm({
      title: "",
      notes: "",
      priority: "Medium",
      startDate: "",
      dueDate: "",
      column: column || "To Do",
      labels: [],
      checklist: []
    })
    setEditingTask(null)
    setNewChecklistItem("")
    setShowModal(true)
  }

  const openEditTask = function(task) {
    setForm({
      title: task.title,
      notes: task.notes || "",
      priority: task.priority,
      startDate: task.startDate || "",
      dueDate: task.dueDate || "",
      column: task.column,
      labels: task.labels || [],
      checklist: task.checklist || []
    })
    setEditingTask(task.id)
    setViewingTask(null)
    setNewChecklistItem("")
    setShowModal(true)
  }

  const saveTask = function() {
    if (!form.title.trim()) {
      alert("Please enter a task title")
      return
    }
    if (editingTask) {
      setTasks(tasks.map(function(t) {
        if (t.id === editingTask) {
          return { id: t.id, createdAt: t.createdAt, title: form.title, notes: form.notes, priority: form.priority, startDate: form.startDate, dueDate: form.dueDate, column: form.column, labels: form.labels, checklist: form.checklist }
        }
        return t
      }))
    } else {
      var newTask = { id: generateId(), createdAt: new Date().toISOString(), title: form.title, notes: form.notes, priority: form.priority, startDate: form.startDate, dueDate: form.dueDate, column: form.column, labels: form.labels, checklist: form.checklist }
      setTasks(tasks.concat([newTask]))
    }
    setShowModal(false)
    setEditingTask(null)
  }

  const deleteTask = function(id) {
    if (window.confirm("Delete this task?")) {
      setTasks(tasks.filter(function(t) { return t.id !== id }))
      setViewingTask(null)
    }
  }

  const moveTask = function(id, newColumn) {
    setTasks(tasks.map(function(t) {
      if (t.id === id) {
        return { id: t.id, createdAt: t.createdAt, title: t.title, notes: t.notes, priority: t.priority, startDate: t.startDate, dueDate: t.dueDate, column: newColumn, labels: t.labels, checklist: t.checklist }
      }
      return t
    }))
  }

  const toggleChecklistItem = function(taskId, index) {
    setTasks(tasks.map(function(t) {
      if (t.id === taskId) {
        var newChecklist = t.checklist.map(function(item, i) {
          if (i === index) {
            return { text: item.text, done: !item.done }
          }
          return item
        })
        return { id: t.id, createdAt: t.createdAt, title: t.title, notes: t.notes, priority: t.priority, startDate: t.startDate, dueDate: t.dueDate, column: t.column, labels: t.labels, checklist: newChecklist }
      }
      return t
    }))
  }

  const addChecklistItem = function() {
    if (!newChecklistItem.trim()) return
    setForm({
      title: form.title, notes: form.notes, priority: form.priority, startDate: form.startDate, dueDate: form.dueDate, column: form.column, labels: form.labels,
      checklist: form.checklist.concat([{ text: newChecklistItem, done: false }])
    })
    setNewChecklistItem("")
  }

  const removeChecklistItem = function(index) {
    setForm({
      title: form.title, notes: form.notes, priority: form.priority, startDate: form.startDate, dueDate: form.dueDate, column: form.column, labels: form.labels,
      checklist: form.checklist.filter(function(_, i) { return i !== index })
    })
  }

  const toggleLabel = function(labelName) {
    if (form.labels.indexOf(labelName) >= 0) {
      setForm({
        title: form.title, notes: form.notes, priority: form.priority, startDate: form.startDate, dueDate: form.dueDate, column: form.column, checklist: form.checklist,
        labels: form.labels.filter(function(l) { return l !== labelName })
      })
    } else {
      setForm({
        title: form.title, notes: form.notes, priority: form.priority, startDate: form.startDate, dueDate: form.dueDate, column: form.column, checklist: form.checklist,
        labels: form.labels.concat([labelName])
      })
    }
  }

  var filteredTasks = tasks.filter(function(t) {
    var matchesSearch = t.title.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0 ||
      (t.notes && t.notes.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0)
    var matchesPriority = filterPriority === "All" || t.priority === filterPriority
    return matchesSearch && matchesPriority
  })

  var isOverdue = function(task) {
    if (!task.dueDate) return false
    var today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(task.dueDate) < today && task.column !== "Done"
  }

  var getProgress = function(task) {
    if (!task.checklist || task.checklist.length === 0) return null
    var done = task.checklist.filter(function(c) { return c.done }).length
    return Math.round((done / task.checklist.length) * 100)
  }

  var totalTasks = tasks.length
  var completedTasks = tasks.filter(function(t) { return t.column === "Done" }).length
  var overdueTasks = tasks.filter(function(t) { return isOverdue(t) }).length

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif", background: "#eef2f7", minHeight: "100vh" }}>

      <header style={{ background: "linear-gradient(135deg, #0078d4, #005a9e)", color: "white", padding: "16px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
        <h1 style={{ margin: "0 0 8px 0", fontSize: "24px" }}>📋 My Planner</h1>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "14px", opacity: 0.9 }}>
          <span>📊 {totalTasks} tasks</span>
          <span>✅ {completedTasks} done</span>
          {overdueTasks > 0 && <span style={{ color: "#ffcdd2" }}>⚠️ {overdueTasks} overdue</span>}
        </div>
      </header>

      <div style={{ padding: "12px 24px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", background: "white", borderBottom: "1px solid #ddd" }}>
        <input
          type="text"
          placeholder="🔍 Search tasks..."
          value={searchQuery}
          onChange={function(e) { setSearchQuery(e.target.value) }}
          style={{ padding: "8px 14px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px", flex: "1", minWidth: "150px" }}
        />
        <select
          value={filterPriority}
          onChange={function(e) { setFilterPriority(e.target.value) }}
          style={{ padding: "8px 14px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px" }}
        >
          <option value="All">All Priorities</option>
          <option value="Urgent">🔴 Urgent</option>
          <option value="High">🟠 High</option>
          <option value="Medium">🟡 Medium</option>
          <option value="Low">🟢 Low</option>
        </select>
        <button
          onClick={function() { openNewTask("To Do") }}
          style={{ padding: "8px 20px", background: "#0078d4", color: "white", border: "none", borderRadius: "6px", fontSize: "14px", cursor: "pointer", fontWeight: "bold" }}
        >+ New Task</button>
      </div>

      <div style={{ display: "flex", gap: "16px", padding: "20px", overflowX: "auto", minHeight: "calc(100vh - 140px)" }}>
        {defaultColumns.map(function(column) {
          var columnTasks = filteredTasks.filter(function(t) { return t.column === column })
          return (
            <div key={column} style={{ background: "#f4f6f8", borderRadius: "12px", padding: "14px", minWidth: "280px", flex: "1", maxWidth: "350px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h2 style={{ margin: 0, fontSize: "16px", color: "#333" }}>{column}</h2>
                <span style={{ background: "#ddd", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>{columnTasks.length}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "10px" }}>
                {columnTasks.map(function(task) {
                  var progress = getProgress(task)
                  var overdue = isOverdue(task)
                  var isExpanded = viewingTask === task.id
                  return (
                    <div
                      key={task.id}
                      onClick={function() { setViewingTask(isExpanded ? null : task.id) }}
                      style={{
                        background: "white",
                        borderRadius: "8px",
                        padding: "12px",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                        borderLeft: "4px solid " + priorityColors[task.priority],
                        cursor: "pointer",
                        border: overdue ? "1px solid #f44336" : "1px solid transparent"
                      }}
                    >
                      {task.labels && task.labels.length > 0 && (
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "6px" }}>
                          {task.labels.map(function(l) {
                            var labelObj = labelOptions.find(function(lo) { return lo.name === l })
                            return (
                              <span key={l} style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", color: "white", background: labelObj ? labelObj.color : "#999" }}>{l}</span>
                            )
                          })}
                        </div>
                      )}

                      <div style={{ fontWeight: "600", fontSize: "14px", marginBottom: "6px", color: "#222" }}>{task.title}</div>

                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", marginBottom: "6px" }}>
                        <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", color: "white", background: priorityColors[task.priority] }}>
                          {priorityEmoji[task.priority]} {task.priority}
                        </span>
                        {overdue && <span style={{ fontSize: "11px", color: "#f44336", fontWeight: "bold" }}>⚠️ OVERDUE</span>}
                      </div>

                      {(task.startDate || task.dueDate) && (
                        <div style={{ fontSize: "12px", color: "#777", marginBottom: "6px" }}>
                          {task.startDate && <div>📅 Start: {task.startDate}</div>}
                          {task.dueDate && <div style={{ color: overdue ? "#f44336" : "#777" }}>⏰ Due: {task.dueDate}</div>}
                        </div>
                      )}

                      {progress !== null && (
                        <div style={{ marginBottom: "6px" }}>
                          <div style={{ background: "#e0e0e0", borderRadius: "10px", height: "6px", overflow: "hidden" }}>
                            <div style={{ background: progress === 100 ? "#4caf50" : "#0078d4", height: "100%", width: progress + "%", borderRadius: "10px", transition: "width 0.3s" }}></div>
                          </div>
                          <span style={{ fontSize: "11px", color: "#999" }}>{progress}% complete</span>
                        </div>
                      )}

                      {isExpanded && (
                        <div style={{ marginTop: "10px", borderTop: "1px solid #eee", paddingTop: "10px" }}>
                          {task.notes && (
                            <div style={{ marginBottom: "10px" }}>
                              <strong style={{ fontSize: "12px" }}>📝 Notes:</strong>
                              <p style={{ fontSize: "13px", color: "#555", margin: "4px 0", whiteSpace: "pre-wrap" }}>{task.notes}</p>
                            </div>
                          )}

                          {task.checklist && task.checklist.length > 0 && (
                            <div style={{ marginBottom: "10px" }}>
                              <strong style={{ fontSize: "12px" }}>☑️ Checklist:</strong>
                              {task.checklist.map(function(item, i) {
                                return (
                                  <div
                                    key={i}
                                    onClick={function(e) { e.stopPropagation(); toggleChecklistItem(task.id, i) }}
                                    style={{ display: "flex", gap: "8px", alignItems: "center", padding: "4px 0", cursor: "pointer", fontSize: "13px" }}
                                  >
                                    <span>{item.done ? "✅" : "⬜"}</span>
                                    <span style={{ textDecoration: item.done ? "line-through" : "none", color: item.done ? "#999" : "#333" }}>{item.text}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                            {defaultColumns.filter(function(c) { return c !== task.column }).map(function(c) {
                              return (
                                <button
                                  key={c}
                                  onClick={function(e) { e.stopPropagation(); moveTask(task.id, c) }}
                                  style={{ fontSize: "11px", padding: "4px 10px", border: "1px solid #0078d4", borderRadius: "4px", background: "white", color: "#0078d4", cursor: "pointer" }}
                                >Move to {c}</button>
                              )
                            })}
                          </div>

                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={function(e) { e.stopPropagation(); openEditTask(task) }}
                              style={{ fontSize: "12px", padding: "6px 12px", border: "none", borderRadius: "4px", background: "#0078d4", color: "white", cursor: "pointer" }}
                            >✏️ Edit</button>
                            <button
                              onClick={function(e) { e.stopPropagation(); deleteTask(task.id) }}
                              style={{ fontSize: "12px", padding: "6px 12px", border: "none", borderRadius: "4px", background: "#f44336", color: "white", cursor: "pointer" }}
                            >🗑️ Delete</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <button
                onClick={function() { openNewTask(column) }}
                style={{ width: "100%", padding: "8px", border: "2px dashed #ccc", borderRadius: "8px", background: "transparent", color: "#999", cursor: "pointer", fontSize: "13px" }}
              >+ Add Task</button>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div
          onClick={function() { setShowModal(false) }}
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}
        >
          <div
            onClick={function(e) { e.stopPropagation() }}
            style={{ background: "white", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto" }}
          >
            <h2 style={{ margin: "0 0 16px 0", color: "#333" }}>{editingTask ? "✏️ Edit Task" : "➕ New Task"}</h2>

            <label style={{ fontSize: "13px", fontWeight: "bold", color: "#555", display: "block", marginBottom: "4px" }}>Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={function(e) { setForm({ title: e.target.value, notes: form.notes, priority: form.priority, startDate: form.startDate, dueDate: form.dueDate, column: form.column, labels: form.labels, checklist: form.checklist }) }}
              placeholder="What needs to be done?"
              style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px", marginBottom: "12px", boxSizing: "border-box" }}
            />

            <label style={{ fontSize: "13px", fontWeight: "bold", color: "#555", display: "block", marginBottom: "4px" }}>Notes</label>
            <textarea
              value={form.notes}
              onChange={function(e) { setForm({ title: form.title, notes: e.target.value, priority: form.priority, startDate: form.startDate, dueDate: form.dueDate, column: form.column, labels: form.labels, checklist: form.checklist }) }}
              placeholder="Add details, links, or instructions..."
              rows={3}
              style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px", marginBottom: "12px", boxSizing: "border-box", resize: "vertical" }}
            />

            <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#555", display: "block", marginBottom: "4px" }}>Priority</label>
                <select
                  value={form.priority}
                  onChange={function(e) { setForm({ title: form.title, notes: form.notes, priority: e.target.value, startDate: form.startDate, dueDate: form.dueDate, column: form.column, labels: form.labels, checklist: form.checklist }) }}
                  style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px" }}
                >
                  <option value="Urgent">🔴 Urgent</option>
                  <option value="High">🟠 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">🟢 Low</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#555", display: "block", marginBottom: "4px" }}>Column</label>
                <select
                  value={form.column}
                  onChange={function(e) { setForm({ title: form.title, notes: form.notes, priority: form.priority, startDate: form.startDate, dueDate: form.dueDate, column: e.target.value, labels: form.labels, checklist: form.checklist }) }}
                  style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px" }}
                >
                  {defaultColumns.map(function(c) {
                    return <option key={c} value={c}>{c}</option>
                  })}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#555", display: "block", marginBottom: "4px" }}>Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={function(e) { setForm({ title: form.title, notes: form.notes, priority: form.priority, startDate: e.target.value, dueDate: form.dueDate, column: form.column, labels: form.labels, checklist: form.checklist }) }}
                  style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#555", display: "block", marginBottom: "4px" }}>Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={function(e) { setForm({ title: form.title, notes: form.notes, priority: form.priority, startDate: form.startDate, dueDate: e.target.value, column: form.column, labels: form.labels, checklist: form.checklist }) }}
                  style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <label style={{ fontSize: "13px", fontWeight: "bold", color: "#555", display: "block", marginBottom: "4px" }}>Labels</label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
              {labelOptions.map(function(l) {
                var isSelected = form.labels.indexOf(l.name) >= 0
                return (
                  <button
                    key={l.name}
                    onClick={function() { toggleLabel(l.name) }}
                    style={{
                      fontSize: "12px",
                      padding: "4px 12px",
                      borderRadius: "12px",
                      border: "none",
                      cursor: "pointer",
                      background: isSelected ? l.color : "#e0e0e0",
                      color: isSelected ? "white" : "#555"
                    }}
                  >{l.name}</button>
                )
              })}
            </div>

            <label style={{ fontSize: "13px", fontWeight: "bold", color: "#555", display: "block", marginBottom: "4px" }}>Checklist</label>
            <div style={{ marginBottom: "8px" }}>
              {form.checklist.map(function(item, i) {
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "#f9f9f9", borderRadius: "4px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "13px" }}>{item.text}</span>
                    <button
                      onClick={function() { removeChecklistItem(i) }}
                      style={{ border: "none", background: "none", color: "#f44336", cursor: "pointer", fontSize: "16px" }}
                    >✕</button>
                  </div>
                )
              })}
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <input
                type="text"
                value={newChecklistItem}
                onChange={function(e) { setNewChecklistItem(e.target.value) }}
                onKeyDown={function(e) { if (e.key === "Enter") addChecklistItem() }}
                placeholder="Add checklist item..."
                style={{ flex: 1, padding: "8px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "13px" }}
              />
              <button
                onClick={addChecklistItem}
                style={{ padding: "8px 14px", border: "none", borderRadius: "6px", background: "#0078d4", color: "white", cursor: "pointer", fontSize: "13px" }}
              >Add</button>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={function() { setShowModal(false) }}
                style={{ padding: "10px 20px", border: "1px solid #ccc", borderRadius: "6px", background: "white", cursor: "pointer", fontSize: "14px" }}
              >Cancel</button>
              <button
                onClick={saveTask}
                style={{ padding: "10px 20px", border: "none", borderRadius: "6px", background: "#0078d4", color: "white", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}
              >{editingTask ? "Save Changes" : "Create Task"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
