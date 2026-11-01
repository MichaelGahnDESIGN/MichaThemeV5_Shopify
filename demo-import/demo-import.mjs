#!/usr/bin/env node
// MichaTheme V5 · Demo-Artikel für Shopify importieren und entfernen (Admin-GraphQL-API).
// Aufruf: node demo-import.mjs <import|remove> [--dry-run] [--yes] [--data products.json]
// Zugangsdaten nur über SHOPIFY_SHOP und SHOPIFY_ADMIN_TOKEN (Umgebungsvariablen). Siehe ANLEITUNG.md.
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';

export const DEMO_TAG = 'mt-demo';
export const DEMO_VENDOR = 'MichaTheme Demo';
export const SKU_PREFIX = 'MTDEMO-';
const DEFAULT_API_VERSION = '2025-10';
const PAGE = 100;

export class UsageError extends Error {}

function slug(text) {
  return String(text)
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 80).replace(/-+$/, '');
}

export function handleFor(product) {
  return slug(`${product.sku}-${product.title}`);
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function descriptionHtml(p) {
  const parts = [`<p><strong>${esc(p.short)}</strong></p>`, `<p>${esc(p.description)}</p>`];
  if (p.attributes?.length) {
    parts.push('<ul>' + p.attributes.map((a) => `<li>${esc(a.name)}: ${esc(a.value)}</li>`).join('') + '</ul>');
  }
  if (p.dimensions) {
    parts.push(`<p>Maße (L x B x H): ${esc(p.dimensions.length)} x ${esc(p.dimensions.width)} x ${esc(p.dimensions.height)} cm</p>`);
  }
  if (p.delivery_time) parts.push(`<p>Lieferzeit: ${esc(p.delivery_time)}</p>`);
  return parts.join('\n');
}

/** Shop-Adresse prüfen: nur *.myshopify.com (localhost/127.0.0.1 über http nur mit allowLocal, also MT_DEMO_ALLOW_LOCAL=1 in Tests). */
export function endpointFor(shop, version, allowLocal = false) {
  if (!/^\d{4}-\d{2}$/.test(String(version))) throw new UsageError('SHOPIFY_API_VERSION muss das Format JJJJ-MM haben (z. B. 2025-10).');
  const s = String(shop ?? '').trim().toLowerCase();
  if (/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(s)) return `https://${s}/admin/api/${version}/graphql.json`;
  if (allowLocal && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(s)) return `http://${s}/admin/api/${version}/graphql.json`;
  throw new UsageError('SHOPIFY_SHOP muss die Adresse <name>.myshopify.com sein.');
}

const sleepDefault = (ms) => new Promise((r) => setTimeout(r, ms));

export function createClient({ endpoint, token, fetchImpl = fetch, sleep = sleepDefault }) {
  async function gql(query, variables = {}) {
    for (let attempt = 0; ; attempt++) {
      const res = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
        body: JSON.stringify({ query, variables }),
      });
      if ((res.status === 429 || res.status >= 500) && attempt < 5) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      if (res.status === 401 || res.status === 403) throw new Error(`Zugriff abgelehnt (HTTP ${res.status}). Token und Berechtigungen prüfen.`);
      if (!res.ok) throw new Error(`HTTP ${res.status} von der Admin-API`);
      const json = await res.json();
      const throttled = json.errors?.some((e) => e.extensions?.code === 'THROTTLED');
      if (throttled && attempt < 5) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      if (json.errors?.length) throw new Error('GraphQL-Fehler: ' + json.errors.map((e) => e.message).join('; '));
      return json.data;
    }
  }
  return { gql };
}

function userErrors(payload, what) {
  const errs = payload?.userErrors ?? [];
  if (errs.length) throw new Error(`${what}: ` + errs.map((e) => `${(e.field ?? []).join('.')} ${e.message}`.trim()).join('; '));
}

