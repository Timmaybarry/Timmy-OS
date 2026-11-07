import {
  today, shiftDate, shiftMonth, monthGrid, weekDays, daysInMonth, monthStart, sortEvents, timeToMin,
  currentStreak, longestStreak, toggleCheckin, uid, toIcs,
} from "./logic.js";
import { load, save, exportJson, importJson } from "./store.js";

let state = load();
let date = today();
let view = localStorage.getItem("timmy-os:view") || "day";
const $ = (id) => document.getElementById(id);
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el[k] = v;
    else if (v === true) el.setAttribute(k, "");
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  el.append(...kids.flat().filter((k) => k != null));
  return el;
}

const commit = () => (save(state), render());
const eventsOn = (d) => sortEvents(state.events.filter((e) => e.date === d));
const tasksOn = (d) => state.tasks.filter((t) => t.date === d);
const go = (v, d) => ((view = v), (date = d ?? date), localStorage.setItem("timmy-os:view", v), render());
const label = (e) => (e.start ? `${e.start} ${e.title}` : e.title);
const ym = (iso) => `${MONTHS[+iso.slice(5, 7) - 1]} ${iso.slice(0, 4)}`;
const dowOf = (iso) => (new Date(iso + "T00:00:00").getDay() + 6) % 7;

function monthView() {
  const cur = date.slice(0, 7);
  const grid = h("div", { class: "month" }, DOW.map((d) => h("div", { class: "dow" }, d)));
  for (const week of monthGrid(date)) {
    for (const d of week) {
      const dow = dowOf(d);
      grid.append(
        h(
          "div",
          { class: `cell${d.slice(0, 7) !== cur ? " out" : ""}${d === today() ? " today" : ""}${dow === 5 ? " sat" : dow === 6 ? " sun" : ""}`, onclick: () => go("day", d) },
          h("span", { class: "num" }, String(+d.slice(8))),
          eventsOn(d).slice(0, 3).map((e) => h("div", { class: "chip" }, label(e))),
          tasksOn(d).slice(0, 2).map((t) => h("div", { class: `chip task${t.done ? " done" : ""}` }, t.text))
        )
      );
    }
  }
  return grid;
}

function weekView() {
  return h(
    "div",
    { class: "week" },
    weekDays(date).map((d) =>
      h(
        "div",
        { class: `wday${d === today() ? " today" : ""}`, onclick: () => go("day", d) },
        h("h3", {}, `${DOW[dowOf(d)]} ${+d.slice(8)}`),
        eventsOn(d).map((e) => h("div", { class: "chip" }, label(e))),
        tasksOn(d).map((t) => h("div", { class: `chip task${t.done ? " done" : ""}` }, t.text)),
        state.habits.length
          ? h("div", { class: "habitdots" }, `Habits ${state.habits.filter((x) => x.checkins.includes(d)).length}/${state.habits.length}`)
          : null
      )
    )
  );
}

function checkRow(checked, text, onToggle, onDelete) {
  return h(
    "li",
    { class: checked ? "done" : "" },
    h("input", { type: "checkbox", checked, onchange: onToggle }),
    h("span", {}, text),
    h("button", { "aria-label": "Delete", onclick: onDelete }, "✕")
  );
}

function dayView() {
  const START = 6, END = 23, PX = 48;
  const evs = eventsOn(date);
  const timeline = h("div", { class: "timeline" });
  for (let hr = START; hr <= END; hr++) timeline.append(h("div", { class: "hour" }, h("span", {}, `${String(hr).padStart(2, "0")}:00`)));
  for (const e of evs.filter((x) => x.start)) {
    const s = Math.max(timeToMin(e.start) - START * 60, 0);
    const len = e.end && timeToMin(e.end) > timeToMin(e.start) ? timeToMin(e.end) - timeToMin(e.start) : 45;
    const top = (s / 60) * PX;
    timeline.append(
      h("div", { class: "ev", style: `top:${top}px;height:${Math.max((len / 60) * PX, 20)}px` }, h("span", {}, `${e.start}${e.end ? "–" + e.end : ""} ${e.title}`),
        h("button", { "aria-label": "Delete event", onclick: () => ((state.events = state.events.filter((x) => x.id !== e.id)), commit()) }, "✕"))
    );
  }
  timeline.style.height = `${(END - START + 1) * PX}px`;

  const evForm = h(
    "form",
    {
      onsubmit: (ev) => {
        ev.preventDefault();
        const f = ev.target;
        const title = f.title.value.trim();
        if (!title) return;
        state.events.push({ id: uid(), title, date, start: f.start.value, end: f.end.value });
        commit();
      },
    },
    h("input", { name: "title", placeholder: "Add event", autocomplete: "off" }),
    h("input", { name: "start", type: "time", "aria-label": "Start" }),
    h("input", { name: "end", type: "time", "aria-label": "End" }),
    h("button", {}, "Add")
  );

  const taskForm = h(
    "form",
    {
      onsubmit: (ev) => {
        ev.preventDefault();
        const text = ev.target.text.value.trim();
        if (!text) return;
        state.tasks.push({ id: uid(), text, date, done: false });
        commit();
      },
    },
    h("input", { name: "text", placeholder: "Add task", autocomplete: "off" }),
    h("button", {}, "Add")
  );

  const note = h("textarea", {
    placeholder: "Journal — how was your day?",
    oninput: (e) => {
      if (e.target.value) state.journal[date] = e.target.value;
      else delete state.journal[date];
      save(state);
    },
  });
  note.value = state.journal[date] || "";

  const allDay = evs.filter((e) => !e.start);
  return h(
    "div",
    { class: "day" },
    h(
      "section",
      { class: "panel" },
      h("h2", {}, "Schedule"),
      allDay.length ? h("div", { class: "allday" }, allDay.map((e) => h("span", { class: "chip" }, e.title))) : null,
      timeline,
      h("div", { style: "margin-top:1rem" }, evForm)
    ),
    h(
      "div",
      {},
      h("section", { class: "panel" }, h("h2", {}, "To do"),
        h("ul", {}, tasksOn(date).map((t) => checkRow(t.done, t.text, (e) => ((t.done = e.target.checked), commit()), () => ((state.tasks = state.tasks.filter((x) => x.id !== t.id)), commit())))),
        taskForm),
      h("section", { class: "panel" }, h("h2", {}, "Habits"),
        state.habits.length
          ? h("ul", {}, state.habits.map((hb) => checkRow(hb.checkins.includes(date), `${hb.name} — 🔥 ${currentStreak(hb.checkins, date)}`, () => ((hb.checkins = toggleCheckin(hb.checkins, date)), commit()), () => ((state.habits = state.habits.filter((x) => x.id !== hb.id)), commit()))))
          : h("p", { style: "color:var(--muted)" }, "Add habits in the Habits tab.")),
      h("section", { class: "panel" }, h("h2", {}, "Journal"), note)
    )
  );
}

