# MichaThemeV5 für Shopify

Ein Theme für deinen Shopify-Shop von Michael Gahn DESIGN. Es hat einen Hell- und Dunkelmodus, viele Einstellungen und lokale Schriften (kein Google Fonts, kein CDN).

**Status: Entwurf (Pre-Alpha), Version 0.1.0.**
Das Theme ist noch nicht im Shopify Theme Store. Es ist nicht in einem echten Shop getestet und nicht mit dem offiziellen Werkzeug `shopify theme check` geprüft. Nutze es zum Ausprobieren, zum Beispiel in einem Entwicklungs-Shop. Nicht für einen Live-Shop mit echten Kunden.

## Was ist in diesem Repo?

| Ordner / Datei | Was ist das? |
|---|---|
| `theme/` | Das Shopify-Theme. Das lädst du in deinen Shop. |
| `michatheme-v5-app/` | Die Notification-App (Benachrichtigungen). Sie gehört zum Theme. |
| `release-manifest.json` | Sagt, welche Theme-Version zu welcher App-Version passt. |
| `scripts/` | Prüf- und Bau-Skripte für Entwickler. |

## Theme installieren (Schritt für Schritt)

1. Öffne die Seite [Releases](https://github.com/MichaelGahnDESIGN/MichaThemeV5_Shopify/releases).
2. Lade die Datei `MichaThemeV5_Shopify-0.1.0.zip` herunter. Entpacke sie nicht.
3. Lade zum Prüfen auch `MichaThemeV5_Shopify-0.1.0.zip.sha256` herunter. Auf dem Mac gibst du im Terminal `shasum -a 256 -c MichaThemeV5_Shopify-0.1.0.zip.sha256` ein. Es muss `OK` erscheinen.
4. Gehe in deinem Shopify-Admin zu **Onlineshop → Themes**.
5. Klicke auf **Theme hinzufügen → ZIP-Datei hochladen** und wähle die ZIP-Datei.
6. Warte, bis das Theme hochgeladen ist. Klicke dann auf **Anpassen**, um es zuerst anzusehen.
7. Wenn alles passt, klicke auf **Veröffentlichen**. Mach vorher eine Sicherung deines aktuellen Themes (**Duplizieren**).

Du kannst auch die Shopify CLI nutzen: `shopify theme push --path theme` (im Ordner dieses Repos).

## Notification-App installieren

Die Benachrichtigungs-Glocke braucht die App im Ordner `michatheme-v5-app/`. Ohne App zeigt die Glocke keine Meldungen an.

1. Installiere Node.js 20 oder neuer.
2. Öffne ein Terminal im Ordner `michatheme-v5-app/`.
3. Prüfe die App mit `npm test`.
4. Die App braucht einen eigenen Server mit einer Postgres-Datenbank. Das Datenbankschema steht in `michatheme-v5-app/database/schema.sql`.
5. Trage deine Shopify-Zugangsdaten als Umgebungsvariablen ein (`SHOPIFY_API_KEY`, `SHOPIFY_APP_URL`). Lege sie nie in dieses Repo.
6. Richte die App über die Shopify CLI ein (`shopify app deploy`). Der App-Proxy-Pfad muss `/apps/michatheme-notifications` sein.
7. Aktiviere die App **vor** dem Theme. Mehr dazu steht in `COMPATIBILITY.md`.

## Was fehlt noch? (ehrlich)

- Keine App-Oberfläche im Shopify-Admin. Es gibt nur die Schnittstelle `/admin/notifications`.
- Kein Installations- oder Anmeldeablauf (OAuth) in der App.
- Die Datenschutz-Auskunft (`customers/data_request`) liefert noch nichts zurück.
- Die App ist nicht bei Shopify eingereicht. Dieses Release ist keine App-Store-Einreichung.
- Die Glocke im Hauptmenü sitzt einfach unter der Kopfzeile. Das ist noch nicht schön gelöst.
- Die Pro-Funktionen sind nicht Teil dieses Repos. Dieses Repo enthält nur die kostenlosen Funktionen.
- Der Ordner `theme/` ist die Version 0.1.0. Der Generator der Plattform hat inzwischen neuere Funktionen (zum Beispiel mehr Startseiten-Bereiche). Sie kommen in einer späteren Version.

## Lizenz

Das Theme ist proprietär: Michael Gahn DESIGN behält alle Rechte (so steht es auch in `theme/layout/theme.liquid`). Dieses Repo hat bewusst keine Open-Source-Lizenzdatei, genauso wie die anderen MichaThemeV5-Theme-Repos. Die Schriften stehen unter der SIL Open Font License 1.1 (Texte in `theme/snippets/mt-font-licenses.liquid`).
Ob das später als eigene Lizenzdatei festgeschrieben wird, ist noch offen und muss rechtlich geprüft werden.

## Datenschutz der App

Die App speichert nur Shop-ID, Kunden-ID, Nachricht, Ereignisquelle und Lesestatus. Anfragen über den App-Proxy werden auf ihre Signatur geprüft. Webhooks werden am Rohtext mit HMAC geprüft. Doppelte Webhooks werden über `X-Shopify-Webhook-Id` erkannt.

## Für Entwickler

- Prüfen: `node scripts/check-release.mjs` (Ordner, JSON, Versionen, Zugangsdaten).
- ZIP bauen: `bash scripts/build-release.sh` (legt `dist/MichaThemeV5_Shopify-0.1.0.zip` und die `.sha256`-Datei an).
- Das ZIP enthält nur den Inhalt von `theme/`, direkt im ZIP-Stamm (so erwartet es Shopify).
- Jede Datei mit der Version muss gleich sein: `theme/config/settings_schema.json` (`theme_version`), `release-manifest.json`, `michatheme-v5-app/package.json`, dieses README und `CHANGELOG.md`.
- Das Theme wird in der privaten Plattform erzeugt. Änderungen am Generator gehören dorthin, nicht von Hand in `theme/`. Nur die Dateien der Notification-Glocke (`mgd-notification-center.*`, Layout-Zeilen, Einstellungsgruppe) werden in diesem Repo gepflegt.
