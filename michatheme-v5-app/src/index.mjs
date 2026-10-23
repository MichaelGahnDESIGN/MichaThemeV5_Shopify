import http from 'node:http';
import { URL } from 'node:url';
import { NotificationStore } from './lib/store.mjs';
import { randomUUID } from 'node:crypto';
import { sessionShop, validAppProxy, validWebhook } from './lib/signatures.mjs';

const secret = process.env.SHOPIFY_API_SECRET;
const store = new NotificationStore(process.env.DATABASE_URL);
const json = (response, status, body) => { response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); response.end(JSON.stringify(body)); };
const rawBody = (request) => new Promise((resolve, reject) => { const chunks = []; request.on('data', (chunk) => chunks.push(chunk)); request.on('end', () => resolve(Buffer.concat(chunks))); request.on('error', reject); });

async function proxy(request, response, url) {
  if (!secret || !validAppProxy(url.searchParams, secret)) return json(response, 401, { error: 'Ungültige App-Proxy-Signatur' });
  const shop = url.searchParams.get('shop'); const customerId = url.searchParams.get('logged_in_customer_id');
  if (!shop) return json(response, 400, { error: 'Shop fehlt' });
  if (url.pathname.endsWith('/feed') && request.method === 'GET') return json(response, 200, { apiVersion: '1', items: await store.feed(shop, customerId) });
  if (url.pathname.endsWith('/read-all') && request.method === 'POST') { await store.markAllRead(shop, customerId); return json(response, 200, { success: true }); }
  return json(response, 404, { error: 'Unbekannte Route' });
}

async function admin(request, response, url) {
  const shop = secret ? sessionShop(request.headers.authorization, secret) : null;
  if (!shop) return json(response, 401, { error: 'Ungültiger Shopify-Session-Token' });
  if (url.pathname === '/admin/notifications' && request.method === 'GET') return json(response, 200, { items: await store.adminList(shop) });
  if (url.pathname === '/admin/notifications' && request.method === 'POST') {
    const input = JSON.parse((await rawBody(request)).toString('utf8'));
    const scope = input.scope === 'personal' ? 'personal' : 'public';
    const status = ['draft', 'published', 'archived'].includes(input.status) ? input.status : 'draft';
    const title = String(input.title || '').trim().slice(0, 255); const body = String(input.body || '').trim().slice(0, 10000);
    const customerId = scope === 'personal' ? String(input.customerId || '') : null;
    if (!title || !body || (scope === 'personal' && !customerId)) return json(response, 422, { error: 'Titel, Text und bei persönlichen Meldungen eine Kunden-ID sind erforderlich.' });
    const id = await store.saveManual(shop, { id: Number(input.id) || null, scope, customerId, sourceKey: input.sourceKey || `manual:${randomUUID()}`, title, body, targetUrl: String(input.targetUrl || '').slice(0, 2048), status });
    return json(response, 200, { id });
  }
  return json(response, 404, { error: 'Unbekannte Admin-Route' });
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

http.createServer(async (request, response) => { try { const url = new URL(request.url, process.env.SHOPIFY_APP_URL || 'http://localhost'); if (url.pathname.startsWith('/proxy/')) return proxy(request, response, url); if (url.pathname.startsWith('/admin/')) return admin(request, response, url); if (url.pathname === '/webhooks/events') return webhook(request, response); if (url.pathname === '/webhooks/compliance') return webhook(request, response, true); return json(response, 404, { error: 'Nicht gefunden' }); } catch { return json(response, 500, { error: 'Serverfehler' }); } }).listen(Number(process.env.PORT || 3000));
