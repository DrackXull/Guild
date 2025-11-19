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

Lifetime Grim Favor (rank score)

Current Grim Favor (spendable)

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

To prevent farming Grim Favor via solo spam:

A run is only marked Verified when at least 2 distinct players submit a report for that run.

Once Verified:

All participants gain Participation Grim Favor

All report authors gain Report Grim Favor

This auto-award happens once per run only

Runs with only one reporter do not grant automatic points.

Settings for:

Minimum reporters required

Points per mode

…are all configurable in-app by admins.

💰 Grim Favor (GF) – Working Title Guild Currency

EPGP-style currency, renamed for Dark and Darker flavor.

Tracked at the Player level with two distinct tracks:

A. Lifetime Grim Favor (Rank Score)

Totals all earned GF across all characters and actions

Never decreases

Determines:

Rank tiers

Long-term reputation

B. Current Grim Favor (Wallet)

Goes up when earning GF

Goes down when spending GF on guildbank rewards

Does not affect Lifetime total

How Players Earn Grim Favor

Examples (all values configurable in-app):

Verified run participation

Submitting run reports

Completing Bounty Board quests

Donating gold or items to the guild

Officer bonuses for good/funny/detailed reports

Every award is recorded in a ledger entry and mirrored in an Admin Log (see below).

How Players Spend Grim Favor

Players can spend GF on:

Guildbank items

Services (e.g., carries, crafting, priority loot rights)

Special perks defined by officers

Spending is:

Logged as a negative change in the ledger

Visible to officers in the Admin Log

Does not reduce Lifetime GF used for Rank

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

Used to compute:

Current GF (sum of all entries)

Lifetime GF (sum of "earn" entries)

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

Corrections are done via new entries (e.g. “Reversed +10 GF mis-award”).

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

“Earn 50 GF this week”

Each bounty has:

ID

Title & description

Type: daily, weekly, or one_time

Requirements (run count, report count, specific modes, etc.)

GF reward amount

Active status

Progress is auto-tracked based on runs/reports.
Players claim rewards manually → generates:

GF Ledger entries

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

Online status determined by recent activity:

e.g. active within last 5 mins = Online

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

Officer GF awards

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

Set GF cost

Mark redemptions as fulfilled

Points Management

Award GF to players

Apply corrections

View per-player ledger

Review Management

View all flagged reviews

Edit or remove abusive/clearly false reviews

All such actions are logged in Admin Log, not silently hidden

Stats Management

Confirm or invalidate suspicious stat claims

Mark stats as screenshot-verified

All of these actions generate Admin Log entries.

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

🏁 Status

This README now serves as the working design spec for Guild Nexus.

All titles (Guild Nexus, Grim Favor, Bounty Board, etc.) are working names.

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
| POST | `/api/ledger/award` | Append Grim Favor ledger entries with admin log mirroring |
| GET | `/api/admin-log` | Review append-only officer actions |
| GET/POST | `/api/bounties` | Manage Bounty Board quests |

### Officer Console Frontend

The Node server now serves a zero-dependency SPA from `/frontend`. Launching `npm start` exposes the UI at `http://localhost:3000/` and proxies all API calls to `/api`. The Officer Console ships:

- Neon-on-dark responsive layout with a two-mode navigation shell. Instantly flip between the “Member Hall” (run/report lookup) and the “Officer Lounge” (admin tooling) without losing context.
- Metric cards, roster cards, run/report galleries with short IDs (e.g., `RUN-0007`, `REP-0009`), bounty board, and admin log table.
- Inline forms for every major workflow: creating players/characters/runs/reports/bounties, awarding Grim Favor, editing drastic score rules, and updating ranks/roles.
- Member-facing global search that filters runs by day, teammate, or mode and reports by player, character, or report code.
- Built-in screenshot uploader that stores scoreboard proof server-side, plus guidance for external hosts (Imgur, Discord attachments, ImgBB) when a player prefers pasting URLs.
- Configurable API base URL so the UI can target remote Guild Nexus nodes without rebuilding assets.

Because it is plain HTML/CSS/JS, the UI can be hosted via any static server or CDN. The built-in server automatically falls back to `index.html` for non-API routes so deep links stay functional. Uploaded screenshots are saved under `data/uploads` and automatically served from `/uploads/...` URLs.

Run `npm test` to execute a scripted smoke test that boots the API, creates a player/character/run, and records a report end-to-end.
