// Music Manager - Handles music library for static website
class MusicManager {
  constructor() {
    this.musicLibrary = [];
    this.searchIndex = new Map();
    this.currentTrackIndex = -1;
    this.isShuffled = false;
    this.isRepeating = false;
    this.shuffledIndices = [];
    this.settings = this.loadSettings();
    this.init();
  }

  async init() {
    console.log('Initializing Music Manager...');
    await this.loadMusicLibrary();
    console.log('Music library loaded:', this.musicLibrary.length, 'songs');
    this.setupEventListeners();
    this.renderMusicGrid();
    this.buildSearchIndex();
    
    // Wait for music player to be ready
    await this.waitForMusicPlayer();
  }

  async waitForMusicPlayer() {
    return new Promise((resolve) => {
      if (window.musicPlayer) {
        console.log('Music player ready');
        resolve();
        return;
      }
      
      const checkPlayer = setInterval(() => {
        if (window.musicPlayer) {
          console.log('Music player ready');
          clearInterval(checkPlayer);
          resolve();
        }
      }, 100);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkPlayer);
        if (!window.musicPlayer) {
          console.error('Music player failed to load');
        }
        resolve();
      }, 5000);
    });
  }

  async loadMusicLibrary() {
    try {
      const response = await fetch('data/music-library.json');
      if (response.ok) {
        const data = await response.json();
        this.musicLibrary = data.songs || [];
        console.log(`Loaded ${this.musicLibrary.length} songs from library`);
      } else {
        console.warn('Music library file not found, using default tracks');
        this.createDefaultLibrary();
      }
    } catch (error) {
      console.error('Error loading music library:', error);
      this.createDefaultLibrary();
    }
  }

  createDefaultLibrary() {
    this.musicLibrary = [
      {
        title: 'Na Jatta Na',
        artist: 'Unknown Artist',
        duration: '3:45',
        file: 'assets/audio/na_jatta_na.mp3',
        artwork: 'assets/images/music-placeholder.jpg'
      }
    ];
  }


  buildSearchIndex() {
    this.searchIndex.clear();
    this.musicLibrary.forEach((song, index) => {
      const searchTerms = [
        (song.title || '').toLowerCase(),
        (song.artist || '').toLowerCase()
      ].join(' ');
      
      // Create index for each word
      searchTerms.split(' ').forEach(term => {
        if (term.length > 0) {
          if (!this.searchIndex.has(term)) {
            this.searchIndex.set(term, []);
          }
          this.searchIndex.get(term).push(index);
        }
      });
    });
  }

  // Instant search with single key press
  searchSongs(query) {
    if (!query || query.trim().length === 0) {
      return this.musicLibrary;
    }

    const searchTerm = query.toLowerCase().trim();
    const results = new Set();

    // Search in title, artist, album, genre
    this.musicLibrary.forEach((song, index) => {
      const searchableText = [
        song.title,
        song.artist,
        song.album,
        song.genre
      ].join(' ').toLowerCase();

      if (searchableText.includes(searchTerm)) {
        results.add(song);
      }
    });

    // Also search in search index for partial matches
    this.searchIndex.forEach((indices, term) => {
      if (term.includes(searchTerm) || searchTerm.includes(term)) {
        indices.forEach(index => {
          results.add(this.musicLibrary[index]);
        });
      }
    });

    return Array.from(results);
  }






  // Get song by title
  getSongByTitle(title) {
    return this.musicLibrary.find(song => song.title === title);
  }

  // Get current track
  getCurrentTrack() {
    if (this.currentTrackIndex >= 0 && this.currentTrackIndex < this.musicLibrary.length) {
      return this.musicLibrary[this.currentTrackIndex];
    }
    return null;
  }

  // Set current track
  setCurrentTrack(index) {
    if (index >= 0 && index < this.musicLibrary.length) {
      this.currentTrackIndex = index;
      const track = this.musicLibrary[index];
      this.addToRecentlyPlayed(track);
      this.incrementPlayCount(track.id);
      return track;
    }
    return null;
  }

  // Get next track
  getNextTrack() {
    if (this.isShuffled && this.shuffledIndices.length > 0) {
      const currentShuffledIndex = this.shuffledIndices.indexOf(this.currentTrackIndex);
      const nextShuffledIndex = (currentShuffledIndex + 1) % this.shuffledIndices.length;
      return this.musicLibrary[this.shuffledIndices[nextShuffledIndex]];
    } else {
      const nextIndex = (this.currentTrackIndex + 1) % this.musicLibrary.length;
      return this.musicLibrary[nextIndex];
    }
  }

  // Get previous track
  getPreviousTrack() {
    if (this.isShuffled && this.shuffledIndices.length > 0) {
      const currentShuffledIndex = this.shuffledIndices.indexOf(this.currentTrackIndex);
      const prevShuffledIndex = currentShuffledIndex === 0 ? 
        this.shuffledIndices.length - 1 : currentShuffledIndex - 1;
      return this.musicLibrary[this.shuffledIndices[prevShuffledIndex]];
    } else {
      const prevIndex = this.currentTrackIndex === 0 ? 
        this.musicLibrary.length - 1 : this.currentTrackIndex - 1;
      return this.musicLibrary[prevIndex];
    }
  }

  // Shuffle management
  toggleShuffle() {
    this.isShuffled = !this.isShuffled;
    if (this.isShuffled) {
      this.generateShuffledIndices();
    }
    this.saveUserData();
    return this.isShuffled;
  }

  generateShuffledIndices() {
    this.shuffledIndices = [...Array(this.musicLibrary.length).keys()];
    for (let i = this.shuffledIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.shuffledIndices[i], this.shuffledIndices[j]] = [this.shuffledIndices[j], this.shuffledIndices[i]];
    }
  }

  // Repeat management
  toggleRepeat() {
    this.isRepeating = !this.isRepeating;
    this.saveUserData();
    return this.isRepeating;
  }

  // Settings management
  loadSettings() {
    const defaultSettings = {
      volume: 0.7,
      crossfade: false,
      crossfadeDuration: 3,
      autoPlay: true,
      showNotifications: true,
      theme: 'dark'
    };

    try {
      const saved = localStorage.getItem('musicSettings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return defaultSettings;
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('musicSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  // User data management

  // Render music grid
  renderMusicGrid(songs = null) {
    const grid = document.getElementById('musicGrid');
    if (!grid) return;

    const songsToRender = songs || this.musicLibrary;
    
    if (songsToRender.length === 0) {
      grid.innerHTML = `
        <div class="no-music">
          <div class="no-music-icon">🎵</div>
          <h3>No music found</h3>
          <p>Add your songs to the <code>assets/audio/</code> directory and update <code>data/music-library.json</code></p>
        </div>
      `;
      return;
    }

    grid.innerHTML = songsToRender.map((song, index) => `
      <div class="music-item" data-song-index="${index}">
        <div class="music-artwork">
          <div class="artwork-placeholder">
            <span class="placeholder-icon">🎵</span>
          </div>
          <div class="play-overlay">
            <button class="play-btn" data-song-index="${index}">▶</button>
          </div>
        </div>
        <div class="music-info">
          <h3 class="music-title">${song.title}</h3>
          <p class="music-artist">${song.artist}</p>
          <div class="music-meta">
            <span class="music-duration">${song.duration}</span>
          </div>
        </div>
      </div>
    `).join('');

    this.setupMusicItemEvents();
  }

  setupMusicItemEvents() {
    // Remove existing event listeners to prevent duplicates
    document.querySelectorAll('.play-btn').forEach(btn => {
      btn.replaceWith(btn.cloneNode(true));
    });
    
    document.querySelectorAll('.music-item').forEach(item => {
      item.replaceWith(item.cloneNode(true));
    });

    // Play button events
    document.querySelectorAll('.play-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const songIndex = parseInt(btn.dataset.songIndex);
        const song = this.musicLibrary[songIndex];
        console.log('Play button clicked:', song);
        
        if (song) {
          this.currentTrackIndex = songIndex;
          
          // Wait for music player if not ready
          if (!window.musicPlayer) {
            console.log('Waiting for music player...');
            await this.waitForMusicPlayer();
          }
          
          if (window.musicPlayer) {
            try {
              await window.musicPlayer.playSong(song);
              console.log('Song playing successfully');
            } catch (error) {
              console.error('Error playing song:', error);
            }
          } else {
            console.error('Music player not available after waiting');
          }
        }
      });
    });

    // Music item click events
    document.querySelectorAll('.music-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        if (!e.target.closest('.play-btn')) {
          e.preventDefault();
          const songIndex = parseInt(item.dataset.songIndex);
          const song = this.musicLibrary[songIndex];
          console.log('Music item clicked:', song);
          
          if (song) {
            this.currentTrackIndex = songIndex;
            
            // Wait for music player if not ready
            if (!window.musicPlayer) {
              console.log('Waiting for music player...');
              await this.waitForMusicPlayer();
            }
            
            if (window.musicPlayer) {
              try {
                await window.musicPlayer.playSong(song);
                console.log('Song playing successfully');
              } catch (error) {
                console.error('Error playing song:', error);
              }
            } else {
              console.error('Music player not available after waiting');
            }
          }
        }
      });
    });
  }

  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        const results = this.searchSongs(query);
        this.renderMusicGrid(results);
      });
    }

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = e.target.dataset.filter;
        this.applyFilter(filter);
      });
    });
  }

  applyFilter(filter) {
    // Since we only have songs now, just show all
    this.renderMusicGrid(this.musicLibrary);
  }

  updateFilterButtons(activeFilter) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === activeFilter);
    });
  }

  // Public API methods
  getLibrary() {
    return this.musicLibrary;
  }

  getLibraryStats() {
    return {
      totalSongs: this.musicLibrary.length,
      totalArtists: this.artists.size,
      totalAlbums: this.albums.size,
      totalGenres: this.genres.size,
      totalFavorites: this.favorites.size,
      totalRecentlyPlayed: this.recentlyPlayed.length
    };
  }
}

// Initialize music manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.musicManager = new MusicManager();
});