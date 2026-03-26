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
    dayOfWeek: "Monday",
    category: "Health",
    period: "Day",
    timeBlock: "Evening",
    priority: "High",
    note: "Log a proper session in the Gym section.",
    history: {},
    createdAt: new Date().toISOString()
  },
  {
    id: "task-study",
    name: "Study",
    dayOfWeek: "Tuesday",
    category: "Study",
    period: "Day",
    timeBlock: "Morning",
    priority: "High",
    note: "Do focused study work.",
    history: {},
    createdAt: new Date().toISOString()
  }
];

const els = {
  todayDate: document.getElementById("todayDate"),
  pageTitle: document.getElementById("pageTitle"),
  statusText: document.getElementById("statusText"),
  dashboardMonthTitle: document.getElementById("dashboardMonthTitle"),
  streakCount: document.getElementById("streakCount"),
  tasksCompletedCount: document.getElementById("tasksCompletedCount"),
  workoutCount: document.getElementById("workoutCount"),
  roundupTotal: document.getElementById("roundupTotal"),
  progressBar: document.getElementById("progressBar"),
  progressText: document.getElementById("progressText"),
  recentActivity: document.getElementById("recentActivity"),
  recentActivityEmpty: document.getElementById("recentActivityEmpty"),
  trackerHead: document.getElementById("trackerHead"),
  trackerBody: document.getElementById("trackerBody"),
  trackerEmptyMessage: document.getElementById("trackerEmptyMessage"),

  totalTasks: document.getElementById("totalTasks"),
  completedTasks: document.getElementById("completedTasks"),
  remainingTasks: document.getElementById("remainingTasks"),
  taskList: document.getElementById("taskList"),
  emptyTasksMessage: document.getElementById("emptyTasksMessage"),

  workoutGroups: document.getElementById("workoutGroups"),
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
  taskDay: document.getElementById("taskDay"),
  taskCategory: document.getElementById("taskCategory"),
  taskPeriod: document.getElementById("taskPeriod"),
  taskTimeBlock: document.getElementById("taskTimeBlock"),
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
const filterButtons = document.querySelectorAll(".filter-btn");

const tabPanels = {
  dashboard: document.getElementById("dashboardTab"),
  tasks: document.getElementById("tasksTab"),
  workouts: document.getElementById("workoutsTab"),
  budget: document.getElementById("budgetTab")
};

let currentUser = null;
let liveTasks = [];
let liveWorkouts = [];
let liveTransactions = [];
let unsubscribers = [];

function todayISODate() {
  return new Date().toISOString().split("T")[0];
}

function getTodayKey() {
  return todayISODate();
}

function prettyDate(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function currentDayName() {
  return new Date().toLocaleDateString(undefined, { weekday: "long" });
}

function currentMonthName() {
  return new Date().toLocaleDateString(undefined, { month: "long" }).toUpperCase();
}

function daysInCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

function todayDayNumber() {
  return new Date().getDate();
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

function normalizeTask(task) {
  return {
    history: {},
    ...task,
    history: task.history || {}
  };
}

function isTaskDoneOnDate(task, dateKey) {
  return Boolean(task.history && task.history[dateKey]);
}

function isTaskDoneToday(task) {
  return isTaskDoneOnDate(task, getTodayKey());
}

function getFilteredTasks(tasks, filter) {
  if (filter === "active") return tasks.filter((task) => !isTaskDoneToday(task));
  if (filter === "completed") return tasks.filter((task) => isTaskDoneToday(task));
  return tasks;
}

function roundUpValue(amount) {
  return Math.ceil(amount) - amount;
}

function normalizeDateString(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split("T")[0];
}

function uniqueSortedDates() {
  const activeDates = new Set();

  liveTasks.forEach((task) => {
    Object.entries(task.history || {}).forEach(([dateKey, done]) => {
      if (done) activeDates.add(dateKey);
    });
  });

  liveWorkouts.forEach((entry) => {
    if (entry.date) activeDates.add(entry.date);
  });

  liveTransactions.forEach((entry) => {
    if (entry.date) activeDates.add(entry.date);
  });

  return [...activeDates]
    .filter((dateKey) => normalizeDateString(dateKey))
    .sort((a, b) => new Date(b) - new Date(a));
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
  const taskActivity = [];

  liveTasks.forEach((task) => {
    Object.entries(task.history || {}).forEach(([dateKey, done]) => {
      if (done) {
        taskActivity.push({
          type: "task",
          text: `Completed task: ${task.name}`,
          date: `${dateKey}T12:00:00`
        });
      }
    });
  });

  const items = [
    ...taskActivity,
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

async function seedDefaultTasks(uid) {
  const snapshot = await getDocs(collection(db, "users", uid, "tasks"));
  if (!snapshot.empty) return;

  for (const task of defaultTasks) {
    await setDoc(doc(db, "users", uid, "tasks", task.id), task);
  }
}

async function addTask(data) {
  const id = crypto.randomUUID();
  await setDoc(doc(db, "users", currentUser.uid, "tasks", id), {
    id,
    ...data,
    history: {},
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

async function toggleTaskDay(task, dateKey) {
  const updatedHistory = { ...(task.history || {}) };
  updatedHistory[dateKey] = !updatedHistory[dateKey];

  await setDoc(
    doc(db, "users", currentUser.uid, "tasks", task.id),
    { history: updatedHistory },
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

function renderDashboardTracker() {
  const totalDays = daysInCurrentMonth();
  const today = todayDayNumber();

  els.trackerHead.innerHTML = "";
  els.trackerBody.innerHTML = "";

  if (liveTasks.length === 0) {
    els.trackerEmptyMessage.style.display = "block";
    return;
  }

  els.trackerEmptyMessage.style.display = "none";

  const headRow = document.createElement("tr");
  headRow.innerHTML = `<th class="habit-name">Tasks</th>`;

  for (let day = 1; day <= totalDays; day += 1) {
    const th = document.createElement("th");
    th.textContent = day;
    if (day === today) th.classList.add("today-col");
    headRow.appendChild(th);
  }

  els.trackerHead.appendChild(headRow);

  liveTasks
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .forEach((task) => {
      const row = document.createElement("tr");

      const labelCell = document.createElement("td");
      labelCell.className = "habit-name";
      labelCell.innerHTML = `
        <div class="tracker-row-label">
          <span>${escapeHtml(task.name)}</span>
          <small>${escapeHtml(task.dayOfWeek || "Any day")} • ${escapeHtml(task.timeBlock || "Any time")}</small>
        </div>
      `;
      row.appendChild(labelCell);

      for (let day = 1; day <= totalDays; day += 1) {
        const cell = document.createElement("td");

        if (day === today) {
          cell.classList.add("today-col");
        }

        const dateKey = new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          day
        )
          .toISOString()
          .split("T")[0];

        const isDone = isTaskDoneOnDate(task, dateKey);

        const check = document.createElement("div");
        check.className = `tracker-check${isDone ? " done" : ""}`;

        check.addEventListener("click", async () => {
          await toggleTaskDay(task, dateKey);
        });

        cell.appendChild(check);
        row.appendChild(cell);
      }

      els.trackerBody.appendChild(row);
    });
}

function renderDashboard() {
  const completedToday = liveTasks.filter((task) => isTaskDoneToday(task)).length;
  const totalTasks = liveTasks.length;
  const percent = totalTasks === 0 ? 0 : Math.round((completedToday / totalTasks) * 100);
  const roundUpTotal = liveTransactions.reduce((sum, item) => sum + Number(item.roundUp || 0), 0);
  const streak = calculateStreak();

  els.dashboardMonthTitle.textContent = currentMonthName();
  els.streakCount.textContent = `${streak} day${streak === 1 ? "" : "s"}`;
  els.tasksCompletedCount.textContent = completedToday;
  els.workoutCount.textContent = liveWorkouts.length;
  els.roundupTotal.textContent = formatMoney(roundUpTotal);

  els.progressBar.style.width = `${percent}%`;
  els.progressText.textContent = `${completedToday}/${totalTasks} complete (${percent}%)`;

  renderDashboardTracker();

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

  const completedToday = liveTasks.filter((task) => isTaskDoneToday(task)).length;
  const total = liveTasks.length;
  const remaining = total - completedToday;

  els.totalTasks.textContent = total;
  els.completedTasks.textContent = completedToday;
  els.remainingTasks.textContent = remaining;
  els.taskList.innerHTML = "";

  if (visibleTasks.length === 0) {
    els.emptyTasksMessage.style.display = "block";
  } else {
    els.emptyTasksMessage.style.display = "none";
  }

  visibleTasks
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .forEach((task) => {
      const li = document.createElement("li");
      li.className = "task-item";

      const priorityClass = `priority-${(task.priority || "Medium").toLowerCase()}`;
      const doneToday = isTaskDoneToday(task);

      li.innerHTML = `
        <div class="task-top">
          <div class="task-main">
            <input type="checkbox" ${doneToday ? "checked" : ""} />
            <div>
              <h4 class="task-title ${doneToday ? "completed" : ""}">
                ${escapeHtml(task.name)}
              </h4>
              <div class="task-meta">
                <span class="badge category">${escapeHtml(task.category || "Other")}</span>
                <span class="badge">${escapeHtml(task.dayOfWeek || "Any day")}</span>
                <span class="badge">${escapeHtml(task.timeBlock || "Morning")}</span>
                <span class="badge">${escapeHtml(task.period || "Day")}</span>
                <span class="badge ${priorityClass}">${escapeHtml(task.priority || "Medium")} Priority</span>
              </div>
              ${task.note ? `<p class="task-note">${escapeHtml(task.note)}</p>` : ""}
              <div class="subtext">Today: ${doneToday ? "Completed" : "Not completed"}</div>
            </div>
          </div>
          <button class="delete-btn" type="button">Delete</button>
        </div>
      `;

      const checkbox = li.querySelector('input[type="checkbox"]');
      const deleteBtn = li.querySelector(".delete-btn");

      checkbox.addEventListener("change", async () => {
        await toggleTaskDay(task, getTodayKey());
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
  els.workoutGroups.innerHTML = "";

  if (liveWorkouts.length === 0) {
    els.emptyWorkoutMessage.style.display = "block";
    return;
  }

  els.emptyWorkoutMessage.style.display = "none";

  const routineOrder = ["Push", "Pull", "Legs"];
  const groupedWorkouts = {
    Push: [],
    Pull: [],
    Legs: []
  };

  liveWorkouts.forEach((entry) => {
    const key = routineOrder.includes(entry.day) ? entry.day : "Push";
    groupedWorkouts[key].push(entry);
  });

  routineOrder.forEach((groupName) => {
    const entries = groupedWorkouts[groupName];

    if (!entries.length) return;

    const section = document.createElement("section");
    section.className = "workout-group";

    const heading = document.createElement("h4");
    heading.className = "workout-group-title";
    heading.textContent = `${groupName} Day`;
    section.appendChild(heading);

    const list = document.createElement("ul");
    list.className = "task-list";

    entries
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach((entry) => {
        const prev = previousExerciseEntry(entry.exercise, entry.id);
        const previousWeight = prev ? Number(prev.weight) : null;
        const change = previousWeight === null ? null : Number(entry.weight) - previousWeight;

        const sameExerciseEntries = liveWorkouts.filter(
          (item) => item.exercise.toLowerCase() === entry.exercise.toLowerCase()
        );

        const maxWeight = Math.max(...sameExerciseEntries.map((item) => Number(item.weight)));

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
                <p class="task-note">${escapeHtml(entry.sets)} sets × ${escapeHtml(entry.reps)} reps</p>
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
                  <div><strong>Best weight:</strong> ${maxWeight.toFixed(1)} kg</div>
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

        list.appendChild(li);
      });

    section.appendChild(list);
    els.workoutGroups.appendChild(section);
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
    .slice()
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
    els.statusText.textContent = "You are synced. Click any task box to start your streak.";
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
      liveTasks = snapshot.docs.map((docItem) => normalizeTask(docItem.data()));
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
    dayOfWeek: els.taskDay.value,
    category: els.taskCategory.value,
    period: els.taskPeriod.value,
    timeBlock: els.taskTimeBlock.value,
    priority: els.taskPriority.value,
    note: els.taskNote.value.trim()
  });

  els.taskForm.reset();
  els.taskDay.value = currentDayName();
  els.taskPeriod.value = "Day";
  els.taskTimeBlock.value = "Morning";
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
  els.workoutDay.value = "Push";
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
els.taskDay.value = currentDayName();
els.exerciseDate.value = todayISODate();
els.transactionDate.value = todayISODate();
renderAll();
