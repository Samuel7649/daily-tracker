// ---- Advanced Daily Tracker ----

// Default starter tasks
const defaultTasks = [
  {
    id: crypto.randomUUID(),
    name: "Gym",
    category: "Health",
    priority: "High",
    note: "Workout for at least 45 minutes",
    completed: false
  },
  {
    id: crypto.randomUUID(),
    name: "Study",
    category: "Study",
    priority: "High",
    note: "Revise notes or complete homework",
    completed: false
  },
  {
    id: crypto.randomUUID(),
    name: "Read",
    category: "Personal",
    priority: "Medium",
    note: "Read 10 pages minimum",
    completed: false
  }
];

// Elements
const taskList = document.getElementById("taskList");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const status = document.getElementById("status");
const todayDate = document.getElementById("todayDate");
const totalTasks = document.getElementById("totalTasks");
const completedTasks = document.getElementById("completedTasks");
const remainingTasks = document.getElementById("remainingTasks");
const emptyMessage = document.getElementById("emptyMessage");

const taskForm = document.getElementById("taskForm");
const taskNameInput = document.getElementById("taskName");
const taskCategoryInput = document.getElementById("taskCategory");
const taskPriorityInput = document.getElementById("taskPriority");
const taskNoteInput = document.getElementById("taskNote");

const filterButtons = document.querySelectorAll(".filter-btn");

// Storage keys
const TASKS_KEY = "dailyTrackerTasks_v2";
const DAY_KEY = "dailyTrackerDay_v2";
const FILTER_KEY = "dailyTrackerFilter_v2";

// Helper: get YYYY-MM-DD
function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Display-friendly date
function formatPrettyDate() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveTasks(tasks) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function loadFilter() {
  return localStorage.getItem(FILTER_KEY) || "all";
}

function saveFilter(filter) {
  localStorage.setItem(FILTER_KEY, filter);
}

function ensureFreshDay() {
  const lastDay = localStorage.getItem(DAY_KEY);
  const nowDay = todayKey();

  if (lastDay !== nowDay) {
    localStorage.setItem(DAY_KEY, nowDay);

    let tasks = loadTasks();

    if (!tasks) {
      saveTasks(defaultTasks);
      return;
    }

    // Reset completion for a new day
    tasks = tasks.map(task => ({
      ...task,
      completed: false
    }));

    saveTasks(tasks);
  }
}

function initializeTasks() {
  const existing = loadTasks();
  if (!existing) {
    saveTasks(defaultTasks);
  }
}

function getTasks() {
  return loadTasks() || [];
}

function updateTask(id, updates) {
  const tasks = getTasks().map(task =>
    task.id === id ? { ...task, ...updates } : task
  );
  saveTasks(tasks);
  render();
}

function deleteTask(id) {
  const tasks = getTasks().filter(task => task.id !== id);
  saveTasks(tasks);
  render();
}

function addTask({ name, category, priority, note }) {
  const tasks = getTasks();
  tasks.push({
    id: crypto.randomUUID(),
    name,
    category,
    priority,
    note,
    completed: false
  });
  saveTasks(tasks);
  render();
}

function getFilteredTasks(tasks, filter) {
  if (filter === "active") {
    return tasks.filter(task => !task.completed);
  }
  if (filter === "completed") {
    return tasks.filter(task => task.completed);
  }
  return tasks;
}

function render() {
  ensureFreshDay();
  todayDate.textContent = formatPrettyDate();

  const tasks = getTasks();
  const filter = loadFilter();
  const visibleTasks = getFilteredTasks(tasks, filter);

  taskList.innerHTML = "";

  const completed = tasks.filter(task => task.completed).length;
  const total = tasks.length;
  const remaining = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${completed}/${total} complete (${percent}%)`;

  totalTasks.textContent = total;
  completedTasks.textContent = completed;
  remainingTasks.textContent = remaining;

  if (total === 0) {
    status.textContent = "No tasks yet — start building your day.";
  } else if (percent === 100) {
    status.textContent = "Everything is done for today 🎉 Excellent work.";
  } else if (percent >= 70) {
    status.textContent = "You’re doing really well today — nearly there.";
  } else if (percent >= 40) {
    status.textContent = "Nice progress so far — keep pushing.";
  } else {
    status.textContent = "Let’s get moving — one task at a time.";
  }

  if (visibleTasks.length === 0) {
    emptyMessage.style.display = "block";
    emptyMessage.textContent =
      filter === "completed"
        ? "No completed tasks yet."
        : filter === "active"
        ? "No active tasks left."
        : "No tasks yet. Add one above.";
  } else {
    emptyMessage.style.display = "none";
  }

  visibleTasks.forEach(task => {
    const li = document.createElement("li");
    li.className = "task-item";

    const priorityClass = `priority-${task.priority.toLowerCase()}`;

    li.innerHTML = `
      <div class="task-top">
        <div class="task-main">
          <input type="checkbox" ${task.completed ? "checked" : ""} />
          <div>
            <h3 class="task-title ${task.completed ? "completed" : ""}">
              ${escapeHtml(task.name)}
            </h3>
            <div class="task-meta">
              <span class="badge category">${escapeHtml(task.category)}</span>
              <span class="badge ${priorityClass}">${escapeHtml(task.priority)} Priority</span>
            </div>
            ${task.note ? `<p class="task-note">${escapeHtml(task.note)}</p>` : ""}
          </div>
        </div>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    const checkbox = li.querySelector('input[type="checkbox"]');
    const deleteBtn = li.querySelector(".delete-btn");

    checkbox.addEventListener("change", () => {
      updateTask(task.id, { completed: checkbox.checked });
    });

    deleteBtn.addEventListener("click", () => {
      deleteTask(task.id);
    });

    taskList.appendChild(li);
  });

  filterButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, char => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return map[char];
  });
}

// Add task form
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = taskNameInput.value.trim();
  const category = taskCategoryInput.value;
  const priority = taskPriorityInput.value;
  const note = taskNoteInput.value.trim();

  if (!name) return;

  addTask({ name, category, priority, note });

  taskForm.reset();
  taskPriorityInput.value = "Medium";
});

// Filter buttons
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    saveFilter(btn.dataset.filter);
    render();
  });
});

// Init
initializeTasks();
ensureFreshDay();
render();