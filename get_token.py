import re
import json
from bs4 import BeautifulSoup

def get_tracks(html_file):
    with open(html_file, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Spotify embeds the tracks in a huge JSON object. Let's find it.
    match = re.search(r'<script id="initial-state" type="text/plain">(.*?)</script>', html)
    if match:
        import base64
        raw = base64.b64decode(match.group(1)).decode('utf-8')
        data = json.loads(raw)
        
        # Traverse down to find tracks
        try:
            items = data['entities']['items']
            for k, v in items.items():
                if k.startswith('spotify:track:'):
                    name = v.get('name', 'Unknown')
                    artists = [a.get('name') for a in v.get('artists', {}).get('items', []) if a]
                    print(f"{name} by {', '.join(artists)}")
        except Exception as e:
            print("Error parsing state:", e)
    else:
        print("Initial state not found.")

get_tracks('spotify_dump.html')
