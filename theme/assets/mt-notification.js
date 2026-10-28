/* MichaThemeV5 Notification Glocke - Meldungen aus der MichaThemeV5-App (App-Proxy), kein Drittanbieter, kein Tracking
   Vorlage > MichaThemeV5-Pro/themes/shopify/assets
   Glocke bleibt versteckt, bis die App mindestens 1 Eintrag liefert (im Theme-Editor kommt ein Hinweis)
   Tastatur: Enter/Leertaste öffnet, Escape schließt und setzt den Fokus zurück auf die Glocke */
(function () {
  'use strict';

  // nur Proxy-Pfade, die Shopify kennt
  var PATH_OK = /^\/(apps|a|community|tools)\/[A-Za-z0-9_\/-]+$/;
  // Links aus der App nur als Pfad im eigenen Shop
  function safeLink(url) {
    return typeof url === 'string' && url.charAt(0) === '/' && url.charAt(1) !== '/' && url.indexOf('\\') === -1 ? url : '';
  }

  function setup(root) {
    var path = (root.getAttribute('data-proxy-path') || '').replace(/\/+$/, '');
    var button = root.querySelector('.mt-notification__button');
    var panel = root.querySelector('.mt-notification__panel');
    var list = root.querySelector('[data-mt-notification-list]');
    var empty = root.querySelector('[data-mt-notification-empty]');
    var count = root.querySelector('[data-mt-notification-count]');
    var hint = root.getAttribute('data-editor-hint') || '';
    var labelPlain = root.getAttribute('data-label') || '';
    var labelUnread = root.getAttribute('data-label-unread') || '%s';
    var compatible = false;
    var unread = 0;
    if (!button || !panel || !list || !count || !PATH_OK.test(path)) { return; }

    function setUnread(n) {
      unread = n;
      count.textContent = String(n);
      count.hidden = n === 0;
      button.setAttribute('aria-label', n > 0 ? labelUnread.replace('%s', String(n)) : labelPlain);
    }

    function setOpen(open) {
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.hidden = !open;
      // gelesen markieren nur mit passender App-Version
      if (open && compatible && unread > 0) {
        fetch(path + '/read-all', { method: 'POST', credentials: 'same-origin' }).then(function (r) {
          if (r.ok) { setUnread(0); }
        }).catch(function () { /* nächstes Mal wieder */ });
      }
    }

    function render(items) {
      list.textContent = '';
      empty.hidden = items.length > 0;
      items.forEach(function (item) {
        if (!item || typeof item.title !== 'string') { return; }
        var li = document.createElement('li');
        li.className = 'mt-notification__item' + (item.readAt ? '' : ' is-unread');
        var href = safeLink(item.targetUrl);
        var title = document.createElement(href ? 'a' : 'span');
        title.className = 'mt-notification__item-title';
        title.textContent = item.title;
        if (href) { title.setAttribute('href', href); }
        li.appendChild(title);
        if (typeof item.body === 'string' && item.body) {
          var text = document.createElement('p');
          text.className = 'mt-notification__item-text';
          text.textContent = item.body;
          li.appendChild(text);
        }
        list.appendChild(li);
      });
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
      if (!root.contains(e.target) && button.getAttribute('aria-expanded') === 'true') { setOpen(false); }
    });

    fetch(path + '/feed', { credentials: 'same-origin', headers: { Accept: 'application/json' } }).then(function (r) {
      if (!r.ok) { throw new Error('feed'); }
      return r.json();
    }).then(function (feed) {
      if (!feed || typeof feed.apiVersion !== 'string' || !Array.isArray(feed.items)) { throw new Error('feed'); }
      // andere App-Version: nur öffentliche Meldungen, nichts Persönliches anfassen
      compatible = feed.apiVersion === root.getAttribute('data-app-api');
      var items = feed.items.filter(function (item) { return item && (compatible || item.scope === 'public'); });
      render(items);
      setUnread(items.filter(function (item) { return !item.readAt; }).length);
      // ohne Einträge bleibt die Glocke weg
      root.hidden = items.length === 0;
    }).catch(failed);
  }

  document.querySelectorAll('[data-mt-notification]').forEach(setup);
})();
