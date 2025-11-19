Guild Nexus – README

A lightweight guild management, reporting, and reward system for Dark and Darker.

Note: All names, systems, and labels are working titles and may be renamed later.

📜 Introduction

Guild Nexus is a lightweight, web-based guild hub for Dark and Darker.

It helps guilds:

Coordinate players and find groups

Track runs, behavior, and performance

Reward participation and good citizenship

Resolve drama with evidence and context

Do all configuration in-app, without editing config files

The backend starts with JSON/file-based storage (or Google Drive synced), and can later be migrated to a real database like Supabase/Postgres without rewriting core logic.

🧍 Player & 🎭 Character Model

Dark and Darker has unique, single-class characters, but players may have multiple characters.

Player (Account)

Logs in via Discord (or other provider)

Has:

playerId

Display name / Discord tag

Friends list

Messaging

Online/offline status

Lifetime Honor (rank score)

Current Honor (spendable)

0–N Characters

All points, ranks, rewards, and admin visibility are at the Player level.

Character

Each Character:

Belongs to one Player

Has a unique name within the guild

Has exactly one class (Barbarian, Fighter, Cleric, etc.)

Is the unit used for:

Runs

Stats (kills, deaths, boss kills)

Reports & reviews

Role usage data

All performance and behavioral data is tracked per-character, and rolled up per-player for officer review.

🎮 Core Systems
1. Run Reports & Feedback

After a run, players can submit a Run Report tied to:

One Run

The Character they played

Run Report Includes

Overall run rating (1–10)

Game mode:

High Roller

Squire to Riches

PvE

PvP

(Configurable by admins in-app)

Per-character stats:

Kills

Deaths

Extracted? (yes/no)

Boss kills (if known)

Checkboxes for traits (configurable in-app):

Great comms

Team player

Loot hog

Toxic

Clutch saver

Optional run notes

Screenshots upload slot(s) for scoreboard / proof

Players can review teammates’ characters, but:

Players cannot see reviews written about themselves

Only officers can read all reviews & scores

2. Drastic Score Rules (Anti-Spam / Anti-Troll)

To discourage lazy trolling and farmed 10/10 spam, extreme ratings require real explanation.

Drastic thresholds (configurable in-app)

By default:

Low score: ≤ 3

High score: ≥ 9

Required behavior

For any review:

If score ≤ Low threshold:

Comment is required

Must be at least 140 characters

If score ≥ High threshold:

Comment is required

Must be at least 80 characters

The exact thresholds and character counts are editable by officers inside the app’s Settings page (no file edits).

If these requirements are not met, the form cannot be submitted.

3. Screenshot Support & Confirmed Stats

The game removed some long-term stat tracking (kills, deaths, boss kills).
Guild Nexus reintroduces this via player-submitted data plus screenshot-backed confirmation.

Screenshots

Players can upload screenshots as part of a Run Report.

Screenshots attach to the Run, not individual reviews.

If someone prefers third-party hosting they can drop images into free services like Imgur, Discord attachments, or ImgBB and paste the share URL—the UI spells out those options next to the uploader so no one gets stuck wondering where to host proof.

Accessible from:

Run detail view (all participants)

Officer report review screens

Confirmed vs Unconfirmed Stats

We differentiate between:

Unconfirmed stats: entered manually by players

Confirmed stats: manually entered and backed by acceptable screenshots, or confirmed by officers

The app tracks:

Total kills, deaths, boss kills per character

Also aggregates per player

Officers can:

Mark certain stats as confirmed (after checking screenshots)

Choose to show only confirmed stats in sensitive officer views

This allows long-term stat tracking without trusting raw text alone.

4. Verified Run System (Anti-Exploit for Reports)

To prevent farming Honor via solo spam:

A run is only marked Verified when at least 2 distinct players submit a report for that run.

Once Verified:

All participants gain Participation Honor

All report authors gain Report Honor

This auto-award happens once per run only

Runs with only one reporter do not grant automatic points.

Settings for:

Minimum reporters required

Points per mode

…are all configurable in-app by admins.

