# Demo-Artikel in Shopify importieren und entfernen

Shopify-Themes können selbst keine Produkte anlegen. Dieses Skript legt über die Admin-API 16 Beispielartikel in 4 Kategorien an (je 3 Bilder, Preise, Streichpreise, SKU, Bestand, Lieferzeit, Eigenschaften). Alle Demo-Produkte tragen den Tag `mt-demo`, ihr Handle beginnt mit `mtdemo-`, die SKUs mit `MTDEMO-`.

Voraussetzung: Node.js ab Version 20. Das Skript liegt im Ordner `demo-import/` zusammen mit `products.json` und `images/`. Es gehört nicht zum Theme-Upload.

## 1. Zugang einrichten

Im Shopify-Admin: Einstellungen > Apps und Vertriebskanäle > Apps entwickeln > App erstellen. Unter "Admin-API-Zugriffsbereiche" nur diese Rechte aktivieren:

- `write_products` (Produkte, Kategorien, Bestand)
- `write_files` (Bilder hochladen)

Zusätzlich lesend nötig sind `read_products`, `read_files` und `read_inventory` (meist durch die Schreibrechte abgedeckt). App installieren und den Admin-API-Zugriffstoken kopieren. Der Token wird nur einmal angezeigt.

Zugangsdaten nur als Umgebungsvariablen setzen, nie in Dateien speichern:

```
export SHOPIFY_SHOP="mein-shop.myshopify.com"
export SHOPIFY_ADMIN_TOKEN="..."
```

Optional: `SHOPIFY_API_VERSION` (Standard 2025-10).

## 2. Importieren

```
node demo-import.mjs import --dry-run    # Probelauf, legt nichts an
node demo-import.mjs import
```

Der Import ist wiederholbar: Vorhandene Demo-Produkte (erkannt an Tag, Handle und SKU) werden übersprungen. Ein fremdes Produkt mit gleichem Handle wird nie verändert.

Hinweis: Neu angelegte Produkte sind aktiv, aber nicht automatisch im Vertriebskanal "Online Store" verfügbar. Im Admin unter Produkte alle Demo-Produkte (Filter Tag `mt-demo`) auswählen und den Vertriebskanal aktivieren.

## 3. Entfernen

```
node demo-import.mjs remove --dry-run    # zeigt nur die Anzahl
node demo-import.mjs remove              # fragt nach, "ja" tippen
node demo-import.mjs remove --yes        # ohne Rückfrage
```

Gelöscht werden ausschließlich Produkte mit dem Tag `mt-demo` sowie die Demo-Kategorien (Handle `mtdemo-...`), sofern darin keine anderen Produkte liegen. Vorher wird die Anzahl angezeigt. Echte Produkte bleiben unberührt.

## Sicherheit

- Der Token wird nur an die Shopify-Admin-API gesendet, nicht an den Bild-Upload, und nie ausgegeben.
- Nach dem Einrichten die Custom-App löschen oder den Token zurücksetzen, wenn der Import fertig ist.
