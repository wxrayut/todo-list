import { createTask, getTasks, setTasks, deleteTask } from "./storage.js";

const $ = (selectors) => document.querySelector(selectors);
const qs = (selectors) => Array.from(document.querySelectorAll(selectors));

const app = $("#app");
const listElement = $("#list");
const newTaskInput = $("#newTaskInput");
const addBtn = $("#addBtn");
const dueInput = $("#dueInput");
const prioritySelect = $("#prioritySelect");
const searchElement = $("#search");
const sortSelect = $("#sortSelect");
const statsElement = $("#stats");
const exportBtn = $("#exportBtn");
const importBtn = $("#importBtn");
const importFile = $("#importFile");
const clearCompleted = $("#clearCompleted");
const clearAll = $("#clearAll");
/* const themeToggle = $("#themeToggle"); */
/* const tagListElement = $("#tagList"); */

let tasks = [];
let currentFilter = "all";
let lastDeleted = null;

function updateStats() {
    statsElement.textContent =
        tasks.length +
        " tasks • " +
        tasks.filter((t) => !t.completed).length +
        " left";
}

function showToast(text, actionText, action) {
    const root = document.getElementById("toastRoot");

    root.innerHTML = "";

    const box = document.createElement("div");

    box.className = "toast";

    const txt = document.createElement("div");

    txt.textContent = text;

    const btn = document.createElement("button");

    btn.className = "btn ghost";
    btn.textContent = actionText;
    btn.addEventListener("click", () => {
        action();
        root.innerHTML = "";
    });

    box.appendChild(txt);
    box.appendChild(btn);

    root.appendChild(box);

    root.style.display = "block";

    setTimeout(() => {
        root.style.display = "none";
        root.innerHTML = "";
    }, 5000);
}

function openEdit(task) {
    const newTitle = prompt("Edit task title", task.title);

    if (newTitle === null) return;

    task.title = newTitle.trim() || task.title;

    const newDue = prompt(
        "Due date (YYYY-MM-DD) or leave blank",
        task.due || ""
    );

    if (newDue !== null) {
        task.due = newDue.trim() || null;
    }

    const newPri = prompt("Priority: low / medium / high", task.priority);

    if (newPri !== null) {
        task.priority = ["low", "medium", "high"].includes(newPri)
            ? newPri
            : task.priority;
    }

    render();
}

function renderTask(task) {
    const li = document.createElement("li");

    li.className = "task";
    li.draggable = true;
    li.dataset.id = task.id;
    li.addEventListener("dragstart", (e) => {
        li.classList.add("dragging");
        e.dataTransfer.setData("text/plain", task.id);
    });
    li.addEventListener("dragend", () => li.classList.remove("dragging"));

    const checkbox = document.createElement("div");

    checkbox.className = "checkbox";
    checkbox.innerHTML = task.completed ? "✓" : "";
    checkbox.title = "Toggle complete";
    checkbox.addEventListener("click", () => {
        task.completed = !task.completed;
        render();
    });

    const title = document.createElement("div");
    title.className = "title";

    const strong = document.createElement("strong");
    strong.textContent = task.title;

    title.appendChild(strong);

    const meta = document.createElement("div");
    meta.className = "meta";

    const pieces = [];

    if (task.tags && task.tags.length) {
        pieces.push("Tags: " + task.tags.join(", "));
    }
    if (task.due) {
        const dueDate = new Date(task.due);
        const now = new Date();
        const overdue = dueDate < now && !task.completed;
        const day = dueDate.toLocaleDateString();

        pieces.push("Due: " + day + (overdue ? " • overdue" : ""));

        if (overdue) {
            li.classList.add("overdue");
        }
    }

    pieces.push("Priority: " + task.priority);

    meta.textContent = pieces.join(" • ");

    title.appendChild(meta);

    if (task.completed) {
        li.classList.add("completed");
    }

    const actions = document.createElement("div");

    actions.className = "actions";

    const editBtn = document.createElement("button");

    editBtn.innerHTML = "✏️";
    editBtn.title = "Edit";
    editBtn.addEventListener("click", () => {
        openEdit(task);
    });
    editBtn.style.background = "transparent";
    editBtn.style.border = "none";
    editBtn.style.cursor = "pointer";

    const delBtn = document.createElement("button");

    delBtn.innerHTML = "❌";
    delBtn.title = "Delete";
    delBtn.addEventListener("click", () => {
        lastDeleted = deleteTask(tasks, task.id);
        render();
        showToast(`Task ${task.title} deleted`, "Undo", () => {
            tasks.push(lastDeleted);
            lastDeleted = null;
            render();
        });
    });
    delBtn.style.background = "transparent";
    delBtn.style.border = "none";
    delBtn.style.cursor = "pointer";

    /* const favBtn = document.createElement("button");
    favBtn.innerHTML = "⭐";
    favBtn.title = "Toggle tag";
    favBtn.addEventListener("click", () => {
        task.tags = task.tags || [];
        if (task.tags.includes("star")) {
            task.tags = task.tags.filter((x) => x !== "star");
        } else {
            task.tags.push("star");
        }
        render();
    });
    favBtn.style.background = "transparent";
    favBtn.style.border = "none";
    favBtn.style.cursor = "pointer"; */

    const priority = document.createElement("div");

    priority.className = "priority " + task.priority;
    priority.textContent = task.priority;

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    // actions.appendChild(favBtn);

    li.appendChild(checkbox);
    li.appendChild(title);
    li.appendChild(priority);
    li.appendChild(actions);

    return li;
}

