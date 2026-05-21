import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";

export default function PlannerApp() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("Not Started");

  const addTask = () => {
    if (!title) return;
    setTasks([
      ...tasks,
      { id: Date.now(), title, date, status }
    ]);
    setTitle("");
    setDate("");
  };

  const updateStatus = (id, newStatus) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold mb-4">Project Planner</h1>

      {/* Add Task */}
      <Card className="mb-6 rounded-2xl">
        <CardContent className="p-4 grid gap-3 md:grid-cols-4">
          <Input placeholder="Task name" value={title} onChange={e => setTitle(e.target.value)} />
          <input type="date" className="border rounded-lg p-2" value={date} onChange={e => setDate(e.target.value)} />

          <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded-lg p-2">
            <option>Not Started</option>
            <option>In Progress</option>
            <option>Complete</option>
          </select>

          <Button onClick={addTask}>Add Task</Button>
        </CardContent>
      </Card>

      {/* Task List */}
      <div className="grid gap-4">
        {tasks.map(task => (
          <Card key={task.id} className="rounded-2xl shadow-sm">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <h2 className="font-medium">{task.title}</h2>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar size={14}/> {task.date || "No date"}
                </p>
              </div>

              <select
                value={task.status}
                onChange={e => updateStatus(task.id, e.target.value)}
                className={`p-2 rounded-lg text-sm ${
                  task.status === "Complete" ? "bg-green-100" :
                  task.status === "In Progress" ? "bg-yellow-100" : "bg-gray-100"
                }`}>
                <option>Not Started</option>
                <option>In Progress</option>
                <option>Complete</option>
              </select>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
