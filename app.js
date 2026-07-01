let pacConstitution = {};
let pacProfile = {};
let pacModules = {};
let tasks = [];

/* ---------------- CLOUD HELPERS ---------------- */

async function saveCloudItem(category, title, content) {
  localStorage.setItem(`pac_${category}`, content);

  try {
    const { error } = await pacCloud.from("pac_data").insert([
      {
        category,
        title,
        content
      }
    ]);

    if (error) {
      console.log("Cloud Save Error:", error);
    } else {
      console.log("Saved to PAC Cloud:", category);
    }
  } catch (error) {
    console.log("Cloud Offline/Fallback:", error);
  }
}

async function loadCloudLatest(category) {
  try {
    const { data, error } = await pacCloud
      .from("pac_data")
      .select("*")
      .eq("category", category)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return localStorage.getItem(`pac_${category}`);
    }

    return data[0].content;
  } catch {
    return localStorage.getItem(`pac_${category}`);
  }
}

/* ---------------- JSON LOADERS ---------------- */

fetch("pac_constitution.json")
  .then(response => response.json())
  .then(data => {
    pacConstitution = data;
    renderGoals();
  })
  .catch(error => console.log("Constitution Load Error:", error));

fetch("profile.json")
  .then(response => response.json())
  .then(data => {
    pacProfile = data;
    renderProfile();
  })
  .catch(error => console.log("Profile Load Error:", error));

fetch("modules.json")
  .then(response => response.json())
  .then(data => {
    pacModules = data;
    renderModules();
  })
  .catch(error => console.log("Modules Load Error:", error));

/* ---------------- PROFILE / MODULES ---------------- */

function renderProfile() {
  const welcome = document.getElementById("welcomeMessage");
  const mission = document.getElementById("missionDisplay");
  const incomeGoal = document.getElementById("incomeGoalDisplay");

  if (welcome && pacProfile.name) {
    welcome.innerText = `Welcome back, ${pacProfile.name}`;
  }

  if (mission && pacProfile.mission) {
    mission.innerText = pacProfile.mission;
  }

  if (incomeGoal && pacProfile.monthly_income_goal) {
    incomeGoal.innerText = `$${pacProfile.monthly_income_goal}`;
  }
}

function renderModules() {
  const moduleList = document.getElementById("moduleList");
  if (!moduleList) return;

  moduleList.innerHTML = "";

  Object.entries(pacModules).forEach(([module, enabled]) => {
    const li = document.createElement("li");
    li.innerText = `${module}: ${enabled ? "Enabled" : "Disabled"}`;
    moduleList.appendChild(li);
  });
}

/* ---------------- PRIORITY ---------------- */

async function savePriority() {
  const value = document.getElementById("priorityInput").value.trim();
  if (!value) return;

  document.getElementById("priorityDisplay").innerText = value;
  localStorage.setItem("pacPriority", value);

  await saveCloudItem("priority", "Today's Priority", value);
}

/* ---------------- MEMORY ---------------- */

async function saveMemory() {
  const value = document.getElementById("memoryInput").value.trim();
  if (!value) return;

  document.getElementById("memoryDisplay").innerText = value;
  localStorage.setItem("pacMemory", value);

  await saveCloudItem("memory", "Quick Memory", value);
}

/* ---------------- TASKS ---------------- */

async function saveTasks() {
  localStorage.setItem("pacTasks", JSON.stringify(tasks));
  await saveCloudItem("tasks", "Task List", JSON.stringify(tasks));
}

async function addTask() {
  const input = document.getElementById("taskInput");
  const task = input.value.trim();

  if (!task) return;

  tasks.push({
    text: task,
    done: false
  });

  input.value = "";
  renderTasks();
  await saveTasks();
}

async function toggleTask(index) {
  tasks[index].done = !tasks[index].done;
  renderTasks();
  await saveTasks();
}

async function deleteTask(index) {
  tasks.splice(index, 1);
  renderTasks();
  await saveTasks();
}

