const tasks = window.taskBank;
const tasksPerPage = 21;

let grade = "4";
let randomTaskId = null;
let visibleTaskCount = tasksPerPage;
const copied = new Set(JSON.parse(localStorage.getItem("math-tournament-copied") || "[]"));
const tasksElement = document.querySelector("#tasks");
const filtersElement = document.querySelector("#filters");
const loadMoreButton = document.querySelector("#loadMoreButton");

function escapeHTML(value) {
  return value.replace(/[&<>"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
}

function mathML(text) {
  return escapeHTML(text)
    .replace(/([A-Za-zА-Яа-яЁё0-9]+)\^(-?[A-Za-zА-Яа-яЁё0-9]+)/g, (_, base, exponent) => `<math xmlns="http://www.w3.org/1998/Math/MathML"><msup><mn>${base}</mn><mn>${exponent}</mn></msup></math>`)
    .replace(/\)\^(-?[A-Za-z0-9]+)/g, (_, exponent) => `<math xmlns="http://www.w3.org/1998/Math/MathML"><msup><mo>)</mo><mn>${exponent}</mn></msup></math>`);
}

document.querySelectorAll("[data-count]").forEach(element => {
  element.textContent = tasks[element.dataset.count].length;
});

function render() {
  const selected = tasks[grade];
  const visibleTasks = selected.slice(0, visibleTaskCount);
  document.querySelector("#taskCount").textContent = `Показано ${visibleTasks.length} из ${selected.length} задач`;
  filtersElement.innerHTML = "<span>Нажмите на карточку, чтобы скопировать условие. Скопированные задачи выделены цветом.</span>";
  tasksElement.classList.toggle("random-mode", Boolean(randomTaskId));
  tasksElement.innerHTML = visibleTasks.map(task => `<article class="task ${copied.has(task.id) ? "copied" : ""} ${task.id === randomTaskId ? "random-task" : ""}" data-id="${task.id}" tabindex="0" role="button" aria-label="Скопировать задачу ${task.number}"><div class="task-top"><span class="number">ЗАДАЧА ${task.number}</span><span class="tag">${task.id === randomTaskId ? "Случайная задача" : copied.has(task.id) ? "Скопировано ✓" : "Копировать"}</span></div><p class="problem">${mathML(task.text)}</p></article>`).join("");
  loadMoreButton.hidden = visibleTasks.length === selected.length;
}

document.querySelectorAll(".tab").forEach(button => button.addEventListener("click", () => {
  grade = button.dataset.grade;
  randomTaskId = null;
  visibleTaskCount = tasksPerPage;
  document.querySelectorAll(".tab").forEach(tab => { tab.classList.toggle("active", tab === button); tab.setAttribute("aria-selected", tab === button); });
  render();
}));

async function copyTask(card) {
  const task = tasks[grade].find(item => item.id === card.dataset.id);
  if (!task) return;
  if (randomTaskId && task.id !== randomTaskId) return;
  try {
    await navigator.clipboard.writeText(task.text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = task.text;
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
  copied.add(task.id);
  localStorage.setItem("math-tournament-copied", JSON.stringify([...copied]));
  randomTaskId = null;
  render();
}

tasksElement.addEventListener("click", event => {
  const card = event.target.closest(".task");
  if (card) copyTask(card);
});
tasksElement.addEventListener("keydown", event => {
  if (!["Enter", " "].includes(event.key)) return;
  const card = event.target.closest(".task");
  if (!card) return;
  event.preventDefault();
  copyTask(card);
});
document.querySelector("#randomButton").addEventListener("click", () => {
  const task = tasks[grade][Math.floor(Math.random() * tasks[grade].length)];
  randomTaskId = task.id;
  visibleTaskCount = Math.max(visibleTaskCount, tasks[grade].findIndex(item => item.id === task.id) + 1);
  render();
  document.querySelector(`[data-id="${task.id}"]`).scrollIntoView({ behavior: "smooth", block: "center" });
});
loadMoreButton.addEventListener("click", () => {
  visibleTaskCount += tasksPerPage;
  render();
});
document.querySelector("#resetButton").addEventListener("click", () => {
  copied.clear();
  localStorage.removeItem("math-tournament-copied");
  render();
});
function fitPrintPage(page) {
  const columns = page.querySelector(".print-columns");
  for (let size = 8; size >= 4.5; size -= 0.25) {
    columns.style.fontSize = `${size}pt`;
    if (columns.scrollWidth <= columns.clientWidth + 1 && columns.scrollHeight <= columns.clientHeight + 1) return;
  }
}

document.querySelector("#printButton").addEventListener("click", () => {
  const printArea = document.querySelector("#printArea");
  const selected = tasks[grade];
  const pageCount = Math.ceil(selected.length / 50);
  printArea.innerHTML = Array.from({ length: pageCount }, (_, index) => {
    const chunk = selected.slice(index * 50, index * 50 + 50);
    return `<section class="print-page"><header class="print-header"><div><b>Математический турнир школы «Мариамполь»</b></div><div>${grade} класс · задачи ${chunk[0].number}–${chunk.at(-1).number} · лист ${index + 1} из ${pageCount}</div></header><ol class="print-columns">${chunk.map(task => `<li><b>${task.number}.</b> ${mathML(task.text)}</li>`).join("")}</ol><footer class="print-footer">при поддержке ООО «СТК „Добрострой“»</footer></section>`;
  }).join("");
  printArea.classList.add("measuring");
  printArea.querySelectorAll(".print-page").forEach(fitPrintPage);
  printArea.classList.remove("measuring");
  document.title = `Банк задач — ${grade} класс`;
  window.print();
  document.title = "Открытый банк задач — Математический турнир школы «Мариамполь»";
});
document.querySelector("#toTopButton").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
render();
