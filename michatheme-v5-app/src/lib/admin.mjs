import { sessionShop } from './signatures.mjs';
import { randomUUID } from 'node:crypto';

export const sendJson = (response, status, body) => {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(body));
};

export const rawBody = (request) => new Promise((resolve, reject) => {
  const chunks = [];
  request.on('data', (chunk) => chunks.push(chunk));
  request.on('end', () => resolve(Buffer.concat(chunks)));
  request.on('error', reject);
});

/** Geschützter Shopify-Adminbereich; Empfehlungen benötigen keine Shopdaten. */
export async function handleAdmin(request, response, url, { secret, apiKey, store, loadRecommendations }) {
  const shop = sessionShop(request.headers.authorization, secret, apiKey);
  if (!shop) return sendJson(response, 401, { error: 'Ungültiger Shopify-Session-Token' });
  if (url.pathname === '/admin/recommendations' && request.method === 'GET') return sendJson(response, 200, await loadRecommendations());
  if (url.pathname === '/admin/notifications' && request.method === 'GET') return sendJson(response, 200, { items: await store.adminList(shop) });
  if (url.pathname === '/admin/notifications' && request.method === 'POST') {
    const input = JSON.parse((await rawBody(request)).toString('utf8'));
    const scope = input.scope === 'personal' ? 'personal' : 'public';
    const status = ['draft', 'published', 'archived'].includes(input.status) ? input.status : 'draft';
    const title = String(input.title || '').trim().slice(0, 255); const body = String(input.body || '').trim().slice(0, 10000);
    const customerId = scope === 'personal' ? String(input.customerId || '') : null;
    if (!title || !body || (scope === 'personal' && !customerId)) return sendJson(response, 422, { error: 'Titel, Text und bei persönlichen Meldungen eine Kunden-ID sind erforderlich.' });
    const id = await store.saveManual(shop, { id: Number(input.id) || null, scope, customerId, sourceKey: input.sourceKey || `manual:${randomUUID()}`, title, body, targetUrl: String(input.targetUrl || '').slice(0, 2048), status });
    return sendJson(response, 200, { id });
  }
  return sendJson(response, 404, { error: 'Unbekannte Admin-Route' });
}
