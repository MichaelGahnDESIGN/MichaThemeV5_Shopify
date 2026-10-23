import pg from 'pg';

export class NotificationStore {
  constructor(databaseUrl) { this.pool = new pg.Pool({ connectionString: databaseUrl }); }
  async feed(shop, customerId) {
    const values = customerId ? [shop, customerId] : [shop];
    const filter = customerId ? "(scope = 'public' OR (scope = 'personal' AND customer_id = $2))" : "scope = 'public'";
    const { rows } = await this.pool.query(`SELECT id, scope, title, body, target_url AS "targetUrl", read_at AS "readAt" FROM mgd_shopify_notifications WHERE shop_domain = $1 AND status = 'published' AND ${filter} ORDER BY published_at DESC LIMIT 30`, values);
    return rows;
  }
  async markAllRead(shop, customerId) {
    if (!customerId) return;
    await this.pool.query("UPDATE mgd_shopify_notifications SET read_at = now() WHERE shop_domain = $1 AND customer_id = $2 AND read_at IS NULL", [shop, customerId]);
  }
  async rememberWebhook(shop, webhookId) {
    const result = await this.pool.query('INSERT INTO mgd_shopify_webhooks (shop_domain, webhook_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [shop, webhookId]);
    return result.rowCount === 1;
  }
  async createOnce(notification) {
    await this.pool.query('INSERT INTO mgd_shopify_notifications (shop_domain, scope, customer_id, source_key, title, body, target_url) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (shop_domain, source_key, customer_id) DO NOTHING', [notification.shop, notification.scope, notification.customerId || null, notification.sourceKey, notification.title, notification.body, notification.targetUrl || null]);
  }
  /** Diese Methoden sind ausschließlich für einen durch Shopify-Session-Token abgesicherten App-Admin vorgesehen. */
  async adminList(shop) {
    const { rows } = await this.pool.query('SELECT id, scope, customer_id AS "customerId", title, body, target_url AS "targetUrl", status, published_at AS "publishedAt" FROM mgd_shopify_notifications WHERE shop_domain = $1 ORDER BY published_at DESC LIMIT 100', [shop]);
    return rows;
  }
  async saveManual(shop, notification) {
    const values = [shop, notification.scope, notification.customerId || null, notification.sourceKey, notification.title, notification.body, notification.targetUrl || null, notification.status];
    if (notification.id) {
      await this.pool.query('UPDATE mgd_shopify_notifications SET scope = $3, customer_id = $4, title = $5, body = $6, target_url = $7, status = $8 WHERE id = $1 AND shop_domain = $2', [notification.id, ...values]);
      return notification.id;
    }
    const result = await this.pool.query('INSERT INTO mgd_shopify_notifications (shop_domain, scope, customer_id, source_key, title, body, target_url, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id', values);
    return result.rows[0].id;
  }
  async redactCustomer(shop, customerId) { await this.pool.query('DELETE FROM mgd_shopify_notifications WHERE shop_domain = $1 AND customer_id = $2', [shop, String(customerId)]); }
  async redactShop(shop) { await this.pool.query('DELETE FROM mgd_shopify_webhooks WHERE shop_domain = $1', [shop]); await this.pool.query('DELETE FROM mgd_shopify_notifications WHERE shop_domain = $1', [shop]); }
}
