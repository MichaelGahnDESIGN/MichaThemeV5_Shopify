/* MichaThemeV5 Notification Glocke - Meldungen aus der MichaThemeV5-App (App-Proxy), kein Drittanbieter, kein Tracking
   Vorlage > MichaThemeV5-Pro/themes/shopify/assets  (gleiche Datei im App-Block > extensions/michatheme-notification/assets)
   Glocke bleibt versteckt, bis die App mindestens 1 Eintrag liefert (im Theme-Editor kommt ein Hinweis)
   Panel mit X aktuellen, "Alle anzeigen", Alle gelesen, Ausblenden. Escape schließt und setzt den Fokus zurück */
(function () {
  'use strict';

  // nur Proxy-Pfade, die Shopify kennt
  var PATH_OK = /^\/(apps|a|community|tools)\/[A-Za-z0-9_\/-]+$/;
  // Links aus der App nur als Pfad im eigenen Shop
  function safeLink(url) {
    return typeof url === 'string' && url.charAt(0) === '/' && url.charAt(1) !== '/' && url.indexOf('\\') === -1 ? url : '';
  }
  // öffentliche Meldungen: gelesen/ausgeblendet nur im Browser
  var READ_KEY = 'mt-notification-read-v1';
  var HIDE_KEY = 'mt-notification-hidden-v1';
  function load(key) {
    try { var v = JSON.parse(window.localStorage.getItem(key) || '[]'); return Array.isArray(v) ? v.filter(function (x) { return typeof x === 'string' && x.length < 120; }).slice(-500) : []; } catch (e) { return []; }
  }
  function save(key, list) { try { window.localStorage.setItem(key, JSON.stringify(list.slice(-500))); return true; } catch (e) { return false; } }
  var publicRead = load(READ_KEY);
  var publicHidden = load(HIDE_KEY);
  function has(list, v) { return list.indexOf(v) !== -1; }
  function add(list, v) { if (!has(list, v)) { list.push(v); } }

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) { n.className = cls; } if (text !== undefined) { n.textContent = text; } return n; }
  function fill(tpl, value) { return String(tpl || '').replace('%s', String(value)); }

  function setup(root) {
    if (root.getAttribute('data-mt-ready')) { return; }
    root.setAttribute('data-mt-ready', '1');
    var path = (root.getAttribute('data-proxy-path') || '').replace(/\/+$/, '');
    var button = root.querySelector('.mt-notification__button');
    var panel = root.querySelector('.mt-notification__panel');
    var list = root.querySelector('[data-mt-notification-list]');
    var empty = root.querySelector('[data-mt-notification-empty]');
    var count = root.querySelector('[data-mt-notification-count]');
    var readAllBtn = root.querySelector('[data-mt-notification-read-all]');
    var hideReadBtn = root.querySelector('[data-mt-notification-hide-read]');
    var showAll = root.querySelector('[data-mt-notification-show-all]');
    var status = root.querySelector('[data-mt-notification-status]');
    var hint = root.getAttribute('data-editor-hint') || '';
    var labelPlain = root.getAttribute('data-label') || '';
    var labelUnread = root.getAttribute('data-label-unread') || '%s';
    var limit = Math.max(1, Math.min(30, parseInt(root.getAttribute('data-limit'), 10) || 5));
    var t = {};
    try { t = JSON.parse(root.getAttribute('data-texts') || '{}') || {}; } catch (e) { t = {}; }
    var compatible = false;
    var features = [];
    var items = [];
    var hiddenPersonal = [];
    var busy = false;
    if (!button || !panel || !list || !count || !PATH_OK.test(path)) { return; }

    // Meldung dahin, wo der Nutzer gerade ist (Fenster offen > Status im Fenster)
    function say(text) { var target = dialog && dialog.open ? dStatus : status; if (target) { target.textContent = text || ''; } }
    function keyOf(item) { return (item.scope === 'personal' ? 'p' : 'o') + item.id + ':' + (item.publishedAt || ''); }
    function isRead(item) { return item.scope === 'personal' ? !!item.readAt : has(publicRead, keyOf(item)); }
    function isHidden(item) { return item.scope === 'personal' ? has(hiddenPersonal, String(item.id)) : has(publicHidden, keyOf(item)); }
    function visible() { return items.filter(function (i) { return !isHidden(i); }); }
    function can(feature) { return compatible && features.indexOf(feature) !== -1; }
    function post(suffix) {
      return fetch(path + suffix, { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : { success: false }; })
        .then(function (d) { return !!(d && d.success === true); })
        .catch(function () { return false; });
    }
    function formatDate(v) {
      var d = new Date(v);
      return !v || isNaN(d.getTime()) ? '' : d.toLocaleDateString(document.documentElement.lang || undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    function meta(item) { return [formatDate(item.publishedAt), isRead(item) ? (t.stateRead || 'Gelesen') : (t.stateNew || 'Neu')].filter(Boolean).join(' · '); }

    function markRead(item) {
      if (isRead(item)) { return Promise.resolve(true); }
      if (item.scope !== 'personal') { add(publicRead, keyOf(item)); save(READ_KEY, publicRead); render(); return Promise.resolve(true); }
      if (!can('read')) { return Promise.resolve(false); }
      return post('/' + encodeURIComponent(item.id) + '/read').then(function (ok) { if (ok) { item.readAt = new Date().toISOString(); render(); } return ok; });
    }
    function hide(item) {
      if (item.scope !== 'personal') { add(publicHidden, keyOf(item)); add(publicRead, keyOf(item)); save(HIDE_KEY, publicHidden); save(READ_KEY, publicRead); render(); return Promise.resolve(true); }
      if (!can('dismiss')) { return Promise.resolve(false); }
      return post('/' + encodeURIComponent(item.id) + '/dismiss').then(function (ok) { if (ok) { add(hiddenPersonal, String(item.id)); render(); } return ok; });
    }

    // Modal "Alle Benachrichtigungen"
    var dialog = el('dialog', 'mt-notification__dialog');
    var dId = (panel.id || 'mt-notification') + '-all';
    dialog.setAttribute('aria-labelledby', dId);
    var dHead = el('header', 'mt-notification__dialog-head');
    var dTitle = el('h2', '', t.allTitle || 'Alle Benachrichtigungen'); dTitle.id = dId;
    var dReadAll = el('button', 'mt-notification__tool', t.readAll || 'Alle gelesen'); dReadAll.type = 'button';
    var dHideRead = el('button', 'mt-notification__tool', t.hideRead || 'Gelesene ausblenden'); dHideRead.type = 'button';
    var dClose = el('button', 'mt-notification__dialog-close', '×'); dClose.type = 'button'; dClose.setAttribute('aria-label', t.close || 'Fenster schließen');
    dHead.appendChild(dTitle); dHead.appendChild(dReadAll); dHead.appendChild(dHideRead); dHead.appendChild(dClose);
    var dBody = el('div', 'mt-notification__dialog-body');
    var dStatus = el('p', 'mt-notification__status'); dStatus.setAttribute('role', 'status'); dStatus.setAttribute('aria-live', 'polite');
    var dEmpty = el('p', 'mt-notification__empty', t.empty || '');
    var dList = el('div', 'mt-notification__dialog-list');
    dBody.appendChild(dStatus); dBody.appendChild(dEmpty); dBody.appendChild(dList);
    dialog.appendChild(dHead); dialog.appendChild(dBody);
    document.body.appendChild(dialog);
    function closeDialog() { if (typeof dialog.close === 'function') { dialog.close(); } else { dialog.removeAttribute('open'); button.focus(); } }
    dClose.addEventListener('click', closeDialog);
    dialog.addEventListener('close', function () { button.focus(); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) { closeDialog(); } });
    var dialogKeys = null;

    function hideButton(item, cls, text) {
      var b = el('button', cls, text); b.type = 'button';
      b.setAttribute('aria-label', fill(t.hideLabel || 'Meldung ausblenden: %s', item.title || ''));
      b.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        hide(item).then(function (ok) { if (!ok) { say(t.error || ''); } });
      });
      return b;
    }
    function panelItem(item) {
      var li = el('li', 'mt-notification__item' + (isRead(item) ? ' is-read' : ' is-unread'));
      var title = el('button', 'mt-notification__item-title', String(item.title || '')); title.type = 'button'; title.setAttribute('aria-haspopup', 'dialog');
      title.addEventListener('click', function () { markRead(item); openDialog(item); });
      li.appendChild(title);
      var text = typeof item.body === 'string' ? item.body.replace(/\s+/g, ' ').trim() : '';
      if (text) { li.appendChild(el('p', 'mt-notification__item-text', text.length > 140 ? text.slice(0, 140) + ' …' : text)); }
      var foot = el('div', 'mt-notification__foot');
      foot.appendChild(el('small', '', meta(item)));
      if (item.scope !== 'personal' || can('dismiss')) { foot.appendChild(hideButton(item, 'mt-notification__hide', t.hide || 'Ausblenden')); }
      li.appendChild(foot);
      return li;
    }
    function dialogItem(item) {
      var d = el('details', 'mt-notification__dialog-item' + (isRead(item) ? ' is-read' : ''));
      d.setAttribute('data-key', keyOf(item));
      var s = el('summary');
      s.appendChild(el('span', '', String(item.title || '')));
      s.appendChild(el('small', '', meta(item)));
      var c = el('div', 'mt-notification__dialog-content');
      // nur Text, Absätze bleiben (white-space: pre-line)
      c.appendChild(el('p', '', typeof item.body === 'string' ? item.body : ''));
      var actions = el('div', 'mt-notification__dialog-actions');
      var href = safeLink(item.targetUrl);
      if (href) { var a = el('a', '', t.openLink || 'Ansehen'); a.setAttribute('href', href); actions.appendChild(a); }
      if (item.scope !== 'personal' || can('dismiss')) { actions.appendChild(hideButton(item, 'mt-notification__tool', t.hide || 'Ausblenden')); }
      c.appendChild(actions);
      d.appendChild(s); d.appendChild(c);
      d.addEventListener('toggle', function () { if (d.open) { markRead(item); } });
      return d;
    }
    function find(key) {
      var nodes = dList.querySelectorAll('[data-key]');
      for (var i = 0; i < nodes.length; i++) { if (nodes[i].getAttribute('data-key') === key) { return nodes[i]; } }
      return null;
    }
    function openDialog(focusItem) {
      render(); setOpen(false);
      if (typeof dialog.showModal === 'function') { dialog.showModal(); } else { dialog.setAttribute('open', ''); }
      var target = focusItem ? find(keyOf(focusItem)) : null;
      if (target) { target.open = true; target.querySelector('summary').focus(); } else { dClose.focus(); }
    }

    function render() {
      var vis = visible();
      var unread = vis.filter(function (i) { return !isRead(i); }).length;
      count.textContent = String(unread);
      count.hidden = unread === 0;
      button.setAttribute('aria-label', unread > 0 ? labelUnread.replace('%s', String(unread)) : labelPlain);
      var readable = vis.some(function (i) { return !isRead(i) && (i.scope !== 'personal' || can('read')); });
      var hideable = vis.some(function (i) { return isRead(i) && (i.scope !== 'personal' || can('dismiss-read')); });
      if (readAllBtn) { readAllBtn.disabled = busy || !readable; }
      if (hideReadBtn) { hideReadBtn.disabled = busy || !hideable; }
      dReadAll.disabled = busy || !readable;
      dHideRead.disabled = busy || !hideable;
      if (empty) { empty.hidden = vis.length > 0; }
      list.textContent = '';
      vis.slice(0, limit).forEach(function (i) { list.appendChild(panelItem(i)); });
      if (showAll) { showAll.hidden = vis.length === 0; showAll.textContent = vis.length > limit ? fill(t.showAllCount || 'Alle anzeigen (%s)', vis.length) : (t.showAll || 'Alle anzeigen'); }
      // Modal nur neu bauen wenn sich die Liste ändert (Fokus bleibt)
      var keys = vis.map(keyOf).join('|');
      if (keys !== dialogKeys) {
        var active = document.activeElement && dialog.contains(document.activeElement) ? document.activeElement.closest('details') : null;
        var focusKey = active ? active.getAttribute('data-key') : null;
        var open = [];
        Array.prototype.forEach.call(dList.querySelectorAll('details[open]'), function (d) { open.push(d.getAttribute('data-key')); });
        dList.textContent = '';
        vis.forEach(function (i) { var d = dialogItem(i); d.open = has(open, keyOf(i)); dList.appendChild(d); });
        dialogKeys = keys;
        if (focusKey) { var f = find(focusKey); if (f) { f.querySelector('summary').focus(); } } else if (dialog.open && !dialog.contains(document.activeElement)) { dClose.focus(); }
      } else {
        vis.forEach(function (i) {
          var d = find(keyOf(i));
          if (d) { d.className = 'mt-notification__dialog-item' + (isRead(i) ? ' is-read' : ''); d.querySelector('summary small').textContent = meta(i); }
        });
      }
      dEmpty.hidden = vis.length > 0;
      // ohne Einträge bleibt die Glocke weg
      root.hidden = items.length === 0;
    }

    function onReadAll() {
      if (busy) { return; }
      var vis = visible();
      busy = true; render();
      vis.forEach(function (i) { if (i.scope !== 'personal') { add(publicRead, keyOf(i)); } });
      save(READ_KEY, publicRead);
      var need = can('read') && vis.some(function (i) { return i.scope === 'personal' && !i.readAt; });
      (need ? post('/read-all') : Promise.resolve(true)).then(function (ok) {
        if (ok && need) { vis.forEach(function (i) { if (i.scope === 'personal') { i.readAt = i.readAt || new Date().toISOString(); } }); }
        busy = false; render();
        say(ok ? (t.doneRead || '') : (t.error || ''));
      });
    }
    function onHideRead() {
      if (busy) { return; }
      var read = visible().filter(isRead);
      busy = true; render();
      read.forEach(function (i) { if (i.scope !== 'personal') { add(publicHidden, keyOf(i)); } });
      save(HIDE_KEY, publicHidden);
      var need = can('dismiss-read') && read.some(function (i) { return i.scope === 'personal'; });
      (need ? post('/dismiss-read') : Promise.resolve(true)).then(function (ok) {
        if (ok && need) { read.forEach(function (i) { if (i.scope === 'personal') { add(hiddenPersonal, String(i.id)); } }); }
        busy = false; render();
        say(ok ? fill(t.doneHidden || '%s', read.length) : (t.error || ''));
      });
    }
    if (readAllBtn) { readAllBtn.addEventListener('click', onReadAll); }
    if (hideReadBtn) { hideReadBtn.addEventListener('click', onHideRead); }
    dReadAll.addEventListener('click', onReadAll);
    dHideRead.addEventListener('click', onHideRead);
    if (showAll) { showAll.addEventListener('click', function () { openDialog(null); }); }

    function setOpen(open) {
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.hidden = !open;
    }

    function failed() {
      // Besucher sehen nichts, im Editor erklärt ein Hinweis warum
      if (!hint) { return; }
      empty.textContent = hint;
      empty.hidden = false;
      root.hidden = false;
    }

    button.addEventListener('click', function () { setOpen(button.getAttribute('aria-expanded') !== 'true'); });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        button.focus();
      }
    });
    document.addEventListener('click', function (e) {
      var inside = e.composedPath ? e.composedPath().indexOf(root) !== -1 : root.contains(e.target);
      if (!inside && button.getAttribute('aria-expanded') === 'true') { setOpen(false); }
    });

    fetch(path + '/feed', { credentials: 'same-origin', headers: { Accept: 'application/json' } }).then(function (r) {
      if (!r.ok) { throw new Error('feed'); }
      return r.json();
    }).then(function (feed) {
      if (!feed || typeof feed.apiVersion !== 'string' || !Array.isArray(feed.items)) { throw new Error('feed'); }
      // andere App-Version: nur öffentliche Meldungen, nichts Persönliches anfassen
      compatible = feed.apiVersion === root.getAttribute('data-app-api');
      features = Array.isArray(feed.features) ? feed.features : [];
      items = feed.items.filter(function (item) { return item && typeof item.title === 'string' && (compatible || item.scope === 'public'); });
      render();
    }).catch(failed);
  }

  document.querySelectorAll('[data-mt-notification]').forEach(setup);
})();
