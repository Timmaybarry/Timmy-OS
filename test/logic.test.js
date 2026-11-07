import test from "node:test";
import assert from "node:assert/strict";
import { currentStreak, longestStreak, shiftDate, toggleCheckin } from "../src/logic.js";

test("shiftDate crosses month and year boundaries", () => {
  assert.equal(shiftDate("2026-03-01", -1), "2026-02-28");
  assert.equal(shiftDate("2026-12-31", 1), "2027-01-01");
});

test("currentStreak counts consecutive days ending today", () => {
  assert.equal(currentStreak(["2026-11-05", "2026-11-06", "2026-11-07"], "2026-11-07"), 3);
});

test("currentStreak survives an unchecked today", () => {
  assert.equal(currentStreak(["2026-11-05", "2026-11-06"], "2026-11-07"), 2);
});

test("currentStreak resets after a missed day", () => {
  assert.equal(currentStreak(["2026-11-04", "2026-11-05"], "2026-11-07"), 0);
});

test("longestStreak finds best run", () => {
  assert.equal(longestStreak(["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-10", "2026-11-11"]), 3);
  assert.equal(longestStreak([]), 0);
});

test("toggleCheckin adds and removes", () => {
  assert.deepEqual(toggleCheckin([], "2026-11-07"), ["2026-11-07"]);
  assert.deepEqual(toggleCheckin(["2026-11-07"], "2026-11-07"), []);
});

import { normalizeState } from "../src/logic.js";

test("normalizeState rejects malformed data", () => {
  assert.deepEqual(normalizeState(null), { journal: {}, tasks: [], habits: [], events: [] });
  assert.deepEqual(normalizeState({ journal: null, tasks: {}, habits: "x" }), { journal: {}, tasks: [], habits: [], events: [] });
});

test("normalizeState keeps valid entries and drops bad ones", () => {
  const s = normalizeState({
    journal: { "2026-11-07": "hi", "2026-11-08": "", x: 5 },
    tasks: [{ id: "a", text: "t", date: "2026-11-07", done: true }, { text: 1 }, null],
    habits: [{ id: "h", name: "run", checkins: ["2026-11-07", 3] }],
  });
  assert.deepEqual(s.journal, { "2026-11-07": "hi" });
  assert.equal(s.tasks.length, 1);
  assert.deepEqual(s.habits[0].checkins, ["2026-11-07"]);
});

import { monthGrid, weekStart, toIcs } from "../src/logic.js";

test("weekStart is Monday and monthGrid covers whole month", () => {
  assert.equal(weekStart("2026-11-08"), "2026-11-02");
  const g = monthGrid("2026-11-15");
  assert.equal(g[0][0], "2026-10-26");
  assert.equal(g.at(-1)[6], "2026-12-06");
  assert.ok(g.every((w) => w.length === 7));
});

test("toIcs escapes text and emits timed and all-day events", () => {
  const ics = toIcs({ events: [{ id: "a", title: "Hi, you", date: "2026-11-07", start: "09:00", end: "10:00" }], tasks: [{ id: "t", text: "x", date: "2026-11-07", done: false }] }, "S");
  assert.match(ics, /SUMMARY:Hi\\, you/);
  assert.match(ics, /DTSTART:20261107T090000/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261107/);
});
