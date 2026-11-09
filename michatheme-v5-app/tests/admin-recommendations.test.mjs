import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { URL } from 'node:url';
import { handleAdmin } from '../src/lib/admin.mjs';

const secret = 'test-secret';
const apiKey = 'test-api-key';
const token = () => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ aud: apiKey, dest: 'https://test.myshopify.com', iss: 'https://test.myshopify.com/admin', exp: now + 60, nbf: now - 1 })).toString('base64url');
  const signed = `${header}.${payload}`;
  return `${signed}.${createHmac('sha256', secret).update(signed).digest('base64url')}`;
};
const response = () => ({ status: 0, raw: '', writeHead(status) { this.status = status; }, end(body) { this.raw = body; } });

test('Empfehlungen verlangen eine gültige Shopify-Admin-Session', async () => {
  const denied = response();
  await handleAdmin({ method: 'GET', headers: {} }, denied, new URL('http://localhost/admin/recommendations'), { secret, apiKey, store: {}, loadRecommendations: async () => ({ items: [] }) });
  assert.equal(denied.status, 401);

  const allowed = response();
  await handleAdmin({ method: 'GET', headers: { authorization: `Bearer ${token()}` } }, allowed, new URL('http://localhost/admin/recommendations'), { secret, apiKey, store: {}, loadRecommendations: async () => ({ items: [{ slug: 'mgd-shopify-notify' }], catalogUrl: 'https://theme.michael-gahn.de/downloads?plattform=shopify', stale: false }) });
  assert.equal(allowed.status, 200);
  assert.deepEqual(JSON.parse(allowed.raw).items, [{ slug: 'mgd-shopify-notify' }]);
});