💰 Honor Points (HP) – The Honor System

The guild currency has been renamed to Honor Points (HP) to lean into Dark and Darker flavor. Honor is tracked per player with two independent ledgers:

A. Lifetime Honor (Rank Score)

- Totals all earned HP across all characters and actions
- Never decreases
- Drives rank tiers and long-term reputation

B. Current Honor (Wallet)

- Goes up when earning HP
- Goes down when redeeming guildbank rewards or services
- Does not affect Lifetime Honor

How Players Earn Honor (all values editable in-app):

- Verified run participation (auto-awarded when runs hit the reporter threshold)
- Submitting run reports that meet drastic rules
- Completing Bounty Board quests
- Donating gold or items to the guild
- Officer bonuses for clutch plays, great comms, or outstanding citizenship

Every award is recorded in the Honor ledger and mirrored in the Admin Log with the reason and any contextual metadata. "Honor is earned, trust is built"—so the UI now forces officers to include a narrative when granting HP.

How Players Spend Honor:

- Claiming guildbank items
- Paying for carries, crafts, or special services
- Unlocking perks defined by officers

Spending creates a negative ledger entry, is visible to all officers, and never reduces Lifetime Honor (only the current wallet balance).

🧾 Immutable Admin Log & Points Ledger

Transparency is a hard requirement:

“No points going out without all admins/officers being able to see it.”

Points Ledger (Per Player)

Each entry:

playerId

changeAmount (+/-)

direction ("earn" | "spend" | "adjust")

reason (e.g. "run_participation", "quest_reward", "officer_bonus", "reward_purchase", "gold_donation")

details (JSON: runId, characterId, questId, officerId, etc.)

createdAt

Every entry also carries a short “why” narrative; the UI refuses to submit adjustments without one so all officers can see exactly why Honor moved.

Used to compute:

Current Honor (sum of all entries)

Lifetime Honor (sum of "earn" entries)

Admin Log (Global, Immutable Audit Log)

Every admin/officer action that affects the system is logged here:

Point awards / adjustments

Creation / editing of bounties

Creation / editing of rewards

Editing or removal of reviews (e.g., if clearly abusive)

Manual stat confirmations

Important config changes (thresholds, settings)

Each Admin Log entry includes:

adminPlayerId

actionType (e.g. "award_points", "create_bounty", "edit_review", "confirm_stats", "change_setting")

targetPlayerId / targetCharacterId / targetRunId (as applicable)

metadata (details)

createdAt

Key rules:

Admin Log is append-only.

Individual log entries cannot be edited or deleted, even by officers.

Corrections are done via new entries (e.g. “Reversed +10 HP mis-award”).

All admins/officers can see the full Admin Log in the app, including filters by:

Date

Admin

Target player

Action type

📅 Bounty Board (Daily & Weekly Quests)

Working-title: Bounty Board

Officers can fully manage quests in-app:

Create new bounties

Edit existing bounties

Deactivate or retire bounties

Examples:

Daily:

“Complete 3 Guild Trios”

“Submit 3 Run Reports”

Weekly:

“Play 10 Guild Runs”

“Earn 50 HP this week”

Each bounty has:

ID

Title & description

Type: daily, weekly, or one_time

Requirements (run count, report count, specific modes, etc.)

Honor reward amount

Active status

Progress is auto-tracked based on runs/reports.
Players claim rewards manually → generates:

Honor ledger entries

Notification

Admin Log entry

💬 Messaging & Friends
Messaging

Two channels:

Guild Chat – shared global guild channel

Direct Messages (DMs) – player-to-player

Features:

Read/unread state

Simple, chronological chat

Lives in JSON storage initially

Friends & Presence

Players can send/accept friend requests

Friends list is easily viewable

Online status is determined by presence pings:

- Players who interact with the UI are marked `online` for `presence.ttlMinutes` (configurable in Settings).
- Officers or desktop helpers can explicitly ping `in_game` to show someone is inside Dark and Darker.
- When the TTL expires without another ping the player automatically falls back to `offline`, so the “Active now” metric always reflects reality.

