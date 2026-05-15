#!/bin/bash
# Serves the production build on port 4000.
# Called by the macOS LaunchAgent on login.
# To rebuild after code changes: npm run build (from the project root)

exec /Users/jeff/.nvm/versions/node/v24.15.0/bin/node \
  --import tsx \
  /Users/jeff/Development/time-tracker/server/index.ts
