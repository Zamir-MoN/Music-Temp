import asyncio
import hashlib
import logging
import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
import yt_dlp
from config import HOST, PORT, PROXY

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("server")

app = FastAPI(title="Music Player")

# Ensure downloads folder exists
os.makedirs("downloads", exist_ok=True)


def _search_youtube(query: str):
    ydl_opts = {
        "format": "bestaudio/best",
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "extract_flat": True,
    }
    if PROXY:
        ydl_opts["proxy"] = PROXY

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"ytsearch5:{query}", download=False)
            if "entries" in info and info["entries"]:
                results = []
                for entry in info["entries"]:
                    dur_sec = entry.get("duration") or 0
                    duration = f"{dur_sec // 60}:{str(dur_sec % 60).zfill(2)}" if dur_sec else "--:--"
                    results.append({
                        "title": entry.get("title", "Unknown"),
                        "url": entry.get("url") or f"https://www.youtube.com/watch?v={entry.get('id')}",
                        "id": entry.get("id"),
                        "duration": duration,
                        "thumbnail": entry.get("thumbnails", [{}])[-1].get("url") if entry.get("thumbnails") else "",
                    })
                return results
    except Exception as e:
        logger.warning(f"YouTube search error: {e}")
    return []


def _download_audio(youtube_url: str, output_template: str):
    ydl_opts = {
        "format": "m4a/bestaudio/best",
        "outtmpl": output_template,
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "extractor_args": {"youtube": ["player_client=android,web"]},
    }
    if PROXY:
        ydl_opts["proxy"] = PROXY

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([youtube_url])


async def get_audio_file(youtube_url: str):
    url_hash = hashlib.md5(youtube_url.encode("utf-8")).hexdigest()

    # Return cached file if already downloaded
    for ext in ["m4a", "mp3", "webm", "opus", "ogg"]:
        cached = f"downloads/{url_hash}.{ext}"
        if os.path.exists(cached) and os.path.getsize(cached) > 0:
            return cached

    output_template = f"downloads/{url_hash}.%(ext)s"
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _download_audio, youtube_url, output_template)

    for ext in ["m4a", "mp3", "webm", "opus", "ogg"]:
        result_path = f"downloads/{url_hash}.{ext}"
        if os.path.exists(result_path) and os.path.getsize(result_path) > 0:
            return result_path
    return None


@app.get("/api/search")
async def search(q: str):
    if not q or not q.strip():
        raise HTTPException(status_code=400, detail="Query parameter 'q' is required")
    loop = asyncio.get_event_loop()
    results = await loop.run_in_executor(None, _search_youtube, q)
    if not results:
        raise HTTPException(status_code=404, detail="No results found")
    return {"status": "success", "data": results}


@app.get("/api/stream")
async def stream(url: str):
    if not url or not url.strip():
        raise HTTPException(status_code=400, detail="URL parameter 'url' is required")
    file_path = await get_audio_file(url)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=500, detail="Failed to download audio")

    ext = os.path.splitext(file_path)[1].lower()
    media_types = {
        ".mp3": "audio/mpeg",
        ".m4a": "audio/mp4",
        ".webm": "audio/webm",
        ".ogg": "audio/ogg",
        ".opus": "audio/ogg",
    }
    return FileResponse(file_path, media_type=media_types.get(ext, "application/octet-stream"))


# Mount public folder for static assets
app.mount("/", StaticFiles(directory="public", html=True), name="public")

if __name__ == "__main__":
    print("\n==============================================")
    print(">> Music Player running locally at:")
    print(f">> http://localhost:{PORT}")
    print(f">> http://127.0.0.1:{PORT}")
    print("==============================================\n")
    uvicorn.run("server:app", host=HOST, port=PORT, reload=False)