To automate presence, bundle the provided helper script with your game launcher:

```
GUILD_API_BASE=https://guild.example.com/api \
GUILD_PLAYER_ID=player-uuid-here \
GUILD_PRESENCE=in_game \
node scripts/presence-helper.js
```

Windows users can drop that command into a batch file that runs before starting the Dark and Darker executable; Steam launch options or Task Scheduler work well. macOS/Linux users can wire it into a shell alias. The UI still exposes a manual “Presence Ping” form for quick overrides.

The dashboard’s “Active now” metric and hoverable presence chips reflect these pings, so “active members” always means “online or in-game right now.”

Friends list UI shows:

Friend name

Online/offline

Shared run count

Success rate & team score

🤝 Team Synergy & Success Score

The system calculates synergy metrics between players:

For each pair of players:

Runs together (count)

Success rate (extractions per runs together)

Team score (0–10) – based on:

Success rate

Mutual review scores

Difficulty of runs

Displayed on Friends page:

Billy – 26 runs together – 69% success – Team Score: 7.8

Officers can view synergy data to:

Identify strong squads

Spot dysfunctional combinations

📬 Notifications / Mailbox

Players see a Mail/Notification icon showing:

New run reports they’re associated with

Completed bounties ready to claim

Daily login rewards

Officer Honor awards

Friend requests

Message pings

Notifications are stored as objects with:

Owner playerId

Type

Data (runId, questId, etc.)

isRead flag

🧩 Admin / Officer Controls (In-App Editable)

Admins and officers do not have to edit raw files.
Everything is controllable via UI pages such as:

Settings

Drastic score thresholds

Minimum comment lengths

Daily login reward amount

Auto-award values per game mode

Max kills before anomaly flag

Bounty Board Admin

Add/edit/delete/disable bounties

Rewards Admin (Guildbank)

Add/edit rewards

Set Honor cost

Mark redemptions as fulfilled

Points Management

Award Honor to players

Apply corrections

View per-player ledger

Membership Management

Promote/demote ranks and roles

Toggle guild membership (removal requires a written reason; the UI enforces it and the Admin Log captures it)

Review Management

View all flagged reviews

Edit or remove abusive/clearly false reviews

All such actions are logged in Admin Log, not silently hidden

Stats Management

Confirm or invalidate suspicious stat claims

Mark stats as screenshot-verified

All of these actions generate Admin Log entries.

🧭 Recruitment & Applications

Guild Nexus now keeps a dedicated Recruits lane:

- Applicants fill a guided form (hours played, favorite/most played modes, availability, characters, bosses) from the "Recruits" view.
- Officers see a glowing mailbox badge for pending applications in the Lounge, with repeat-applicant flags when Discord/email/characters match prior submissions.
- Approvals or denials require a short note and are logged to the Admin Log alongside reviewer info and timestamps.
- Endpoints: `POST /api/applications` to submit, `GET /api/applications?status=pending` to browse, `PUT /api/applications/:id` to approve/deny with `adminPlayerId` + `note`.

🧱 Architecture & Storage (Working Plan)
Frontend

Lightweight SPA (or MPA)

Mobile-friendly

Theming:

Light / Dark / Guild-colors

Pages:

Dashboard

Runs & Reports

Bounty Board

Friends & Messages

Profile (Player + Characters)

Officer Panel

Admin Log

Backend

Node.js + Express (or similar)

File-based storage:

data.json (or split by domain: players.json, runs.json, etc.)

Optional sync/backup to Google Drive

Abstraction layer:

loadData() / saveData() helpers

High-level functions like:

createRun()

submitReport()

awardPoints()

logAdminAction()

updateQuestProgress()

confirmStats()

Later, we can plug in a DB by changing:

loadData / saveData → DB queries

Keeping all core logic intact.

🔐 Auth & Hosting Options

