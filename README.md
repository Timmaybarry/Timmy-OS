# Timmy OS

A local-first web app that centralizes your **journal**, **planning**, and **habit tracking** in one daily view.

- No backend, no accounts: data lives in your browser (`localStorage`).
- Installable and offline-capable (PWA).
- Export/import JSON backups.

## Run

```sh
npm start   # serves on http://localhost:8080
npm test    # unit tests for streak/date logic
```

## Layout

- `src/logic.js` – pure date/streak helpers (tested)
- `src/store.js` – persistence and backup
- `src/app.js` – UI

## Roadmap

- Weekly/monthly review (habit stats, plan vs. done)
- Habit schedules (non-daily), tags and mood on journal entries
- Migrate storage to IndexedDB; search across entries
- Icons and encrypted backups

## Bootable OS

See [`os/`](os/README.md) for the bootable Timmy OS.
