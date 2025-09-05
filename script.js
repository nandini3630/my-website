document.addEventListener('DOMContentLoaded', () => {
  const messagesGrid = document.getElementById('messagesGrid');
  const galleryMasonry = document.getElementById('galleryMasonry');
  const journeyList = document.getElementById('journeyList');
  const calendarEl = document.getElementById('calendar');
  const monthLabel = document.getElementById('monthLabel');
  const audio = document.getElementById('song');
  const audioToggle = document.getElementById('audioToggle');

  // Lightbox
  const lightbox = document.getElementById('lightbox');
  const lightboxBody = lightbox?.querySelector('.lightbox-body');
  const lightboxClose = lightbox?.querySelector('.lightbox-close');
  const openLightbox = (node) => {
    if (!lightbox || !lightboxBody) return;
    lightboxBody.innerHTML = '';
    lightboxBody.appendChild(node);
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
  };
  const closeLightbox = () => {
    if (!lightbox || !lightboxBody) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxBody.innerHTML = '';
  };
  lightboxClose?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (e) => {
    if (!e.target.closest('.lightbox-body')) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
  });

  // Audio toggle
  const refreshAudioUi = () => {
    if (!audio || !audioToggle) return;
    const hasSource = audio.querySelector('source')?.getAttribute('src');
    if (!hasSource) {
      audioToggle.disabled = true;
      audioToggle.textContent = 'No song added yet';
      return;
    }
    audioToggle.disabled = false;
    audioToggle.textContent = audio.paused ? '▶ Our Song' : '⏸ Pause';
  };
  audioToggle?.addEventListener('click', async () => {
    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
      refreshAudioUi();
    } catch (err) {
      console.error('Audio error', err);
    }
  });
  audio?.addEventListener('play', refreshAudioUi);
  audio?.addEventListener('pause', refreshAudioUi);
  refreshAudioUi();

  // Fetch helpers
  const loadJson = async (path, fallback) => {
    try {
      const res = await fetch(path, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`Failed to load ${path}`);
      return await res.json();
    } catch (e) {
      console.warn('Using fallback for', path, e);
      return fallback;
    }
  };

  // Renderers
  const renderMessages = (data) => {
    const messages = data?.messages || [];
    const sortSel = document.getElementById('messagesSort');
    const chipInput = document.getElementById('tagInput');
    const chipRow = document.getElementById('selectedTags');
    const suggBox = document.getElementById('tagSuggestions');
    const allTags = Array.from(new Set(messages.flatMap(m => (m.tags || []).map(t => String(t))))).sort();
    const selected = new Set();
    const renderChips = () => {
      if (!chipRow) return;
      chipRow.innerHTML = Array.from(selected).map(t => `
        <span class="chip">${escapeHtml(t)} <button data-x="${escapeHtml(t)}" aria-label="Remove">×</button></span>
      `).join('');
      chipRow.querySelectorAll('button[data-x]').forEach(btn => {
        btn.addEventListener('click', () => { selected.delete(btn.getAttribute('data-x')); applyRender(); renderChips(); });
      });
    };
    const renderSuggestions = (q) => {
      if (!suggBox) return;
      if (!q) { suggBox.style.display='none'; suggBox.innerHTML=''; return; }
      const ql = q.toLowerCase();
      const matches = allTags.filter(t => t.toLowerCase().includes(ql) && !selected.has(t)).slice(0,8);
      if (!matches.length) { suggBox.style.display='none'; suggBox.innerHTML=''; return; }
      suggBox.innerHTML = matches.map(t => `<div class="suggestion" role="option" data-t="${escapeHtml(t)}">${escapeHtml(t)}</div>`).join('');
      const rect = chipInput.getBoundingClientRect();
      suggBox.style.display='block';
      suggBox.style.left = chipInput.offsetLeft + 'px';
      suggBox.style.top = (chipInput.offsetTop + chipInput.offsetHeight + 2) + 'px';
      suggBox.style.width = chipInput.offsetWidth + 'px';
      suggBox.querySelectorAll('.suggestion').forEach(el => {
        el.addEventListener('click', () => {
          selected.add(el.getAttribute('data-t'));
          chipInput.value='';
          suggBox.style.display='none';
          renderChips();
          applyRender();
        });
      });
    };
    chipInput?.addEventListener('input', (e) => { renderSuggestions(e.target.value); });
    chipInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const v = (chipInput.value || '').trim();
        if (v) { selected.add(v); chipInput.value=''; renderChips(); applyRender(); }
        suggBox.style.display='none';
      } else if (e.key === 'Backspace' && !chipInput.value && selected.size) {
        const last = Array.from(selected).pop();
        selected.delete(last);
        renderChips();
        applyRender();
      }
    });
    const applyRender = () => {
      let current = [...messages];
      if (selected.size) {
        current = current.filter(m => {
          const mtags = new Set((m.tags||[]).map(String));
          for (const t of selected) if (!mtags.has(t)) return false;
          return true;
        });
      }
      const sortBy = sortSel?.value || 'newest';
      current.sort((a,b)=>{
        if (sortBy === 'title') return String(a.title||'').localeCompare(String(b.title||''));
        const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return sortBy === 'oldest' ? ad - bd : bd - ad;
      });
      if (!current.length) {
        messagesGrid.innerHTML = '<p style="color:var(--muted)">No messages yet. Add them in data/messages.json</p>';
        return;
      }
      messagesGrid.innerHTML = current.map((m) => {
        const tags = (m.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
        const full = String(m.content || '');
        return `
          <article class="card" tabindex="0">
            <h3>${escapeHtml(m.title || 'Message')}</h3>
            <p>${escapeHtml(full)}</p>
            <div class="tag-row">${tags}</div>
          </article>
        `;
      }).join('');
      messagesGrid.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
          const body = document.createElement('div');
          body.innerHTML = card.innerHTML;
          openLightbox(body);
        });
      });
    };
    sortSel?.addEventListener('change', applyRender);
    renderChips();
    applyRender();
  };

  const renderGallery = (data) => {
    const items = data?.items || [];
    const sortSel = document.getElementById('gallerySort');
    const typeSel = document.getElementById('galleryType');
    const draw = (list) => {
      if (!galleryMasonry) return;
      galleryMasonry.innerHTML = '';
      if (!list.length) {
        galleryMasonry.innerHTML = '<p style="color:var(--muted)">No photos yet. Add files under assets/images or assets/videos and list in data/gallery.json</p>';
        return;
      }
      for (const item of list) {
        const wrap = document.createElement('div');
        wrap.className = 'masonry-item';
        let media;
        if (item.type === 'video') {
          media = document.createElement('video');
          media.src = item.src;
          if (item.poster) media.poster = item.poster;
          media.controls = true;
        } else {
          const box = document.createElement('div');
          box.className = 'media-box';
          media = document.createElement('img');
          media.src = item.src;
          media.alt = item.caption || 'Photo';
          media.loading = 'lazy';
          media.addEventListener('click', () => {
            const full = document.createElement('img');
            full.src = item.src;
            full.alt = item.caption || 'Photo';
            openLightbox(full);
          });
          media.style.cursor = 'zoom-in';
          box.appendChild(media);
          wrap.appendChild(box);
        }
        if (item.type === 'video') wrap.appendChild(media);
        if (item.caption) {
          const cap = document.createElement('div');
          cap.className = 'caption';
          cap.textContent = item.caption;
          wrap.appendChild(cap);
        }
        galleryMasonry.appendChild(wrap);
      }
    };
    const apply = () => {
      let filtered = [...items];
      const type = typeSel?.value || 'all';
      if (type !== 'all') filtered = filtered.filter(i => i.type === type);
      const sortBy = sortSel?.value || 'newest';
      filtered.sort((a,b)=>{
        const ad = a.date ? new Date(a.date).getTime() : 0;
        const bd = b.date ? new Date(b.date).getTime() : 0;
        return sortBy === 'oldest' ? ad - bd : bd - ad;
      });
      draw(filtered);
    };
    sortSel?.addEventListener('change', apply);
    typeSel?.addEventListener('change', apply);
    apply();
  };

  const renderJourney = (data) => {
    const entries = data?.entries || [];
    const sortSel = document.getElementById('journeySort');
    const apply = () => {
      let list = [...entries];
      const sortBy = sortSel?.value || 'newest';
      list.sort((a,b)=>{
        const ad = a.date ? new Date(a.date).getTime() : 0;
        const bd = b.date ? new Date(b.date).getTime() : 0;
        if (sortBy === 'title') return String(a.title||'').localeCompare(String(b.title||''));
        return sortBy === 'oldest' ? ad - bd : bd - ad;
      });
      if (!journeyList) return;
      if (!list.length) {
        journeyList.innerHTML = '<p style="color:var(--muted)">No entries yet. Add them in data/journey.json</p>';
        return;
      }
      journeyList.innerHTML = list.map((e, idx) => `
        <div class="accordion-item${idx === 0 ? ' open' : ''}">
          <button class="accordion-header" aria-expanded="${idx === 0 ? 'true' : 'false'}">
            <span>${escapeHtml(e.title || 'Moment')}</span>
            <span>▾</span>
          </button>
          <div class="accordion-content">
            <p><strong>What happened:</strong> ${escapeHtml(e.whatHappened || '')}</p>
            <p><strong>How we solved:</strong> ${escapeHtml(e.howWeSolved || '')}</p>
            <p><strong>Lesson:</strong> ${escapeHtml(e.lesson || '')}</p>
          </div>
        </div>
      `).join('');

      journeyList.querySelectorAll('.accordion-header').forEach(btn => {
        btn.addEventListener('click', () => {
          const item = btn.closest('.accordion-item');
          const expanded = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', String(!expanded));
          item.classList.toggle('open');
        });
      });
    };
    sortSel?.addEventListener('change', apply);
    apply();
  };

  const escapeHtml = (str) => String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const page = window.PAGE || 'home';
  if (page === 'messages' || page === 'home') {
    loadJson('data/messages.json', { messages: [] }).then(renderMessages);
  }
  if (page === 'gallery' || page === 'home') {
    loadJson('data/gallery.json', { items: [] }).then(renderGallery);
  }
  if (page === 'miscommunications' || page === 'home') {
    loadJson('data/journey.json', { entries: [] }).then(renderJourney);
  }

  // Diary calendar
  const renderDiary = (data) => {
    if (!calendarEl || !monthLabel) return;
    const entries = data?.entries || [];
    const byDate = new Map(entries.map(e => [e.date, e]));
    let current = new Date();
    current.setDate(1);
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const draw = () => {
      const year = current.getFullYear();
      const month = current.getMonth();
      const firstDow = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      monthLabel.textContent = current.toLocaleString(undefined, { month: 'long', year: 'numeric' });
      const cells = [];
      cells.push(...dayNames.map(d => `<div class="dow">${d}</div>`));
      for (let i=0;i<firstDow;i++) cells.push('<div></div>');
      for (let d=1; d<=daysInMonth; d++) {
        const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const entry = byDate.get(iso);
        cells.push(`
          <div class="day${entry ? ' has-entry' : ''}" data-date="${iso}">
            <div class="num">${d}</div>
            ${entry ? `<div style="position:absolute;right:8px;bottom:8px;font-size:11px;color:var(--primary)">●</div>`:''}
          </div>
        `);
      }
      calendarEl.innerHTML = cells.join('');
      calendarEl.querySelectorAll('.day').forEach(dayEl => {
        dayEl.addEventListener('click', () => {
          const iso = dayEl.getAttribute('data-date');
          const e = byDate.get(iso);
          openDiaryModal(iso, e);
        });
      });
    };

    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    prevBtn?.addEventListener('click', () => { current.setMonth(current.getMonth()-1); draw(); });
    nextBtn?.addEventListener('click', () => { current.setMonth(current.getMonth()+1); draw(); });
    draw();
  };

  const openDiaryModal = (iso, entry) => {
    const modal = document.getElementById('diaryModal');
    if (!modal) return;
    const body = modal.querySelector('.diary-body');
    const media = (entry?.media || []).map(m => {
      if (m.type === 'video') {
        return `<video src="${m.src}" ${m.poster ? `poster="${m.poster}"` : ''} controls style="width:100%;margin-top:10px"></video>`;
      }
      return `<img src="${m.src}" alt="${m.caption || ''}" style="max-width:100%;border-radius:8px;margin-top:10px"/>`;
    }).join('');
    body.innerHTML = `
      <h3>${entry?.title ? escapeHtml(entry.title) : 'No entry yet'}</h3>
      <p style="color:#444;margin-top:-4px">${iso}${entry?.mood ? ` • ${escapeHtml(entry.mood)}`:''}</p>
      <div>${entry?.content ? escapeHtml(entry.content).replaceAll('\n','<br/>') : '<em>Click this day later when you write something here.</em>'}</div>
      ${media}
    `;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    modal.querySelector('.lightbox-close').onclick = () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden','true');
    };
    modal.addEventListener('click', (e)=>{ if(e.target===modal){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); }});
  };

  if (page === 'diary') {
    loadJson('data/diary.json', { entries: [] }).then(renderDiary);
  }
});

