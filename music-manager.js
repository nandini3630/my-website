// Music Manager - Handles music library for static website
class MusicManager {
  constructor() {
    this.musicLibrary = [];
    this.artists = new Map();
    this.albums = new Map();
    this.genres = new Map();
    this.favorites = new Set();
    this.recentlyPlayed = [];
    this.searchIndex = new Map();
    this.currentTrackIndex = -1;
    this.isShuffled = false;
    this.isRepeating = false;
    this.shuffledIndices = [];
    this.settings = this.loadSettings();
    this.init();
  }

  async init() {
    await this.loadMusicLibrary();
    this.setupEventListeners();
    this.renderMusicGrid();
    this.loadUserData();
    this.buildSearchIndex();
  }

  async loadMusicLibrary() {
    try {
      const response = await fetch('data/music-library.json');
      if (response.ok) {
        const data = await response.json();
        this.musicLibrary = data.library.songs || [];
        this.organizeLibrary();
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
        id: 'default_001',
        title: 'Our Song',
        artist: 'Unknown Artist',
        album: 'Love Collection',
        duration: '3:45',
        file: 'assets/audio/our-song.mp3',
        artwork: 'assets/images/music-placeholder.jpg',
        genre: 'Love',
        year: '2024',
        favorite: false,
        playCount: 0,
        lastPlayed: null
      }
    ];
    this.organizeLibrary();
  }

  organizeLibrary() {
    // Organize by artists, albums, and genres
    this.artists.clear();
    this.albums.clear();
    this.genres.clear();

    this.musicLibrary.forEach(song => {
      // Organize artists
      if (!this.artists.has(song.artist)) {
        this.artists.set(song.artist, []);
      }
      this.artists.get(song.artist).push(song);

      // Organize albums
      const albumKey = `${song.artist} - ${song.album}`;
      if (!this.albums.has(albumKey)) {
        this.albums.set(albumKey, []);
      }
      this.albums.get(albumKey).push(song);

      // Organize genres
      if (!this.genres.has(song.genre)) {
        this.genres.set(song.genre, []);
      }
      this.genres.get(song.genre).push(song);
    });
  }

  buildSearchIndex() {
    this.searchIndex.clear();
    this.musicLibrary.forEach((song, index) => {
      const searchTerms = [
        song.title.toLowerCase(),
        song.artist.toLowerCase(),
        song.album.toLowerCase(),
        song.genre.toLowerCase()
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

  // Favorites management
  toggleFavorite(songId) {
    if (this.favorites.has(songId)) {
      this.favorites.delete(songId);
    } else {
      this.favorites.add(songId);
    }
    this.saveUserData();
    return this.favorites.has(songId);
  }

  getFavorites() {
    return this.musicLibrary.filter(song => this.favorites.has(song.id));
  }

  // Recently played management
  addToRecentlyPlayed(song) {
    // Remove if already exists
    this.recentlyPlayed = this.recentlyPlayed.filter(s => s.id !== song.id);
    // Add to beginning
    this.recentlyPlayed.unshift(song);
    // Keep only last 20
    this.recentlyPlayed = this.recentlyPlayed.slice(0, 20);
    this.saveUserData();
  }

  getRecentlyPlayed() {
    return this.recentlyPlayed;
  }

  // Play count tracking
  incrementPlayCount(songId) {
    const song = this.musicLibrary.find(s => s.id === songId);
    if (song) {
      song.playCount = (song.playCount || 0) + 1;
      song.lastPlayed = new Date().toISOString();
      this.saveUserData();
    }
  }

  // Get most played songs
  getMostPlayed() {
    return this.musicLibrary
      .filter(song => song.playCount > 0)
      .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
      .slice(0, 20);
  }

  // Get songs by artist
  getSongsByArtist(artist) {
    return this.artists.get(artist) || [];
  }

  // Get songs by album
  getSongsByAlbum(albumKey) {
    return this.albums.get(albumKey) || [];
  }

  // Get songs by genre
  getSongsByGenre(genre) {
    return this.genres.get(genre) || [];
  }

  // Get all artists
  getAllArtists() {
    return Array.from(this.artists.keys()).sort();
  }

  // Get all albums
  getAllAlbums() {
    return Array.from(this.albums.keys()).sort();
  }

  // Get all genres
  getAllGenres() {
    return Array.from(this.genres.keys()).sort();
  }

  // Get song by ID
  getSongById(id) {
    return this.musicLibrary.find(song => song.id === id);
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
  loadUserData() {
    try {
      const savedFavorites = localStorage.getItem('musicFavorites');
      if (savedFavorites) {
        this.favorites = new Set(JSON.parse(savedFavorites));
      }

      const savedRecent = localStorage.getItem('musicRecentlyPlayed');
      if (savedRecent) {
        this.recentlyPlayed = JSON.parse(savedRecent);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  saveUserData() {
    try {
      localStorage.setItem('musicFavorites', JSON.stringify([...this.favorites]));
      localStorage.setItem('musicRecentlyPlayed', JSON.stringify(this.recentlyPlayed));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

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

    grid.innerHTML = songsToRender.map(song => `
      <div class="music-item" data-song-id="${song.id}">
        <div class="music-artwork">
          <img src="${song.artwork}" alt="${song.title}" onerror="this.src='assets/images/music-placeholder.jpg'">
          <div class="play-overlay">
            <button class="play-btn" data-song-id="${song.id}">▶</button>
          </div>
        </div>
        <div class="music-info">
          <h3 class="music-title">${song.title}</h3>
          <p class="music-artist">${song.artist}</p>
          <div class="music-meta">
            <span class="music-duration">${song.duration}</span>
            <button class="favorite-btn ${this.favorites.has(song.id) ? 'favorited' : ''}" 
                    data-song-id="${song.id}" title="Add to favorites">
              ${this.favorites.has(song.id) ? '❤️' : '🤍'}
            </button>
          </div>
        </div>
      </div>
    `).join('');

    this.setupMusicItemEvents();
  }

  setupMusicItemEvents() {
    // Play button events
    document.querySelectorAll('.play-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const songId = btn.dataset.songId;
        const song = this.getSongById(songId);
        if (song && window.musicPlayer) {
          window.musicPlayer.playSong(song);
        }
      });
    });

    // Favorite button events
    document.querySelectorAll('.favorite-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const songId = btn.dataset.songId;
        const isFavorited = this.toggleFavorite(songId);
        btn.textContent = isFavorited ? '❤️' : '🤍';
        btn.classList.toggle('favorited', isFavorited);
      });
    });

    // Music item click events
    document.querySelectorAll('.music-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.play-btn') && !e.target.closest('.favorite-btn')) {
          const songId = item.dataset.songId;
          const song = this.getSongById(songId);
          if (song && window.musicPlayer) {
            window.musicPlayer.playSong(song);
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
    let filteredSongs = [];

    switch (filter) {
      case 'all':
        filteredSongs = this.musicLibrary;
        break;
      case 'favorites':
        filteredSongs = this.getFavorites();
        break;
      case 'recent':
        filteredSongs = this.getRecentlyPlayed();
        break;
      case 'most-played':
        filteredSongs = this.getMostPlayed();
        break;
      default:
        filteredSongs = this.musicLibrary;
    }

    this.renderMusicGrid(filteredSongs);
    this.updateFilterButtons(filter);
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