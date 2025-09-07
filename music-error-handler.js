// Enhanced Error Handler for Music Player
class MusicErrorHandler {
  constructor() {
    this.errorCounts = {};
    this.maxRetries = 3;
    this.retryDelay = 2000;
    this.init();
  }

  init() {
    this.setupGlobalErrorHandling();
    this.setupAudioErrorHandling();
  }

  setupGlobalErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.handleGlobalError(event.error, event.filename, event.lineno);
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.handlePromiseRejection(event.reason);
    });
  }

  setupAudioErrorHandling() {
    // Audio-specific error handling
    document.addEventListener('DOMContentLoaded', () => {
      const audio = document.getElementById('audioPlayer');
      if (audio) {
        audio.addEventListener('error', (event) => {
          this.handleAudioError(event);
        });
      }
    });
  }

  handleGlobalError(error, filename, lineno) {
    console.error('Global error:', error, 'at', filename, ':', lineno);
    
    if (window.musicManager) {
      window.musicManager.showNotification(
        'An unexpected error occurred. Please refresh the page.',
        'error',
        5000
      );
    }
  }

  handlePromiseRejection(reason) {
    console.error('Unhandled promise rejection:', reason);
    
    if (window.musicManager) {
      window.musicManager.showNotification(
        'A network or loading error occurred.',
        'error',
        4000
      );
    }
  }

  handleAudioError(event) {
    const audio = event.target;
    const error = audio.error;
    
    if (!error) return;

    let errorMessage = 'Audio playback error';
    let shouldRetry = false;

    switch (error.code) {
      case error.MEDIA_ERR_ABORTED:
        errorMessage = 'Audio playback was interrupted';
        shouldRetry = true;
        break;
      case error.MEDIA_ERR_NETWORK:
        errorMessage = 'Network error while loading audio';
        shouldRetry = true;
        break;
      case error.MEDIA_ERR_DECODE:
        errorMessage = 'Audio file is corrupted or unsupported';
        shouldRetry = false;
        break;
      case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
        errorMessage = 'Audio format not supported';
        shouldRetry = false;
        break;
      default:
        errorMessage = 'Unknown audio error';
        shouldRetry = true;
    }

    console.error('Audio error:', errorMessage, error);

    if (window.musicManager) {
      window.musicManager.showNotification(errorMessage, 'error', 4000);
    }

    // Retry logic
    if (shouldRetry && this.shouldRetry(audio.src)) {
      this.retryAudioLoad(audio);
    } else if (window.musicManager && window.musicManager.settings.autoPlay) {
      // Try next track if retry not possible
      setTimeout(() => {
        if (window.musicPlayer) {
          window.musicPlayer.nextTrack();
        }
      }, this.retryDelay);
    }
  }

  shouldRetry(audioSrc) {
    if (!audioSrc) return false;
    
    const retryKey = audioSrc;
    this.errorCounts[retryKey] = (this.errorCounts[retryKey] || 0) + 1;
    
    return this.errorCounts[retryKey] <= this.maxRetries;
  }

  retryAudioLoad(audio) {
    const originalSrc = audio.src;
    const retryCount = this.errorCounts[originalSrc] || 0;
    
    console.log(`Retrying audio load (attempt ${retryCount}/${this.maxRetries}):`, originalSrc);
    
    // Clear the source and reload
    audio.src = '';
    setTimeout(() => {
      audio.src = originalSrc;
      audio.load();
    }, this.retryDelay);
  }

  // File existence checker
  async checkFileExists(filePath) {
    try {
      const response = await fetch(filePath, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.warn('Could not check file existence:', filePath, error);
      return false;
    }
  }

  // Network status checker
  checkNetworkStatus() {
    return navigator.onLine;
  }

  // Validate audio file
  validateAudioFile(filePath) {
    const supportedFormats = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
    return supportedFormats.some(format => filePath.toLowerCase().endsWith(format));
  }

  // Get error message for user
  getUserFriendlyError(error) {
    if (typeof error === 'string') {
      return error;
    }

    if (error && error.message) {
      return error.message;
    }

    return 'An unexpected error occurred';
  }

  // Reset error counts
  resetErrorCounts() {
    this.errorCounts = {};
  }

  // Get error statistics
  getErrorStats() {
    return {
      totalErrors: Object.values(this.errorCounts).reduce((sum, count) => sum + count, 0),
      uniqueErrors: Object.keys(this.errorCounts).length,
      errorCounts: { ...this.errorCounts }
    };
  }
}

// Initialize error handler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.musicErrorHandler = new MusicErrorHandler();
});
