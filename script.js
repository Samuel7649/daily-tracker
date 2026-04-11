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
    frequency: "weekly",
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
    frequency: "daily",
    dayOfWeek: "Every day",
    category: "Study",
    period: "Day",
    timeBlock: "Morning",
    priority: "High",
    note: "Do focused study work.",
    history: {},
    createdAt: new Date().toISOString()
  }
];

const PATHS = [
  {
    id: "high-performance-builder",
    name: "High Performance Builder",
    type: "positive",
    description: "You are building a disciplined and high-growth lifestyle.",
    tips: [
      "Keep your workout schedule fixed each week.",
      "Eat enough protein daily.",
      "Protect sleep and recovery.",
      "Stay patient and stack consistent weeks."
    ],
    estimatedWeeks: 12
  },
  {
    id: "balanced-growth-mode",
    name: "Balanced Growth Mode",
    type: "positive",
    description: "You are making steady progress across health, learning, and personal structure.",
    tips: [
      "Keep daily basics non-negotiable.",
      "Avoid overcomplicating your plan.",
      "Focus on repeatable habits, not perfection."
    ],
    estimatedWeeks: 10
  },
  {
    id: "drift-mode",
    name: "Drift Mode",
    type: "negative",
    description: "Your habits are active in patches, but your overall direction lacks enough consistency.",
    tips: [
      "Reduce your goals and pick 2-3 essentials.",
      "Fix your workout days in advance.",
      "Track one key nutrition habit first.",
      "Stop relying on motivation alone."
    ],
    estimatedWeeks: 8
  }
];

