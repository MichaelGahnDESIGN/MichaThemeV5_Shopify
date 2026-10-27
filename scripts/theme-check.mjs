// Offizielles Theme Check von Shopify (offline, ohne Login und ohne Shop)
// Aufruf: npm install --no-save --no-package-lock @shopify/theme-check-node@3.31.0 && node scripts/theme-check.mjs
// Exit 1 bei Fehlern oder Warnungen, Hinweise (INFO) werden nur gezeigt
import { themeCheckRun } from '@shopify/theme-check-node';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const theme = join(root, 'theme');
const labels = ['FEHLER', 'WARNUNG', 'HINWEIS'];

const run = await themeCheckRun(theme);
for (const o of run.offenses) {
  const file = relative(theme, fileURLToPath(o.uri));
  console.log(`${labels[o.severity]}: ${file}:${o.start.line + 1} ${o.check} - ${o.message}`);
}
const bad = run.offenses.filter((o) => o.severity <= 1).length;
console.log(`Theme Check: ${run.theme.length} Dateien, ${run.offenses.length} Meldungen (${bad} Fehler/Warnungen)`);
process.exit(bad > 0 ? 1 : 0);
