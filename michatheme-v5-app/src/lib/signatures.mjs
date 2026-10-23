import { createHmac, timingSafeEqual } from 'node:crypto';

/** Vergleicht HMACs konstantzeitig und akzeptiert niemals fehlende oder unterschiedlich lange Werte. */
export function safeHmacEqual(expected, received) {
  const a = Buffer.from(expected, 'base64'); const b = Buffer.from(received || '', 'base64');
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

export function validWebhook(rawBody, received, secret) {
  return safeHmacEqual(createHmac('sha256', secret).update(rawBody).digest('base64'), received);
}

function safeHexEqual(expected, received) {
  const a = Buffer.from(expected, 'hex'); const b = Buffer.from(received || '', 'hex');
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

/** Shopify signiert App-Proxy-Parameter. `signature` selbst darf nicht in die Eingabe gelangen. */
export function validAppProxy(searchParams, secret) {
  const received = searchParams.get('signature') || '';
  const pairs = [...searchParams.entries()].filter(([key]) => key !== 'signature').sort(([a], [b]) => a.localeCompare(b));
  const message = pairs.map(([key, value]) => `${key}=${value}`).join('');
  return safeHexEqual(createHmac('sha256', secret).update(message).digest('hex'), received);
}

/** Prüft den von Shopify App Bridge ausgestellten, kurzlebigen Session-Token für Admin-Routen. */
export function sessionShop(authorization, secret) {
  const token = (authorization || '').replace(/^Bearer\s+/i, '');
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  let claims;
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch { return null; }
  if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) return null;
  const expected = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  if (!safeHmacEqual(expected, signature)) return null;
  try {
    const destination = new URL(claims.dest);
    return destination.protocol === 'https:' && destination.hostname.endsWith('.myshopify.com') ? destination.hostname : null;
  } catch { return null; }
}
