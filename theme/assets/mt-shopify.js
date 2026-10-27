/* MichaThemeV5 – Shopify: Bedienung ohne Drittanbieter und ohne Tracking. Hand gepflegt (Vorlage in MichaThemeV5-Pro, themes/shopify/assets).
   - Hell/Dunkel-Umschalter (speichert nur "mt-mode" in localStorage, wenn der Besucher selbst umstellt; funktional, ohne Personenbezug)
   - Textgröße, Menü auf dem Handy, Reiter für Beschreibung
   - Cookie-Einstellungen: KEIN eigenes Banner. Der Button ruft nur das Shopify-Banner (privacyBanner) auf oder meldet das Ereignis
     "mt:consent-open", auf das eine Consent-App hören kann. Ohne Schnittstelle bleibt der Button verborgen. */
(function () {
  'use strict';
  var root = document.documentElement;
  var order = ['system', 'light', 'dark'];

  function currentMode() {
    var t = root.getAttribute('data-theme');
    return t === 'light' || t === 'dark' ? t : 'system';
  }
  function labelMode(b, mode) {
    var label = b.getAttribute('data-label-' + mode) || mode;
    var pattern = b.getAttribute('data-label-pattern') || '%s';
    b.setAttribute('aria-label', pattern.replace('%s', label));
    var out = b.querySelector('[data-mt-mode-label]');
    if (out) { out.textContent = label; }
  }
  function applyMode(mode, save) {
    if (mode === 'system') { root.removeAttribute('data-theme'); } else { root.setAttribute('data-theme', mode); }
    if (save) {
      try { window.localStorage.setItem('mt-mode', mode); } catch (e) { /* kein Speicher verfügbar */ }
    }
    document.querySelectorAll('[data-mt-mode-toggle]').forEach(function (b) { labelMode(b, mode); });
  }

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

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-mt-mode-toggle]') : null;
    if (t) { applyMode(order[(order.indexOf(currentMode()) + 1) % order.length], true); }
    var s = e.target.closest ? e.target.closest('[data-mt-size-step]') : null;
    if (s) {
      var sizes = ['small', 'normal', 'large'];
      var i = sizes.indexOf(root.getAttribute('data-mt-size') || 'normal');
      i = Math.max(0, Math.min(2, i + parseInt(s.getAttribute('data-mt-size-step'), 10)));
      root.setAttribute('data-mt-size', sizes[i]);
    }
  });

  applyMode(currentMode(), false);
  setupNav();
  setupTabs();
  setupConsent();
})();
