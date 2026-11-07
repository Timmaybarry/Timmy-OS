import { today, shiftDate, currentStreak, longestStreak, toggleCheckin, uid } from "./logic.js";
import { load, save, exportJson, importJson } from "./store.js";

let state = load();
let date = today();
const $ = (id) => document.getElementById(id);

function commit() {
  save(state);
  render();
}

function row(checked, onToggle, label, onDelete, cls) {
  const li = document.createElement("li");
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = checked;
  cb.onchange = () => onToggle(cb.checked);
  const span = document.createElement("span");
  span.textContent = label;
  if (cls) span.className = cls;
  const del = document.createElement("button");
  del.textContent = "✕";
  del.setAttribute("aria-label", "Delete");
  del.onclick = onDelete;
  li.append(cb, span, del);
  return li;
}

function render() {
  $("date").textContent = date;
  const note = $("journal");
  if (document.activeElement !== note) note.value = state.journal[date] || "";

  $("tasks").replaceChildren(
    ...state.tasks
      .filter((t) => t.date === date)
      .map((t) =>
        row(
          t.done,
          (v) => {
            t.done = v;
            commit();
          },
          t.text,
          () => {
            state.tasks = state.tasks.filter((x) => x.id !== t.id);
            commit();
          },
          t.done ? "done" : ""
        )
      )
  );

  $("habits").replaceChildren(
    ...state.habits.map((h) =>
      row(
        h.checkins.includes(date),
        () => {
          h.checkins = toggleCheckin(h.checkins, date);
          commit();
        },
        `${h.name} — 🔥 ${currentStreak(h.checkins, date)} (best ${longestStreak(h.checkins)})`,
        () => {
          state.habits = state.habits.filter((x) => x.id !== h.id);
          commit();
        }
      )
    )
  );
}

$("journal").oninput = (e) => {
  state.journal[date] = e.target.value;
  save(state);
};
$("prev").onclick = () => ((date = shiftDate(date, -1)), render());
$("next").onclick = () => ((date = shiftDate(date, 1)), render());
$("todayBtn").onclick = () => ((date = today()), render());

$("taskForm").onsubmit = (e) => {
  e.preventDefault();
  const text = $("taskText").value.trim();
  if (!text) return;
  state.tasks.push({ id: uid(), text, date, done: false });
  $("taskText").value = "";
  commit();
};
$("habitForm").onsubmit = (e) => {
  e.preventDefault();
  const name = $("habitName").value.trim();
  if (!name) return;
  state.habits.push({ id: uid(), name, checkins: [] });
  $("habitName").value = "";
  commit();
};

$("export").onclick = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([exportJson(state)], { type: "application/json" }));
  a.download = `timmy-os-${today()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
};
$("import").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    state = importJson(await file.text());
    commit();
  } catch {
    alert("Invalid backup file");
  }
  e.target.value = "";
};

if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js");
render();
