document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const welcomeState = document.getElementById('welcomeState');
    
    // Queue elements
    const queueList = document.getElementById('queueList');
    const clearQueueBtn = document.getElementById('clearQueueBtn');
    
    // Player elements
    const audioPlayer = document.getElementById('audioPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playerTitle = document.getElementById('playerTitle');
    const playerArtist = document.getElementById('playerArtist');
    const playerThumb = document.getElementById('playerThumb');
    
    // Progress elements
    const progressBarBg = document.getElementById('progressBarBg');
    const progressBarFill = document.getElementById('progressBarFill');
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl = document.getElementById('totalTime');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeFill = document.getElementById('volumeFill');

    // Queue State
    let queue = [];
    let currentIndex = -1;

    // Search functionality
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    clearQueueBtn.addEventListener('click', () => {
        queue = [];
        currentIndex = -1;
        renderQueue();
    });

    async function performSearch() {
        const query = searchInput.value.trim();
        if (!query) return;

        welcomeState.classList.add('hidden');
        resultsContainer.classList.add('hidden');
        loadingIndicator.classList.remove('hidden');

        try {
            // Check if it's a Spotify Playlist
            if (query.includes('spotify.com/playlist/')) {
                const response = await fetch(`/api/playlist?url=${encodeURIComponent(query)}`);
                const json = await response.json();
                
                if (json.status === 'success' && json.data.length > 0) {
                    // Add all to queue
                    const startIdx = queue.length;
                    queue.push(...json.data);
                    renderQueue();
                    
                    if (currentIndex === -1) {
                        currentIndex = startIdx;
                        playQueueItem(currentIndex);
                    }
                    
                    loadingIndicator.classList.add('hidden');
                    welcomeState.classList.remove('hidden');
                    welcomeState.innerHTML = '<i class="fa-solid fa-check-circle" style="color:#10b981; font-size:4rem; margin-bottom:1rem;"></i><h2>Playlist Added!</h2><p>Added ' + json.data.length + ' tracks to the queue.</p>';
                    return;
                }
            }

            // Normal Search
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const json = await response.json();

            if (json.status === 'success' && json.data) {
                displayResults(json.data);
            } else {
                throw new Error('No results');
            }
        } catch (error) {
            console.error('Search error:', error);
            loadingIndicator.classList.add('hidden');
            welcomeState.classList.remove('hidden');
            welcomeState.innerHTML = '<i class="fa-solid fa-circle-exclamation" style="font-size:4rem; margin-bottom:1rem;"></i><h2>Oops!</h2><p>Could not find any tracks matching your search.</p>';
        }
    }

    function displayResults(data) {
        loadingIndicator.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
        resultsContainer.innerHTML = '';

        const tracks = Array.isArray(data) ? data : [data];

        tracks.forEach(track => {
            const card = document.createElement('div');
            card.className = 'track-card';
            
            // Reformat for queue
            const trackObj = {
                title: track.title || 'Unknown Title',
                artist: track.artist || 'YouTube Audio',
                thumbnail: track.thumbnail || 'https://via.placeholder.com/200',
                query: track.link || track.url // If it's a direct result, the query is just the link
            };
            
            card.innerHTML = `
                <img src="${trackObj.thumbnail}" alt="${trackObj.title}">
                <h3>${trackObj.title}</h3>
                <p>${track.duration || '--:--'} • YouTube</p>
                <div style="margin-top: 10px; display: flex; gap: 10px;">
                    <button style="padding: 5px 10px; font-size:0.8rem; background: var(--accent); border:none; color:white; border-radius:4px; cursor:pointer;" onclick="event.stopPropagation(); window.playNow(this)">Play Now</button>
                    <button style="padding: 5px 10px; font-size:0.8rem; background: rgba(255,255,255,0.1); border:none; color:white; border-radius:4px; cursor:pointer;" onclick="event.stopPropagation(); window.addToQueue(this)">Add to Queue</button>
                </div>
            `;
            
            card.trackObj = trackObj;
            resultsContainer.appendChild(card);
        });
    }
    
    window.playNow = function(btn) {
        const trackObj = btn.closest('.track-card').trackObj;
        queue = [trackObj];
        currentIndex = 0;
        renderQueue();
        playQueueItem(0);
    };
    
    window.addToQueue = function(btn) {
        const trackObj = btn.closest('.track-card').trackObj;
        queue.push(trackObj);
        renderQueue();
        if (currentIndex === -1) {
            currentIndex = 0;
            playQueueItem(0);
        }
    };

    function renderQueue() {
        if (queue.length === 0) {
            queueList.innerHTML = `
                <div class="empty-queue">
                    <p>Queue is empty.</p>
                    <p class="sub-text">Search and add songs to play next!</p>
                </div>
            `;
            return;
        }
        
        queueList.innerHTML = '';
        queue.forEach((track, idx) => {
            const item = document.createElement('div');
            item.className = 'queue-item' + (idx === currentIndex ? ' active' : '');
            item.innerHTML = `
                <img src="${track.thumbnail}" alt="thumb" class="queue-item-thumb">
                <div class="queue-item-info">
                    <div class="queue-item-title">${track.title}</div>
                    <div class="queue-item-artist">${track.artist}</div>
                </div>
                <button class="queue-item-remove" onclick="event.stopPropagation(); window.removeFromQueue(${idx})">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
            item.addEventListener('click', () => {
                currentIndex = idx;
                renderQueue();
                playQueueItem(idx);
            });
            queueList.appendChild(item);
        });
    }
    
    window.removeFromQueue = function(idx) {
        queue.splice(idx, 1);
        if (currentIndex > idx) currentIndex--;
        else if (currentIndex === idx) {
            if (queue.length > 0) {
                if (currentIndex >= queue.length) currentIndex = 0;
                playQueueItem(currentIndex);
            } else {
                currentIndex = -1;
                audioPlayer.pause();
                audioPlayer.src = '';
                playerTitle.textContent = 'No track selected';
                playerArtist.textContent = 'Search to play';
            }
        }
        renderQueue();
    };

    async function playQueueItem(idx) {
        if (idx < 0 || idx >= queue.length) return;
        const track = queue[idx];
        
        // Update UI
        playerTitle.textContent = track.title;
        playerArtist.textContent = track.artist;
        playerThumb.src = track.thumbnail;
        playPauseBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        
        try {
            let streamUrl = track.query;
            // If it's a Spotify text query, resolve to youtube link first
            if (!streamUrl.includes('youtube.com') && !streamUrl.includes('youtu.be')) {
                const response = await fetch(`/api/search?q=${encodeURIComponent(track.query)}`);
                const json = await response.json();
                if (json.status === 'success' && json.data) {
                    const found = Array.isArray(json.data) ? json.data[0] : json.data;
                    streamUrl = found.link || found.url;
                } else {
                    throw new Error("Could not find song on YouTube");
                }
            }
            
            // Initiate stream download/playback
            audioPlayer.src = `/api/stream?url=${encodeURIComponent(streamUrl)}`;
            audioPlayer.play();
        } catch (error) {
            console.error('Playback error:', error);
            // Skip to next if failed
            playNext();
        }
    }
    
    function playNext() {
        if (currentIndex < queue.length - 1) {
            currentIndex++;
            renderQueue();
            playQueueItem(currentIndex);
        } else {
            // End of queue
            playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    }

    // Audio Event Listeners
    audioPlayer.addEventListener('play', () => {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    });

    audioPlayer.addEventListener('pause', () => {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    });

    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('loadedmetadata', () => {
        totalTimeEl.textContent = formatTime(audioPlayer.duration);
    });
    audioPlayer.addEventListener('ended', () => {
        playNext();
    });
    
    // Add skip next/prev buttons listeners
    const controlBtns = document.querySelectorAll('.control-btn');
    if(controlBtns.length >= 3) {
        controlBtns[0].addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                renderQueue();
                playQueueItem(currentIndex);
            }
        });
        controlBtns[2].addEventListener('click', () => {
            playNext();
        });
    }

    // Play/Pause toggle
    playPauseBtn.addEventListener('click', () => {
        if (!audioPlayer.src) return;
        if (audioPlayer.paused) {
            audioPlayer.play();
        } else {
            audioPlayer.pause();
        }
    });

    // Progress bar click
    progressBarBg.addEventListener('click', (e) => {
        if (!audioPlayer.src || !audioPlayer.duration) return;
        const rect = progressBarBg.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        audioPlayer.currentTime = pos * audioPlayer.duration;
    });

    // Volume slider click
    volumeSlider.addEventListener('click', (e) => {
        const rect = volumeSlider.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        audioPlayer.volume = pos;
        volumeFill.style.width = `${pos * 100}%`;
    });

    function updateProgress() {
        const { currentTime, duration } = audioPlayer;
        if (isNaN(duration)) return;
        
        const progressPercent = (currentTime / duration) * 100;
        progressBarFill.style.width = `${progressPercent}%`;
        currentTimeEl.textContent = formatTime(currentTime);
    }

    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }
});
