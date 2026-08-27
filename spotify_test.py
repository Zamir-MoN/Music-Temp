import requests
from bs4 import BeautifulSoup

url = "https://open.spotify.com/playlist/37i9dQZF1DWWuGaVZsglfu"
response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
with open("spotify_dump.html", "w", encoding="utf-8") as f:
    f.write(response.text)
