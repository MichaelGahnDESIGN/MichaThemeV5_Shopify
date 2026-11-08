/* Lokale Darstellung für die eingebettete Shopify-Adminansicht. */
(() => {
  const endpoint = '/admin/recommendations';
  const catalogLabel = 'Alle Shopify-Erweiterungen ansehen';
  const icons = { bell: '🔔', chart: '▥', code: '⌘', gear: '⚙', package: '◫', puzzle: '🧩', star: '★' };
  const status = document.querySelector('#mgd-status');
  const cards = document.querySelector('#mgd-recommendations');
  const setStatus = (message) => { status.textContent = message; };

  function createCard(item) {
    const article = document.createElement('article');
    article.className = 'mgd-card';
    const icon = document.createElement('span');
    icon.className = 'mgd-card__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = icons[item.icon] || '◆';
    const title = document.createElement('h3');
    title.textContent = item.name;
    article.append(icon, title);
    if (item.version) { const version = document.createElement('p'); version.className = 'mgd-card__version'; version.textContent = `Version ${item.version}`; article.append(version); }
    if (item.description) { const description = document.createElement('p'); description.textContent = item.description; article.append(description); }
    return article;
  }

  function appendCatalogLink(url) {
    if (!url) return;
    const link = document.createElement('a');
    link.className = 'mgd-catalog-link';
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = catalogLabel;
    cards.after(link);
  }

  async function load() {
    try {
      if (!window.shopify || typeof window.shopify.idToken !== 'function') throw new Error('Shopify App Bridge ist nicht verfügbar.');
      const token = await window.shopify.idToken();
      const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` }, credentials: 'same-origin' });
      if (!response.ok) throw new Error('Die Empfehlungen konnten nicht geladen werden.');
      const data = await response.json();
      cards.replaceChildren(...data.items.map(createCard));
      cards.setAttribute('aria-busy', 'false');
      appendCatalogLink(data.catalogUrl);
      setStatus(data.stale ? 'Zwischengespeicherte Empfehlungen werden angezeigt.' : data.items.length ? `${data.items.length} Empfehlungen verfügbar.` : 'Zurzeit sind keine Empfehlungen verfügbar.');
    } catch {
      cards.setAttribute('aria-busy', 'false');
      setStatus('Empfehlungen sind momentan nicht verfügbar. Bitte später erneut versuchen.');
    }
  }
  load();
})();
