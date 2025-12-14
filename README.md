# Guild Nexus: A Multi-Guild Community Management Platform

This project is a sophisticated, customizable guild management tool designed to be the central hub for gaming communities. It provides a professional, feature-rich alternative for organization, communication, and progression tracking that complements and extends the capabilities of platforms like Discord.

The vision is to create a cross-platform application that can be tailored by guild leaders to suit their community's specific needs, whether they play Dark and Darker, Escape from Tarkov, or any other online game.

## Key Features & Vision

*   **Multi-Guild Identity System:** Users can create their own guilds with a unique, public-facing tag (e.g., `the-iron-fist#001`) or join existing guilds.
*   **Guild Customization:** Empower guild leaders to change their guild's name, theme, ranks, and feedback traits to create a unique identity.
*   **Advanced Organization:** Move beyond simple chat logs with dedicated tools for run reporting, member-posted bounties, honor point systems, and market tracking.
*   **Role & Permission System:** A robust backend with security rules ensures that guild leaders (Admins, Officers) have exclusive control over management features. Members have access to guild-specific data.
*   **Professional Identity:** Provide your guild with a polished, top-quality web presence that looks and feels official, complete with thematic audio feedback for a more immersive experience.

## Audio System

The application includes a centralized audio feedback system for an enhanced user experience. All sound files are located in the `public/sounds/` directory.

*   `ui-click.mp3`: A soft click for general button interactions.
*   `ui-confirm.mp3`: A solid confirmation sound for primary actions (e.g., submitting a form).
*   `ui-switch.mp3`: A muted sound for toggling tabs or switches.
*   `ui-error.mp3`: A subtle error sound.
*   `ui-success.mp3`: A restrained chime for successful operations.
*   `quill-writing.mp3`: A soft typing sound for text inputs (throttled).
*   `ui-hover.mp3`: A very light sound for hover events.

## Roadmap

*   **DarkerDB API Integration:** Investigate and potentially integrate with the DarkerDB API (`https://api.darkerdb.com/`) to pull live item data directly into the hub for a Dark and Darker guild.
*   **Theme Customization:** Allow admins to select color palettes and themes to match their guild's branding.
*   **Game-Specific Modules:** Develop new modules for other popular games like Escape from Tarkov, including features like hideout tracking or market data integration.
*   **Event & Calendar System:** Implement a guild calendar for scheduling runs, events, and meetings.
*   **Advanced Communication Tools:** Build features like a persistent guild announcement board or private messaging between members.
*   **Real-time Presence:** Enhance the "Online" status to show what activity a player is currently engaged in (e.g., "In a Run," "In Lobby").