- **Current prototype** – trusts local JSON storage and manual knowledge of who should access the Officer Lounge. Great for rapid iteration, but not secure enough for production.
- **Discord OAuth (free)** – map Discord IDs to `playerId`, gate the UI (especially the Officer Lounge) by guild roles, and reuse the presence ping endpoint for status updates.
- **Supabase (generous free tier)** – drop-in Postgres replacement for the JSON files plus built-in Auth (email magic links, Discord, etc.). The storage abstraction keeps the migration trivial.
- **Firebase/Firestore (free tier)** – also viable if the team prefers Google tooling; the REST API already mirrors Firestore collections, so swapping out persistence is straightforward.
- **Self-hosting** – run the Node server behind nginx/Caddy, layer on OAuth (Auth0, Cloudflare Access, etc.), and keep everything on your own hardware if you prefer.

Regardless of the provider, the UI already separates the Member Hall from the Officer Lounge, enforces Honor narratives, and requires reasons for guild removals—auth just decides who can see which side.

🏁 Status

This README now serves as the working design spec for Guild Nexus.

All titles (Guild Nexus, Honor System, Bounty Board, etc.) are working names.

All numeric values (score thresholds, min characters, rewards) will be editable in-app by admins/officers.

The system is built around:

Transparency (Admin Log)

Anti-exploit design (Verified Runs, drastic score rules)

Evidence support (screenshots, stat confirmation)

Ease of use (everything configurable via UI)

## Local Development

The first pass of the Guild Nexus API lives in `src/server.js` and persists data to `data/data.json`. The server only relies on Node built-ins so it can run in restricted environments without npm access.

```bash
npm install # no-op but kept for future packages
npm run dev  # starts the API on port 4000
```

### Available API routes

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Server heartbeat |
| GET/PUT | `/api/settings` | Read/update drastic score, verification, and trait options |
| GET/POST | `/api/players` | List players or create a new Discord-linked player |
| GET | `/api/characters` | List characters (optionally filtered by `playerId`) |
| POST | `/api/players/:playerId/characters` | Register a single-class character |
| GET/POST | `/api/runs` | Manage scheduled runs and participants. Supports filtering via `date`, `playerId`, and `playerQuery`. |
| GET/POST | `/api/reports` | Submit or inspect per-character run reports. Filter with `date`, `playerId`, `characterName`, `code`, etc. |
| PUT | `/api/players/:playerId` | Update ranks, roles, and membership flags for existing players |
| POST | `/api/ledger/award` | Append Honor ledger entries with admin log mirroring |
| POST | `/api/presence/ping` | Update a player's online/in-game status (used by the UI and optional desktop helper) |
| GET | `/api/admin-log` | Review append-only officer actions |
| GET/POST | `/api/bounties` | Manage Bounty Board quests |

### Officer Console Frontend

The Node server now serves a zero-dependency SPA from `/frontend`. Launching `npm start` exposes the UI at `http://localhost:3000/` and proxies all API calls to `/api`. The Officer Console ships:

- Torch-lit, leather-on-iron responsive layout with a two-mode navigation shell. Instantly flip between the “Member Hall” (run/report lookup) and the “Officer Lounge” (admin tooling) without losing context.
- Metric cards, roster cards, run/report galleries with short IDs (e.g., `RUN-0007`, `REP-0009`), bounty board, Honor ledger, presence radar, and admin log table.
- Inline forms for every major workflow: creating players/characters/runs/reports/bounties, awarding Honor, editing drastic score rules, updating ranks/roles, and pinging presence.
- Member-facing global search that filters runs by day, teammate, or mode and reports by player, character, or report code.
- Built-in screenshot uploader that stores scoreboard proof server-side, plus explicit guidance for free hosts (Imgur, Discord attachments, ImgBB) when a player prefers pasting URLs.
- Configurable API base URL so the UI can target remote Guild Nexus nodes without rebuilding assets.

Because it is plain HTML/CSS/JS, the UI can be hosted via any static server or CDN. The built-in server automatically falls back to `index.html` for non-API routes so deep links stay functional. Uploaded screenshots are saved under `data/uploads` and automatically served from `/uploads/...` URLs.

Run `npm test` to execute a scripted smoke test that boots the API, creates a player/character/run, and records a report end-to-end.
