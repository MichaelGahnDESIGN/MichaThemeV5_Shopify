import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { adminPageHeaders, renderAdminPage } from '../src/lib/admin-page.mjs';

test('eingebettete Adminseite lädt nur lokale Kartenressourcen und Shopify App Bridge', () => {
  const page = renderAdminPage('public-api-key');
  assert.match(page, /meta name="shopify-api-key" content="public-api-key"/);
  assert.match(page, /https:\/\/cdn\.shopify\.com\/shopifycloud\/app-bridge\.js/);
  assert.match(page, /src="\/assets\/admin-recommendations\.js"/);
  assert.match(page, /href="\/assets\/admin-recommendations\.css"/);
  assert.equal(renderAdminPage(''), null);
  assert.match(adminPageHeaders()['Content-Security-Policy'], /connect-src 'self'/);
  assert.match(adminPageHeaders()['Content-Security-Policy'], /frame-ancestors https:\/\/admin\.shopify\.com/);
});

test('Karten-Client nutzt nur die geschützte lokale Empfehlungsroute', async () => {
  const source = await readFile(new URL('../src/public/admin-recommendations.js', import.meta.url), 'utf8');
  assert.match(source, /const endpoint = '\/admin\/recommendations'/);
  assert.match(source, /window\.shopify\.idToken\(\)/);
  assert.match(source, /Authorization: `Bearer \$\{token\}`/);
  assert.doesNotMatch(source, /theme\.michael-gahn\.de/);
  assert.doesNotMatch(source, /innerHTML/);
});
