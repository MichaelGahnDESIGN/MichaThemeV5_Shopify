CREATE TABLE IF NOT EXISTS mgd_shopify_notifications (
  id BIGSERIAL PRIMARY KEY,
  shop_domain TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('public', 'personal')),
  customer_id TEXT NULL,
  source_key TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_url TEXT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ NULL,
  UNIQUE (shop_domain, source_key, customer_id)
);
CREATE TABLE IF NOT EXISTS mgd_shopify_webhooks (
  shop_domain TEXT NOT NULL,
  webhook_id TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (shop_domain, webhook_id)
);
