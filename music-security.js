// Independent Music Security System
class MusicSecurityManager {
  constructor() {
    this.isAuthenticated = false;
    this.sessionStartTime = null;
    this.sessionTimeout = 600 * 600 * 1000;
    this.timeoutTimer = null;
    this.musicPassword = 'music2024'; // Independent password
    this.init();
  }

  init() {
    this.checkExistingSession();
    this.setupEventListeners();
  }

  checkExistingSession() {
    const sessionData = localStorage.getItem('musicSession');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      const now = Date.now();
      
      if (now - session.timestamp < this.sessionTimeout) {
        this.isAuthenticated = true;
        this.sessionStartTime = session.timestamp;
        this.showMusicApp();
        this.startSessionTimer();
      } else {
        this.clearSession();
        this.showLoginForm();
      }
    } else {
      this.showLoginForm();
    }
  }

  setupEventListeners() {
    const loginForm = document.getElementById('musicLoginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    
    loginForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.authenticate();
    });
    
    logoutBtn?.addEventListener('click', () => {
      this.logout();
    });

    // Reset timeout on user activity
    const events = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, () => {
        if (this.isAuthenticated) {
          this.resetSessionTimer();
        }
      }, { passive: true });
    });
  }

  authenticate() {
    const password = document.getElementById('musicPassword').value;
    const errorDiv = document.getElementById('musicError');
    
    if (password === this.musicPassword) {
      this.isAuthenticated = true;
      this.sessionStartTime = Date.now();
      this.saveSession();
      this.showMusicApp();
      this.startSessionTimer();
    } else {
      errorDiv.textContent = 'Incorrect password. Please try again.';
      errorDiv.style.display = 'block';
      document.getElementById('musicPassword').value = '';
      document.getElementById('musicPassword').focus();
    }
  }

  showLoginForm() {
    const overlay = document.getElementById('musicSecurityOverlay');
    const app = document.getElementById('musicApp');
    
    if (overlay) overlay.style.display = 'flex';
    if (app) app.style.display = 'none';
    
    document.getElementById('musicPassword')?.focus();
  }

  showMusicApp() {
    const overlay = document.getElementById('musicSecurityOverlay');
    const app = document.getElementById('musicApp');
    
    if (overlay) overlay.style.display = 'none';
    if (app) app.style.display = 'flex';
  }

  saveSession() {
    const sessionData = {
      timestamp: this.sessionStartTime,
      authenticated: true
    };
    localStorage.setItem('musicSession', JSON.stringify(sessionData));
  }

  clearSession() {
    localStorage.removeItem('musicSession');
    this.isAuthenticated = false;
    this.sessionStartTime = null;
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }

  startSessionTimer() {
    this.resetSessionTimer();
  }

  resetSessionTimer() {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
    
    this.timeoutTimer = setTimeout(() => {
      this.logout();
    }, this.sessionTimeout);
  }

  logout() {
    this.clearSession();
    this.showLoginForm();
    
    // Stop any playing music
    const audio = document.getElementById('audioPlayer');
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  // Public methods
  isSessionActive() {
    return this.isAuthenticated;
  }

  getTimeRemaining() {
    if (!this.isAuthenticated || !this.sessionStartTime) return 0;
    const elapsed = Date.now() - this.sessionStartTime;
    return Math.max(0, this.sessionTimeout - elapsed);
  }

  extendSession() {
    if (this.isAuthenticated) {
      this.resetSessionTimer();
    }
  }
}

// Initialize music security when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.musicSecurity = new MusicSecurityManager();
});
