// Advanced Music Player with Spotify-like features
class MusicPlayer {
  constructor() {
    this.audio = document.getElementById('audioPlayer');
    this.isPlaying = false;
    this.currentVolume = 0.7;
    this.isMuted = false;
    this.previousVolume = 0.7;
    this.isFading = false;
    this.callActive = false;
    this.notificationActive = false;
    this.fadeTimer = null;
    this.init();
  }

  init() {
    this.setupAudioElement();
    this.setupEventListeners();
    this.setupCallDetection();
    this.setupNotificationDetection();
    this.updateUI();
  }

  setupAudioElement() {
    if (!this.audio) {
      console.error('Audio element not found');
      return;
    }

    this.audio.volume = this.currentVolume;
    this.audio.preload = 'metadata';
  }

  setupEventListeners() {
    // Audio events
    this.audio.addEventListener('loadstart', () => this.onLoadStart());
    this.audio.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
    this.audio.addEventListener('canplay', () => this.onCanPlay());
    this.audio.addEventListener('play', () => this.onPlay());
    this.audio.addEventListener('pause', () => this.onPause());
    this.audio.addEventListener('ended', () => this.onEnded());
    this.audio.addEventListener('error', (e) => this.onError(e));
    this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
    this.audio.addEventListener('durationchange', () => this.onDurationChange());

    // Player controls
    const playPauseBtn = document.getElementById('playPauseBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const repeatBtn = document.getElementById('repeatBtn');
    const volumeBtn = document.getElementById('volumeBtn');
    const likeBtn = document.getElementById('likeBtn');
    const progressBar = document.querySelector('.progress-bar');
    const volumeSlider = document.querySelector('.volume-slider');

    playPauseBtn?.addEventListener('click', () => this.togglePlayPause());
    prevBtn?.addEventListener('click', () => this.previousTrack());
    nextBtn?.addEventListener('click', () => this.nextTrack());
    shuffleBtn?.addEventListener('click', () => this.toggleShuffle());
    repeatBtn?.addEventListener('click', () => this.toggleRepeat());
    volumeBtn?.addEventListener('click', () => this.toggleMute());
    likeBtn?.addEventListener('click', () => this.toggleLike());
    progressBar?.addEventListener('click', (e) => this.seekTo(e));
    volumeSlider?.addEventListener('click', (e) => this.setVolumeFromSlider(e));

    // Artwork click to play/pause
    const artwork = document.querySelector('.track-artwork');
    artwork?.addEventListener('click', () => this.togglePlayPause());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Progress bar drag
    this.setupProgressBarDrag();
    this.setupVolumeSliderDrag();
  }

  setupProgressBarDrag() {
    const progressBar = document.querySelector('.progress-bar');
    const progressHandle = document.getElementById('progressHandle');
    let isDragging = false;

    progressHandle?.addEventListener('mousedown', (e) => {
      isDragging = true;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging && progressBar) {
        const rect = progressBar.getBoundingClientRect();
        const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        this.seekToPercentage(percentage);
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  setupVolumeSliderDrag() {
    const volumeSlider = document.querySelector('.volume-slider');
    const volumeHandle = document.getElementById('volumeHandle');
    let isDragging = false;

    volumeHandle?.addEventListener('mousedown', (e) => {
      isDragging = true;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging && volumeSlider) {
        const rect = volumeSlider.getBoundingClientRect();
        const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        this.setVolume(percentage);
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  setupCallDetection() {
    // Detect incoming calls (simplified implementation)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.isPlaying) {
        this.simulateCallDetection();
      }
    });

    window.addEventListener('focus', () => {
      if (this.callActive) {
        this.endCall();
      }
    });
  }

  setupNotificationDetection() {
    // Monitor for notifications
    if ('Notification' in window) {
      const originalShow = Notification.prototype.show;
      Notification.prototype.show = () => {
        this.handleNotification();
        return originalShow.apply(this, arguments);
      };
    }

    // Simulate notification detection
    document.addEventListener('click', (e) => {
      if (e.target.matches('.notification, .notification *')) {
        this.handleNotification();
      }
    });
  }

  async loadTrack(track) {
    if (!track || !this.audio) {
      console.error('No track or audio element:', { track, audio: this.audio });
      return;
    }

    try {
      console.log('Loading track:', track.file);
      // Use track.file instead of track.src for our simplified structure
      this.audio.src = track.file;
      this.updateTrackInfo(track);
      
      // Load the audio
      await this.audio.load();
      console.log('Audio loaded successfully');
      
      // Update duration in library if not set
      if (track.duration === 0 || !track.duration) {
        this.audio.addEventListener('loadedmetadata', () => {
          track.duration = this.audio.duration;
          if (window.musicManager) {
            window.musicManager.saveMusicLibrary();
          }
        }, { once: true });
      }

    } catch (error) {
      console.error('Error loading track:', error);
      this.showError('Failed to load track');
    }
  }

  async play() {
    if (!this.audio.src) return;

    try {
      // Apply fade in if enabled
      if (window.musicManager?.settings.fadeInOut) {
        await this.fadeIn();
      } else {
        this.audio.volume = this.currentVolume;
      }

      await this.audio.play();
      this.isPlaying = true;
      this.updateUI();
      
    } catch (error) {
      console.error('Error playing audio:', error);
      this.showError('Failed to play audio');
    }
  }

  pause() {
    if (!this.audio.src) return;

    if (window.musicManager?.settings.fadeInOut) {
      this.fadeOut(() => {
        this.audio.pause();
        this.isPlaying = false;
        this.updateUI();
      });
    } else {
      this.audio.pause();
      this.isPlaying = false;
      this.updateUI();
    }
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.isPlaying = false;
    this.updateUI();
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  previousTrack() {
    if (!window.musicManager) return;
    
    const prevTrack = window.musicManager.getPreviousTrack();
    if (prevTrack) {
      window.musicManager.currentTrackIndex = window.musicManager.musicLibrary.findIndex(t => t.id === prevTrack.id);
      this.loadTrack(prevTrack);
      this.play();
    }
  }

  nextTrack() {
    if (!window.musicManager) return;
    
    const nextTrack = window.musicManager.getNextTrack();
    if (nextTrack) {
      window.musicManager.currentTrackIndex = window.musicManager.musicLibrary.findIndex(t => t.id === nextTrack.id);
      this.loadTrack(nextTrack);
      this.play();
    }
  }

  toggleShuffle() {
    if (!window.musicManager) return;
    
    const isShuffled = window.musicManager.toggleShuffle();
    const shuffleBtn = document.getElementById('shuffleBtn');
    shuffleBtn?.classList.toggle('active', isShuffled);
  }

  toggleRepeat() {
    if (!window.musicManager) return;
    
    const isRepeating = window.musicManager.toggleRepeat();
    const repeatBtn = document.getElementById('repeatBtn');
    repeatBtn?.classList.toggle('active', isRepeating);
  }

  setVolume(volume) {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    this.audio.volume = this.currentVolume;
    
    // Update volume slider
    const volumeFill = document.getElementById('volumeFill');
    const volumeHandle = document.getElementById('volumeHandle');
    if (volumeFill) volumeFill.style.width = (this.currentVolume * 100) + '%';
    if (volumeHandle) volumeHandle.style.left = (this.currentVolume * 100) + '%';
    
    // Update volume button
    const volumeBtn = document.getElementById('volumeBtn');
    if (volumeBtn) {
      if (this.currentVolume === 0) {
        volumeBtn.textContent = '🔇';
      } else if (this.currentVolume < 0.5) {
        volumeBtn.textContent = '🔉';
      } else {
        volumeBtn.textContent = '🔊';
      }
    }
  }

  setVolumeFromSlider(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    this.setVolume(percentage);
  }

  toggleMute() {
    if (this.isMuted) {
      this.setVolume(this.previousVolume);
      this.isMuted = false;
    } else {
      this.previousVolume = this.currentVolume;
      this.setVolume(0);
      this.isMuted = true;
    }
  }

  toggleLike() {
    if (!window.musicManager) return;
    
    const currentTrack = window.musicManager.getCurrentTrack();
    if (currentTrack) {
      window.musicManager.toggleFavorite(currentTrack.id);
    }
  }

  seekTo(event) {
    if (!this.audio.duration) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    this.seekToPercentage(percentage);
  }

  seekToPercentage(percentage) {
    if (!this.audio.duration) return;
    
    const newTime = percentage * this.audio.duration;
    this.audio.currentTime = newTime;
  }

  fadeIn(duration = 1000) {
    return new Promise((resolve) => {
      if (this.isFading) return resolve();
      
      this.isFading = true;
      this.audio.volume = 0;
      
      const steps = 20;
      const stepDuration = duration / steps;
      const volumeStep = this.currentVolume / steps;
      
      let currentStep = 0;
      const fadeInterval = setInterval(() => {
        currentStep++;
        this.audio.volume = Math.min(this.currentVolume, volumeStep * currentStep);
        
        if (currentStep >= steps) {
          clearInterval(fadeInterval);
          this.isFading = false;
          resolve();
        }
      }, stepDuration);
    });
  }

  fadeOut(callback, duration = 1000) {
    if (this.isFading) return;
    
    this.isFading = true;
    const startVolume = this.audio.volume;
    
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = startVolume / steps;
    
    let currentStep = 0;
    const fadeInterval = setInterval(() => {
      currentStep++;
      this.audio.volume = Math.max(0, startVolume - (volumeStep * currentStep));
      
      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        this.isFading = false;
        if (callback) callback();
      }
    }, stepDuration);
  }

  simulateCallDetection() {
    setTimeout(() => {
      if (this.isPlaying && !this.callActive) {
        this.handleCall();
      }
    }, 2000);
  }

  handleCall() {
    if (!window.musicManager?.settings.pauseOnCall) return;
    
    this.callActive = true;
    
    if (this.isPlaying) {
      this.pause();
    }
    
    this.showNotification('📞 Call detected - Music paused', 'info');
  }

  endCall() {
    this.callActive = false;
    this.showNotification('📞 Call ended', 'info');
  }

  handleNotification() {
    if (!window.musicManager?.settings.lowerOnNotification) return;
    
    this.notificationActive = true;
    const reductionPercent = 0.3; // 30% reduction
    const reducedVolume = this.currentVolume * (1 - reductionPercent);
    
    this.audio.volume = reducedVolume;
    
    // Restore volume after 3 seconds
    setTimeout(() => {
      this.audio.volume = this.currentVolume;
      this.notificationActive = false;
    }, 3000);
  }

  updateTrackInfo(track) {
    const titleEl = document.getElementById('currentTitle');
    const artistEl = document.getElementById('currentArtist');
    const artworkEl = document.getElementById('currentArtwork');
    
    if (titleEl) titleEl.textContent = track.title || 'Unknown Title';
    if (artistEl) artistEl.textContent = track.artist || 'Unknown Artist';
    if (artworkEl) {
      // Don't try to load artwork, just show placeholder
      artworkEl.style.display = 'none';
      // Create a placeholder if it doesn't exist
      let placeholder = artworkEl.nextElementSibling;
      if (!placeholder || !placeholder.classList.contains('artwork-placeholder')) {
        placeholder = document.createElement('div');
        placeholder.className = 'artwork-placeholder';
        placeholder.innerHTML = '<span class="placeholder-icon">🎵</span>';
        artworkEl.parentNode.insertBefore(placeholder, artworkEl.nextSibling);
      }
      placeholder.style.display = 'flex';
    }
  }

  updateUI() {
    const playPauseBtn = document.getElementById('playPauseBtn');
    if (playPauseBtn) {
      playPauseBtn.textContent = this.isPlaying ? '⏸' : '▶';
    }
  }

  onLoadStart() {
    console.log('Audio loading started');
  }

  onLoadedMetadata() {
    console.log('Audio metadata loaded');
    this.updateDurationDisplay();
  }

  onCanPlay() {
    console.log('Audio can play');
  }

  onPlay() {
    this.isPlaying = true;
    this.updateUI();
  }

  onPause() {
    this.isPlaying = false;
    this.updateUI();
  }

  onEnded() {
    this.isPlaying = false;
    this.updateUI();
    
    if (window.musicManager?.isRepeating) {
      // Repeat current track
      this.audio.currentTime = 0;
      this.play();
    } else if (window.musicManager?.settings.autoPlay) {
      // Auto-play next track
      this.nextTrack();
    }
  }

  onError(event) {
    console.error('Audio error:', event);
    this.showError('Error playing audio');
  }

  onTimeUpdate() {
    this.updateProgressDisplay();
  }

  onDurationChange() {
    this.updateDurationDisplay();
  }

  updateProgressDisplay() {
    if (!this.audio.duration) return;
    
    const progress = (this.audio.currentTime / this.audio.duration) * 100;
    const progressFill = document.getElementById('progressFill');
    const progressHandle = document.getElementById('progressHandle');
    
    if (progressFill) {
      progressFill.style.width = progress + '%';
    }
    
    if (progressHandle) {
      progressHandle.style.left = progress + '%';
    }
    
    const currentTime = document.getElementById('currentTime');
    if (currentTime) {
      currentTime.textContent = this.formatTime(this.audio.currentTime);
    }
  }

  updateDurationDisplay() {
    const totalTime = document.getElementById('totalTime');
    if (totalTime && this.audio.duration) {
      totalTime.textContent = this.formatTime(this.audio.duration);
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  handleKeyboard(event) {
    // Prevent keyboard shortcuts when typing in inputs
    if (event.target.matches('input, textarea, select')) return;
    
    switch (event.code) {
      case 'Space':
        event.preventDefault();
        this.togglePlayPause();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.audio.currentTime = Math.max(0, this.audio.currentTime - 10);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.audio.currentTime = Math.min(this.audio.duration, this.audio.currentTime + 10);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.setVolume(Math.min(1, this.currentVolume + 0.1));
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.setVolume(Math.max(0, this.currentVolume - 0.1));
        break;
      case 'KeyN':
        event.preventDefault();
        this.nextTrack();
        break;
      case 'KeyP':
        event.preventDefault();
        this.previousTrack();
        break;
      case 'KeyM':
        event.preventDefault();
        this.toggleMute();
        break;
      case 'KeyL':
        event.preventDefault();
        this.toggleLike();
        break;
    }
  }

  showError(message) {
    if (window.musicManager) {
      window.musicManager.showNotification(message, 'error');
    }
  }

  showNotification(message, type = 'info') {
    if (window.musicManager) {
      window.musicManager.showNotification(message, type);
    }
  }

  // Public method to play a song (called from music manager)
  async playSong(song) {
    if (!song) {
      console.error('No song provided to playSong');
      return;
    }
    
    console.log('Playing song:', song);
    
    try {
      await this.loadTrack(song);
      await this.play();
      console.log('Song loaded and playing successfully');
    } catch (error) {
      console.error('Error playing song:', error);
      this.showError('Failed to play song');
    }
  }
}

// Initialize music player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing music player...');
  window.musicPlayer = new MusicPlayer();
  console.log('Music player initialized:', window.musicPlayer);
});
