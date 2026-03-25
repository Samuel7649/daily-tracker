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

const defaultTasks = [
  {
    id: "gym",
    name: "Gym",
    category: "Health",
    priority: "High",
    note: "Workout for at least 45 minutes",
    completed: false
  },
  {
    id: "study",
    name: "Study",
    category: "Study",
    priority: "High",
    note: "Revise notes or complete homework",
    completed: false
  },
  {
    id: "read",
    name: "Read",
    category: "Personal",
    priority: "Medium",
    note: "Read 10 pages minimum",
    completed: false
  }
];

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

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userInfo = document.getElementById("userInfo");

const FILTER_KEY = "dailyTrackerFilter_v3";

let currentUser = null;
let liveTasks = [];
let unsubscribeTasks = null;

function formatPrettyDate() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function loadFilter() {
  return localStorage.getItem(FILTER_KEY) || "all";
}

function saveFilter(filter) {
  localStorage.setItem(FILTER_KEY, filter);
}

function getFilteredTasks(tasks, filter) {
  if (filter === "active") return tasks.filter(task => !task.completed);
  if (filter === "completed") return tasks.filter(task => task.completed);
  return tasks;
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

function tasksCollection(uid) {
  return collection(db, "users", uid, "tasks");
}

async function seedDefaultTasks(uid) {
  const snapshot = await getDocs(tasksCollection(uid));
  if (!snapshot.empty) return;

  for (const task of defaultTasks) {
    await setDoc(doc(db, "users", uid, "tasks", task.id), task);
  }
}

async function addTask({ name, category, priority, note }) {
  if (!currentUser) return;

  const id = crypto.randomUUID();

  const task = {
    id,
    name,
    category,
    priority,
    note,
    completed: false
  };

  await setDoc(doc(db, "users", currentUser.uid, "tasks", id), task);
}

async function updateTask(id, updates) {
  if (!currentUser) return;

  const existing = liveTasks.find((task) => task.id === id);
  if (!existing) return;

  await setDoc(
    doc(db, "users", currentUser.uid, "tasks", id),
    { ...existing, ...updates },
    { merge: true }
  );
}

async function removeTask(id) {
  if (!currentUser) return;
  await deleteDoc(doc(db, "users", currentUser.uid, "tasks", id));
}

function render() {
  todayDate.textContent = formatPrettyDate();
  taskList.innerHTML = "";

  const filter = loadFilter();
  const visibleTasks = getFilteredTasks(liveTasks, filter);

  const completed = liveTasks.filter((task) => task.completed).length;
  const total = liveTasks.length;
  const remaining = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${completed}/${total} complete (${percent}%)`;

  totalTasks.textContent = total;
  completedTasks.textContent = completed;
  remainingTasks.textContent = remaining;

  if (!currentUser) {
    status.textContent = "Sign in to sync your tasks across devices.";
  } else if (total === 0) {
    status.textContent = "No tasks yet — start building your day.";
  } else if (percent === 100) {
    status.textContent = "Everything is done for today 🎉";
  } else {
    status.textContent = "Your tasks are syncing across devices.";
  }

  if (visibleTasks.length === 0) {
    emptyMessage.style.display = "block";
    emptyMessage.textContent = currentUser
      ? "No matching tasks."
      : "Sign in to load your synced tasks.";
  } else {
    emptyMessage.style.display = "none";
  }

  visibleTasks.forEach((task) => {
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
              <span class="badge ${priorityClass}">
                ${escapeHtml(task.priority)} Priority
              </span>
            </div>
            ${task.note ? `<p class="task-note">${escapeHtml(task.note)}</p>` : ""}
          </div>
        </div>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    const checkbox = li.querySelector('input[type="checkbox"]');
    const deleteBtn = li.querySelector(".delete-btn");

    checkbox.addEventListener("change", async () => {
      await updateTask(task.id, { completed: checkbox.checked });
    });

    deleteBtn.addEventListener("click", async () => {
      await removeTask(task.id);
    });

    taskList.appendChild(li);
  });

  filterButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });

  loginBtn.hidden = !!currentUser;
  logoutBtn.hidden = !currentUser;
  userInfo.textContent = currentUser
    ? `Signed in as ${currentUser.displayName || currentUser.email || "user"}`
    : "Not signed in";
}

loginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    alert("Sign-in failed: " + err.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) {
    alert("Please sign in first.");
    return;
  }

  const name = taskNameInput.value.trim();
  const category = taskCategoryInput.value;
  const priority = taskPriorityInput.value;
  const note = taskNoteInput.value.trim();

  if (!name) return;

  await addTask({ name, category, priority, note });

  taskForm.reset();
  taskPriorityInput.value = "Medium";
});

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    saveFilter(btn.dataset.filter);
    render();
  });
});

onAuthStateChanged(auth, async (user) => {
  if (unsubscribeTasks) {
    unsubscribeTasks();
    unsubscribeTasks = null;
  }

  currentUser = user;

  if (!user) {
    liveTasks = [];
    render();
    return;
  }

  await seedDefaultTasks(user.uid);

  unsubscribeTasks = onSnapshot(tasksCollection(user.uid), (snapshot) => {
    liveTasks = snapshot.docs.map((docItem) => docItem.data());
    render();
  });
});

render();
