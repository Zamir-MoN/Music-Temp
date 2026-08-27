import re
import json
from bs4 import BeautifulSoup

def extract_spotify_playlist(html_file):
    with open(html_file, 'r', encoding='utf-8') as f:
        html = f.read()
    
    soup = BeautifulSoup(html, 'html.parser')
    
    # Try to find meta tags first (open graph)
    tracks = []
    
    # Let's see if there's a script tag with initial state
    script_tag = soup.find('script', id='initial-state')
    if script_tag and script_tag.string:
        import urllib.parse
        import base64
        
        try:
            # Often it's base64 encoded or URL encoded JSON
            raw_data = base64.b64decode(script_tag.string).decode('utf-8')
            data = json.loads(raw_data)
            print("Found via base64 initial-state")
            return
        except Exception as e:
            pass
            
    # Try alternate: window.__INITIAL_STATE__
    match = re.search(r'window\.__INITIAL_STATE__\s*=\s*(\{.*?\});', html)
    if match:
        try:
            data = json.loads(match.group(1))
            print("Found via __INITIAL_STATE__")
            return
        except:
            pass
            
    # Find all meta tags with name="music:song"
    song_urls = [meta['content'] for meta in soup.find_all('meta', property='music:song')]
    print(f"Found {len(song_urls)} songs via meta tags.")
    
    # Print out titles
    titles = soup.find_all('meta', property='og:title')
    descriptions = soup.find_all('meta', property='og:description')
    
    print(f"Title: {titles[0]['content'] if titles else 'None'}")
    print(f"Desc: {descriptions[0]['content'] if descriptions else 'None'}")
    
extract_spotify_playlist('spotify_dump.html')
