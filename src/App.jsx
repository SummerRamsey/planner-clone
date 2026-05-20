import { useState } from "react";

const defaultProjects = [
  "Saddleside - Ponder",
  "Pistone and Downe",
  "Lonestar Phase 2",
  "Alpha Ranch",
  "Other"
];

export default function Planner() {
  const [projects, setProjects] = useState(
    defaultProjects.map((name) => ({
      name,
      tasks: [],
      completed: [],
    }))
  );

  const addTask = (index) => {
    const text = prompt("Task name:");
    if (!text) return;

    const newProjects = [...projects];
    newProjects[index].tasks.push({
      id: Date.now(),
      text,
      priority: "Medium",
      date: "",
    });

    setProjects(newProjects);
  };

  const completeTask = (pIndex, tIndex) => {
    const newProjects = [...projects];
    const task = newProjects[pIndex].tasks.splice(tIndex, 1)[0];
    newProjects[pIndex].completed.push(task);
    setProjects(newProjects);
  };

  return (
    <div style={container}>
      <h1 style={title}>Planner</h1>

      <div style={board}>
        {projects.map((project, pIndex) => (
          <div key={pIndex} style={column}>
            
            <h3 style={columnTitle}>{project.name}</h3>

            <button onClick={() => addTask(pIndex)} style={addBtn}>
              + Add task
            </button>

            {project.tasks.map((task, tIndex) => (
              <div key={task.id} style={card}>
                
                <div style={priorityStyle(task.priority)}>
                  {task.priority}
                </div>

                <div style={taskRow}>
                  <input
                    type="checkbox"
                    onChange={() => completeTask(pIndex, tIndex)}
                  />
                  <span>{task.text}</span>
                </div>

                {task.date && (
                  <div style={date}>
                    {task.date}
                  </div>
                )}
              </div>
            ))}

            {project.completed.length > 0 && (
              <div style={completed}>
                Completed tasks ({project.completed.length})
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}

/* STYLES */

const container = {
  padding: "20px",
  background: "#f4f5f8",
  minHeight: "100vh"
};

const title = {
  marginBottom: "20px",
  fontWeight: "600"
};

const board = {
  display: "flex",
  gap: "20px",
  overflowX: "auto"
};

const column = {
  minWidth: "260px",
  background: "#ffffff",
  padding: "15px",
  borderRadius: "12px",
  border: "1px solid #e5e7eb"
};

const columnTitle = {
  marginBottom: "10px",
  fontWeight: "600"
};

const addBtn = {
  marginBottom: "12px",
  padding: "6px 10px",
  border: "1px solid #ddd",
  background: "#fafafa",
  borderRadius: "6px",
  cursor: "pointer"
};

const card = {
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  marginBottom: "10px",
  background: "#ffffff"
};

const taskRow = {
  display: "flex",
  alignItems: "center",
  gap: "8px"
};

const date = {
  fontSize: "12px",
  color: "#666",
  marginTop: "6px"
};

const completed = {
  marginTop: "10px",
  fontSize: "13px",
  color: "#888"
};

const priorityStyle = (priority) => {
  const colors = {
    High: "#fca5a5",
    Medium: "#93c5fd",
    Low: "#c4b5fd"
  };

  return {
    background: colors[priority],
    padding: "3px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    marginBottom: "6px",
    display: "inline-block"
  };
};
``
