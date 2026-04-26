# Time Tracker

A clean, minimal time tracking app for freelancers and solo practitioners. Track hours across multiple projects, log entries manually or with a live timer, filter and sort your history, and create invoices — with optional Wave accounting sync.

Built with React, TypeScript, and Vite. All data is stored locally in the browser via localStorage. The Express backend handles Wave OAuth and API proxying only — no database, no accounts.

---

## Features

- **Project-based tracking** — Create as many projects as you need; each gets its own timeline of entries
- **Manual entry or live timer** — Type in a duration (`1h 30m`, `1.5`, `90m`, `1:30`) or run the stopwatch and let it fill in automatically
- **Preset + custom tasks** — Choose from common design/dev task types or save your own
- **Reference field** — Tag entries with Jira tickets, PO numbers, or any reference for grouping and invoicing
- **Sort & filter** — Sort entries by entry date or creation time (ascending/descending); filter by Today, This Week, This Month, custom date range, or billed/unbilled status
- **Summary view** — See totals grouped by task type, by date, or by reference, with expandable breakdowns per group
- **Invoice management** — Select entries via checkboxes on the Tracker tab and add them to a new or existing draft invoice; invoices track line items, total hours, and status
- **Optional Wave sync** — Invoices can be manually marked as sent or synced to Wave accounting, which pushes line items and marks entries as billed
- **Billing status** — Each entry tracks billed/unbilled status with a visual badge; entries are automatically marked billed when added to an invoice
- **Export CSV** — Downloads a spreadsheet of the current project's entries respecting any active filter/sort, including reference and billed status
- **Yellow highlight** — Newly added entries briefly highlight so you can spot them instantly
- **Inline editing** — Edit or delete any entry directly in the list; rename projects by clicking the title
- **Per-project hourly rates** — Set a default rate globally or override it per project

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

> The Vite dev server proxies `/api/*` requests to the Express backend on port 4000. If you need the Wave integration during development, start the backend separately: `npm start` in another terminal.

### Build for production

```bash
npm run build
```

Output goes to `dist/`.

### Serve the production build locally

```bash
npm start
```

