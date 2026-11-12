// Store der Glocke mit Fake-Pool: nur eigene, sichtbare, persönliche Meldungen ändern
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { NotificationStore } from '../src/lib/store.mjs';

const fakePool = (rowCount = 1) => {
  const calls = [];
  return { calls, query: async (sql, params = []) => { calls.push({ sql, params }); return { rows: [], rowCount }; } };
};

test('Feed: öffentliche ohne Lesestatus, persönliche nur eigene und nicht ausgeblendete', async () => {
  const pool = fakePool();
  const store = new NotificationStore(null, pool);
  await store.feed('a.myshopify.com', '42');
  const feed = pool.calls.at(-1);
  assert.match(feed.sql, /customer_id = \$2 AND dismissed_at IS NULL/);
  assert.match(feed.sql, /CASE WHEN scope = 'personal' THEN read_at END/);
  assert.match(feed.sql, /published_at <= now\(\)/);
  assert.deepEqual(feed.params, ['a.myshopify.com', '42']);
  // Schema-Nachzug nur einmal
  await store.feed('a.myshopify.com', null);
  assert.equal(pool.calls.filter((c) => /ADD COLUMN IF NOT EXISTS dismissed_at/.test(c.sql)).length, 1);
});

test('Gast: keine Aktion, kein Datenbankzugriff', async () => {
  const pool = fakePool();
  const store = new NotificationStore(null, pool);
  for (const action of [() => store.markAllRead('s', null), () => store.markRead('s', '', '5'), () => store.dismiss('s', undefined, '5'), () => store.dismissRead('s', null)]) {
    assert.equal(await action(), null);
  }
  assert.equal(pool.calls.length, 0);
});

test('Aktionen: Shop + Kunde + persönlich + sichtbar, Anzahl zurück', async () => {
  const pool = fakePool(3);
  const store = new NotificationStore(null, pool);
  assert.equal(await store.markAllRead('s', '42'), 3);
  assert.equal(await store.dismiss('s', '42', '7'), 3);
  assert.equal(await store.dismissRead('s', '42'), 3);
  const updates = pool.calls.filter((c) => c.sql.startsWith('UPDATE'));
  assert.equal(updates.length, 3);
  for (const u of updates) {
    assert.match(u.sql, /shop_domain = \$1 AND customer_id = \$2 AND scope = 'personal' AND status = 'published' AND published_at <= now\(\) AND dismissed_at IS NULL/);
    assert.deepEqual(u.params.slice(0, 2), ['s', '42']);
  }
  assert.match(updates[1].sql, /dismissed_at = now\(\), read_at = COALESCE/);
  assert.deepEqual(updates[1].params, ['s', '42', '7']);
  assert.match(updates[2].sql, /AND read_at IS NOT NULL/);
});
