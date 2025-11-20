# Guild Nexus Frontend

The `/frontend` directory now ships the live "Officer Console" UI for Guild Nexus. It is a lightweight, dependency-free SPA that consumes the JSON API exposed by `src/server.js` and renders a modern cockpit for roster management, run verification, Grim Favor awards, and audit logs.

## Features

- 🎨 Modern neon-on-dark layout inspired by tactical dashboards.
- 🔁 Real-time refresh of settings, players, characters, runs, reports, bounties, and the admin log.
- 📝 Inline forms for creating players, characters, runs, reports, bounties, GF awards, and drastic score settings.
- 📊 Responsive metric tiles plus rich cards/tables for every dataset.
- ⚙️ Configurable API base URL so the UI can point at any running Guild Nexus backend.

## Running locally

1. Start the API server (this also serves the static frontend):

   ```bash
   npm install # no dependencies yet, keeps scripts usable
   npm start
   ```

2. Visit `http://localhost:3000/` in a browser. The UI will automatically hit `http://localhost:3000/api` unless you change the API base input.

3. Use the sidebar forms to populate sample data. The UI re-renders instantly after each successful mutation.

This frontend is intentionally framework-free so it can run anywhere static files are allowed (local filesystem, CDN, or the built-in Node server).
