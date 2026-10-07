const tasks = window.taskBank;
const solutions = window.solutionBank || {};
const listElement = document.querySelector("#solutions");
const searchElement = document.querySelector("#search");
let grade = "4";

function escapeHTML(value) {
  return value.replace(/[&<>"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
}

function mathML(text) {
  return escapeHTML(text)
    .replace(/([A-Za-zА-Яа-яЁё0-9]+)\^(-?[A-Za-zА-Яа-яЁё0-9]+)/g, (_, base, exponent) => `<math xmlns="http://www.w3.org/1998/Math/MathML"><msup><mn>${base}</mn><mn>${exponent}</mn></msup></math>`)
    .replace(/\)\^(-?[A-Za-z0-9]+)/g, (_, exponent) => `<math xmlns="http://www.w3.org/1998/Math/MathML"><msup><mo>)</mo><mn>${exponent}</mn></msup></math>`);
}

function solutionHTML(id) {
  const solution = solutions[id];
  if (!solution) return `<p class="solution-missing">Решение скоро появится.</p>`;
  const [steps, answer] = solution.split(/\nОтвет:\s*/);
  const paragraphs = steps.split("\n").filter(Boolean).map(line => `<p>${mathML(line)}</p>`).join("");
  return paragraphs + (answer ? `<p class="answer">Ответ: ${mathML(answer)}</p>` : "");
}

function render() {
  const query = searchElement.value.trim().toLowerCase();
  const selected = tasks[grade].filter(task => !query || String(task.number) === query || task.text.toLowerCase().includes(query));
  document.querySelector("#taskCount").textContent = `${selected.length} задач`;
  listElement.innerHTML = selected.length ? selected.map(task => `<article class="solution-card" data-id="${task.id}"><div class="task-top"><span class="number">ЗАДАЧА ${task.number}</span></div><p class="problem">${mathML(task.text)}</p><button class="solution-toggle" type="button" aria-expanded="false">Решение <span class="arrow">▾</span></button><div class="spoiler"><div class="spoiler-inner"><div class="solution-body">${solutionHTML(task.id)}</div></div></div></article>`).join("") : `<div class="empty">Ничего не найдено</div>`;
}

listElement.addEventListener("click", event => {
  const button = event.target.closest(".solution-toggle");
  if (!button) return;
  const card = button.closest(".solution-card");
  const open = card.classList.toggle("open");
  button.setAttribute("aria-expanded", open);
  button.firstChild.textContent = open ? "Скрыть решение " : "Решение ";
});

document.querySelectorAll(".tab").forEach(button => button.addEventListener("click", () => {
  grade = button.dataset.grade;
  document.querySelectorAll(".tab").forEach(tab => { tab.classList.toggle("active", tab === button); tab.setAttribute("aria-selected", tab === button); });
  render();
}));
searchElement.addEventListener("input", render);
document.querySelector("#collapseButton").addEventListener("click", () => {
  listElement.querySelectorAll(".solution-card.open").forEach(card => card.querySelector(".solution-toggle").click());
});
document.querySelector("#toTopButton").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
render();
