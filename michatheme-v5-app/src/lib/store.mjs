export class NotificationStore {
  constructor(databaseUrl, pool = null) { this.url = databaseUrl; this.pool = pool; this.ready = null; }
  // pg erst laden wenn gebraucht (Tests laufen mit Fake-Pool ohne npm install)
  async db() {
    if (!this.pool) { const { default: pg } = await import('pg'); this.pool = new pg.Pool({ connectionString: this.url }); }
    return this.pool;
  }
  // Spalte dismissed_at für alte Datenbanken einmalig nachziehen
  schema() {
    if (!this.ready) this.ready = this.db().then((db) => db.query('ALTER TABLE mgd_shopify_notifications ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ NULL')).catch((error) => { this.ready = null; throw error; });
    return this.ready;
  }
  async feed(shop, customerId) {
    await this.schema();
    const values = customerId ? [shop, customerId] : [shop];
    const filter = customerId ? "(scope = 'public' OR (scope = 'personal' AND customer_id = $2 AND dismissed_at IS NULL))" : "scope = 'public'";
    // öffentliche: Lesestatus merkt sich der Browser, darum readAt nur bei persönlichen
    const { rows } = await (await this.db()).query(`SELECT id::text AS id, scope, title, body, target_url AS "targetUrl", published_at AS "publishedAt", CASE WHEN scope = 'personal' THEN read_at END AS "readAt" FROM mgd_shopify_notifications WHERE shop_domain = $1 AND status = 'published' AND published_at <= now() AND ${filter} ORDER BY published_at DESC LIMIT 30`, values);
    return rows;
  }
  // nur eigene, sichtbare, persönliche Meldungen - Kunde kommt immer aus dem signierten App-Proxy
  async personalUpdate(shop, customerId, set, extra = '', params = []) {
    if (!customerId) return null;
    await this.schema();
    const result = await (await this.db()).query(`UPDATE mgd_shopify_notifications SET ${set} WHERE shop_domain = $1 AND customer_id = $2 AND scope = 'personal' AND status = 'published' AND published_at <= now() AND dismissed_at IS NULL ${extra}`, [shop, customerId, ...params]);
    return result.rowCount;
  }
  async markAllRead(shop, customerId) { return this.personalUpdate(shop, customerId, 'read_at = now()', 'AND read_at IS NULL'); }
  async markRead(shop, customerId, id) { return this.personalUpdate(shop, customerId, 'read_at = COALESCE(read_at, now())', 'AND id = $3', [id]); }
  async dismiss(shop, customerId, id) { return this.personalUpdate(shop, customerId, 'dismissed_at = now(), read_at = COALESCE(read_at, now())', 'AND id = $3', [id]); }
  async dismissRead(shop, customerId) { return this.personalUpdate(shop, customerId, 'dismissed_at = now()', 'AND read_at IS NOT NULL'); }
  async rememberWebhook(shop, webhookId) {
    const result = await (await this.db()).query('INSERT INTO mgd_shopify_webhooks (shop_domain, webhook_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [shop, webhookId]);
    return result.rowCount === 1;
  }
  async createOnce(notification) {
    await (await this.db()).query('INSERT INTO mgd_shopify_notifications (shop_domain, scope, customer_id, source_key, title, body, target_url) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (shop_domain, source_key, customer_id) DO NOTHING', [notification.shop, notification.scope, notification.customerId || null, notification.sourceKey, notification.title, notification.body, notification.targetUrl || null]);
  }
  /** Diese Methoden sind ausschließlich für einen durch Shopify-Session-Token abgesicherten App-Admin vorgesehen. */
  async adminList(shop) {
    const { rows } = await (await this.db()).query('SELECT id, scope, customer_id AS "customerId", title, body, target_url AS "targetUrl", status, published_at AS "publishedAt" FROM mgd_shopify_notifications WHERE shop_domain = $1 ORDER BY published_at DESC LIMIT 100', [shop]);
    return rows;
  }
  async saveManual(shop, notification) {
    const values = [shop, notification.scope, notification.customerId || null, notification.sourceKey, notification.title, notification.body, notification.targetUrl || null, notification.status];
    if (notification.id) {
      await (await this.db()).query('UPDATE mgd_shopify_notifications SET scope = $3, customer_id = $4, title = $5, body = $6, target_url = $7, status = $8 WHERE id = $1 AND shop_domain = $2', [notification.id, ...values]);
      return notification.id;
    }
    const result = await (await this.db()).query('INSERT INTO mgd_shopify_notifications (shop_domain, scope, customer_id, source_key, title, body, target_url, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id', values);
    return result.rows[0].id;
  }
  async redactCustomer(shop, customerId) { await (await this.db()).query('DELETE FROM mgd_shopify_notifications WHERE shop_domain = $1 AND customer_id = $2', [shop, String(customerId)]); }
  async redactShop(shop) { await (await this.db()).query('DELETE FROM mgd_shopify_webhooks WHERE shop_domain = $1', [shop]); await (await this.db()).query('DELETE FROM mgd_shopify_notifications WHERE shop_domain = $1', [shop]); }
}
