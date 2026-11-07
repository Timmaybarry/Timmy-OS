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
  return { journal: {}, tasks: [], habits: [] };
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
