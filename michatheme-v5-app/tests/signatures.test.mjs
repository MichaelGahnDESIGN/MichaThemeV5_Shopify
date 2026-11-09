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

const apiKey = 'test-api-key';
const token = ({ header = { alg: 'HS256', typ: 'JWT' }, claims = {} } = {}) => {
  const now = Math.floor(Date.now() / 1000);
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify({ aud: apiKey, dest: 'https://test.myshopify.com', iss: 'https://test.myshopify.com/admin', exp: now + 60, nbf: now - 1, ...claims })).toString('base64url');
  const signed = `${encodedHeader}.${encodedPayload}`;
  return `${signed}.${createHmac('sha256', 'secret').update(signed).digest('base64url')}`;
};

test('liest nur gültige Shopify-ID-Tokens der eigenen App', () => {
  assert.equal(sessionShop(`Bearer ${token()}`, 'secret', apiKey), 'test.myshopify.com');
  assert.equal(sessionShop(`Bearer ${token()}x`, 'secret', apiKey), null);
  assert.equal(sessionShop(`Bearer ${token({ claims: { aud: 'fremde-app' } })}`, 'secret', apiKey), null);
  assert.equal(sessionShop(`Bearer ${token({ claims: { exp: Math.floor(Date.now() / 1000) - 1 } })}`, 'secret', apiKey), null);
  assert.equal(sessionShop(`Bearer ${token({ claims: { nbf: Math.floor(Date.now() / 1000) + 60 } })}`, 'secret', apiKey), null);
  assert.equal(sessionShop(`Bearer ${token({ header: { alg: 'none', typ: 'JWT' } })}`, 'secret', apiKey), null);
  assert.equal(sessionShop(`Bearer ${token({ claims: { iss: 'https://other.myshopify.com/admin' } })}`, 'secret', apiKey), null);
});
