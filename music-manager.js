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
    
    // Load user data first
    this.loadUserData();
    
    // Load music library
    await this.loadMusicLibrary();
    console.log('Music library loaded:', this.musicLibrary.length, 'songs');
    
    // Setup everything
    this.setupEventListeners();
    this.renderMusicGrid();
    this.buildSearchIndex();
    
    // Wait for music player to be ready
    await this.waitForMusicPlayer();
    
    // Test notification
    setTimeout(() => {
      this.showNotification('Music app ready!', 'success', 2000);
    }, 1000);
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
        id: 'na_jatta_na',
        title: 'Na Jatta Na',
        artist: 'Unknown Artist',
        duration: '3:45',
        file: 'assets/audio/na_jatta_na.mp3',
        artwork: 'assets/images/music-placeholder.jpg'
      },
      {
        id: 'blender',
        title: 'Blender',
        artist: 'Your Artist',
        duration: '4:12',
        file: 'assets/audio/Blender.mp3',
        artwork: 'assets/images/music-placeholder.jpg'
      }
    ];
    
    // Add IDs to existing tracks if they don't have them
    this.musicLibrary.forEach((track, index) => {
      if (!track.id) {
        track.id = `track_${index}_${Date.now()}`;
      }
    });
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

  // Set current track with validation
  setCurrentTrack(index) {
    if (index >= 0 && index < this.musicLibrary.length) {
      this.currentTrackIndex = index;
      const track = this.musicLibrary[index];
      if (track) {
        this.addToRecentlyPlayed(track);
        this.incrementPlayCount(track.id);
        return track;
      }
    }
    console.warn('Invalid track index:', index);
    return null;
  }
  
  // Add to recently played
  addToRecentlyPlayed(track) {
    if (!this.recentlyPlayed) {
      this.recentlyPlayed = [];
    }
    
    // Remove if already exists
    this.recentlyPlayed = this.recentlyPlayed.filter(t => t.id !== track.id);
    
    // Add to beginning
    this.recentlyPlayed.unshift(track);
    
    // Keep only last 20
    this.recentlyPlayed = this.recentlyPlayed.slice(0, 20);
  }
  
  // Increment play count
  incrementPlayCount(trackId) {
    if (!this.playCounts) {
      this.playCounts = {};
    }
    this.playCounts[trackId] = (this.playCounts[trackId] || 0) + 1;
  }

  // Get next track with proper error handling
  getNextTrack() {
    if (this.musicLibrary.length === 0) {
      console.warn('No tracks in library');
      return null;
    }
    
    if (this.isShuffled && this.shuffledIndices.length > 0) {
      const currentShuffledIndex = this.shuffledIndices.indexOf(this.currentTrackIndex);
      const nextShuffledIndex = (currentShuffledIndex + 1) % this.shuffledIndices.length;
      const track = this.musicLibrary[this.shuffledIndices[nextShuffledIndex]];
      if (track) {
        this.currentTrackIndex = this.shuffledIndices[nextShuffledIndex];
        return track;
      }
    } else {
      const nextIndex = (this.currentTrackIndex + 1) % this.musicLibrary.length;
      const track = this.musicLibrary[nextIndex];
      if (track) {
        this.currentTrackIndex = nextIndex;
        return track;
      }
    }
    
    console.warn('No next track available');
    return null;
  }

  // Get previous track with proper error handling
  getPreviousTrack() {
    if (this.musicLibrary.length === 0) {
      console.warn('No tracks in library');
      return null;
    }
    
    if (this.isShuffled && this.shuffledIndices.length > 0) {
      const currentShuffledIndex = this.shuffledIndices.indexOf(this.currentTrackIndex);
      const prevShuffledIndex = currentShuffledIndex === 0 ? 
        this.shuffledIndices.length - 1 : currentShuffledIndex - 1;
      const track = this.musicLibrary[this.shuffledIndices[prevShuffledIndex]];
      if (track) {
        this.currentTrackIndex = this.shuffledIndices[prevShuffledIndex];
        return track;
      }
    } else {
      const prevIndex = this.currentTrackIndex === 0 ? 
        this.musicLibrary.length - 1 : this.currentTrackIndex - 1;
      const track = this.musicLibrary[prevIndex];
      if (track) {
        this.currentTrackIndex = prevIndex;
        return track;
      }
    }
    
    console.warn('No previous track available');
    return null;
  }

  // Shuffle management
  toggleShuffle() {
    this.isShuffled = !this.isShuffled;
    if (this.isShuffled) {
      this.generateShuffledIndices();
    }
    this.saveUserData();
    
    // Show notification
    const message = this.isShuffled ? 'Shuffle enabled' : 'Shuffle disabled';
    this.showNotification(message, 'info', 2000);
    
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
    
    // Show notification
    const message = this.isRepeating ? 'Repeat enabled' : 'Repeat disabled';
    this.showNotification(message, 'info', 2000);
    
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
      theme: 'dark',
      fadeInOut: true,
      pauseOnCall: true,
      lowerOnNotification: true
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
  
  saveSettingsToStorage() {
    this.saveSettings();
  }
  
  saveUserData() {
    try {
      const userData = {
        recentlyPlayed: this.recentlyPlayed || [],
        playCounts: this.playCounts || {},
        isShuffled: this.isShuffled,
        isRepeating: this.isRepeating,
        currentTrackIndex: this.currentTrackIndex
      };
      localStorage.setItem('musicUserData', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }
  
  loadUserData() {
    try {
      const saved = localStorage.getItem('musicUserData');
      if (saved) {
        const userData = JSON.parse(saved);
        this.recentlyPlayed = userData.recentlyPlayed || [];
        this.playCounts = userData.playCounts || {};
        this.isShuffled = userData.isShuffled || false;
        this.isRepeating = userData.isRepeating || false;
        this.currentTrackIndex = userData.currentTrackIndex || -1;
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }
  
  saveMusicLibrary() {
    try {
      const libraryData = {
        songs: this.musicLibrary,
        settings: {
          defaultArtwork: 'assets/images/music-placeholder.jpg'
        }
      };
      localStorage.setItem('musicLibrary', JSON.stringify(libraryData));
    } catch (error) {
      console.error('Error saving music library:', error);
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
    // Enhanced event handling with better error management
    const musicGrid = document.getElementById('musicGrid');
    if (!musicGrid) return;

    // Use event delegation for better performance and reliability
    musicGrid.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Find the closest music item
      const musicItem = e.target.closest('.music-item');
      if (!musicItem) return;
      
      const songIndex = parseInt(musicItem.dataset.songIndex);
      const song = this.musicLibrary[songIndex];
      
      if (!song) {
        console.error('Song not found at index:', songIndex);
        this.showNotification('Song not found', 'error', 3000);
        return;
      }
      
      // Check if file exists
      const fileExists = await this.checkFileExists(song.file);
      if (!fileExists) {
        console.error('Audio file not found:', song.file);
        this.showNotification(`Audio file not found: ${song.title}`, 'error', 4000);
        return;
      }
      
      console.log('Song clicked:', song.title);
      
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
          this.showNotification(`Now playing: ${song.title}`, 'playing', 0, { persistent: true });
        } catch (error) {
          console.error('Error playing song:', error);
          this.showNotification(`Failed to play: ${song.title}`, 'error', 4000);
        }
      } else {
        console.error('Music player not available after waiting');
        this.showNotification('Music player not ready', 'error', 4000);
      }
    });
  }
  
  // Check if audio file exists
  async checkFileExists(filePath) {
    if (!filePath) return false;
    
    // Use error handler if available
    if (window.musicErrorHandler) {
      return await window.musicErrorHandler.checkFileExists(filePath);
    }
    
    // Fallback validation
    return window.musicErrorHandler?.validateAudioFile(filePath) || 
           filePath.includes('.mp3');
  }
  
  // Enhanced track playing with better error handling
  async playTrack(track) {
    if (!track) {
      this.showNotification('No track selected', 'error', 3000);
      return;
    }
    
    const fileExists = await this.checkFileExists(track.file);
    if (!fileExists) {
      this.showNotification(`Audio file not found: ${track.title}`, 'error', 4000);
      return;
    }
    
    this.currentTrackIndex = this.musicLibrary.findIndex(t => t.id === track.id || t.title === track.title);
    
    if (window.musicPlayer) {
      try {
        await window.musicPlayer.playSong(track);
        this.showNotification(`Now playing: ${track.title}`, 'playing', 0, { persistent: true });
      } catch (error) {
        console.error('Error playing track:', error);
        this.showNotification(`Failed to play: ${track.title}`, 'error', 4000);
      }
    }
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

  // Enhanced notification system with mobile controls
  showNotification(message, type = 'info', duration = 3000, options = {}) {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type} ${options.persistent ? 'persistent' : ''}`;
    
    const icons = {
      success: '🎵',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️',
      playing: '▶️',
      paused: '⏸️'
    };

    // Check if mobile
    const isMobile = window.innerWidth <= 768;
    const currentTrack = this.getCurrentTrack();
    
    if (isMobile && (type === 'playing' || type === 'paused') && currentTrack) {
      // Mobile music notification with controls - matching your design
      notification.innerHTML = `
        <div class="notification-header">
          <div class="notification-title">${icons[type] || icons.info} Our Music</div>
          <button class="notification-close">×</button>
        </div>
        <div class="notification-message">${message}</div>
        <div class="notification-controls">
          <button class="notification-btn prev-btn" title="Previous">⏮</button>
          <button class="notification-btn play-pause-btn" title="Play/Pause">${window.musicPlayer?.isPlaying ? '⏸' : '▶'}</button>
          <button class="notification-btn next-btn" title="Next">⏭</button>
        </div>
        <div class="notification-progress"></div>
      `;
      
      // Add control functionality
      const prevBtn = notification.querySelector('.prev-btn');
      const playPauseBtn = notification.querySelector('.play-pause-btn');
      const nextBtn = notification.querySelector('.next-btn');
      
      prevBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.musicPlayer) {
          window.musicPlayer.previousTrack();
          this.updateNotificationControls(notification);
        }
      });
      
      playPauseBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.musicPlayer) {
          window.musicPlayer.togglePlayPause();
          this.updateNotificationControls(notification);
        }
      });
      
      nextBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.musicPlayer) {
          window.musicPlayer.nextTrack();
          this.updateNotificationControls(notification);
        }
      });
      
      // Make notification persistent for music controls
      notification.classList.add('persistent');
      duration = 0; // Don't auto-remove music notifications
    } else {
      // Regular notification
      notification.innerHTML = `
        <div class="notification-header">
          <div class="notification-title">${icons[type] || icons.info} Our Music</div>
          <button class="notification-close">×</button>
        </div>
        <div class="notification-message">${message}</div>
        <div class="notification-progress"></div>
      `;
    }

    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      this.removeNotification(notification);
    });

    // Auto remove after duration (unless persistent)
    let autoRemoveTimer = null;
    if (duration > 0) {
      autoRemoveTimer = setTimeout(() => {
        this.removeNotification(notification);
      }, duration);
    }

    // Store timer reference for manual close
    notification.autoRemoveTimer = autoRemoveTimer;

    container.appendChild(notification);

    // Smooth entrance animation
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
      notification.style.opacity = '1';
    }, 10);
    
    return notification;
  }
  
  updateNotificationControls(notification) {
    const playPauseBtn = notification.querySelector('.play-pause-btn');
    if (playPauseBtn && window.musicPlayer) {
      playPauseBtn.textContent = window.musicPlayer.isPlaying ? '⏸' : '▶';
    }
  }

  removeNotification(notification) {
    if (notification && notification.parentNode) {
      // Clear auto-remove timer if manually closed
      if (notification.autoRemoveTimer) {
        clearTimeout(notification.autoRemoveTimer);
      }
      
      // Smooth exit animation
      notification.style.transform = 'translateX(100%)';
      notification.style.opacity = '0';
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 400);
    }
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