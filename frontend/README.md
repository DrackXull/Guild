# Guild Nexus Frontend

The `/frontend` directory now ships the live "Officer Console" UI for Guild Nexus. It is a lightweight, dependency-free SPA that consumes the JSON API exposed by `src/server.js` and renders a modern cockpit for roster management, run verification, Grim Favor awards, and audit logs.

## Features

- 🎨 Modern neon-on-dark layout inspired by tactical dashboards, with a Members Hall and Officer Lounge toggle.
- 🔁 Real-time refresh of settings, players, characters, runs, reports, bounties, and the admin log.
- 🔍 Member-facing run/report search filtered by date, teammate, character, or the new short `RUN-0001` / `REP-0001` IDs.
- 📝 Inline forms for creating players, characters, runs, reports, bounties, GF awards, drastic score settings, and for updating ranks/roles.
- 📸 Built-in screenshot uploader that stores scoreboard proof on the server plus helper text for external hosts (Imgur, Discord attachments, ImgBB) if players prefer to paste links.
- 📊 Responsive metric tiles plus rich cards/tables for every dataset.
- ⚙️ Configurable API base URL so the UI can point at any running Guild Nexus backend.

## Running locally

1. Start the API server (this also serves the static frontend):

   ```bash
   npm install # no dependencies yet, keeps scripts usable
   npm start
   ```

2. Visit `http://localhost:3000/` in a browser. The UI will automatically hit `http://localhost:3000/api` unless you change the API base input.

3. Use the Members/Officers toggle in the sidebar to jump between the search hub and the admin tooling. All sections are scroll-linked via the quick navigation buttons.

4. Upload screenshots directly from the Run Report form or paste hosted URLs. Files are persisted to `data/uploads` so they stay available to every officer.

This frontend is intentionally framework-free so it can run anywhere static files are allowed (local filesystem, CDN, or the built-in Node server).