function render() {
    let visible = tasks.slice();
    const search = searchElement.value.trim().toLowerCase();

    if (search) {
        visible = visible.filter(
            (t) =>
                t.title.toLowerCase().includes(search) ||
                (t.tags || []).join(" ").toLowerCase().includes(search)
        );
    }

    if (currentFilter === "active") {
        visible = visible.filter((t) => !t.completed);
    }
    if (currentFilter === "completed") {
        visible = visible.filter((t) => t.completed);
    }

    if (sortSelect.value === "due") {
        visible.sort((a, b) => {
            if (!a.due) return 1;
            if (!b.due) return -1;
            return new Date(a.due) - new Date(b.due);
        });
    } else if (sortSelect.value === "priority") {
        const order = { high: 0, medium: 1, low: 2 };
        visible.sort((a, b) => order[a.priority] - order[b.priority]);
    } else {
        visible.sort((a, b) => b.createdAt - a.createdAt);
    }

    listElement.innerHTML = "";

    visible.forEach((t) => listElement.appendChild(renderTask(t)));

    setTasks(tasks);
    updateStats();
}

function debounce(fn, wait) {
    let t;

    return function (...a) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, a), wait);
    };
}

function addTaskFromInput() {
    const txt = newTaskInput.value.trim();

    if (!txt) return;

    const due = dueInput.value || null;

    const pri = prioritySelect.value;
    const task = createTask(txt, due, pri, []);

    tasks.push(task);

    newTaskInput.value = "";
    dueInput.value = "";

    render();
}

function init() {
    tasks = getTasks();
    render();
}

window.onload = () => {
    addBtn.addEventListener("click", addTaskFromInput);

    exportBtn.addEventListener("click", () => {
        const data = JSON.stringify(tasks, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = "todo_list.json";

        document.body.appendChild(a);

        a.click();
        a.remove();

        URL.revokeObjectURL(url);
    });

    importBtn.addEventListener("click", () => {
        importFile.click();
    });
    importFile.addEventListener("change", (e) => {
        const f = e.target.files[0];

        if (!f) return;

        const r = new FileReader();

        r.onload = () => {
            try {
                const imported = JSON.parse(r.result);
                if (Array.isArray(imported)) {
                    tasks = imported;
                    render();
                    alert("Imported");
                } else {
                    alert("Invalid file");
                }
            } catch (e) {
                alert("Invalid JSON");
            }
        };
        r.readAsText(f);
    });

    clearCompleted.addEventListener("click", () => {
        tasks = tasks.filter((t) => !t.completed);
        render();
    });
    clearAll.addEventListener("click", () => {
        if (confirm("Clear ALL tasks?")) {
            tasks = [];
            render();
        }
    });

    qs(".filterBtn").forEach((b) =>
        b.addEventListener("click", () => {
            qs(".filterBtn").forEach((x) => x.classList.remove("active"));
            b.classList.add("active");
            currentFilter = b.dataset.filter;
            render();
        })
    );

    searchElement.addEventListener("input", debounce(render, 200));
    sortSelect.addEventListener("change", render);

    window.addEventListener("beforeunload", () => {
        setTasks(tasks);
        updateStats();
    });

    init();
};
