import { useState, useEffect } from "react"

var generateId = function() {
  return Math.random().toString(36).substr(2, 9)
}

var defaultColumns = [
  "To Do",
  "In Progress",
  "Review",
  "Done"
]

var defaultBuckets = [
  { id: "saddleside", name: "Saddleside" },
  { id: "legacyfields", name: "Legacy Fields" },
  { id: "lonestar", name: "Lonestar" },
  { id: "alpharanch", name: "Alpha Ranch" },
  { id: "willowstone", name: "Willowstone" },
  { id: "other", name: "Other" }
]

var priorityColors = {
  Urgent: "#d32f2f",
  High: "#f57c00",
  Medium: "#fbc02d",
  Low: "#4caf50"
}

var priorityEmoji = {
  Urgent: "🔴",
  High: "🟠",
  Medium: "🟡",
  Low: "🟢"
}

var defaultLabels = [
  { name: "Bug", color: "#e53935" },
  { name: "Feature", color: "#1e88e5" },
  { name: "Design", color: "#8e24aa" },
  { name: "Research", color: "#43a047" },
  { name: "Meeting", color: "#fb8c00" },
  { name: "Personal", color: "#00acc1" }
]

var bucketColors = {
  saddleside: "#1565c0",
  legacyfields: "#2e7d32",
  lonestar: "#ef6c00",
  alpharanch: "#6a1b9a",
  willowstone: "#00838f",
  other: "#546e7a"
}

