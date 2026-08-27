# Project Bugs & Solutions Log

This document tracks the major bugs, roadblocks, and technical solutions encountered while building the **MP test** Web Player project.

---

## 1. YouTube Audio Streaming Errors (yt-dlp)
**Bug:** The backend `/api/stream` endpoint was consistently throwing `500 Internal Server Error` during playback. The logs revealed `yt-dlp` was failing with: *"Sign in to confirm you're not a bot. This helps protect our community."*
**Cause:** The project was using a provided `cookies.txt` file to authenticate with YouTube. YouTube flagged the session associated with those cookies and triggered an anti-bot blockade.
**Solution:** Disabled the use of `cookies.txt` entirely in `config.py` and `api.py`. By letting `yt-dlp` fetch streams anonymously, it bypasses the bot-check for standard, non-age-restricted music videos.

## 2. Spotify API Integration Failures (403 Forbidden)
**Bug:** After adding the `spotipy` library to parse Spotify Playlist URLs, the backend failed to fetch playlist items, resulting in an "Oops! Could not find any tracks" error on the frontend.
**Cause:** The server logs showed a `403 Forbidden` error from the Spotify Web API with the message: *`Active premium subscription required for the owner of the app.`* Spotify recently updated their Developer Terms to require an active Premium subscription for new apps to access the API. Since the app owner account was on the free tier, API requests were blocked.
**Solution:** This is a hard limitation on Spotify's end. 
- **Alternative 1:** Users can manually type the album/playlist name into the search bar to find the equivalent tracks via YouTube.
- **Alternative 2:** In the future, the app can be updated to support **YouTube Music** playlist links instead, which do not require authenticated API keys.

## 3. Leftover Telegram Bot Bloatware
**Bug:** The original codebase was cloned from a Telegram VC Music Bot template ("KustMusic"). It contained unnecessary bloatware, including Pyrogram dependencies, Telegram environment variables (`API_ID`, `BOT_TOKEN`), and deployment configuration files (`heroku.yml`, `koyeb.yaml`) that were not needed for a standalone web player.
**Solution:** Conducted a full codebase purge. 
- Renamed the project from "KustMusic" to "MP test" across the frontend (`index.html`) and backend (`server.py`).
- Deleted all Telegram-specific files (e.g., `core/guards.py`, `app.json`, `render.yaml`).
- Removed Pyrogram and Telethon references from `requirements.txt` and cleaned up `config.py`.

## 4. Playback Queue Logic (Frontend)
**Bug:** Originally, playing a new song from search results would immediately interrupt the current song, and there was no way to queue up multiple tracks for continuous playback.
**Solution:** Rewrote the frontend JavaScript (`app.js`) to implement a persistent queue array. 
- Added an "Up Next" sidebar UI in `index.html` and `style.css`.
- Added "Play Now" vs "Add to Queue" buttons to search results.
- Added event listeners to the `<audio>` tag's `ended` event to automatically trigger `playNext()`, ensuring seamless transitions between queued songs.
