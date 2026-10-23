import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { validAppProxy, validWebhook, sessionShop } from '../src/lib/signatures.mjs';

test('lehnt manipulierte Webhook-Signaturen ab', () => {
  const raw = Buffer.from('{"id":1}'); const signature = createHmac('sha256', 'secret').update(raw).digest('base64');
  assert.equal(validWebhook(raw, signature, 'secret'), true); assert.equal(validWebhook(raw, 'invalid', 'secret'), false);
});

test('prüft App-Proxy-Signaturen ohne das Signaturfeld selbst', () => {
  const params = new URLSearchParams([['shop', 'test.myshopify.com'], ['logged_in_customer_id', '7']]);
  const message = 'logged_in_customer_id=7shop=test.myshopify.com';
  params.set('signature', createHmac('sha256', 'secret').update(message).digest('hex'));
  assert.equal(validAppProxy(params, 'secret'), true); params.set('shop', 'other.myshopify.com'); assert.equal(validAppProxy(params, 'secret'), false);
});

test('liest nur gültige, nicht abgelaufene Shopify-Session-Tokens', () => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ dest: 'https://test.myshopify.com', exp: Math.floor(Date.now() / 1000) + 60 })).toString('base64url');
  const signed = `${header}.${payload}`; const token = `${signed}.${createHmac('sha256', 'secret').update(signed).digest('base64url')}`;
  assert.equal(sessionShop(`Bearer ${token}`, 'secret'), 'test.myshopify.com');
  assert.equal(sessionShop(`Bearer ${token}x`, 'secret'), null);
});
