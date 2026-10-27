#!/usr/bin/env bash
# Baut das Theme-ZIP für Shopify > dist/MichaThemeV5_Shopify-<Version>.zip + .sha256
# Nur der Inhalt von theme/ (layout, sections ... direkt im ZIP-Stamm), ohne App und Dev-Dateien
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
node "$ROOT/scripts/check-release.mjs"

VERSION="$(node -e "console.log(JSON.parse(require('fs').readFileSync('$ROOT/release-manifest.json','utf8')).theme.version)")"
NAME="MichaThemeV5_Shopify-$VERSION.zip"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Kopie mit festem Datum, damit das ZIP bei gleichem Inhalt gleich bleibt
cp -R "$ROOT/theme/." "$TMP/"
find "$TMP" -name '.DS_Store' -delete
find "$TMP" -exec touch -t 202610220000 {} +

mkdir -p "$ROOT/dist"
rm -f "$ROOT/dist/$NAME" "$ROOT/dist/$NAME.sha256"
(cd "$TMP" && find . -type f | LC_ALL=C sort | sed 's|^\./||' | zip -X -q "$ROOT/dist/$NAME" -@)
(cd "$ROOT/dist" && shasum -a 256 "$NAME" > "$NAME.sha256")

echo "Fertig: dist/$NAME"
cat "$ROOT/dist/$NAME.sha256"
