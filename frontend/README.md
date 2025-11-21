# Guild Nexus Frontend

The `/frontend` directory now ships the live "Officer Console" UI for Guild Nexus. It is a lightweight, dependency-free SPA that consumes the JSON API exposed by `src/server.js` and renders a modern cockpit for roster management, run verification, Honor awards, and audit logs.

## Features

- 🎨 Torch-lit, leather-and-iron layout with a Members Hall / Officer Lounge / Recruits toggle plus in-app theme swatches for accent, glow, and panel/background colors.
- 🔁 Real-time refresh of settings, players, characters, runs, reports, bounties, presence, and the admin log.
- 🔍 Member-facing run/report search filtered by date, teammate, character, or the new short `RUN-0001` / `REP-0001` IDs plus a Recruit intake flow with a glowing pending badge.
- 📝 Inline forms for creating players, characters, runs, reports, bounties, HP ledger entries (with mandatory narratives), drastic score settings, membership changes (with required removal reasons), and presence pings.
- 🧭 Presence radar plus a sticky headbar dropdown showing who is online/in-game (with freshness timers) and a Messages dropdown that surfaces run tags, LFG updates, and report mentions for the active actor.
- 📯 Looking For Group board for members to post runs, send one-click join requests, and let hosts/officers approve or decline with audit history.
- 📸 Built-in screenshot uploader that stores scoreboard proof on the server plus helper text for external hosts (Imgur, Discord attachments, ImgBB) if players prefer to paste links.
- 📊 Responsive metric tiles plus rich cards/tables for every dataset, including Max HP-driven rank badges on roster cards.
- ⚙️ Configurable API base URL so the UI can point at any running Guild Nexus backend.

## Running locally

1. Start the API server (this also serves the static frontend):

   ```bash
   npm install # no dependencies yet, keeps scripts usable
   npm start
   ```

2. Visit `http://localhost:3000/` in a browser. The UI will automatically hit `http://localhost:3000/api` unless you change the API base input.

3. The landing view is a login gate (Guild Soon™ banner + handle + password + single guild key) with a recruit link. Non-members must first save a recruit profile and then submit an application; they can revisit the recruit link later to see their own status.

4. Use the Members/Officers toggle in the sidebar to jump between the search hub and the admin tooling. All sections are scroll-linked via the quick navigation buttons.

5. Recruit applications require an official server pick (US East/West, EU Central, East Asia Seoul/Tokyo, SEA Singapore, Oceania Sydney, South America SaoPaulo), a time zone, and local availability hours; the form auto-converts to US Eastern so officers can align schedules quickly.

6. Upload screenshots directly from the Run Report form or paste hosted URLs. Files are persisted to `data/uploads` so they stay available to every officer.

7. Paste the access keys from your backend settings into the sidebar inputs (`Guild member key`, `Officer key`). Member-only API calls include the `X-Guild-Key` header automatically; officer-only calls add `X-Officer-Key` so only authorized reviewers can change settings, award Honor, or respond to applications. Officers can supply their lounge key after signing in.

## Quick test personas

- Clear browser storage to force the login screen if you’ve already authenticated.
- Seed one officer and one member with the built-in demo officer key:

```bash
curl -X POST http://localhost:3000/api/players \
  -H "Content-Type: application/json" \
  -H "X-Officer-Key: guild-officer-demo-key" \
  -d '{"displayName":"Officer Demo","discordTag":"officer#0001","role":"officer","rank":"Officer","isMember":true}'

curl -X POST http://localhost:3000/api/players \
  -H "Content-Type: application/json" \
  -H "X-Officer-Key: guild-officer-demo-key" \
  -d '{"displayName":"Member Demo","discordTag":"member#0001","role":"member","rank":"Recruit","isMember":true}'
```

- To preview the recruit lane, register and submit an application (replace `<RECRUIT_ID>` with the returned id from the first call):

```bash
curl -X POST http://localhost:3000/api/recruits/register \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Applicant Demo","discordTag":"apply#0001","note":"Looking for guild."}'

curl -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -d '{"playerId":"<RECRUIT_ID>","applicantName":"Applicant Demo","discordTag":"apply#0001","server":"US East (Virginia)","hoursInGame":120,"favoriteMode":"High Roller","mostPlayedMode":"PvP","daysPerWeek":4,"usualDays":"Mon/Wed/Sat","timeWindow":"Evenings","availabilityLocal":"19:00","availabilityLocalEnd":"23:00","timeZone":"America/New_York","bosses":"Lich, Ghost King","notes":"Ready for team play","roles":["melee"],"classes":["Fighter"],"characters":[{"name":"DemoFighter"}]}'
```

Log in as the member with username `member#0001`, any password, and the member access key `guild-member-demo-key`. Log in as the officer with username `officer#0001`, any password, the same member key, and then enter the officer key in the sidebar to unlock the Officer Lounge controls.

This frontend is intentionally framework-free so it can run anywhere static files are allowed (local filesystem, CDN, or the built-in Node server).
