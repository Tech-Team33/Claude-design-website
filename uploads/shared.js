/* ================================================================
   Meridian & Co. CPA — Shared behaviors
   ================================================================ */
(function () {
  // ---- Theme persistence ----
  const storedTheme = localStorage.getItem('cpa-theme') || 'light';
  document.documentElement.setAttribute('data-theme', storedTheme);

  // ---- Tweaks defaults ----
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "accent": "burgundy",
    "fontPair": "serif-sans",
    "density": "comfy",
    "cardStyle": "classic"
  }/*EDITMODE-END*/;

  const stored = JSON.parse(localStorage.getItem('cpa-tweaks') || 'null');
  const tweaks = Object.assign({}, TWEAK_DEFAULTS, stored || {});

  const ACCENTS = {
    burgundy: { light: 'oklch(0.42 0.12 25)',  lightWash: 'oklch(0.94 0.03 40)', dark: 'oklch(0.72 0.11 25)', darkWash: 'oklch(0.22 0.05 25)' },
    forest:   { light: 'oklch(0.40 0.08 150)', lightWash: 'oklch(0.94 0.03 150)', dark: 'oklch(0.72 0.09 150)', darkWash: 'oklch(0.22 0.05 150)' },
    ink:      { light: 'oklch(0.25 0.02 260)', lightWash: 'oklch(0.94 0.01 260)', dark: 'oklch(0.80 0.02 260)', darkWash: 'oklch(0.22 0.02 260)' },
    ochre:    { light: 'oklch(0.55 0.12 70)',  lightWash: 'oklch(0.94 0.04 70)',  dark: 'oklch(0.75 0.11 70)', darkWash: 'oklch(0.24 0.05 70)' }
  };

  const FONTS = {
    'serif-sans':  { serif: "'Source Serif 4', Georgia, serif", sans: "'Inter', system-ui, sans-serif" },
    'mono-serif':  { serif: "'Source Serif 4', Georgia, serif", sans: "'JetBrains Mono', ui-monospace, monospace" },
    'sans-only':   { serif: "'Inter', system-ui, sans-serif",    sans: "'Inter', system-ui, sans-serif" }
  };

  function applyTweaks(t) {
    const root = document.documentElement;
    const isDark = root.getAttribute('data-theme') === 'dark';
    const a = ACCENTS[t.accent] || ACCENTS.burgundy;
    root.style.setProperty('--accent', isDark ? a.dark : a.light);
    root.style.setProperty('--accent-wash', isDark ? a.darkWash : a.lightWash);

    const f = FONTS[t.fontPair] || FONTS['serif-sans'];
    root.style.setProperty('--serif', f.serif);
    root.style.setProperty('--sans', f.sans);

    const scales = { tight: 0.88, comfy: 1, airy: 1.15 };
    root.style.setProperty('--scale', scales[t.density] || 1);

    root.setAttribute('data-card', t.cardStyle || 'classic');
  }

  applyTweaks(tweaks);

  // ---- Theme toggle ----
  document.addEventListener('click', (e) => {
    const tgl = e.target.closest('[data-theme-toggle]');
    if (!tgl) return;
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('cpa-theme', next);
    applyTweaks(tweaks);
  });

  // ---- Tweaks panel UI ----
  function buildTweaksPanel() {
    let panel = document.querySelector('.tweaks-panel');
    if (panel) return panel;
    panel = document.createElement('div');
    panel.className = 'tweaks-panel';
    panel.innerHTML = `
      <h4>Tweaks <span style="cursor:pointer; font-size:14px;" data-close>×</span></h4>
      <div class="tweaks-row">
        <label>Accent color</label>
        <div class="tweaks-swatches" data-group="accent">
          <div class="tweaks-swatch" data-value="burgundy" style="background: oklch(0.42 0.12 25)"></div>
          <div class="tweaks-swatch" data-value="forest"   style="background: oklch(0.40 0.08 150)"></div>
          <div class="tweaks-swatch" data-value="ink"      style="background: oklch(0.25 0.02 260)"></div>
          <div class="tweaks-swatch" data-value="ochre"    style="background: oklch(0.55 0.12 70)"></div>
        </div>
      </div>
      <div class="tweaks-row">
        <label>Font pairing</label>
        <div class="tweaks-seg" data-group="fontPair">
          <button data-value="serif-sans">Serif + Sans</button>
          <button data-value="mono-serif">Serif + Mono</button>
          <button data-value="sans-only">Sans only</button>
        </div>
      </div>
      <div class="tweaks-row">
        <label>Density</label>
        <div class="tweaks-seg" data-group="density">
          <button data-value="tight">Tight</button>
          <button data-value="comfy">Comfy</button>
          <button data-value="airy">Airy</button>
        </div>
      </div>
      <div class="tweaks-row">
        <label>Card style</label>
        <div class="tweaks-seg" data-group="cardStyle">
          <button data-value="classic">Classic</button>
          <button data-value="bordered">Bordered</button>
          <button data-value="minimal">Minimal</button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    function refreshActive() {
      panel.querySelectorAll('[data-group]').forEach(g => {
        const key = g.getAttribute('data-group');
        g.querySelectorAll('[data-value]').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-value') === tweaks[key]);
        });
      });
    }
    refreshActive();

    panel.addEventListener('click', (e) => {
      if (e.target.matches('[data-close]')) {
        panel.classList.remove('open');
        return;
      }
      const btn = e.target.closest('[data-value]');
      if (!btn) return;
      const group = btn.closest('[data-group]').getAttribute('data-group');
      const value = btn.getAttribute('data-value');
      tweaks[group] = value;
      localStorage.setItem('cpa-tweaks', JSON.stringify(tweaks));
      applyTweaks(tweaks);
      refreshActive();
      try {
        window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [group]: value } }, '*');
      } catch (_) {}
    });
    return panel;
  }

  // ---- Edit mode integration ----
  window.addEventListener('message', (e) => {
    if (!e.data || !e.data.type) return;
    if (e.data.type === '__activate_edit_mode') {
      buildTweaksPanel().classList.add('open');
    } else if (e.data.type === '__deactivate_edit_mode') {
      const p = document.querySelector('.tweaks-panel');
      if (p) p.classList.remove('open');
    }
  });
  try {
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
  } catch (_) {}

  // ---- Reading progress bar (if present) ----
  const bar = document.querySelector('[data-reading-progress]');
  if (bar) {
    const article = document.querySelector('article');
    window.addEventListener('scroll', () => {
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const total = article.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const pct = total > 0 ? (scrolled / total) * 100 : 0;
      bar.style.width = pct + '%';
    }, { passive: true });
  }

  // ---- TOC active tracking ----
  const tocLinks = document.querySelectorAll('[data-toc] a');
  if (tocLinks.length) {
    const headings = [...document.querySelectorAll('article h2[id], article h3[id]')];
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          const id = en.target.id;
          tocLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
        }
      });
    }, { rootMargin: '-30% 0% -60% 0%' });
    headings.forEach(h => io.observe(h));
  }
})();
