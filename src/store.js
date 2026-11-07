import { emptyState, normalizeState } from "./logic.js";

const KEY = "timmy-os:v1";

export function load() {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(KEY) || "{}"));
  } catch {
    return emptyState();
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Could not save", err);
  }
}

export function exportJson(state) {
  return JSON.stringify(state, null, 2);
}

export function importJson(text) {
  return normalizeState(JSON.parse(text));
}