function habitsView() {
  const n = daysInMonth(date);
  const first = monthStart(date);
  const days = Array.from({ length: n }, (_, i) => shiftDate(first, i));
  const table = h(
    "table",
    {},
    h("thead", {}, h("tr", {}, h("th", { class: "name" }, "Habit"), days.map((d) => h("th", { class: d === today() ? "today" : "" }, String(+d.slice(8)))), h("th", {}, "Done"), h("th", {}, "Streak"), h("th", {}))),
    h(
      "tbody",
      {},
      state.habits.map((hb) =>
        h(
          "tr",
          {},
          h("td", { class: "name" }, hb.name),
          days.map((d) => {
            const on = hb.checkins.includes(d);
            return h("td", { class: `cellbtn${on ? " on" : ""}`, onclick: () => ((hb.checkins = toggleCheckin(hb.checkins, d)), commit()) }, on ? "✓" : "");
          }),
          h("td", { class: "stat" }, `${days.filter((d) => hb.checkins.includes(d)).length}/${n}`),
          h("td", { class: "stat" }, `🔥${currentStreak(hb.checkins, today())} (${longestStreak(hb.checkins)})`),
          h("td", {}, h("button", { class: "del", "aria-label": "Delete habit", onclick: () => ((state.habits = state.habits.filter((x) => x.id !== hb.id)), commit()) }, "✕"))
        )
      )
    )
  );
  const form = h(
    "form",
    {
      onsubmit: (e) => {
        e.preventDefault();
        const name = e.target.name.value.trim();
        if (!name) return;
        state.habits.push({ id: uid(), name, checkins: [] });
        commit();
      },
    },
    h("input", { name: "name", placeholder: "New habit", autocomplete: "off" }),
    h("button", {}, "Add")
  );
  return h("div", { class: "tracker" }, table, form);
}

function render() {
  for (const b of $("tabs").children) b.classList.toggle("on", b.dataset.view === view);
  $("title").textContent = view === "day" ? `${date} ${DOW[dowOf(date)]}` : view === "week" ? `${weekDays(date)[0]} →` : ym(date);
  const active = document.activeElement;
  const keepFocus = active && active.tagName === "TEXTAREA";
  if (keepFocus && view === "day") return; // avoid clobbering the journal while typing
  $("view").replaceChildren({ month: monthView, week: weekView, day: dayView, habits: habitsView }[view]());
}

$("tabs").onclick = (e) => e.target.dataset.view && go(e.target.dataset.view);
const step = (dir) => {
  date = view === "day" ? shiftDate(date, dir) : view === "week" ? shiftDate(date, 7 * dir) : shiftMonth(date, dir);
  render();
};
$("prev").onclick = () => step(-1);
$("next").onclick = () => step(1);
$("todayBtn").onclick = () => ((date = today()), render());

const download = (text, type, name) => {
  const a = h("a", { href: URL.createObjectURL(new Blob([text], { type })), download: name });
  a.click();
  URL.revokeObjectURL(a.href);
};
$("export").onclick = () => download(exportJson(state), "application/json", `timmy-os-${today()}.json`);
$("exportIcs").onclick = () => download(toIcs(state), "text/calendar", `timmy-os-${today()}.ics`);
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
