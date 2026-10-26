import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "https://taskmate-api-fipb.onrender.com/api/tasks";

const starterTasks = [
  {
    id: 1,
    title: "Complete capstone documentation",
    description: "Prepare the project report and SRS.",
    priority: "High",
    dueDate: "",
    status: "In Progress",
    createdAt: Date.now(),
  },
  {
    id: 2,
    title: "Review React fundamentals",
    description: "Practice components, props and state.",
    priority: "Medium",
    dueDate: "",
    status: "Pending",
    createdAt: Date.now() - 1000,
  },
  {
    id: 3,
    title: "Organize project files",
    description: "Keep the project folder clean and organized.",
    priority: "Low",
    dueDate: "",
    status: "Completed",
    createdAt: Date.now() - 2000,
  },
];

function readTasks() {
  try {
    const saved = localStorage.getItem("taskmate-tasks");
    return saved === null ? starterTasks : JSON.parse(saved);
  } catch {
    return starterTasks;
  }
}

function App() {
const [tasks, setTasks] = useState([]);
const [loadingTasks, setLoadingTasks] = useState(true);
 
const [isLoggedIn, setIsLoggedIn] = useState(
  () => Boolean(localStorage.getItem("taskmate-token"))
);
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [name, setName] = useState("");
const [authMode, setAuthMode] = useState("login");
const [currentUser, setCurrentUser] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem("taskmate-user") || "null");
  } catch {
    return null;
  }
});
const [showPassword, setShowPassword] = useState(false);
const [loginError, setLoginError] = useState("");

async function handleLogin(event) {
  event.preventDefault();
  setLoginError("");

  try {
    const endpoint =
      authMode === "register" ? "/register" : "/login";

    const payload =
      authMode === "register"
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

    const response = await axios.post(
      `https://taskmate-api-fipb.onrender.com/api/auth${endpoint}`,
      payload
    );

    localStorage.setItem("taskmate-token", response.data.token);
    localStorage.setItem(
      "taskmate-user",
      JSON.stringify(response.data.user)
    );

    setCurrentUser(response.data.user);
    setIsLoggedIn(true);
    setPassword("");
  } catch (error) {
    setLoginError(
      error.response?.data?.message ||
        "Could not connect to the server. Check that the backend is running."
    );
  }
}

function handleLogout() {
  localStorage.removeItem("taskmate-token");
  localStorage.removeItem("taskmate-user");
  localStorage.removeItem("taskmate-demo-login");

  setCurrentUser(null);
  setIsLoggedIn(false);
  setTasks([]);
  setPassword("");
  setEmail("");
  setName("");
  setAuthMode("login");
  setLoginError("");
  setNotice("");
}


  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    dueDate: "",
  });

  
useEffect(() => {
  if (!isLoggedIn) {
    setTasks([]);
    setLoadingTasks(false);
    return;
  }

  async function loadTasks() {
    setLoadingTasks(true);

    try {
      const token = localStorage.getItem("taskmate-token");

      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setTasks(response.data);
    } catch (error) {
      setNotice(
        error.response?.status === 401
          ? "Your session expired. Please log in again."
          : "Could not load tasks. Check whether the backend is running."
      );

      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoadingTasks(false);
    }
  }

  loadTasks();
}, [isLoggedIn]);


  const completed = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const inProgress = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;

  const pending = tasks.filter(
    (task) => task.status === "Pending"
  ).length;

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const query = search.toLowerCase();
        const matchesSearch =
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query);

        const matchesFilter =
          filter === "All" || task.status === filter;

        return matchesSearch && matchesFilter;
      })
      .sort(
  (a, b) =>
    new Date(b.createdAt).getTime() -
    new Date(a.createdAt).getTime()
);
  }, [tasks, search, filter]);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function openNewTask() {
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      priority: "Medium",
      dueDate: "",
    });
    setNotice("");
    setShowForm(true);
  }

  function editTask(task) {
    setEditingId(task._id);
    setForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate || "",
    });
    setShowForm(true);
    setNotice("");
  }

  

async function saveTask(event) {
  event.preventDefault();

  if (!form.title.trim()) {
    setNotice("Please enter a task title.");
    return;
  }

  try {
    const token = localStorage.getItem("taskmate-token");
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    if (editingId !== null) {
      const response = await axios.put(
        `${API_URL}/${editingId}`,
        { ...form, title: form.title.trim() },
        config
      );

      setTasks((current) =>
        current.map((task) =>
          task._id === editingId ? response.data : task
        )
      );

      setNotice("Task updated successfully.");
    } else {
      const response = await axios.post(
        API_URL,
        {
          ...form,
          title: form.title.trim(),
          status: "Pending"
        },
        config
      );

      setTasks((current) => [response.data, ...current]);
      setNotice("Task added successfully.");
    }

    setShowForm(false);
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      priority: "Medium",
      dueDate: ""
    });
  } catch (error) {
    setNotice(
      error.response?.data?.message || "Could not save task."
    );
  }
}

  