function renderTasks() {
  const list = document.getElementById("taskList");
  if (!list) return;

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

/* ---------------- DECISION ENGINE ---------------- */

async function calculateDecision() {
  const decision = document.getElementById("decisionInput").value.trim();
  const option = document.getElementById("optionInput").value.trim();

  const benefit = Number(document.getElementById("benefitInput").value);
  const cost = Number(document.getElementById("costInput").value);
  const risk = Number(document.getElementById("riskInput").value);
  const time = Number(document.getElementById("timeInput").value);

  if (!decision || !option) return;

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

  let constitutionNote = "";

  if (pacConstitution.core_priorities) {
    constitutionNote = `
      <br><br>
      PAC Priority Check:<br>
      ${pacConstitution.core_priorities.join(" → ")}
    `;
  }

  const result = `
    Decision: ${decision}<br>
    Option: ${option}<br>
    Score: ${score}<br>
    PAC Recommendation: ${recommendation}
    ${constitutionNote}
  `;

  document.getElementById("decisionResult").innerHTML = result;
  localStorage.setItem("pacDecision", result);

  await saveCloudItem("decision", decision, result);
}

/* ---------------- GOALS ---------------- */

function renderGoals() {
  const goalsList = document.getElementById("goalsList");
  if (!goalsList) return;

  goalsList.innerHTML = "";

  const goals = pacConstitution.long_term_goals || [
    "KDBS Development",
    "CTU Accounting Degree",
    "Increase Income",
    "Sell Old Camper",
    "PAC Development"
  ];

  goals.forEach(goal => {
    const li = document.createElement("li");
    li.innerText = goal;
    goalsList.appendChild(li);
  });
}

/* ---------------- BACKUP ---------------- */

function exportBackup() {
  const backup = {
    priority: localStorage.getItem("pacPriority"),
    memory: localStorage.getItem("pacMemory"),
    decision: localStorage.getItem("pacDecision"),
    tasks: JSON.parse(localStorage.getItem("pacTasks")) || []
  };

  document.getElementById("backupBox").value = JSON.stringify(backup, null, 2);
}

async function importBackup() {
  const text = document.getElementById("backupBox").value;

  try {
    const backup = JSON.parse(text);

    if (backup.priority) {
      localStorage.setItem("pacPriority", backup.priority);
      await saveCloudItem("priority", "Imported Priority", backup.priority);
    }

    if (backup.memory) {
      localStorage.setItem("pacMemory", backup.memory);
      await saveCloudItem("memory", "Imported Memory", backup.memory);
    }

    if (backup.decision) {
      localStorage.setItem("pacDecision", backup.decision);
      await saveCloudItem("decision", "Imported Decision", backup.decision);
    }

    if (backup.tasks) {
      tasks = backup.tasks;
      localStorage.setItem("pacTasks", JSON.stringify(tasks));
      await saveCloudItem("tasks", "Imported Tasks", JSON.stringify(tasks));
    }

    location.reload();
  } catch {
    alert("Invalid backup data.");
  }
}

/* ---------------- STARTUP ---------------- */

window.onload = async function () {
  const priority = await loadCloudLatest("priority");
  const memory = await loadCloudLatest("memory");
  const decision = await loadCloudLatest("decision");
  const cloudTasks = await loadCloudLatest("tasks");

  if (priority) {
    localStorage.setItem("pacPriority", priority);
    document.getElementById("priorityDisplay").innerText = priority;
  }

  if (memory) {
    localStorage.setItem("pacMemory", memory);
    document.getElementById("memoryDisplay").innerText = memory;
  }

  if (decision) {
    localStorage.setItem("pacDecision", decision);
    document.getElementById("decisionResult").innerHTML = decision;
  }

  if (cloudTasks) {
    try {
      tasks = JSON.parse(cloudTasks);
    } catch {
      tasks = [];
    }
  } else {
    tasks = JSON.parse(localStorage.getItem("pacTasks")) || [];
  }

  renderTasks();
  renderGoals();
  renderProfile();
  renderModules();
};