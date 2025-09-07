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
      // Create a beautiful animated artwork with foggy effect
      const animatedArtwork = this.createAnimatedArtwork(track);
      
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title || 'Unknown Title',
        artist: track.artist || 'Unknown Artist',
        album: track.album || 'Our Music',
        artwork: animatedArtwork
      });

      console.log('Media Session metadata updated with animations:', track.title);
    } catch (error) {
      console.error('Error updating Media Session metadata:', error);
    }
  }
  
  // Create animated artwork with foggy effects
  createAnimatedArtwork(track) {
    const baseArtwork = track.artwork || 'assets/images/music-placeholder.jpg';
    
    // Create multiple sizes with different effects
    return [
      {
        src: this.createFoggyArtwork(baseArtwork, 96),
        sizes: '96x96',
        type: 'image/svg+xml'
      },
      {
        src: this.createFoggyArtwork(baseArtwork, 128),
        sizes: '128x128',
        type: 'image/svg+xml'
      },
      {
        src: this.createFoggyArtwork(baseArtwork, 192),
        sizes: '192x192',
        type: 'image/svg+xml'
      },
      {
        src: this.createFoggyArtwork(baseArtwork, 256),
        sizes: '256x256',
        type: 'image/svg+xml'
      },
      {
        src: this.createFoggyArtwork(baseArtwork, 384),
        sizes: '384x384',
        type: 'image/svg+xml'
      },
      {
        src: this.createFoggyArtwork(baseArtwork, 512),
        sizes: '512x512',
        type: 'image/svg+xml'
      }
    ];
  }
  
  // Create foggy animated artwork
  createFoggyArtwork(baseSrc, size) {
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="foggyEffect">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.8 0" result="fade"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="fade"/>
            </feMerge>
          </filter>
          <filter id="glowEffect">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <radialGradient id="fogGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:0.3"/>
            <stop offset="50%" style="stop-color:#4ecdc4;stop-opacity:0.2"/>
            <stop offset="100%" style="stop-color:#45b7d1;stop-opacity:0.1"/>
          </radialGradient>
        </defs>
        
        <!-- Background with foggy effect -->
        <rect width="100%" height="100%" fill="url(#fogGradient)" filter="url(#foggyEffect)"/>
        
        <!-- Animated fog particles -->
        <circle cx="20%" cy="30%" r="8" fill="rgba(255,255,255,0.3)" filter="url(#foggyEffect)">
          <animate attributeName="cx" values="20;80;20" dur="4s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="30;70;30" dur="4s" repeatCount="indefinite"/>
          <animate attributeName="r" values="8;12;8" dur="3s" repeatCount="indefinite"/>
        </circle>
        
        <circle cx="80%" cy="20%" r="6" fill="rgba(255,255,255,0.2)" filter="url(#foggyEffect)">
          <animate attributeName="cx" values="80;20;80" dur="5s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="20;80;20" dur="5s" repeatCount="indefinite"/>
          <animate attributeName="r" values="6;10;6" dur="4s" repeatCount="indefinite"/>
        </circle>
        
        <circle cx="50%" cy="80%" r="10" fill="rgba(255,255,255,0.25)" filter="url(#foggyEffect)">
          <animate attributeName="cx" values="50;30;50" dur="6s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="80;20;80" dur="6s" repeatCount="indefinite"/>
          <animate attributeName="r" values="10;14;10" dur="5s" repeatCount="indefinite"/>
        </circle>
        
        <!-- Music note with glow -->
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
              font-size="${size * 0.3}" fill="#1db954" filter="url(#glowEffect)">
          🎵
          <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
        </text>
      </svg>
    `;
    
    // Convert SVG to data URL
    return 'data:image/svg+xml;base64,' + btoa(svg);
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
        
        // Add foggy effect to progress updates
        this.addFoggyProgressEffect(audio.currentTime, audio.duration);
      } catch (error) {
        console.error('Error updating Media Session position state:', error);
      }
    }
  }
  
  // Add foggy progress effect
  addFoggyProgressEffect(currentTime, duration) {
    const progress = (currentTime / duration) * 100;
    
    // Create a subtle foggy effect based on progress
    if (progress > 0 && progress < 100) {
      // Add a gentle pulsing effect during playback
      document.body.style.setProperty('--progress-glow', `${progress}%`);
      
      // Create floating particles effect
      this.createFloatingParticles(progress);
    }
  }
  
  // Create floating particles for foggy effect
  createFloatingParticles(progress) {
    // Only create particles occasionally to avoid performance issues
    if (Math.random() > 0.95) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: fixed;
        width: 4px;
        height: 4px;
        background: radial-gradient(circle, rgba(29, 185, 84, 0.6) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
        left: ${Math.random() * window.innerWidth}px;
        top: ${Math.random() * window.innerHeight}px;
        animation: foggyFloat 3s ease-out forwards;
      `;
      
      document.body.appendChild(particle);
      
      // Remove particle after animation
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 3000);
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
