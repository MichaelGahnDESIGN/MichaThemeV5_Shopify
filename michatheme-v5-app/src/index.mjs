import http from 'node:http';
import { URL } from 'node:url';
import { NotificationStore } from './lib/store.mjs';
import { validAppProxy, validWebhook } from './lib/signatures.mjs';
import { createRecommendationLoader } from './lib/recommendations.mjs';
import { handleAdmin } from './lib/admin.mjs';
import { adminPageHeaders, renderAdminPage } from './lib/admin-page.mjs';
import { readFile } from 'node:fs/promises';

const secret = process.env.SHOPIFY_API_SECRET;
const store = new NotificationStore(process.env.DATABASE_URL);
const loadRecommendations = createRecommendationLoader();
const json = (response, status, body) => { response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); response.end(JSON.stringify(body)); };
const rawBody = (request) => new Promise((resolve, reject) => { const chunks = []; request.on('data', (chunk) => chunks.push(chunk)); request.on('end', () => resolve(Buffer.concat(chunks))); request.on('error', reject); });

async function proxy(request, response, url) {
  if (!secret || !validAppProxy(url.searchParams, secret)) return json(response, 401, { error: 'Ungültige App-Proxy-Signatur' });
  const shop = url.searchParams.get('shop'); const customerId = url.searchParams.get('logged_in_customer_id');
  if (!shop) return json(response, 400, { error: 'Shop fehlt' });
  // apiVersion bleibt 1 (alte Themes laufen weiter), neue Aktionen stehen in features
  if (url.pathname.endsWith('/feed') && request.method === 'GET') return json(response, 200, { apiVersion: '1', features: ['read', 'dismiss', 'dismiss-read'], items: await store.feed(shop, customerId) });
  if (request.method !== 'POST') return json(response, 404, { error: 'Unbekannte Route' });
  const single = url.pathname.match(/\/(\d{1,18})\/(read|dismiss)$/);
  let count = null;
  if (single) count = single[2] === 'read' ? await store.markRead(shop, customerId, single[1]) : await store.dismiss(shop, customerId, single[1]);
  else if (url.pathname.endsWith('/read-all')) count = await store.markAllRead(shop, customerId);
  else if (url.pathname.endsWith('/dismiss-read')) count = await store.dismissRead(shop, customerId);
  else return json(response, 404, { error: 'Unbekannte Route' });
  // ohne angemeldeten Kunden gibts nichts zu ändern
  if (count === null) return json(response, 401, { success: false });
  return json(response, 200, { success: true, count });
  return json(response, 404, { error: 'Unbekannte Route' });
}

async function webhook(request, response, compliance = false) {
  const raw = await rawBody(request); const hmac = request.headers['x-shopify-hmac-sha256']; const shop = request.headers['x-shopify-shop-domain'];
  if (!secret || !shop || !validWebhook(raw, hmac, secret)) return json(response, 401, { error: 'Ungültige Webhook-Signatur' });
  const payload = JSON.parse(raw.toString('utf8')); const topic = request.headers['x-shopify-topic'];
  if (compliance) { if (topic === 'customers/redact') await store.redactCustomer(shop, payload.customer?.id || payload.customer_id); if (topic === 'shop/redact') await store.redactShop(shop); return json(response, 200, { success: true }); }
  const webhookId = request.headers['x-shopify-webhook-id']; if (!webhookId || !(await store.rememberWebhook(shop, webhookId))) return json(response, 200, { duplicate: true });
  if (topic === 'orders/updated' && payload.customer?.id) await store.createOnce({ shop, scope: 'personal', customerId: String(payload.customer.id), sourceKey: `order:${payload.id}:status:${payload.financial_status}:${payload.fulfillment_status}`, title: `Bestellung #${payload.name}`, body: 'Der Status deiner Bestellung wurde aktualisiert.', targetUrl: '/account' });
  if (topic === 'products/update' && payload.status === 'active') await store.createOnce({ shop, scope: 'public', sourceKey: `product:${payload.id}:updated:${payload.updated_at}`, title: payload.title, body: 'Ein Produkt wurde aktualisiert.', targetUrl: `/products/${payload.handle}` });
  return json(response, 200, { success: true });
}

async function asset(response, filename, contentType) {
  response.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
  response.end(await readFile(new URL(`./public/${filename}`, import.meta.url)));
}

http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, process.env.SHOPIFY_APP_URL || 'http://localhost');
    if (url.pathname === '/' && request.method === 'GET') {
      const page = renderAdminPage(process.env.SHOPIFY_API_KEY);
      if (!page) return json(response, 503, { error: 'Shopify-API-Schlüssel fehlt' });
      response.writeHead(200, adminPageHeaders());
      return response.end(page);
    }
    if (url.pathname === '/assets/admin-recommendations.js' && request.method === 'GET') return asset(response, 'admin-recommendations.js', 'application/javascript; charset=utf-8');
    if (url.pathname === '/assets/admin-recommendations.css' && request.method === 'GET') return asset(response, 'admin-recommendations.css', 'text/css; charset=utf-8');
    if (url.pathname.startsWith('/proxy/')) return proxy(request, response, url);
    if (url.pathname.startsWith('/admin/')) return handleAdmin(request, response, url, { secret, apiKey: process.env.SHOPIFY_API_KEY, store, loadRecommendations });
    if (url.pathname === '/webhooks/events') return webhook(request, response);
    if (url.pathname === '/webhooks/compliance') return webhook(request, response, true);
    return json(response, 404, { error: 'Nicht gefunden' });
  } catch {
    return json(response, 500, { error: 'Serverfehler' });
  }
}).listen(Number(process.env.PORT || 3000));
