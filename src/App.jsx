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
