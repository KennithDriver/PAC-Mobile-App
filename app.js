function savePriority() {
  const value = document.getElementById("priorityInput").value;

  localStorage.setItem("pacPriority", value);

  document.getElementById("priorityDisplay").innerText = value;
}

function saveMemory() {
  const value = document.getElementById("memoryInput").value;

  localStorage.setItem("pacMemory", value);

  document.getElementById("memoryDisplay").innerText = value;
}

let tasks = JSON.parse(localStorage.getItem("pacTasks")) || [];

function addTask() {
  const input = document.getElementById("taskInput");
  const task = input.value.trim();

  if (task === "") return;

  tasks.push({
    text: task,
    done: false
  });

  localStorage.setItem("pacTasks", JSON.stringify(tasks));

  input.value = "";

  renderTasks();
}

function toggleTask(index) {
  tasks[index].done = !tasks[index].done;

  localStorage.setItem("pacTasks", JSON.stringify(tasks));

  renderTasks();
}

function deleteTask(index) {
  tasks.splice(index, 1);

  localStorage.setItem("pacTasks", JSON.stringify(tasks));

  renderTasks();
}

function renderTasks() {
  const list = document.getElementById("taskList");

  list.innerHTML = "";

  tasks.forEach((task, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <span style="text-decoration:${task.done ? "line-through" : "none"}">
        ${task.text}
      </span>

      <div class="task-buttons">
        <button onclick="toggleTask(${index})">Done</button>
        <button onclick="deleteTask(${index})">Delete</button>
      </div>
    `;

    list.appendChild(li);
  });
}

function calculateDecision() {
  const decision = document.getElementById("decisionInput").value;
  const option = document.getElementById("optionInput").value;

  const benefit = Number(document.getElementById("benefitInput").value);
  const cost = Number(document.getElementById("costInput").value);
  const risk = Number(document.getElementById("riskInput").value);
  const time = Number(document.getElementById("timeInput").value);

  const score = benefit - cost - risk - time;

  let recommendation = "";

  if (score >= 5) {
    recommendation = "Strong Yes";
  } else if (score >= 1) {
    recommendation = "Possible Yes";
  } else if (score === 0) {
    recommendation = "Neutral";
  } else {
    recommendation = "Not Recommended";
  }

  const result = `
    Decision: ${decision}<br>
    Option: ${option}<br>
    Score: ${score}<br>
    PAC Recommendation: ${recommendation}
  `;

  localStorage.setItem("pacDecision", result);

  document.getElementById("decisionResult").innerHTML = result;
}

window.onload = function () {
  const priority = localStorage.getItem("pacPriority");
  const memory = localStorage.getItem("pacMemory");
  const decision = localStorage.getItem("pacDecision");

  if (priority) {
    document.getElementById("priorityDisplay").innerText = priority;
  }

  if (memory) {
    document.getElementById("memoryDisplay").innerText = memory;
  }

  if (decision) {
    document.getElementById("decisionResult").innerHTML = decision;
  }

  renderTasks();
};