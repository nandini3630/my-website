// Media Session API for Native Phone Notifications
class MediaSessionManager {
  constructor() {
    this.currentTrack = null;
    this.isPlaying = false;
    this.init();
  }

  init() {
    // Check if Media Session API is supported
    if ('mediaSession' in navigator) {
      this.setupMediaSession();
      console.log('Media Session API initialized');
    } else {
      console.warn('Media Session API not supported');
    }
  }

  setupMediaSession() {
    // Set up action handlers
    navigator.mediaSession.setActionHandler('play', () => {
      console.log('Media Session: Play requested');
      if (window.musicPlayer) {
        window.musicPlayer.play();
      }
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      console.log('Media Session: Pause requested');
      if (window.musicPlayer) {
        window.musicPlayer.pause();
      }
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      console.log('Media Session: Previous track requested');
      if (window.musicPlayer) {
        window.musicPlayer.previousTrack();
      }
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      console.log('Media Session: Next track requested');
      if (window.musicPlayer) {
        window.musicPlayer.nextTrack();
      }
    });

    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      console.log('Media Session: Seek backward requested', details);
      if (window.musicPlayer && window.musicPlayer.audio) {
        const skipTime = details.seekOffset || 10;
        window.musicPlayer.audio.currentTime = Math.max(0, window.musicPlayer.audio.currentTime - skipTime);
      }
    });

    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      console.log('Media Session: Seek forward requested', details);
      if (window.musicPlayer && window.musicPlayer.audio) {
        const skipTime = details.seekOffset || 10;
        window.musicPlayer.audio.currentTime = Math.min(
          window.musicPlayer.audio.duration, 
          window.musicPlayer.audio.currentTime + skipTime
        );
      }
    });

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      console.log('Media Session: Seek to requested', details);
      if (window.musicPlayer && window.musicPlayer.audio) {
        if (details.seekTime !== undefined) {
          window.musicPlayer.audio.currentTime = details.seekTime;
        }
      }
    });

    // Set up position state for progress bar
    this.updatePositionState();
  }

  updateMetadata(track) {
    if (!('mediaSession' in navigator) || !track) return;

    this.currentTrack = track;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title || 'Unknown Title',
        artist: track.artist || 'Unknown Artist',
        album: track.album || 'Our Music',
        artwork: [
          {
            src: track.artwork || 'assets/images/music-placeholder.jpg',
            sizes: '96x96',
            type: 'image/jpeg'
          },
          {
            src: track.artwork || 'assets/images/music-placeholder.jpg',
            sizes: '128x128',
            type: 'image/jpeg'
          },
          {
            src: track.artwork || 'assets/images/music-placeholder.jpg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: track.artwork || 'assets/images/music-placeholder.jpg',
            sizes: '256x256',
            type: 'image/jpeg'
          },
          {
            src: track.artwork || 'assets/images/music-placeholder.jpg',
            sizes: '384x384',
            type: 'image/jpeg'
          },
          {
            src: track.artwork || 'assets/images/music-placeholder.jpg',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      });

      console.log('Media Session metadata updated:', track.title);
    } catch (error) {
      console.error('Error updating Media Session metadata:', error);
    }
  }

  updatePlaybackState(isPlaying) {
    if (!('mediaSession' in navigator)) return;

    this.isPlaying = isPlaying;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    
    console.log('Media Session playback state updated:', isPlaying ? 'playing' : 'paused');
  }

  updatePositionState() {
    if (!('mediaSession' in navigator) || !window.musicPlayer || !window.musicPlayer.audio) return;

    const audio = window.musicPlayer.audio;
    if (audio.duration && audio.duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: audio.currentTime
        });
      } catch (error) {
        console.error('Error updating Media Session position state:', error);
      }
    }
  }

  // Update position state periodically
  startPositionUpdates() {
    if (this.positionUpdateInterval) {
      clearInterval(this.positionUpdateInterval);
    }

    this.positionUpdateInterval = setInterval(() => {
      this.updatePositionState();
    }, 1000); // Update every second
  }

  stopPositionUpdates() {
    if (this.positionUpdateInterval) {
      clearInterval(this.positionUpdateInterval);
      this.positionUpdateInterval = null;
    }
  }

  // Clear media session
  clear() {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
    }
    this.stopPositionUpdates();
  }
}

// Initialize Media Session Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.mediaSessionManager = new MediaSessionManager();
});
