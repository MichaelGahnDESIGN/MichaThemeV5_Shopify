const FEED_URL = 'https://theme.michael-gahn.de/api/v1/recommendations/shopify.json';
const CATALOG_URL = 'https://theme.michael-gahn.de/downloads?plattform=shopify';
const TTL_MS = 15 * 60 * 1000;
const MAX_BYTES = 512 * 1024;
const empty = () => ({ items: [], catalogUrl: null, stale: false });

/** Akzeptiert nur öffentliche Kartenmetadaten; Shop-, Besucher- und Sitzungsdaten gehen nie an den Feed. */
export function normalizeRecommendations(feed) {
  if (!feed || feed.schema !== 1 || feed.platform !== 'shopify' || feed.catalog_url !== CATALOG_URL || !Array.isArray(feed.items)) return null;
  const items = [];
  for (const row of feed.items.slice(0, 80)) {
    if (!row || row.platform !== 'shopify' || typeof row.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug) || typeof row.name !== 'string' || !row.name.trim()) continue;
    items.push({ slug: row.slug, name: row.name.trim().slice(0, 120), description: typeof row.description === 'string' ? row.description.replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, 500) : '', version: typeof row.version === 'string' ? row.version.trim().slice(0, 40) : null, icon: typeof row.icon === 'string' ? row.icon.trim().slice(0, 40) : null });
  }
  return { items, catalogUrl: CATALOG_URL, stale: false };
}

/** Testbarer, rein prozesslokaler Cache für den serverseitigen Admin-Abruf. */
export function createRecommendationLoader({ fetchImpl = fetch, now = Date.now } = {}) {
  let cached = null;
  let expiresAt = 0;
  return async function loadRecommendations() {
    if (cached && now() < expiresAt) return cached;
    try {
      const response = await fetchImpl(FEED_URL, { method: 'GET', redirect: 'error', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) });
      if (!response?.ok) return cached ? { ...cached, stale: true } : empty();
      const body = await response.text();
      if (Buffer.byteLength(body, 'utf8') > MAX_BYTES) return cached ? { ...cached, stale: true } : empty();
      const result = normalizeRecommendations(JSON.parse(body));
      if (!result) return cached ? { ...cached, stale: true } : empty();
      cached = result;
      expiresAt = now() + TTL_MS;
      return cached;
    } catch {
      return cached ? { ...cached, stale: true } : empty();
    }
  };
}
