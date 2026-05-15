# Time Tracker

A clean, minimal time tracking app for freelancers and solo practitioners. Track hours across multiple projects, log entries manually or with a live timer, filter and sort your history, and create invoices in Wave accounting.

Built with React, TypeScript, and Vite. All data is stored locally in the browser via localStorage. The Express backend handles Wave OAuth and API proxying only — no database, no accounts.

---

## Features

- **Project-based tracking** — Create as many projects as you need; each gets its own timeline of entries
- **Manual entry or live timer** — Type in a duration (`1h 30m`, `1.5`, `90m`, `1:30`) or run the stopwatch and let it fill in automatically
- **Preset + custom tasks** — Choose from common design/dev task types or save your own
- **Reference field** — Tag entries with Jira tickets, PO numbers, or any reference for grouping
- **Sort & filter** — Sort entries by entry date or creation time (ascending/descending); filter by Today, This Week, This Month, custom date range, or billed/unbilled status
- **Summary view** — See totals grouped by task type, by date, or by reference, with expandable breakdowns per group
- **Invoice builder** — Select unbilled entries, group them into line items (by task, reference, or single item), preview totals, and create an invoice directly in Wave
- **Billing status** — Each entry tracks billed/unbilled status with a visual badge; filter to see what's been invoiced
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

## Wave Invoice Integration

The app can create invoices directly in [Wave accounting](https://www.waveapps.com/) from your tracked time entries.

### How it works

1. **Connect** — Open Settings, click "Connect to Wave", authorize via OAuth
2. **Configure** — Select your Wave business, default customer, product/service, and hourly rate
3. **Track time** — Log entries as usual; optionally add a Reference (Jira ticket, PO#) for grouping
4. **Invoice** — Go to a project's Invoice tab, select unbilled entries, group them into line items, and send to Wave

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

## Run on macOS Startup (Valet or Herd)

If you want the app available at `http://time-tracker.test` in any browser on your machine — automatically on login, no terminal needed — follow these steps.

Steps 1–4 are the same regardless of whether you use Laravel Valet or Laravel Herd. Step 5 differs.

---

### 1. Build the production app

```bash
npm run build
```

This creates the `dist/` folder that the server will serve. **Re-run this any time you make code changes.**

---

### 2. Configure the launcher script

The launcher script `scripts/serve.sh` is already included. Verify the Node path matches your system:

```bash
#!/bin/bash
exec /opt/homebrew/bin/node \
  --import tsx \
  /path/to/time-tracker/server/index.ts
```

Run `which node` to find your Node path. Common locations:
- Homebrew: `/opt/homebrew/bin/node`
- nvm: `/Users/YOUR_USERNAME/.nvm/versions/node/vX.Y.Z/bin/node`

Update the path in `scripts/serve.sh` if needed, then make it executable:

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

### 5a. Set up the proxy — Laravel Valet

```bash
valet proxy time-tracker http://127.0.0.1:4000
```

Open [http://time-tracker.test](http://time-tracker.test) in any browser.

---

### 5b. Set up the proxy — Laravel Herd

Herd's CLI requires PHP and may not work if PHP isn't configured. The reliable alternative is to create the Nginx config directly.

Create the file `~/Library/Application Support/Herd/config/valet/Nginx/time-tracker.test`:

```nginx
server {
    listen 127.0.0.1:80;
    server_name time-tracker.test www.time-tracker.test *.time-tracker.test;
    root /;
    charset utf-8;
    client_max_body_size 1024M;

    access_log off;
    error_log "/Users/YOUR_USERNAME/Library/Application Support/Herd/Log/time-tracker.test-error.log";

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_http_version 1.1;
        proxy_read_timeout 1800;
        proxy_connect_timeout 1800;
        proxy_redirect off;
        proxy_buffering off;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

Replace `YOUR_USERNAME` with your macOS username.

Then restart Nginx: click the **Herd icon in the menu bar → Restart Nginx** (or quit and reopen Herd).

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

# Remove the Herd proxy
rm ~/Library/Application\ Support/Herd/config/valet/Nginx/time-tracker.test
# Then restart Nginx from the Herd menu bar
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
└── serve.sh              # Launcher script for macOS LaunchAgent
src/
├── components/
│   ├── HomePage.tsx       # Project list / landing page
│   ├── ProjectPage.tsx    # Single project view (tracker + summary + invoice)
│   ├── TimeEntryForm.tsx  # Manual entry form + timer
│   ├── TimeEntryList.tsx  # Entry list with edit/delete and billed badges
│   ├── EntryToolbar.tsx   # Sort, date filter, and billing filter
│   ├── SummaryView.tsx    # Grouped summary (by task, date, or reference)
│   ├── InvoiceBuilder.tsx # Three-step invoice creation flow
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
