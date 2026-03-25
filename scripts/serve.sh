#!/bin/bash
# Serves the production build on port 4000.
# Called by the macOS LaunchAgent on login.
# To rebuild after code changes: npm run build (from the project root)

exec /opt/homebrew/bin/node \
  /Users/jeff/Development/time-tracker/node_modules/serve/build/main.js \
  -s dist \
  -l 4000
