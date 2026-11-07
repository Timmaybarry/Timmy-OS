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