async function changeStatus(id, status) {
  try {
    const token = localStorage.getItem("taskmate-token");

    const response = await axios.put(
      `${API_URL}/${id}`,
      { status },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    setTasks((current) =>
      current.map((task) =>
        task._id === id ? response.data : task
      )
    );

    setNotice("Task status updated successfully.");
  } catch (error) {
    setNotice(
      error.response?.data?.message || "Could not update task status."
    );
  }
}



  
async function deleteTask(id) {
  if (!window.confirm("Are you sure you want to delete this task?")) {
    return;
  }

  try {
    const token = localStorage.getItem("taskmate-token");

    await axios.delete(`${API_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    setTasks((current) =>
      current.filter((task) => task._id !== id)
    );

    setNotice("Task deleted successfully.");
  } catch (error) {
    setNotice(
      error.response?.data?.message || "Could not delete task."
    );
  }
}


 
function formatDate(date) {
  if (!date) return "No due date";

  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

if (!isLoggedIn) {
  return (
    <div className="login-page">
      <div className="login-decoration">
        <div className="login-brand">
          <span className="brand-icon">✓</span>
          <span>
            Task<span className="brand-accent">Mate</span>
          </span>
        </div>

        <div className="login-message">
          <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
          <h1>Make room for what matters.</h1>
          <p>
            Organize your tasks, set priorities, and make
            progress one step at a time.
          </p>

          <div className="login-feature">
            <span>✓</span> Organize your daily tasks
          </div>
          <div className="login-feature">
            <span>✓</span> Track your progress
          </div>
          <div className="login-feature">
            <span>✓</span> Achieve your goals
          </div>
        </div>

        <p className="login-footer">
          TaskMate · Plan better. Do better.
        </p>
      </div>

      <div className="login-form-area">
        <form className="login-card" onSubmit={handleLogin}>
          <div className="login-mobile-brand">
            <span className="brand-icon">✓</span>
            Task<span className="brand-accent">Mate</span>
          </div>

          <p className="eyebrow">
            {authMode === "login" ? "WELCOME BACK" : "GET STARTED"}
          </p>

          <h2>
            {authMode === "login"
              ? "Sign in to TaskMate"
              : "Create your TaskMate account"}
          </h2>

          <p className="login-subtitle">
            {authMode === "login"
              ? "Enter your details to access your workspace."
              : "Create an account to start managing your tasks."}
          </p>

          {authMode === "register" && (
            <>
              <label htmlFor="register-name">Full Name</label>
              <input
                id="register-name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </>
          )}

          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="login-password">Password</label>
          <div className="password-wrapper">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {loginError && (
            <p className="login-error">{loginError}</p>
          )}

          <button className="login-submit" type="submit">
            {authMode === "login" ? "Sign In →" : "Create Account →"}
          </button>

          <p className="login-note">
            {authMode === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setAuthMode(
                  authMode === "login" ? "register" : "login"
                );
                setLoginError("");
                setPassword("");
              }}
            >
              {authMode === "login" ? "Create account" : "Sign in"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}


  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard">
          <span className="brand-icon">✓</span>
          <span>Task<span className="brand-accent">Mate</span></span>
        </a>

        <p className="nav-label">WORKSPACE</p>
        <a className="nav-item active" href="#dashboard">
          <span>▦</span> Dashboard
        </a>
        <button
          className="nav-item"
          onClick={() => {
            setFilter("All");
            document.getElementById("task-list")?.scrollIntoView({
              behavior: "smooth",
            });
          }}
        >
          <span>☷</span> All tasks
          <span className="nav-count">{tasks.length}</span>
        </button>
        <button
          className="nav-item"
          onClick={() => setFilter("Pending")}
        >
          <span>◷</span> Pending
        </button>
        <button
          className="nav-item"
          onClick={() => setFilter("Completed")}
        >
          <span>✓</span> Completed
        </button>

        <div className="sidebar-bottom">
          <div className="tip-card">
            <span className="tip-icon">✦</span>
            <h3>Small steps, big results.</h3>
            <p>Stay organized and make progress every day.</p>
          </div>
          <div className="user-profile">
            <div className="avatar">TM</div>
            <div>
              <strong>TaskMate User</strong>
              <small>Personal workspace</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR WORKSPACE</p>
            <h1>Dashboard</h1>
          </div>
         <div className="topbar-actions">
  <button className="logout-button" onClick={handleLogout}>
    Log out
  </button>

  <button className="primary-button" onClick={openNewTask}>
    <span>＋</span> Add new task
  </button>
</div>
        </header>

        <section className="welcome-banner">
          <div className="welcome-copy">
            <span className="welcome-tag">YOUR DAY, ORGANIZED</span>
            <h2>Make today count.</h2>
            <p>
              Every completed task is a step towards your goals.
              Let's get things done!
            </p>
            <button className="banner-button" onClick={openNewTask}>
              + Create a task
            </button>
          </div>
          <div className="banner-art" aria-hidden="true">
            <div className="art-circle">
              <span className="art-check">✓</span>
              <span className="art-star star-one">✦</span>
              <span className="art-star star-two">✧</span>
              <span className="art-dot">•</span>
            </div>
          </div>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-top">
              <span className="stat-icon purple">▦</span>
              <span className="stat-label">All tasks</span>
            </div>
            <strong className="stat-number">{tasks.length}</strong>
            <p>Total tasks in your workspace</p>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span className="stat-icon orange">◷</span>
              <span className="stat-label">Pending</span>
            </div>
            <strong className="stat-number">{pending}</strong>
            <p>Tasks waiting to be started</p>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span className="stat-icon blue">↗</span>
              <span className="stat-label">In progress</span>
            </div>
            <strong className="stat-number">{inProgress}</strong>
            <p>Tasks you are working on</p>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span className="stat-icon green">✓</span>
              <span className="stat-label">Completed</span>
            </div>
            <strong className="stat-number">{completed}</strong>
            <p>Tasks successfully completed</p>
          </article>
        </section>

        <section className="tasks-section" id="task-list">
          <div className="section-heading">
            <div>
              <h2>Your tasks</h2>
              <p>Keep track of what matters.</p>
            </div>
            <button className="text-button" onClick={openNewTask}>
              + Add task
            </button>
          </div>

          {notice && <div className="notice">{notice}</div>}

          <div className="toolbar">
            <div className="search-box">
              <span>⌕</span>
              <input
                type="search"
                placeholder="Search your tasks..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search tasks"
              />
            </div>
            <select
              className="filter-select"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter tasks by status"
            >
              <option value="All">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="task-list">
            {loadingTasks ? (
  <div className="empty-state">
    <h3>Loading tasks...</h3>
  </div>
) : filteredTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">☷</div>
                <h3>No tasks found</h3>
                <p>Try another search or create a new task.</p>
                <button className="primary-button" onClick={openNewTask}>
                  + Create task
                </button>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <article className="task-card" key={task._id}>
                  <div className="task-check-wrap">
                    <button
                      className={`task-check ${
                        task.status === "Completed" ? "checked" : ""
                      }`}
                      onClick={() =>
                        changeStatus(
                          task._id,
                          task.status === "Completed"
                            ? "Pending"
                            : "Completed"
                        )
                      }
                      aria-label={
                        task.status === "Completed"
                          ? "Mark as pending"
                          : "Mark as completed"
                      }
                    >
                      {task.status === "Completed" ? "✓" : ""}
                    </button>
                  </div>

                  <div className="task-info">
                    <h3
                      className={
                        task.status === "Completed" ? "task-done" : ""
                      }
                    >
                      {task.title}
                    </h3>
                    <p>{task.description || "No description provided."}</p>
                    <div className="task-meta">
                      <span className={`priority ${task.priority.toLowerCase()}`}>
                        <span>●</span> {task.priority}
                      </span>
                      <span className="due-date">
                        <span>▦</span> {formatDate(task.dueDate)}
                      </span>
                    </div>
                  </div>

                  <div className="task-actions">
                    <select
                      className={`status-select ${task.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                      value={task.status}
                      onChange={(event) =>
                        changeStatus(task._id, event.target.value)
                      }
                      aria-label={`Status for ${task.title}`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <button
                      className="icon-button"
                      onClick={() => editTask(task)}
                      aria-label={`Edit ${task.title}`}
                      title="Edit task"
                    >
                      ✎
                    </button>
                    <button
                      className="icon-button delete-button"
                      onClick={() => deleteTask(task._id)}
                      aria-label={`Delete ${task.title}`}
                      title="Delete task"
                    >
                      ×
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          <p className="list-footer">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </p>
        </section>

        <footer className="footer">
          <span>TaskMate © 2026</span>
          <span>Plan better. Do better.</span>
        </footer>
      </main>

      {showForm && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowForm(false);
          }}
        >
          <section
            className="task-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">TASK MANAGEMENT</p>
                <h2 id="modal-title">
                  {editingId !== null ? "Edit task" : "Create a new task"}
                </h2>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <form onSubmit={saveTask}>
              <label htmlFor="title">Task title *</label>
              <input
                id="title"
                name="title"
                value={form.title}
                onChange={updateField}
                placeholder="e.g. Finish project report"
                required
                maxLength={100}
                autoFocus
              />

              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={updateField}
                placeholder="Add some details about your task..."
                rows={3}
                maxLength={500}
              />

              <div className="form-row">
                <div>
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    name="priority"
                    value={form.priority}
                    onChange={updateField}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="dueDate">Due date</label>
                  <input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    value={form.dueDate}
                    onChange={updateField}
                  />
                </div>
              </div>

              {notice && <p className="form-notice">{notice}</p>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  {editingId !== null ? "Save changes" : "Create task"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