Starts the Express server on [http://localhost:4000](http://localhost:4000), serving the production build from `dist/` and handling Wave API routes. Run `npm run build` first.

---

## Figma Design System

The app has a paired Figma file that mirrors the component and token structure in code. The integration uses **Figma Code Connect** for component mapping and a local **token sync script** for design tokens.

Figma file: [Time Tracker v2](https://www.figma.com/design/l3WUHgIFDSntp3Tr0ugXAc/Time-Tracker)

### Components

The following React components have Figma counterparts and Code Connect files (`.figma.tsx`):

| Component | File | Figma node |
|---|---|---|
| `Button` | `src/components/Button.tsx` | `btn-primary_small`, `btn-icon-text` |
| `ProjectCard` | `src/components/ProjectCard.tsx` | `project-card` |
| `TimeEntryForm` | `src/components/TimeEntryForm.tsx` | `time-entry-form_collapsed` |
| `EntryToolbar` | `src/components/EntryToolbar.tsx` | `entry-toolbar` |

#### Publishing Code Connect

Code Connect publishing requires a Figma **Organization plan**. The `.figma.tsx` files and `figma.config.json` are fully configured and ready — run the following when on an eligible plan:

```bash
npm run figma:publish        # publish to Figma Dev Mode
npm run figma:publish:dry    # dry-run (validate without publishing)
```

To authenticate, add your Figma personal access token (with `file_content:read` and `file_dev_resources:write` scopes) to `~/.bash_profile`:

```bash
export FIGMA_ACCESS_TOKEN=your_token_here
```

### Design Tokens

CSS custom properties in `src/index.css` are the source of truth for all design tokens. A mirrored **"Time Tracker Tokens"** variable collection exists in Figma.

The token values are also snapshotted in `tokens.json` at the project root, which acts as the handshake between Figma and code. Commit this file — it lets you see token drift in git diffs.

#### Token sync commands

```bash
npm run figma:tokens          # diff tokens.json vs src/index.css
npm run figma:tokens:apply    # apply tokens.json values → src/index.css
npm run figma:tokens:export   # export current CSS tokens → tokens.json
```

#### Workflow

**Figma → code:** When a token value changes in Figma, update `tokens.json` manually (or ask Claude to pull the new value via the Figma MCP), then run `npm run figma:tokens:apply`.

**Code → Figma:** Edit `src/index.css` directly, run `npm run figma:tokens:export` to re-sync `tokens.json`, then update the matching variable in Figma.

> Note: Figma's Variables REST API requires an Organization plan. The sync script uses `tokens.json` as an intermediary rather than calling the API directly.

---

## Wave Invoice Integration

The app can create invoices directly in [Wave accounting](https://www.waveapps.com/) from your tracked time entries.

### How invoicing works

Invoicing doesn't require Wave — you can create and manage invoices locally and mark them as sent manually.

1. **Track time** — Log entries as usual; optionally add a Reference (Jira ticket, PO#) for grouping
2. **Select entries** — On the Tracker tab, check the entries you want to invoice (the select-all control respects any active filter)
3. **Add to invoice** — Click "Add to Invoice" and choose to create a new invoice or add to an existing draft
4. **Review** — On the Invoice tab, expand any invoice to see its line items and entries; edit the invoice date by clicking it
5. **Mark as sent** — Click "Mark as Sent" to record it as invoiced without touching Wave, or sync to Wave if connected

### Connecting to Wave (optional)

1. **Connect** — Open Settings, click "Connect to Wave", authorize via OAuth
2. **Configure** — Select your Wave business, default customer, product/service, and hourly rate
3. **Sync** — On any draft or sent invoice, click "Sync to Wave" to push it as a Wave invoice and get a direct link

### Setting up the Wave Developer App

1. Go to [developer.waveapps.com](https://developer.waveapps.com) and sign in (or create an account)
2. Click **Create an application**
3. Set the **Redirect URI** to `http://time-tracker.test/api/wave/callback` (or your local URL)
4. Note your **Client ID** and **Client Secret**
5. Create the file `server/.env` (this file is gitignored):

```
WAVE_CLIENT_ID=your_client_id_here
WAVE_CLIENT_SECRET=your_client_secret_here
WAVE_REDIRECT_URI=http://time-tracker.test/api/wave/callback
```

6. Restart the server (`npm start` or reload the LaunchAgent)
7. Open the app, click Settings, and click "Connect to Wave"

### Required OAuth Scopes

The app requests these scopes during authorization:
- `account:read` — Read your Wave account info
- `business:read` — List businesses, customers, and products
- `invoice:write` — Create invoices
- `customer:read` — List customers for invoice recipient
- `product:read` — List products/services for line items

### Token Storage

OAuth tokens are stored at `~/.time-tracker/wave-tokens.json` (server-side only). Access tokens expire after 2 hours and are automatically refreshed using the refresh token.

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

### 2. Configure the launcher script

The launcher script `scripts/serve.sh` is already included. Verify the paths match your system:

```bash
#!/bin/bash
exec /opt/homebrew/bin/node \
  --import tsx \
  /path/to/time-tracker/server/index.ts
```

Make it executable:

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
curl -s http://127.0.0.1:4000/api/wave/status
# Should return: {"connected":false}
```

---

### 5. Set up the Valet proxy

```bash
valet proxy time-tracker http://127.0.0.1:4000
```

Open [http://time-tracker.test](http://time-tracker.test) in any browser.

---

### Useful commands

```bash
# Rebuild after code changes (no server restart needed for frontend)
npm run build

# Restart the server (needed after backend changes)
launchctl unload ~/Library/LaunchAgents/com.timetracker.server.plist
launchctl load  ~/Library/LaunchAgents/com.timetracker.server.plist

# View logs
tail -f ~/Library/Logs/timetracker.log
tail -f ~/Library/Logs/timetracker.error.log

# Stop the server permanently
launchctl unload ~/Library/LaunchAgents/com.timetracker.server.plist

# Remove the Valet proxy
valet unproxy time-tracker
```

---

## Data & Privacy

- **Time entries, projects, and settings** are stored in your browser's `localStorage`. Clearing site data erases everything — export to CSV regularly.
- **Wave OAuth tokens** are stored server-side at `~/.time-tracker/wave-tokens.json`. They are never sent to the browser.
- **Wave API calls** are proxied through the local Express server. Your Wave client secret never leaves the server process.

---

## Project Structure

```
server/
├── index.ts              # Express server (static files + API routes)
├── wave-routes.ts        # OAuth and GraphQL proxy endpoints
├── wave-token.ts         # Token storage and auto-refresh
└── .env                  # Wave credentials (gitignored)
scripts/
├── serve.sh              # Launcher script for macOS LaunchAgent
└── sync-tokens.js        # Design token diff/sync between tokens.json and index.css
src/
├── components/
│   ├── Button.tsx         # Atomic button component (variants: primary, danger, ghost, icon-text)
│   ├── Button.figma.tsx   # Figma Code Connect mapping for Button
│   ├── ProjectCard.tsx    # Project summary card
│   ├── ProjectCard.figma.tsx # Figma Code Connect mapping for ProjectCard
│   ├── HomePage.tsx       # Project list / landing page
│   ├── ProjectPage.tsx    # Single project view (tracker + summary + invoice)
│   ├── TimeEntryForm.tsx  # Manual entry form + timer
│   ├── TimeEntryForm.figma.tsx # Figma Code Connect mapping for TimeEntryForm
│   ├── TimeEntryList.tsx  # Entry list with edit/delete and billed badges
│   ├── EntryToolbar.tsx   # Sort, date filter, and billing filter
│   ├── EntryToolbar.figma.tsx  # Figma Code Connect mapping for EntryToolbar
│   ├── InvoiceList.tsx    # Invoice list with expand, status badges, and actions
│   ├── WaveSetup.tsx      # Wave connection and configuration modal
│   └── TaskSelector.tsx   # Task dropdown with custom task support
├── hooks/
│   └── useAppData.ts      # All app state + localStorage persistence
├── types/
│   └── index.ts           # TypeScript interfaces + preset task list
└── utils/
    ├── csv.ts             # CSV export
    ├── storage.ts         # localStorage read/write + data migration
    ├── time.ts            # Duration parsing and formatting
    └── waveApi.ts         # Wave GraphQL client (frontend)
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
| Backend | Express (OAuth proxy + static server) |
| Invoicing | Wave GraphQL API |
| No heavy deps | No UI library, no router, no state manager |
