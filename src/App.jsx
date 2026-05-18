import { useState } from "react"

export default function App() {
  const [tasks, setTasks] = useState({
    "To Do": ["Task 1", "Task 2"],
    "In Progress": ["Task 3"],
    "Done": []
  })

  const addTask = (column) => {
    const newTask = prompt("Enter task name:")
    if (!newTask) return
    setTasks({
      ...tasks,
      [column]: [...tasks[column], newTask]
    })
  }

  const deleteTask = (column, index) => {
    const updated = tasks[column].filter((_, i) => i !== index)
    setTasks({ ...tasks, [column]: updated })
  }

  return (
    <div style={{ fontFamily: "Arial", padding: "20px", textAlign: "center" }}>
      <h1 style={{ color: "#333" }}>📋 My Planner</h1>

      <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
        {Object.keys(tasks).map((col) => (
          <div key={col} style={{
            background: "#f0f0f0",
            padding: "15px",
            borderRadius: "12px",
            width: "260px",
            minHeight: "200px"
          }}>
            <h2 style={{ color: "#555" }}>{col}</h2>

            {tasks[col].map((task, i) => (
              <div key={i} style={{
                background: "white",
                padding: "10px",
                margin: "8px 0",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}>
                <span>{task}</span>
                <button
                  onClick={() => deleteTask(col, i)}
                  style={{ border: "none", background: "none", color: "red", cursor: "pointer", fontSize: "16px" }}
                >✕</button>
              </div>
            ))}

            <button
              onClick={() => addTask(col)}
              style={{
                marginTop: "10px",
                padding: "8px 16px",
                border: "none",
                borderRadius: "6px",
                background: "#0078d4",
                color: "white",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >+ Add Task</button>
          </div>
        ))}
      </div>
    </div>
  )
}
