import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCzdRSUly0I_toLWBz5eaJWk-m8s9o0A2U",
  authDomain: "daily-tracker-9bdfc.firebaseapp.com",
  projectId: "daily-tracker-9bdfc",
  storageBucket: "daily-tracker-9bdfc.firebasestorage.app",
  messagingSenderId: "397947500484",
  appId: "1:397947500484:web:47c4c99a105683f23a5691",
  measurementId: "G-LB29CGY85M"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const FILTER_KEY = "lifeTrackerFilter_v1";
const TAB_KEY = "lifeTrackerTab_v1";
const THEME_KEY = "lifeTrackerTheme_v1";

const defaultTasks = [
  {
    id: "task-gym",
    name: "Gym",
    category: "Health",
    priority: "High",
    note: "Log a proper session in the Gym section.",
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "task-study",
    name: "Study",
    category: "Study",
    priority: "High",
    note: "Do focused study work.",
    completed: false,
    createdAt: new Date().toISOString()
  }
];

const els = {
  todayDate: document.getElementById("todayDate"),
  pageTitle: document.getElementById("pageTitle"),
  statusText: document.getElementById("statusText"),
  streakCount: document.getElementById("streakCount"),
  tasksCompletedCount: document.getElementById("tasksCompletedCount"),
  workoutCount: document.getElementById("workoutCount"),
  roundupTotal: document.getElementById("roundupTotal"),
  progressBar: document.getElementById("progressBar"),
  progressText: document.getElementById("progressText"),
  recentActivity: document.getElementById("recentActivity"),
  recentActivityEmpty: document.getElementById("recentActivityEmpty"),

  totalTasks: document.getElementById("totalTasks"),
  completedTasks: document.getElementById("completedTasks"),
  remainingTasks: document.getElementById("remainingTasks"),
  taskList: document.getElementById("taskList"),
  emptyTasksMessage: document.getElementById("emptyTasksMessage"),

  workoutList: document.getElementById("workoutList"),
  emptyWorkoutMessage: document.getElementById("emptyWorkoutMessage"),

  transactionList: document.getElementById("transactionList"),
  emptyTransactionMessage: document.getElementById("emptyTransactionMessage"),
  spentTotal: document.getElementById("spentTotal"),
  savedTotal: document.getElementById("savedTotal"),

  loginBtn: document.getElementById("loginBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  userInfo: document.getElementById("userInfo"),
  themeToggle: document.getElementById("themeToggle"),

  taskForm: document.getElementById("taskForm"),
  taskName: document.getElementById("taskName"),
  taskCategory: document.getElementById("taskCategory"),
  taskPriority: document.getElementById("taskPriority"),
  taskNote: document.getElementById("taskNote"),

  workoutForm: document.getElementById("workoutForm"),
  workoutDay: document.getElementById("workoutDay"),
  exerciseName: document.getElementById("exerciseName"),
  exerciseWeight: document.getElementById("exerciseWeight"),
  exerciseSets: document.getElementById("exerciseSets"),
  exerciseReps: document.getElementById("exerciseReps"),
  exerciseDate: document.getElementById("exerciseDate"),
  exerciseNote: document.getElementById("exerciseNote"),

  budgetForm: document.getElementById("budgetForm"),
  transactionTitle: document.getElementById("transactionTitle"),
  transactionAmount: document.getElementById("transactionAmount"),
  transactionCategory: document.getElementById("transactionCategory"),
  transactionDate: document.getElementById("transactionDate"),
  transactionNote: document.getElementById("transactionNote")
};

const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = {
  dashboard: document.getElementById("dashboardTab"),
  tasks: document.getElementById("tasksTab"),
  workouts: document.getElementById("workoutsTab"),
  budget: document.getElementById("budgetTab")
};
const filterButtons = document.querySelectorAll(".filter-btn");

let currentUser = null;
let liveTasks = [];
let liveWorkouts = [];
let liveTransactions = [];
let unsubscribers = [];

function todayISODate() {
  return new Date().toISOString().split("T")[0];
}

function prettyDate(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function formatMoney(value) {
  return `£${Number(value).toFixed(2)}`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (char) => {
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

function loadFilter() {
  return localStorage.getItem(FILTER_KEY) || "all";
}

function saveFilter(filter) {
  localStorage.setItem(FILTER_KEY, filter);
}

function getFilteredTasks(tasks, filter) {
  if (filter === "active") return tasks.filter((task) => !task.completed);
  if (filter === "completed") return tasks.filter((task) => task.completed);
  return tasks;
}

function loadTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  applyTheme(document.body.classList.contains("dark") ? "light" : "dark");
}

function loadTab() {
  return localStorage.getItem(TAB_KEY) || "dashboard";
}

function setActiveTab(tabName) {
  Object.entries(tabPanels).forEach(([name, panel]) => {
    panel.classList.toggle("active", name === tabName);
  });

  tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  els.pageTitle.textContent =
    tabName === "dashboard"
      ? "Dashboard"
      : tabName === "tasks"
      ? "Tasks"
      : tabName === "workouts"
      ? "Gym"
      : "Budget";

  localStorage.setItem(TAB_KEY, tabName);
}

function collectionRef(name) {
  return collection(db, "users", currentUser.uid, name);
}

async function seedDefaultTasks(uid) {
  const snapshot = await getDocs(collection(db, "users", uid, "tasks"));
  if (!snapshot.empty) return;

  for (const task of defaultTasks) {
    await setDoc(doc(db, "users", uid, "tasks", task.id), task);
  }
}

function roundUpValue(amount) {
  return Math.ceil(amount) - amount;
}

function normalizeDateString(value) {
  return new Date(value).toISOString().split("T")[0];
}

function uniqueSortedDates() {
  const activeDates = new Set();

  liveTasks.forEach((task) => {
    if (task.completed && task.completedAt) {
      activeDates.add(normalizeDateString(task.completedAt));
    }
  });

  liveWorkouts.forEach((entry) => {
    if (entry.date) activeDates.add(entry.date);
  });

  liveTransactions.forEach((entry) => {
    if (entry.date) activeDates.add(entry.date);
  });

  return [...activeDates].sort((a, b) => new Date(b) - new Date(a));
}

function calculateStreak() {
  const dates = new Set(uniqueSortedDates());
  let streak = 0;
  const current = new Date();
  current.setHours(0, 0, 0, 0);

  while (dates.has(current.toISOString().split("T")[0])) {
    streak += 1;
    current.setDate(current.getDate() - 1);
  }

  return streak;
}

function recentActivityItems() {
  const items = [
    ...liveTasks
      .filter((task) => task.completed && task.completedAt)
      .map((task) => ({
        type: "task",
        text: `Completed task: ${task.name}`,
        date: task.completedAt
      })),
    ...liveWorkouts.map((entry) => ({
      type: "workout",
      text: `${entry.exercise} logged for ${entry.day} — ${entry.weight}kg`,
      date: `${entry.date}T12:00:00`
    })),
    ...liveTransactions.map((entry) => ({
      type: "transaction",
      text: `${entry.title} spent ${formatMoney(entry.amount)} — saved ${formatMoney(entry.roundUp)}`,
      date: `${entry.date}T12:00:00`
    }))
  ];

  return items
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);
}

function previousExerciseEntry(exerciseName, currentId) {
  return liveWorkouts
    .filter(
      (entry) =>
        entry.exercise.toLowerCase() === exerciseName.toLowerCase() &&
        entry.id !== currentId
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
}

async function addTask(data) {
  const id = crypto.randomUUID();
  await setDoc(doc(db, "users", currentUser.uid, "tasks", id), {
    id,
    ...data,
    completed: false,
    createdAt: new Date().toISOString()
  });
}

async function updateTask(id, updates) {
  const existing = liveTasks.find((task) => task.id === id);
  if (!existing) return;

  await setDoc(
    doc(db, "users", currentUser.uid, "tasks", id),
    { ...existing, ...updates },
    { merge: true }
  );
}

async function deleteTask(id) {
  await deleteDoc(doc(db, "users", currentUser.uid, "tasks", id));
}

async function addWorkout(data) {
  const id = crypto.randomUUID();
  await setDoc(doc(db, "users", currentUser.uid, "workouts", id), {
    id,
    ...data,
    createdAt: new Date().toISOString()
  });
}

async function deleteWorkout(id) {
  await deleteDoc(doc(db, "users", currentUser.uid, "workouts", id));
}

async function addTransaction(data) {
  const id = crypto.randomUUID();
  await setDoc(doc(db, "users", currentUser.uid, "transactions", id), {
    id,
    ...data,
    createdAt: new Date().toISOString()
  });
}

async function deleteTransaction(id) {
  await deleteDoc(doc(db, "users", currentUser.uid, "transactions", id));
}

function renderDashboard() {
  const completedTasks = liveTasks.filter((task) => task.completed).length;
  const totalTasks = liveTasks.length;
  const percent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const roundUpTotal = liveTransactions.reduce((sum, item) => sum + Number(item.roundUp || 0), 0);

  els.streakCount.textContent = `${calculateStreak()} day${calculateStreak() === 1 ? "" : "s"}`;
  els.tasksCompletedCount.textContent = completedTasks;
  els.workoutCount.textContent = liveWorkouts.length;
  els.roundupTotal.textContent = formatMoney(roundUpTotal);

  els.progressBar.style.width = `${percent}%`;
  els.progressText.textContent = `${completedTasks}/${totalTasks} complete (${percent}%)`;

  const activity = recentActivityItems();
  els.recentActivity.innerHTML = "";

  if (activity.length === 0) {
    els.recentActivityEmpty.style.display = "block";
  } else {
    els.recentActivityEmpty.style.display = "none";
    activity.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${escapeHtml(item.text)}</strong>
        <div class="subtext">${new Date(item.date).toLocaleString()}</div>
      `;
      els.recentActivity.appendChild(li);
    });
  }
}

function renderTasks() {
  const filter = loadFilter();
  const visibleTasks = getFilteredTasks(liveTasks, filter);

  const completed = liveTasks.filter((task) => task.completed).length;
  const total = liveTasks.length;
  const remaining = total - completed;

  els.totalTasks.textContent = total;
  els.completedTasks.textContent = completed;
  els.remainingTasks.textContent = remaining;
  els.taskList.innerHTML = "";

  if (visibleTasks.length === 0) {
    els.emptyTasksMessage.style.display = "block";
  } else {
    els.emptyTasksMessage.style.display = "none";
  }

  visibleTasks
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .forEach((task) => {
      const li = document.createElement("li");
      li.className = "task-item";

      const priorityClass = `priority-${task.priority.toLowerCase()}`;

      li.innerHTML = `
        <div class="task-top">
          <div class="task-main">
            <input type="checkbox" ${task.completed ? "checked" : ""} />
            <div>
              <h4 class="task-title ${task.completed ? "completed" : ""}">
                ${escapeHtml(task.name)}
              </h4>
              <div class="task-meta">
                <span class="badge category">${escapeHtml(task.category)}</span>
                <span class="badge ${priorityClass}">${escapeHtml(task.priority)} Priority</span>
              </div>
              ${task.note ? `<p class="task-note">${escapeHtml(task.note)}</p>` : ""}
              ${
                task.completedAt
                  ? `<div class="subtext">Completed: ${new Date(task.completedAt).toLocaleString()}</div>`
                  : ""
              }
            </div>
          </div>
          <button class="delete-btn" type="button">Delete</button>
        </div>
      `;

      const checkbox = li.querySelector('input[type="checkbox"]');
      const deleteBtn = li.querySelector(".delete-btn");

      checkbox.addEventListener("change", async () => {
        await updateTask(task.id, {
          completed: checkbox.checked,
          completedAt: checkbox.checked ? new Date().toISOString() : null
        });
      });

      deleteBtn.addEventListener("click", async () => {
        await deleteTask(task.id);
      });

      els.taskList.appendChild(li);
    });

  filterButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });
}

function renderWorkouts() {
  els.workoutList.innerHTML = "";

  if (liveWorkouts.length === 0) {
    els.emptyWorkoutMessage.style.display = "block";
    return;
  }

  els.emptyWorkoutMessage.style.display = "none";

  liveWorkouts
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((entry) => {
      const prev = previousExerciseEntry(entry.exercise, entry.id);
      const previousWeight = prev ? Number(prev.weight) : null;
      const change = previousWeight === null ? null : Number(entry.weight) - previousWeight;

      const li = document.createElement("li");
      li.className = "task-item";
      li.innerHTML = `
        <div class="task-top">
          <div class="task-main">
            <div>
              <h4 class="task-title">${escapeHtml(entry.exercise)}</h4>
              <div class="task-meta">
                <span class="badge category">${escapeHtml(entry.day)}</span>
                <span class="badge priority-medium">${escapeHtml(entry.weight)} kg</span>
              </div>
              <p class="task-note">
                ${escapeHtml(entry.sets)} sets × ${escapeHtml(entry.reps)} reps
              </p>
              <div class="sub-card">
                <div><strong>Date:</strong> ${escapeHtml(entry.date)}</div>
                <div><strong>Last logged weight:</strong> ${
                  previousWeight === null ? "No previous record" : `${previousWeight} kg`
                }</div>
                <div><strong>Progress:</strong> ${
                  change === null
                    ? "First tracked entry"
                    : change > 0
                    ? `+${change.toFixed(1)} kg`
                    : change < 0
                    ? `${change.toFixed(1)} kg`
                    : "No change"
                }</div>
                <div><strong>Minimum known weight:</strong> ${Math.min(
                  ...liveWorkouts
                    .filter((item) => item.exercise.toLowerCase() === entry.exercise.toLowerCase())
                    .map((item) => Number(item.weight))
                ).toFixed(1)} kg</div>
              </div>
              ${entry.note ? `<p class="task-note">${escapeHtml(entry.note)}</p>` : ""}
            </div>
          </div>
          <button class="delete-btn" type="button">Delete</button>
        </div>
      `;

      li.querySelector(".delete-btn").addEventListener("click", async () => {
        await deleteWorkout(entry.id);
      });

      els.workoutList.appendChild(li);
    });
}

function renderBudget() {
  els.transactionList.innerHTML = "";

  const totalSpent = liveTransactions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalSaved = liveTransactions.reduce((sum, item) => sum + Number(item.roundUp || 0), 0);

  els.spentTotal.textContent = formatMoney(totalSpent);
  els.savedTotal.textContent = formatMoney(totalSaved);

  if (liveTransactions.length === 0) {
    els.emptyTransactionMessage.style.display = "block";
    return;
  }

  els.emptyTransactionMessage.style.display = "none";

  liveTransactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((entry) => {
      const li = document.createElement("li");
      li.className = "task-item";
      li.innerHTML = `
        <div class="task-top">
          <div class="task-main">
            <div>
              <h4 class="task-title">${escapeHtml(entry.title)}</h4>
              <div class="task-meta">
                <span class="badge category">${escapeHtml(entry.category)}</span>
                <span class="badge priority-low">Spent ${formatMoney(entry.amount)}</span>
                <span class="badge priority-medium">Saved ${formatMoney(entry.roundUp)}</span>
              </div>
              <p class="task-note">Rounded up to ${formatMoney(entry.roundedTo)}</p>
              <div class="subtext">${escapeHtml(entry.date)}</div>
              ${entry.note ? `<p class="task-note">${escapeHtml(entry.note)}</p>` : ""}
            </div>
          </div>
          <button class="delete-btn" type="button">Delete</button>
        </div>
      `;

      li.querySelector(".delete-btn").addEventListener("click", async () => {
        await deleteTransaction(entry.id);
      });

      els.transactionList.appendChild(li);
    });
}

function renderStatus() {
  if (!currentUser) {
    els.statusText.textContent = "Sign in to sync your life data across devices.";
    return;
  }

  const streak = calculateStreak();

  if (streak >= 7) {
    els.statusText.textContent = `You are on a ${streak}-day streak — excellent consistency.`;
  } else if (streak >= 1) {
    els.statusText.textContent = `You are on a ${streak}-day streak — keep it going.`;
  } else {
    els.statusText.textContent = "You are synced. Add a task, workout, or transaction to start your streak.";
  }
}

function renderAuth() {
  els.loginBtn.hidden = !!currentUser;
  els.logoutBtn.hidden = !currentUser;
  els.userInfo.textContent = currentUser
    ? `Signed in as ${currentUser.displayName || currentUser.email || "user"}`
    : "Not signed in";
}

function renderAll() {
  els.todayDate.textContent = prettyDate();
  renderAuth();
  renderStatus();
  renderDashboard();
  renderTasks();
  renderWorkouts();
  renderBudget();
}

function clearSubscriptions() {
  unsubscribers.forEach((unsub) => unsub());
  unsubscribers = [];
}

function subscribeToUserData() {
  clearSubscriptions();

  unsubscribers.push(
    onSnapshot(collectionRef("tasks"), (snapshot) => {
      liveTasks = snapshot.docs.map((docItem) => docItem.data());
      renderAll();
    })
  );

  unsubscribers.push(
    onSnapshot(collectionRef("workouts"), (snapshot) => {
      liveWorkouts = snapshot.docs.map((docItem) => docItem.data());
      renderAll();
    })
  );

  unsubscribers.push(
    onSnapshot(collectionRef("transactions"), (snapshot) => {
      liveTransactions = snapshot.docs.map((docItem) => docItem.data());
      renderAll();
    })
  );
}

els.loginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    alert("Sign-in failed: " + error.message);
  }
});

els.logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

els.themeToggle.addEventListener("click", toggleTheme);

els.taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) {
    alert("Please sign in first.");
    return;
  }

  const name = els.taskName.value.trim();
  if (!name) return;

  await addTask({
    name,
    category: els.taskCategory.value,
    priority: els.taskPriority.value,
    note: els.taskNote.value.trim()
  });

  els.taskForm.reset();
  els.taskPriority.value = "Medium";
});

els.workoutForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) {
    alert("Please sign in first.");
    return;
  }

  const exercise = els.exerciseName.value.trim();
  if (!exercise) return;

  await addWorkout({
    day: els.workoutDay.value,
    exercise,
    weight: Number(els.exerciseWeight.value),
    sets: Number(els.exerciseSets.value),
    reps: Number(els.exerciseReps.value),
    date: els.exerciseDate.value,
    note: els.exerciseNote.value.trim()
  });

  els.workoutForm.reset();
  els.exerciseDate.value = todayISODate();
});

els.budgetForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) {
    alert("Please sign in first.");
    return;
  }

  const title = els.transactionTitle.value.trim();
  const amount = Number(els.transactionAmount.value);
  if (!title || !amount) return;

  const roundedTo = Math.ceil(amount);
  const roundUp = roundUpValue(amount);

  await addTransaction({
    title,
    amount,
    category: els.transactionCategory.value,
    date: els.transactionDate.value,
    note: els.transactionNote.value.trim(),
    roundedTo,
    roundUp: Number(roundUp.toFixed(2))
  });

  els.budgetForm.reset();
  els.transactionDate.value = todayISODate();
});

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    saveFilter(btn.dataset.filter);
    renderTasks();
  });
});

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setActiveTab(btn.dataset.tab);
  });
});

onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  if (!user) {
    clearSubscriptions();
    liveTasks = [];
    liveWorkouts = [];
    liveTransactions = [];
    renderAll();
    return;
  }

  await seedDefaultTasks(user.uid);
  subscribeToUserData();
  renderAll();
});

applyTheme(loadTheme());
setActiveTab(loadTab());
els.exerciseDate.value = todayISODate();
els.transactionDate.value = todayISODate();
renderAll();
