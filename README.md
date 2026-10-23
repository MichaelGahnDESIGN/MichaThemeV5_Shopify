# MichaThemeV5 Shopify

Jede Shopify-Auslieferung enthält zwei zwingend zusammengehörige Teile: `theme/` für die sichtbare Glocke und `michatheme-v5-app/` für Administration, persönliche Meldungen, Datenhaltung und signierte Shopify-Ereignisse. Die App ist kein optionales Zusatzmodul.

`release-manifest.json` koppelt Theme und App. Vor einer Veröffentlichung müssen die Kompatibilitätsversionen übereinstimmen. Eine Veröffentlichung oder Installation bei Shopify ist nicht Bestandteil dieses Repository-Standes.

Die App speichert nur Shop-ID, Kunden-ID, Nachricht, Ereignisquelle und Lesestatus. App-Proxy-Anfragen werden signaturgeprüft; Webhooks werden am Rohbody HMAC-geprüft und über `X-Shopify-Webhook-Id` dedupliziert.
