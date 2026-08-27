import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn

from core.api import fetch_youtube_link, download_song
from config import PORT, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import re

app = FastAPI(title="MP test Web")

# Create downloads folder if it doesn't exist
if not os.path.exists("downloads"):
    os.makedirs("downloads")

@app.get("/api/search")
async def search(q: str):
    if not q:
        raise HTTPException(status_code=400, detail="Query parameter 'q' is required")
    
    result = await fetch_youtube_link(q)
    if not result:
        raise HTTPException(status_code=404, detail="No results found")
    
    return {"status": "success", "data": result}

@app.get("/api/stream")
async def stream(url: str):
    if not url:
        raise HTTPException(status_code=400, detail="URL parameter 'url' is required")
    
    file_path = await download_song(url)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=500, detail="Failed to download audio")
    
    ext = os.path.splitext(file_path)[1].lower()
    media_types = {
        ".mp3": "audio/mpeg",
        ".m4a": "audio/mp4",
        ".webm": "audio/webm",
        ".ogg": "audio/ogg",
        ".opus": "audio/ogg"
    }
    media_type = media_types.get(ext, "application/octet-stream")
    
    return FileResponse(file_path, media_type=media_type, filename=f"audio{ext}")

@app.get("/api/playlist")
async def get_playlist(url: str):
    if not url:
        raise HTTPException(status_code=400, detail="URL parameter 'url' is required")
        
    try:
        # Extract playlist ID
        match = re.search(r'playlist/([a-zA-Z0-9]+)', url)
        playlist_id = match.group(1) if match else url
        
        # Setup Spotify client
        auth_manager = SpotifyClientCredentials(client_id=SPOTIFY_CLIENT_ID, client_secret=SPOTIFY_CLIENT_SECRET)
        sp = spotipy.Spotify(auth_manager=auth_manager)
        
        # Fetch tracks
        results = sp.playlist_items(playlist_id)
        tracks = results['items']
        
        while results['next']:
            results = sp.next(results)
            tracks.extend(results['items'])
            
        track_queries = []
        for item in tracks:
            track = item.get('track')
            if track:
                name = track.get('name', '')
                artists = [artist.get('name', '') for artist in track.get('artists', [])]
                artist_string = ", ".join(artists)
                query = f"{name} by {artist_string}"
                
                track_queries.append({
                    "title": name,
                    "artist": artist_string,
                    "query": query,
                    "thumbnail": track.get('album', {}).get('images', [{}])[0].get('url', '') if track.get('album', {}).get('images') else ''
                })
                
        return {"status": "success", "data": track_queries}
    except Exception as e:
        print(f"Spotify Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Mount public directory for static files
app.mount("/", StaticFiles(directory="public", html=True), name="public")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)