const FOOD_DB = [
  {
    keywords: ["chicken", "chicken breast"],
    per100g: { calories: 165, protein: 31, carbs: 0, fats: 4 }
  },
  {
    keywords: ["rice"],
    per100g: { calories: 130, protein: 2.5, carbs: 28, fats: 0.3 }
  },
  {
    keywords: ["egg", "eggs"],
    per100g: { calories: 155, protein: 13, carbs: 1, fats: 11 }
  },
  {
    keywords: ["bread", "toast"],
    per100g: { calories: 265, protein: 9, carbs: 49, fats: 3 }
  },
  {
    keywords: ["pasta"],
    per100g: { calories: 160, protein: 6, carbs: 31, fats: 1 }
  },
  {
    keywords: ["beef"],
    per100g: { calories: 250, protein: 26, carbs: 0, fats: 15 }
  },
  {
    keywords: ["milk"],
    per100g: { calories: 60, protein: 3.4, carbs: 5, fats: 3.3 }
  },
  {
    keywords: ["salmon"],
    per100g: { calories: 208, protein: 20, carbs: 0, fats: 13 }
  },
  {
    keywords: ["oats", "oatmeal"],
    per100g: { calories: 389, protein: 17, carbs: 66, fats: 7 }
  },
  {
    keywords: ["banana"],
    per100g: { calories: 89, protein: 1.1, carbs: 23, fats: 0.3 }
  },
  {
    keywords: ["potato", "potatoes"],
    per100g: { calories: 77, protein: 2, carbs: 17, fats: 0.1 }
  },
  {
    keywords: ["yogurt", "greek yogurt"],
    per100g: { calories: 59, protein: 10, carbs: 3.6, fats: 0.4 }
  },
  {
    keywords: ["protein shake", "whey", "shake"],
    per100g: { calories: 400, protein: 80, carbs: 8, fats: 7 }
  },
  {
    keywords: ["cheese"],
    per100g: { calories: 402, protein: 25, carbs: 1.3, fats: 33 }
  },
  {
    keywords: ["apple"],
    per100g: { calories: 52, protein: 0.3, carbs: 14, fats: 0.2 }
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
  taskFrequency: document.getElementById("taskFrequency"),
  taskDay: document.getElementById("taskDay"),
  taskCategory: document.getElementById("taskCategory"),
  taskPeriod: document.getElementById("taskPeriod"),
  taskTimeBlock: document.getElementById("taskTimeBlock"),
  taskPriority: document.getElementById("taskPriority"),
  taskNote: document.getElementById("taskNote"),

  profileForm: document.getElementById("profileForm"),
  userAge: document.getElementById("userAge"),
  userSex: document.getElementById("userSex"),
  userHeight: document.getElementById("userHeight"),
  userWeight: document.getElementById("userWeight"),
  userGoal: document.getElementById("userGoal"),
  goalWeight: document.getElementById("goalWeight"),
  bodyFat: document.getElementById("bodyFat"),
  dailySteps: document.getElementById("dailySteps"),
  sleepHours: document.getElementById("sleepHours"),

  workoutForm: document.getElementById("workoutForm"),
  workoutDay: document.getElementById("workoutDay"),
  exerciseName: document.getElementById("exerciseName"),
  exerciseWeight: document.getElementById("exerciseWeight"),
  exerciseSets: document.getElementById("exerciseSets"),
  exerciseReps: document.getElementById("exerciseReps"),
  exerciseDate: document.getElementById("exerciseDate"),
  exerciseNote: document.getElementById("exerciseNote"),

  nutritionForm: document.getElementById("nutritionForm"),
  foodName: document.getElementById("foodName"),
  foodGrams: document.getElementById("foodGrams"),
  foodMeal: document.getElementById("foodMeal"),
  foodDate: document.getElementById("foodDate"),
  foodCalories: document.getElementById("foodCalories"),
  foodProtein: document.getElementById("foodProtein"),
  foodCarbs: document.getElementById("foodCarbs"),
  foodFats: document.getElementById("foodFats"),
  foodNote: document.getElementById("foodNote"),
  foodList: document.getElementById("foodList"),
  emptyFoodMessage: document.getElementById("emptyFoodMessage"),
  nutritionTargets: document.getElementById("nutritionTargets"),

  budgetForm: document.getElementById("budgetForm"),
  transactionTitle: document.getElementById("transactionTitle"),
  transactionAmount: document.getElementById("transactionAmount"),
  transactionCategory: document.getElementById("transactionCategory"),
  transactionDate: document.getElementById("transactionDate"),
  transactionNote: document.getElementById("transactionNote")
};

const pathCard = document.getElementById("pathCard");
const fitnessCard = document.getElementById("fitnessCard");

const tabButtons = document.querySelectorAll(".tab-btn");
const filterButtons = document.querySelectorAll(".filter-btn");

const tabPanels = {
  dashboard: document.getElementById("dashboardTab"),
  tasks: document.getElementById("tasksTab"),
  workouts: document.getElementById("workoutsTab"),
  nutrition: document.getElementById("nutritionTab"),
  budget: document.getElementById("budgetTab")
};

let currentUser = null;
let liveTasks = [];
let liveWorkouts = [];
let liveTransactions = [];
let liveNutrition = [];
let liveProfile = null;
let unsubscribers = [];

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayISODate() {
  return localDateKey();
}

function getTodayKey() {
  return localDateKey();
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
      : tabName === "nutrition"
      ? "Nutrition"
      : "Budget";

  localStorage.setItem(TAB_KEY, tabName);
}

function collectionRef(name) {
  return collection(db, "users", currentUser.uid, name);
}

function normalizeTask(task) {
  return {
    history: {},
    frequency: "weekly",
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

function isTaskScheduledForDate(task, dateKey) {
  const date = new Date(`${dateKey}T12:00:00`);
  const weekday = date.toLocaleDateString(undefined, { weekday: "long" });

  if (task.frequency === "daily") return true;
  if (task.frequency === "weekly") return task.dayOfWeek === weekday;

  return true;
}

function isTaskScheduledForToday(task) {
  return isTaskScheduledForDate(task, getTodayKey());
}

function toggleTaskDayField() {
  const isWeekly = els.taskFrequency.value === "weekly";
  els.taskDay.disabled = !isWeekly;
  els.taskDay.style.opacity = isWeekly ? "1" : "0.6";
}

function getFilteredTasks(tasks, filter) {
  if (filter === "active") return tasks.filter((task) => !isTaskDoneToday(task));
  if (filter === "completed") return tasks.filter((task) => isTaskDoneToday(task));
  return tasks;
}

function roundUpValue(amount) {
  return Number((Math.ceil(amount) - amount).toFixed(2));
}

function normalizeDateString(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return localDateKey(parsed);
}

function taskCompletionDates() {
  const dates = new Set();

  liveTasks.forEach((task) => {
    Object.entries(task.history || {}).forEach(([dateKey, done]) => {
      if (done && normalizeDateString(dateKey)) {
        dates.add(dateKey);
      }
    });
  });

  return dates;
}

function calculateStreak() {
  const dates = taskCompletionDates();
  let streak = 0;
  const current = new Date();
  current.setHours(0, 0, 0, 0);

  while (dates.has(localDateKey(current))) {
    streak += 1;
    current.setDate(current.getDate() - 1);
  }

  return streak;
}

function getLast7Days() {
  const days = [];
  const today = new Date();

  for (let i = 0; i < 7; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(localDateKey(d));
  }

  return days;
}

function getWorkoutFrequency() {
  const last7 = getLast7Days();
  return liveWorkouts.filter((w) => last7.includes(w.date)).length;
}

function calculateBMI(heightCm, weightKg) {
  const heightM = heightCm / 100;
  if (!heightM) return 0;
  return weightKg / (heightM * heightM);
}

function estimateCalories(weightKg, heightCm, age, sex, goal, dailySteps = 0, sleepHours = 7) {
  const bmr =
    sex === "female"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
      : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

  const workouts = getWorkoutFrequency();

  let activityMultiplier = 1.35;

  if (workouts >= 5) {
    activityMultiplier = 1.7;
  } else if (workouts >= 3) {
    activityMultiplier = 1.55;
  } else if (workouts >= 1) {
    activityMultiplier = 1.45;
  }

  if (dailySteps >= 12000) {
    activityMultiplier += 0.1;
  } else if (dailySteps >= 8000) {
    activityMultiplier += 0.05;
  }

  if (sleepHours < 6) {
    activityMultiplier -= 0.03;
  }

  let calories = Math.round(bmr * activityMultiplier);

  if (goal === "muscle") calories += 250;
  if (goal === "fat-loss") calories -= 400;

  return calories;
}

function getNutritionPlan(weightKg, calories, goal) {
  const protein = Math.round(weightKg * (goal === "muscle" ? 2.2 : 2.0));
  const fats = Math.round(weightKg * 0.8);
  const carbs = Math.round((calories - protein * 4 - fats * 9) / 4);

  return {
    calories,
    protein,
    fats,
    carbs: Math.max(carbs, 0)
  };
}

function getFoodTips(goal) {
  if (goal === "muscle") {
    return [
      "Eat protein at every meal.",
      "Use rice, oats, potatoes, eggs, chicken, beef, yogurt, milk, nuts, and olive oil.",
      "Aim for a small calorie surplus and steady weekly weight gain.",
      "Creatine daily can support training performance."
    ];
  }

  if (goal === "fat-loss") {
    return [
      "Keep protein high and calories controlled.",
      "Base meals around lean meat, eggs, yogurt, vegetables, fruit, potatoes, rice, and wraps.",
      "Choose filling foods and avoid drinking lots of calories.",
      "Keep steps and training consistent."
    ];
  }

  if (goal === "recomp") {
    return [
      "Keep protein high and train hard.",
      "Eat mostly whole foods and keep calories near maintenance.",
      "Sleep well and stay consistent for longer.",
      "Progress may be slower, but body composition can improve well."
    ];
  }

  return [
    "Maintain a balanced intake of protein, carbs, and fats.",
    "Use mostly whole foods and stay consistent."
  ];
}

function getSleepRating(hours) {
  if (!hours || hours <= 0) {
    return {
      label: "No sleep data",
      score: 0,
      description: "Add your average sleep to improve recovery predictions."
    };
  }

  if (hours < 6) {
    return {
      label: "Poor",
      score: 35,
      description: "Recovery is likely being limited by low sleep."
    };
  }

  if (hours < 7) {
    return {
      label: "Fair",
      score: 60,
      description: "Sleep is okay, but improving it would help recovery and consistency."
    };
  }

  if (hours <= 9) {
    return {
      label: "Good",
      score: 85,
      description: "Sleep is in a strong range for recovery and performance."
    };
  }

  return {
    label: "Excellent",
    score: 95,
    description: "Sleep duration looks very strong for recovery."
  };
}

function getRecoveryScore(profile) {
  if (!profile) return 0;

  const sleep = getSleepRating(Number(profile.sleepHours || 0)).score;
  const workouts = getWorkoutFrequency();
  const steps = Number(profile.dailySteps || 0);

  let score = sleep;

  if (workouts >= 3 && workouts <= 5) score += 8;
  if (workouts > 5) score -= 5;

  if (steps >= 7000 && steps <= 14000) score += 5;
  if (steps > 20000) score -= 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getRecoveryMessage(score) {
  if (score >= 85) return "Recovery looks strong.";
  if (score >= 70) return "Recovery looks solid overall.";
  if (score >= 55) return "Recovery is moderate — a few improvements would help.";
  return "Recovery looks limited right now, especially for hard training.";
}

function estimateGoalWeeks(currentWeight, goalWeight, goal, sleepHours = 7) {
  let weeklyRate =
    goal === "muscle" ? 0.25 :
    goal === "fat-loss" ? 0.5 :
    goal === "recomp" ? 0.2 :
    0.1;

  if (sleepHours < 6) {
    weeklyRate *= 0.75;
  } else if (sleepHours < 7) {
    weeklyRate *= 0.9;
  } else if (sleepHours >= 8) {
    weeklyRate *= 1.05;
  }

  if (!goalWeight || goalWeight <= 0) {
    if (goal === "muscle") return Math.ceil(16 / (weeklyRate / 0.25));
    if (goal === "fat-loss") return Math.ceil(12 / (weeklyRate / 0.5));
    if (goal === "recomp") return Math.ceil(16 / (weeklyRate / 0.2));
    return 0;
  }

  const difference = Math.abs(goalWeight - currentWeight);
  return weeklyRate > 0 ? Math.ceil(difference / weeklyRate) : 0;
}

function getWeeklyPathStats() {
  const last7 = getLast7Days();

  const gym = liveWorkouts.filter((entry) => last7.includes(entry.date)).length;

  const learning = liveTasks.filter((task) =>
    /study|language|learn|reading/i.test(task.name) &&
    last7.some((date) => task.history?.[date])
  ).length;

  const healthyEating = liveTasks.filter((task) =>
    /eat healthy|meal prep|protein|diet|nutrition|healthy/i.test(task.name) &&
    last7.some((date) => task.history?.[date])
  ).length;

  return { gym, learning, healthyEating };
}

function detectPath() {
  const stats = getWeeklyPathStats();
  const sleepHours = Number(liveProfile?.sleepHours || 0);

  if (stats.gym >= 4 && stats.learning >= 3 && stats.healthyEating >= 4 && sleepHours >= 7) {
    return { path: PATHS[0], score: 92 };
  }

  if (stats.gym >= 2 && (stats.learning >= 2 || stats.healthyEating >= 2) && sleepHours >= 6) {
    return { path: PATHS[1], score: 68 };
  }

  return { path: PATHS[2], score: 30 };
}

function estimateMacros(name, grams = 100) {
  const food = String(name || "").toLowerCase();

  let total = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0
  };

  FOOD_DB.forEach((item) => {
    if (item.keywords.some((k) => food.includes(k))) {
      const factor = grams / 100;
      total.calories += item.per100g.calories * factor;
      total.protein += item.per100g.protein * factor;
      total.carbs += item.per100g.carbs * factor;
      total.fats += item.per100g.fats * factor;
    }
  });

  if (total.calories === 0) {
    const factor = grams / 100;
    return {
      calories: Math.round(300 * factor),
      protein: Math.round(10 * factor),
      carbs: Math.round(30 * factor),
      fats: Math.round(10 * factor),
      estimated: true
    };
  }

  return {
    calories: Math.round(total.calories),
    protein: Math.round(total.protein),
    carbs: Math.round(total.carbs),
    fats: Math.round(total.fats),
    estimated: true
  };
}

function todayNutritionEntries() {
  return liveNutrition.filter((item) => item.date === getTodayKey());
}

function getNutritionTotals(entries) {
  return entries.reduce(
    (totals, item) => {
      totals.calories += Number(item.calories || 0);
      totals.protein += Number(item.protein || 0);
      totals.carbs += Number(item.carbs || 0);
      totals.fats += Number(item.fats || 0);
      return totals;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
}

function getMacroProgress(actual, target) {
  if (!target || target <= 0) return 0;
  return Math.min(Math.round((actual / target) * 100), 100);
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
    ...liveNutrition.map((entry) => ({
      type: "nutrition",
      text: `${entry.title} logged — ${Math.round(entry.calories)} kcal`,
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

async function saveProfile(data) {
  await setDoc(doc(db, "users", currentUser.uid, "profile", "bodyProfile"), {
    ...data,
    updatedAt: new Date().toISOString()
  });
}

async function addNutritionEntry(data) {
  const id = crypto.randomUUID();
  await setDoc(doc(db, "users", currentUser.uid, "nutrition", id), {
    id,
    ...data,
    createdAt: new Date().toISOString()
  });
}

async function deleteNutritionEntry(id) {
  await deleteDoc(doc(db, "users", currentUser.uid, "nutrition", id));
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

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  for (let day = 1; day <= totalDays; day += 1) {
    const th = document.createElement("th");
    const date = new Date(year, month, day);
    const weekday = date.toLocaleDateString(undefined, { weekday: "short" });

    th.innerHTML = `
      <div class="tracker-day-head">
        <strong>${day}</strong>
        <small>${weekday}</small>
      </div>
    `;

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
          <small>${task.frequency === "daily" ? "Every day" : escapeHtml(task.dayOfWeek || "Any day")} • ${escapeHtml(task.timeBlock || "Any time")}</small>
        </div>
      `;
      row.appendChild(labelCell);

      for (let day = 1; day <= totalDays; day += 1) {
        const cell = document.createElement("td");

        if (day === today) {
          cell.classList.add("today-col");
        }

        const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const isScheduled = isTaskScheduledForDate(task, dateKey);
        const isDone = isTaskDoneOnDate(task, dateKey);

        const check = document.createElement("div");
        check.className = `tracker-check${isDone ? " done" : ""}${!isScheduled ? " disabled" : ""}`;

        if (isScheduled) {
          check.addEventListener("click", async () => {
            await toggleTaskDay(task, dateKey);
          });
        }

        cell.appendChild(check);
        row.appendChild(cell);
      }

      els.trackerBody.appendChild(row);
    });
}

function renderDashboard() {
  const todaysTasks = liveTasks.filter((task) => isTaskScheduledForToday(task));
  const completedToday = todaysTasks.filter((task) => isTaskDoneToday(task)).length;
  const totalTasks = todaysTasks.length;
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
  const todaysTasks = liveTasks.filter((task) => isTaskScheduledForToday(task));
  const visibleTasks = getFilteredTasks(todaysTasks, filter);

  const completedToday = todaysTasks.filter((task) => isTaskDoneToday(task)).length;
  const total = todaysTasks.length;
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
                <span class="badge">${task.frequency === "daily" ? "Every day" : escapeHtml(task.dayOfWeek || "Weekly")}</span>
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
    if (!routineOrder.includes(entry.day)) return;
    groupedWorkouts[entry.day].push(entry);
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

function renderNutrition() {
  if (!els.foodList || !els.nutritionTargets) return;

  const entries = todayNutritionEntries()
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const totals = getNutritionTotals(entries);

  let targetCalories = 0;
  let targetProtein = 0;
  let targetCarbs = 0;
  let targetFats = 0;

  if (liveProfile && liveProfile.heightCm && liveProfile.weightKg) {
    const age = Number(liveProfile.age || 25);
    const sex = liveProfile.sex || "male";
    const goal = liveProfile.goal || "maintain";
    const steps = Number(liveProfile.dailySteps || 0);
    const sleepHours = Number(liveProfile.sleepHours || 7);
    const calories = estimateCalories(
      Number(liveProfile.weightKg),
      Number(liveProfile.heightCm),
      age,
      sex,
      goal,
      steps,
      sleepHours
    );
    const nutrition = getNutritionPlan(Number(liveProfile.weightKg), calories, goal);

    targetCalories = nutrition.calories;
    targetProtein = nutrition.protein;
    targetCarbs = nutrition.carbs;
    targetFats = nutrition.fats;
  }

  els.nutritionTargets.innerHTML = `
    <div class="macro-grid">
      <div class="macro-card">
        <span>Calories</span>
        <strong>${Math.round(totals.calories)}${targetCalories ? ` / ${targetCalories}` : ""}</strong>
        <div class="progress-wrap">
          <div class="progress-fill" style="width:${getMacroProgress(totals.calories, targetCalories)}%"></div>
        </div>
        <div class="subtext">${targetCalories ? `${getMacroProgress(totals.calories, targetCalories)}% of target` : "Set body profile for a target"}</div>
      </div>

      <div class="macro-card">
        <span>Protein</span>
        <strong>${Math.round(totals.protein)}g${targetProtein ? ` / ${targetProtein}g` : ""}</strong>
        <div class="progress-wrap">
          <div class="progress-fill" style="width:${getMacroProgress(totals.protein, targetProtein)}%"></div>
        </div>
        <div class="subtext">${targetProtein ? `${getMacroProgress(totals.protein, targetProtein)}% of target` : "Set body profile for a target"}</div>
      </div>

      <div class="macro-card">
        <span>Carbs</span>
        <strong>${Math.round(totals.carbs)}g${targetCarbs ? ` / ${targetCarbs}g` : ""}</strong>
        <div class="progress-wrap">
          <div class="progress-fill" style="width:${getMacroProgress(totals.carbs, targetCarbs)}%"></div>
        </div>
        <div class="subtext">${targetCarbs ? `${getMacroProgress(totals.carbs, targetCarbs)}% of target` : "Set body profile for a target"}</div>
      </div>

      <div class="macro-card">
        <span>Fats</span>
        <strong>${Math.round(totals.fats)}g${targetFats ? ` / ${targetFats}g` : ""}</strong>
        <div class="progress-wrap">
          <div class="progress-fill" style="width:${getMacroProgress(totals.fats, targetFats)}%"></div>
        </div>
        <div class="subtext">${targetFats ? `${getMacroProgress(totals.fats, targetFats)}% of target` : "Set body profile for a target"}</div>
      </div>
    </div>
  `;

  els.foodList.innerHTML = "";

  if (entries.length === 0) {
    els.emptyFoodMessage.style.display = "block";
    return;
  }

  els.emptyFoodMessage.style.display = "none";

  entries.forEach((entry) => {
    const li = document.createElement("li");
    li.className = "task-item";
    li.innerHTML = `
      <div class="task-top">
        <div class="task-main">
          <div>
            <h4 class="task-title">${escapeHtml(entry.title)}</h4>
            <div class="task-meta">
              <span class="badge category">${escapeHtml(entry.meal || "Meal")}</span>
              <span class="badge">${escapeHtml(entry.grams)}g</span>
              <span class="badge priority-medium">${Math.round(entry.calories)} kcal</span>
              <span class="badge">P ${Math.round(entry.protein)}g</span>
              <span class="badge">C ${Math.round(entry.carbs)}g</span>
              <span class="badge">F ${Math.round(entry.fats)}g</span>
              <span class="badge ${entry.estimated ? "priority-low" : "priority-high"}">
                ${entry.estimated ? "Estimated" : "Manual"}
              </span>
            </div>
            <div class="subtext">${escapeHtml(entry.date)}</div>
            ${entry.note ? `<p class="task-note">${escapeHtml(entry.note)}</p>` : ""}
          </div>
        </div>
        <button class="delete-btn" type="button">Delete</button>
      </div>
    `;

    li.querySelector(".delete-btn").addEventListener("click", async () => {
      await deleteNutritionEntry(entry.id);
    });

    els.foodList.appendChild(li);
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

function renderPath() {
  if (!pathCard) return;

  const { path, score } = detectPath();
  const estimatedWeeksRemaining = Math.max(1, Math.ceil(((100 - score) / 100) * path.estimatedWeeks));

  pathCard.innerHTML = `
    <div class="path-card ${path.type}">
      <h4>${escapeHtml(path.name)}</h4>
      <p class="muted-text">${escapeHtml(path.description)}</p>

      <div class="progress-wrap">
        <div class="progress-fill" style="width:${score}%"></div>
      </div>

      <p><strong>${score}%</strong> aligned with this path</p>
      <p><strong>Estimated time to fully settle into this path:</strong> ${estimatedWeeksRemaining} week${estimatedWeeksRemaining === 1 ? "" : "s"}</p>

      <h4>Tips</h4>
      <ul class="tips-list">
        ${path.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderFitness() {
  if (!fitnessCard) return;

  if (!liveProfile || !liveProfile.heightCm || !liveProfile.weightKg) {
    fitnessCard.innerHTML = `<p class="muted-text">Add your body profile to unlock gym predictions.</p>`;
    return;
  }

  const age = Number(liveProfile.age || 25);
  const sex = liveProfile.sex || "male";
  const height = Number(liveProfile.heightCm);
  const weight = Number(liveProfile.weightKg);
  const goal = liveProfile.goal || "maintain";
  const goalWeight = Number(liveProfile.goalWeight || 0);
  const bodyFat = Number(liveProfile.bodyFat || 0);
  const dailySteps = Number(liveProfile.dailySteps || 0);
  const sleepHours = Number(liveProfile.sleepHours || 0);

  const bmi = calculateBMI(height, weight);
  const workouts = getWorkoutFrequency();
  const calories = estimateCalories(weight, height, age, sex, goal, dailySteps, sleepHours);
  const nutrition = getNutritionPlan(weight, calories, goal);
  const estimatedWeeks = estimateGoalWeeks(weight, goalWeight, goal, sleepHours);

  const sleepInfo = getSleepRating(sleepHours);
  const recoveryScore = getRecoveryScore(liveProfile);
  const consistencyProgress = Math.min(Math.round((workouts / 5) * 100), 100);

  fitnessCard.innerHTML = `
    <div class="fitness-grid">
      <div class="mini-stat">
        <span>Age</span>
        <strong>${age}</strong>
      </div>
      <div class="mini-stat">
        <span>Sex</span>
        <strong>${escapeHtml(sex)}</strong>
      </div>
      <div class="mini-stat">
        <span>Height</span>
        <strong>${height} cm</strong>
      </div>
      <div class="mini-stat">
        <span>Weight</span>
        <strong>${weight.toFixed(1)} kg</strong>
      </div>
      <div class="mini-stat">
        <span>BMI</span>
        <strong>${bmi.toFixed(1)}</strong>
      </div>
      <div class="mini-stat">
        <span>Goal</span>
        <strong>${escapeHtml(goal)}</strong>
      </div>
      <div class="mini-stat">
        <span>Sleep</span>
        <strong>${sleepHours.toFixed(1)} hrs</strong>
      </div>
      <div class="mini-stat">
        <span>Sleep Quality</span>
        <strong>${escapeHtml(sleepInfo.label)}</strong>
      </div>
      <div class="mini-stat">
        <span>Recovery</span>
        <strong>${recoveryScore}%</strong>
      </div>
      <div class="mini-stat">
        <span>Steps</span>
        <strong>${dailySteps || 0}</strong>
      </div>
      ${
        bodyFat
          ? `
      <div class="mini-stat">
        <span>Body Fat</span>
        <strong>${bodyFat.toFixed(1)}%</strong>
      </div>
      `
          : ""
      }
    </div>

    <div class="chart-card" style="margin-top:16px;">
      <div class="chart-header">
        <h4>Workout Consistency</h4>
        <span>${workouts}/5 sessions this week</span>
      </div>
      <div class="progress-wrap">
        <div class="progress-fill" style="width:${consistencyProgress}%"></div>
      </div>
    </div>

    <div class="chart-card" style="margin-top:16px;">
      <div class="chart-header">
        <h4>Sleep & Recovery</h4>
        <span>${escapeHtml(sleepInfo.label)}</span>
      </div>
      <div class="progress-wrap">
        <div class="progress-fill" style="width:${sleepInfo.score}%"></div>
      </div>
      <p class="muted-text" style="margin-top:10px;">${escapeHtml(sleepInfo.description)} ${escapeHtml(getRecoveryMessage(recoveryScore))}</p>
    </div>

    <p style="margin-top:16px;">
      <strong>Estimated time to goal:</strong>
      ${estimatedWeeks > 0 ? `${estimatedWeeks} week${estimatedWeeks === 1 ? "" : "s"}` : "Ongoing maintenance"}
    </p>

    <h4>Nutrition Target</h4>
    <ul class="tips-list">
      <li><strong>Calories:</strong> ${nutrition.calories} kcal/day</li>
      <li><strong>Protein:</strong> ${nutrition.protein}g/day</li>
      <li><strong>Carbs:</strong> ${nutrition.carbs}g/day</li>
      <li><strong>Fats:</strong> ${nutrition.fats}g/day</li>
    </ul>

    <h4>Food Guidance</h4>
    <ul class="tips-list">
      ${getFoodTips(goal).map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}
    </ul>
  `;
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
  renderNutrition();
  renderBudget();
  renderPath();
  renderFitness();
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
    onSnapshot(collectionRef("nutrition"), (snapshot) => {
      liveNutrition = snapshot.docs.map((docItem) => docItem.data());
      renderAll();
    })
  );

  unsubscribers.push(
    onSnapshot(collectionRef("transactions"), (snapshot) => {
      liveTransactions = snapshot.docs.map((docItem) => docItem.data());
      renderAll();
    })
  );

  unsubscribers.push(
    onSnapshot(doc(db, "users", currentUser.uid, "profile", "bodyProfile"), (snapshot) => {
      liveProfile = snapshot.exists() ? snapshot.data() : null;

      if (liveProfile) {
        els.userAge.value = liveProfile.age ?? "";
        els.userSex.value = liveProfile.sex ?? "male";
        els.userHeight.value = liveProfile.heightCm ?? "";
        els.userWeight.value = liveProfile.weightKg ?? "";
        els.userGoal.value = liveProfile.goal ?? "maintain";
        els.goalWeight.value = liveProfile.goalWeight ?? "";
        els.bodyFat.value = liveProfile.bodyFat ?? "";
        els.dailySteps.value = liveProfile.dailySteps ?? "";
        els.sleepHours.value = liveProfile.sleepHours ?? "";
      }

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
els.taskFrequency.addEventListener("change", toggleTaskDayField);

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
    frequency: els.taskFrequency.value,
    dayOfWeek: els.taskFrequency.value === "weekly" ? els.taskDay.value : "Every day",
    category: els.taskCategory.value,
    period: els.taskPeriod.value,
    timeBlock: els.taskTimeBlock.value,
    priority: els.taskPriority.value,
    note: els.taskNote.value.trim()
  });

  els.taskForm.reset();
  els.taskFrequency.value = "daily";
  els.taskDay.value = currentDayName();
  els.taskPeriod.value = "Day";
  els.taskTimeBlock.value = "Morning";
  els.taskPriority.value = "Medium";
  toggleTaskDayField();
});

els.profileForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) {
    alert("Please sign in first.");
    return;
  }

  const age = Number(els.userAge.value);
  const sex = els.userSex.value;
  const heightCm = Number(els.userHeight.value);
  const weightKg = Number(els.userWeight.value);
  const goal = els.userGoal.value;
  const goalWeight = Number(els.goalWeight.value || 0);
  const bodyFat = Number(els.bodyFat.value || 0);
  const dailySteps = Number(els.dailySteps.value || 0);
  const sleepHours = Number(els.sleepHours.value || 0);

  if (!age || !heightCm || !weightKg || !sleepHours) {
    alert("Please enter age, height, weight, and sleep.");
    return;
  }

  await saveProfile({
    age,
    sex,
    heightCm,
    weightKg,
    goal,
    goalWeight: goalWeight || null,
    bodyFat: bodyFat || null,
    dailySteps: dailySteps || null,
    sleepHours
  });
});

els.workoutForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) {
    alert("Please sign in first.");
    return;
  }

  const exercise = els.exerciseName.value.trim();
  const weight = Number(els.exerciseWeight.value);
  const sets = Number(els.exerciseSets.value);
  const reps = Number(els.exerciseReps.value);

  if (!exercise || Number.isNaN(weight) || weight < 0 || Number.isNaN(sets) || sets <= 0 || Number.isNaN(reps) || reps <= 0) {
    return;
  }

  await addWorkout({
    day: els.workoutDay.value,
    exercise,
    weight,
    sets,
    reps,
    date: els.exerciseDate.value,
    note: els.exerciseNote.value.trim()
  });

  els.workoutForm.reset();
  els.workoutDay.value = "Push";
  els.exerciseDate.value = todayISODate();
});

els.nutritionForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) {
    alert("Please sign in first.");
    return;
  }

  const title = els.foodName.value.trim();
  const grams = Number(els.foodGrams.value);
  const meal = els.foodMeal.value;
  const date = els.foodDate.value;
  const note = els.foodNote.value.trim();

  if (!title || Number.isNaN(grams) || grams <= 0) {
    return;
  }

  const manualCalories = Number(els.foodCalories.value);
  const manualProtein = Number(els.foodProtein.value);
  const manualCarbs = Number(els.foodCarbs.value);
  const manualFats = Number(els.foodFats.value);

  const hasManualMacros =
    !Number.isNaN(manualCalories) && manualCalories > 0 &&
    !Number.isNaN(manualProtein) &&
    !Number.isNaN(manualCarbs) &&
    !Number.isNaN(manualFats);

  const estimated = hasManualMacros
    ? {
        calories: manualCalories,
        protein: manualProtein,
        carbs: manualCarbs,
        fats: manualFats,
        estimated: false
      }
    : estimateMacros(title, grams);

  await addNutritionEntry({
    title,
    grams,
    meal,
    date,
    note,
    calories: estimated.calories,
    protein: estimated.protein,
    carbs: estimated.carbs,
    fats: estimated.fats,
    estimated: estimated.estimated
  });

  els.nutritionForm.reset();
  els.foodMeal.value = "Breakfast";
  els.foodDate.value = todayISODate();
});

els.budgetForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) {
    alert("Please sign in first.");
    return;
  }

  const title = els.transactionTitle.value.trim();
  const amount = Number(els.transactionAmount.value);

  if (!title || Number.isNaN(amount) || amount <= 0) return;

  const roundedTo = Math.ceil(amount);
  const roundUp = roundUpValue(amount);

  await addTransaction({
    title,
    amount,
    category: els.transactionCategory.value,
    date: els.transactionDate.value,
    note: els.transactionNote.value.trim(),
    roundedTo,
    roundUp
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
    liveNutrition = [];
    liveProfile = null;
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
if (els.foodDate) els.foodDate.value = todayISODate();
els.taskFrequency.value = "daily";
toggleTaskDayField();
renderAll();