export default function App() {
  var loadState = function(key, fallback) {
    try {
      var s = localStorage.getItem(key)
      return s ? JSON.parse(s) : fallback
    } catch(e) {
      return fallback
    }
  }

  var [darkMode, setDarkMode] = useState(
    function() {
      try {
        return localStorage.getItem("planner-dark") === "true"
      } catch(e) {
        return false
      }
    }
  )

  var [buckets, setBuckets] = useState(
    function() {
      return loadState("planner-buckets", defaultBuckets)
    }
  )

  var [currentBucketId, setCurrentBucketId] = useState(
    function() {
      try {
        return localStorage.getItem("planner-current-bucket") || "saddleside"
      } catch(e) {
        return "saddleside"
      }
    }
  )

  var [tasks, setTasks] = useState(
    function() {
      return loadState("planner-tasks-v3", [])
    }
  )

  var [showModal, setShowModal] = useState(false)
  var [editingTask, setEditingTask] = useState(null)
  var [viewingTask, setViewingTask] = useState(null)
  var [searchQuery, setSearchQuery] = useState("")
  var [filterPriority, setFilterPriority] = useState("All")
  var [newChecklistItem, setNewChecklistItem] = useState("")
  var [draggedTaskId, setDraggedTaskId] = useState(null)
  var [showBucketModal, setShowBucketModal] = useState(false)
  var [bucketFormName, setBucketFormName] = useState("")
  var [editingBucketId, setEditingBucketId] = useState(null)
  var [sortBy, setSortBy] = useState("none")
  var [showDashboard, setShowDashboard] = useState(false)
  var [newCommentText, setNewCommentText] = useState("")
  var [showCalendar, setShowCalendar] = useState(false)

  var [form, setForm] = useState({
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
    comments: []
  })

  useEffect(
    function() {
      localStorage.setItem("planner-tasks-v3", JSON.stringify(tasks))
      localStorage.setItem("planner-buckets", JSON.stringify(buckets))
      localStorage.setItem("planner-dark", darkMode.toString())
    },
    [tasks, buckets, darkMode]
  )

  useEffect(
    function() {
      localStorage.setItem("planner-current-bucket", currentBucketId)
    },
    [currentBucketId]
  )

  var updateForm = function(field, value) {
    var f = {
      title: form.title,
      notes: form.notes,
      priority: form.priority,
      startDate: form.startDate,
      dueDate: form.dueDate,
      column: form.column,
      labels: form.labels,
      checklist: form.checklist,
      assignee: form.assignee,
      pinned: form.pinned,
      comments: form.comments
    }
    f[field] = value
    setForm(f)
  }

  var makeTaskObj = function(id, created, bid, f) {
    return {
      id: id,
      createdAt: created,
      bucketId: bid,
      title: f.title,
      notes: f.notes,
      priority: f.priority,
      startDate: f.startDate,
      dueDate: f.dueDate,
      column: f.column,
      labels: f.labels,
      checklist: f.checklist,
      assignee: f.assignee,
      pinned: f.pinned || false,
      comments: f.comments || []
    }
  }

  var addBucket = function() {
    if (!bucketFormName.trim()) { return }
    var nb = {
      id: generateId(),
      name: bucketFormName.trim()
    }
    setBuckets(buckets.concat([nb]))
    setCurrentBucketId(nb.id)
    setBucketFormName("")
    setShowBucketModal(false)
  }

  var deleteBucket = function(bid) {
    if (buckets.length <= 1) {
      alert("You need at least one bucket!")
      return
    }
    if (!window.confirm("Delete this bucket and all its tasks?")) {
      return
    }
    var remaining = buckets.filter(
      function(b) { return b.id !== bid }
    )
    setBuckets(remaining)
    setTasks(
      tasks.filter(function(tk) { return tk.bucketId !== bid })
    )
    if (currentBucketId === bid) {
      setCurrentBucketId(remaining[0].id)
    }
  }

  var renameBucket = function() {
    if (!bucketFormName.trim()) { return }
    setBuckets(
      buckets.map(function(b) {
        if (b.id === editingBucketId) {
          return { id: b.id, name: bucketFormName.trim() }
        }
        return b
      })
    )
    setBucketFormName("")
    setEditingBucketId(null)
    setShowBucketModal(false)
  }

  var openBucketModal = function(bucket) {
    if (bucket) {
      setEditingBucketId(bucket.id)
      setBucketFormName(bucket.name)
    } else {
      setEditingBucketId(null)
      setBucketFormName("")
    }
    setShowBucketModal(true)
  }

  var openNewTask = function(column) {
    setForm({
      title: "",
      notes: "",
      priority: "Medium",
      startDate: "",
      dueDate: "",
      column: column || "To Do",
      labels: [],
      checklist: [],
      assignee: "",
      pinned: false,
      comments: []
    })
    setEditingTask(null)
    setNewChecklistItem("")
    setShowModal(true)
  }

  var openEditTask = function(task) {
    setForm({
      title: task.title,
      notes: task.notes || "",
      priority: task.priority,
      startDate: task.startDate || "",
      dueDate: task.dueDate || "",
      column: task.column,
      labels: task.labels || [],
      checklist: task.checklist || [],
      assignee: task.assignee || "",
      pinned: task.pinned || false,
      comments: task.comments || []
    })
    setEditingTask(task.id)
    setViewingTask(null)
    setNewChecklistItem("")
    setShowModal(true)
  }

  var saveTask = function() {
    if (!form.title.trim()) {
      alert("Please enter a task title")
      return
    }
    if (editingTask) {
      setTasks(
        tasks.map(function(tk) {
          if (tk.id === editingTask) {
            return makeTaskObj(
              tk.id, tk.createdAt, tk.bucketId, form
            )
          }
          return tk
        })
      )
    } else {
      var newTask = makeTaskObj(
        generateId(),
        new Date().toISOString(),
        currentBucketId,
        form
      )
      setTasks(tasks.concat([newTask]))
    }
    setShowModal(false)
    setEditingTask(null)
  }

  var deleteTask = function(id) {
    if (window.confirm("Delete this task?")) {
      setTasks(
        tasks.filter(function(tk) { return tk.id !== id })
      )
      setViewingTask(null)
    }
  }

  var moveTask = function(id, newCol) {
    setTasks(
      tasks.map(function(tk) {
        if (tk.id === id) {
          var f = {
            title: tk.title,
            notes: tk.notes,
            priority: tk.priority,
            startDate: tk.startDate,
            dueDate: tk.dueDate,
            column: newCol,
            labels: tk.labels,
            checklist: tk.checklist,
            assignee: tk.assignee,
            pinned: tk.pinned,
            comments: tk.comments
          }
          return makeTaskObj(tk.id, tk.createdAt, tk.bucketId, f)
        }
        return tk
      })
    )
  }

  var togglePin = function(id) {
    setTasks(
      tasks.map(function(tk) {
        if (tk.id === id) {
          var f = {
            title: tk.title,
            notes: tk.notes,
            priority: tk.priority,
            startDate: tk.startDate,
            dueDate: tk.dueDate,
            column: tk.column,
            labels: tk.labels,
            checklist: tk.checklist,
            assignee: tk.assignee,
            pinned: !tk.pinned,
            comments: tk.comments
          }
          return makeTaskObj(tk.id, tk.createdAt, tk.bucketId, f)
        }
        return tk
      })
    )
  }

  var addComment = function(taskId) {
    if (!newCommentText.trim()) { return }
    setTasks(
      tasks.map(function(tk) {
        if (tk.id === taskId) {
          var newComments = (tk.comments || []).concat([{
            text: newCommentText,
            date: new Date().toLocaleString()
          }])
          var f = {
            title: tk.title,
            notes: tk.notes,
            priority: tk.priority,
            startDate: tk.startDate,
            dueDate: tk.dueDate,
            column: tk.column,
            labels: tk.labels,
            checklist: tk.checklist,
            assignee: tk.assignee,
            pinned: tk.pinned,
            comments: newComments
          }
          return makeTaskObj(tk.id, tk.createdAt, tk.bucketId, f)
        }
        return tk
      })
    )
    setNewCommentText("")
  }

  var toggleChecklistItem = function(taskId, idx) {
    setTasks(
      tasks.map(function(tk) {
        if (tk.id === taskId) {
          var nc = tk.checklist.map(function(item, i) {
            if (i === idx) {
              return { text: item.text, done: !item.done }
            }
            return item
          })
          var f = {
            title: tk.title,
            notes: tk.notes,
            priority: tk.priority,
            startDate: tk.startDate,
            dueDate: tk.dueDate,
            column: tk.column,
            labels: tk.labels,
            checklist: nc,
            assignee: tk.assignee,
            pinned: tk.pinned,
            comments: tk.comments
          }
          return makeTaskObj(tk.id, tk.createdAt, tk.bucketId, f)
        }
        return tk
      })
    )
  }

  var addChecklistItem = function() {
    if (!newChecklistItem.trim()) { return }
    updateForm(
      "checklist",
      form.checklist.concat([{
        text: newChecklistItem,
        done: false
      }])
    )
    setNewChecklistItem("")
  }

  var removeChecklistItem = function(idx) {
    updateForm(
      "checklist",
      form.checklist.filter(function(_, i) { return i !== idx })
    )
  }

  var toggleLabel = function(name) {
    if (form.labels.indexOf(name) >= 0) {
      updateForm(
        "labels",
        form.labels.filter(function(l) { return l !== name })
      )
    } else {
      updateForm("labels", form.labels.concat([name]))
    }
  }

  var handleDragStart = function(e, taskId) {
    setDraggedTaskId(taskId)
    e.dataTransfer.effectAllowed = "move"
  }

  var handleDragOver = function(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  var handleDrop = function(e, col) {
    e.preventDefault()
    if (draggedTaskId) {
      moveTask(draggedTaskId, col)
      setDraggedTaskId(null)
    }
  }

  var bucketTasks = tasks.filter(
    function(tk) { return tk.bucketId === currentBucketId }
  )

  var filteredTasks = bucketTasks.filter(function(tk) {
    var q = searchQuery.toLowerCase()
    var ms = tk.title.toLowerCase().indexOf(q) >= 0
    if (!ms && tk.notes) {
      ms = tk.notes.toLowerCase().indexOf(q) >= 0
    }
    if (!ms && tk.assignee) {
      ms = tk.assignee.toLowerCase().indexOf(q) >= 0
    }
    var mp = filterPriority === "All" || tk.priority === filterPriority
    return ms && mp
  })

  var priorityOrder = { Urgent: 0, High: 1, Medium: 2, Low: 3 }

  var sortTasks = function(taskList) {
    var pinned = taskList.filter(function(t) { return t.pinned })
    var unpinned = taskList.filter(function(t) { return !t.pinned })

    if (sortBy === "priority") {
      unpinned.sort(function(a, b) {
        return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
      })
    } else if (sortBy === "dueDate") {
      unpinned.sort(function(a, b) {
        if (!a.dueDate) { return 1 }
        if (!b.dueDate) { return -1 }
        return new Date(a.dueDate) - new Date(b.dueDate)
      })
    } else if (sortBy === "name") {
      unpinned.sort(function(a, b) {
        return a.title.localeCompare(b.title)
      })
    }

    return pinned.concat(unpinned)
  }

  var isOverdue = function(task) {
    if (!task.dueDate) { return false }
    var today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(task.dueDate) < today && task.column !== "Done"
  }

  var isDueToday = function(task) {
    if (!task.dueDate) { return false }
    var todayStr = new Date().toISOString().split("T")[0]
    return task.dueDate === todayStr && task.column !== "Done"
  }

  var isDueSoon = function(task) {
    if (!task.dueDate) { return false }
    if (isOverdue(task) || isDueToday(task)) { return false }
    var today = new Date()
    today.setHours(0, 0, 0, 0)
    var diff = (new Date(task.dueDate) - today) / (1000 * 60 * 60 * 24)
    return diff <= 3 && diff > 0 && task.column !== "Done"
  }

  var getProgress = function(task) {
    if (!task.checklist || task.checklist.length === 0) {
      return null
    }
    var done = task.checklist.filter(
      function(c) { return c.done }
    ).length
    return Math.round((done / task.checklist.length) * 100)
  }

  var totalTasks = bucketTasks.length
  var completedTasks = bucketTasks.filter(
    function(tk) { return tk.column === "Done" }
  ).length
  var overdueTasks = bucketTasks.filter(
    function(tk) { return isOverdue(tk) }
  ).length
  var dueSoonTasks = bucketTasks.filter(
    function(tk) { return isDueSoon(tk) || isDueToday(tk) }
  ).length

  var allTotal = tasks.length
  var allCompleted = tasks.filter(
    function(tk) { return tk.column === "Done" }
  ).length
  var allOverdue = tasks.filter(
    function(tk) { return isOverdue(tk) }
  ).length

  var th = darkMode ? {
    bg: "#1a1a2e",
    headerBg: "linear-gradient(135deg, #16213e, #0f3460)",
    cardBg: "#16213e",
    columnBg: "#1a1a3e",
    text: "#e0e0e0",
    subtext: "#a0a0b0",
    border: "#2a2a4a",
    toolbarBg: "#16213e",
    inputBg: "#1a1a3e",
    inputBorder: "#2a2a4a",
    modalBg: "#16213e"
  } : {
    bg: "#eef2f7",
    headerBg: "linear-gradient(135deg, #0078d4, #005a9e)",
    cardBg: "white",
    columnBg: "#f4f6f8",
    text: "#333",
    subtext: "#777",
    border: "#ddd",
    toolbarBg: "white",
    inputBg: "white",
    inputBorder: "#ccc",
    modalBg: "white"
  }

  var statsText = "📊" + totalTasks + " | ✅" + completedTasks
  if (overdueTasks > 0) {
    statsText = statsText + " | ⚠️" + overdueTasks
  }
  if (dueSoonTasks > 0) {
    statsText = statsText + " | 🔔" + dueSoonTasks
  }

  var currentBucket = buckets.find(
    function(b) { return b.id === currentBucketId }
  ) || buckets[0]

  var getBucketColor = function(bid) {
    return bucketColors[bid] || "#0078d4"
  }

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
      background: th.bg,
      minHeight: "100vh",
      color: th.text
    }}>
      <header style={{
        background: th.headerBg,
        color: "white",
        padding: "12px 24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          <h1 style={{ margin: 0, fontSize: "22px" }}>
            📋 My Planner
          </h1>
          <div style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexWrap: "wrap"
          }}>
            <span style={{ fontSize: "12px", opacity: 0.8 }}>
              {statsText}
            </span>
            <button
              onClick={function() {
                setShowDashboard(!showDashboard)
              }}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "6px",
                padding: "5px 10px",
                color: "white",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              📊 Dashboard
            </button>
            <button
              onClick={function() {
                setShowCalendar(!showCalendar)
              }}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "6px",
                padding: "5px 10px",
                color: "white",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              🗓️ Calendar
            </button>
            <button
              onClick={function() { setDarkMode(!darkMode) }}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "6px",
                padding: "5px 10px",
                color: "white",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        <div style={{
          display: "flex",
          gap: "6px",
          marginTop: "12px",
          flexWrap: "wrap",
          alignItems: "center"
        }}>
          {buckets.map(function(b) {
            var isActive = b.id === currentBucketId
            var bColor = getBucketColor(b.id)
            var bucketTaskCount = tasks.filter(
              function(tk) { return tk.bucketId === b.id }
            ).length
            return (
              <div
                key={b.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "3px"
                }}
              >
                <button
                  onClick={function() {
                    setCurrentBucketId(b.id)
                    setShowDashboard(false)
                    setShowCalendar(false)
                  }}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "8px 8px 0 0",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: isActive ? "bold" : "normal",
                    background: isActive
                      ? "rgba(255,255,255,0.3)"
                      : "rgba(255,255,255,0.1)",
                    color: "white"
                  }}
                >
                  {b.name}
                  <span style={{
                    marginLeft: "6px",
                    fontSize: "11px",
                    opacity: 0.7
                  }}>
                    ({bucketTaskCount})
                  </span>
                </button>
                {isActive && (
                  <div style={{ display: "flex", gap: "2px" }}>
                    <button
                      onClick={function() { openBucketModal(b) }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "white",
                        cursor: "pointer",
                        fontSize: "11px",
                        padding: "2px"
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={function() { deleteBucket(b.id) }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ffcdd2",
                        cursor: "pointer",
                        fontSize: "11px",
                        padding: "2px"
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          <button
            onClick={function() { openBucketModal(null) }}
            style={{
              padding: "7px 12px",
              borderRadius: "8px",
              border: "1px dashed rgba(255,255,255,0.5)",
              background: "transparent",
              color: "white",
              cursor: "pointer",
              fontSize: "13px"
            }}
          >
            + Bucket
          </button>
        </div>
      </header>

      {showDashboard && (
        <div style={{
          padding: "20px 24px",
          background: th.toolbarBg,
          borderBottom: "1px solid " + th.border
        }}>
          <h2 style={{
            margin: "0 0 16px 0",
            fontSize: "18px"
          }}>
            📊 Dashboard — All Projects
          </h2>
          <div style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "16px"
          }}>
            <div style={{
              background: darkMode ? "#1a1a3e" : "white",
              padding: "16px",
              borderRadius: "10px",
              flex: "1",
              minWidth: "120px",
              textAlign: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
            }}>
              <div style={{ fontSize: "28px", fontWeight: "bold" }}>
                {allTotal}
              </div>
              <div style={{
                fontSize: "13px",
                color: th.subtext
              }}>
                Total Tasks
              </div>
            </div>
            <div style={{
              background: darkMode ? "#1a1a3e" : "white",
              padding: "16px",
              borderRadius: "10px",
              flex: "1",
              minWidth: "120px",
              textAlign: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
            }}>
              <div style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: "#4caf50"
              }}>
                {allCompleted}
              </div>
              <div style={{
                fontSize: "13px",
                color: th.subtext
              }}>
                Completed
              </div>
            </div>
            <div style={{
              background: darkMode ? "#1a1a3e" : "white",
              padding: "16px",
              borderRadius: "10px",
              flex: "1",
              minWidth: "120px",
              textAlign: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
            }}>
              <div style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: allOverdue > 0 ? "#f44336" : th.text
              }}>
                {allOverdue}
              </div>
              <div style={{
                fontSize: "13px",
                color: th.subtext
              }}>
                Overdue
              </div>
            </div>
            <div style={{
              background: darkMode ? "#1a1a3e" : "white",
              padding: "16px",
              borderRadius: "10px",
              flex: "1",
              minWidth: "120px",
              textAlign: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
            }}>
              <div style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: "#0078d4"
              }}>
                {allTotal > 0
                  ? Math.round((allCompleted / allTotal) * 100)
                  : 0}%
              </div>
              <div style={{
                fontSize: "13px",
                color: th.subtext
              }}>
                Complete
              </div>
            </div>
          </div>

          <h3 style={{
            margin: "0 0 10px 0",
            fontSize: "15px"
          }}>
            Per Bucket
          </h3>
          <div style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap"
          }}>
            {buckets.map(function(b) {
              var bt = tasks.filter(
                function(tk) { return tk.bucketId === b.id }
              )
              var bd = bt.filter(
                function(tk) { return tk.column === "Done" }
              ).length
              var pct = bt.length > 0
                ? Math.round((bd / bt.length) * 100)
                : 0
              return (
                <div
                  key={b.id}
                  style={{
                    background: darkMode ? "#1a1a3e" : "white",
                    padding: "12px",
                    borderRadius: "8px",
                    minWidth: "140px",
                    flex: "1",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
                  }}
                >
                  <div style={{
                    fontWeight: "bold",
                    fontSize: "14px",
                    marginBottom: "6px"
                  }}>
                    {b.name}
                  </div>
                  <div style={{
                    fontSize: "12px",
                    color: th.subtext,
                    marginBottom: "6px"
                  }}>
                    {bd}/{bt.length} done
                  </div>
                  <div style={{
                    background: darkMode ? "#2a2a4a" : "#e0e0e0",
                    borderRadius: "10px",
                    height: "8px",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      background: pct === 100
                        ? "#4caf50"
                        : getBucketColor(b.id),
                      height: "100%",
                      width: pct + "%",
                      borderRadius: "10px",
                      transition: "width 0.3s"
                    }} />
                  </div>
                  <div style={{
                    fontSize: "11px",
                    color: th.subtext,
                    marginTop: "4px"
                  }}>
                    {pct}%
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showCalendar && (
        <div style={{
          padding: "20px 24px",
          background: th.toolbarBg,
          borderBottom: "1px solid " + th.border
        }}>
          <h2 style={{
            margin: "0 0 16px 0",
            fontSize: "18px"
          }}>
            🗓️ Upcoming Due Dates
          </h2>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}>
            {tasks.filter(
              function(tk) {
                return tk.dueDate && tk.column !== "Done"
              }
            ).sort(
              function(a, b) {
                return new Date(a.dueDate) - new Date(b.dueDate)
              }
            ).slice(0, 15).map(function(tk) {
              var bucket = buckets.find(
                function(b) { return b.id === tk.bucketId }
              )
              var bucketName = bucket ? bucket.name : "?"
              return (
                <div
                  key={tk.id}
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: darkMode ? "#1a1a3e" : "white",
                    borderRadius: "8px",
                    borderLeft: "4px solid " + priorityColors[tk.priority],
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
                  }}
                >
                  <div style={{
                    fontWeight: "bold",
                    fontSize: "13px",
                    color: isOverdue(tk)
                      ? "#f44336"
                      : isDueToday(tk)
                        ? "#ff9800"
                        : th.text,
                    minWidth: "90px"
                  }}>
                    {tk.dueDate}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: "600",
                      fontSize: "14px"
                    }}>
                      {tk.title}
                    </div>
                    <div style={{
                      fontSize: "12px",
                      color: th.subtext
                    }}>
                      {bucketName} → {tk.column}
                    </div>
                  </div>
                  <span style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    color: "white",
                    background: priorityColors[tk.priority]
                  }}>
                    {priorityEmoji[tk.priority]} {tk.priority}
                  </span>
                </div>
              )
            })}
            {tasks.filter(
              function(tk) {
                return tk.dueDate && tk.column !== "Done"
              }
            ).length === 0 && (
              <div style={{
                textAlign: "center",
                padding: "20px",
                color: th.subtext
              }}>
                No upcoming due dates
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{
        padding: "12px 24px",
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        alignItems: "center",
        background: th.toolbarBg,
        borderBottom: "1px solid " + th.border
      }}>
        <input
          type="text"
          placeholder={"🔍 Search in " + currentBucket.name + "..."}
          value={searchQuery}
          onChange={function(e) {
            setSearchQuery(e.target.value)
          }}
          style={{
            padding: "8px 14px",
            border: "1px solid " + th.inputBorder,
            borderRadius: "6px",
            fontSize: "14px",
            flex: "1",
            minWidth: "150px",
            background: th.inputBg,
            color: th.text
          }}
        />
        <select
          value={filterPriority}
          onChange={function(e) {
            setFilterPriority(e.target.value)
          }}
          style={{
            padding: "8px 12px",
            border: "1px solid " + th.inputBorder,
            borderRadius: "6px",
            fontSize: "14px",
            background: th.inputBg,
            color: th.text
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
          onChange={function(e) {
            setSortBy(e.target.value)
          }}
          style={{
            padding: "8px 12px",
            border: "1px solid " + th.inputBorder,
            borderRadius: "6px",
            fontSize: "14px",
            background: th.inputBg,
            color: th.text
          }}
        >
          <option value="none">Sort: Default</option>
          <option value="priority">Sort: Priority</option>
          <option value="dueDate">Sort: Due Date</option>
          <option value="name">Sort: Name</option>
        </select>
        <button
          onClick={function() { openNewTask("To Do") }}
          style={{
            padding: "8px 20px",
            background: "#0078d4",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          + New Task
        </button>
      </div>

      <div style={{
        display: "flex",
        gap: "16px",
        padding: "20px",
        overflowX: "auto",
        minHeight: "calc(100vh - 200px)"
      }}>
        {defaultColumns.map(function(column) {
          var colTasks = filteredTasks.filter(
            function(tk) { return tk.column === column }
          )
          colTasks = sortTasks(colTasks)

          return (
            <div
              key={column}
              onDragOver={handleDragOver}
              onDrop={function(e) { handleDrop(e, column) }}
              style={{
                background: th.columnBg,
                borderRadius: "12px",
                padding: "14px",
                minWidth: "280px",
                flex: "1",
                maxWidth: "350px",
                border: draggedTaskId
                  ? "2px dashed #0078d4"
                  : "2px solid transparent"
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px"
              }}>
                <h2 style={{
                  margin: 0,
                  fontSize: "16px",
                  color: th.text
                }}>
                  {column}
                </h2>
                <span style={{
                  background: darkMode ? "#2a2a4a" : "#ddd",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: th.text
                }}>
                  {colTasks.length}
                </span>
              </div>

              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginBottom: "10px"
              }}>
                {colTasks.map(function(task) {
                  var progress = getProgress(task)
                  var overdue = isOverdue(task)
                  var dueToday = isDueToday(task)
                  var dueSoon = isDueSoon(task)
                  var isExpanded = viewingTask === task.id

                  return (
                    <div
                      key={task.id}
                      draggable={true}
                      onDragStart={function(e) {
                        handleDragStart(e, task.id)
                      }}
                      onClick={function() {
                        setViewingTask(
                          isExpanded ? null : task.id
                        )
                      }}
                      style={{
                        background: th.cardBg,
                        borderRadius: "8px",
                        padding: "12px",
                        boxShadow: task.pinned
                          ? "0 2px 8px rgba(0,120,212,0.3)"
                          : "0 1px 4px rgba(0,0,0,0.08)",
                        borderLeft: "4px solid " + priorityColors[task.priority],
                        cursor: "pointer",
                        border: overdue
                          ? "1px solid #f44336"
                          : dueToday
                            ? "1px solid #ff9800"
                            : task.pinned
                              ? "1px solid #0078d4"
                              : "1px solid transparent",
                        opacity: draggedTaskId === task.id
                          ? 0.5
                          : 1
                      }}
                    >
                      {task.pinned && (
                        <div style={{
                          fontSize: "11px",
                          color: "#0078d4",
                          fontWeight: "bold",
                          marginBottom: "4px"
                        }}>
                          📌 PINNED
                        </div>
                      )}

                      {task.labels && task.labels.length > 0 && (
                        <div style={{
                          display: "flex",
                          gap: "4px",
                          flexWrap: "wrap",
                          marginBottom: "6px"
                        }}>
                          {task.labels.map(function(l) {
                            var lo = defaultLabels.find(
                              function(x) {
                                return x.name === l
                              }
                            )
                            return (
                              <span
                                key={l}
                                style={{
                                  fontSize: "10px",
                                  padding: "2px 8px",
                                  borderRadius: "10px",
                                  color: "white",
                                  background: lo
                                    ? lo.color
                                    : "#999"
                                }}
                              >
                                {l}
                              </span>
                            )
                          })}
                        </div>
                      )}

                      <div style={{
                        fontWeight: "600",
                        fontSize: "14px",
                        marginBottom: "6px",
                        color: th.text
                      }}>
                        {task.title}
                      </div>

                      {task.assignee && (
                        <div style={{
                          fontSize: "12px",
                          color: th.subtext,
                          marginBottom: "6px"
                        }}>
                          👤 {task.assignee}
                        </div>
                      )}

                      <div style={{
                        display: "flex",
                        gap: "6px",
                        alignItems: "center",
                        flexWrap: "wrap",
                        marginBottom: "6px"
                      }}>
                        <span style={{
                          fontSize: "11px",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          color: "white",
                          background: priorityColors[task.priority]
                        }}>
                          {priorityEmoji[task.priority]} {task.priority}
                        </span>
                        {overdue && (
                          <span style={{
                            fontSize: "11px",
                            color: "#f44336",
                            fontWeight: "bold"
                          }}>
                            ⚠️ OVERDUE
                          </span>
                        )}
                        {dueToday && (
                          <span style={{
                            fontSize: "11px",
                            color: "#ff9800",
                            fontWeight: "bold"
                          }}>
                            📌 TODAY
                          </span>
                        )}
                        {dueSoon && (
                          <span style={{
                            fontSize: "11px",
                            color: "#ffa726",
                            fontWeight: "bold"
                          }}>
                            🔔 SOON
                          </span>
                        )}
                      </div>

                      {(task.startDate || task.dueDate) && (
                        <div style={{
                          fontSize: "12px",
                          color: th.subtext,
                          marginBottom: "6px"
                        }}>
                          {task.startDate && (
                            <div>
                              📅 Start: {task.startDate}
                            </div>
                          )}
                          {task.dueDate && (
                            <div style={{
                              color: overdue
                                ? "#f44336"
                                : dueToday
                                  ? "#ff9800"
                                  : th.subtext
                            }}>
                              ⏰ Due: {task.dueDate}
                            </div>
                          )}
                        </div>
                      )}

                      {progress !== null && (
                        <div style={{ marginBottom: "6px" }}>
                          <div style={{
                            background: darkMode
                              ? "#2a2a4a"
                              : "#e0e0e0",
                            borderRadius: "10px",
                            height: "6px",
                            overflow: "hidden"
                          }}>
                            <div style={{
                              background: progress === 100
                                ? "#4caf50"
                                : "#0078d4",
                              height: "100%",
                              width: progress + "%",
                              borderRadius: "10px",
                              transition: "width 0.3s"
                            }} />
                          </div>
                          <span style={{
                            fontSize: "11px",
                            color: th.subtext
                          }}>
                            {progress}%
                          </span>
                        </div>
                      )}

                      {task.comments && task.comments.length > 0 && !isExpanded && (
                        <div style={{
                          fontSize: "11px",
                          color: th.subtext
                        }}>
                          💬 {task.comments.length} comment{task.comments.length > 1 ? "s" : ""}
                        </div>
                      )}

                      {isExpanded && (
                        <div style={{
                          marginTop: "10px",
                          borderTop: "1px solid " + th.border,
                          paddingTop: "10px"
                        }}>
                          {task.notes && (
                            <div style={{ marginBottom: "10px" }}>
                              <strong style={{ fontSize: "12px" }}>
                                📝 Notes:
                              </strong>
                              <p style={{
                                fontSize: "13px",
                                color: th.subtext,
                                margin: "4px 0",
                                whiteSpace: "pre-wrap"
                              }}>
                                {task.notes}
                              </p>
                            </div>
                          )}

                          {task.checklist && task.checklist.length > 0 && (
                            <div style={{ marginBottom: "10px" }}>
                              <strong style={{ fontSize: "12px" }}>
                                ☑️ Checklist:
                              </strong>
                              {task.checklist.map(
                                function(item, i) {
                                  return (
                                    <div
                                      key={i}
                                      onClick={function(e) {
                                        e.stopPropagation()
                                        toggleChecklistItem(
                                          task.id, i
                                        )
                                      }}
                                      style={{
                                        display: "flex",
                                        gap: "8px",
                                        alignItems: "center",
                                        padding: "4px 0",
                                        cursor: "pointer",
                                        fontSize: "13px"
                                      }}
                                    >
                                      <span>
                                        {item.done ? "✅" : "⬜"}
                                      </span>
                                      <span style={{
                                        textDecoration: item.done
                                          ? "line-through"
                                          : "none",
                                        color: item.done
                                          ? th.subtext
                                          : th.text
                                      }}>
                                        {item.text}
                                      </span>
                                    </div>
                                  )
                                }
                              )}
                            </div>
                          )}

                          {task.comments && task.comments.length > 0 && (
                            <div style={{ marginBottom: "10px" }}>
                              <strong style={{ fontSize: "12px" }}>
                                💬 Comments:
                              </strong>
                              {task.comments.map(
                                function(c, i) {
                                  return (
                                    <div
                                      key={i}
                                      style={{
                                        padding: "6px 10px",
                                        background: darkMode
                                          ? "#1a1a2e"
                                          : "#f9f9f9",
                                        borderRadius: "6px",
                                        marginTop: "4px",
                                        fontSize: "13px"
                                      }}
                                    >
                                      <div style={{
                                        color: th.text
                                      }}>
                                        {c.text}
                                      </div>
                                      <div style={{
                                        fontSize: "10px",
                                        color: th.subtext,
                                        marginTop: "2px"
                                      }}>
                                        {c.date}
                                      </div>
                                    </div>
                                  )
                                }
                              )}
                            </div>
                          )}

                          <div
                            onClick={function(e) {
                              e.stopPropagation()
                            }}
                            style={{
                              display: "flex",
                              gap: "6px",
                              marginBottom: "10px"
                            }}
                          >
                            <input
                              type="text"
                              value={newCommentText}
                              onChange={function(e) {
                                setNewCommentText(e.target.value)
                              }}
                              onKeyDown={function(e) {
                                if (e.key === "Enter") {
                                  addComment(task.id)
                                }
                              }}
                              placeholder="Add a comment..."
                              style={{
                                flex: 1,
                                padding: "6px 10px",
                                border: "1px solid " + th.inputBorder,
                                borderRadius: "4px",
                                fontSize: "12px",
                                background: th.inputBg,
                                color: th.text
                              }}
                            />
                            <button
                              onClick={function() {
                                addComment(task.id)
                              }}
                              style={{
                                padding: "6px 10px",
                                border: "none",
                                borderRadius: "4px",
                                background: "#0078d4",
                                color: "white",
                                cursor: "pointer",
                                fontSize: "12px"
                              }}
                            >
                              💬
                            </button>
                          </div>

                          <div style={{
                            display: "flex",
                            gap: "6px",
                            flexWrap: "wrap",
                            marginBottom: "8px"
                          }}>
                            {defaultColumns.filter(
                              function(c) {
                                return c !== task.column
                              }
                            ).map(function(c) {
                              return (
                                <button
                                  key={c}
                                  onClick={function(e) {
                                    e.stopPropagation()
                                    moveTask(task.id, c)
                                  }}
                                  style={{
                                    fontSize: "11px",
                                    padding: "4px 10px",
                                    border: "1px solid #0078d4",
                                    borderRadius: "4px",
                                    background: th.cardBg,
                                    color: "#0078d4",
                                    cursor: "pointer"
                                  }}
                                >
                                  → {c}
                                </button>
                              )
                            })}
                          </div>

                          <div style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap"
                          }}>
                            <button
                              onClick={function(e) {
                                e.stopPropagation()
                                togglePin(task.id)
                              }}
                              style={{
                                fontSize: "12px",
                                padding: "6px 12px",
                                border: "none",
                                borderRadius: "4px",
                                background: task.pinned
                                  ? "#ff9800"
                                  : "#607d8b",
                                color: "white",
                                cursor: "pointer"
                              }}
                            >
                              {task.pinned ? "📌 Unpin" : "📌 Pin"}
                            </button>
                            <button
                              onClick={function(e) {
                                e.stopPropagation()
                                openEditTask(task)
                              }}
                              style={{
                                fontSize: "12px",
                                padding: "6px 12px",
                                border: "none",
                                borderRadius: "4px",
                                background: "#0078d4",
                                color: "white",
                                cursor: "pointer"
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={function(e) {
                                e.stopPropagation()
                                deleteTask(task.id)
                              }}
                              style={{
                                fontSize: "12px",
                                padding: "6px 12px",
                                border: "none",
                                borderRadius: "4px",
                                background: "#f44336",
                                color: "white",
                                cursor: "pointer"
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <button
                onClick={function() { openNewTask(column) }}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "2px dashed " + (darkMode
                    ? "#2a2a4a"
                    : "#ccc"),
                  borderRadius: "8px",
                  background: "transparent",
                  color: th.subtext,
                  cursor: "pointer",
                  fontSize: "13px"
                }}
              >
                + Add Task
              </button>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div
          onClick={function() { setShowModal(false) }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
          }}
        >
          <div
            onClick={function(e) { e.stopPropagation() }}
            style={{
              background: th.modalBg,
              borderRadius: "12px",
              padding: "24px",
              width: "100%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflowY: "auto",
              color: th.text
            }}
          >
            <h2 style={{ margin: "0 0 16px 0" }}>
              {editingTask ? "✏️ Edit Task" : "➕ New Task"}
            </h2>

            <label style={{
              fontSize: "13px",
              fontWeight: "bold",
              color: th.subtext,
              display: "block",
              marginBottom: "4px"
            }}>
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={function(e) {
                updateForm("title", e.target.value)
              }}
              placeholder="What needs to be done?"
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid " + th.inputBorder,
                borderRadius: "6px",
                fontSize: "14px",
                marginBottom: "12px",
                boxSizing: "border-box",
                background: th.inputBg,
                color: th.text
              }}
            />

            <label style={{
              fontSize: "13px",
              fontWeight: "bold",
              color: th.subtext,
              display: "block",
              marginBottom: "4px"
            }}>
              Assigned To
            </label>
            <input
              type="text"
              value={form.assignee}
              onChange={function(e) {
                updateForm("assignee", e.target.value)
              }}
              placeholder="Who is responsible?"
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid " + th.inputBorder,
                borderRadius: "6px",
                fontSize: "14px",
                marginBottom: "12px",
                boxSizing: "border-box",
                background: th.inputBg,
                color: th.text
              }}
            />

            <label style={{
              fontSize: "13px",
              fontWeight: "bold",
              color: th.subtext,
              display: "block",
              marginBottom: "4px"
            }}>
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={function(e) {
                updateForm("notes", e.target.value)
              }}
              placeholder="Add details, links, or instructions..."
              rows={3}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid " + th.inputBorder,
                borderRadius: "6px",
                fontSize: "14px",
                marginBottom: "12px",
                boxSizing: "border-box",
                resize: "vertical",
                background: th.inputBg,
                color: th.text
              }}
            />

            <div style={{
              display: "flex",
              gap: "12px",
              marginBottom: "12px"
            }}>
              <div style={{ flex: 1 }}>
                <label style={{
                  fontSize: "13px",
                  fontWeight: "bold",
                  color: th.subtext,
                  display: "block",
                  marginBottom: "4px"
                }}>
                  Priority
                </label>
                <select
                  value={form.priority}
                  onChange={function(e) {
                    updateForm("priority", e.target.value)
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid " + th.inputBorder,
                    borderRadius: "6px",
                    fontSize: "14px",
                    background: th.inputBg,
                    color: th.text
                  }}
                >
                  <option value="Urgent">🔴 Urgent</option>
                  <option value="High">🟠 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">🟢 Low</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{
                  fontSize: "13px",
                  fontWeight: "bold",
                  color: th.subtext,
                  display: "block",
                  marginBottom: "4px"
                }}>
                  Column
                </label>
                <select
                  value={form.column}
                  onChange={function(e) {
                    updateForm("column", e.target.value)
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid " + th.inputBorder,
                    borderRadius: "6px",
                    fontSize: "14px",
                    background: th.inputBg,
                    color: th.text
                  }}
                >
                  {defaultColumns.map(function(c) {
                    return (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            <div style={{
              display: "flex",
              gap: "12px",
              marginBottom: "12px"
            }}>
              <div style={{ flex: 1 }}>
                <label style={{
                  fontSize: "13px",
                  fontWeight: "bold",
                  color: th.subtext,
                  display: "block",
                  marginBottom: "4px"
                }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={function(e) {
                    updateForm("startDate", e.target.value)
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid " + th.inputBorder,
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    background: th.inputBg,
                    color: th.text
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{
                  fontSize: "13px",
                  fontWeight: "bold",
                  color: th.subtext,
                  display: "block",
                  marginBottom: "4px"
                }}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={function(e) {
                    updateForm("dueDate", e.target.value)
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid " + th.inputBorder,
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    background: th.inputBg,
                    color: th.text
                  }}
                />
              </div>
            </div>

            <div style={{
              display: "flex",
              gap: "12px",
              marginBottom: "12px",
              alignItems: "center"
            }}>
              <label style={{
                fontSize: "13px",
                fontWeight: "bold",
                color: th.subtext
              }}>
                📌 Pinned
              </label>
              <button
                onClick={function() {
                  updateForm("pinned", !form.pinned)
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  background: form.pinned
                    ? "#ff9800"
                    : (darkMode ? "#2a2a4a" : "#e0e0e0"),
                  color: form.pinned ? "white" : th.subtext,
                  fontSize: "13px"
                }}
              >
                {form.pinned ? "📌 Pinned" : "Not Pinned"}
              </button>
            </div>

            <label style={{
              fontSize: "13px",
              fontWeight: "bold",
              color: th.subtext,
              display: "block",
              marginBottom: "4px"
            }}>
              Labels
            </label>
            <div style={{
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              marginBottom: "12px"
            }}>
              {defaultLabels.map(function(l) {
                var sel = form.labels.indexOf(l.name) >= 0
                return (
                  <button
                    key={l.name}
                    onClick={function() {
                      toggleLabel(l.name)
                    }}
                    style={{
                      fontSize: "12px",
                      padding: "4px 12px",
                      borderRadius: "12px",
                      border: "none",
                      cursor: "pointer",
                      background: sel
                        ? l.color
                        : (darkMode ? "#2a2a4a" : "#e0e0e0"),
                      color: sel ? "white" : th.subtext
                    }}
                  >
                    {l.name}
                  </button>
                )
              })}
            </div>

            <label style={{
              fontSize: "13px",
              fontWeight: "bold",
              color: th.subtext,
              display: "block",
              marginBottom: "4px"
            }}>
              Checklist
            </label>
            <div style={{ marginBottom: "8px" }}>
              {form.checklist.map(function(item, i) {
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 10px",
                      background: darkMode
                        ? "#1a1a2e"
                        : "#f9f9f9",
                      borderRadius: "4px",
                      marginBottom: "4px"
                    }}
                  >
                    <span style={{ fontSize: "13px" }}>
                      {item.text}
                    </span>
                    <button
                      onClick={function() {
                        removeChecklistItem(i)
                      }}
                      style={{
                        border: "none",
                        background: "none",
                        color: "#f44336",
                        cursor: "pointer",
                        fontSize: "16px"
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
            <div style={{
              display: "flex",
              gap: "8px",
              marginBottom: "16px"
            }}>
              <input
                type="text"
                value={newChecklistItem}
                onChange={function(e) {
                  setNewChecklistItem(e.target.value)
                }}
                onKeyDown={function(e) {
                  if (e.key === "Enter") {
                    addChecklistItem()
                  }
                }}
                placeholder="Add checklist item..."
                style={{
                  flex: 1,
                  padding: "8px",
                  border: "1px solid " + th.inputBorder,
                  borderRadius: "6px",
                  fontSize: "13px",
                  background: th.inputBg,
                  color: th.text
                }}
              />
              <button
                onClick={addChecklistItem}
                style={{
                  padding: "8px 14px",
                  border: "none",
                  borderRadius: "6px",
                  background: "#0078d4",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "13px"
                }}
              >
                Add
              </button>
            </div>

            <div style={{
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end"
            }}>
              <button
                onClick={function() { setShowModal(false) }}
                style={{
                  padding: "10px 20px",
                  border: "1px solid " + th.inputBorder,
                  borderRadius: "6px",
                  background: th.cardBg,
                  cursor: "pointer",
                  fontSize: "14px",
                  color: th.text
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveTask}
                style={{
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "6px",
                  background: "#0078d4",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold"
                }}
              >
                {editingTask ? "Save Changes" : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBucketModal && (
        <div
          onClick={function() { setShowBucketModal(false) }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
          }}
        >
          <div
            onClick={function(e) { e.stopPropagation() }}
            style={{
              background: th.modalBg,
              borderRadius: "12px",
              padding: "24px",
              width: "100%",
              maxWidth: "400px",
              color: th.text
            }}
          >
            <h2 style={{ margin: "0 0 16px 0" }}>
              {editingBucketId
                ? "✏️ Rename Bucket"
                : "📂 New Bucket"}
            </h2>
            <input
              type="text"
              value={bucketFormName}
              onChange={function(e) {
                setBucketFormName(e.target.value)
              }}
              onKeyDown={function(e) {
                if (e.key === "Enter") {
                  if (editingBucketId) {
                    renameBucket()
                  } else {
                    addBucket()
                  }
                }
              }}
              placeholder="Bucket name (e.g. New Project)"
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid " + th.inputBorder,
                borderRadius: "6px",
                fontSize: "14px",
                marginBottom: "16px",
                boxSizing: "border-box",
                background: th.inputBg,
                color: th.text
              }}
            />
            <div style={{
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end"
            }}>
              <button
                onClick={function() {
                  setShowBucketModal(false)
                }}
                style={{
                  padding: "10px 20px",
                  border: "1px solid " + th.inputBorder,
                  borderRadius: "6px",
                  background: th.cardBg,
                  cursor: "pointer",
                  fontSize: "14px",
                  color: th.text
                }}
              >
                Cancel
              </button>
              <button
                onClick={function() {
                  if (editingBucketId) {
                    renameBucket()
                  } else {
                    addBucket()
                  }
                }}
                style={{
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "6px",
                  background: "#0078d4",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold"
                }}
              >
                {editingBucketId ? "Save" : "Create Bucket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
