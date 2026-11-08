import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecommendationLoader, normalizeRecommendations } from '../src/lib/recommendations.mjs';

const feed = { schema: 1, platform: 'shopify', catalog_url: 'https://theme.michael-gahn.de/downloads?plattform=shopify', items: [{ slug: 'mgd-shopify-notify', platform: 'shopify', name: 'MGD Notify', description: 'Hinweise für Shopify.', version: '0.1.0', icon: 'bell' }] };

test('normalisiert nur den festen Shopify-Feed', () => {
  assert.deepEqual(normalizeRecommendations(feed), { items: [{ slug: 'mgd-shopify-notify', name: 'MGD Notify', description: 'Hinweise für Shopify.', version: '0.1.0', icon: 'bell' }], catalogUrl: 'https://theme.michael-gahn.de/downloads?plattform=shopify', stale: false });
  assert.equal(normalizeRecommendations({ ...feed, catalog_url: 'https://example.invalid' }), null);
  assert.equal(normalizeRecommendations({ ...feed, platform: 'wordpress' }), null);
});

test('cacht nur öffentliche Metadaten und fällt ohne Netzwerk leer zurück', async () => {
  let calls = 0; let clock = 1000;
  const loader = createRecommendationLoader({ now: () => clock, fetchImpl: async () => { calls += 1; return new Response(JSON.stringify(feed), { status: 200 }); } });
  assert.equal((await loader()).items.length, 1); assert.equal((await loader()).items.length, 1); assert.equal(calls, 1);
  const offline = createRecommendationLoader({ fetchImpl: async () => { throw new Error('offline'); } });
  assert.deepEqual(await offline(), { items: [], catalogUrl: null, stale: false });
});
