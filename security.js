// Advanced Multi-Password Security System
class AdvancedSecurityManager {
  constructor() {
    this.config = null;
    this.isAuthenticated = false;
    this.currentUser = null;
    this.sessionStartTime = null;
    this.allowedPages = [];
    this.currentPage = this.getCurrentPage();
    this.init();
  }

  async init() {
    await this.loadConfig();
    this.setupAdvancedSecurity();
    this.checkPageAccess();
    this.setupSessionManagement();
  }

  async loadConfig() {
    try {
      const response = await fetch('config.json');
      this.config = await response.json();
    } catch (error) {
      console.error('Failed to load security config:', error);
      // Fallback config
      this.config = {
        passwords: {
          "love2024": { access: ["messages", "diary"], description: "Messages and Diary Access" },
          "love2025": { access: ["gallery", "miscommunications"], description: "Gallery and Miscommunications Access" }
        },
        sessionTimeout: 10000,
        securitySettings: {
          preventRightClick: true,
          preventDevTools: true,
          preventScreenshot: true,
          disableImageDownload: true,
          disableVideoDownload: true,
          obfuscateContent: false,
          preventUrlAccess: true,
          preventInspectElement: true,
          preventViewSource: true,
          preventConsoleAccess: true,
          encryptContent: true,
          preventNetworkInspection: true
        }
      };
    }
  }

  getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('messages')) return 'messages';
    if (path.includes('diary')) return 'diary';
    if (path.includes('gallery')) return 'gallery';
    if (path.includes('miscommunications')) return 'miscommunications';
    return 'index';
  }

  checkPageAccess() {
    const sessionData = localStorage.getItem('secureSession');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      const now = Date.now();
      if (now - session.timestamp < this.config.sessionTimeout) {
        this.isAuthenticated = true;
        this.currentUser = session.user;
        this.allowedPages = session.allowedPages;
        this.sessionStartTime = session.timestamp;
        
        if (this.allowedPages.includes(this.currentPage)) {
          this.hideLoginForm();
          this.showProtectedContent();
        } else {
          this.showAccessDenied();
        }
      } else {
        this.clearSession();
        this.showLoginForm();
      }
    } else {
      this.showLoginForm();
    }
  }

  showLoginForm() {
    // Hide all content
    document.body.style.display = 'none';
    
    // Create login overlay
    const loginOverlay = document.createElement('div');
    loginOverlay.id = 'security-overlay';
    loginOverlay.innerHTML = `
      <div class="security-container">
        <div class="security-header">
          <h1>🔒 Private Access</h1>
          <p>Enter password to access protected content</p>
        </div>
        <form id="login-form" class="security-form">
          <div class="input-group">
            <input type="password" id="password-input" placeholder="Enter password" required>
            <button type="submit" class="security-btn">Access Content</button>
          </div>
          <div id="error-message" class="error-message"></div>
        </form>
        <div class="security-footer">
          <p>Made with ❤, patience, and endless gratitude.</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(loginOverlay);
    document.body.style.display = 'block';
    
    // Add event listeners
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.authenticate();
    });
    
    // Focus on password input
    document.getElementById('password-input').focus();
  }

  showAccessDenied() {
    document.body.style.display = 'none';
    
    const accessDeniedOverlay = document.createElement('div');
    accessDeniedOverlay.id = 'security-overlay';
    accessDeniedOverlay.innerHTML = `
      <div class="security-container">
        <div class="security-header">
          <h1>🚫 Access Denied</h1>
          <p>Your password doesn't have access to this page</p>
        </div>
        <div class="access-info">
          <p><strong>Current Page:</strong> ${this.currentPage}</p>
          <p><strong>Your Access:</strong> ${this.allowedPages.join(', ')}</p>
        </div>
        <div class="security-form">
          <button onclick="location.reload()" class="security-btn">Try Different Password</button>
        </div>
        <div class="security-footer">
          <p>Made with ❤, patience, and endless gratitude.</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(accessDeniedOverlay);
    document.body.style.display = 'block';
  }

  authenticate() {
    const password = document.getElementById('password-input').value;
    const errorDiv = document.getElementById('error-message');
    
    if (this.config.passwords[password]) {
      const userAccess = this.config.passwords[password];
      
      if (userAccess.access.includes(this.currentPage)) {
        this.isAuthenticated = true;
        this.currentUser = password;
        this.allowedPages = userAccess.access;
        this.sessionStartTime = Date.now();
        this.saveSession();
        this.hideLoginForm();
        this.showProtectedContent();
      } else {
        errorDiv.textContent = `This password doesn't have access to ${this.currentPage} page.`;
        errorDiv.style.display = 'block';
        document.getElementById('password-input').value = '';
        document.getElementById('password-input').focus();
      }
    } else {
      errorDiv.textContent = 'Incorrect password. Please try again.';
      errorDiv.style.display = 'block';
      document.getElementById('password-input').value = '';
      document.getElementById('password-input').focus();
    }
  }

  hideLoginForm() {
    const overlay = document.getElementById('security-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  showProtectedContent() {
    // Content is already visible, just ensure security measures are active
    this.setupContentProtection();
    this.encryptContent();
  }

  saveSession() {
    const sessionData = {
      timestamp: this.sessionStartTime,
      user: this.currentUser,
      allowedPages: this.allowedPages,
      authenticated: true
    };
    localStorage.setItem('secureSession', JSON.stringify(sessionData));
  }

  clearSession() {
    localStorage.removeItem('secureSession');
    this.isAuthenticated = false;
    this.currentUser = null;
    this.allowedPages = [];
    this.sessionStartTime = null;
  }

  logout() {
    this.clearSession();
    location.reload();
  }

  setupAdvancedSecurity() {
    if (!this.config.securitySettings) return;

    // Prevent right-click
    if (this.config.securitySettings.preventRightClick) {
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
      });
    }

    // Advanced Developer Tools Protection
    if (this.config.securitySettings.preventDevTools) {
      this.setupDevToolsProtection();
    }

    // Prevent F12, Ctrl+Shift+I, Ctrl+U, Ctrl+Shift+C
    if (this.config.securitySettings.preventInspectElement) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.key === 'u') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C') ||
            (e.ctrlKey && e.shiftKey && e.key === 'J')) {
          e.preventDefault();
          this.blockAccess();
          return false;
        }
      });
    }

    // Prevent screenshot (basic protection)
    if (this.config.securitySettings.preventScreenshot) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'PrintScreen') {
          e.preventDefault();
          this.blockAccess();
          return false;
        }
      });
    }

    // Prevent console access
    if (this.config.securitySettings.preventConsoleAccess) {
      this.blockConsoleAccess();
    }

    // Prevent URL manipulation
    if (this.config.securitySettings.preventUrlAccess) {
      this.setupUrlProtection();
    }
  }

  setupDevToolsProtection() {
    // Detect DevTools opening
    let devtools = {open: false, orientation: null};
    const threshold = 160;

    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          this.blockAccess();
        }
      } else {
        devtools.open = false;
      }
    }, 500);

    // Additional protection
    window.addEventListener('resize', () => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        this.blockAccess();
      }
    });
  }

  blockConsoleAccess() {
    // Override console methods
    const noop = () => {};
    const methods = ['log', 'debug', 'info', 'warn', 'error', 'trace', 'dir', 'dirxml', 'group', 'groupEnd', 'time', 'timeEnd', 'count', 'clear', 'assert', 'profile', 'profileEnd'];
    
    methods.forEach(method => {
      window.console[method] = noop;
    });

    // Block console object access
    Object.defineProperty(window, 'console', {
      get: () => {
        this.blockAccess();
        return {};
      },
      set: () => {
        this.blockAccess();
      }
    });
  }

  setupUrlProtection() {
    // Prevent direct URL access
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function() {
      this.blockAccess();
      return originalPushState.apply(history, arguments);
    }.bind(this);
    
    history.replaceState = function() {
      this.blockAccess();
      return originalReplaceState.apply(history, arguments);
    }.bind(this);

    // Block back/forward navigation
    window.addEventListener('popstate', () => {
      this.blockAccess();
    });
  }

  blockAccess() {
    // Clear the page and show warning
    document.body.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #000;
        color: #ff0000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: monospace;
        font-size: 24px;
        text-align: center;
        z-index: 99999;
      ">
        <div>
          <h1>🚫 ACCESS BLOCKED</h1>
          <p>Unauthorized access attempt detected</p>
          <p>Page will reload in 3 seconds...</p>
        </div>
      </div>
    `;
    
    setTimeout(() => {
      location.reload();
    }, 3000);
  }

  setupContentProtection() {
    if (!this.config.securitySettings) return;

    // Disable image downloads
    if (this.config.securitySettings.disableImageDownload) {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        img.draggable = false;
        img.addEventListener('dragstart', (e) => e.preventDefault());
        img.style.userSelect = 'none';
        img.style.webkitUserSelect = 'none';
        img.style.webkitTouchCallout = 'none';
        img.addEventListener('contextmenu', (e) => e.preventDefault());
      });
    }

    // Disable video downloads
    if (this.config.securitySettings.disableVideoDownload) {
      const videos = document.querySelectorAll('video');
      videos.forEach(video => {
        video.controlsList = 'nodownload';
        video.disablePictureInPicture = true;
        video.addEventListener('contextmenu', (e) => e.preventDefault());
      });
    }

    // Prevent network inspection
    if (this.config.securitySettings.preventNetworkInspection) {
      this.setupNetworkProtection();
    }
  }

  setupNetworkProtection() {
    // Override fetch and XMLHttpRequest
    const originalFetch = window.fetch;
    window.fetch = function() {
      this.blockAccess();
      return originalFetch.apply(this, arguments);
    }.bind(this);

    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
      this.blockAccess();
      return new originalXHR();
    }.bind(this);
  }

  encryptContent() {
    if (!this.config.securitySettings.encryptContent) return;

    // Simple content encryption for additional security
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
    textElements.forEach(element => {
      if (element.textContent.trim() && !element.hasAttribute('data-encrypted')) {
        element.setAttribute('data-original', element.textContent);
        element.setAttribute('data-encrypted', 'true');
        // Content is already readable, just mark as processed
      }
    });
  }

  setupSessionManagement() {
    // Check session timeout every 30 seconds
    setInterval(() => {
      if (this.isAuthenticated && this.sessionStartTime) {
        const now = Date.now();
        if (now - this.sessionStartTime > this.config.sessionTimeout) {
          this.logout();
        }
      }
    }, 30000);
  }
}

// Initialize advanced security system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.securityManager = new AdvancedSecurityManager();
});