# Time Tracker

A clean, minimal time tracking app for freelancers and solo practitioners. Track hours across multiple projects, log entries manually or with a live timer, filter and sort your history, and export to CSV for invoicing.

Built with React, TypeScript, and Vite. All data is stored locally in the browser — no account, no server, no sync.

---

## Features

- **Project-based tracking** — Create as many projects as you need; each gets its own timeline of entries
- **Manual entry or live timer** — Type in a duration (`1h 30m`, `1.5`, `90m`, `1:30`) or run the stopwatch and let it fill in automatically
- **Preset + custom tasks** — Choose from common design/dev task types or save your own
- **Sort & filter** — Sort entries by entry date or creation time (ascending/descending); filter by Today, This Week, This Month, or a custom date range
- **Summary view** — See totals grouped by task type or by date, with expandable breakdowns per group
- **Export CSV** — Downloads a spreadsheet of the current project's entries respecting any active filter/sort
- **Yellow highlight** — Newly added entries briefly highlight so you can spot them instantly
- **Inline editing** — Edit or delete any entry directly in the list; rename projects by clicking the title

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (comes with Node)

### Clone & install

```bash
git clone https://github.com/jeffhunt00/time-tracker.git
cd time-tracker
npm install
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build
```

Output goes to `dist/`. You can deploy that folder to any static host (Netlify, Vercel, GitHub Pages, etc.).

### Preview the production build

```bash
npm run preview
```

---

## Data & Privacy

Everything is stored in your browser's `localStorage`. Nothing is sent to a server. Clearing your browser's site data will erase your entries, so export to CSV regularly if you need a backup.

---

## Project Structure

```
src/
├── components/
│   ├── HomePage.tsx        # Project list / landing page
│   ├── ProjectPage.tsx     # Single project view (tracker + summary)
│   ├── TimeEntryForm.tsx   # Manual entry form + timer
│   ├── TimeEntryList.tsx   # Entry list with edit/delete
│   ├── EntryToolbar.tsx    # Sort + date filter controls
│   ├── SummaryView.tsx     # Grouped summary (by task or date)
│   └── TaskSelector.tsx    # Task dropdown with custom task support
├── hooks/
│   └── useAppData.ts       # All app state + localStorage persistence
├── types/
│   └── index.ts            # TypeScript interfaces + preset task list
└── utils/
    ├── csv.ts              # CSV export
    ├── storage.ts          # localStorage read/write
    └── time.ts             # Duration parsing and formatting
```

---

## Tech Stack

| | |
|---|---|
| Framework | React 19 |
| Language | TypeScript |
| Build tool | Vite |
| Styling | Plain CSS (custom properties) |
| Storage | Browser localStorage |
| No dependencies | No UI library, no router, no state manager |
