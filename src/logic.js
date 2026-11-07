// Pure helpers (no DOM) so they can be unit tested.

export function today(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function shiftDate(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  return today(new Date(y, m - 1, d + days));
}

// Current streak: consecutive checked days ending today (or yesterday if today is not yet done).
export function currentStreak(checkins, asOf = today()) {
  const set = new Set(checkins);
  let day = set.has(asOf) ? asOf : shiftDate(asOf, -1);
  let n = 0;
  while (set.has(day)) {
    n++;
    day = shiftDate(day, -1);
  }
  return n;
}

export function longestStreak(checkins) {
  const days = [...new Set(checkins)].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of days) {
    run = prev && shiftDate(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export function toggleCheckin(checkins, date) {
  return checkins.includes(date) ? checkins.filter((d) => d !== date) : [...checkins, date];
}

export function emptyState() {
  return { journal: {}, tasks: [], habits: [], events: [] };
}

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

// Coerce untrusted data (localStorage or imported file) into a safe state shape.
export function normalizeState(data) {
  const s = emptyState();
  if (!isObj(data)) return s;
  if (isObj(data.journal)) {
    for (const [k, v] of Object.entries(data.journal)) if (typeof v === "string" && v) s.journal[k] = v;
  }
  if (Array.isArray(data.tasks)) {
    s.tasks = data.tasks
      .filter((t) => isObj(t) && typeof t.text === "string" && typeof t.date === "string")
      .map((t) => ({ id: String(t.id ?? uid()), text: t.text, date: t.date, done: t.done === true }));
  }
  if (Array.isArray(data.habits)) {
    s.habits = data.habits
      .filter((h) => isObj(h) && typeof h.name === "string")
      .map((h) => ({
        id: String(h.id ?? uid()),
        name: h.name,
        checkins: Array.isArray(h.checkins) ? h.checkins.filter((d) => typeof d === "string") : [],
      }));
  }
  if (Array.isArray(data.events)) {
    s.events = data.events
      .filter((e) => isObj(e) && typeof e.title === "string" && typeof e.date === "string")
      .map((e) => ({
        id: String(e.id ?? uid()),
        title: e.title,
        date: e.date,
        start: validTime(e.start) ? e.start : "",
        end: validTime(e.end) ? e.end : "",
      }));
  }
  return s;
}

const validTime = (t) => typeof t === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

export function timeToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Monday-first, like a Jibun Techo weekly spread.
export function weekStart(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dow = (new Date(y, m - 1, d).getDay() + 6) % 7;
  return shiftDate(iso, -dow);
}

export function weekDays(iso) {
  const s = weekStart(iso);
  return Array.from({ length: 7 }, (_, i) => shiftDate(s, i));
}

export function monthStart(iso) {
  return iso.slice(0, 8) + "01";
}

export function shiftMonth(iso, n) {
  const [y, m] = iso.split("-").map(Number);
  return today(new Date(y, m - 1 + n, 1));
}

export function daysInMonth(iso) {
  const [y, m] = iso.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

// Weeks (arrays of 7 ISO dates) covering the month of `iso`.
export function monthGrid(iso) {
  const first = monthStart(iso);
  const last = shiftDate(first, daysInMonth(iso) - 1);
  const weeks = [];
  for (let d = weekStart(first); d <= last; d = shiftDate(d, 7)) weeks.push(weekDays(d));
  return weeks;
}

export function sortEvents(events) {
  return [...events].sort((a, b) => (a.start || "").localeCompare(b.start || "") || a.title.localeCompare(b.title));
}

const icsEsc = (t) => t.replace(/\\/g, "\\\\").replace(/[;,]/g, "\\$&").replace(/\r?\n/g, "\\n");
const compact = (iso) => iso.replaceAll("-", "");

// iCalendar export so events and tasks can be imported into Google Calendar.
export function toIcs(state, stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z") {
  const out = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Timmy OS//EN"];
  for (const e of state.events) {
    out.push("BEGIN:VEVENT", `UID:${e.id}@timmy-os`, `DTSTAMP:${stamp}`, `SUMMARY:${icsEsc(e.title)}`);
    if (e.start) {
      out.push(`DTSTART:${compact(e.date)}T${e.start.replace(":", "")}00`);
      if (e.end) out.push(`DTEND:${compact(e.date)}T${e.end.replace(":", "")}00`);
    } else {
      out.push(`DTSTART;VALUE=DATE:${compact(e.date)}`, `DTEND;VALUE=DATE:${compact(shiftDate(e.date, 1))}`);
    }
    out.push("END:VEVENT");
  }
  for (const t of state.tasks) {
    out.push(
      "BEGIN:VEVENT",
      `UID:${t.id}@timmy-os`,
      `DTSTAMP:${stamp}`,
      `SUMMARY:${icsEsc((t.done ? "☑ " : "☐ ") + t.text)}`,
      `DTSTART;VALUE=DATE:${compact(t.date)}`,
      `DTEND;VALUE=DATE:${compact(shiftDate(t.date, 1))}`,
      "END:VEVENT"
    );
  }
  out.push("END:VCALENDAR");
  return out.join("\r\n") + "\r\n";
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
