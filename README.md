# MP Test - Lightweight Web Music Player

A sleek, modern, and fast local web music player built with **FastAPI** and vanilla **HTML/CSS/JavaScript**. It searches and streams high-quality audio directly via `yt-dlp` with automatic local caching, queue management, and a clean dark-mode glassmorphic UI.

---

## 🌟 Key Features

- **Instant Search:** Find songs and artists instantly powered by YouTube search.
- **Fast Audio Streaming:** Streams audio on-the-fly directly to the browser.
- **Smart Hash Caching:** Tracks are cached by URL hash in the `downloads/` directory. Repeated song plays or scrubbing load instantaneously with zero network overhead.
- **Persistent Queue:** Add multiple tracks to an "Up Next" queue with automatic transitions to subsequent songs when the current track finishes.
- **Minimal & Lightweight:** No complex frameworks, no Spotify API keys or subscriptions required, and zero bloated background daemons.
- **Responsive Dark UI:** Modern glassmorphic interface styled with Google Fonts (Outfit) and FontAwesome icons.

---

## 🏗️ How It Works

```
Browser (UI)  --->  GET /api/search?q=...  --->  yt-dlp search  --->  Returns JSON tracks
Browser (UI)  --->  GET /api/stream?url=... --->  FastAPI Backend
                                                        │
                                          ┌─────────────┴─────────────┐
                                          ▼                           ▼
                                  Already Cached?             Not in Cache?
                                          │                           │
                                     Serve file               Download via yt-dlp
                                 (Partial 206 / Audio)         Save to downloads/
                                                                      │
                                                                 Serve audio
```

1. **Frontend (`public/`):**
   - Built with Vanilla JavaScript (`app.js`), semantic HTML5 (`index.html`), and custom CSS (`style.css`).
   - Handles the audio player lifecycle, progress bar seeking, and queue state.
2. **Backend (`server.py`):**
   - Powered by **FastAPI** and **Uvicorn**.
   - Serves static frontend assets at `/`.
   - `/api/search`: Executes asynchronous `yt-dlp` metadata extraction and returns song titles, thumbnails, durations, and URLs.
   - `/api/stream`: Checks if the requested track is already cached on disk. If not, fetches the audio stream and saves it into `downloads/`, then returns a `FileResponse` supporting HTTP range requests for instant seeking.
3. **Configuration (`config.py`):**
   - Simple environment variable management for port, host, and optional proxy.

---

## 📁 Project Structure

```
Music Temp/
├── downloads/           # Cached audio files (created automatically)
├── public/              # Frontend web application
│   ├── app.js           # Player, search, and queue logic
│   ├── index.html       # Single-page web player markup
│   └── style.css        # Responsive dark glassmorphism styles
├── .gitignore           # Git ignore rules (caches, downloads, env)
├── config.py            # Port, host, and proxy settings
├── README.md            # Project documentation & setup guide
├── requirements.txt     # Python dependencies
└── server.py            # FastAPI backend server
```

---

## 🚀 Step-by-Step Local Setup Guide

Follow these simple steps to run the music player on your local machine:

### 1. Prerequisites
- **Python 3.8 or higher** installed on your system.
  Verify by opening your terminal or PowerShell and running:
  ```bash
  python --version
  ```

### 2. Clone the Repository
```bash
git clone https://github.com/Zamir-MoN/Music-Temp.git
cd Music-Temp
```

### 3. Install Dependencies
Install the required packages using `pip`:
```bash
pip install -r requirements.txt
```

> **Packages installed:**
> - `fastapi` - High-performance web framework for the API endpoints.
> - `uvicorn` - Lightning-fast ASGI web server.
> - `yt-dlp` - Reliable audio extraction and search engine.
> - `python-dotenv` - Optional `.env` configuration support.

### 4. Run the Server
Start the local server with Python:
```bash
python server.py
```

You will see the startup message:
```text
==============================================
>> Music Player running locally at:
>> http://localhost:5585
>> http://127.0.0.1:5585
==============================================
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:5585
```

### 5. Open in Your Browser
Open your favorite browser and visit:
👉 **[http://localhost:5585](http://localhost:5585)**

Type a song or artist name in the search bar and enjoy your music!

---

## ⚙️ Configuration (Optional)

You can customize the server behavior by creating a `.env` file in the root directory:

```env
# Port to run the server on (Default: 5585)
PORT=5585

# Host address to bind to (Default: 0.0.0.0)
HOST=0.0.0.0

# Optional proxy (Leave empty for normal local residential connection)
# PROXY=socks5://127.0.0.1:9050
```

---

## ❓ Troubleshooting & FAQs

### Port 5585 is already in use
If another application is using port 5585, either change the port in `config.py` or set `PORT=8000` in a `.env` file.

### Audio buffering / seeking
The audio player uses native HTML5 audio with HTTP range requests. When playing long tracks, you can click anywhere on the progress bar to seek through the downloaded portions immediately.

### Stopping the server
To stop the server, press `CTRL + C` in the terminal where `server.py` is running.

---

## 📜 License
This project is open-source and intended for personal and educational use.
