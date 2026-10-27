// Prüft das Repo vor einem Release: Struktur, JSON, Versionen, Secrets
// Aufruf: node scripts/check-release.mjs   (Exit 1 = Fehler)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const fail = (msg) => errors.push(msg);

// alle Dateien unter einem Ordner (ohne .git, node_modules)
const walk = (dir) => readdirSync(dir).flatMap((name) => {
  if (name === '.git' || name === 'node_modules' || name === 'dist') return [];
  const full = join(dir, name);
  return statSync(full).isDirectory() ? walk(full) : [full];
});

const readJson = (file) => {
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch (e) { fail(`${relative(root, file)}: kein gültiges JSON (${e.message})`); return null; }
};

// Pflichtordner Shopify Theme
const theme = join(root, 'theme');
for (const dir of ['assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates']) {
  if (!existsSync(join(theme, dir))) fail(`theme/${dir} fehlt`);
}
for (const file of ['layout/theme.liquid', 'config/settings_schema.json', 'config/settings_data.json', 'locales/de.default.json']) {
  if (!existsSync(join(theme, file))) fail(`theme/${file} fehlt`);
}

// Lizenzdatei
if (!existsSync(join(root, 'LICENSE'))) fail('LICENSE fehlt');

// JSON-Dateien
const files = walk(root);
for (const file of files.filter((f) => f.endsWith('.json'))) readJson(file);

// Versionen müssen überall gleich sein
const manifest = readJson(join(root, 'release-manifest.json'));
const schema = readJson(join(theme, 'config/settings_schema.json'));
const pkg = readJson(join(root, 'michatheme-v5-app/package.json'));
const info = Array.isArray(schema) ? schema.find((g) => g.name === 'theme_info') : null;
const themeVersion = info?.theme_version;
if (!themeVersion) fail('theme_info.theme_version in settings_schema.json fehlt');
if (manifest) {
  if (manifest.release !== themeVersion) fail(`release-manifest release ${manifest.release} != theme ${themeVersion}`);
  if (manifest.theme?.version !== themeVersion) fail(`release-manifest theme.version ${manifest.theme?.version} != theme ${themeVersion}`);
  if (manifest.app?.version !== pkg?.version) fail(`release-manifest app.version ${manifest.app?.version} != package.json ${pkg?.version}`);
  if (manifest.app?.requiresTheme !== themeVersion) fail(`release-manifest app.requiresTheme ${manifest.app?.requiresTheme} != theme ${themeVersion}`);
  if (manifest.theme?.requiresAppApi !== manifest.app?.apiVersion) fail('requiresAppApi und apiVersion passen nicht zusammen');
}
for (const doc of ['README.md', 'CHANGELOG.md']) {
  const text = existsSync(join(root, doc)) ? readFileSync(join(root, doc), 'utf8') : '';
  if (!text.includes(themeVersion ?? '?')) fail(`${doc} nennt die Version ${themeVersion} nicht`);
}

// Secrets + Dateien, die nie rein dürfen
const forbidden = /(^|\/)(\.env(\..*)?|.*\.pem|.*\.key|.*\.p12|id_(rsa|ed25519).*)$/;
const patterns = [
  [/sk_(live|test)_[0-9A-Za-z]{10,}/, 'Stripe Key'],
  [/gh[pousr]_[0-9A-Za-z]{30,}/, 'GitHub Token'],
  [/shp(at|ss|ca|pa)_[0-9a-f]{20,}/i, 'Shopify Token'],
  [/AKIA[0-9A-Z]{16}/, 'AWS Key'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'Private Key'],
];
for (const file of files) {
  const rel = relative(root, file);
  if (forbidden.test(rel)) fail(`${rel}: Datei gehört nicht ins Repo`);
  if (/\.(woff2|png|jpg|jpeg|gif|webp|zip)$/i.test(file)) continue;
  const text = readFileSync(file, 'utf8');
  for (const [re, label] of patterns) if (re.test(text)) fail(`${rel}: sieht nach ${label} aus`);
}

if (errors.length) {
  for (const e of errors) console.error(`FEHLER: ${e}`);
  process.exit(1);
}
console.log(`OK: Version ${themeVersion} überall gleich, ${files.length} Dateien geprüft`);
