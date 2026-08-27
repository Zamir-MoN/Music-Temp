import asyncio
from core.api import download_song

async def main():
    print(await download_song("https://www.youtube.com/watch?v=xvT1jH8B9AM"))

if __name__ == "__main__":
    asyncio.run(main())
