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

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. Changes hot-reload instantly.

### Build for production

```bash
npm run build
```

Output goes to `dist/`. You can deploy that folder to any static host (Netlify, Vercel, GitHub Pages, etc.).

### Serve the production build locally

```bash
npm start
```

Serves `dist/` on [http://localhost:4000](http://localhost:4000) using [`serve`](https://github.com/vercel/serve). Run `npm run build` first.

---

## Run on macOS Startup with Laravel Valet

If you want the app available at `http://time-tracker.test` in any browser on your machine — automatically on login, no terminal needed — follow these steps.

### Prerequisites

- [Laravel Valet](https://laravel.com/docs/valet) installed and running
- Node.js installed via Homebrew (the setup below assumes `/opt/homebrew/bin/node`)

> If your Node is somewhere else (e.g. nvm, `/usr/local/bin/node`), update the path in `scripts/serve.sh` and the plist accordingly. Run `which node` to find yours.

---

### 1. Build the production app

```bash
npm run build
```

This creates the `dist/` folder that the server will serve. **Re-run this any time you make code changes.**

---

### 2. Create the launcher script

The LaunchAgent needs an executable script to call. `scripts/serve.sh` is already included in this repo:

```bash
#!/bin/bash
# scripts/serve.sh
exec /opt/homebrew/bin/node \
  /path/to/time-tracker/node_modules/serve/build/main.js \
  -s dist \
  -l 4000
```

Update the absolute path to match where you cloned the repo, then make it executable:

```bash
chmod +x scripts/serve.sh
```

---

### 3. Create the LaunchAgent plist

Create the file `~/Library/LaunchAgents/com.timetracker.server.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.timetracker.server</string>

  <key>ProgramArguments</key>
  <array>
    <string>/path/to/time-tracker/scripts/serve.sh</string>
  </array>

  <key>WorkingDirectory</key>
  <string>/path/to/time-tracker</string>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <true/>

  <key>StandardOutPath</key>
  <string>/Users/YOUR_USERNAME/Library/Logs/timetracker.log</string>

  <key>StandardErrorPath</key>
  <string>/Users/YOUR_USERNAME/Library/Logs/timetracker.error.log</string>
</dict>
</plist>
```

Replace `/path/to/time-tracker` with the absolute path to where you cloned this repo, and `YOUR_USERNAME` with your macOS username.

---

### 4. Load the LaunchAgent

```bash
launchctl load ~/Library/LaunchAgents/com.timetracker.server.plist
```

Verify it's running:

```bash
curl -I http://127.0.0.1:4000
# Should return: HTTP/1.1 200 OK
```

The service will now start automatically every time you log in. It will also restart itself if it ever crashes.

---

### 5. Set up the Valet proxy

```bash
valet proxy time-tracker http://127.0.0.1:4000
```

That's it. Open [http://time-tracker.test](http://time-tracker.test) in any browser on your machine.

---

### Useful commands

```bash
# Rebuild after code changes (no server restart needed)
npm run build

# Restart the server manually
launchctl unload ~/Library/LaunchAgents/com.timetracker.server.plist
launchctl load  ~/Library/LaunchAgents/com.timetracker.server.plist

# View logs
tail -f ~/Library/Logs/timetracker.log
tail -f ~/Library/Logs/timetracker.error.log

# Stop the server permanently (survives reboots)
launchctl unload ~/Library/LaunchAgents/com.timetracker.server.plist

# Remove the Valet proxy
valet unproxy time-tracker
```

---

## Data & Privacy

Everything is stored in your browser's `localStorage`. Nothing is sent to a server. Clearing your browser's site data will erase your entries, so export to CSV regularly if you need a backup.

---

## Project Structure

```
scripts/
└── serve.sh              # Launcher script used by the macOS LaunchAgent
src/
├── components/
│   ├── HomePage.tsx       # Project list / landing page
│   ├── ProjectPage.tsx    # Single project view (tracker + summary)
│   ├── TimeEntryForm.tsx  # Manual entry form + timer
│   ├── TimeEntryList.tsx  # Entry list with edit/delete
│   ├── EntryToolbar.tsx   # Sort + date filter controls
│   ├── SummaryView.tsx    # Grouped summary (by task or date)
│   └── TaskSelector.tsx   # Task dropdown with custom task support
├── hooks/
│   └── useAppData.ts      # All app state + localStorage persistence
├── types/
│   └── index.ts           # TypeScript interfaces + preset task list
└── utils/
    ├── csv.ts             # CSV export
    ├── storage.ts         # localStorage read/write
    └── time.ts            # Duration parsing and formatting
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
| Local server | [serve](https://github.com/vercel/serve) |
| No dependencies | No UI library, no router, no state manager |