const Q_TAGGED = `query($first:Int!,$after:String,$q:String!){
  products(first:$first, after:$after, query:$q){
    pageInfo{hasNextPage endCursor}
    nodes{id handle title tags vendor variants(first:50){pageInfo{hasNextPage} nodes{sku}}}
  }
}`;
const Q_BY_HANDLE = `query($h:String!){ productByIdentifier(identifier:{handle:$h}){ id handle tags } }`;
const Q_LOCATION = `query{ locations(first:1){ nodes{ id } } }`;
const M_STAGED = `mutation($input:[StagedUploadInput!]!){
  stagedUploadsCreate(input:$input){ stagedTargets{ url resourceUrl parameters{name value} } userErrors{field message} }
}`;
const M_SET = `mutation($input:ProductSetInput!){
  productSet(synchronous:true, input:$input){ product{ id handle } userErrors{field message} }
}`;
const M_DELETE = `mutation($input:ProductDeleteInput!){ productDelete(input:$input){ deletedProductId userErrors{field message} } }`;
const Q_COLLECTION = `query($h:String!){ collectionByIdentifier(identifier:{handle:$h}){ id handle marker: metafield(namespace:"mt_demo", key:"import"){ value } products(first:250){ pageInfo{hasNextPage} nodes{ tags vendor } } } }`;
const M_COLL_CREATE = `mutation($input:CollectionInput!){ collectionCreate(input:$input){ collection{ id handle } userErrors{field message} } }`;
const M_COLL_ADD = `mutation($id:ID!,$ids:[ID!]!){ collectionAddProducts(id:$id, productIds:$ids){ userErrors{field message} } }`;
const M_COLL_DELETE = `mutation($input:CollectionDeleteInput!){ collectionDelete(input:$input){ deletedCollectionId userErrors{field message} } }`;

async function listTagged(client) {
  const out = [];
  let after = null;
  for (;;) {
    const d = await client.gql(Q_TAGGED, { first: PAGE, after, q: `tag:${DEMO_TAG}` });
    out.push(...d.products.nodes);
    if (!d.products.pageInfo.hasNextPage) break;
    after = d.products.pageInfo.endCursor;
  }
  // Sicherheitsnetz: nur Produkte, die den Tag tatsächlich tragen
  return out.filter((p) => p.tags.includes(DEMO_TAG));
}

export async function loadData(dataPath) {
  const data = JSON.parse(await readFile(dataPath, 'utf8'));
  if (!Array.isArray(data.products) || !data.sku_prefix) throw new UsageError('Datensatz ungültig (products/sku_prefix fehlt).');
  if (data.sku_prefix !== SKU_PREFIX) throw new UsageError(`Datensatz ungültig (sku_prefix muss ${SKU_PREFIX} sein).`);
  for (const p of data.products) {
    for (const img of p.images ?? []) {
      if (typeof img !== 'string' || !/^images\/[a-z0-9._-]+\.jpg$/.test(img)) throw new UsageError(`Datensatz ungültig (Bildpfad nicht erlaubt): ${String(img).slice(0, 80)}`);
    }
  }
  return data;
}

