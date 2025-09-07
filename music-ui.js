// Music UI Controller - Handles all UI interactions and animations
class MusicUI {
  constructor() {
    this.currentView = 'grid';
    this.isQueueOpen = false;
    this.isSettingsOpen = false;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupAnimations();
    this.setupResponsiveHandlers();
  }

  setupEventListeners() {
    // Mobile menu toggle
    this.setupMobileMenu();
    
    // Modal handlers
    this.setupModalHandlers();
    
    // Queue handlers
    this.setupQueueHandlers();
    
    // Settings handlers
    this.setupSettingsHandlers();
    
    // Search functionality
    this.setupSearchHandlers();
    
    // Keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  setupMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    
    if (mobileMenuBtn && sidebar) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        if (sidebarOverlay) {
          sidebarOverlay.classList.toggle('active');
        }
      });
    }
    
    // Close sidebar when clicking overlay
    if (sidebarOverlay) {
      sidebarOverlay.addEventListener('click', () => {
        sidebar?.classList.remove('open');
        sidebarOverlay.classList.remove('active');
      });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && sidebar?.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !mobileMenuBtn?.contains(e.target)) {
          sidebar.classList.remove('open');
          if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
          }
        }
      }
    });
    
    // Show/hide on mobile
    this.handleResize();
  }

  setupModalHandlers() {
    // Close modal on outside click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeModal(e.target);
      }
    });

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal.open');
        if (openModal) {
          this.closeModal(openModal);
        }
      }
    });
  }

  setupQueueHandlers() {
    const queueBtn = document.getElementById('queueBtn');
    const closeQueueBtn = document.getElementById('closeQueueBtn');
    const queueSidebar = document.getElementById('queueSidebar');

    queueBtn?.addEventListener('click', () => {
      this.toggleQueue();
    });

    closeQueueBtn?.addEventListener('click', () => {
      this.closeQueue();
    });

    // Close queue on outside click
    document.addEventListener('click', (e) => {
      if (this.isQueueOpen && !queueSidebar?.contains(e.target) && !queueBtn?.contains(e.target)) {
        this.closeQueue();
      }
    });
  }

  setupSettingsHandlers() {
    const settingsBtn = document.querySelector('.settings-btn');
    const settingsModal = document.getElementById('settingsModal');

    settingsBtn?.addEventListener('click', () => {
      this.openSettings();
    });

    // Settings form handlers
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');

    saveSettingsBtn?.addEventListener('click', () => {
      this.saveSettings();
    });

    cancelSettingsBtn?.addEventListener('click', () => {
      this.closeSettings();
    });
  }

  setupSearchHandlers() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('.search-btn');

    // Instant search with single key press
    searchInput?.addEventListener('input', (e) => {
      const query = e.target.value;
      this.performInstantSearch(query);
    });

    searchBtn?.addEventListener('click', () => {
      this.focusSearch();
    });

    // Clear search on escape
    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.target.value = '';
        this.performInstantSearch('');
      }
    });

    // Search keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        this.focusSearch();
      }
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Global shortcuts
      switch (e.key) {
        case '?':
          this.showKeyboardShortcuts();
          break;
        case 'Escape':
          this.handleEscape();
          break;
      }
    });
  }

  setupAnimations() {
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      .music-item {
        transition: all 0.3s cubic-bezier(0.3, 0, 0, 1);
      }
      
      .music-item:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      }
      
      .control-btn {
        transition: all 0.2s ease;
      }
      
      .control-btn:hover {
        transform: scale(1.1);
      }
      
      .play-pause-btn {
        transition: all 0.3s ease;
      }
      
      .play-pause-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 8px 25px rgba(29, 185, 84, 0.4);
      }
      
      .progress-bar:hover .progress-handle {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.2);
      }
      
      .volume-slider:hover .volume-handle {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.2);
      }
      
      .notification {
        animation: slideInRight 0.3s ease;
      }
      
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      .modal.open .modal-content {
        animation: modalSlideIn 0.3s ease;
      }
      
      @keyframes modalSlideIn {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      .queue-sidebar.open {
        animation: slideInRight 0.3s ease;
      }
    `;
    document.head.appendChild(style);
  }

  setupResponsiveHandlers() {
    window.addEventListener('resize', () => {
      this.handleResize();
    });
    
    this.handleResize();
  }

  handleResize() {
    const isMobile = window.innerWidth <= 768;
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    
    if (mobileMenuBtn) {
      mobileMenuBtn.style.display = isMobile ? 'block' : 'none';
    }
    
    if (isMobile) {
      sidebar?.classList.remove('open');
      if (sidebarOverlay) {
        sidebarOverlay.classList.remove('active');
      }
    } else {
      sidebar?.classList.remove('open');
      if (sidebarOverlay) {
        sidebarOverlay.classList.remove('active');
      }
    }
  }

  toggleQueue() {
    const queueSidebar = document.getElementById('queueSidebar');
    if (queueSidebar) {
      this.isQueueOpen = !this.isQueueOpen;
      queueSidebar.classList.toggle('open', this.isQueueOpen);
      
      if (this.isQueueOpen) {
        this.loadQueueContent();
      }
    }
  }

  closeQueue() {
    const queueSidebar = document.getElementById('queueSidebar');
    if (queueSidebar) {
      this.isQueueOpen = false;
      queueSidebar.classList.remove('open');
    }
  }

  loadQueueContent() {
    const queueContent = document.getElementById('queueContent');
    if (!queueContent || !window.musicManager) return;
    
    const currentTrack = window.musicManager.getCurrentTrack();
    const nextTracks = window.musicManager.musicLibrary.slice(
      window.musicManager.currentTrackIndex + 1,
      window.musicManager.currentTrackIndex + 6
    );
    
    let html = '';
    
    if (currentTrack) {
      html += `
        <div class="queue-item current">
          <div class="queue-artwork">
            <img src="${currentTrack.artwork}" alt="${currentTrack.title}">
          </div>
          <div class="queue-info">
            <div class="queue-title">${currentTrack.title}</div>
            <div class="queue-artist">${currentTrack.artist}</div>
          </div>
          <div class="queue-status">Now Playing</div>
        </div>
      `;
    }
    
    if (nextTracks.length > 0) {
      html += '<div class="queue-section"><h4>Next Up</h4></div>';
      html += nextTracks.map(track => `
        <div class="queue-item" data-track-id="${track.id}">
          <div class="queue-artwork">
            <img src="${track.artwork}" alt="${track.title}">
          </div>
          <div class="queue-info">
            <div class="queue-title">${track.title}</div>
            <div class="queue-artist">${track.artist}</div>
          </div>
          <div class="queue-duration">${window.musicManager.formatDuration(track.duration)}</div>
        </div>
      `).join('');
    }
    
    queueContent.innerHTML = html || '<div class="empty-queue">No tracks in queue</div>';
    
    // Add click handlers for queue items
    queueContent.querySelectorAll('.queue-item[data-track-id]').forEach(item => {
      item.addEventListener('click', () => {
        const trackId = item.dataset.trackId;
        const track = window.musicManager.musicLibrary.find(t => t.id === trackId);
        if (track) {
          window.musicManager.playTrack(track);
        }
      });
    });
  }

  openSettings() {
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
      this.isSettingsOpen = true;
      settingsModal.classList.add('open');
      this.populateSettings();
    }
  }

  closeSettings() {
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
      this.isSettingsOpen = false;
      settingsModal.classList.remove('open');
    }
  }

  populateSettings() {
    if (!window.musicManager) return;
    
    const settings = window.musicManager.settings;
    Object.keys(settings).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = settings[key];
        } else if (element.type === 'range') {
          element.value = settings[key];
        } else if (element.tagName === 'SELECT') {
          element.value = settings[key];
        }
      }
    });
  }

  saveSettings() {
    if (!window.musicManager) return;
    
    const newSettings = {};
    Object.keys(window.musicManager.settings).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === 'checkbox') {
          newSettings[key] = element.checked;
        } else if (element.type === 'range') {
          newSettings[key] = parseInt(element.value);
        } else if (element.tagName === 'SELECT') {
          newSettings[key] = element.value;
        }
      }
    });

    window.musicManager.settings = { ...window.musicManager.settings, ...newSettings };
    window.musicManager.saveSettingsToStorage();
    this.closeSettings();
    window.musicManager.showNotification('Settings saved successfully!', 'success');
  }

  performInstantSearch(query) {
    if (!window.musicManager) return;
    
    // Show search results instantly with single key press
    const results = window.musicManager.searchSongs(query);
    this.renderSearchResults(results);
    
    // Update search counter
    this.updateSearchCounter(results.length);
  }

  updateSearchCounter(count) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      // Add visual feedback for search results
      if (count > 0) {
        searchInput.style.borderColor = 'var(--accent-green)';
      } else {
        searchInput.style.borderColor = 'var(--border-color)';
      }
    }
  }

  renderSearchResults(results) {
    if (window.musicManager) {
      window.musicManager.renderMusicGrid(results);
    }
  }

  focusSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  showKeyboardShortcuts() {
    const shortcuts = [
      { key: 'Space', action: 'Play/Pause' },
      { key: '←/→', action: 'Seek backward/forward' },
      { key: '↑/↓', action: 'Volume up/down' },
      { key: 'N', action: 'Next track' },
      { key: 'P', action: 'Previous track' },
      { key: 'M', action: 'Mute/Unmute' },
      { key: 'L', action: 'Like/Unlike' },
      { key: 'Ctrl+K', action: 'Focus search' },
      { key: 'Escape', action: 'Close modals' }
    ];
    
    const modal = document.createElement('div');
    modal.className = 'modal open';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Keyboard Shortcuts</h3>
          <button class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="shortcuts-list">
            ${shortcuts.map(shortcut => `
              <div class="shortcut-item">
                <kbd>${shortcut.key}</kbd>
                <span>${shortcut.action}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add close handler
    modal.querySelector('.modal-close').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  handleEscape() {
    if (this.isQueueOpen) {
      this.closeQueue();
    } else if (this.isSettingsOpen) {
      this.closeSettings();
    }
  }

  closeModal(modal) {
    modal.classList.remove('open');
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 300);
  }

  // Public methods for external access
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: type === 'error' ? '#ff4444' : type === 'success' ? '#1db954' : '#1db954',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: '10000',
      fontWeight: '500',
      maxWidth: '300px'
    });
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  updateNowPlaying(track) {
    if (window.musicManager) {
      window.musicManager.updateNowPlaying(track);
    }
  }

  refreshLibrary() {
    if (window.musicManager) {
      window.musicManager.renderMusicGrid();
    }
  }
}

// Initialize UI controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.musicUI = new MusicUI();
});
