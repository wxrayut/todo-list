const STORAGE_KEY = "MY_STUPID_TODO_LIST";

function generateId(prefix = "task_") {
    return prefix + Math.random().toString(36).slice(2, 9);
}

export function createTask(title, due, priority, tags) {
    return {
        id: generateId(),
        title,
        completed: false,
        createdAt: Date.now(),
        due: due || null,
        priority: priority || "medium",
        tags: tags || [],
    };
}

export function getTasks() {
    try {
        const tasks = localStorage.getItem(STORAGE_KEY);
        return tasks ? JSON.parse(tasks) : [];
    } catch (error) {
        console.error("getTasks parse error:", error);
        return [];
    }
}

export function setTasks(tasks) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error("setTasks error:", error);
    }
}

export function deleteTask(tasks, id) {
    const index = tasks.findIndex((t) => t.id === id);
    return index === -1 ? index : tasks.splice(index, 1)[0];
}
