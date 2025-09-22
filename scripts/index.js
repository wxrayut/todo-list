function loadTasks() {
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks.forEach((task) => addTaskToList(task));
}

function addTask() {
  let taskInput = document.getElementById("task");
  let task = taskInput.value.trim();

  if (task) {
    addTaskToList(task);
    saveTask(task);
    taskInput.value = "";
  }
}

function saveTask(task) {
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks.push(task);
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function removeTask(taskText) {
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks = tasks.filter((t) => t !== taskText);
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function addTaskToList(task) {
  let li = document.createElement("li");

  let span = document.createElement("span");
  span.textContent = task;

  let btn = document.createElement("button");
  btn.textContent = "❌";
  btn.style.marginLeft = "10px";
  btn.addEventListener("click", () => {
    li.remove();
    removeTask(task);
  });

  li.appendChild(span);
  li.appendChild(btn);
  document.getElementById("list").appendChild(li);
}

window.onload = loadTasks;
