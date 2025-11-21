# **App Name**: Dark and Darker Guild Hub

## Core Features:

- Player and Character Management: Allow players to log in via Discord, create characters, and manage their profiles. This includes tracking player ID, display name, Discord tag, friends list, online/offline status, lifetime honor, and current honor. Each character belongs to one player and has a unique name and class. The system tracks kills, deaths, and boss kills per character.
- Run Reports & Feedback: Enable players to submit run reports tied to a run and the character they played. Include fields for overall run rating, game mode, per-character stats (kills, deaths, extracted, boss kills), configurable checkboxes for traits (e.g., great comms, team player, loot hog, toxic), optional run notes, and screenshot uploads for scoreboard proof. Players can review teammates’ characters, but cannot see reviews written about themselves. Only officers can read all reviews & scores.
- Drastic Score Rules: Implement configurable thresholds for drastic ratings to discourage trolling.  Require comments of at least 140 characters for scores <= 3 and at least 80 characters for scores >= 9. The form cannot be submitted if these requirements are not met. Officers can edit thresholds and character counts.
- Screenshot Support & Confirmed Stats: Allow players to upload screenshots as part of a run report to confirm stats. Differentiate between unconfirmed (manually entered) and confirmed (screenshot-backed or officer-confirmed) stats. Track total kills, deaths, and boss kills per character and aggregate per player. Officers can mark stats as confirmed and choose to show only confirmed stats in sensitive views. Allow images to be hosted in 3rd party services like Imgur.
- Verified Run System: Mark a run as 'Verified' only when at least two distinct players submit a report for that run. Verified runs grant participation and report honor. Runs with only one reporter do not grant points. Settings for minimum reporters required and points per mode are configurable in-app by admins.
- Bounty Board: Generate and display a set of available daily and weekly quests to be completed. The tool uses reasoning to choose quests to display based on player activity.
- Honor Points (HP) System: Implement an Honor Points (HP) system as the guild currency. Track Lifetime Honor (rank score) and Current Honor (wallet). Award HP for verified run participation, submitting reports that meet drastic rules, completing bounty board quests, donating to the guild, and officer bonuses. Allow players to spend honor on guild bank items, carries, crafts, or special services. Record all awards in an immutable admin log and require a narrative for officer adjustments.

## Style Guidelines:

- Primary color: Dim torch light, emulating the game's atmosphere.
- Background color: Mineral cavernous bone colors for the main members area to reinforce the dungeon theme.
- Accent color: Leathers, dark browns, and grays to give a rugged, worn feel.
- Officer Area Theme: Red accents, invoking the 'elite' designation in Dark and Darker.
- Headline font: A font similar to Dark and Darker, or a medieval-inspired typeface for headers.
- Body Font: A readable font that complements the medieval style, ensuring legibility.
- Use icons that evoke the fantasy theme, such as swords, potions, and treasure chests.
- Subtle animations, like glowing edges and smooth transitions.