/* MichaThemeV5 Shopify JS - kein Drittanbieter, kein Tracking. Vorlage > MichaThemeV5-Pro/themes/shopify/assets
   Hell/Dunkel, Textgröße + Favoriten > mt-theme.js (aus dem Kern), hier nur Handy-Menü, Tabs
   Cookie-Button: kein eigenes Banner, nur privacyBanner von Shopify oder Event mt:consent-open für Consent-Apps
   2-Klick Video + verwandte Artikel nachladen */
(function () {
  'use strict';
  var root = document.documentElement;
  function setupNav() {
    document.querySelectorAll('[data-mt-nav-toggle]').forEach(function (btn) {
      var nav = document.getElementById(btn.getAttribute('aria-controls'));
      if (!nav) { return; }
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        nav.classList.toggle('is-open', open);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
          btn.setAttribute('aria-expanded', 'false');
          nav.classList.remove('is-open');
          btn.focus();
        }
      });
    });
  }

  function setupTabs() {
    if (root.getAttribute('data-mt-tabs') !== 'tabs') { return; }
    document.querySelectorAll('[data-mt-panels]').forEach(function (wrap, w) {
      var panels = Array.prototype.slice.call(wrap.querySelectorAll(':scope > details.mt-panel'));
      if (panels.length < 2) { return; }
      var list = document.createElement('div');
      list.className = 'mt-tablist';
      list.setAttribute('role', 'tablist');
      var tabs = panels.map(function (p, i) {
        var tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'mt-tab';
        tab.id = 'mt-tab-' + w + '-' + i;
        tab.setAttribute('role', 'tab');
        tab.textContent = p.querySelector('summary').textContent.trim();
        var body = p.querySelector('.mt-panel__body');
        body.id = body.id || 'mt-tabpanel-' + w + '-' + i;
        body.setAttribute('role', 'tabpanel');
        body.setAttribute('aria-labelledby', tab.id);
        body.setAttribute('tabindex', '0');
        tab.setAttribute('aria-controls', body.id);
        list.appendChild(tab);
        return tab;
      });
      function select(i, focus) {
        tabs.forEach(function (t, j) {
          var on = i === j;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.tabIndex = on ? 0 : -1;
          panels[j].open = on;
          panels[j].hidden = !on;
        });
        if (focus) { tabs[i].focus(); }
      }
      list.addEventListener('click', function (e) {
        var i = tabs.indexOf(e.target.closest('[role="tab"]'));
        if (i >= 0) { select(i, false); }
      });
      list.addEventListener('keydown', function (e) {
        var i = tabs.indexOf(document.activeElement);
        if (i < 0) { return; }
        if (e.key === 'ArrowRight') { select((i + 1) % tabs.length, true); e.preventDefault(); }
        if (e.key === 'ArrowLeft') { select((i - 1 + tabs.length) % tabs.length, true); e.preventDefault(); }
        if (e.key === 'Home') { select(0, true); e.preventDefault(); }
        if (e.key === 'End') { select(tabs.length - 1, true); e.preventDefault(); }
      });
      wrap.insertBefore(list, wrap.firstChild);
      wrap.classList.add('mt-panels--tabs');
      select(0, false);
    });
  }

  function consentAvailable() {
    return !!(window.privacyBanner && typeof window.privacyBanner.showPreferences === 'function');
  }
  function setupConsent() {
    var buttons = document.querySelectorAll('[data-mt-consent-open]');
    if (!buttons.length) { return; }
    var show = function () { document.querySelectorAll('[data-mt-consent-item]').forEach(function (li) { li.hidden = false; }); };
    if (consentAvailable() || window.mtConsentProvider === true) { show(); }
    document.addEventListener('mt:consent-ready', show);
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        document.dispatchEvent(new CustomEvent('mt:consent-open'));
        if (consentAvailable()) { window.privacyBanner.showPreferences(); }
      });
    });
  }

  // 2-Klick Video: iframe erst hier nach Klick, youtube-nocookie bzw. vimeo dnt
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest ? ev.target.closest('[data-mt-video-load]') : null;
    if (b) { loadVideo(b); }
  });
  var embeds = {
    youtube: { id: /^[A-Za-z0-9_-]{6,20}$/, url: 'https://www.youtube-nocookie.com/embed/', query: '?autoplay=1&rel=0' },
    vimeo: { id: /^[0-9]{1,15}$/, url: 'https://player.vimeo.com/video/', query: '?autoplay=1&dnt=1' }
  };
  function loadVideo(btn) {
    var box = btn.closest('[data-mt-video]');
    if (!box) { return; }
    var e = embeds[box.getAttribute('data-mt-video-provider')];
    var id = box.getAttribute('data-mt-video-id') || '';
    if (!e || !e.id.test(id)) { return; }
    var frame = document.createElement('iframe');
    frame.src = e.url + id + e.query;
    frame.title = box.getAttribute('data-mt-video-title') || '';
    frame.allow = 'autoplay; fullscreen; picture-in-picture';
    frame.allowFullscreen = true;
    frame.className = 'mt-video__frame';
    box.textContent = '';
    box.appendChild(frame);
    box.classList.add('is-loaded');
    frame.focus();
  }

  // verwandte Artikel > Section-Rendering von Shopify, gleiche Domain
  function setupRecommendations() {
    document.querySelectorAll('[data-mt-recommendations]').forEach(function (box) {
      var url = box.getAttribute('data-url');
      if (!url || url.charAt(0) !== '/' || !window.fetch) { return; }
      fetch(url).then(function (r) { return r.ok ? r.text() : ''; }).then(function (html) {
        if (!html) { return; }
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var fresh = doc.querySelector('[data-mt-recommendations]');
        if (fresh && fresh.children.length) {
          box.innerHTML = fresh.innerHTML;
          // neue Karten > Herz-Status nachziehen
          document.dispatchEvent(new Event('mt:favs-sync'));
        }
      }).catch(function () { /* ohne Empfehlungen bleibt die Section leer */ });
    });
  }

  // Höhe Kopfzeile für sticky Header (Desktop hat zwei Zeilen)
  function setupHeaderHeight() {
    var header = document.querySelector('.mt-header');
    if (!header) { return; }
    var set = function () { root.style.setProperty('--mt-header-h', header.offsetHeight + 'px'); };
    set();
    window.addEventListener('resize', set);
  }

  setupHeaderHeight();
  setupNav();
  setupTabs();
  setupConsent();
  setupRecommendations();
})();