async function uploadImage(client, dataDir, rel, deps) {
  const file = await readFile(join(dataDir, rel));
  const name = rel.split('/').pop();
  const mime = name.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const d = await client.gql(M_STAGED, { input: [{ filename: name, mimeType: mime, httpMethod: 'POST', resource: 'IMAGE', fileSize: String(file.length) }] });
  userErrors(d.stagedUploadsCreate, 'stagedUploadsCreate');
  const target = d.stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  for (const p of target.parameters) form.append(p.name, p.value);
  form.append('file', new Blob([file], { type: mime }), name);
  // Kein Token an den Upload-Host senden
  const res = await deps.fetchImpl(target.url, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Bild-Upload fehlgeschlagen (HTTP ${res.status}) für ${name}`);
  return target.resourceUrl;
}

function buildInput(p, category, locationId, fileSources) {
  const weight = p.weight ? { value: Number(p.weight), unit: 'KILOGRAMS' } : undefined;
  const inv = (sku, stock) => ({
    sku,
    inventoryItem: { sku, tracked: true, ...(weight ? { measurement: { weight } } : {}) },
    inventoryQuantities: locationId ? [{ locationId, name: 'available', quantity: Number(stock) }] : [],
  });
  const v = p.variations;
  const hasOptions = Boolean(v?.options?.length);
  const optionName = hasOptions ? v.attribute : 'Title';
  const optionValues = hasOptions ? v.options.map((o) => o.value) : ['Default Title'];
  const compare = p.compare_price ? { compareAtPrice: p.compare_price } : {};
  const variants = hasOptions
    ? v.options.map((o) => ({
        optionValues: [{ optionName, name: o.value }],
        price: o.price ?? p.price,
        ...compare,
        ...inv(o.sku, o.stock),
      }))
    : [{
        optionValues: [{ optionName, name: 'Default Title' }],
        price: p.price,
        ...compare,
        ...inv(p.sku, p.stock),
      }];
  return {
    title: p.title,
    handle: handleFor(p),
    descriptionHtml: descriptionHtml(p),
    vendor: DEMO_VENDOR,
    productType: category?.name ?? '',
    tags: [DEMO_TAG, p.category],
    status: 'ACTIVE',
    productOptions: [{ name: optionName, values: optionValues.map((name) => ({ name })) }],
    variants,
    metafields: p.delivery_time ? [{ namespace: 'mt_demo', key: 'delivery_time', type: 'single_line_text_field', value: p.delivery_time }] : [],
    files: fileSources.map((originalSource, i) => ({ originalSource, contentType: 'IMAGE', alt: `${p.title} (Bild ${i + 1})` })),
  };
}

export async function runImport({ client, data, dataDir, dryRun, log, deps }) {
  const existing = await listTagged(client);
  const knownHandles = new Set(existing.map((e) => e.handle));
  const knownSkus = new Set(existing.flatMap((e) => e.variants.nodes.map((v) => v.sku).filter(Boolean)));
  const loc = await client.gql(Q_LOCATION);
  const locationId = loc.locations.nodes[0]?.id ?? null;
  const cats = new Map((data.categories ?? []).map((c) => [c.slug, c]));
  const stats = { created: 0, skipped: 0, conflicts: 0 };
  const createdByCat = new Map();

  for (const p of data.products) {
    const handle = handleFor(p);
    const skus = p.variations?.options?.length ? p.variations.options.map((o) => o.sku) : [p.sku];
    if (knownHandles.has(handle) || skus.some((s) => knownSkus.has(s))) {
      log(`vorhanden, übersprungen: ${p.sku}`);
      stats.skipped++;
      continue;
    }
    const other = (await client.gql(Q_BY_HANDLE, { h: handle })).productByIdentifier;
    if (other) {
      log(`Handle ${handle} gehört zu einem anderen Produkt, übersprungen (wird nicht angefasst): ${p.sku}`);
      stats.conflicts++;
      continue;
    }
    if (dryRun) {
      log(`würde anlegen: ${p.sku} ${p.title}`);
      stats.created++;
      continue;
    }
    const sources = [];
    for (const rel of p.images ?? []) sources.push(await uploadImage(client, dataDir, rel, deps));
    const res = (await client.gql(M_SET, { input: buildInput(p, cats.get(p.category), locationId, sources) })).productSet;
    userErrors(res, `productSet ${p.sku}`);
    log(`angelegt: ${p.sku} ${p.title}`);
    stats.created++;
    if (!createdByCat.has(p.category)) createdByCat.set(p.category, []);
    createdByCat.get(p.category).push(res.product.id);
  }

  if (!dryRun) {
    for (const [slugName, ids] of createdByCat) {
      const cat = cats.get(slugName);
      const found = (await client.gql(Q_COLLECTION, { h: slugName })).collectionByIdentifier;
      let id = found?.id;
      if (!id) {
        const r = (await client.gql(M_COLL_CREATE, { input: { title: cat?.name ?? slugName, handle: slugName, descriptionHtml: cat ? `<p>${esc(cat.description)}</p>` : '', metafields: [{ namespace: 'mt_demo', key: 'import', type: 'single_line_text_field', value: '1' }] } })).collectionCreate;
        userErrors(r, `collectionCreate ${slugName}`);
        id = r.collection.id;
      }
      userErrors((await client.gql(M_COLL_ADD, { id, ids })).collectionAddProducts, `collectionAddProducts ${slugName}`);
    }
  }
  log(`${dryRun ? 'Probelauf: ' : ''}${stats.created} ${dryRun ? 'würden angelegt' : 'angelegt'}, ${stats.skipped} vorhanden, ${stats.conflicts} Handle-Konflikte.`);
  return stats;
}

export async function runRemove({ client, data, dryRun, yes, confirm, log }) {
  // Löschen nur mit Tag UND Anbieter UND Datensatz-Handle UND SKU-Präfix an allen Varianten
  const handles = new Set((data?.products ?? []).map(handleFor));
  const isDemo = (p) => p.tags.includes(DEMO_TAG)
    && p.vendor === DEMO_VENDOR
    && handles.has(p.handle)
    && !p.variants?.pageInfo?.hasNextPage
    && (p.variants?.nodes ?? []).length > 0
    && p.variants.nodes.every((v) => typeof v.sku === 'string' && v.sku.startsWith(SKU_PREFIX));
  const all = await listTagged(client);
  const tagged = all.filter(isDemo);
  const skipped = all.filter((p) => !isDemo(p));
  log(`${tagged.length} Demo-Produkt(e) mit Tag "${DEMO_TAG}" gefunden.`);
  for (const p of tagged) log(`  - ${p.handle}`);
  for (const p of skipped) log(`Übersprungen (Tag ${DEMO_TAG}, aber nicht aus dem Datensatz): ${p.handle}`);
  if (!tagged.length) return { deleted: 0, collections: 0, skipped: skipped.length };
  if (dryRun) {
    log('Probelauf: nichts wird gelöscht.');
    return { deleted: 0, collections: 0, skipped: skipped.length };
  }
  if (!yes && !(await confirm(`${tagged.length} Produkt(e) endgültig löschen? Zum Bestätigen "ja" eingeben: `))) {
    log('Abgebrochen, nichts gelöscht.');
    return { deleted: 0, collections: 0, aborted: true, skipped: skipped.length };
  }
  let deleted = 0;
  for (const p of tagged) {
    userErrors((await client.gql(M_DELETE, { input: { id: p.id } })).productDelete, `productDelete ${p.handle}`);
    deleted++;
  }
  // Demo-Kategorien nur löschen, wenn der Import sie angelegt hat (Marker mt_demo.import), sie leer sind
  // oder nur Demo-Produkte enthielten und die Produktliste vollständig geladen wurde
  let collections = 0;
  for (const c of data?.categories ?? []) {
    const col = (await client.gql(Q_COLLECTION, { h: c.slug })).collectionByIdentifier;
    if (!col) continue;
    if (col.marker?.value !== '1') {
      log(`Kategorie ${c.slug} stammt nicht vom Import und bleibt bestehen.`);
      continue;
    }
    if (col.products.pageInfo?.hasNextPage || col.products.nodes.some((n) => !n.tags.includes(DEMO_TAG) || n.vendor !== DEMO_VENDOR)) {
      log(`Kategorie ${c.slug} enthält andere Produkte und bleibt bestehen.`);
      continue;
    }
    userErrors((await client.gql(M_COLL_DELETE, { input: { id: col.id } })).collectionDelete, `collectionDelete ${c.slug}`);
    collections++;
  }
  log(`${deleted} Produkt(e) und ${collections} Kategorie(n) gelöscht.`);
  return { deleted, collections, skipped: skipped.length };
}

export function parseArgs(argv) {
  const opts = { cmd: null, dryRun: false, yes: false, data: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--yes') opts.yes = true;
    else if (a === '--data') opts.data = argv[++i];
    else if (!a.startsWith('--') && !opts.cmd) opts.cmd = a;
    else throw new UsageError(`Unbekannte Angabe: ${a}`);
  }
  if (!['import', 'remove'].includes(opts.cmd)) throw new UsageError('Aufruf: node demo-import.mjs <import|remove> [--dry-run] [--yes] [--data products.json]');
  return opts;
}

export async function main(argv, env, io = {}) {
  const log = io.log ?? ((m) => console.log(m));
  const deps = { fetchImpl: io.fetchImpl ?? fetch };
  const opts = parseArgs(argv);
  const token = env.SHOPIFY_ADMIN_TOKEN;
  if (!env.SHOPIFY_SHOP || !token) throw new UsageError('SHOPIFY_SHOP und SHOPIFY_ADMIN_TOKEN müssen als Umgebungsvariablen gesetzt sein.');
  const endpoint = endpointFor(env.SHOPIFY_SHOP, env.SHOPIFY_API_VERSION || DEFAULT_API_VERSION, env.MT_DEMO_ALLOW_LOCAL === '1');
  const here = dirname(fileURLToPath(import.meta.url));
  const dataPath = resolve(opts.data ?? join(here, 'products.json'));
  const data = await loadData(dataPath);
  const client = createClient({ endpoint, token, fetchImpl: deps.fetchImpl, sleep: io.sleep });
  if (opts.cmd === 'import') return runImport({ client, data, dataDir: dirname(dataPath), dryRun: opts.dryRun, log, deps });
  const confirm = io.confirm ?? (async (q) => {
    if (!process.stdin.isTTY) return false;
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try { return (await rl.question(q)).trim().toLowerCase() === 'ja'; } finally { rl.close(); }
  });
  return runRemove({ client, data, dryRun: opts.dryRun, yes: opts.yes, confirm, log });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2), process.env).catch((e) => {
    console.error(e instanceof UsageError ? e.message : `Fehler: ${e.message}`);
    process.exit(e instanceof UsageError ? 2 : 1);
  });
}
